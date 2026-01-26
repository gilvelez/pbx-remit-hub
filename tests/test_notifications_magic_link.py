"""
Test Suite for Email + SMS Notification System and Magic Link Authentication
Tests notification preferences, magic link endpoints, and notification status
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://pbx-social.preview.emergentagent.com').rstrip('/')

# Test user IDs
TEST_USER_ID = "notif-test-user-001"
TEST_EMAIL = "notif-test@example.com"


class TestNotificationPreferences:
    """Tests for GET/PUT /api/notifications/preferences"""
    
    def test_get_preferences_returns_defaults(self):
        """GET /api/notifications/preferences - returns default prefs (sms_enabled: true, email_enabled: true)"""
        response = requests.get(
            f"{BASE_URL}/api/notifications/preferences",
            headers={"X-Session-Token": TEST_USER_ID}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # Default preferences should be true for both
        assert "sms_enabled" in data, "Response should contain sms_enabled"
        assert "email_enabled" in data, "Response should contain email_enabled"
        # Defaults should be True
        assert data["sms_enabled"] == True, f"Default sms_enabled should be True, got {data['sms_enabled']}"
        assert data["email_enabled"] == True, f"Default email_enabled should be True, got {data['email_enabled']}"
    
    def test_get_preferences_requires_auth(self):
        """GET /api/notifications/preferences - requires session token"""
        response = requests.get(f"{BASE_URL}/api/notifications/preferences")
        assert response.status_code == 401, f"Expected 401 without token, got {response.status_code}"
    
    def test_update_preferences_sms_disabled(self):
        """PUT /api/notifications/preferences - can disable SMS"""
        response = requests.put(
            f"{BASE_URL}/api/notifications/preferences",
            headers={
                "X-Session-Token": TEST_USER_ID,
                "Content-Type": "application/json"
            },
            json={"sms_enabled": False, "email_enabled": True}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, "Response should indicate success"
        assert data.get("sms_enabled") == False, "SMS should be disabled"
        assert data.get("email_enabled") == True, "Email should remain enabled"
    
    def test_update_preferences_email_disabled(self):
        """PUT /api/notifications/preferences - can disable Email"""
        response = requests.put(
            f"{BASE_URL}/api/notifications/preferences",
            headers={
                "X-Session-Token": TEST_USER_ID,
                "Content-Type": "application/json"
            },
            json={"sms_enabled": True, "email_enabled": False}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, "Response should indicate success"
        assert data.get("sms_enabled") == True, "SMS should be enabled"
        assert data.get("email_enabled") == False, "Email should be disabled"
    
    def test_update_preferences_both_disabled(self):
        """PUT /api/notifications/preferences - can disable both"""
        response = requests.put(
            f"{BASE_URL}/api/notifications/preferences",
            headers={
                "X-Session-Token": TEST_USER_ID,
                "Content-Type": "application/json"
            },
            json={"sms_enabled": False, "email_enabled": False}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True
        assert data.get("sms_enabled") == False
        assert data.get("email_enabled") == False
    
    def test_update_preferences_both_enabled(self):
        """PUT /api/notifications/preferences - can enable both"""
        response = requests.put(
            f"{BASE_URL}/api/notifications/preferences",
            headers={
                "X-Session-Token": TEST_USER_ID,
                "Content-Type": "application/json"
            },
            json={"sms_enabled": True, "email_enabled": True}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True
        assert data.get("sms_enabled") == True
        assert data.get("email_enabled") == True
    
    def test_update_preferences_requires_auth(self):
        """PUT /api/notifications/preferences - requires session token"""
        response = requests.put(
            f"{BASE_URL}/api/notifications/preferences",
            headers={"Content-Type": "application/json"},
            json={"sms_enabled": True, "email_enabled": True}
        )
        assert response.status_code == 401, f"Expected 401 without token, got {response.status_code}"
    
    def test_preferences_persist_after_update(self):
        """Verify preferences persist after update"""
        # First update
        requests.put(
            f"{BASE_URL}/api/notifications/preferences",
            headers={
                "X-Session-Token": TEST_USER_ID,
                "Content-Type": "application/json"
            },
            json={"sms_enabled": False, "email_enabled": True}
        )
        
        # Then GET to verify persistence
        response = requests.get(
            f"{BASE_URL}/api/notifications/preferences",
            headers={"X-Session-Token": TEST_USER_ID}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["sms_enabled"] == False, "SMS preference should persist as False"
        assert data["email_enabled"] == True, "Email preference should persist as True"
        
        # Reset to defaults
        requests.put(
            f"{BASE_URL}/api/notifications/preferences",
            headers={
                "X-Session-Token": TEST_USER_ID,
                "Content-Type": "application/json"
            },
            json={"sms_enabled": True, "email_enabled": True}
        )


class TestNotificationStatus:
    """Tests for GET /api/notifications/status"""
    
    def test_get_notification_status(self):
        """GET /api/notifications/status - shows provider status (Resend/Twilio)"""
        response = requests.get(f"{BASE_URL}/api/notifications/status")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        # Check email provider info
        assert "email" in data, "Response should contain email status"
        assert data["email"]["provider"] == "Resend", "Email provider should be Resend"
        assert "configured" in data["email"], "Email should have configured field"
        assert "mode" in data["email"], "Email should have mode field"
        
        # Check SMS provider info
        assert "sms" in data, "Response should contain sms status"
        assert data["sms"]["provider"] == "Twilio", "SMS provider should be Twilio"
        assert "configured" in data["sms"], "SMS should have configured field"
        assert "mode" in data["sms"], "SMS should have mode field"
        
        # Since API keys are not configured, should be in mock/disabled mode
        assert data["email"]["mode"] in ["live", "disabled"], f"Email mode should be live or disabled, got {data['email']['mode']}"
        assert data["sms"]["mode"] in ["live", "mock"], f"SMS mode should be live or mock, got {data['sms']['mode']}"


class TestMagicLinkVerify:
    """Tests for POST /api/auth/magic/verify"""
    
    def test_verify_invalid_token(self):
        """POST /api/auth/magic/verify - invalid token returns 401"""
        response = requests.post(
            f"{BASE_URL}/api/auth/magic/verify",
            headers={"Content-Type": "application/json"},
            json={"token": "invalid-token-12345"}
        )
        assert response.status_code == 401, f"Expected 401 for invalid token, got {response.status_code}"
        
        data = response.json()
        assert "detail" in data, "Error response should have detail"
        assert "expired" in data["detail"].lower() or "invalid" in data["detail"].lower(), \
            f"Error should mention expired or invalid: {data['detail']}"
    
    def test_verify_empty_token(self):
        """POST /api/auth/magic/verify - empty token returns error"""
        response = requests.post(
            f"{BASE_URL}/api/auth/magic/verify",
            headers={"Content-Type": "application/json"},
            json={"token": ""}
        )
        # Should return 401 or 422 for empty token
        assert response.status_code in [401, 422], f"Expected 401 or 422 for empty token, got {response.status_code}"
    
    def test_verify_missing_token(self):
        """POST /api/auth/magic/verify - missing token returns 422"""
        response = requests.post(
            f"{BASE_URL}/api/auth/magic/verify",
            headers={"Content-Type": "application/json"},
            json={}
        )
        assert response.status_code == 422, f"Expected 422 for missing token, got {response.status_code}"


class TestMagicLinkResend:
    """Tests for POST /api/auth/magic/resend"""
    
    def test_resend_valid_email(self):
        """POST /api/auth/magic/resend - sends new magic link (doesn't reveal if email exists)"""
        response = requests.post(
            f"{BASE_URL}/api/auth/magic/resend",
            headers={"Content-Type": "application/json"},
            json={"email": "test@example.com"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, "Response should indicate success"
        assert "message" in data, "Response should have message"
        # Message should not reveal if email exists
        assert "if" in data["message"].lower() or "registered" in data["message"].lower(), \
            f"Message should not reveal email existence: {data['message']}"
    
    def test_resend_nonexistent_email(self):
        """POST /api/auth/magic/resend - non-existent email returns same response (security)"""
        response = requests.post(
            f"{BASE_URL}/api/auth/magic/resend",
            headers={"Content-Type": "application/json"},
            json={"email": "nonexistent-user-xyz@example.com"}
        )
        # Should return 200 to not reveal if email exists
        assert response.status_code == 200, f"Expected 200 (security), got {response.status_code}"
        
        data = response.json()
        assert data.get("success") == True, "Should return success even for non-existent email"
    
    def test_resend_invalid_email_format(self):
        """POST /api/auth/magic/resend - invalid email format returns 422"""
        response = requests.post(
            f"{BASE_URL}/api/auth/magic/resend",
            headers={"Content-Type": "application/json"},
            json={"email": "not-an-email"}
        )
        assert response.status_code == 422, f"Expected 422 for invalid email, got {response.status_code}"
    
    def test_resend_missing_email(self):
        """POST /api/auth/magic/resend - missing email returns 422"""
        response = requests.post(
            f"{BASE_URL}/api/auth/magic/resend",
            headers={"Content-Type": "application/json"},
            json={}
        )
        assert response.status_code == 422, f"Expected 422 for missing email, got {response.status_code}"


class TestMagicLinkInfo:
    """Tests for GET /api/auth/magic/info"""
    
    def test_get_magic_link_info(self):
        """GET /api/auth/magic/info - returns expiry info (15 minutes)"""
        response = requests.get(f"{BASE_URL}/api/auth/magic/info")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "expiry_minutes" in data, "Response should contain expiry_minutes"
        assert data["expiry_minutes"] == 15, f"Expiry should be 15 minutes, got {data['expiry_minutes']}"
        assert "description" in data, "Response should contain description"
        assert "usage" in data, "Response should contain usage info"


class TestTransferNotifications:
    """Tests for notification triggers on PBX transfers"""
    
    def test_transfer_triggers_notification_in_background(self):
        """PBX transfer triggers notification in background (doesn't block transfer)"""
        # Create a transfer to a mock user
        transfer_user_id = f"notif-transfer-test-{int(time.time())}"
        
        response = requests.post(
            f"{BASE_URL}/api/internal/transfer",
            headers={
                "X-Session-Token": transfer_user_id,
                "Content-Type": "application/json"
            },
            json={
                "recipient_identifier": "maria.santos@example.com",
                "amount_usd": 50.0,
                "note": "Test notification trigger"
            }
        )
        
        # Transfer should complete quickly (not blocked by notification)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, "Transfer should succeed"
        assert data.get("status") == "completed", "Transfer should be completed"
        assert data.get("instant") == True, "Transfer should be instant"
        
        # The notification is sent in background, so we just verify transfer completed
        # Backend logs will show: "RESEND_API_KEY not configured - skipping email notification"


class TestHealthAndStatus:
    """Basic health checks"""
    
    def test_api_health(self):
        """API health check"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200, f"Health check failed: {response.status_code}"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
