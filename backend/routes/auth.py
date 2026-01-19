"""
Magic Link Authentication Routes
Handles magic link verification for passwordless login
"""
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, EmailStr
from typing import Optional
import logging

from services.magic_link import verify_magic_link, create_magic_link
from database.connection import get_database

router = APIRouter(prefix="/api/auth", tags=["auth"])
logger = logging.getLogger(__name__)


class MagicLinkVerifyRequest(BaseModel):
    token: str


class MagicLinkResendRequest(BaseModel):
    email: EmailStr


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
    app_url = os.environ.get("APP_URL", "https://pinoy-payments.preview.emergentagent.com")
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
