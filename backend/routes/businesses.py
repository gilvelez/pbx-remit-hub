"""
PBX Businesses - Business discovery and interaction routes
Separate from People (personal friends) flow
"""
from fastapi import APIRouter, HTTPException, Request, BackgroundTasks
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timezone
import logging
import uuid

from database.connection import get_database
from routes.profiles import ProfileType, get_or_create_personal_profile

router = APIRouter(prefix="/api/businesses", tags=["businesses"])
logger = logging.getLogger(__name__)


def utc_now():
    return datetime.now(timezone.utc)


def get_user_id_from_headers(request: Request) -> str:
    """Extract user ID from session token"""
    token = request.headers.get("X-Session-Token", "")
    return token[:36] if token else None


def get_active_profile_from_headers(request: Request) -> Optional[str]:
    """Extract active profile ID from headers"""
    return request.headers.get("X-Active-Profile", None)


# ============================================================
# REQUEST MODELS
# ============================================================

class PayBusinessRequest(BaseModel):
    """Send PBX payment to a business"""
    business_profile_id: str
    amount_usd: float = Field(..., gt=0, le=5000)
    note: Optional[str] = None


# ============================================================
# BUSINESS DISCOVERY ENDPOINTS
# ============================================================

@router.get("/discover")
async def discover_businesses(request: Request, category: Optional[str] = None, limit: int = 20):
    """
    Discover businesses (featured, recent, by category)
    """
    db = get_database()
    profiles_coll = db.profiles
    
    query = {"type": ProfileType.BUSINESS}
    if category:
        query["category"] = {"$regex": category, "$options": "i"}
    
    # Get businesses, prioritize verified
    cursor = profiles_coll.find(query, {"_id": 0}).sort([
        ("verified", -1),
        ("created_at", -1)
    ]).limit(limit)
    
    businesses = await cursor.to_list(limit)
    
    results = []
    for b in businesses:
        results.append({
            "profile_id": b.get("profile_id"),
            "type": "business",
            "handle": b.get("handle"),
            "business_name": b.get("business_name"),
            "category": b.get("category"),
            "logo_url": b.get("logo_url"),
            "verified": b.get("verified", False),
        })
    
    return {"businesses": results}


@router.get("/categories")
async def get_business_categories():
    """Get list of business categories"""
    return {
        "categories": [
            "Retail & Shopping",
            "Food & Dining",
            "Services",
            "Health & Wellness",
            "Entertainment",
            "Travel & Transport",
            "Utilities & Bills",
            "Education",
            "Technology",
            "Other"
        ]
    }


@router.get("/paid")
async def get_businesses_paid(request: Request):
    """
    Get businesses the current user has paid (transaction history)
    """
    user_id = get_user_id_from_headers(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="No session token provided")
    
    db = get_database()
    ledger = db.ledger
    profiles_coll = db.profiles
    
    # Get user's profile
    profile = await get_or_create_personal_profile(db, user_id)
    profile_id = profile.get("profile_id")
    
    # Find unique businesses paid by this user
    pipeline = [
        {
            "$match": {
                "from_profile_id": profile_id,
                "to_profile_type": "business"
            }
        },
        {
            "$group": {
                "_id": "$to_profile_id",
                "last_paid_at": {"$max": "$created_at"},
                "total_paid": {"$sum": "$amount"}
            }
        },
        {"$sort": {"last_paid_at": -1}},
        {"$limit": 50}
    ]
    
    paid_biz_ids = []
    async for doc in ledger.aggregate(pipeline):
        paid_biz_ids.append(doc["_id"])
    
    if not paid_biz_ids:
        return {"businesses": []}
    
    # Get business profiles
    businesses = []
    cursor = profiles_coll.find({"profile_id": {"$in": paid_biz_ids}}, {"_id": 0})
    async for b in cursor:
        businesses.append({
            "profile_id": b.get("profile_id"),
            "type": "business",
            "handle": b.get("handle"),
            "business_name": b.get("business_name"),
            "category": b.get("category"),
            "logo_url": b.get("logo_url"),
            "verified": b.get("verified", False),
        })
    
    return {"businesses": businesses}


