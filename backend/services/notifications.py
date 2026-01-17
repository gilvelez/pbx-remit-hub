"""
PBX Transfer Notification Service
Sends email and SMS notifications when users receive PBX transfers
"""
import os
import asyncio
import logging
import resend
from datetime import datetime, timezone
from typing import Optional

from services.magic_link import create_magic_link

logger = logging.getLogger(__name__)

# Resend configuration
RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")
APP_URL = os.environ.get("APP_URL", "https://pbx-transfer.preview.emergentagent.com")

# Initialize Resend
if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY


def format_currency(amount: float) -> str:
    """Format amount as USD currency string"""
    return f"${amount:,.2f}"


async def send_transfer_email(
    recipient_email: str,
    recipient_user_id: str,
    sender_name: str,
    amount: float,
    note: Optional[str] = None
) -> dict:
    """
    Send email notification for received PBX transfer.
    
    Args:
        recipient_email: Email of the person receiving funds
        recipient_user_id: User ID of recipient
        sender_name: Display name of sender
        amount: Amount in USD
        note: Optional note from sender
    
    Returns:
        dict with status and email_id
    """
    if not RESEND_API_KEY:
        logger.warning("RESEND_API_KEY not configured - skipping email notification")
        return {"status": "skipped", "reason": "RESEND_API_KEY not configured"}
    
    try:
        # Create magic link for secure login
        magic_link_data = await create_magic_link(
            user_id=recipient_user_id,
            email=recipient_email,
            redirect_path="/recipient/wallets"
        )
        
        magic_link_url = f"{APP_URL}/auth/magic?token={magic_link_data['token']}"
        
        # Build email HTML
        html_content = build_transfer_email_html(
            sender_name=sender_name,
            amount=amount,
            note=note,
            magic_link_url=magic_link_url
        )
        
        params = {
            "from": SENDER_EMAIL,
            "to": [recipient_email],
            "subject": f"You received {format_currency(amount)} from {sender_name} on PBX",
            "html": html_content
        }
        
        # Send email asynchronously (Resend SDK is sync)
        email_result = await asyncio.to_thread(resend.Emails.send, params)
        
        logger.info(f"Transfer email sent to {recipient_email}, email_id: {email_result.get('id')}")
        
        return {
            "status": "sent",
            "email_id": email_result.get("id"),
            "recipient": recipient_email
        }
        
    except Exception as e:
        logger.error(f"Failed to send transfer email to {recipient_email}: {e}")
        return {"status": "error", "error": str(e)}


