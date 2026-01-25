"""
Circle USDC Integration Routes
Handles wallet creation, USDC minting, and balance queries
"""
from fastapi import APIRouter, HTTPException, Header, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
import uuid
import logging

from database.connection import get_database
from utils.circle_client import circle_client
from routes.auth import decode_jwt_token

router = APIRouter(prefix="/api/circle", tags=["circle"])
logger = logging.getLogger(__name__)
security = HTTPBearer(auto_error=False)


class CreateWalletRequest(BaseModel):
    blockchain: str = "MATIC-AMOY"


class MintUSDCRequest(BaseModel):
    amount: float = Field(..., gt=0, le=10000, description="Amount in USD to mint as USDC")


class CreateWalletResponse(BaseModel):
    success: bool
    wallet_id: str
    address: str
    blockchain: str
    message: str


class MintUSDCResponse(BaseModel):
    success: bool
    transaction_id: str
    amount_usd: float
    amount_usdc: float
    new_balance_usd: float
    new_balance_usdc: float
    message: str


class BalanceResponse(BaseModel):
    usd: float
    usdc: float
    php: float
    circle_wallet: Optional[dict] = None


async def get_user_from_token(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    authorization: Optional[str] = Header(None),
    x_session_token: Optional[str] = Header(None),
) -> dict:
    """Extract user from JWT token or legacy session token"""
    token = None
    
    # Try Bearer token first
    if credentials:
        token = credentials.credentials
    elif authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ", 1)[1]
    elif x_session_token:
        token = x_session_token
    
    if not token:
        raise HTTPException(status_code=401, detail="Missing authentication token")
    
    # Try JWT decode first
    payload = decode_jwt_token(token)
    if payload:
        return {
            "user_id": payload.get("user_id"),
            "email": payload.get("email"),
        }
    
    # Fallback to session lookup
    db = get_database()
    session = await db.sessions.find_one({"token": token})
    
    if not session:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    user_id = session.get("user_id") or session.get("userId")
    email = session.get("email", "")
    
    return {"user_id": user_id, "email": email}


@router.post("/create-wallet", response_model=CreateWalletResponse)
async def create_circle_wallet(
    request: CreateWalletRequest,
    user: dict = Depends(get_user_from_token)
):
    """
    Create a Circle USDC wallet for the user.
    This is automatically called on first Add Money action.
    """
    user_id = user["user_id"]
    
    db = get_database()
    wallets = db.wallets
    
    # Check if user already has a Circle wallet
    existing = await wallets.find_one({"user_id": user_id})
    if existing and existing.get("circle_wallet", {}).get("wallet_id"):
        return CreateWalletResponse(
            success=True,
            wallet_id=existing["circle_wallet"]["wallet_id"],
            address=existing["circle_wallet"]["address"],
            blockchain=existing["circle_wallet"].get("blockchain", "MATIC-AMOY"),
            message="Wallet already exists"
        )
    
    try:
        # Create Circle wallet
        wallet_data = await circle_client.create_wallet(
            user_id=user_id,
            blockchain=request.blockchain
        )
        
        circle_wallet = {
            "wallet_id": wallet_data["wallet_id"],
            "address": wallet_data["address"],
            "blockchain": wallet_data["blockchain"],
            "account_type": wallet_data.get("account_type", "EOA"),
            "state": wallet_data.get("state", "LIVE"),
            "created_at": datetime.utcnow()
        }
        
        # Store in database
        await wallets.update_one(
            {"user_id": user_id},
            {
                "$set": {
                    "circle_wallet": circle_wallet,
                    "updated_at": datetime.utcnow()
                },
                "$setOnInsert": {
                    "user_id": user_id,
                    "usd": 0,
                    "usdc": 0,
                    "php": 0,
                    "created_at": datetime.utcnow()
                }
            },
            upsert=True
        )
        
        logger.info(f"[CIRCLE] Created wallet for user {user_id}: {wallet_data['wallet_id']}")
        
        return CreateWalletResponse(
            success=True,
            wallet_id=wallet_data["wallet_id"],
            address=wallet_data["address"],
            blockchain=wallet_data["blockchain"],
            message="Wallet created successfully"
        )
        
    except Exception as e:
        logger.error(f"[CIRCLE] create_wallet error for {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create wallet: {str(e)}")


