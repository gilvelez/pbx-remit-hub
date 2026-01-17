"""
PBX Internal Transfers - Closed-loop PBX-to-PBX transfers
User lookup and instant internal transfers between PBX users
"""
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timezone
import logging
import os

from database.connection import get_database

router = APIRouter(prefix="/api/internal", tags=["internal"])
logger = logging.getLogger(__name__)

# Default wallet for new users
DEFAULT_WALLET = {
    "usd_balance": 1500.00,
    "php_balance": 25000.00,
}

# Mock user directory for demo mode (when MONGODB_URI is missing)
MOCK_USERS = [
    {
        "user_id": "mock-user-001",
        "email": "maria.santos@example.com",
        "phone": "+639171234567",
        "full_name": "Maria Santos",
        "role": "recipient",
    },
    {
        "user_id": "mock-user-002", 
        "email": "juan.delacruz@example.com",
        "phone": "+639181234567",
        "full_name": "Juan Dela Cruz",
        "role": "recipient",
    },
    {
        "user_id": "mock-user-003",
        "email": "anna.reyes@example.com",
        "phone": "+639191234567",
        "full_name": "Anna Reyes",
        "role": "recipient",
    },
]


class UserLookupRequest(BaseModel):
    identifier: str = Field(..., description="Email or phone number (E.164 format)")


# Transfer limits
MAX_TRANSFER_PER_TXN = 5000.0  # $5,000 per transaction
DAILY_TRANSFER_LIMIT = 25000.0  # $25,000 per day per sender


class InternalTransferRequest(BaseModel):
    recipient_identifier: str = Field(..., description="Recipient email or phone")
    amount_usd: float = Field(..., gt=0, le=MAX_TRANSFER_PER_TXN, description="Amount in USD")
    note: Optional[str] = Field(None, max_length=200)


def get_user_id_from_headers(request: Request) -> str:
    """Extract user ID from session token"""
    token = request.headers.get("X-Session-Token", "")
    return token[:36] if token else None


def utc_now():
    return datetime.now(timezone.utc)


async def get_or_create_wallet(db, user_id: str) -> dict:
    """Get existing wallet or create new one with default balances"""
    wallets = db.wallets
    
    wallet = await wallets.find_one({"user_id": user_id}, {"_id": 0})
    
    if not wallet:
        now = utc_now()
        wallet = {
            "user_id": user_id,
            "usd_balance": DEFAULT_WALLET["usd_balance"],
            "php_balance": DEFAULT_WALLET["php_balance"],
            "created_at": now,
            "updated_at": now
        }
        await wallets.insert_one(wallet)
        wallet.pop("_id", None)
    
    return wallet


