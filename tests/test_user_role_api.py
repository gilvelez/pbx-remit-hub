"""
PBX User Role API Tests
Tests for session persistence and role management endpoints:
- POST /api/users/role - Set user role (sender/recipient)
- GET /api/users/me - Get current user info including role
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestUserRoleAPI:
    """Tests for user role persistence endpoints"""
    
    @pytest.fixture
    def session_token(self):
        """Generate a unique session token for testing"""
        return f"TEST-{uuid.uuid4()}"
    
    @pytest.fixture
    def existing_recipient_token(self):
        """Token for existing recipient user in DB"""
        return "test-token-123-456-789-abc"
    
    @pytest.fixture
    def existing_sender_token(self):
        """Token for existing sender user in DB"""
        return "sender-token-123-456-789"
    
    # ============== POST /api/users/role Tests ==============
    
    def test_set_role_sender_success(self, session_token):
        """Test setting role to 'sender' succeeds"""
        response = requests.post(
            f"{BASE_URL}/api/users/role",
            json={"role": "sender"},
            headers={"X-Session-Token": session_token}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert data["success"] is True
        assert data["role"] == "sender"
        assert "user_id" in data
        assert "updated_at" in data
        
        # Verify user_id matches token prefix
        assert data["user_id"] == session_token[:36]
    
    def test_set_role_recipient_success(self, session_token):
        """Test setting role to 'recipient' succeeds"""
        response = requests.post(
            f"{BASE_URL}/api/users/role",
            json={"role": "recipient"},
            headers={"X-Session-Token": session_token}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
        assert data["role"] == "recipient"
        assert "user_id" in data
    
    def test_set_role_invalid_role(self, session_token):
        """Test setting invalid role returns 400"""
        response = requests.post(
            f"{BASE_URL}/api/users/role",
            json={"role": "admin"},  # Invalid role
            headers={"X-Session-Token": session_token}
        )
        
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
        assert "sender" in data["detail"].lower() or "recipient" in data["detail"].lower()
    
    def test_set_role_no_token(self):
        """Test setting role without session token returns 401"""
        response = requests.post(
            f"{BASE_URL}/api/users/role",
            json={"role": "sender"}
            # No X-Session-Token header
        )
        
        assert response.status_code == 401
        data = response.json()
        assert "detail" in data
    
    def test_set_role_empty_token(self):
        """Test setting role with empty session token returns 401"""
        response = requests.post(
            f"{BASE_URL}/api/users/role",
            json={"role": "sender"},
            headers={"X-Session-Token": ""}
        )
        
        assert response.status_code == 401
    
    def test_set_role_updates_existing_user(self, session_token):
        """Test that setting role updates existing user (upsert)"""
        # First set role to sender
        response1 = requests.post(
            f"{BASE_URL}/api/users/role",
            json={"role": "sender"},
            headers={"X-Session-Token": session_token}
        )
        assert response1.status_code == 200
        
        # Then update to recipient
        response2 = requests.post(
            f"{BASE_URL}/api/users/role",
            json={"role": "recipient"},
            headers={"X-Session-Token": session_token}
        )
        assert response2.status_code == 200
        
        # Verify role was updated
        data = response2.json()
        assert data["role"] == "recipient"
        
        # Verify via GET
        get_response = requests.get(
            f"{BASE_URL}/api/users/me",
            headers={"X-Session-Token": session_token}
        )
        assert get_response.status_code == 200
        assert get_response.json()["role"] == "recipient"
    
    # ============== GET /api/users/me Tests ==============
    
    def test_get_user_existing_recipient(self, existing_recipient_token):
        """Test getting existing recipient user info"""
        response = requests.get(
            f"{BASE_URL}/api/users/me",
            headers={"X-Session-Token": existing_recipient_token}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "user_id" in data
        assert "role" in data
        assert data["role"] == "recipient"
    
    def test_get_user_existing_sender(self, existing_sender_token):
        """Test getting existing sender user info"""
        response = requests.get(
            f"{BASE_URL}/api/users/me",
            headers={"X-Session-Token": existing_sender_token}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "user_id" in data
        assert "role" in data
        assert data["role"] == "sender"
    
    def test_get_user_new_user(self, session_token):
        """Test getting user info for new user returns null role"""
        response = requests.get(
            f"{BASE_URL}/api/users/me",
            headers={"X-Session-Token": session_token}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # New user should have null role
        assert "user_id" in data
        assert data["role"] is None
    
    def test_get_user_no_token(self):
        """Test getting user without session token returns 401"""
        response = requests.get(f"{BASE_URL}/api/users/me")
        
        assert response.status_code == 401
        data = response.json()
        assert "detail" in data
    
    def test_get_user_after_set_role(self, session_token):
        """Test GET returns correct role after POST"""
        # Set role
        set_response = requests.post(
            f"{BASE_URL}/api/users/role",
            json={"role": "sender"},
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
        assert data["role"] == "sender"
        assert data["user_id"] == session_token[:36]
    
    # ============== Data Persistence Tests ==============
    
    def test_role_persists_in_database(self, session_token):
        """Test that role is actually persisted in MongoDB"""
        # Set role
        requests.post(
            f"{BASE_URL}/api/users/role",
            json={"role": "recipient"},
            headers={"X-Session-Token": session_token}
        )
        
        # Multiple GET requests should return same role
        for _ in range(3):
            response = requests.get(
                f"{BASE_URL}/api/users/me",
                headers={"X-Session-Token": session_token}
            )
            assert response.status_code == 200
            assert response.json()["role"] == "recipient"
    
    def test_response_excludes_mongodb_id(self, existing_recipient_token):
        """Test that MongoDB _id is not in response"""
        response = requests.get(
            f"{BASE_URL}/api/users/me",
            headers={"X-Session-Token": existing_recipient_token}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Should not contain MongoDB _id
        assert "_id" not in data


class TestHealthEndpoint:
    """Basic health check tests"""
    
    def test_health_endpoint(self):
        """Test health endpoint returns healthy status"""
        response = requests.get(f"{BASE_URL}/api/health")
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
