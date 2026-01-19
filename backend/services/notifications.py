"""
PBX Transfer Notification Service - Production Complete
Sends email and SMS notifications for ALL transfer types
"""
import os
import asyncio
import logging
import resend
from datetime import datetime, timezone, timedelta
from typing import Optional, Literal
from enum import Enum

from services.magic_link import create_magic_link
from database.connection import get_database

logger = logging.getLogger(__name__)

# Configuration
RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")
APP_URL = os.environ.get("APP_URL", "https://pinoy-payments.preview.emergentagent.com")

# Initialize Resend
if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY


class TransferType(str, Enum):
    PBX_TO_PBX = "pbx_to_pbx"
    OUTBOUND = "outbound"  # Bank, GCash, E-wallet
    BILL = "bill"


class TransferStatus(str, Enum):
    COMPLETED = "completed"
    FAILED = "failed"
    DELAYED = "delayed"


def format_currency(amount: float, currency: str = "USD") -> str:
    """Format amount as currency string"""
    if currency == "PHP":
        return f"₱{amount:,.2f}"
    return f"${amount:,.2f}"


def utc_now():
    return datetime.now(timezone.utc)


# ============================================================
# DELIVERY TRACKING
# ============================================================

async def track_notification(
    user_id: str,
    transfer_id: str,
    channel: Literal["sms", "email"],
    status: Literal["sent", "failed", "skipped"],
    metadata: Optional[dict] = None
):
    """Track notification delivery for debugging, fraud review, analytics"""
    try:
        db = get_database()
        notifications = db.notification_logs
        
        await notifications.insert_one({
            "user_id": user_id,
            "transfer_id": transfer_id,
            "channel": channel,
            "status": status,
            "metadata": metadata or {},
            "created_at": utc_now()
        })
    except Exception as e:
        logger.error(f"Failed to track notification: {e}")


async def track_link_opened(token_hash: str, user_id: str):
    """Track when a magic link is opened"""
    try:
        db = get_database()
        notifications = db.notification_logs
        
        await notifications.update_one(
            {"user_id": user_id, "metadata.token_hash": token_hash},
            {"$set": {"link_opened": True, "link_opened_at": utc_now()}}
        )
    except Exception as e:
        logger.error(f"Failed to track link opened: {e}")


# ============================================================
# USER NOTIFICATION PREFERENCES
# ============================================================

async def get_notification_preferences(user_id: str) -> dict:
    """Get user's notification preferences (defaults to ON)"""
    try:
        db = get_database()
        prefs = await db.notification_preferences.find_one(
            {"user_id": user_id},
            {"_id": 0}
        )
        return prefs or {
            "user_id": user_id,
            "sms_enabled": True,
            "email_enabled": True
        }
    except Exception as e:
        logger.error(f"Failed to get notification preferences: {e}")
        return {"sms_enabled": True, "email_enabled": True}


async def set_notification_preferences(
    user_id: str,
    sms_enabled: bool = True,
    email_enabled: bool = True
) -> dict:
    """Set user's notification preferences"""
    try:
        db = get_database()
        prefs = {
            "user_id": user_id,
            "sms_enabled": sms_enabled,
            "email_enabled": email_enabled,
            "updated_at": utc_now()
        }
        await db.notification_preferences.update_one(
            {"user_id": user_id},
            {"$set": prefs},
            upsert=True
        )
        return prefs
    except Exception as e:
        logger.error(f"Failed to set notification preferences: {e}")
        return {"sms_enabled": sms_enabled, "email_enabled": email_enabled}


# ============================================================
# SMS RATE LIMITING (Combine within 2-3 minutes)
# ============================================================

async def should_send_sms(user_id: str) -> bool:
    """Check if we should send SMS or combine with recent"""
    try:
        db = get_database()
        recent = await db.notification_logs.find_one({
            "user_id": user_id,
            "channel": "sms",
            "status": "sent",
            "created_at": {"$gte": utc_now() - timedelta(minutes=2)}
        })
        return recent is None
    except Exception:
        return True


# ============================================================
# REDIRECT PATH MAPPING
# ============================================================

def get_redirect_path(transfer_type: TransferType, status: TransferStatus) -> str:
    """Get redirect path based on transfer type and status"""
    if status in [TransferStatus.FAILED, TransferStatus.DELAYED]:
        return "/recipient/statements"  # Status/Support screen
    
    if transfer_type == TransferType.PBX_TO_PBX:
        return "/recipient/wallets"  # Wallet → Activity screen
    
    # Outbound or Bill
    return "/recipient/statements"  # Transaction history


