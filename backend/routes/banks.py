"""
PBX Bank Management Routes - Link/Unlink banks, Add Money, Withdraw
Phase 4: Bank Management Backend

Endpoints:
- GET /api/banks/linked - Get user's linked bank accounts
- POST /api/banks/link - Link a new bank via Plaid public token
- DELETE /api/banks/{bank_id} - Unlink a bank account
- POST /api/banks/add-money - Initiate ACH pull (add money to PBX)
- POST /api/banks/withdraw - Initiate ACH push (withdraw from PBX)

NOTE: This is a stub implementation. Real ACH integration requires:
- Plaid Auth for account verification
- Plaid Transfer or direct ACH rails
- Proper fund settlement timing
"""

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timezone
import uuid
import logging

from database.connection import get_database

router = APIRouter(prefix="/api/banks", tags=["banks"])
logger = logging.getLogger(__name__)


def utc_now():
    return datetime.now(timezone.utc)


def get_user_id_from_headers(request: Request) -> str:
    return request.headers.get("X-Session-Token", "")


# ============================================================
# Data Models
# ============================================================

class PlaidAccount(BaseModel):
    id: str
    name: str
    mask: str
    type: str
    subtype: Optional[str] = None


class LinkBankRequest(BaseModel):
    public_token: str
    institution_id: Optional[str] = None
    institution_name: Optional[str] = None
    accounts: Optional[List[PlaidAccount]] = None


class AddMoneyRequest(BaseModel):
    amount: float = Field(..., gt=0, le=10000)
    bank_id: str


class WithdrawRequest(BaseModel):
    amount: float = Field(..., gt=0)
    bank_id: str


# ============================================================
# Bank Management Endpoints
# ============================================================

