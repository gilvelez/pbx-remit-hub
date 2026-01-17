"""
PBX Social Features - Friendships, Conversations, Messages
Backend routes for social networking features

NOTE: Friendships are PERSONAL-ONLY (between personal profiles).
Businesses do NOT have friends - they have chats and can be paid/messaged.
"""
from fastapi import APIRouter, HTTPException, Request, BackgroundTasks
from pydantic import BaseModel, Field
from typing import Optional, List, Literal
from datetime import datetime, timezone
from enum import Enum
import logging
import uuid

from database.connection import get_database
from services.notifications import notify_pbx_to_pbx_recipient

router = APIRouter(prefix="/api/social", tags=["social"])
logger = logging.getLogger(__name__)


def utc_now():
    return datetime.now(timezone.utc)


def get_user_id_from_headers(request: Request) -> str:
    """Extract user ID from session token"""
    return request.headers.get("X-Session-Token", "")


async def get_or_create_personal_profile(db, user_id: str) -> dict:
    """Get or create personal profile for a user"""
    profiles_coll = db.profiles
    users_coll = db.users
    
    profile = await profiles_coll.find_one({
        "user_id": user_id,
        "type": "personal"
    }, {"_id": 0})
    
    if profile:
        return profile
    
    # Create default profile
    user = await users_coll.find_one({"user_id": user_id}, {"_id": 0})
    email = user.get("email") if user else None
    
    now = utc_now()
    profile_id = f"prof_{uuid.uuid4().hex[:12]}"
    
    profile = {
        "profile_id": profile_id,
        "user_id": user_id,
        "type": "personal",
        "handle": None,
        "display_name": email.split("@")[0] if email else "PBX User",
        "avatar_url": None,
        "created_at": now,
        "updated_at": now
    }
    
    await profiles_coll.insert_one(profile)
    return await profiles_coll.find_one({"profile_id": profile_id}, {"_id": 0})


# ============================================================
# MODELS
# ============================================================

class FriendshipStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    DECLINED = "declined"
    BLOCKED = "blocked"


class MessageType(str, Enum):
    TEXT = "text"
    PAYMENT = "payment"
    SYSTEM = "system"


class FriendRequestCreate(BaseModel):
    addressee_user_id: str


class FriendRequestAction(BaseModel):
    friendship_id: str
    action: Literal["accept", "decline", "block", "unblock", "unfriend"]


class MessageSend(BaseModel):
    conversation_id: str
    text: Optional[str] = None
    message_type: MessageType = MessageType.TEXT


class PaymentInChat(BaseModel):
    recipient_user_id: str
    amount_usd: float = Field(..., gt=0, le=5000)
    note: Optional[str] = None


# ============================================================
# FRIENDSHIP ENDPOINTS
# ============================================================

@router.post("/friends/request")
async def send_friend_request(request: Request, data: FriendRequestCreate):
    """Send a friend request to another user"""
    user_id = get_user_id_from_headers(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="No session token provided")
    
    if user_id == data.addressee_user_id:
        raise HTTPException(status_code=400, detail="Cannot send friend request to yourself")
    
    db = get_database()
    friendships = db.friendships
    
    # Check if friendship already exists
    existing = await friendships.find_one({
        "$or": [
            {"requester_user_id": user_id, "addressee_user_id": data.addressee_user_id},
            {"requester_user_id": data.addressee_user_id, "addressee_user_id": user_id}
        ]
    })
    
    if existing:
        status = existing.get("status")
        if status == FriendshipStatus.ACCEPTED:
            raise HTTPException(status_code=400, detail="Already friends")
        elif status == FriendshipStatus.PENDING:
            if existing.get("requester_user_id") == user_id:
                raise HTTPException(status_code=400, detail="Friend request already sent")
            else:
                raise HTTPException(status_code=400, detail="This user has already sent you a friend request")
        elif status == FriendshipStatus.BLOCKED:
            raise HTTPException(status_code=400, detail="Cannot send friend request")
    
    # Create new friend request
    friendship_id = f"fr_{uuid.uuid4().hex[:12]}"
    now = utc_now()
    
    friendship = {
        "friendship_id": friendship_id,
        "requester_user_id": user_id,
        "addressee_user_id": data.addressee_user_id,
        "status": FriendshipStatus.PENDING,
        "created_at": now,
        "updated_at": now
    }
    
    await friendships.insert_one(friendship)
    logger.info(f"Friend request sent: {user_id} -> {data.addressee_user_id}")
    
    return {
        "success": True,
        "friendship_id": friendship_id,
        "status": FriendshipStatus.PENDING,
        "message": "Friend request sent"
    }