# ============================================================
# SMS TEMPLATES
# ============================================================

def build_sms_pbx_to_pbx_recipient(sender_name: str, amount: float, secure_link: str) -> str:
    """SMS for PBX → PBX recipient"""
    return f"You received {format_currency(amount)} from {sender_name} on PBX. View and use your funds: {secure_link}"


def build_sms_outbound_sender(amount: float, destination: str, currency: str = "USD") -> str:
    """SMS for outbound/bills sender confirmation"""
    return f"Your PBX transfer of {format_currency(amount, currency)} to {destination} was successful."


def build_sms_failed_delayed() -> str:
    """SMS for failed/delayed transfers"""
    return "Your PBX transfer is delayed. We're working on it and will update you shortly."


# ============================================================
# EMAIL TEMPLATES
# ============================================================

def build_email_pbx_to_pbx_recipient(
    sender_name: str,
    amount: float,
    note: Optional[str],
    magic_link_url: str
) -> dict:
    """Email for PBX → PBX recipient"""
    
    note_section = ""
    if note:
        note_section = f'''
        <tr>
            <td style="padding: 15px 20px; background: #f8f9fa; border-radius: 8px; margin: 15px 20px;">
                <p style="margin: 0; font-size: 14px; color: #6c757d;">Note from {sender_name}:</p>
                <p style="margin: 5px 0 0; font-size: 16px; color: #0A2540; font-style: italic;">&ldquo;{note}&rdquo;</p>
            </td>
        </tr>
        '''
    
    html = f'''
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px 0;">
        <tr>
            <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 500px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #0A2540 0%, #1a3a5c 100%); padding: 30px 20px; text-align: center;">
                            <div style="width: 50px; height: 50px; background: rgba(246, 201, 75, 0.2); border-radius: 12px; display: inline-block; line-height: 50px; margin-bottom: 15px;">
                                <span style="font-size: 20px; font-weight: bold; color: #F6C94B;">PBX</span>
                            </div>
                            <p style="margin: 0; color: rgba(255,255,255,0.9); font-size: 18px; font-weight: 600;">You received money!</p>
                        </td>
                    </tr>
                    
                    <!-- Amount -->
                    <tr>
                        <td style="padding: 30px 20px; text-align: center;">
                            <p style="margin: 0; font-size: 48px; font-weight: bold; color: #0A2540;">
                                {format_currency(amount)}
                            </p>
                            <p style="margin: 10px 0 0; font-size: 16px; color: #6c757d;">
                                from <strong style="color: #0A2540;">{sender_name}</strong>
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Note -->
                    {note_section}
                    
                    <!-- Status badges -->
                    <tr>
                        <td style="padding: 15px 20px; text-align: center;">
                            <span style="display: inline-block; padding: 6px 12px; background: #d4edda; color: #155724; border-radius: 20px; font-size: 12px; font-weight: 600;">⚡ Instant</span>
                            <span style="display: inline-block; padding: 6px 12px; background: #d4edda; color: #155724; border-radius: 20px; font-size: 12px; font-weight: 600; margin-left: 8px;">✓ Free</span>
                        </td>
                    </tr>
                    
                    <!-- CTA Button -->
                    <tr>
                        <td style="padding: 25px 20px;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center">
                                        <a href="{magic_link_url}" style="display: inline-block; padding: 16px 40px; background: #0A2540; color: #ffffff; text-decoration: none; border-radius: 12px; font-size: 16px; font-weight: 600;">
                                            View your funds →
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- What you can do -->
                    <tr>
                        <td style="padding: 0 20px 25px;">
                            <table width="100%" cellpadding="0" cellspacing="0" style="background: #f8f9fa; border-radius: 12px;">
                                <tr>
                                    <td style="padding: 20px;">
                                        <p style="margin: 0 0 15px; font-size: 14px; font-weight: 600; color: #0A2540;">What you can do:</p>
                                        <p style="margin: 5px 0; font-size: 14px; color: #495057;">✓ Send to other PBX users (free)</p>
                                        <p style="margin: 5px 0; font-size: 14px; color: #495057;">✓ Pay bills</p>
                                        <p style="margin: 5px 0; font-size: 14px; color: #495057;">✓ Convert to PHP or cash out</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Trust Footer -->
                    <tr>
                        <td style="padding: 20px; background: #f8f9fa; border-top: 1px solid #e9ecef;">
                            <p style="margin: 0; font-size: 12px; color: #6c757d; text-align: center;">
                                ⚡ PBX notifications are instant and free
                            </p>
                            <p style="margin: 8px 0 0; font-size: 12px; color: #6c757d; text-align: center;">
                                <strong>PBX will never ask for your password.</strong>
                            </p>
                            <p style="margin: 8px 0 0; font-size: 11px; color: #adb5bd; text-align: center;">
                                This link expires in 15 minutes. <a href="{APP_URL}/support" style="color: #0A2540;">Report suspicious messages</a>
                            </p>
                            <p style="margin: 15px 0 0; font-size: 11px; color: #adb5bd; text-align: center;">
                                © {datetime.now().year} Philippine Bayani Exchange (PBX)
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
'''
    
    return {
        "subject": "You received money on PBX",
        "html": html
    }


