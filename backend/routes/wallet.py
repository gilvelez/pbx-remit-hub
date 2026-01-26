"""
Wallet routes - mirrors Netlify functions for local development
Endpoints: /api/wallet/balance, /api/fx/quote, /api/fx/convert
"""
from fastapi import APIRouter, HTTPException, Header, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional
import os
import httpx
import jwt
from datetime import datetime, timezone

from database.connection import get_database

router = APIRouter(prefix="/api")

# FX rate source
OPENEXCHANGERATES_API_KEY = os.environ.get("OPENEXCHANGERATES_API_KEY")
FALLBACK_USD_PHP_RATE = 56.10  # Fallback if API unavailable

# JWT Configuration (match auth.py)
JWT_SECRET = os.environ.get("JWT_SECRET", "pbx-secret-key-change-in-production")
JWT_ALGORITHM = "HS256"

security = HTTPBearer(auto_error=False)


def decode_jwt_token(token: str) -> Optional[dict]:
    """Decode and verify JWT token"""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


async def require_session(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    authorization: Optional[str] = Header(None),
    x_session_token: Optional[str] = Header(None, alias="X-Session-Token")
):
    """
    Validate session - supports both JWT and legacy session tokens.
    Returns dict with userId and email.
    """
    token = None
    
    # Try Bearer token first
    if credentials:
        token = credentials.credentials
    elif authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ", 1)[1]
    elif x_session_token:
        token = x_session_token
    
    if not token:
        raise HTTPException(status_code=401, detail="Missing session token")
    
    # Try JWT decode first
    payload = decode_jwt_token(token)
    if payload:
        return {
            "userId": payload.get("user_id"),
            "email": payload.get("email"),
        }
    
    # Fallback to session lookup (Netlify function style)
    db = get_database()
    session = await db.sessions.find_one({"token": token})
    if session:
        return {
            "userId": session.get("userId") or session.get("user_id"),
            "email": session.get("email"),
        }
    
    raise HTTPException(status_code=401, detail="Invalid session")


@router.get("/wallet/balance")
async def get_wallet_balance(session: dict = Depends(require_session)):
    """Get wallet balances for authenticated user"""
    db = get_database()
    user_id = session["userId"]
    
    # Try both userId formats (Netlify uses userId, FastAPI uses user_id)
    wallet = await db.wallets.find_one({"userId": user_id})
    if not wallet:
        wallet = await db.wallets.find_one({"user_id": user_id})
    
    if not wallet:
        # Create default wallet with demo amounts
        wallet = {
            "userId": user_id,
            "user_id": user_id,  # Store both for compatibility
            "usd": 500,
            "php": 28060,
            "usdc": 0,
            "demoSeeded": True,
            "createdAt": datetime.now(timezone.utc),
            "updatedAt": datetime.now(timezone.utc),
        }
        await db.wallets.insert_one(wallet)
    
    return {
        "usd": float(wallet.get("usd", 0)),
        "php": float(wallet.get("php", 0)),
        "usdc": float(wallet.get("usdc", 0)),
        "circleWallet": wallet.get("circleWallet"),
    }


async def get_fx_rate(from_currency: str = "USD", to_currency: str = "PHP") -> float:
    """Fetch live FX rate from OpenExchangeRates or use fallback"""
    if OPENEXCHANGERATES_API_KEY:
        try:
            async with httpx.AsyncClient() as client:
                res = await client.get(
                    f"https://openexchangerates.org/api/latest.json?app_id={OPENEXCHANGERATES_API_KEY}&base=USD",
                    timeout=5.0
                )
                if res.status_code == 200:
                    data = res.json()
                    return float(data.get("rates", {}).get(to_currency, FALLBACK_USD_PHP_RATE))
        except Exception:
            pass
    return FALLBACK_USD_PHP_RATE


@router.get("/fx/quote")
async def get_fx_quote(
    amount: float,
    session: dict = Depends(require_session),
    from_currency: str = "USD",
    to_currency: str = "PHP"
):
    """Get FX quote for currency conversion"""
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than 0")
    
    rate = await get_fx_rate(from_currency, to_currency)
    converted = round(amount * rate, 2)
    
    return {
        "from": from_currency,
        "to": to_currency,
        "amount": amount,
        "rate": rate,
        "converted": converted,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


class FxConvertRequest(BaseModel):
    amount: float
    from_currency: str = "USD"
    to_currency: str = "PHP"


@router.post("/fx/convert")
async def convert_currency(
    request: FxConvertRequest,
    session: dict = Depends(require_session)
):
    """Convert currency and update wallet balances"""
    db = get_database()
    user_id = session["userId"]
    
    if request.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than 0")
    
    # Get wallet (try both userId formats)
    wallet = await db.wallets.find_one({"userId": user_id})
    if not wallet:
        wallet = await db.wallets.find_one({"user_id": user_id})
    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")
    
    # Validate sufficient balance
    from_field = request.from_currency.lower()
    to_field = request.to_currency.lower()
    
    current_balance = float(wallet.get(from_field, 0))
    if current_balance < request.amount:
        raise HTTPException(
            status_code=400, 
            detail=f"Insufficient {request.from_currency} balance. Available: {current_balance}"
        )
    
    # Get FX rate
    rate = await get_fx_rate(request.from_currency, request.to_currency)
    converted = round(request.amount * rate, 2)
    
    # Update wallet
    new_from_balance = round(current_balance - request.amount, 2)
    new_to_balance = round(float(wallet.get(to_field, 0)) + converted, 2)
    
    # Update using the field that exists in wallet
    wallet_filter = {"userId": user_id} if "userId" in wallet else {"user_id": user_id}
    
    await db.wallets.update_one(
        wallet_filter,
        {
            "$set": {
                from_field: new_from_balance,
                to_field: new_to_balance,
                "updatedAt": datetime.now(timezone.utc),
            }
        }
    )
    
    # Log transaction
    await db.transactions.insert_one({
        "userId": user_id,
        "type": "conversion",
        "from": request.from_currency,
        "to": request.to_currency,
        "amount_from": request.amount,
        "amount_to": converted,
        "rate": rate,
        "createdAt": datetime.now(timezone.utc),
    })
    
    return {
        "success": True,
        "converted": converted,
        "rate": rate,
        "new_balances": {
            from_field: new_from_balance,
            to_field: new_to_balance,
        }
    }