@router.post("/friends/action")
async def handle_friend_action(request: Request, data: FriendRequestAction):
    """Accept, decline, block, unblock, or unfriend"""
    user_id = get_user_id_from_headers(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="No session token provided")
    
    db = get_database()
    friendships = db.friendships
    
    # Find the friendship
    friendship = await friendships.find_one({"friendship_id": data.friendship_id})
    if not friendship:
        raise HTTPException(status_code=404, detail="Friendship not found")
    
    # Check user is part of this friendship
    is_requester = friendship.get("requester_user_id") == user_id
    is_addressee = friendship.get("addressee_user_id") == user_id
    if not is_requester and not is_addressee:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    current_status = friendship.get("status")
    now = utc_now()
    new_status = None
    
    if data.action == "accept":
        if not is_addressee:
            raise HTTPException(status_code=403, detail="Only addressee can accept")
        if current_status != FriendshipStatus.PENDING:
            raise HTTPException(status_code=400, detail="Can only accept pending requests")
        new_status = FriendshipStatus.ACCEPTED
        
        # Create conversation when friendship is accepted
        await create_conversation(
            db, 
            friendship.get("requester_user_id"), 
            friendship.get("addressee_user_id")
        )
        
    elif data.action == "decline":
        if not is_addressee:
            raise HTTPException(status_code=403, detail="Only addressee can decline")
        if current_status != FriendshipStatus.PENDING:
            raise HTTPException(status_code=400, detail="Can only decline pending requests")
        new_status = FriendshipStatus.DECLINED
        
    elif data.action == "block":
        new_status = FriendshipStatus.BLOCKED
        # Store who did the blocking
        await friendships.update_one(
            {"friendship_id": data.friendship_id},
            {"$set": {"blocked_by": user_id}}
        )
        
    elif data.action == "unblock":
        if current_status != FriendshipStatus.BLOCKED:
            raise HTTPException(status_code=400, detail="Not blocked")
        if friendship.get("blocked_by") != user_id:
            raise HTTPException(status_code=403, detail="Only blocker can unblock")
        # Delete the friendship entirely
        await friendships.delete_one({"friendship_id": data.friendship_id})
        return {"success": True, "message": "Unblocked successfully"}
        
    elif data.action == "unfriend":
        if current_status != FriendshipStatus.ACCEPTED:
            raise HTTPException(status_code=400, detail="Not friends")
        # Delete the friendship
        await friendships.delete_one({"friendship_id": data.friendship_id})
        return {"success": True, "message": "Unfriended successfully"}
    
    if new_status:
        await friendships.update_one(
            {"friendship_id": data.friendship_id},
            {"$set": {"status": new_status, "updated_at": now}}
        )
    
    logger.info(f"Friendship action: {data.action} on {data.friendship_id} by {user_id}")
    
    return {
        "success": True,
        "friendship_id": data.friendship_id,
        "status": new_status,
        "message": f"Friend request {data.action}ed"
    }