def build_email_outbound_sender(
    amount: float,
    destination: str,
    reference_id: str,
    currency: str = "USD"
) -> dict:
    """Email for outbound/bills sender confirmation"""
    
    html = f'''
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px 0;">
        <tr>
            <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 500px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #0A2540 0%, #1a3a5c 100%); padding: 30px 20px; text-align: center;">
                            <div style="width: 50px; height: 50px; background: rgba(246, 201, 75, 0.2); border-radius: 12px; display: inline-block; line-height: 50px; margin-bottom: 15px;">
                                <span style="font-size: 20px; font-weight: bold; color: #F6C94B;">PBX</span>
                            </div>
                            <p style="margin: 0; color: rgba(255,255,255,0.9); font-size: 18px; font-weight: 600;">Transfer Complete ✓</p>
                        </td>
                    </tr>
                    
                    <!-- Details -->
                    <tr>
                        <td style="padding: 30px 20px;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="padding: 10px 0; border-bottom: 1px solid #e9ecef;">
                                        <span style="color: #6c757d; font-size: 14px;">Amount</span>
                                        <span style="float: right; font-weight: 600; color: #0A2540; font-size: 16px;">{format_currency(amount, currency)}</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px 0; border-bottom: 1px solid #e9ecef;">
                                        <span style="color: #6c757d; font-size: 14px;">Destination</span>
                                        <span style="float: right; font-weight: 600; color: #0A2540; font-size: 14px;">{destination}</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px 0; border-bottom: 1px solid #e9ecef;">
                                        <span style="color: #6c757d; font-size: 14px;">Reference ID</span>
                                        <span style="float: right; font-family: monospace; color: #0A2540; font-size: 12px;">{reference_id}</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px 0;">
                                        <span style="color: #6c757d; font-size: 14px;">Date</span>
                                        <span style="float: right; color: #0A2540; font-size: 14px;">{datetime.now().strftime('%B %d, %Y %I:%M %p')}</span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- CTA -->
                    <tr>
                        <td style="padding: 0 20px 25px; text-align: center;">
                            <a href="{APP_URL}/recipient/statements" style="display: inline-block; padding: 12px 30px; background: #f8f9fa; color: #0A2540; text-decoration: none; border-radius: 8px; font-size: 14px; border: 1px solid #e9ecef;">
                                View transfer history
                            </a>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 20px; background: #f8f9fa; border-top: 1px solid #e9ecef;">
                            <p style="margin: 0; font-size: 12px; color: #6c757d; text-align: center;">
                                <strong>PBX will never ask for your password.</strong>
                            </p>
                            <p style="margin: 10px 0 0; font-size: 11px; color: #adb5bd; text-align: center;">
                                © {datetime.now().year} Philippine Bayani Exchange (PBX)
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
'''
    
    return {
        "subject": "Your PBX transfer is complete",
        "html": html
    }


