"""
Magic Link Authentication Routes + Simple Login
Handles magic link verification for passwordless login
and simple email-based session login for development
"""
from fastapi import APIRouter, HTTPException, Request, Header
from pydantic import BaseModel, EmailStr
from typing import Optional
import logging
import uuid
from datetime import datetime

from services.magic_link import verify_magic_link, create_magic_link
from database.connection import get_database

router = APIRouter(prefix="/api/auth", tags=["auth"])
logger = logging.getLogger(__name__)


class SimpleLoginRequest(BaseModel):
    email: EmailStr


class MagicLinkVerifyRequest(BaseModel):
    token: str


class MagicLinkResendRequest(BaseModel):
    email: EmailStr


@router.post("/login")
async def simple_login(data: SimpleLoginRequest):
    """
    Simple email-based login that creates or retrieves a user and returns a session token.
    This mimics the Netlify function auth-login.js behavior.
    """
    email = data.email.lower().strip()
    
    db = get_database()
    users = db.users
    sessions = db.sessions
    
    # Try to find existing user
    existing = await users.find_one({"email": email})
    
    if existing:
        user_id = existing.get("userId", str(existing.get("_id")))
        display_name = existing.get("displayName") or email.split("@")[0]
    else:
        # Create new user
        user_id = str(uuid.uuid4())
        display_name = email.split("@")[0]
        await users.insert_one({
            "userId": user_id,
            "email": email,
            "displayName": display_name,
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow(),
        })
    
    # Create session token
    token = str(uuid.uuid4())
    await sessions.insert_one({
        "token": token,
        "userId": user_id,
        "email": email,
        "verified": True,
        "createdAt": datetime.utcnow(),
        "lastSeenAt": datetime.utcnow(),
    })
    
    logger.info(f"Login successful for {email}, userId={user_id}")
    
    return {
        "token": token,
        "user": {
            "userId": user_id,
            "email": email,
            "displayName": display_name
        }
    }


@router.get("/me")
async def get_current_user(x_session_token: Optional[str] = Header(None)):
    """
    Get current user info and linked banks.
    Requires X-Session-Token header.
    This mimics the Netlify function auth-me.js behavior.
    """
    if not x_session_token:
        raise HTTPException(status_code=401, detail="Missing session token")
    
    db = get_database()
    sessions = db.sessions
    users = db.users
    banks = db.banks
    
    # Find session
    session = await sessions.find_one({"token": x_session_token})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    # Update last seen
    await sessions.update_one(
        {"token": x_session_token},
        {"$set": {"lastSeenAt": datetime.utcnow()}}
    )
    
    # Get user info
    user = await users.find_one({"userId": session.get("userId")})
    
    # Get linked banks
    linked_banks_cursor = banks.find({"userId": session.get("userId")}).sort("createdAt", -1)
    linked_banks = await linked_banks_cursor.to_list(100)
    
    return {
        "user": {
            "userId": session.get("userId"),
            "email": session.get("email"),
            "displayName": user.get("displayName") if user else session.get("email", "").split("@")[0],
        },
        "linkedBanks": [
            {
                "bank_id": b.get("bank_id"),
                "name": b.get("name"),
                "mask": b.get("mask"),
                "institution_id": b.get("institution_id"),
                "institution_name": b.get("institution_name"),
                "accounts": b.get("accounts", []),
                "createdAt": b.get("createdAt"),
            }
            for b in linked_banks
        ]
    }


@router.post("/magic/verify")
async def verify_magic_link_route(request: Request, data: MagicLinkVerifyRequest):
    """
    Verify a magic link token and return session info.
    
    The frontend should:
    1. Call this endpoint with the token from the URL
    2. If valid, set session in localStorage and redirect to redirect_path
    3. If invalid, show error message
    """
    result = await verify_magic_link(data.token)
    
    if not result:
        raise HTTPException(
            status_code=401, 
            detail="Invalid or expired magic link. Please request a new one."
        )
    
    logger.info(f"Magic link verified for user {result['user_id']}")
    
    return {
        "success": True,
        "user_id": result["user_id"],
        "email": result["email"],
        "redirect_path": result["redirect_path"],
        "message": "Magic link verified successfully"
    }


@router.post("/magic/resend")
async def resend_magic_link(data: MagicLinkResendRequest):
    """
    Resend a new magic link to the user's email.
    Used when the previous link has expired.
    """
    email = data.email.lower().strip()
    
    # Find user by email
    db = get_database()
    user = await db.users.find_one({"email": email})
    
    if not user:
        # Don't reveal if email exists or not
        logger.info(f"Magic link resend requested for non-existent email: {email}")
        return {"success": True, "message": "If your email is registered, you will receive a new link."}
    
    user_id = user.get("user_id", str(user.get("_id")))
    
    # Create new magic link
    magic_link_data = await create_magic_link(
        user_id=user_id,
        email=email,
        redirect_path="/recipient/wallets"
    )
    
    # In production, send email here
    # For now, log the link (mock mode)
    import os
    app_url = os.environ.get("APP_URL", "")
    magic_url = f"{app_url}/auth/magic?token={magic_link_data['token']}"
    
    logger.info(f"Magic link resend for {email}: {magic_url}")
    
    # TODO: Send email via notification service
    # await send_magic_link_email(email, magic_url)
    
    return {
        "success": True,
        "message": "If your email is registered, you will receive a new link."
    }


@router.get("/magic/info")
async def get_magic_link_info():
    """Get info about magic link authentication"""
    return {
        "expiry_minutes": 15,
        "description": "Magic links provide secure passwordless login",
        "usage": "Click the link in your email to log in automatically"
    }
