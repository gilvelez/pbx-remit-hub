"""
Notification Preferences API Routes
User settings for SMS and Email notifications
"""
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
import logging

from services.notifications import (
    get_notification_preferences,
    set_notification_preferences
)

router = APIRouter(prefix="/api/notifications", tags=["notifications"])
logger = logging.getLogger(__name__)


def get_user_id_from_headers(request: Request) -> str:
    """Extract user ID from request headers"""
    return request.headers.get("X-Session-Token", "")


class NotificationPreferencesUpdate(BaseModel):
    sms_enabled: bool = True
    email_enabled: bool = True


@router.get("/preferences")
async def get_preferences(request: Request):
    """Get user's notification preferences"""
    user_id = get_user_id_from_headers(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="No session token provided")
    
    prefs = await get_notification_preferences(user_id)
    return {
        "sms_enabled": prefs.get("sms_enabled", True),
        "email_enabled": prefs.get("email_enabled", True)
    }


@router.put("/preferences")
async def update_preferences(request: Request, data: NotificationPreferencesUpdate):
    """Update user's notification preferences"""
    user_id = get_user_id_from_headers(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="No session token provided")
    
    prefs = await set_notification_preferences(
        user_id=user_id,
        sms_enabled=data.sms_enabled,
        email_enabled=data.email_enabled
    )
    
    logger.info(f"Updated notification preferences for {user_id}: SMS={data.sms_enabled}, Email={data.email_enabled}")
    
    return {
        "success": True,
        "sms_enabled": prefs.get("sms_enabled", True),
        "email_enabled": prefs.get("email_enabled", True),
        "message": "Notification preferences updated"
    }


@router.get("/status")
async def get_notification_status():
    """Get notification system status (for debugging)"""
    import os
    
    resend_configured = bool(os.environ.get("RESEND_API_KEY"))
    twilio_configured = all([
        os.environ.get("TWILIO_ACCOUNT_SID"),
        os.environ.get("TWILIO_AUTH_TOKEN"),
        os.environ.get("TWILIO_PHONE_NUMBER")
    ])
    
    return {
        "email": {
            "provider": "Resend",
            "configured": resend_configured,
            "mode": "live" if resend_configured else "disabled"
        },
        "sms": {
            "provider": "Twilio",
            "configured": twilio_configured,
            "mode": "live" if twilio_configured else "mock"
        }
    }