@router.get("/friends/list")
async def get_friends_list(request: Request):
    """Get list of friends and pending requests"""
    user_id = get_user_id_from_headers(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="No session token provided")
    
    db = get_database()
    friendships = db.friendships
    users = db.users
    
    # Get all friendships involving this user
    cursor = friendships.find({
        "$or": [
            {"requester_user_id": user_id},
            {"addressee_user_id": user_id}
        ],
        "status": {"$ne": FriendshipStatus.BLOCKED}
    })
    
    all_friendships = await cursor.to_list(100)
    
    friends = []
    incoming_requests = []
    outgoing_requests = []
    
    for f in all_friendships:
        # Determine the other user
        other_user_id = f["addressee_user_id"] if f["requester_user_id"] == user_id else f["requester_user_id"]
        
        # Get other user's info
        other_user = await users.find_one({"user_id": other_user_id}, {"_id": 0})
        user_info = {
            "user_id": other_user_id,
            "username": other_user.get("username") if other_user else None,
            "display_name": other_user.get("display_name") if other_user else other_user.get("email", "").split("@")[0] if other_user else "PBX User",
            "email": other_user.get("email") if other_user else None,
            "avatar_url": other_user.get("avatar_url") if other_user else None,
            "friendship_id": f["friendship_id"],
            "status": f["status"],
            "created_at": f["created_at"].isoformat() if f.get("created_at") else None
        }
        
        if f["status"] == FriendshipStatus.ACCEPTED:
            friends.append(user_info)
        elif f["status"] == FriendshipStatus.PENDING:
            if f["requester_user_id"] == user_id:
                outgoing_requests.append(user_info)
            else:
                incoming_requests.append(user_info)
    
    return {
        "friends": friends,
        "incoming_requests": incoming_requests,
        "outgoing_requests": outgoing_requests,
        "total_friends": len(friends),
        "pending_count": len(incoming_requests)
    }


@router.get("/friends/status/{other_user_id}")
async def get_friendship_status(request: Request, other_user_id: str):
    """Get friendship status with another user"""
    user_id = get_user_id_from_headers(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="No session token provided")
    
    db = get_database()
    friendships = db.friendships
    
    friendship = await friendships.find_one({
        "$or": [
            {"requester_user_id": user_id, "addressee_user_id": other_user_id},
            {"requester_user_id": other_user_id, "addressee_user_id": user_id}
        ]
    })
    
    if not friendship:
        return {"status": "none", "friendship_id": None}
    
    status = friendship.get("status")
    is_requester = friendship.get("requester_user_id") == user_id
    
    # Determine status from user's perspective
    if status == FriendshipStatus.PENDING:
        if is_requester:
            return {"status": "outgoing_pending", "friendship_id": friendship["friendship_id"]}
        else:
            return {"status": "incoming_pending", "friendship_id": friendship["friendship_id"]}
    elif status == FriendshipStatus.ACCEPTED:
        return {"status": "friends", "friendship_id": friendship["friendship_id"]}
    elif status == FriendshipStatus.BLOCKED:
        return {"status": "blocked", "friendship_id": friendship["friendship_id"]}
    
    return {"status": "none", "friendship_id": None}


# ============================================================
# CONVERSATION ENDPOINTS
# ============================================================

async def create_conversation(db, user1_id: str, user2_id: str):
    """Create a conversation between two users (called when friendship accepted)"""
    conversations = db.conversations
    
    # Check if conversation already exists
    existing = await conversations.find_one({
        "$or": [
            {"user1_id": user1_id, "user2_id": user2_id},
            {"user1_id": user2_id, "user2_id": user1_id}
        ]
    })
    
    if existing:
        return existing.get("conversation_id")
    
    # Create new conversation
    conversation_id = f"conv_{uuid.uuid4().hex[:12]}"
    now = utc_now()
    
    conversation = {
        "conversation_id": conversation_id,
        "user1_id": user1_id,
        "user2_id": user2_id,
        "created_at": now,
        "last_message_at": now
    }
    
    await conversations.insert_one(conversation)
    
    # Create system message
    messages = db.messages
    await messages.insert_one({
        "message_id": f"msg_{uuid.uuid4().hex[:12]}",
        "conversation_id": conversation_id,
        "sender_user_id": "system",
        "type": MessageType.SYSTEM,
        "text": "You are now friends! Say hi 👋",
        "created_at": now
    })
    
    logger.info(f"Conversation created: {conversation_id} between {user1_id} and {user2_id}")
    return conversation_id


