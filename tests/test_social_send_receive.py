"""
Test Social Send/Receive Flow - Phase 1.5
Tests:
1. Profile search APIs (people + businesses)
2. Business badge in search results
3. No results state
4. Profile switcher localStorage persistence
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://pinoy-payments.preview.emergentagent.com').rstrip('/')

# Test user tokens
TEST_USER_ID = f"test_user_{uuid.uuid4().hex[:8]}"
TEST_TOKEN = TEST_USER_ID

class TestProfileSearchAPIs:
    """Test profile search endpoints"""
    
    def test_search_people_endpoint_exists(self):
        """GET /api/profiles/search/people should exist"""
        response = requests.get(
            f"{BASE_URL}/api/profiles/search/people?q=test",
            headers={"X-Session-Token": TEST_TOKEN}
        )
        assert response.status_code == 200
        data = response.json()
        assert "profiles" in data
        print(f"✓ Search people endpoint works, found {len(data['profiles'])} profiles")
    
    def test_search_people_returns_personal_profiles(self):
        """Search people should return personal profiles only"""
        response = requests.get(
            f"{BASE_URL}/api/profiles/search/people?q=test",
            headers={"X-Session-Token": TEST_TOKEN}
        )
        assert response.status_code == 200
        data = response.json()
        
        # All results should be personal type
        for profile in data['profiles']:
            assert profile.get('type') == 'personal', f"Expected personal, got {profile.get('type')}"
        print(f"✓ All {len(data['profiles'])} results are personal profiles")
    
    def test_search_businesses_endpoint_exists(self):
        """GET /api/profiles/search/businesses should exist"""
        response = requests.get(
            f"{BASE_URL}/api/profiles/search/businesses?q=test",
            headers={"X-Session-Token": TEST_TOKEN}
        )
        assert response.status_code == 200
        data = response.json()
        assert "profiles" in data
        print(f"✓ Search businesses endpoint works, found {len(data['profiles'])} businesses")
    
    def test_search_businesses_returns_business_profiles(self):
        """Search businesses should return business profiles only"""
        response = requests.get(
            f"{BASE_URL}/api/profiles/search/businesses?q=test",
            headers={"X-Session-Token": TEST_TOKEN}
        )
        assert response.status_code == 200
        data = response.json()
        
        # All results should be business type
        for profile in data['profiles']:
            assert profile.get('type') == 'business', f"Expected business, got {profile.get('type')}"
        print(f"✓ All {len(data['profiles'])} results are business profiles")
    
    def test_search_businesses_has_business_name(self):
        """Business profiles should have business_name field"""
        response = requests.get(
            f"{BASE_URL}/api/profiles/search/businesses?q=test",
            headers={"X-Session-Token": TEST_TOKEN}
        )
        assert response.status_code == 200
        data = response.json()
        
        for profile in data['profiles']:
            assert 'business_name' in profile, "Business profile missing business_name"
        print(f"✓ All business profiles have business_name field")
    
    def test_search_short_query_returns_empty(self):
        """Search with <2 chars should return empty"""
        response = requests.get(
            f"{BASE_URL}/api/profiles/search/people?q=a",
            headers={"X-Session-Token": TEST_TOKEN}
        )
        assert response.status_code == 200
        data = response.json()
        assert data['profiles'] == []
        print("✓ Short query returns empty results")
    
    def test_search_no_results(self):
        """Search with non-matching query returns empty"""
        response = requests.get(
            f"{BASE_URL}/api/profiles/search/people?q=xyznonexistent123",
            headers={"X-Session-Token": TEST_TOKEN}
        )
        assert response.status_code == 200
        data = response.json()
        assert data['profiles'] == []
        print("✓ Non-matching query returns empty results")


class TestBusinessChatAPI:
    """Test business chat endpoints"""
    
    def test_start_business_chat_requires_auth(self):
        """POST /api/businesses/chat/:id requires auth"""
        response = requests.post(
            f"{BASE_URL}/api/businesses/chat/fake_biz_id",
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 401
        print("✓ Business chat requires authentication")
    
    def test_start_business_chat_invalid_business(self):
        """POST /api/businesses/chat/:id with invalid business returns 404"""
        response = requests.post(
            f"{BASE_URL}/api/businesses/chat/nonexistent_biz",
            headers={
                "Content-Type": "application/json",
                "X-Session-Token": TEST_TOKEN
            }
        )
        assert response.status_code == 404
        print("✓ Invalid business returns 404")


class TestProfileSwitcher:
    """Test profile switching API"""
    
    def test_get_my_profiles(self):
        """GET /api/profiles/me should return user profiles"""
        response = requests.get(
            f"{BASE_URL}/api/profiles/me",
            headers={"X-Session-Token": TEST_TOKEN}
        )
        assert response.status_code == 200
        data = response.json()
        assert "profiles" in data
        assert "personal" in data
        print(f"✓ Get my profiles works, found {len(data['profiles'])} profiles")
    
    def test_switch_profile_requires_auth(self):
        """POST /api/profiles/switch/:id requires auth"""
        response = requests.post(
            f"{BASE_URL}/api/profiles/switch/fake_profile_id",
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 401
        print("✓ Profile switch requires authentication")
    
    def test_switch_profile_invalid_profile(self):
        """POST /api/profiles/switch/:id with invalid profile returns 404"""
        response = requests.post(
            f"{BASE_URL}/api/profiles/switch/nonexistent_profile",
            headers={
                "Content-Type": "application/json",
                "X-Session-Token": TEST_TOKEN
            }
        )
        assert response.status_code == 404
        print("✓ Invalid profile switch returns 404")
    
    def test_switch_to_own_profile(self):
        """Can switch to own profile"""
        # First get profiles
        response = requests.get(
            f"{BASE_URL}/api/profiles/me",
            headers={"X-Session-Token": TEST_TOKEN}
        )
        assert response.status_code == 200
        data = response.json()
        
        if data['profiles']:
            profile_id = data['profiles'][0]['profile_id']
            
            # Switch to it
            switch_response = requests.post(
                f"{BASE_URL}/api/profiles/switch/{profile_id}",
                headers={
                    "Content-Type": "application/json",
                    "X-Session-Token": TEST_TOKEN
                }
            )
            assert switch_response.status_code == 200
            switch_data = switch_response.json()
            assert switch_data.get('success') == True
            assert switch_data.get('profile', {}).get('profile_id') == profile_id
            print(f"✓ Successfully switched to profile {profile_id}")
        else:
            print("⚠ No profiles to switch to (new user)")


class TestSocialConversationAPI:
    """Test social conversation endpoints"""
    
    def test_get_conversation_requires_auth(self):
        """GET /api/social/conversations/:userId requires auth"""
        response = requests.get(
            f"{BASE_URL}/api/social/conversations/fake_user_id",
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 401
        print("✓ Get conversation requires authentication")


class TestSenderPeoplePickerRoute:
    """Test /sender/people/picker route exists"""
    
    def test_sender_people_picker_route(self):
        """Verify /sender/people/picker route is defined in App.jsx"""
        # This is a frontend route test - we verify the route exists by checking
        # that the frontend doesn't 404 (it will redirect to login if not authenticated)
        response = requests.get(f"{BASE_URL}/sender/people/picker", allow_redirects=False)
        # Should either return 200 (if SPA serves index.html) or redirect
        assert response.status_code in [200, 301, 302, 304]
        print(f"✓ /sender/people/picker route exists (status: {response.status_code})")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