def build_email_failed_delayed(
    status: str,
    transfer_type: str,
    amount: float,
    reference_id: str
) -> dict:
    """Email for failed/delayed transfers"""
    
    status_text = "delayed" if status == "delayed" else "unsuccessful"
    action_text = "We're working on it and will update you shortly." if status == "delayed" else "Please try again or contact support."
    
    html = f'''
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px 0;">
        <tr>
            <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 500px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); padding: 30px 20px; text-align: center;">
                            <div style="width: 50px; height: 50px; background: rgba(255,255,255,0.2); border-radius: 12px; display: inline-block; line-height: 50px; margin-bottom: 15px;">
                                <span style="font-size: 24px;">⚠️</span>
                            </div>
                            <p style="margin: 0; color: #ffffff; font-size: 18px; font-weight: 600;">Transfer Update</p>
                        </td>
                    </tr>
                    
                    <!-- Status -->
                    <tr>
                        <td style="padding: 30px 20px; text-align: center;">
                            <p style="margin: 0; font-size: 16px; color: #6c757d;">
                                Your transfer of <strong style="color: #0A2540;">{format_currency(amount)}</strong> is currently <strong style="color: #dc3545;">{status_text}</strong>.
                            </p>
                            <p style="margin: 15px 0 0; font-size: 14px; color: #6c757d;">
                                {action_text}
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Details -->
                    <tr>
                        <td style="padding: 0 20px 25px;">
                            <table width="100%" cellpadding="0" cellspacing="0" style="background: #fff3cd; border-radius: 8px;">
                                <tr>
                                    <td style="padding: 15px;">
                                        <p style="margin: 0; font-size: 14px; color: #856404;">
                                            <strong>Reference:</strong> {reference_id}<br>
                                            <strong>Next update:</strong> Within 24 hours
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- CTA -->
                    <tr>
                        <td style="padding: 0 20px 25px; text-align: center;">
                            <a href="{APP_URL}/support" style="display: inline-block; padding: 14px 35px; background: #0A2540; color: #ffffff; text-decoration: none; border-radius: 10px; font-size: 14px; font-weight: 600;">
                                Contact Support
                            </a>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 20px; background: #f8f9fa; border-top: 1px solid #e9ecef;">
                            <p style="margin: 0; font-size: 12px; color: #6c757d; text-align: center;">
                                <strong>PBX will never ask for your password.</strong>
                            </p>
                            <p style="margin: 10px 0 0; font-size: 11px; color: #adb5bd; text-align: center;">
                                © {datetime.now().year} Philippine Bayani Exchange (PBX)
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
'''
    
    return {
        "subject": "Update on your PBX transfer",
        "html": html
    }


# ============================================================
# SEND FUNCTIONS
# ============================================================

async def send_email(
    to_email: str,
    subject: str,
    html: str,
    user_id: str,
    transfer_id: str
) -> dict:
    """Send email via Resend"""
    if not RESEND_API_KEY:
        logger.warning("RESEND_API_KEY not configured - skipping email notification")
        await track_notification(user_id, transfer_id, "email", "skipped", {"reason": "no_api_key"})
        return {"status": "skipped", "reason": "RESEND_API_KEY not configured"}
    
    try:
        params = {
            "from": SENDER_EMAIL,
            "to": [to_email],
            "subject": subject,
            "html": html
        }
        
        email_result = await asyncio.to_thread(resend.Emails.send, params)
        
        logger.info(f"Email sent to {to_email}, id: {email_result.get('id')}")
        await track_notification(user_id, transfer_id, "email", "sent", {"email_id": email_result.get("id")})
        
        return {"status": "sent", "email_id": email_result.get("id")}
        
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {e}")
        await track_notification(user_id, transfer_id, "email", "failed", {"error": str(e)})
        return {"status": "error", "error": str(e)}


async def send_sms(
    to_phone: str,
    message: str,
    user_id: str,
    transfer_id: str
) -> dict:
    """Send SMS via Twilio (mock mode if not configured)"""
    twilio_sid = os.environ.get("TWILIO_ACCOUNT_SID", "")
    twilio_token = os.environ.get("TWILIO_AUTH_TOKEN", "")
    twilio_phone = os.environ.get("TWILIO_PHONE_NUMBER", "")
    
    if not all([twilio_sid, twilio_token, twilio_phone]):
        logger.info(f"SMS (mock): {to_phone} - {message[:50]}...")
        await track_notification(user_id, transfer_id, "sms", "skipped", {
            "reason": "mock_mode",
            "message": message,
            "recipient": to_phone
        })
        return {
            "status": "mock",
            "message": message,
            "recipient": to_phone,
            "note": "SMS in mock mode - add Twilio credentials to enable"
        }
    
    try:
        from twilio.rest import Client
        
        client = Client(twilio_sid, twilio_token)
        result = client.messages.create(
            body=message,
            from_=twilio_phone,
            to=to_phone
        )
        
        logger.info(f"SMS sent to {to_phone}, sid: {result.sid}")
        await track_notification(user_id, transfer_id, "sms", "sent", {"message_sid": result.sid})
        
        return {"status": "sent", "message_sid": result.sid}
        
    except Exception as e:
        logger.error(f"Failed to send SMS to {to_phone}: {e}")
        await track_notification(user_id, transfer_id, "sms", "failed", {"error": str(e)})
        return {"status": "error", "error": str(e)}


