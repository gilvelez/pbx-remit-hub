"""
PBX Profiles - Personal and Business profile management
Supports User -> Profile abstraction (one login, multiple profiles)
"""
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field, field_validator
from typing import Optional, Literal, List
from datetime import datetime, timezone
from enum import Enum
import logging
import uuid
import re

from database.connection import get_database

router = APIRouter(prefix="/api/profiles", tags=["profiles"])
logger = logging.getLogger(__name__)


def utc_now():
    return datetime.now(timezone.utc)


def get_user_id_from_headers(request: Request) -> str:
    """Extract user ID from session token"""
    token = request.headers.get("X-Session-Token", "")
    return token[:36] if token else None


class ProfileType(str, Enum):
    PERSONAL = "personal"
    BUSINESS = "business"


# ============================================================
# REQUEST/RESPONSE MODELS
# ============================================================

class CreatePersonalProfileRequest(BaseModel):
    """Create or update personal profile"""
    handle: Optional[str] = None  # @username
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
    
    @field_validator('handle')
    @classmethod
    def validate_handle(cls, v):
        if v:
            # Handle must be lowercase alphanumeric with underscores
            v = v.lower().strip()
            if not re.match(r'^[a-z0-9_]{3,20}$', v):
                raise ValueError('Handle must be 3-20 chars, lowercase letters, numbers, underscores only')
        return v


class CreateBusinessProfileRequest(BaseModel):
    """Create a business profile"""
    business_name: str = Field(..., min_length=2, max_length=100)
    handle: str = Field(..., min_length=3, max_length=20)  # @businesshandle
    category: Optional[str] = None
    logo_url: Optional[str] = None
    
    @field_validator('handle')
    @classmethod
    def validate_handle(cls, v):
        v = v.lower().strip()
        if not re.match(r'^[a-z0-9_]{3,20}$', v):
            raise ValueError('Handle must be 3-20 chars, lowercase letters, numbers, underscores only')
        return v


class UpdateProfileRequest(BaseModel):
    """Update profile fields"""
    display_name: Optional[str] = None
    business_name: Optional[str] = None
    handle: Optional[str] = None
    avatar_url: Optional[str] = None
    logo_url: Optional[str] = None
    category: Optional[str] = None
    
    @field_validator('handle')
    @classmethod
    def validate_handle(cls, v):
        if v:
            v = v.lower().strip()
            if not re.match(r'^[a-z0-9_]{3,20}$', v):
                raise ValueError('Handle must be 3-20 chars, lowercase letters, numbers, underscores only')
        return v


# ============================================================
# PROFILE ENDPOINTS
# ============================================================

@router.get("/me")
async def get_my_profiles(request: Request):
    """
    Get all profiles for current user (personal + business)
    """
    user_id = get_user_id_from_headers(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="No session token provided")
    
    db = get_database()
    profiles_coll = db.profiles
    
    # Get all profiles for this user
    cursor = profiles_coll.find({"user_id": user_id}, {"_id": 0})
    profiles = await cursor.to_list(10)
    
    # If no profiles exist, create default personal profile
    if not profiles:
        personal_profile = await create_default_personal_profile(db, user_id)
        profiles = [personal_profile]
    
    return {
        "profiles": profiles,
        "personal": next((p for p in profiles if p["type"] == ProfileType.PERSONAL), None),
        "businesses": [p for p in profiles if p["type"] == ProfileType.BUSINESS]
    }


@router.get("/active")
async def get_active_profile(request: Request):
    """
    Get the currently active profile for the user.
    Stored in user preferences or defaults to personal.
    """
    user_id = get_user_id_from_headers(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="No session token provided")
    
    db = get_database()
    users_coll = db.users
    profiles_coll = db.profiles
    
    # Get user's active profile preference
    user = await users_coll.find_one({"user_id": user_id}, {"_id": 0})
    active_profile_id = user.get("active_profile_id") if user else None
    
    if active_profile_id:
        profile = await profiles_coll.find_one(
            {"profile_id": active_profile_id, "user_id": user_id},
            {"_id": 0}
        )
        if profile:
            return {"profile": profile}
    
    # Default to personal profile
    personal = await profiles_coll.find_one(
        {"user_id": user_id, "type": ProfileType.PERSONAL},
        {"_id": 0}
    )
    
    if not personal:
        personal = await create_default_personal_profile(db, user_id)
    
    return {"profile": personal}


