"""
PBX Users - User management and role persistence
"""
from fastapi import APIRouter, HTTPException, Request, Response
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import logging

from database.connection import get_database

router = APIRouter(prefix="/api/users", tags=["users"])
logger = logging.getLogger(__name__)


class SetRoleRequest(BaseModel):
    role: str  # 'sender' or 'recipient'


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


@router.post("/role")
async def set_user_role(request: Request, data: SetRoleRequest):
    """
    Set user role (sender or recipient).
    This is called during onboarding and persisted to database.
    """
    user_id = get_user_id_from_headers(request)
    
    if not user_id:
        raise HTTPException(status_code=401, detail="No session token provided")
    
    if data.role not in ['sender', 'recipient']:
        raise HTTPException(status_code=400, detail="Role must be 'sender' or 'recipient'")
    
    try:
        db = get_database()
        users_collection = db.users
        
        now = datetime.utcnow()
        
        # Upsert user with role
        result = await users_collection.update_one(
            {"user_id": user_id},
            {
                "$set": {
                    "role": data.role,
                    "updated_at": now
                },
                "$setOnInsert": {
                    "user_id": user_id,
                    "created_at": now
                }
            },
            upsert=True
        )
        
        logger.info(f"User role set: user_id={user_id}, role={data.role}")
        
        return {
            "success": True,
            "user_id": user_id,
            "role": data.role,
            "updated_at": now.isoformat()
        }
        
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