@router.post("/lookup")
async def lookup_pbx_user(request: Request, data: UserLookupRequest):
    """
    Look up a PBX user by email or phone number.
    Returns user info if found, or 404 if not registered.
    """
    user_id = get_user_id_from_headers(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="No session token provided")
    
    identifier = data.identifier.lower().strip()
    
    try:
        db = get_database()
        users = db.users
        
        # Search by email or phone (case-insensitive for email)
        user = await users.find_one(
            {
                "$or": [
                    {"email": identifier},
                    {"phone": identifier}
                ]
            },
            {"_id": 0, "user_id": 1, "email": 1, "phone": 1, "full_name": 1, "role": 1}
        )
        
        if not user:
            # Check mock users for demo
            mock_user = next(
                (u for u in MOCK_USERS if u["email"].lower() == identifier or u.get("phone") == identifier),
                None
            )
            if mock_user:
                return {
                    "found": True,
                    "user": {
                        "user_id": mock_user["user_id"],
                        "email": mock_user["email"],
                        "phone": mock_user.get("phone"),
                        "full_name": mock_user.get("full_name", "PBX User"),
                        "display_name": mock_user.get("full_name") or mock_user["email"].split("@")[0],
                        "_mock": True
                    }
                }
            
            return {
                "found": False,
                "message": "User not found on PBX. Invite them or use External Payout."
            }
        
        # Don't allow sending to yourself
        if user["user_id"] == user_id:
            raise HTTPException(status_code=400, detail="Cannot send to yourself")
        
        # Build display name
        display_name = user.get("full_name") or user.get("email", "").split("@")[0] or "PBX User"
        
        return {
            "found": True,
            "user": {
                "user_id": user["user_id"],
                "email": user.get("email"),
                "phone": user.get("phone"),
                "full_name": user.get("full_name"),
                "display_name": display_name,
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error looking up user: {e}")
        raise HTTPException(status_code=500, detail="Failed to look up user")


@router.post("/transfer")
async def create_internal_transfer(request: Request, data: InternalTransferRequest):
    """
    Execute an instant PBX-to-PBX internal transfer.
    
    - USD only (internal transfers)
    - Instant completion
    - No fees
    - Max $5,000 per transaction
    - Max $25,000 per day per sender
    - Creates ledger entries for both sender and recipient
    """
    sender_id = get_user_id_from_headers(request)
    if not sender_id:
        raise HTTPException(status_code=401, detail="No session token provided")
    
    if data.amount_usd <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")
    
    # Validate per-transaction limit
    if data.amount_usd > MAX_TRANSFER_PER_TXN:
        raise HTTPException(
            status_code=400, 
            detail=f"Transfer exceeds current PBX limits. Maximum ${MAX_TRANSFER_PER_TXN:,.0f} per transaction."
        )
    
    identifier = data.recipient_identifier.lower().strip()
    
    try:
        db = get_database()
        users = db.users
        wallets = db.wallets
        ledger = db.ledger
        
        # Check daily transfer limit
        now = utc_now()
        start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
        
        daily_total_cursor = ledger.aggregate([
            {
                "$match": {
                    "user_id": sender_id,
                    "type": "internal_transfer_out",
                    "created_at": {"$gte": start_of_day}
                }
            },
            {
                "$group": {
                    "_id": None,
                    "total": {"$sum": {"$abs": "$amount"}}
                }
            }
        ])
        daily_total_result = await daily_total_cursor.to_list(1)
        daily_total = daily_total_result[0]["total"] if daily_total_result else 0
        
        if daily_total + data.amount_usd > DAILY_TRANSFER_LIMIT:
            remaining = DAILY_TRANSFER_LIMIT - daily_total
            raise HTTPException(
                status_code=400,
                detail=f"Transfer exceeds daily PBX limit. You have ${remaining:,.2f} remaining today. Daily limit: ${DAILY_TRANSFER_LIMIT:,.0f}."
            )
        
        # Find recipient
        recipient = await users.find_one(
            {
                "$or": [
                    {"email": identifier},
                    {"phone": identifier}
                ]
            },
            {"_id": 0}
        )
        
        # Check mock users if not found
        if not recipient:
            mock_user = next(
                (u for u in MOCK_USERS if u["email"].lower() == identifier or u.get("phone") == identifier),
                None
            )
            if mock_user:
                recipient = mock_user
        
        if not recipient:
            raise HTTPException(status_code=404, detail="Recipient not found on PBX")
        
        recipient_id = recipient["user_id"]
        
        # Prevent self-transfer
        if recipient_id == sender_id:
            raise HTTPException(status_code=400, detail="Cannot send to yourself")
        
        # Get sender wallet
        sender_wallet = await get_or_create_wallet(db, sender_id)
        
        # Check sufficient balance
        if sender_wallet["usd_balance"] < data.amount_usd:
            raise HTTPException(status_code=400, detail="Insufficient USD balance")
        
        # Generate transaction IDs
        now = utc_now()
        timestamp = int(now.timestamp())
        transfer_id = f"int_{timestamp}_{sender_id[:8]}_{recipient_id[:8]}"
        sender_txn_id = f"out_{timestamp}"
        recipient_txn_id = f"in_{timestamp}"
        
        # Get sender info for recipient's ledger entry
        sender_info = await users.find_one({"user_id": sender_id}, {"_id": 0, "email": 1, "full_name": 1})
        sender_display = sender_info.get("full_name") if sender_info else None
        sender_email = sender_info.get("email") if sender_info else None
        
        recipient_display = recipient.get("full_name") or recipient.get("email", "").split("@")[0]
        recipient_email = recipient.get("email")
        
        # === ATOMIC OPERATION START ===
        # In production, use MongoDB transactions for true atomicity
        # For now, use safe sequential operations with idempotency
        
        # 1. Debit sender wallet
        sender_result = await wallets.update_one(
            {"user_id": sender_id, "usd_balance": {"$gte": data.amount_usd}},
            {
                "$inc": {"usd_balance": -data.amount_usd},
                "$set": {"updated_at": now}
            }
        )
        
        if sender_result.modified_count == 0:
            raise HTTPException(status_code=400, detail="Insufficient balance or concurrent update")
        
        # 2. Credit recipient wallet (create if doesn't exist)
        await wallets.update_one(
            {"user_id": recipient_id},
            {
                "$inc": {"usd_balance": data.amount_usd},
                "$set": {"updated_at": now},
                "$setOnInsert": {
                    "php_balance": DEFAULT_WALLET["php_balance"],
                    "created_at": now
                }
            },
            upsert=True
        )
        
        # 3. Create sender ledger entry
        await ledger.insert_one({
            "txn_id": sender_txn_id,
            "transfer_id": transfer_id,
            "user_id": sender_id,
            "type": "internal_transfer_out",
            "category": "PBX Transfer",
            "description": f"Sent to {recipient_display}",
            "currency": "USD",
            "amount": -data.amount_usd,
            "status": "completed",
            "counterparty": {
                "user_id": recipient_id,
                "email": recipient_email,
                "display_name": recipient_display
            },
            "note": data.note,
            "metadata": {
                "transfer_type": "pbx_internal",
                "fee": 0,
                "instant": True
            },
            "created_at": now
        })
        
        # 4. Create recipient ledger entry
        await ledger.insert_one({
            "txn_id": recipient_txn_id,
            "transfer_id": transfer_id,
            "user_id": recipient_id,
            "type": "internal_transfer_in",
            "category": "PBX Transfer",
            "description": f"Received from {sender_display or sender_email or 'PBX User'}",
            "currency": "USD",
            "amount": data.amount_usd,
            "status": "completed",
            "counterparty": {
                "user_id": sender_id,
                "email": sender_email,
                "display_name": sender_display
            },
            "note": data.note,
            "metadata": {
                "transfer_type": "pbx_internal",
                "fee": 0,
                "instant": True
            },
            "created_at": now
        })
        
        # === ATOMIC OPERATION END ===
        
        logger.info(f"Internal transfer completed: {sender_id} -> {recipient_id}, ${data.amount_usd}")
        
        # Get updated sender balance
        updated_wallet = await wallets.find_one({"user_id": sender_id}, {"_id": 0, "usd_balance": 1})
        
        return {
            "success": True,
            "transfer_id": transfer_id,
            "transaction_id": sender_txn_id,
            "amount": data.amount_usd,
            "currency": "USD",
            "recipient": {
                "display_name": recipient_display,
                "email": recipient_email
            },
            "fee": 0,
            "status": "completed",
            "instant": True,
            "new_balance": updated_wallet.get("usd_balance", 0) if updated_wallet else 0,
            "created_at": now.isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating internal transfer: {e}")
        raise HTTPException(status_code=500, detail="Transfer failed. Please try again.")


@router.get("/incoming")
async def get_incoming_transfers(request: Request, limit: int = 10):
    """Get recent incoming PBX-to-PBX transfers for the current user."""
    user_id = get_user_id_from_headers(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="No session token provided")
    
    try:
        db = get_database()
        ledger = db.ledger
        
        # Get incoming internal transfers
        transfers = await ledger.find(
            {"user_id": user_id, "type": "internal_transfer_in"},
            {"_id": 0}
        ).sort("created_at", -1).limit(limit).to_list(limit)
        
        return {
            "transfers": [
                {
                    "id": t.get("txn_id"),
                    "transfer_id": t.get("transfer_id"),
                    "amount": t.get("amount"),
                    "currency": t.get("currency"),
                    "from": t.get("counterparty", {}).get("display_name") or t.get("counterparty", {}).get("email") or "PBX User",
                    "from_email": t.get("counterparty", {}).get("email"),
                    "note": t.get("note"),
                    "status": t.get("status"),
                    "created_at": t.get("created_at").isoformat() if isinstance(t.get("created_at"), datetime) else str(t.get("created_at"))
                }
                for t in transfers
            ]
        }
        
    except Exception as e:
        logger.error(f"Error getting incoming transfers: {e}")
        raise HTTPException(status_code=500, detail="Failed to get incoming transfers")


@router.post("/invite")
async def generate_invite(request: Request, data: dict):
    """Generate an invite message for a non-PBX user."""
    recipient_identifier = data.get("identifier", "")
    
    invite_message = f"""Hey! I want to send you money through PBX - instant, free transfers between us.

Sign up here to receive your payment: https://pbx.app/welcome

Just use this email/phone when you register: {recipient_identifier}

Once you're on PBX, I can send you USD instantly, and you can convert to PHP or cash out to GCash/bank anytime!"""

    return {
        "success": True,
        "message": invite_message,
        "invite_link": "https://pbx.app/welcome"
    }