@router.get("/conversations")
async def get_conversations(request: Request):
    """Get all conversations for current user"""
    user_id = get_user_id_from_headers(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="No session token provided")
    
    db = get_database()
    conversations = db.conversations
    users = db.users
    messages = db.messages
    
    # Get all conversations
    cursor = conversations.find({
        "$or": [
            {"user1_id": user_id},
            {"user2_id": user_id}
        ]
    }).sort("last_message_at", -1)
    
    all_convos = await cursor.to_list(50)
    
    result = []
    for c in all_convos:
        other_user_id = c["user2_id"] if c["user1_id"] == user_id else c["user1_id"]
        
        # Get other user info
        other_user = await users.find_one({"user_id": other_user_id}, {"_id": 0})
        
        # Get last message
        last_msg = await messages.find_one(
            {"conversation_id": c["conversation_id"]},
            {"_id": 0},
            sort=[("created_at", -1)]
        )
        
        # Count unread (simplified - no read receipts yet)
        unread_count = 0
        
        result.append({
            "conversation_id": c["conversation_id"],
            "other_user": {
                "user_id": other_user_id,
                "username": other_user.get("username") if other_user else None,
                "display_name": other_user.get("display_name") if other_user else "PBX User",
                "avatar_url": other_user.get("avatar_url") if other_user else None
            },
            "last_message": {
                "text": last_msg.get("text") if last_msg else None,
                "type": last_msg.get("type") if last_msg else None,
                "sender_user_id": last_msg.get("sender_user_id") if last_msg else None,
                "created_at": last_msg.get("created_at").isoformat() if last_msg and last_msg.get("created_at") else None
            } if last_msg else None,
            "unread_count": unread_count,
            "last_message_at": c.get("last_message_at").isoformat() if c.get("last_message_at") else None
        })
    
    return {"conversations": result}


@router.get("/conversations/{other_user_id}")
async def get_or_create_conversation(request: Request, other_user_id: str):
    """Get conversation with a specific user (creates if friends)"""
    user_id = get_user_id_from_headers(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="No session token provided")
    
    db = get_database()
    conversations = db.conversations
    friendships = db.friendships
    users = db.users
    
    # Check if they are friends
    friendship = await friendships.find_one({
        "$or": [
            {"requester_user_id": user_id, "addressee_user_id": other_user_id},
            {"requester_user_id": other_user_id, "addressee_user_id": user_id}
        ],
        "status": FriendshipStatus.ACCEPTED
    })
    
    if not friendship:
        raise HTTPException(status_code=403, detail="Must be friends to chat")
    
    # Find or create conversation
    conversation = await conversations.find_one({
        "$or": [
            {"user1_id": user_id, "user2_id": other_user_id},
            {"user1_id": other_user_id, "user2_id": user_id}
        ]
    })
    
    if not conversation:
        conversation_id = await create_conversation(db, user_id, other_user_id)
        conversation = await conversations.find_one({"conversation_id": conversation_id})
    
    # Get other user info
    other_user = await users.find_one({"user_id": other_user_id}, {"_id": 0})
    
    return {
        "conversation_id": conversation.get("conversation_id"),
        "other_user": {
            "user_id": other_user_id,
            "username": other_user.get("username") if other_user else None,
            "display_name": other_user.get("display_name") if other_user else "PBX User",
            "email": other_user.get("email") if other_user else None,
            "avatar_url": other_user.get("avatar_url") if other_user else None
        },
        "created_at": conversation.get("created_at").isoformat() if conversation.get("created_at") else None
    }


# ============================================================
# MESSAGE ENDPOINTS
# ============================================================

