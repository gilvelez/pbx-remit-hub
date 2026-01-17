"""
Magic Link Authentication Service
Generates secure time-limited tokens for passwordless login
"""
import secrets
import hashlib
from datetime import datetime, timezone, timedelta
from typing import Optional
import logging

from database.connection import get_database

logger = logging.getLogger(__name__)

# Token configuration
TOKEN_EXPIRY_MINUTES = 15
TOKEN_LENGTH = 64  # Hex characters


def generate_magic_token() -> str:
    """Generate a cryptographically secure random token"""
    return secrets.token_hex(TOKEN_LENGTH // 2)


def hash_token(token: str) -> str:
    """Hash a token for secure storage"""
    return hashlib.sha256(token.encode()).hexdigest()


def utc_now():
    return datetime.now(timezone.utc)


async def create_magic_link(user_id: str, email: str, redirect_path: str = "/recipient/wallets") -> dict:
    """
    Create a magic link token for a user.
    
    Args:
        user_id: The user's ID
        email: The user's email address
        redirect_path: Where to redirect after login
    
    Returns:
        dict with token and magic_link_url
    """
    db = get_database()
    magic_links = db.magic_links
    
    # Generate token
    token = generate_magic_token()
    token_hash = hash_token(token)
    
    now = utc_now()
    expires_at = now + timedelta(minutes=TOKEN_EXPIRY_MINUTES)
    
    # Store hashed token in database
    magic_link_doc = {
        "token_hash": token_hash,
        "user_id": user_id,
        "email": email,
        "redirect_path": redirect_path,
        "created_at": now,
        "expires_at": expires_at,
        "used": False,
        "used_at": None
    }
    
    await magic_links.insert_one(magic_link_doc)
    
    logger.info(f"Created magic link for user {user_id}, expires at {expires_at}")
    
    # Return plain token (not hashed) for the URL
    return {
        "token": token,
        "expires_at": expires_at.isoformat(),
        "expires_in_minutes": TOKEN_EXPIRY_MINUTES
    }


async def verify_magic_link(token: str) -> Optional[dict]:
    """
    Verify a magic link token and mark it as used.
    
    Args:
        token: The plain token from the URL
    
    Returns:
        User info dict if valid, None if invalid/expired/used
    """
    db = get_database()
    magic_links = db.magic_links
    
    token_hash = hash_token(token)
    now = utc_now()
    
    # Find valid token
    magic_link = await magic_links.find_one({
        "token_hash": token_hash,
        "used": False,
        "expires_at": {"$gt": now}
    })
    
    if not magic_link:
        logger.warning(f"Magic link verification failed - token not found or expired")
        return None
    
    # Mark as used
    await magic_links.update_one(
        {"token_hash": token_hash},
        {"$set": {"used": True, "used_at": now}}
    )
    
    logger.info(f"Magic link verified for user {magic_link['user_id']}")
    
    return {
        "user_id": magic_link["user_id"],
        "email": magic_link["email"],
        "redirect_path": magic_link["redirect_path"]
    }


async def cleanup_expired_links():
    """Clean up expired magic links (run periodically)"""
    db = get_database()
    magic_links = db.magic_links
    
    now = utc_now()
    result = await magic_links.delete_many({
        "$or": [
            {"expires_at": {"$lt": now}},
            {"used": True, "used_at": {"$lt": now - timedelta(hours=24)}}
        ]
    })
    
    if result.deleted_count > 0:
        logger.info(f"Cleaned up {result.deleted_count} expired magic links")