@router.post("/switch/{profile_id}")
async def switch_active_profile(request: Request, profile_id: str):
    """
    Switch the active profile (like Instagram account switch)
    """
    user_id = get_user_id_from_headers(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="No session token provided")
    
    db = get_database()
    profiles_coll = db.profiles
    users_coll = db.users
    
    # Verify profile belongs to user
    profile = await profiles_coll.find_one(
        {"profile_id": profile_id, "user_id": user_id},
        {"_id": 0}
    )
    
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    # Update user's active profile
    await users_coll.update_one(
        {"user_id": user_id},
        {
            "$set": {"active_profile_id": profile_id, "updated_at": utc_now()},
            "$setOnInsert": {"user_id": user_id, "created_at": utc_now()}
        },
        upsert=True
    )
    
    logger.info(f"User {user_id} switched to profile {profile_id}")
    
    return {"success": True, "profile": profile}


@router.post("/personal")
async def create_or_update_personal_profile(request: Request, data: CreatePersonalProfileRequest):
    """
    Create or update personal profile
    """
    user_id = get_user_id_from_headers(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="No session token provided")
    
    db = get_database()
    profiles_coll = db.profiles
    
    # Check if handle is taken (if provided)
    if data.handle:
        existing = await profiles_coll.find_one({
            "handle": data.handle,
            "user_id": {"$ne": user_id}
        })
        if existing:
            raise HTTPException(status_code=409, detail="Handle already taken")
    
    now = utc_now()
    
    # Check if personal profile exists
    existing_personal = await profiles_coll.find_one({
        "user_id": user_id,
        "type": ProfileType.PERSONAL
    })
    
    if existing_personal:
        # Update existing
        update_fields = {"updated_at": now}
        if data.handle:
            update_fields["handle"] = data.handle
        if data.display_name:
            update_fields["display_name"] = data.display_name
        if data.avatar_url:
            update_fields["avatar_url"] = data.avatar_url
        
        await profiles_coll.update_one(
            {"profile_id": existing_personal["profile_id"]},
            {"$set": update_fields}
        )
        
        profile = await profiles_coll.find_one(
            {"profile_id": existing_personal["profile_id"]},
            {"_id": 0}
        )
    else:
        # Create new personal profile
        profile_id = f"prof_{uuid.uuid4().hex[:12]}"
        profile = {
            "profile_id": profile_id,
            "user_id": user_id,
            "type": ProfileType.PERSONAL,
            "handle": data.handle,
            "display_name": data.display_name,
            "avatar_url": data.avatar_url,
            "created_at": now,
            "updated_at": now
        }
        await profiles_coll.insert_one(profile)
        del profile["_id"]
    
    logger.info(f"Personal profile created/updated for user {user_id}")
    
    return {"success": True, "profile": profile}


@router.post("/business")
async def create_business_profile(request: Request, data: CreateBusinessProfileRequest):
    """
    Create a new business profile for the user.
    Users can have multiple business profiles.
    """
    user_id = get_user_id_from_headers(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="No session token provided")
    
    db = get_database()
    profiles_coll = db.profiles
    
    # Check if handle is taken
    existing = await profiles_coll.find_one({"handle": data.handle})
    if existing:
        raise HTTPException(status_code=409, detail="Business handle already taken")
    
    # Check max business profiles (limit to 5 per user)
    biz_count = await profiles_coll.count_documents({
        "user_id": user_id,
        "type": ProfileType.BUSINESS
    })
    if biz_count >= 5:
        raise HTTPException(status_code=400, detail="Maximum 5 business profiles allowed")
    
    now = utc_now()
    profile_id = f"biz_{uuid.uuid4().hex[:12]}"
    
    profile = {
        "profile_id": profile_id,
        "user_id": user_id,
        "type": ProfileType.BUSINESS,
        "handle": data.handle,
        "business_name": data.business_name,
        "category": data.category,
        "logo_url": data.logo_url,
        "verified": False,  # Manual admin verification for Phase 1
        "created_at": now,
        "updated_at": now
    }
    
    await profiles_coll.insert_one(profile)
    
    logger.info(f"Business profile {profile_id} created for user {user_id}")
    
    # Return without _id
    profile_response = await profiles_coll.find_one({"profile_id": profile_id}, {"_id": 0})
    
    return {"success": True, "profile": profile_response}