@router.get("/{profile_id}")
async def get_business_profile(request: Request, profile_id: str):
    """
    Get full business profile for viewing
    """
    db = get_database()
    profiles_coll = db.profiles
    
    profile = await profiles_coll.find_one({
        "profile_id": profile_id,
        "type": ProfileType.BUSINESS
    }, {"_id": 0})
    
    if not profile:
        raise HTTPException(status_code=404, detail="Business not found")
    
    return {
        "profile_id": profile.get("profile_id"),
        "type": "business",
        "handle": profile.get("handle"),
        "business_name": profile.get("business_name"),
        "category": profile.get("category"),
        "logo_url": profile.get("logo_url"),
        "verified": profile.get("verified", False),
        "created_at": profile.get("created_at").isoformat() if profile.get("created_at") else None
    }


# ============================================================
# BUSINESS CHAT & PAYMENTS
# ============================================================

@router.post("/chat/{business_profile_id}")
async def start_business_chat(request: Request, business_profile_id: str):
    """
    Get or create a conversation with a business.
    Unlike People, no friendship required - anyone can message a business.
    """
    user_id = get_user_id_from_headers(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="No session token provided")
    
    db = get_database()
    profiles_coll = db.profiles
    conversations = db.conversations
    messages = db.messages
    
    # Verify business exists
    business = await profiles_coll.find_one({
        "profile_id": business_profile_id,
        "type": ProfileType.BUSINESS
    })
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    
    # Get user's personal profile
    user_profile = await get_or_create_personal_profile(db, user_id)
    user_profile_id = user_profile["profile_id"]
    
    # Check for existing conversation
    existing = await conversations.find_one({
        "$or": [
            {"profile1_id": user_profile_id, "profile2_id": business_profile_id},
            {"profile1_id": business_profile_id, "profile2_id": user_profile_id}
        ]
    })
    
    if existing:
        return {
            "conversation_id": existing["conversation_id"],
            "business": {
                "profile_id": business.get("profile_id"),
                "type": "business",
                "handle": business.get("handle"),
                "business_name": business.get("business_name"),
                "logo_url": business.get("logo_url"),
                "verified": business.get("verified", False),
            }
        }
    
    # Create new conversation
    now = utc_now()
    conversation_id = f"conv_{uuid.uuid4().hex[:12]}"
    
    conversation = {
        "conversation_id": conversation_id,
        "profile1_id": user_profile_id,
        "profile2_id": business_profile_id,
        "profile1_type": "personal",
        "profile2_type": "business",
        # Legacy support - also store user_ids
        "user1_id": user_id,
        "user2_id": business.get("user_id"),
        "created_at": now,
        "last_message_at": now
    }
    
    await conversations.insert_one(conversation)
    
    # Create welcome message
    await messages.insert_one({
        "message_id": f"msg_{uuid.uuid4().hex[:12]}",
        "conversation_id": conversation_id,
        "sender_profile_id": business_profile_id,
        "sender_user_id": "system",
        "type": "system",
        "text": f"Welcome to {business.get('business_name')}! How can we help you?",
        "created_at": now
    })
    
    logger.info(f"Business conversation created: {conversation_id}")
    
    return {
        "conversation_id": conversation_id,
        "business": {
            "profile_id": business.get("profile_id"),
            "type": "business",
            "handle": business.get("handle"),
            "business_name": business.get("business_name"),
            "logo_url": business.get("logo_url"),
            "verified": business.get("verified", False),
        }
    }