@router.post("/mint-usdc", response_model=MintUSDCResponse)
async def mint_usdc(
    request: MintUSDCRequest,
    user: dict = Depends(get_user_from_token)
):
    """
    Add money to wallet by minting USDC (1:1 with USD).
    Creates wallet if user doesn't have one.
    User only sees USD amounts - USDC is hidden implementation detail.
    """
    user_id = user["user_id"]
    
    db = get_database()
    wallets = db.wallets
    transactions = db.transactions
    
    # Get or create Circle wallet
    wallet_doc = await wallets.find_one({"user_id": user_id})
    
    if not wallet_doc or not wallet_doc.get("circle_wallet", {}).get("wallet_id"):
        # Create wallet first
        wallet_data = await circle_client.create_wallet(
            user_id=user_id,
            blockchain="MATIC-AMOY"
        )
        
        circle_wallet = {
            "wallet_id": wallet_data["wallet_id"],
            "address": wallet_data["address"],
            "blockchain": wallet_data["blockchain"],
            "account_type": wallet_data.get("account_type", "EOA"),
            "state": "LIVE",
            "created_at": datetime.utcnow()
        }
        
        await wallets.update_one(
            {"user_id": user_id},
            {
                "$set": {
                    "circle_wallet": circle_wallet,
                    "updated_at": datetime.utcnow()
                },
                "$setOnInsert": {
                    "user_id": user_id,
                    "usd": 0,
                    "usdc": 0,
                    "php": 0,
                    "created_at": datetime.utcnow()
                }
            },
            upsert=True
        )
        wallet_doc = await wallets.find_one({"user_id": user_id})
    
    circle_wallet = wallet_doc.get("circle_wallet", {})
    wallet_id = circle_wallet.get("wallet_id")
    wallet_address = circle_wallet.get("address")
    
    # Generate transaction ID
    transaction_id = f"txn_{uuid.uuid4().hex[:16]}"
    
    try:
        # Mint USDC (1:1 with USD)
        mint_result = await circle_client.mint_usdc(
            wallet_id=wallet_id,
            address=wallet_address,
            amount=request.amount,
            idempotency_key=transaction_id
        )
        
        # Update wallet balances (both USD and USDC increase together)
        updated_wallet = await wallets.find_one_and_update(
            {"user_id": user_id},
            {
                "$inc": {
                    "usd": request.amount,
                    "usdc": request.amount
                },
                "$set": {"updated_at": datetime.utcnow()}
            },
            return_document=True
        )
        
        # Record transaction
        await transactions.insert_one({
            "transaction_id": transaction_id,
            "user_id": user_id,
            "type": "add_money",
            "amount_usd": request.amount,
            "amount_usdc": request.amount,
            "circle_tx_id": mint_result.get("transaction_id"),
            "status": mint_result.get("status", "confirmed"),
            "mock": mint_result.get("mock", False),
            "created_at": datetime.utcnow()
        })
        
        new_usd = updated_wallet.get("usd", request.amount)
        new_usdc = updated_wallet.get("usdc", request.amount)
        
        logger.info(f"[CIRCLE] Minted ${request.amount} USDC for user {user_id}")
        
        return MintUSDCResponse(
            success=True,
            transaction_id=transaction_id,
            amount_usd=request.amount,
            amount_usdc=request.amount,
            new_balance_usd=new_usd,
            new_balance_usdc=new_usdc,
            message=f"Successfully added ${request.amount:.2f} to your wallet"
        )
        
    except Exception as e:
        logger.error(f"[CIRCLE] mint_usdc error for {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to add money: {str(e)}")


@router.get("/balance", response_model=BalanceResponse)
async def get_circle_balance(
    user: dict = Depends(get_user_from_token)
):
    """
    Get user's wallet balance.
    Returns USD balance (USDC is hidden from user).
    """
    user_id = user["user_id"]
    
    db = get_database()
    wallet = await db.wallets.find_one({"user_id": user_id})
    
    if not wallet:
        return BalanceResponse(
            usd=0,
            usdc=0,
            php=0,
            circle_wallet=None
        )
    
    # Optionally sync with Circle (in production)
    circle_wallet = wallet.get("circle_wallet")
    if circle_wallet and circle_wallet.get("wallet_id") and circle_client.enabled:
        try:
            # Get real-time balance from Circle
            balance_data = await circle_client.get_wallet_balance(
                circle_wallet["wallet_id"]
            )
            # Could sync USDC balance here
        except Exception as e:
            logger.warning(f"[CIRCLE] Failed to sync balance: {str(e)}")
    
    return BalanceResponse(
        usd=wallet.get("usd", 0),
        usdc=wallet.get("usdc", 0),
        php=wallet.get("php", 0),
        circle_wallet={
            "wallet_id": circle_wallet.get("wallet_id") if circle_wallet else None,
            "address": circle_wallet.get("address") if circle_wallet else None,
            "blockchain": circle_wallet.get("blockchain") if circle_wallet else None,
        } if circle_wallet else None
    )


@router.get("/status")
async def get_circle_status():
    """Check Circle integration status"""
    return {
        "enabled": circle_client.enabled,
        "environment": "sandbox" if not circle_client.enabled else "live",
        "mock_mode": not circle_client.enabled,
        "message": "Circle integration active" if circle_client.enabled else "Running in mock mode (no API key)"
    }