# ============================================================
# MAIN NOTIFICATION FUNCTIONS
# ============================================================

async def notify_pbx_to_pbx_recipient(
    recipient_email: Optional[str],
    recipient_phone: Optional[str],
    recipient_user_id: str,
    sender_name: str,
    amount: float,
    transfer_id: str,
    note: Optional[str] = None
) -> dict:
    """
    Notify recipient of PBX → PBX transfer
    Creates magic link for secure login
    """
    results = {"email": None, "sms": None}
    
    # Check user preferences
    prefs = await get_notification_preferences(recipient_user_id)
    
    # Create magic link
    redirect_path = get_redirect_path(TransferType.PBX_TO_PBX, TransferStatus.COMPLETED)
    magic_link_data = await create_magic_link(
        user_id=recipient_user_id,
        email=recipient_email or "",
        redirect_path=redirect_path
    )
    magic_link_url = f"{APP_URL}/auth/magic?token={magic_link_data['token']}"
    short_link = magic_link_url  # In production, use a URL shortener
    
    # Send Email
    if recipient_email and prefs.get("email_enabled", True):
        email_content = build_email_pbx_to_pbx_recipient(
            sender_name=sender_name,
            amount=amount,
            note=note,
            magic_link_url=magic_link_url
        )
        results["email"] = await send_email(
            to_email=recipient_email,
            subject=email_content["subject"],
            html=email_content["html"],
            user_id=recipient_user_id,
            transfer_id=transfer_id
        )
    
    # Send SMS (with rate limiting)
    if recipient_phone and prefs.get("sms_enabled", True):
        if await should_send_sms(recipient_user_id):
            sms_message = build_sms_pbx_to_pbx_recipient(sender_name, amount, short_link)
            results["sms"] = await send_sms(
                to_phone=recipient_phone,
                message=sms_message,
                user_id=recipient_user_id,
                transfer_id=transfer_id
            )
        else:
            results["sms"] = {"status": "rate_limited", "reason": "Recent SMS sent"}
    
    return results


async def notify_outbound_sender(
    sender_email: Optional[str],
    sender_phone: Optional[str],
    sender_user_id: str,
    amount: float,
    destination: str,
    reference_id: str,
    transfer_id: str,
    currency: str = "USD"
) -> dict:
    """
    Notify sender of outbound transfer completion (Bank, GCash, Bills)
    """
    results = {"email": None, "sms": None}
    
    prefs = await get_notification_preferences(sender_user_id)
    
    # Send Email
    if sender_email and prefs.get("email_enabled", True):
        email_content = build_email_outbound_sender(
            amount=amount,
            destination=destination,
            reference_id=reference_id,
            currency=currency
        )
        results["email"] = await send_email(
            to_email=sender_email,
            subject=email_content["subject"],
            html=email_content["html"],
            user_id=sender_user_id,
            transfer_id=transfer_id
        )
    
    # Send SMS
    if sender_phone and prefs.get("sms_enabled", True):
        if await should_send_sms(sender_user_id):
            sms_message = build_sms_outbound_sender(amount, destination, currency)
            results["sms"] = await send_sms(
                to_phone=sender_phone,
                message=sms_message,
                user_id=sender_user_id,
                transfer_id=transfer_id
            )
    
    return results


async def notify_transfer_failed(
    user_email: Optional[str],
    user_phone: Optional[str],
    user_id: str,
    amount: float,
    reference_id: str,
    transfer_id: str,
    status: str = "failed",  # "failed" or "delayed"
    transfer_type: str = "transfer"
) -> dict:
    """
    Notify user of failed or delayed transfer
    """
    results = {"email": None, "sms": None}
    
    prefs = await get_notification_preferences(user_id)
    
    # Send Email
    if user_email and prefs.get("email_enabled", True):
        email_content = build_email_failed_delayed(
            status=status,
            transfer_type=transfer_type,
            amount=amount,
            reference_id=reference_id
        )
        results["email"] = await send_email(
            to_email=user_email,
            subject=email_content["subject"],
            html=email_content["html"],
            user_id=user_id,
            transfer_id=transfer_id
        )
    
    # Send SMS (always send for failures)
    if user_phone and prefs.get("sms_enabled", True):
        sms_message = build_sms_failed_delayed()
        results["sms"] = await send_sms(
            to_phone=user_phone,
            message=sms_message,
            user_id=user_id,
            transfer_id=transfer_id
        )
    
    return results


