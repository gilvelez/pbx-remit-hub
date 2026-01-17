"""
PBX Users - User management and role persistence
"""
from fastapi import APIRouter, HTTPException, Request, Response
from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from datetime import datetime
import logging
import re

from database.connection import get_database

router = APIRouter(prefix="/api/users", tags=["users"])
logger = logging.getLogger(__name__)


def normalize_email(email: str) -> str:
    """Normalize email: lowercase and trim whitespace"""
    if not email:
        return None
    return email.lower().strip()


class SetRoleRequest(BaseModel):
    role: str  # 'sender' or 'recipient'
    email: Optional[str] = None  # Optional email for persistence
    
    @field_validator('email')
    @classmethod
    def normalize_email_field(cls, v):
        if v:
            return v.lower().strip()
        return v


class UserResponse(BaseModel):
    user_id: str
    email: Optional[str] = None
    role: Optional[str] = None
    created_at: str
    updated_at: str


def get_user_id_from_headers(request: Request) -> str:
    """Extract user ID from session token"""
    token = request.headers.get("X-Session-Token", "")
    return token[:36] if token else None


async def ensure_indexes(db):
    """Ensure required indexes exist on users collection"""
    try:
        # Create unique sparse index on email (sparse allows multiple nulls)
        await db.users.create_index(
            "email",
            unique=True,
            sparse=True,
            name="email_unique_sparse"
        )
        # Index on user_id for fast lookups
        await db.users.create_index("user_id", unique=True, name="user_id_unique")
    except Exception as e:
        # Index may already exist, that's fine
        logger.debug(f"Index creation note: {e}")


@router.post("/role")
async def set_user_role(request: Request, data: SetRoleRequest):
    """
    Set user role (sender or recipient) and optionally email.
    This is called during onboarding and persisted to database.
    Email is normalized (lowercase/trimmed) and must be unique.
    """
    user_id = get_user_id_from_headers(request)
    
    if not user_id:
        raise HTTPException(status_code=401, detail="No session token provided")
    
    if data.role not in ['sender', 'recipient']:
        raise HTTPException(status_code=400, detail="Role must be 'sender' or 'recipient'")
    
    try:
        db = get_database()
        users_collection = db.users
        
        # Ensure indexes exist
        await ensure_indexes(db)
        
        now = datetime.utcnow()
        
        # Build update fields
        set_fields = {
            "role": data.role,
            "updated_at": now
        }
        
        # Add normalized email if provided
        if data.email:
            normalized_email = normalize_email(data.email)
            
            # Check if email is already used by another user
            existing = await users_collection.find_one({
                "email": normalized_email,
                "user_id": {"$ne": user_id}
            })
            if existing:
                raise HTTPException(
                    status_code=409, 
                    detail="Email already registered to another account"
                )
            
            set_fields["email"] = normalized_email
        
        # Upsert user with role and email
        result = await users_collection.update_one(
            {"user_id": user_id},
            {
                "$set": set_fields,
                "$setOnInsert": {
                    "user_id": user_id,
                    "created_at": now
                }
            },
            upsert=True
        )
        
        logger.info(f"User role set: user_id={user_id}, role={data.role}, email={data.email}")
        
        return {
            "success": True,
            "user_id": user_id,
            "role": data.role,
            "email": set_fields.get("email"),
            "updated_at": now.isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error setting user role: {e}")
        raise HTTPException(status_code=500, detail="Failed to save user role")


@router.get("/me")
async def get_current_user(request: Request):
    """
    Get current user info including role.
    """
    user_id = get_user_id_from_headers(request)
    
    if not user_id:
        raise HTTPException(status_code=401, detail="No session token provided")
    
    try:
        db = get_database()
        users_collection = db.users
        
        user = await users_collection.find_one(
            {"user_id": user_id},
            {"_id": 0}  # Exclude MongoDB ObjectId
        )
        
        if not user:
            # Return minimal user info if not found in DB
            return {
                "user_id": user_id,
                "email": None,
                "role": None,
                "created_at": None,
                "updated_at": None
            }
        
        return {
            "user_id": user.get("user_id"),
            "email": user.get("email"),
            "role": user.get("role"),
            "created_at": user.get("created_at", "").isoformat() if user.get("created_at") else None,
            "updated_at": user.get("updated_at", "").isoformat() if user.get("updated_at") else None
        }
        
    except Exception as e:
        logger.error(f"Error getting user: {e}")
        raise HTTPException(status_code=500, detail="Failed to get user info")


@router.put("/me")
async def update_user(request: Request):
    """
    Update current user info (email, etc).
    """
    user_id = get_user_id_from_headers(request)
    
    if not user_id:
        raise HTTPException(status_code=401, detail="No session token provided")
    
    try:
        body = await request.json()
        
        db = get_database()
        users_collection = db.users
        
        now = datetime.utcnow()
        
        update_fields = {"updated_at": now}
        if "email" in body:
            update_fields["email"] = body["email"]
        if "role" in body and body["role"] in ['sender', 'recipient']:
            update_fields["role"] = body["role"]
        
        result = await users_collection.update_one(
            {"user_id": user_id},
            {
                "$set": update_fields,
                "$setOnInsert": {
                    "user_id": user_id,
                    "created_at": now
                }
            },
            upsert=True
        )
        
        logger.info(f"User updated: user_id={user_id}")
        
        return {
            "success": True,
            "user_id": user_id,
            "updated_at": now.isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error updating user: {e}")
        raise HTTPException(status_code=500, detail="Failed to update user")