@router.put("/{profile_id}")
async def update_profile(request: Request, profile_id: str, data: UpdateProfileRequest):
    """
    Update a profile (personal or business)
    """
    user_id = get_user_id_from_headers(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="No session token provided")
    
    db = get_database()
    profiles_coll = db.profiles
    
    # Verify profile belongs to user
    profile = await profiles_coll.find_one({
        "profile_id": profile_id,
        "user_id": user_id
    })
    
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    # Check handle uniqueness if changing
    if data.handle and data.handle != profile.get("handle"):
        existing = await profiles_coll.find_one({
            "handle": data.handle,
            "profile_id": {"$ne": profile_id}
        })
        if existing:
            raise HTTPException(status_code=409, detail="Handle already taken")
    
    # Build update
    update_fields = {"updated_at": utc_now()}
    
    if data.handle:
        update_fields["handle"] = data.handle
    if data.display_name is not None:
        update_fields["display_name"] = data.display_name
    if data.business_name is not None and profile["type"] == ProfileType.BUSINESS:
        update_fields["business_name"] = data.business_name
    if data.avatar_url is not None:
        update_fields["avatar_url"] = data.avatar_url
    if data.logo_url is not None and profile["type"] == ProfileType.BUSINESS:
        update_fields["logo_url"] = data.logo_url
    if data.category is not None and profile["type"] == ProfileType.BUSINESS:
        update_fields["category"] = data.category
    
    await profiles_coll.update_one(
        {"profile_id": profile_id},
        {"$set": update_fields}
    )
    
    updated = await profiles_coll.find_one({"profile_id": profile_id}, {"_id": 0})
    
    return {"success": True, "profile": updated}


@router.delete("/{profile_id}")
async def delete_business_profile(request: Request, profile_id: str):
    """
    Delete a business profile (cannot delete personal profile)
    """
    user_id = get_user_id_from_headers(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="No session token provided")
    
    db = get_database()
    profiles_coll = db.profiles
    
    # Verify profile belongs to user and is a business
    profile = await profiles_coll.find_one({
        "profile_id": profile_id,
        "user_id": user_id
    })
    
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    if profile["type"] == ProfileType.PERSONAL:
        raise HTTPException(status_code=400, detail="Cannot delete personal profile")
    
    await profiles_coll.delete_one({"profile_id": profile_id})
    
    logger.info(f"Business profile {profile_id} deleted by user {user_id}")
    
    return {"success": True, "message": "Business profile deleted"}


# ============================================================
# SEARCH & DISCOVERY
# ============================================================

@router.get("/search/people")
async def search_people(request: Request, q: str = ""):
    """
    Search PERSONAL profiles by @username, name, phone, email
    Returns only personal accounts (not businesses)
    """
    if not q or len(q) < 2:
        return {"profiles": []}
    
    query = q.lower().strip()
    
    db = get_database()
    profiles_coll = db.profiles
    users_coll = db.users
    
    # Search personal profiles
    profile_filter = {
        "type": ProfileType.PERSONAL,
        "$or": [
            {"handle": {"$regex": query, "$options": "i"}},
            {"display_name": {"$regex": query, "$options": "i"}},
        ]
    }
    
    cursor = profiles_coll.find(profile_filter, {"_id": 0}).limit(15)
    profiles = await cursor.to_list(15)
    
    # Also search users by email/phone and link to profiles
    user_filter = {
        "$or": [
            {"email": {"$regex": query, "$options": "i"}},
            {"phone": {"$regex": query, "$options": "i"}},
        ]
    }
    
    user_cursor = users_coll.find(user_filter, {"_id": 0, "user_id": 1, "email": 1, "phone": 1}).limit(15)
    users = await user_cursor.to_list(15)
    
    # Get profiles for these users
    user_ids = [u["user_id"] for u in users]
    if user_ids:
        user_profiles_cursor = profiles_coll.find({
            "user_id": {"$in": user_ids},
            "type": ProfileType.PERSONAL
        }, {"_id": 0})
        user_profiles = await user_profiles_cursor.to_list(15)
        
        # Merge user info into profiles
        user_map = {u["user_id"]: u for u in users}
        for p in user_profiles:
            if p["user_id"] in user_map:
                p["email"] = user_map[p["user_id"]].get("email")
                p["phone"] = user_map[p["user_id"]].get("phone")
        
        # Add to results if not already present
        existing_ids = {p["profile_id"] for p in profiles}
        for p in user_profiles:
            if p["profile_id"] not in existing_ids:
                profiles.append(p)
    
    # Format response
    results = []
    for p in profiles[:15]:
        results.append({
            "profile_id": p.get("profile_id"),
            "user_id": p.get("user_id"),
            "type": "personal",
            "handle": p.get("handle"),
            "display_name": p.get("display_name") or p.get("email", "").split("@")[0] if p.get("email") else "PBX User",
            "avatar_url": p.get("avatar_url"),
            "email": p.get("email"),
            "phone": p.get("phone"),
        })
    
    return {"profiles": results}


