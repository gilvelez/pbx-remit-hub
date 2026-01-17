"""
PBX Phase 1 - Profiles and Businesses API Tests
Tests for:
- Profiles API: /api/profiles/* (personal, business profiles, search)
- Businesses API: /api/businesses/* (discover, categories, chat, pay)
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Generate unique test user IDs for isolation
TEST_USER_ID = f"test-profiles-{uuid.uuid4().hex[:8]}"
TEST_USER_ID_2 = f"test-profiles-{uuid.uuid4().hex[:8]}"


@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="module")
def auth_headers():
    """Headers with session token for user 1"""
    return {
        "Content-Type": "application/json",
        "X-Session-Token": TEST_USER_ID,
    }


@pytest.fixture(scope="module")
def auth_headers_user2():
    """Headers with session token for user 2"""
    return {
        "Content-Type": "application/json",
        "X-Session-Token": TEST_USER_ID_2,
    }


class TestHealthCheck:
    """Basic health check"""
    
    def test_health_endpoint(self, api_client):
        """GET /api/health - should return healthy"""
        response = api_client.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        print("✓ Health check passed")


class TestProfilesAPI:
    """Tests for /api/profiles/* endpoints"""
    
    # ============================================================
    # GET /api/profiles/me - Get user profiles
    # ============================================================
    
    def test_get_profiles_requires_auth(self, api_client):
        """GET /api/profiles/me - requires session token"""
        response = api_client.get(f"{BASE_URL}/api/profiles/me")
        assert response.status_code == 401
        print("✓ GET /api/profiles/me requires auth")
    
    def test_get_profiles_auto_creates_personal(self, api_client, auth_headers):
        """GET /api/profiles/me - auto-creates personal profile if none exists"""
        response = api_client.get(f"{BASE_URL}/api/profiles/me", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        # Should have profiles array
        assert "profiles" in data
        assert isinstance(data["profiles"], list)
        assert len(data["profiles"]) >= 1
        
        # Should have personal profile
        assert "personal" in data
        personal = data["personal"]
        assert personal is not None
        assert personal.get("type") == "personal"
        assert "profile_id" in personal
        
        # Should have businesses array (empty initially)
        assert "businesses" in data
        assert isinstance(data["businesses"], list)
        
        print(f"✓ GET /api/profiles/me returns profiles (personal profile_id: {personal.get('profile_id')})")
        return personal
    
    # ============================================================
    # POST /api/profiles/business - Create business profile
    # ============================================================
    
    def test_create_business_requires_auth(self, api_client):
        """POST /api/profiles/business - requires session token"""
        response = api_client.post(f"{BASE_URL}/api/profiles/business", json={
            "business_name": "Test Business",
            "handle": "testbiz"
        })
        assert response.status_code == 401
        print("✓ POST /api/profiles/business requires auth")
    
    def test_create_business_validates_handle(self, api_client, auth_headers):
        """POST /api/profiles/business - validates handle format"""
        # Handle too short
        response = api_client.post(f"{BASE_URL}/api/profiles/business", headers=auth_headers, json={
            "business_name": "Test Business",
            "handle": "ab"  # Too short (min 3)
        })
        assert response.status_code == 422
        print("✓ POST /api/profiles/business validates handle length")
    
    def test_create_business_success(self, api_client, auth_headers):
        """POST /api/profiles/business - creates business profile"""
        unique_handle = f"testbiz_{uuid.uuid4().hex[:6]}"
        response = api_client.post(f"{BASE_URL}/api/profiles/business", headers=auth_headers, json={
            "business_name": "Test Business Inc",
            "handle": unique_handle,
            "category": "Technology"
        })
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("success") is True
        assert "profile" in data
        profile = data["profile"]
        assert profile.get("type") == "business"
        assert profile.get("business_name") == "Test Business Inc"
        assert profile.get("handle") == unique_handle
        assert profile.get("category") == "Technology"
        assert "profile_id" in profile
        assert profile["profile_id"].startswith("biz_")
        
        print(f"✓ POST /api/profiles/business creates business (profile_id: {profile.get('profile_id')})")
        return profile
    
    def test_create_business_handle_uniqueness(self, api_client, auth_headers, auth_headers_user2):
        """POST /api/profiles/business - enforces handle uniqueness"""
        unique_handle = f"uniquebiz_{uuid.uuid4().hex[:6]}"
        
        # First user creates business with handle
        response1 = api_client.post(f"{BASE_URL}/api/profiles/business", headers=auth_headers, json={
            "business_name": "First Business",
            "handle": unique_handle
        })
        assert response1.status_code == 200
        
        # Second user tries same handle - should fail
        response2 = api_client.post(f"{BASE_URL}/api/profiles/business", headers=auth_headers_user2, json={
            "business_name": "Second Business",
            "handle": unique_handle
        })
        assert response2.status_code == 409
        data = response2.json()
        assert "already taken" in data.get("detail", "").lower()
        
        print("✓ POST /api/profiles/business enforces handle uniqueness")
    
    # ============================================================
    # POST /api/profiles/switch/{profile_id} - Switch active profile
    # ============================================================
    
    def test_switch_profile_requires_auth(self, api_client):
        """POST /api/profiles/switch/{profile_id} - requires session token"""
        response = api_client.post(f"{BASE_URL}/api/profiles/switch/some-profile-id")
        assert response.status_code == 401
        print("✓ POST /api/profiles/switch requires auth")
    
    def test_switch_profile_not_found(self, api_client, auth_headers):
        """POST /api/profiles/switch/{profile_id} - returns 404 for invalid profile"""
        response = api_client.post(f"{BASE_URL}/api/profiles/switch/invalid-profile-id", headers=auth_headers)
        assert response.status_code == 404
        print("✓ POST /api/profiles/switch returns 404 for invalid profile")
    
    def test_switch_profile_success(self, api_client, auth_headers):
        """POST /api/profiles/switch/{profile_id} - switches active profile"""
        # First get profiles to find a valid profile_id
        profiles_response = api_client.get(f"{BASE_URL}/api/profiles/me", headers=auth_headers)
        assert profiles_response.status_code == 200
        profiles_data = profiles_response.json()
        
        personal_profile = profiles_data.get("personal")
        assert personal_profile is not None
        profile_id = personal_profile.get("profile_id")
        
        # Switch to personal profile
        response = api_client.post(f"{BASE_URL}/api/profiles/switch/{profile_id}", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("success") is True
        assert "profile" in data
        assert data["profile"]["profile_id"] == profile_id
        
        print(f"✓ POST /api/profiles/switch/{profile_id} switches profile successfully")
    
    # ============================================================
    # GET /api/profiles/search/people - Search personal profiles
    # ============================================================
    
    def test_search_people_requires_min_query(self, api_client, auth_headers):
        """GET /api/profiles/search/people - requires min 2 chars"""
        response = api_client.get(f"{BASE_URL}/api/profiles/search/people?q=a", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data.get("profiles") == []
        print("✓ GET /api/profiles/search/people requires min 2 chars")
    
    def test_search_people_returns_results(self, api_client, auth_headers):
        """GET /api/profiles/search/people - returns personal profiles"""
        # Search for a common term that might match test users
        response = api_client.get(f"{BASE_URL}/api/profiles/search/people?q=test", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        assert "profiles" in data
        assert isinstance(data["profiles"], list)
        
        # If results exist, verify structure
        for profile in data["profiles"]:
            assert profile.get("type") == "personal"
            assert "profile_id" in profile
        
        print(f"✓ GET /api/profiles/search/people returns {len(data['profiles'])} results")
    
    # ============================================================
    # GET /api/profiles/search/businesses - Search business profiles
    # ============================================================
    
    def test_search_businesses_requires_min_query(self, api_client, auth_headers):
        """GET /api/profiles/search/businesses - requires min 2 chars"""
        response = api_client.get(f"{BASE_URL}/api/profiles/search/businesses?q=a", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data.get("profiles") == []
        print("✓ GET /api/profiles/search/businesses requires min 2 chars")
    
    def test_search_businesses_returns_results(self, api_client, auth_headers):
        """GET /api/profiles/search/businesses - returns business profiles"""
        # Search for test businesses we created
        response = api_client.get(f"{BASE_URL}/api/profiles/search/businesses?q=test", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        assert "profiles" in data
        assert isinstance(data["profiles"], list)
        
        # If results exist, verify structure
        for profile in data["profiles"]:
            assert profile.get("type") == "business"
            assert "profile_id" in profile
            assert "business_name" in profile
        
        print(f"✓ GET /api/profiles/search/businesses returns {len(data['profiles'])} results")


class TestBusinessesAPI:
    """Tests for /api/businesses/* endpoints"""
    
    # ============================================================
    # GET /api/businesses/discover - Discover businesses
    # ============================================================
    
    def test_discover_businesses(self, api_client, auth_headers):
        """GET /api/businesses/discover - returns list of businesses"""
        response = api_client.get(f"{BASE_URL}/api/businesses/discover", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        assert "businesses" in data
        assert isinstance(data["businesses"], list)
        
        # Verify structure of business items
        for biz in data["businesses"]:
            assert "profile_id" in biz
            assert biz.get("type") == "business"
            assert "business_name" in biz
            assert "handle" in biz
        
        print(f"✓ GET /api/businesses/discover returns {len(data['businesses'])} businesses")
    
    def test_discover_businesses_by_category(self, api_client, auth_headers):
        """GET /api/businesses/discover?category=X - filters by category"""
        response = api_client.get(f"{BASE_URL}/api/businesses/discover?category=Technology", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        assert "businesses" in data
        assert isinstance(data["businesses"], list)
        
        print(f"✓ GET /api/businesses/discover?category=Technology returns {len(data['businesses'])} businesses")
    
    # ============================================================
    # GET /api/businesses/categories - Get category list
    # ============================================================
    
    def test_get_categories(self, api_client, auth_headers):
        """GET /api/businesses/categories - returns category list"""
        response = api_client.get(f"{BASE_URL}/api/businesses/categories", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        assert "categories" in data
        assert isinstance(data["categories"], list)
        assert len(data["categories"]) > 0
        
        # Verify expected categories exist
        expected_categories = ["Retail & Shopping", "Food & Dining", "Services", "Technology"]
        for cat in expected_categories:
            assert cat in data["categories"], f"Expected category '{cat}' not found"
        
        print(f"✓ GET /api/businesses/categories returns {len(data['categories'])} categories")
    
    # ============================================================
    # POST /api/businesses/chat/{profile_id} - Start business chat
    # ============================================================
    
    def test_business_chat_requires_auth(self, api_client):
        """POST /api/businesses/chat/{profile_id} - requires session token"""
        response = api_client.post(f"{BASE_URL}/api/businesses/chat/some-profile-id")
        assert response.status_code == 401
        print("✓ POST /api/businesses/chat requires auth")
    
    def test_business_chat_not_found(self, api_client, auth_headers):
        """POST /api/businesses/chat/{profile_id} - returns 404 for invalid business"""
        response = api_client.post(f"{BASE_URL}/api/businesses/chat/invalid-biz-id", headers=auth_headers)
        assert response.status_code == 404
        print("✓ POST /api/businesses/chat returns 404 for invalid business")
    
    def test_business_chat_success(self, api_client, auth_headers):
        """POST /api/businesses/chat/{profile_id} - creates conversation with business"""
        # First discover businesses to get a valid profile_id
        discover_response = api_client.get(f"{BASE_URL}/api/businesses/discover", headers=auth_headers)
        assert discover_response.status_code == 200
        businesses = discover_response.json().get("businesses", [])
        
        if not businesses:
            pytest.skip("No businesses available to test chat")
        
        business = businesses[0]
        business_profile_id = business.get("profile_id")
        
        # Start chat with business
        response = api_client.post(f"{BASE_URL}/api/businesses/chat/{business_profile_id}", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        assert "conversation_id" in data
        assert "business" in data
        assert data["business"]["profile_id"] == business_profile_id
        
        print(f"✓ POST /api/businesses/chat/{business_profile_id} creates conversation (id: {data['conversation_id']})")
        return data
    
    # ============================================================
    # POST /api/businesses/pay - Pay a business
    # ============================================================
    
    def test_business_pay_requires_auth(self, api_client):
        """POST /api/businesses/pay - requires session token"""
        response = api_client.post(f"{BASE_URL}/api/businesses/pay", json={
            "business_profile_id": "some-id",
            "amount_usd": 10.0
        })
        assert response.status_code == 401
        print("✓ POST /api/businesses/pay requires auth")
    
    def test_business_pay_validates_amount(self, api_client, auth_headers):
        """POST /api/businesses/pay - validates amount > 0"""
        response = api_client.post(f"{BASE_URL}/api/businesses/pay", headers=auth_headers, json={
            "business_profile_id": "some-id",
            "amount_usd": 0
        })
        assert response.status_code == 422
        print("✓ POST /api/businesses/pay validates amount > 0")
    
    def test_business_pay_not_found(self, api_client, auth_headers):
        """POST /api/businesses/pay - returns 404 for invalid business"""
        response = api_client.post(f"{BASE_URL}/api/businesses/pay", headers=auth_headers, json={
            "business_profile_id": "invalid-biz-id",
            "amount_usd": 10.0
        })
        assert response.status_code == 404
        print("✓ POST /api/businesses/pay returns 404 for invalid business")
    
    def test_business_pay_success(self, api_client, auth_headers):
        """POST /api/businesses/pay - sends payment to business"""
        # First discover businesses to get a valid profile_id
        discover_response = api_client.get(f"{BASE_URL}/api/businesses/discover", headers=auth_headers)
        assert discover_response.status_code == 200
        businesses = discover_response.json().get("businesses", [])
        
        if not businesses:
            pytest.skip("No businesses available to test payment")
        
        business = businesses[0]
        business_profile_id = business.get("profile_id")
        
        # Pay business
        response = api_client.post(f"{BASE_URL}/api/businesses/pay", headers=auth_headers, json={
            "business_profile_id": business_profile_id,
            "amount_usd": 5.00,
            "note": "Test payment"
        })
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("success") is True
        assert "tx_id" in data
        assert "message_id" in data
        assert "conversation_id" in data
        assert data.get("amount_usd") == 5.00
        assert "new_balance" in data
        assert "business_name" in data
        
        print(f"✓ POST /api/businesses/pay sends payment (tx_id: {data['tx_id']}, new_balance: ${data['new_balance']})")
        return data
    
    # ============================================================
    # GET /api/businesses/paid - Get businesses user has paid
    # ============================================================
    
    def test_businesses_paid_requires_auth(self, api_client):
        """GET /api/businesses/paid - requires session token"""
        response = api_client.get(f"{BASE_URL}/api/businesses/paid")
        assert response.status_code == 401
        print("✓ GET /api/businesses/paid requires auth")
    
    def test_businesses_paid_returns_list(self, api_client, auth_headers):
        """GET /api/businesses/paid - returns list of paid businesses"""
        response = api_client.get(f"{BASE_URL}/api/businesses/paid", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        assert "businesses" in data
        assert isinstance(data["businesses"], list)
        
        print(f"✓ GET /api/businesses/paid returns {len(data['businesses'])} businesses")
    
    # ============================================================
    # GET /api/businesses/{profile_id} - Get business profile
    # ============================================================
    
    def test_get_business_profile_not_found(self, api_client, auth_headers):
        """GET /api/businesses/{profile_id} - returns 404 for invalid business"""
        response = api_client.get(f"{BASE_URL}/api/businesses/invalid-biz-id", headers=auth_headers)
        assert response.status_code == 404
        print("✓ GET /api/businesses/{profile_id} returns 404 for invalid business")
    
    def test_get_business_profile_success(self, api_client, auth_headers):
        """GET /api/businesses/{profile_id} - returns business profile"""
        # First discover businesses to get a valid profile_id
        discover_response = api_client.get(f"{BASE_URL}/api/businesses/discover", headers=auth_headers)
        assert discover_response.status_code == 200
        businesses = discover_response.json().get("businesses", [])
        
        if not businesses:
            pytest.skip("No businesses available to test")
        
        business = businesses[0]
        business_profile_id = business.get("profile_id")
        
        # Get business profile
        response = api_client.get(f"{BASE_URL}/api/businesses/{business_profile_id}", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("profile_id") == business_profile_id
        assert data.get("type") == "business"
        assert "business_name" in data
        assert "handle" in data
        
        print(f"✓ GET /api/businesses/{business_profile_id} returns business profile")


class TestProfilesGetAndUpdate:
    """Additional profile tests for GET and UPDATE"""
    
    def test_get_active_profile(self, api_client, auth_headers):
        """GET /api/profiles/active - returns active profile"""
        response = api_client.get(f"{BASE_URL}/api/profiles/active", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        assert "profile" in data
        profile = data["profile"]
        assert "profile_id" in profile
        assert "type" in profile
        
        print(f"✓ GET /api/profiles/active returns profile (type: {profile.get('type')})")
    
    def test_get_profile_by_id(self, api_client, auth_headers):
        """GET /api/profiles/{profile_id} - returns profile by ID"""
        # First get profiles to find a valid profile_id
        profiles_response = api_client.get(f"{BASE_URL}/api/profiles/me", headers=auth_headers)
        assert profiles_response.status_code == 200
        personal = profiles_response.json().get("personal")
        
        if not personal:
            pytest.skip("No personal profile available")
        
        profile_id = personal.get("profile_id")
        
        # Get profile by ID
        response = api_client.get(f"{BASE_URL}/api/profiles/{profile_id}", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("profile_id") == profile_id
        assert data.get("type") == "personal"
        
        print(f"✓ GET /api/profiles/{profile_id} returns profile")
    
    def test_update_personal_profile(self, api_client, auth_headers):
        """POST /api/profiles/personal - updates personal profile"""
        unique_handle = f"user_{uuid.uuid4().hex[:6]}"
        response = api_client.post(f"{BASE_URL}/api/profiles/personal", headers=auth_headers, json={
            "handle": unique_handle,
            "display_name": "Test User Display"
        })
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("success") is True
        assert "profile" in data
        profile = data["profile"]
        assert profile.get("handle") == unique_handle
        assert profile.get("display_name") == "Test User Display"
        
        print(f"✓ POST /api/profiles/personal updates profile (handle: @{unique_handle})")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