# Legacy function for backward compatibility
async def send_transfer_notifications(
    recipient_email: Optional[str],
    recipient_phone: Optional[str],
    recipient_user_id: str,
    sender_name: str,
    amount: float,
    note: Optional[str] = None
) -> dict:
    """Legacy wrapper for PBX-to-PBX notifications"""
    transfer_id = f"legacy_{int(utc_now().timestamp())}"
    return await notify_pbx_to_pbx_recipient(
        recipient_email=recipient_email,
        recipient_phone=recipient_phone,
        recipient_user_id=recipient_user_id,
        sender_name=sender_name,
        amount=amount,
        transfer_id=transfer_id,
        note=note
    )


# ============================================================
# INVITE NOTIFICATIONS
# ============================================================

async def send_invite_notification(
    contact: str,
    contact_type: str,  # "email" or "phone"
    inviter_name: str,
    invite_id: str
) -> dict:
    """
    Send invite notification to non-PBX user
    """
    invite_url = f"{APP_URL}/join?ref={invite_id}"
    
    if contact_type == "email":
        # Send email invite
        subject = f"{inviter_name} invited you to PBX"
        html = f'''
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px 0;">
        <tr>
            <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 500px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <tr>
                        <td style="background: linear-gradient(135deg, #0A2540 0%, #1a3a5c 100%); padding: 30px 20px; text-align: center;">
                            <div style="width: 50px; height: 50px; background: rgba(246, 201, 75, 0.2); border-radius: 12px; display: inline-block; line-height: 50px; margin-bottom: 15px;">
                                <span style="font-size: 20px; font-weight: bold; color: #F6C94B;">PBX</span>
                            </div>
                            <p style="margin: 0; color: #ffffff; font-size: 22px; font-weight: bold;">You've Been Invited! 🎉</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 30px 20px;">
                            <p style="margin: 0 0 15px; font-size: 16px; color: #1a1a1a;">
                                <strong>{inviter_name}</strong> wants to send you money through PBX.
                            </p>
                            <p style="margin: 0 0 25px; font-size: 14px; color: #495057;">
                                Join PBX to receive instant, free transfers from friends and family.
                            </p>
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center">
                                        <a href="{invite_url}" style="display: inline-block; background: linear-gradient(135deg, #F6C94B 0%, #f4b832 100%); color: #0A2540; text-decoration: none; padding: 15px 40px; border-radius: 12px; font-weight: 600; font-size: 16px;">
                                            Join PBX Free
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 25px; background: #f8f9fa; border-radius: 12px;">
                                <tr>
                                    <td style="padding: 20px;">
                                        <p style="margin: 0 0 10px; font-size: 14px; font-weight: 600; color: #0A2540;">Why PBX?</p>
                                        <p style="margin: 5px 0; font-size: 14px; color: #495057;">⚡ Instant transfers between friends</p>
                                        <p style="margin: 5px 0; font-size: 14px; color: #495057;">💵 Zero fees for PBX-to-PBX</p>
                                        <p style="margin: 5px 0; font-size: 14px; color: #495057;">🔒 Bank-grade security</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 20px; background: #f8f9fa; border-top: 1px solid #e9ecef;">
                            <p style="margin: 0; font-size: 11px; color: #adb5bd; text-align: center;">
                                © {datetime.now().year} Philippine Bayani Exchange (PBX)
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
'''
        
        try:
            await send_email(
                to_email=contact,
                subject=subject,
                html=html,
                user_id="invite",
                transfer_id=invite_id
            )
            logger.info(f"Invite email sent to {contact}")
            return {"status": "sent", "channel": "email"}
        except Exception as e:
            logger.error(f"Failed to send invite email: {e}")
            return {"status": "error", "error": str(e)}
    
    else:  # phone / SMS
        sms_message = f"{inviter_name} invited you to PBX! Join free to receive instant money transfers: {invite_url}"
        
        try:
            await send_sms(
                to_phone=contact,
                message=sms_message,
                user_id="invite",
                transfer_id=invite_id
            )
            logger.info(f"Invite SMS sent to {contact}")
            return {"status": "sent", "channel": "sms"}
        except Exception as e:
            logger.error(f"Failed to send invite SMS: {e}")
            return {"status": "error", "error": str(e)}

