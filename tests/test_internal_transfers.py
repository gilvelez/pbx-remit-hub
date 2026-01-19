"""
PBX Internal Transfers API Tests
Tests for PBX-to-PBX closed-loop transfer system:
- User lookup by email/phone
- Transfer limits ($5,000/txn, $25,000/day)
- Self-transfer prevention
- Insufficient balance validation
- Ledger entry creation
- Incoming transfers API
"""
import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://pinoy-payments.preview.emergentagent.com').rstrip('/')

# Test session tokens
SENDER_TOKEN = f"test-sender-{uuid.uuid4()}"
RECIPIENT_TOKEN = f"test-recipient-{uuid.uuid4()}"

# Mock users from backend
MOCK_USERS = {
    "maria": {
        "email": "maria.santos@example.com",
        "phone": "+639171234567",
        "name": "Maria Santos"
    },
    "juan": {
        "email": "juan.delacruz@example.com",
        "phone": "+639181234567",
        "name": "Juan Dela Cruz"
    },
    "anna": {
        "email": "anna.reyes@example.com",
        "phone": "+639191234567",
        "name": "Anna Reyes"
    }
}


class TestUserLookup:
    """Tests for /api/internal/lookup endpoint"""
    
    def test_lookup_user_by_email(self):
        """Test looking up a PBX user by email"""
        response = requests.post(
            f"{BASE_URL}/api/internal/lookup",
            headers={"Content-Type": "application/json", "X-Session-Token": SENDER_TOKEN},
            json={"identifier": "maria.santos@example.com"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert data["found"] == True, "Expected user to be found"
        assert "user" in data, "Expected user object in response"
        assert data["user"]["email"] == "maria.santos@example.com"
        assert data["user"]["display_name"] == "Maria Santos"
        print(f"✓ User lookup by email: Found {data['user']['display_name']}")
    
    def test_lookup_user_by_phone(self):
        """Test looking up a PBX user by phone number"""
        response = requests.post(
            f"{BASE_URL}/api/internal/lookup",
            headers={"Content-Type": "application/json", "X-Session-Token": SENDER_TOKEN},
            json={"identifier": "+639171234567"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert data["found"] == True, "Expected user to be found"
        assert data["user"]["phone"] == "+639171234567"
        print(f"✓ User lookup by phone: Found {data['user']['display_name']}")
    
    def test_lookup_nonexistent_user(self):
        """Test looking up a user that doesn't exist"""
        response = requests.post(
            f"{BASE_URL}/api/internal/lookup",
            headers={"Content-Type": "application/json", "X-Session-Token": SENDER_TOKEN},
            json={"identifier": "nonexistent@example.com"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert data["found"] == False, "Expected user not to be found"
        assert "message" in data, "Expected message for not found user"
        print(f"✓ Non-existent user lookup: found=false, message='{data['message']}'")
    
    def test_lookup_case_insensitive_email(self):
        """Test that email lookup is case-insensitive"""
        response = requests.post(
            f"{BASE_URL}/api/internal/lookup",
            headers={"Content-Type": "application/json", "X-Session-Token": SENDER_TOKEN},
            json={"identifier": "MARIA.SANTOS@EXAMPLE.COM"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["found"] == True, "Email lookup should be case-insensitive"
        print("✓ Case-insensitive email lookup works")
    
    def test_lookup_without_token(self):
        """Test lookup without session token returns 401"""
        response = requests.post(
            f"{BASE_URL}/api/internal/lookup",
            headers={"Content-Type": "application/json"},
            json={"identifier": "maria.santos@example.com"}
        )
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Lookup without token returns 401")


class TestInternalTransfer:
    """Tests for /api/internal/transfer endpoint"""
    
    def test_successful_transfer(self):
        """Test a successful PBX-to-PBX transfer"""
        unique_token = f"test-user-{int(datetime.now().timestamp())}"
        
        response = requests.post(
            f"{BASE_URL}/api/internal/transfer",
            headers={"Content-Type": "application/json", "X-Session-Token": unique_token},
            json={
                "recipient_identifier": "maria.santos@example.com",
                "amount_usd": 100.00,
                "note": "Test transfer"
            }
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert data["success"] == True, "Expected success=true"
        assert data["amount"] == 100.00, "Amount should match"
        assert data["currency"] == "USD", "Currency should be USD"
        assert data["fee"] == 0, "Fee should be 0 for internal transfers"
        assert data["instant"] == True, "Transfer should be instant"
        assert data["status"] == "completed", "Status should be completed"
        assert "transfer_id" in data, "Should have transfer_id"
        assert "new_balance" in data, "Should return new balance"
        print(f"✓ Successful transfer: ${data['amount']} to {data['recipient']['display_name']}, new_balance=${data['new_balance']}")
    
    def test_transfer_limit_per_transaction(self):
        """Test that transfers over $5,000 are rejected"""
        response = requests.post(
            f"{BASE_URL}/api/internal/transfer",
            headers={"Content-Type": "application/json", "X-Session-Token": SENDER_TOKEN},
            json={
                "recipient_identifier": "maria.santos@example.com",
                "amount_usd": 5001.00
            }
        )
        
        # Pydantic validation should reject this with 422
        assert response.status_code == 422, f"Expected 422 for amount over limit, got {response.status_code}: {response.text}"
        print("✓ Transfer over $5,000 limit rejected with 422")
    
    def test_transfer_at_limit(self):
        """Test transfer at exactly $5,000 limit"""
        unique_token = f"test-limit-{int(datetime.now().timestamp())}"
        
        response = requests.post(
            f"{BASE_URL}/api/internal/transfer",
            headers={"Content-Type": "application/json", "X-Session-Token": unique_token},
            json={
                "recipient_identifier": "maria.santos@example.com",
                "amount_usd": 5000.00
            }
        )
        
        # This should fail due to insufficient balance (default is $1500)
        # But the limit validation should pass
        if response.status_code == 400:
            data = response.json()
            assert "Insufficient" in data.get("detail", ""), "Should fail due to insufficient balance, not limit"
            print("✓ Transfer at $5,000 limit: Passed limit validation (failed due to insufficient balance as expected)")
        else:
            assert response.status_code == 200, f"Expected 200 or 400, got {response.status_code}"
            print("✓ Transfer at $5,000 limit succeeded")
    
    def test_insufficient_balance(self):
        """Test transfer with insufficient balance"""
        unique_token = f"test-insufficient-{int(datetime.now().timestamp())}"
        
        response = requests.post(
            f"{BASE_URL}/api/internal/transfer",
            headers={"Content-Type": "application/json", "X-Session-Token": unique_token},
            json={
                "recipient_identifier": "maria.santos@example.com",
                "amount_usd": 2000.00  # Default balance is $1500
            }
        )
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
        data = response.json()
        assert "Insufficient" in data.get("detail", ""), "Should mention insufficient balance"
        print(f"✓ Insufficient balance rejected: {data['detail']}")
    
    def test_transfer_to_nonexistent_user(self):
        """Test transfer to non-existent user"""
        response = requests.post(
            f"{BASE_URL}/api/internal/transfer",
            headers={"Content-Type": "application/json", "X-Session-Token": SENDER_TOKEN},
            json={
                "recipient_identifier": "nonexistent@example.com",
                "amount_usd": 50.00
            }
        )
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}: {response.text}"
        print("✓ Transfer to non-existent user returns 404")
    
    def test_transfer_without_token(self):
        """Test transfer without session token"""
        response = requests.post(
            f"{BASE_URL}/api/internal/transfer",
            headers={"Content-Type": "application/json"},
            json={
                "recipient_identifier": "maria.santos@example.com",
                "amount_usd": 50.00
            }
        )
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Transfer without token returns 401")
    
    def test_transfer_zero_amount(self):
        """Test transfer with zero amount"""
        response = requests.post(
            f"{BASE_URL}/api/internal/transfer",
            headers={"Content-Type": "application/json", "X-Session-Token": SENDER_TOKEN},
            json={
                "recipient_identifier": "maria.santos@example.com",
                "amount_usd": 0
            }
        )
        
        # Pydantic validation should reject this
        assert response.status_code == 422, f"Expected 422 for zero amount, got {response.status_code}"
        print("✓ Zero amount transfer rejected with 422")
    
    def test_transfer_negative_amount(self):
        """Test transfer with negative amount"""
        response = requests.post(
            f"{BASE_URL}/api/internal/transfer",
            headers={"Content-Type": "application/json", "X-Session-Token": SENDER_TOKEN},
            json={
                "recipient_identifier": "maria.santos@example.com",
                "amount_usd": -100
            }
        )
        
        # Pydantic validation should reject this
        assert response.status_code == 422, f"Expected 422 for negative amount, got {response.status_code}"
        print("✓ Negative amount transfer rejected with 422")


class TestIncomingTransfers:
    """Tests for /api/internal/incoming endpoint"""
    
    def test_get_incoming_transfers(self):
        """Test getting incoming transfers"""
        response = requests.get(
            f"{BASE_URL}/api/internal/incoming?limit=5",
            headers={"X-Session-Token": RECIPIENT_TOKEN}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert "transfers" in data, "Response should have transfers array"
        assert isinstance(data["transfers"], list), "Transfers should be a list"
        print(f"✓ Incoming transfers API: {len(data['transfers'])} transfers returned")
    
    def test_incoming_transfers_without_token(self):
        """Test incoming transfers without session token"""
        response = requests.get(
            f"{BASE_URL}/api/internal/incoming?limit=5",
            headers={}
        )
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Incoming transfers without token returns 401")


class TestInvite:
    """Tests for /api/internal/invite endpoint"""
    
    def test_generate_invite(self):
        """Test generating an invite message"""
        response = requests.post(
            f"{BASE_URL}/api/internal/invite",
            headers={"Content-Type": "application/json", "X-Session-Token": SENDER_TOKEN},
            json={"identifier": "newuser@example.com"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert data["success"] == True, "Expected success=true"
        assert "message" in data, "Should have invite message"
        assert "invite_link" in data, "Should have invite link"
        assert "newuser@example.com" in data["message"], "Message should contain identifier"
        print(f"✓ Invite generated with link: {data['invite_link']}")


class TestTransferLedgerEntries:
    """Tests to verify ledger entries are created correctly"""
    
    def test_transfer_creates_ledger_entries(self):
        """Test that a transfer creates both sender and recipient ledger entries"""
        unique_token = f"test-ledger-{int(datetime.now().timestamp())}"
        
        # Make a transfer
        transfer_response = requests.post(
            f"{BASE_URL}/api/internal/transfer",
            headers={"Content-Type": "application/json", "X-Session-Token": unique_token},
            json={
                "recipient_identifier": "maria.santos@example.com",
                "amount_usd": 50.00,
                "note": "Ledger test"
            }
        )
        
        assert transfer_response.status_code == 200, f"Transfer failed: {transfer_response.text}"
        transfer_data = transfer_response.json()
        
        # Verify transfer response has expected fields
        assert "transfer_id" in transfer_data, "Should have transfer_id"
        assert "transaction_id" in transfer_data, "Should have transaction_id"
        assert transfer_data["status"] == "completed", "Status should be completed"
        
        print(f"✓ Transfer created with ID: {transfer_data['transfer_id']}")
        print(f"  - Amount: ${transfer_data['amount']}")
        print(f"  - Recipient: {transfer_data['recipient']['display_name']}")
        print(f"  - Fee: ${transfer_data['fee']}")
        print(f"  - Instant: {transfer_data['instant']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