@router.get("/messages/{conversation_id}")
async def get_messages(request: Request, conversation_id: str, limit: int = 50, before: Optional[str] = None):
    """Get messages for a conversation"""
    user_id = get_user_id_from_headers(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="No session token provided")
    
    db = get_database()
    conversations = db.conversations
    messages_coll = db.messages
    
    # Verify user is part of conversation
    conversation = await conversations.find_one({
        "conversation_id": conversation_id,
        "$or": [
            {"user1_id": user_id},
            {"user2_id": user_id}
        ]
    })
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    # Build query
    query = {"conversation_id": conversation_id}
    if before:
        query["created_at"] = {"$lt": datetime.fromisoformat(before)}
    
    # Get messages (newest first, then reverse for display)
    cursor = messages_coll.find(query, {"_id": 0}).sort("created_at", -1).limit(limit)
    msgs = await cursor.to_list(limit)
    msgs.reverse()  # Oldest first for display
    
    result = []
    for m in msgs:
        result.append({
            "message_id": m.get("message_id"),
            "sender_user_id": m.get("sender_user_id"),
            "type": m.get("type"),
            "text": m.get("text"),
            "payment": m.get("payment"),
            "created_at": m.get("created_at").isoformat() if m.get("created_at") else None
        })
    
    return {"messages": result, "conversation_id": conversation_id}


@router.post("/messages/send")
async def send_message(request: Request, data: MessageSend):
    """Send a text message"""
    user_id = get_user_id_from_headers(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="No session token provided")
    
    if not data.text or not data.text.strip():
        raise HTTPException(status_code=400, detail="Message text required")
    
    db = get_database()
    conversations = db.conversations
    messages_coll = db.messages
    
    # Verify user is part of conversation
    conversation = await conversations.find_one({
        "conversation_id": data.conversation_id,
        "$or": [
            {"user1_id": user_id},
            {"user2_id": user_id}
        ]
    })
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    now = utc_now()
    message_id = f"msg_{uuid.uuid4().hex[:12]}"
    
    message = {
        "message_id": message_id,
        "conversation_id": data.conversation_id,
        "sender_user_id": user_id,
        "type": MessageType.TEXT,
        "text": data.text.strip(),
        "created_at": now
    }
    
    await messages_coll.insert_one(message)
    
    # Update conversation last_message_at
    await conversations.update_one(
        {"conversation_id": data.conversation_id},
        {"$set": {"last_message_at": now}}
    )
    
    logger.info(f"Message sent: {message_id} in {data.conversation_id}")
    
    return {
        "success": True,
        "message_id": message_id,
        "created_at": now.isoformat()
    }