@router.get("/search/businesses")
async def search_businesses(request: Request, q: str = ""):
    """
    Search BUSINESS profiles by business name or @businesshandle
    """
    if not q or len(q) < 2:
        return {"profiles": []}
    
    query = q.lower().strip()
    
    db = get_database()
    profiles_coll = db.profiles
    
    # Search business profiles
    profile_filter = {
        "type": ProfileType.BUSINESS,
        "$or": [
            {"handle": {"$regex": query, "$options": "i"}},
            {"business_name": {"$regex": query, "$options": "i"}},
        ]
    }
    
    cursor = profiles_coll.find(profile_filter, {"_id": 0}).limit(15)
    profiles = await cursor.to_list(15)
    
    # Format response
    results = []
    for p in profiles:
        results.append({
            "profile_id": p.get("profile_id"),
            "user_id": p.get("user_id"),
            "type": "business",
            "handle": p.get("handle"),
            "business_name": p.get("business_name"),
            "category": p.get("category"),
            "logo_url": p.get("logo_url"),
            "verified": p.get("verified", False),
        })
    
    return {"profiles": results}


@router.get("/{profile_id}")
async def get_profile(request: Request, profile_id: str):
    """
    Get public profile info by profile_id
    """
    db = get_database()
    profiles_coll = db.profiles
    
    profile = await profiles_coll.find_one({"profile_id": profile_id}, {"_id": 0})
    
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    # Return public fields only
    if profile["type"] == ProfileType.PERSONAL:
        return {
            "profile_id": profile.get("profile_id"),
            "type": "personal",
            "handle": profile.get("handle"),
            "display_name": profile.get("display_name"),
            "avatar_url": profile.get("avatar_url"),
        }
    else:
        return {
            "profile_id": profile.get("profile_id"),
            "type": "business",
            "handle": profile.get("handle"),
            "business_name": profile.get("business_name"),
            "category": profile.get("category"),
            "logo_url": profile.get("logo_url"),
            "verified": profile.get("verified", False),
        }


# ============================================================
# HELPER FUNCTIONS
# ============================================================

async def create_default_personal_profile(db, user_id: str) -> dict:
    """Create a default personal profile for a user"""
    profiles_coll = db.profiles
    users_coll = db.users
    
    # Get user info for defaults
    user = await users_coll.find_one({"user_id": user_id}, {"_id": 0})
    email = user.get("email") if user else None
    
    now = utc_now()
    profile_id = f"prof_{uuid.uuid4().hex[:12]}"
    
    profile = {
        "profile_id": profile_id,
        "user_id": user_id,
        "type": ProfileType.PERSONAL,
        "handle": None,  # User can set later
        "display_name": email.split("@")[0] if email else "PBX User",
        "avatar_url": None,
        "created_at": now,
        "updated_at": now
    }
    
    await profiles_coll.insert_one(profile)
    
    # Return without _id
    return await profiles_coll.find_one({"profile_id": profile_id}, {"_id": 0})


async def get_or_create_personal_profile(db, user_id: str) -> dict:
    """Get existing personal profile or create one"""
    profiles_coll = db.profiles
    
    profile = await profiles_coll.find_one({
        "user_id": user_id,
        "type": ProfileType.PERSONAL
    }, {"_id": 0})
    
    if profile:
        return profile
    
    return await create_default_personal_profile(db, user_id)
