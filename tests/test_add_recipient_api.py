"""
Test Add Recipient Page APIs
Tests for:
- /api/internal/lookup - PBX user lookup
- /api/users/search - User search
- /api/internal/invite - Invite non-PBX users
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test session token
TEST_TOKEN = f"test-recipient-{uuid.uuid4().hex[:8]}"

def get_headers(token=None):
    return {
        "Content-Type": "application/json",
        "X-Session-Token": token or TEST_TOKEN
    }


class TestInternalLookup:
    """Tests for /api/internal/lookup endpoint - PBX user lookup"""
    
    def test_lookup_requires_auth(self):
        """Lookup should require authentication"""
        response = requests.post(
            f"{BASE_URL}/api/internal/lookup",
            json={"identifier": "test@example.com"},
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 401
        print("PASS: Lookup requires auth - returns 401 without token")
    
    def test_lookup_mock_user_maria(self):
        """Lookup should find mock user maria.santos@example.com"""
        response = requests.post(
            f"{BASE_URL}/api/internal/lookup",
            json={"identifier": "maria.santos@example.com"},
            headers=get_headers()
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("found") == True
        assert "user" in data
        assert data["user"]["email"] == "maria.santos@example.com"
        assert "display_name" in data["user"]
        print(f"PASS: Found mock user maria.santos - display_name: {data['user'].get('display_name')}")
    
    def test_lookup_mock_user_juan(self):
        """Lookup should find mock user juan.delacruz@example.com"""
        response = requests.post(
            f"{BASE_URL}/api/internal/lookup",
            json={"identifier": "juan.delacruz@example.com"},
            headers=get_headers()
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("found") == True
        assert "user" in data
        assert data["user"]["email"] == "juan.delacruz@example.com"
        print(f"PASS: Found mock user juan.delacruz - display_name: {data['user'].get('display_name')}")
    
    def test_lookup_mock_user_anna(self):
        """Lookup should find mock user anna.reyes@example.com"""
        response = requests.post(
            f"{BASE_URL}/api/internal/lookup",
            json={"identifier": "anna.reyes@example.com"},
            headers=get_headers()
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("found") == True
        assert "user" in data
        assert data["user"]["email"] == "anna.reyes@example.com"
        print(f"PASS: Found mock user anna.reyes - display_name: {data['user'].get('display_name')}")
    
    def test_lookup_nonexistent_user(self):
        """Lookup should return found=false for non-existent user"""
        response = requests.post(
            f"{BASE_URL}/api/internal/lookup",
            json={"identifier": "nonexistent@test.com"},
            headers=get_headers()
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("found") == False
        assert "message" in data
        print(f"PASS: Non-existent user returns found=false with message: {data.get('message')}")
    
    def test_lookup_by_phone(self):
        """Lookup should work with phone number"""
        response = requests.post(
            f"{BASE_URL}/api/internal/lookup",
            json={"identifier": "+639171234567"},
            headers=get_headers()
        )
        assert response.status_code == 200
        data = response.json()
        # Should find maria.santos who has this phone
        assert data.get("found") == True
        print(f"PASS: Lookup by phone works - found: {data.get('found')}")
    
    def test_lookup_case_insensitive(self):
        """Lookup should be case-insensitive for email"""
        response = requests.post(
            f"{BASE_URL}/api/internal/lookup",
            json={"identifier": "MARIA.SANTOS@EXAMPLE.COM"},
            headers=get_headers()
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("found") == True
        print("PASS: Lookup is case-insensitive")


class TestUserSearch:
    """Tests for /api/users/search endpoint"""
    
    def test_search_requires_min_length(self):
        """Search should require minimum 2 characters"""
        response = requests.get(
            f"{BASE_URL}/api/users/search?q=a",
            headers=get_headers()
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("users") == []
        print("PASS: Search requires min 2 characters")
    
    def test_search_empty_query(self):
        """Search with empty query returns empty results"""
        response = requests.get(
            f"{BASE_URL}/api/users/search?q=",
            headers=get_headers()
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("users") == []
        print("PASS: Empty search returns empty results")
    
    def test_search_returns_users_array(self):
        """Search should return users array"""
        response = requests.get(
            f"{BASE_URL}/api/users/search?q=test",
            headers=get_headers()
        )
        assert response.status_code == 200
        data = response.json()
        assert "users" in data
        assert isinstance(data["users"], list)
        print(f"PASS: Search returns users array with {len(data['users'])} results")


class TestInternalInvite:
    """Tests for /api/internal/invite endpoint"""
    
    def test_invite_generates_message(self):
        """Invite should generate invite message"""
        response = requests.post(
            f"{BASE_URL}/api/internal/invite",
            json={"identifier": "friend@example.com"},
            headers=get_headers()
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert "message" in data
        assert "invite_link" in data
        assert "friend@example.com" in data["message"]
        print(f"PASS: Invite generates message with link: {data.get('invite_link')}")
    
    def test_invite_with_phone(self):
        """Invite should work with phone number"""
        response = requests.post(
            f"{BASE_URL}/api/internal/invite",
            json={"identifier": "+639171234567"},
            headers=get_headers()
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert "+639171234567" in data["message"]
        print("PASS: Invite works with phone number")


class TestHealthCheck:
    """Basic health check"""
    
    def test_health_endpoint(self):
        """Health endpoint should return healthy"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        print("PASS: Health check returns healthy")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