@router.post("/payments/send-in-chat")
async def send_payment_in_chat(request: Request, background_tasks: BackgroundTasks, data: PaymentInChat):
    """Send PBX payment inside a chat - creates payment and message bubble"""
    user_id = get_user_id_from_headers(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="No session token provided")
    
    if user_id == data.recipient_user_id:
        raise HTTPException(status_code=400, detail="Cannot send to yourself")
    
    db = get_database()
    conversations = db.conversations
    messages_coll = db.messages
    wallets = db.wallets
    ledger = db.ledger
    users = db.users
    friendships = db.friendships
    
    # Verify they are friends
    friendship = await friendships.find_one({
        "$or": [
            {"requester_user_id": user_id, "addressee_user_id": data.recipient_user_id},
            {"requester_user_id": data.recipient_user_id, "addressee_user_id": user_id}
        ],
        "status": FriendshipStatus.ACCEPTED
    })
    
    if not friendship:
        raise HTTPException(status_code=403, detail="Must be friends to send PBX")
    
    # Get or create conversation
    conversation = await conversations.find_one({
        "$or": [
            {"user1_id": user_id, "user2_id": data.recipient_user_id},
            {"user1_id": data.recipient_user_id, "user2_id": user_id}
        ]
    })
    
    if not conversation:
        conversation_id = await create_conversation(db, user_id, data.recipient_user_id)
    else:
        conversation_id = conversation.get("conversation_id")
    
    # Get sender wallet
    sender_wallet = await wallets.find_one({"user_id": user_id})
    if not sender_wallet:
        # Create wallet with default balance
        sender_wallet = {"user_id": user_id, "usd_balance": 1500.0, "php_balance": 0.0}
        await wallets.insert_one(sender_wallet)
    
    if sender_wallet.get("usd_balance", 0) < data.amount_usd:
        raise HTTPException(status_code=400, detail="Insufficient balance")
    
    # Get or create recipient wallet
    recipient_wallet = await wallets.find_one({"user_id": data.recipient_user_id})
    if not recipient_wallet:
        recipient_wallet = {"user_id": data.recipient_user_id, "usd_balance": 0.0, "php_balance": 0.0}
        await wallets.insert_one(recipient_wallet)
    
    now = utc_now()
    tx_id = f"pbx_{uuid.uuid4().hex[:12]}"
    
    # Execute atomic transfer
    await wallets.update_one(
        {"user_id": user_id},
        {"$inc": {"usd_balance": -data.amount_usd}}
    )
    await wallets.update_one(
        {"user_id": data.recipient_user_id},
        {"$inc": {"usd_balance": data.amount_usd}}
    )
    
    # Create ledger entries
    await ledger.insert_one({
        "tx_id": tx_id,
        "user_id": user_id,
        "type": "internal_transfer_out",
        "currency": "USD",
        "amount": -data.amount_usd,
        "counterparty_user_id": data.recipient_user_id,
        "note": data.note,
        "status": "completed",
        "created_at": now
    })
    await ledger.insert_one({
        "tx_id": tx_id,
        "user_id": data.recipient_user_id,
        "type": "internal_transfer_in",
        "currency": "USD",
        "amount": data.amount_usd,
        "counterparty_user_id": user_id,
        "note": data.note,
        "status": "completed",
        "created_at": now
    })
    
    # Get sender info for display
    sender = await users.find_one({"user_id": user_id}, {"_id": 0})
    sender_name = sender.get("display_name") or sender.get("email", "").split("@")[0] if sender else "Someone"
    
    # Get recipient info for notifications
    recipient = await users.find_one({"user_id": data.recipient_user_id}, {"_id": 0})
    
    # Create payment message bubble
    message_id = f"msg_{uuid.uuid4().hex[:12]}"
    payment_message = {
        "message_id": message_id,
        "conversation_id": conversation_id,
        "sender_user_id": user_id,
        "type": MessageType.PAYMENT,
        "text": data.note,
        "payment": {
            "tx_id": tx_id,
            "amount_usd": data.amount_usd,
            "status": "completed",
            "sender_name": sender_name
        },
        "created_at": now
    }
    
    await messages_coll.insert_one(payment_message)
    
    # Update conversation
    await conversations.update_one(
        {"conversation_id": conversation_id},
        {"$set": {"last_message_at": now}}
    )
    
    # Send notifications in background
    if recipient:
        background_tasks.add_task(
            notify_pbx_to_pbx_recipient,
            recipient_email=recipient.get("email"),
            recipient_phone=recipient.get("phone"),
            recipient_user_id=data.recipient_user_id,
            sender_name=sender_name,
            amount=data.amount_usd,
            transfer_id=tx_id,
            note=data.note
        )
    
    logger.info(f"Payment in chat: {tx_id} from {user_id} to {data.recipient_user_id} for ${data.amount_usd}")
    
    # Get updated balance
    updated_wallet = await wallets.find_one({"user_id": user_id}, {"_id": 0, "usd_balance": 1})
    
    return {
        "success": True,
        "tx_id": tx_id,
        "message_id": message_id,
        "conversation_id": conversation_id,
        "amount_usd": data.amount_usd,
        "new_balance": updated_wallet.get("usd_balance", 0) if updated_wallet else 0,
        "created_at": now.isoformat()
    }