def build_transfer_email_html(
    sender_name: str,
    amount: float,
    note: Optional[str],
    magic_link_url: str
) -> str:
    """Build HTML content for transfer notification email"""
    
    note_section = ""
    if note:
        note_section = f'''
        <tr>
            <td style="padding: 15px 20px; background: #f8f9fa; border-radius: 8px; margin-top: 10px;">
                <p style="margin: 0; font-size: 14px; color: #6c757d;">Note from {sender_name}:</p>
                <p style="margin: 5px 0 0; font-size: 16px; color: #0A2540;">"{note}"</p>
            </td>
        </tr>
        '''
    
    return f'''
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
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center">
                                        <div style="width: 50px; height: 50px; background: rgba(246, 201, 75, 0.2); border-radius: 12px; display: inline-block; line-height: 50px;">
                                            <span style="font-size: 20px; font-weight: bold; color: #F6C94B;">PBX</span>
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center" style="padding-top: 15px;">
                                        <p style="margin: 0; color: rgba(255,255,255,0.8); font-size: 14px;">You received money!</p>
                                    </td>
                                </tr>
                            </table>
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
                    
                    <!-- Note (if provided) -->
                    {note_section}
                    
                    <!-- Status badges -->
                    <tr>
                        <td style="padding: 0 20px;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding: 5px;">
                                        <span style="display: inline-block; padding: 6px 12px; background: #d4edda; color: #155724; border-radius: 20px; font-size: 12px; font-weight: 600;">
                                            ⚡ Instant
                                        </span>
                                        <span style="display: inline-block; padding: 6px 12px; background: #d4edda; color: #155724; border-radius: 20px; font-size: 12px; font-weight: 600; margin-left: 8px;">
                                            ✓ Free
                                        </span>
                                        <span style="display: inline-block; padding: 6px 12px; background: #cce5ff; color: #004085; border-radius: 20px; font-size: 12px; font-weight: 600; margin-left: 8px;">
                                            💵 USD
                                        </span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- CTA Button -->
                    <tr>
                        <td style="padding: 30px 20px;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center">
                                        <a href="{magic_link_url}" style="display: inline-block; padding: 16px 40px; background: #0A2540; color: #ffffff; text-decoration: none; border-radius: 12px; font-size: 16px; font-weight: 600;">
                                            View Your Wallet →
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- What you can do -->
                    <tr>
                        <td style="padding: 0 20px 30px;">
                            <table width="100%" cellpadding="0" cellspacing="0" style="background: #f8f9fa; border-radius: 12px; padding: 20px;">
                                <tr>
                                    <td>
                                        <p style="margin: 0 0 15px; font-size: 14px; font-weight: 600; color: #0A2540;">What you can do with your funds:</p>
                                        <table width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td style="padding: 8px 0; font-size: 14px; color: #495057;">
                                                    <span style="color: #F6C94B;">✓</span> Hold USD in your wallet
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0; font-size: 14px; color: #495057;">
                                                    <span style="color: #F6C94B;">✓</span> Send to other PBX users (free)
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0; font-size: 14px; color: #495057;">
                                                    <span style="color: #F6C94B;">✓</span> Convert to PHP anytime
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0; font-size: 14px; color: #495057;">
                                                    <span style="color: #F6C94B;">✓</span> Pay bills or cash out
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 20px; background: #f8f9fa; border-top: 1px solid #e9ecef;">
                            <p style="margin: 0; font-size: 12px; color: #6c757d; text-align: center;">
                                This link expires in 15 minutes for your security.
                            </p>
                            <p style="margin: 10px 0 0; font-size: 12px; color: #6c757d; text-align: center;">
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


async def send_transfer_sms(
    recipient_phone: str,
    sender_name: str,
    amount: float
) -> dict:
    """
    Send SMS notification for received PBX transfer.
    
    Note: This is a mock implementation. Replace with Twilio integration
    when API keys are available.
    
    Args:
        recipient_phone: Phone number in E.164 format
        sender_name: Display name of sender
        amount: Amount in USD
    
    Returns:
        dict with status
    """
    # Check for Twilio configuration
    twilio_sid = os.environ.get("TWILIO_ACCOUNT_SID", "")
    twilio_token = os.environ.get("TWILIO_AUTH_TOKEN", "")
    twilio_phone = os.environ.get("TWILIO_PHONE_NUMBER", "")
    
    if not all([twilio_sid, twilio_token, twilio_phone]):
        logger.info(f"SMS notification (mock): {recipient_phone} - Received {format_currency(amount)} from {sender_name}")
        return {
            "status": "mock",
            "message": f"You received {format_currency(amount)} from {sender_name} on PBX. Log in to view and use your funds.",
            "recipient": recipient_phone,
            "note": "SMS would be sent with Twilio - add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER to enable"
        }
    
    # Real Twilio implementation
    try:
        from twilio.rest import Client
        
        client = Client(twilio_sid, twilio_token)
        
        message_body = f"PBX: You received {format_currency(amount)} from {sender_name}. Log in to view and use your funds: {APP_URL}"
        
        message = client.messages.create(
            body=message_body,
            from_=twilio_phone,
            to=recipient_phone
        )
        
        logger.info(f"SMS sent to {recipient_phone}, sid: {message.sid}")
        
        return {
            "status": "sent",
            "message_sid": message.sid,
            "recipient": recipient_phone
        }
        
    except Exception as e:
        logger.error(f"Failed to send SMS to {recipient_phone}: {e}")
        return {"status": "error", "error": str(e)}


async def send_transfer_notifications(
    recipient_email: Optional[str],
    recipient_phone: Optional[str],
    recipient_user_id: str,
    sender_name: str,
    amount: float,
    note: Optional[str] = None
) -> dict:
    """
    Send both email and SMS notifications for a PBX transfer.
    
    Args:
        recipient_email: Email address (optional)
        recipient_phone: Phone number in E.164 format (optional)
        recipient_user_id: User ID of recipient
        sender_name: Display name of sender
        amount: Amount in USD
        note: Optional note from sender
    
    Returns:
        dict with email and sms status
    """
    results = {
        "email": None,
        "sms": None
    }
    
    # Send email notification
    if recipient_email:
        results["email"] = await send_transfer_email(
            recipient_email=recipient_email,
            recipient_user_id=recipient_user_id,
            sender_name=sender_name,
            amount=amount,
            note=note
        )
    
    # Send SMS notification
    if recipient_phone:
        results["sms"] = await send_transfer_sms(
            recipient_phone=recipient_phone,
            sender_name=sender_name,
            amount=amount
        )
    
    return results
