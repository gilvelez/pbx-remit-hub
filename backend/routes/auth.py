"""
JWT Authentication Routes
Handles login, register, and token verification
"""
from fastapi import APIRouter, HTTPException, Request, Header, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from typing import Optional
import logging
import uuid
import hashlib
import secrets
import jwt
from datetime import datetime, timedelta
import os

from services.magic_link import verify_magic_link, create_magic_link
from database.connection import get_database

router = APIRouter(prefix="/api/auth", tags=["auth"])
logger = logging.getLogger(__name__)

# JWT Configuration
JWT_SECRET = os.environ.get("JWT_SECRET", "pbx-secret-key-change-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_HOURS = 24 * 7  # 7 days

security = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    """Hash password with salt"""
    salt = secrets.token_hex(16)
    hashed = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 100000)
    return f"{salt}:{hashed.hex()}"


def verify_password(password: str, hashed: str) -> bool:
    """Verify password against hash"""
    try:
        salt, stored_hash = hashed.split(':')
        computed = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 100000)
        return computed.hex() == stored_hash
    except Exception:
        return False


def create_jwt_token(user_id: str, email: str) -> str:
    """Create JWT token for user"""
    payload = {
        "user_id": user_id,
        "email": email,
        "exp": datetime.utcnow() + timedelta(hours=JWT_EXPIRY_HOURS),
        "iat": datetime.utcnow(),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_jwt_token(token: str) -> Optional[dict]:
    """Decode and verify JWT token"""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


async def get_current_user_from_jwt(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    authorization: Optional[str] = Header(None),
    x_session_token: Optional[str] = Header(None),
) -> dict:
    """
    Extract user from JWT token (supports both Bearer header and legacy x-session-token)
    """
    token = None
    
    # Try Bearer token first
    if credentials:
        token = credentials.credentials
    elif authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ", 1)[1]
    elif x_session_token:
        # Legacy support for x-session-token
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
    
    # Fallback to session lookup (legacy support)
    db = get_database()
    session = await db.sessions.find_one({"token": token})
    if session:
        return {
            "user_id": session.get("user_id") or session.get("userId"),
            "email": session.get("email"),
        }
    
    raise HTTPException(status_code=401, detail="Invalid or expired token")


# Request/Response Models
class LoginRequest(BaseModel):
    email: EmailStr
    password: Optional[str] = None  # Optional for backward compatibility


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    displayName: Optional[str] = None


class MagicLinkVerifyRequest(BaseModel):
    token: str


class MagicLinkResendRequest(BaseModel):
    email: EmailStr


@router.post("/login")
async def login(data: LoginRequest):
    """
    Login with email and password.
    Returns JWT token on success.
    """
    email = data.email.lower().strip()
    
    db = get_database()
    users = db.users
    wallets = db.wallets
    
    # Find existing user
    user = await users.find_one({"email": email})
    
    if not user:
        # For backward compatibility: if no password provided, create user
        if not data.password:
            user_id = str(uuid.uuid4())
            display_name = email.split("@")[0]
            await users.insert_one({
                "user_id": user_id,
                "email": email,
                "display_name": display_name,
                "password_hash": None,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
            })
            # Create wallet with 0 balances
            await wallets.update_one(
                {"user_id": user_id},
                {
                    "$setOnInsert": {
                        "user_id": user_id,
                        "usd": 0,
                        "php": 0,
                        "usdc": 0,
                        "created_at": datetime.utcnow(),
                    },
                    "$set": {"updated_at": datetime.utcnow()}
                },
                upsert=True
            )
            token = create_jwt_token(user_id, email)
            logger.info(f"Created new user (no password) for {email}")
            return {
                "token": token,
                "user": {
                    "userId": user_id,
                    "email": email,
                    "displayName": display_name
                }
            }
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    user_id = user.get("user_id", str(user.get("_id")))
    display_name = user.get("display_name") or user.get("displayName") or email.split("@")[0]
    password_hash = user.get("password_hash")
    
    # If user has password, verify it
    if password_hash:
        if not data.password or not verify_password(data.password, password_hash):
            raise HTTPException(status_code=401, detail="Invalid email or password")
    elif data.password:
        # User doesn't have password but provided one - set it
        new_hash = hash_password(data.password)
        await users.update_one(
            {"email": email},
            {"$set": {"password_hash": new_hash, "updated_at": datetime.utcnow()}}
        )
    
    # Create JWT token
    token = create_jwt_token(user_id, email)
    
    logger.info(f"Login successful for {email}, userId={user_id}")
    
    return {
        "token": token,
        "user": {
            "userId": user_id,
            "email": email,
            "displayName": display_name
        }
    }


@router.post("/register")
async def register(data: RegisterRequest):
    """
    Register new user with email and password.
    Creates user and wallet, returns JWT token.
    """
    email = data.email.lower().strip()
    
    if not data.password or len(data.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    
    db = get_database()
    users = db.users
    wallets = db.wallets
    
    # Check if user already exists
    existing = await users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user_id = str(uuid.uuid4())
    display_name = data.displayName or email.split("@")[0]
    password_hash = hash_password(data.password)
    
    await users.insert_one({
        "user_id": user_id,
        "email": email,
        "display_name": display_name,
        "password_hash": password_hash,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    })
    
    # Create wallet with demo amounts (same as Netlify functions)
    await wallets.insert_one({
        "user_id": user_id,
        "usd": 500,
        "php": 28060,
        "usdc": 0,
        "demoSeeded": True,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    })
    
    # Create JWT token
    token = create_jwt_token(user_id, email)
    
    logger.info(f"Registered new user {email}, userId={user_id}")
    
    return {
        "token": token,
        "user": {
            "userId": user_id,
            "email": email,
            "displayName": display_name
        }
    }


@router.get("/me")
async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    authorization: Optional[str] = Header(None),
    x_session_token: Optional[str] = Header(None),
):
    """
    Get current user info and linked banks.
    Supports both JWT Bearer token and legacy X-Session-Token header.
    """
    # Extract token
    token = None
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
    
    db = get_database()
    
    if payload:
        user_id = payload.get("user_id")
        email = payload.get("email")
    else:
        # Fallback to session lookup
        session = await db.sessions.find_one({"token": token})
        if not session:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        user_id = session.get("user_id") or session.get("userId")
        email = session.get("email")
    
    # Get user info
    user = await db.users.find_one({"user_id": user_id})
    if not user:
        user = await db.users.find_one({"email": email})
    
    display_name = None
    if user:
        display_name = user.get("display_name") or user.get("displayName")
    if not display_name:
        display_name = email.split("@")[0] if email else "User"
    
    # Get linked banks
    linked_banks_cursor = db.banks.find({"user_id": user_id}).sort("created_at", -1)
    linked_banks = await linked_banks_cursor.to_list(100)
    
    return {
        "user": {
            "userId": user_id,
            "email": email,
            "displayName": display_name,
        },
        "linkedBanks": [
            {
                "bank_id": b.get("bank_id"),
                "name": b.get("name"),
                "mask": b.get("mask"),
                "institution_id": b.get("institution_id"),
                "institution_name": b.get("institution_name"),
                "accounts": b.get("accounts", []),
                "createdAt": b.get("created_at") or b.get("createdAt"),
            }
            for b in linked_banks
        ]
    }


@router.post("/magic/verify")
async def verify_magic_link_route(request: Request, data: MagicLinkVerifyRequest):
    """Verify a magic link token and return session info."""
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
    """Resend a new magic link to the user's email."""
    email = data.email.lower().strip()
    
    db = get_database()
    user = await db.users.find_one({"email": email})
    
    if not user:
        logger.info(f"Magic link resend requested for non-existent email: {email}")
        return {"success": True, "message": "If your email is registered, you will receive a new link."}
    
    user_id = user.get("user_id", str(user.get("_id")))
    
    magic_link_data = await create_magic_link(
        user_id=user_id,
        email=email,
        redirect_path="/recipient/wallets"
    )
    
    app_url = os.environ.get("APP_URL", "")
    magic_url = f"{app_url}/auth/magic?token={magic_link_data['token']}"
    
    logger.info(f"Magic link resend for {email}: {magic_url}")
    
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


# Export helper for other routes
def require_jwt():
    """Dependency for routes that require JWT authentication"""
    return Depends(get_current_user_from_jwt)
