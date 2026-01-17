"""
PBX Email Persistence Tests
Tests for email field in user role endpoint:
- POST /api/users/role with email field
- Email normalization (lowercase/trim)
- Email uniqueness constraint (409 on duplicate)
- GET /api/users/me returns persisted email
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestEmailPersistence:
    """Tests for email persistence in user role endpoint"""
    
    @pytest.fixture
    def session_token(self):
        """Generate a unique session token for testing"""
        return f"TEST-EMAIL-{uuid.uuid4()}"
    
    @pytest.fixture
    def unique_email(self):
        """Generate a unique email for testing"""
        return f"test_{uuid.uuid4().hex[:8]}@example.com"
    
    # ============== Email Persistence Tests ==============
    
    def test_set_role_with_email_success(self, session_token, unique_email):
        """Test setting role with email persists both fields"""
        response = requests.post(
            f"{BASE_URL}/api/users/role",
            json={"role": "recipient", "email": unique_email},
            headers={"X-Session-Token": session_token}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify response includes email
        assert data["success"] is True
        assert data["role"] == "recipient"
        assert data["email"] == unique_email.lower()  # Should be normalized
        assert "user_id" in data
        assert "updated_at" in data
    
    def test_email_normalization_lowercase(self, session_token):
        """Test email is normalized to lowercase"""
        email = f"TEST_{uuid.uuid4().hex[:8]}@EXAMPLE.COM"
        
        response = requests.post(
            f"{BASE_URL}/api/users/role",
            json={"role": "sender", "email": email},
            headers={"X-Session-Token": session_token}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Email should be lowercase
        assert data["email"] == email.lower()
        
        # Verify via GET
        get_response = requests.get(
            f"{BASE_URL}/api/users/me",
            headers={"X-Session-Token": session_token}
        )
        assert get_response.status_code == 200
        assert get_response.json()["email"] == email.lower()
    
    def test_email_normalization_trim_whitespace(self, session_token):
        """Test email is trimmed of whitespace"""
        base_email = f"test_{uuid.uuid4().hex[:8]}@example.com"
        email_with_spaces = f"  {base_email}  "
        
        response = requests.post(
            f"{BASE_URL}/api/users/role",
            json={"role": "recipient", "email": email_with_spaces},
            headers={"X-Session-Token": session_token}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Email should be trimmed
        assert data["email"] == base_email.lower()
    
    def test_get_user_returns_persisted_email(self, session_token, unique_email):
        """Test GET /api/users/me returns the persisted email"""
        # Set role with email
        set_response = requests.post(
            f"{BASE_URL}/api/users/role",
            json={"role": "recipient", "email": unique_email},
            headers={"X-Session-Token": session_token}
        )
        assert set_response.status_code == 200
        
        # Get user info
        get_response = requests.get(
            f"{BASE_URL}/api/users/me",
            headers={"X-Session-Token": session_token}
        )
        
        assert get_response.status_code == 200
        data = get_response.json()
        
        # Verify email is returned
        assert data["email"] == unique_email.lower()
        assert data["role"] == "recipient"
        assert data["user_id"] == session_token[:36]
    
    def test_set_role_without_email(self, session_token):
        """Test setting role without email still works"""
        response = requests.post(
            f"{BASE_URL}/api/users/role",
            json={"role": "sender"},  # No email field
            headers={"X-Session-Token": session_token}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
        assert data["role"] == "sender"
        # Email should be None or not present
        assert data.get("email") is None
    
    # ============== Email Uniqueness Tests ==============
    
    def test_duplicate_email_rejected(self, unique_email):
        """Test duplicate email returns 409 Conflict"""
        token1 = f"TEST-DUP1-{uuid.uuid4()}"
        token2 = f"TEST-DUP2-{uuid.uuid4()}"
        
        # First user sets email
        response1 = requests.post(
            f"{BASE_URL}/api/users/role",
            json={"role": "recipient", "email": unique_email},
            headers={"X-Session-Token": token1}
        )
        assert response1.status_code == 200
        
        # Second user tries same email - should fail
        response2 = requests.post(
            f"{BASE_URL}/api/users/role",
            json={"role": "sender", "email": unique_email},
            headers={"X-Session-Token": token2}
        )
        
        assert response2.status_code == 409
        data = response2.json()
        assert "detail" in data
        assert "already" in data["detail"].lower() or "registered" in data["detail"].lower()
    
    def test_duplicate_email_case_insensitive(self, unique_email):
        """Test duplicate email check is case-insensitive"""
        token1 = f"TEST-CASE1-{uuid.uuid4()}"
        token2 = f"TEST-CASE2-{uuid.uuid4()}"
        
        # First user sets email in lowercase
        response1 = requests.post(
            f"{BASE_URL}/api/users/role",
            json={"role": "recipient", "email": unique_email.lower()},
            headers={"X-Session-Token": token1}
        )
        assert response1.status_code == 200
        
        # Second user tries same email in UPPERCASE - should fail
        response2 = requests.post(
            f"{BASE_URL}/api/users/role",
            json={"role": "sender", "email": unique_email.upper()},
            headers={"X-Session-Token": token2}
        )
        
        assert response2.status_code == 409
    
    def test_same_user_can_update_own_email(self, session_token, unique_email):
        """Test same user can update their own email"""
        # Set initial email
        response1 = requests.post(
            f"{BASE_URL}/api/users/role",
            json={"role": "recipient", "email": unique_email},
            headers={"X-Session-Token": session_token}
        )
        assert response1.status_code == 200
        
        # Update to new email
        new_email = f"updated_{uuid.uuid4().hex[:8]}@example.com"
        response2 = requests.post(
            f"{BASE_URL}/api/users/role",
            json={"role": "recipient", "email": new_email},
            headers={"X-Session-Token": session_token}
        )
        
        assert response2.status_code == 200
        assert response2.json()["email"] == new_email.lower()
    
    def test_same_user_can_keep_same_email(self, session_token, unique_email):
        """Test same user can re-submit same email without error"""
        # Set email
        response1 = requests.post(
            f"{BASE_URL}/api/users/role",
            json={"role": "recipient", "email": unique_email},
            headers={"X-Session-Token": session_token}
        )
        assert response1.status_code == 200
        
        # Re-submit same email (e.g., role change)
        response2 = requests.post(
            f"{BASE_URL}/api/users/role",
            json={"role": "sender", "email": unique_email},
            headers={"X-Session-Token": session_token}
        )
        
        # Should succeed - same user updating their own record
        assert response2.status_code == 200
        assert response2.json()["email"] == unique_email.lower()
        assert response2.json()["role"] == "sender"
    
    # ============== Edge Cases ==============
    
    def test_email_with_null_value(self, session_token):
        """Test setting email to null explicitly"""
        response = requests.post(
            f"{BASE_URL}/api/users/role",
            json={"role": "recipient", "email": None},
            headers={"X-Session-Token": session_token}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        # Email should be None
        assert data.get("email") is None
    
    def test_email_with_empty_string(self, session_token):
        """Test setting email to empty string"""
        response = requests.post(
            f"{BASE_URL}/api/users/role",
            json={"role": "recipient", "email": ""},
            headers={"X-Session-Token": session_token}
        )
        
        # Should succeed - empty string treated as no email
        assert response.status_code == 200


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
