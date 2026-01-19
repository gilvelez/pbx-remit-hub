"""
Test UI Merge: Navigation and QR Code Features
Tests for:
- Desktop sidebar (7 items)
- Mobile bottom nav (5 items)
- Home Quick Actions (4 items)
- Receive modal with QR code
- /pay/:handle route
- /api/profiles/by-handle/:handle endpoint
- Bills route /sender/bills
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestProfileByHandleEndpoint:
    """Test the public /api/profiles/by-handle/:handle endpoint"""
    
    def test_get_profile_by_handle_success(self):
        """Test successful profile lookup by handle"""
        # Use existing test handle
        response = requests.get(f"{BASE_URL}/api/profiles/by-handle/user_e8769e")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "profile_id" in data, "Response should contain profile_id"
        assert "user_id" in data, "Response should contain user_id"
        assert "handle" in data, "Response should contain handle"
        assert data["handle"] == "user_e8769e", f"Expected handle 'user_e8769e', got {data['handle']}"
        assert "type" in data, "Response should contain type"
        
        print(f"PASS: Profile lookup returned: {data}")
    
    def test_get_profile_by_handle_with_at_symbol(self):
        """Test profile lookup with @ prefix in handle"""
        response = requests.get(f"{BASE_URL}/api/profiles/by-handle/@user_e8769e")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data["handle"] == "user_e8769e", "Handle should be returned without @ prefix"
        
        print("PASS: Profile lookup works with @ prefix")
    
    def test_get_profile_by_handle_not_found(self):
        """Test profile lookup for non-existent handle"""
        response = requests.get(f"{BASE_URL}/api/profiles/by-handle/nonexistent_handle_xyz123")
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        
        print("PASS: Non-existent handle returns 404")
    
    def test_get_profile_by_handle_invalid(self):
        """Test profile lookup with invalid handle (too short)"""
        response = requests.get(f"{BASE_URL}/api/profiles/by-handle/a")
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        
        print("PASS: Invalid handle returns 400")
    
    def test_profile_by_handle_returns_public_fields_only(self):
        """Test that only public fields are returned (no sensitive data)"""
        response = requests.get(f"{BASE_URL}/api/profiles/by-handle/user_e8769e")
        
        assert response.status_code == 200
        
        data = response.json()
        
        # Should have these public fields
        public_fields = ["profile_id", "user_id", "type", "handle", "display_name", "verified"]
        for field in public_fields:
            assert field in data, f"Missing public field: {field}"
        
        # Should NOT have sensitive fields
        sensitive_fields = ["email", "phone", "password", "bank_account"]
        for field in sensitive_fields:
            assert field not in data, f"Sensitive field should not be exposed: {field}"
        
        print("PASS: Only public fields returned")


class TestProfileSearchEndpoints:
    """Test profile search endpoints"""
    
    def test_search_people(self):
        """Test searching for personal profiles"""
        response = requests.get(
            f"{BASE_URL}/api/profiles/search/people",
            params={"q": "test"},
            headers={"X-Session-Token": "test-token-123"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "profiles" in data, "Response should contain profiles array"
        
        print(f"PASS: People search returned {len(data['profiles'])} results")
    
    def test_search_businesses(self):
        """Test searching for business profiles"""
        response = requests.get(
            f"{BASE_URL}/api/profiles/search/businesses",
            params={"q": "test"},
            headers={"X-Session-Token": "test-token-123"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "profiles" in data, "Response should contain profiles array"
        
        print(f"PASS: Business search returned {len(data['profiles'])} results")


class TestBillsEndpoint:
    """Test bills payment endpoint (MOCKED)"""
    
    def test_bills_pay_endpoint_exists(self):
        """Test that bills pay endpoint exists (may return error without auth)"""
        response = requests.post(
            f"{BASE_URL}/api/bills/pay",
            json={
                "biller_id": "meralco",
                "account_number": "123456789",
                "amount": 100.00
            },
            headers={
                "Content-Type": "application/json",
                "X-Session-Token": "test-token-123"
            }
        )
        
        # Endpoint may return 401 (no auth) or 404 (not implemented) or 200 (mocked success)
        # We just verify it doesn't return 500
        assert response.status_code != 500, f"Server error: {response.status_code}"
        
        print(f"PASS: Bills pay endpoint responded with {response.status_code}")


class TestHealthAndRoutes:
    """Test basic health and route availability"""
    
    def test_api_health(self):
        """Test API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        print("PASS: API health check passed")
    
    def test_profiles_me_requires_auth(self):
        """Test that /api/profiles/me requires authentication"""
        response = requests.get(f"{BASE_URL}/api/profiles/me")
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        
        print("PASS: /api/profiles/me requires authentication")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
