"""
Magic Link Authentication Routes
Handles magic link verification for passwordless login
"""
from fastapi import APIRouter, HTTPException, Request, Response
from pydantic import BaseModel
from typing import Optional
import logging

from services.magic_link import verify_magic_link, create_magic_link

router = APIRouter(prefix="/api/auth", tags=["auth"])
logger = logging.getLogger(__name__)


class MagicLinkVerifyRequest(BaseModel):
    token: str


class MagicLinkCreateRequest(BaseModel):
    email: str
    redirect_path: Optional[str] = "/recipient/wallets"


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


@router.get("/magic/info")
async def get_magic_link_info():
    """Get info about magic link authentication"""
    return {
        "expiry_minutes": 15,
        "description": "Magic links provide secure passwordless login",
        "usage": "Click the link in your email to log in automatically"
    }