@router.get("/linked")
async def get_linked_banks(request: Request):
    """
    Get all linked bank accounts for the current user.
    Returns bank metadata only - no credentials.
    """
    user_id = get_user_id_from_headers(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    db = get_database()
    linked_banks = db.linked_banks
    
    cursor = linked_banks.find(
        {"user_id": user_id, "status": {"$ne": "removed"}},
        {"_id": 0, "access_token": 0}  # Never expose access token
    )
    banks = await cursor.to_list(20)
    
    return {"banks": banks}


@router.post("/link")
async def link_bank(request: Request, data: LinkBankRequest):
    """
    Link a new bank account using Plaid public token.
    
    Flow:
    1. Exchange public_token for access_token (via Plaid API)
    2. Get account info
    3. Store bank metadata (NOT credentials)
    
    NOTE: This is a mock implementation. Real implementation requires
    Plaid Exchange endpoint and proper token handling.
    """
    user_id = get_user_id_from_headers(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    db = get_database()
    linked_banks = db.linked_banks
    
    now = utc_now()
    bank_id = f"bank_{uuid.uuid4().hex[:12]}"
    
    # Get first account from Plaid response (or create mock)
    account = data.accounts[0] if data.accounts else PlaidAccount(
        id=f"acc_{uuid.uuid4().hex[:8]}",
        name="Checking",
        mask="1234",
        type="depository",
        subtype="checking"
    )
    
    # Create bank record
    bank_doc = {
        "id": bank_id,
        "user_id": user_id,
        "institution_id": data.institution_id or "mock_institution",
        "institution_name": data.institution_name or "Test Bank",
        "account_id": account.id,
        "account_type": account.subtype or account.type or "Checking",
        "last4": account.mask or "****",
        "status": "verified",  # In production, may need verification
        "linked_at": now,
        "last_used_at": None,
        # In production: store encrypted access_token
        # "access_token": encrypted_access_token,
    }
    
    await linked_banks.insert_one(bank_doc)
    
    # Remove _id before returning
    bank_doc.pop("_id", None)
    
    logger.info(f"Bank linked: {bank_id} for user {user_id}")
    
    return {
        "success": True,
        "bank_id": bank_id,
        "bank": bank_doc
    }


@router.delete("/{bank_id}")
async def unlink_bank(request: Request, bank_id: str):
    """
    Remove/unlink a bank account.
    Soft delete - marks as removed but retains for audit.
    """
    user_id = get_user_id_from_headers(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    db = get_database()
    linked_banks = db.linked_banks
    
    now = utc_now()
    
    # Verify bank belongs to user
    bank = await linked_banks.find_one({"id": bank_id, "user_id": user_id})
    if not bank:
        raise HTTPException(status_code=404, detail="Bank account not found")
    
    # Soft delete
    await linked_banks.update_one(
        {"id": bank_id},
        {"$set": {"status": "removed", "removed_at": now}}
    )
    
    logger.info(f"Bank unlinked: {bank_id} for user {user_id}")
    
    return {"success": True, "message": "Bank account removed"}


# ============================================================
# Funding Endpoints (Stub - requires real ACH integration)
# ============================================================

@router.post("/add-money")
async def add_money(request: Request, data: AddMoneyRequest):
    """
    Initiate ACH pull to add money from bank to PBX wallet.
    
    TODO: Implement actual ACH transfer:
    - Use Plaid Transfer API or
    - Integrate with banking partner ACH rails
    - Handle settlement timing (1-3 business days)
    - Implement proper error handling and retries
    """
    user_id = get_user_id_from_headers(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    db = get_database()
    linked_banks = db.linked_banks
    pending_transfers = db.pending_transfers
    
    now = utc_now()
    
    # Verify bank belongs to user and is active
    bank = await linked_banks.find_one({
        "id": data.bank_id,
        "user_id": user_id,
        "status": "verified"
    })
    
    if not bank:
        raise HTTPException(status_code=404, detail="Bank account not found or not verified")
    
    # Create pending transfer record
    transfer_id = f"ach_in_{uuid.uuid4().hex[:12]}"
    transfer_doc = {
        "transfer_id": transfer_id,
        "user_id": user_id,
        "type": "ach_pull",  # Pull money from bank
        "direction": "in",
        "amount": data.amount,
        "currency": "USD",
        "bank_id": data.bank_id,
        "bank_name": bank.get("institution_name"),
        "bank_last4": bank.get("last4"),
        "status": "pending",
        "created_at": now,
        "estimated_arrival": "1-3 business days",
        # TODO: Add settlement_date, ach_trace_number, etc.
    }
    
    await pending_transfers.insert_one(transfer_doc)
    
    # Update bank last_used_at
    await linked_banks.update_one(
        {"id": data.bank_id},
        {"$set": {"last_used_at": now}}
    )
    
    logger.info(f"Add money initiated: {transfer_id} for user {user_id}, amount: ${data.amount}")
    
    # NOTE: In production, this would:
    # 1. Call Plaid Transfer API or bank partner API
    # 2. Wait for webhook/callback for settlement
    # 3. Credit wallet only after funds clear
    
    return {
        "success": True,
        "transfer_id": transfer_id,
        "status": "pending",
        "amount": data.amount,
        "estimated_arrival": "1-3 business days",
        "message": "Transfer initiated. Funds will be available in 1-3 business days."
    }


@router.post("/withdraw")
async def withdraw(request: Request, data: WithdrawRequest):
    """
    Initiate ACH push to withdraw from PBX wallet to bank.
    
    TODO: Implement actual ACH transfer:
    - Verify sufficient balance
    - Use Plaid Transfer API or banking partner
    - Handle settlement timing
    - Implement proper error handling
    """
    user_id = get_user_id_from_headers(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    db = get_database()
    linked_banks = db.linked_banks
    wallets = db.wallets
    pending_transfers = db.pending_transfers
    
    now = utc_now()
    
    # Verify bank belongs to user and is active
    bank = await linked_banks.find_one({
        "id": data.bank_id,
        "user_id": user_id,
        "status": "verified"
    })
    
    if not bank:
        raise HTTPException(status_code=404, detail="Bank account not found or not verified")
    
    # Check wallet balance
    wallet = await wallets.find_one({"user_id": user_id})
    if not wallet:
        raise HTTPException(status_code=400, detail="Wallet not found")
    
    available_balance = wallet.get("usd_balance", 0)
    if data.amount > available_balance:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient balance. Available: ${available_balance:.2f}"
        )
    
    # Create pending transfer record
    transfer_id = f"ach_out_{uuid.uuid4().hex[:12]}"
    transfer_doc = {
        "transfer_id": transfer_id,
        "user_id": user_id,
        "type": "ach_push",  # Push money to bank
        "direction": "out",
        "amount": data.amount,
        "currency": "USD",
        "bank_id": data.bank_id,
        "bank_name": bank.get("institution_name"),
        "bank_last4": bank.get("last4"),
        "status": "pending",
        "created_at": now,
        "estimated_arrival": "1-3 business days",
    }
    
    await pending_transfers.insert_one(transfer_doc)
    
    # Reserve funds (hold in wallet until ACH completes)
    # In production: move to held_balance, deduct only on settlement
    await wallets.update_one(
        {"user_id": user_id},
        {"$inc": {"usd_balance": -data.amount}, "$set": {"updated_at": now}}
    )
    
    # Update bank last_used_at
    await linked_banks.update_one(
        {"id": data.bank_id},
        {"$set": {"last_used_at": now}}
    )
    
    logger.info(f"Withdrawal initiated: {transfer_id} for user {user_id}, amount: ${data.amount}")
    
    return {
        "success": True,
        "transfer_id": transfer_id,
        "status": "pending",
        "amount": data.amount,
        "estimated_arrival": "1-3 business days",
        "message": "Withdrawal initiated. Funds will arrive in 1-3 business days."
    }


@router.get("/transfers")
async def get_transfer_history(request: Request, limit: int = 20):
    """
    Get pending and completed bank transfers for the user.
    """
    user_id = get_user_id_from_headers(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    db = get_database()
    pending_transfers = db.pending_transfers
    
    cursor = pending_transfers.find(
        {"user_id": user_id},
        {"_id": 0}
    ).sort("created_at", -1).limit(limit)
    
    transfers = await cursor.to_list(limit)
    
    return {"transfers": transfers}
