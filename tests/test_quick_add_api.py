"""
Quick Add MVP API Tests
Tests for:
- POST /api/social/quick-add (lookup by phone/email, invite if not found)
- GET /api/social/invites (list pending invites)
- DELETE /api/social/invites/{invite_id} (cancel invite)
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test user IDs
TEST_USER_ID = f"test_user_{uuid.uuid4().hex[:8]}"
TEST_USER_ID_2 = f"test_user_{uuid.uuid4().hex[:8]}"


class TestQuickAddAPI:
    """Quick Add endpoint tests"""
    
    def test_quick_add_with_existing_email(self):
        """Test quick-add with an existing user's email returns found=true"""
        # First create a test user
        create_user_response = requests.post(
            f"{BASE_URL}/api/users",
            json={
                "email": f"existing_{uuid.uuid4().hex[:8]}@test.com",
                "password": "testpass123"
            }
        )
        
        if create_user_response.status_code in [200, 201]:
            created_user = create_user_response.json()
            existing_email = created_user.get("email")
            
            # Now try quick-add with that email
            response = requests.post(
                f"{BASE_URL}/api/social/quick-add",
                headers={"X-Session-Token": TEST_USER_ID},
                json={"contact": existing_email}
            )
            
            assert response.status_code == 200
            data = response.json()
            assert data.get("found") == True
            assert "user" in data
            assert data["user"].get("email") == existing_email
            print(f"✓ Quick-add with existing email returns found=true, user data")
        else:
            # If user creation fails, test with a non-existing email
            print(f"Note: User creation returned {create_user_response.status_code}, testing with non-existing email")
            pytest.skip("Could not create test user for existing email test")
    
    def test_quick_add_with_non_existing_email(self):
        """Test quick-add with non-existing email creates invite"""
        non_existing_email = f"nonexistent_{uuid.uuid4().hex[:12]}@test.com"
        
        response = requests.post(
            f"{BASE_URL}/api/social/quick-add",
            headers={"X-Session-Token": TEST_USER_ID},
            json={
                "contact": non_existing_email,
                "name": "Test Person"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("found") == False
        assert data.get("invited") == True
        assert "invite_id" in data
        assert data.get("invite_id").startswith("inv_")
        print(f"✓ Quick-add with non-existing email returns found=false, invited=true, invite_id={data.get('invite_id')}")
        
        return data.get("invite_id")
    
    def test_quick_add_with_phone_number(self):
        """Test quick-add with phone number (detects phone vs email)"""
        phone_number = "+1234567890"
        
        response = requests.post(
            f"{BASE_URL}/api/social/quick-add",
            headers={"X-Session-Token": TEST_USER_ID},
            json={
                "contact": phone_number,
                "name": "Phone Test"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        # Phone should not be found (no user with this phone), so invite created
        assert data.get("found") == False
        assert data.get("invited") == True
        assert "invite_id" in data
        print(f"✓ Quick-add with phone number works, invite_id={data.get('invite_id')}")
    
    def test_quick_add_invalid_contact(self):
        """Test quick-add with invalid contact format returns 400"""
        response = requests.post(
            f"{BASE_URL}/api/social/quick-add",
            headers={"X-Session-Token": TEST_USER_ID},
            json={"contact": "invalid_contact_format"}
        )
        
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
        print(f"✓ Quick-add with invalid contact returns 400: {data.get('detail')}")
    
    def test_quick_add_no_auth(self):
        """Test quick-add without auth returns 401"""
        response = requests.post(
            f"{BASE_URL}/api/social/quick-add",
            json={"contact": "test@example.com"}
        )
        
        assert response.status_code == 401
        print("✓ Quick-add without auth returns 401")
    
    def test_quick_add_duplicate_invite(self):
        """Test quick-add with same contact twice returns existing invite"""
        unique_email = f"duplicate_{uuid.uuid4().hex[:12]}@test.com"
        
        # First invite
        response1 = requests.post(
            f"{BASE_URL}/api/social/quick-add",
            headers={"X-Session-Token": TEST_USER_ID},
            json={"contact": unique_email}
        )
        
        assert response1.status_code == 200
        data1 = response1.json()
        invite_id_1 = data1.get("invite_id")
        
        # Second invite to same contact
        response2 = requests.post(
            f"{BASE_URL}/api/social/quick-add",
            headers={"X-Session-Token": TEST_USER_ID},
            json={"contact": unique_email}
        )
        
        assert response2.status_code == 200
        data2 = response2.json()
        invite_id_2 = data2.get("invite_id")
        
        # Should return same invite_id
        assert invite_id_1 == invite_id_2
        assert data2.get("message") == "Invite already sent"
        print(f"✓ Duplicate invite returns existing invite_id: {invite_id_1}")


class TestInvitesAPI:
    """Invites CRUD endpoint tests"""
    
    def test_get_pending_invites(self):
        """Test GET /api/social/invites returns list of pending invites"""
        # First create an invite
        unique_email = f"invite_list_{uuid.uuid4().hex[:12]}@test.com"
        requests.post(
            f"{BASE_URL}/api/social/quick-add",
            headers={"X-Session-Token": TEST_USER_ID_2},
            json={"contact": unique_email, "name": "List Test"}
        )
        
        # Get invites
        response = requests.get(
            f"{BASE_URL}/api/social/invites",
            headers={"X-Session-Token": TEST_USER_ID_2}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "invites" in data
        assert "count" in data
        assert isinstance(data["invites"], list)
        print(f"✓ GET /api/social/invites returns {data['count']} invites")
        
        # Verify invite structure
        if data["count"] > 0:
            invite = data["invites"][0]
            assert "invite_id" in invite
            assert "contact" in invite
            assert "contact_type" in invite
            assert "status" in invite
            print(f"✓ Invite structure verified: invite_id, contact, contact_type, status present")
    
    def test_get_invites_no_auth(self):
        """Test GET /api/social/invites without auth returns 401"""
        response = requests.get(f"{BASE_URL}/api/social/invites")
        
        assert response.status_code == 401
        print("✓ GET /api/social/invites without auth returns 401")
    
    def test_cancel_invite(self):
        """Test DELETE /api/social/invites/{invite_id} cancels invite"""
        # Create an invite first
        unique_email = f"cancel_{uuid.uuid4().hex[:12]}@test.com"
        create_response = requests.post(
            f"{BASE_URL}/api/social/quick-add",
            headers={"X-Session-Token": TEST_USER_ID},
            json={"contact": unique_email}
        )
        
        assert create_response.status_code == 200
        invite_id = create_response.json().get("invite_id")
        
        # Cancel the invite
        delete_response = requests.delete(
            f"{BASE_URL}/api/social/invites/{invite_id}",
            headers={"X-Session-Token": TEST_USER_ID}
        )
        
        assert delete_response.status_code == 200
        data = delete_response.json()
        assert data.get("success") == True
        print(f"✓ DELETE /api/social/invites/{invite_id} returns success=true")
        
        # Verify invite is gone
        get_response = requests.get(
            f"{BASE_URL}/api/social/invites",
            headers={"X-Session-Token": TEST_USER_ID}
        )
        invites = get_response.json().get("invites", [])
        invite_ids = [inv.get("invite_id") for inv in invites]
        assert invite_id not in invite_ids
        print(f"✓ Cancelled invite no longer in invites list")
    
    def test_cancel_nonexistent_invite(self):
        """Test DELETE /api/social/invites/{invalid_id} returns 404"""
        response = requests.delete(
            f"{BASE_URL}/api/social/invites/inv_nonexistent123",
            headers={"X-Session-Token": TEST_USER_ID}
        )
        
        assert response.status_code == 404
        print("✓ DELETE nonexistent invite returns 404")
    
    def test_cancel_invite_no_auth(self):
        """Test DELETE /api/social/invites without auth returns 401"""
        response = requests.delete(f"{BASE_URL}/api/social/invites/inv_test123")
        
        assert response.status_code == 401
        print("✓ DELETE /api/social/invites without auth returns 401")


class TestQuickAddContactTypeDetection:
    """Test phone vs email detection in quick-add"""
    
    def test_email_detection(self):
        """Test that @ symbol triggers email detection"""
        email = f"email_test_{uuid.uuid4().hex[:8]}@example.com"
        
        response = requests.post(
            f"{BASE_URL}/api/social/quick-add",
            headers={"X-Session-Token": TEST_USER_ID},
            json={"contact": email}
        )
        
        assert response.status_code == 200
        # Check invite was created with email type
        invites_response = requests.get(
            f"{BASE_URL}/api/social/invites",
            headers={"X-Session-Token": TEST_USER_ID}
        )
        invites = invites_response.json().get("invites", [])
        matching = [inv for inv in invites if inv.get("contact") == email]
        if matching:
            assert matching[0].get("contact_type") == "email"
            print(f"✓ Email contact detected as type 'email'")
    
    def test_phone_detection(self):
        """Test that numeric string triggers phone detection"""
        phone = f"+639{uuid.uuid4().hex[:9]}"  # Philippine format
        
        response = requests.post(
            f"{BASE_URL}/api/social/quick-add",
            headers={"X-Session-Token": TEST_USER_ID},
            json={"contact": phone}
        )
        
        assert response.status_code == 200
        # Check invite was created with phone type
        invites_response = requests.get(
            f"{BASE_URL}/api/social/invites",
            headers={"X-Session-Token": TEST_USER_ID}
        )
        invites = invites_response.json().get("invites", [])
        matching = [inv for inv in invites if inv.get("contact") == phone]
        if matching:
            assert matching[0].get("contact_type") == "phone"
            print(f"✓ Phone contact detected as type 'phone'")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