@router.post("/pay")
async def pay_business(request: Request, background_tasks: BackgroundTasks, data: PayBusinessRequest):
    """
    Send PBX payment to a business.
    Similar to in-chat payment but specifically for businesses.
    """
    user_id = get_user_id_from_headers(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="No session token provided")
    
    db = get_database()
    profiles_coll = db.profiles
    wallets = db.wallets
    ledger = db.ledger
    conversations = db.conversations
    messages = db.messages
    
    # Verify business exists
    business = await profiles_coll.find_one({
        "profile_id": data.business_profile_id,
        "type": ProfileType.BUSINESS
    })
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    
    business_user_id = business.get("user_id")
    
    # Get user's profile
    user_profile = await get_or_create_personal_profile(db, user_id)
    user_profile_id = user_profile["profile_id"]
    
    # Check sender wallet
    sender_wallet = await wallets.find_one({"user_id": user_id})
    if not sender_wallet:
        sender_wallet = {"user_id": user_id, "usd_balance": 0.0, "php_balance": 0.0}
        await wallets.insert_one(sender_wallet)
    
    if sender_wallet.get("usd_balance", 0) < data.amount_usd:
        raise HTTPException(status_code=400, detail="Insufficient balance")
    
    # Get or create business wallet
    biz_wallet = await wallets.find_one({"user_id": business_user_id})
    if not biz_wallet:
        biz_wallet = {"user_id": business_user_id, "usd_balance": 0.0, "php_balance": 0.0}
        await wallets.insert_one(biz_wallet)
    
    now = utc_now()
    tx_id = f"pbx_{uuid.uuid4().hex[:12]}"
    
    # Execute transfer
    await wallets.update_one(
        {"user_id": user_id},
        {"$inc": {"usd_balance": -data.amount_usd}}
    )
    await wallets.update_one(
        {"user_id": business_user_id},
        {"$inc": {"usd_balance": data.amount_usd}}
    )
    
    # Create ledger entries with profile info
    await ledger.insert_one({
        "tx_id": tx_id,
        "user_id": user_id,
        "from_profile_id": user_profile_id,
        "to_profile_id": data.business_profile_id,
        "to_profile_type": "business",
        "type": "business_payment_out",
        "currency": "USD",
        "amount": -data.amount_usd,
        "counterparty_user_id": business_user_id,
        "note": data.note,
        "status": "completed",
        "created_at": now
    })
    await ledger.insert_one({
        "tx_id": tx_id,
        "user_id": business_user_id,
        "from_profile_id": user_profile_id,
        "to_profile_id": data.business_profile_id,
        "to_profile_type": "business",
        "type": "business_payment_in",
        "currency": "USD",
        "amount": data.amount_usd,
        "counterparty_user_id": user_id,
        "note": data.note,
        "status": "completed",
        "created_at": now
    })
    
    # Get or create conversation with business
    conversation = await conversations.find_one({
        "$or": [
            {"profile1_id": user_profile_id, "profile2_id": data.business_profile_id},
            {"profile1_id": data.business_profile_id, "profile2_id": user_profile_id}
        ]
    })
    
    if not conversation:
        conversation_id = f"conv_{uuid.uuid4().hex[:12]}"
        conversation = {
            "conversation_id": conversation_id,
            "profile1_id": user_profile_id,
            "profile2_id": data.business_profile_id,
            "profile1_type": "personal",
            "profile2_type": "business",
            "user1_id": user_id,
            "user2_id": business_user_id,
            "created_at": now,
            "last_message_at": now
        }
        await conversations.insert_one(conversation)
    else:
        conversation_id = conversation["conversation_id"]
    
    # Create payment message bubble
    message_id = f"msg_{uuid.uuid4().hex[:12]}"
    await messages.insert_one({
        "message_id": message_id,
        "conversation_id": conversation_id,
        "sender_profile_id": user_profile_id,
        "sender_user_id": user_id,
        "type": "payment",
        "text": data.note,
        "payment": {
            "tx_id": tx_id,
            "amount_usd": data.amount_usd,
            "status": "completed",
            "to_business": business.get("business_name")
        },
        "created_at": now
    })
    
    # Update conversation
    await conversations.update_one(
        {"conversation_id": conversation_id},
        {"$set": {"last_message_at": now}}
    )
    
    logger.info(f"Business payment: {tx_id} from {user_id} to {data.business_profile_id} for ${data.amount_usd}")
    
    # Get updated balance
    updated_wallet = await wallets.find_one({"user_id": user_id}, {"_id": 0, "usd_balance": 1})
    
    return {
        "success": True,
        "tx_id": tx_id,
        "message_id": message_id,
        "conversation_id": conversation_id,
        "amount_usd": data.amount_usd,
        "new_balance": updated_wallet.get("usd_balance", 0) if updated_wallet else 0,
        "business_name": business.get("business_name"),
        "created_at": now.isoformat()
    }
