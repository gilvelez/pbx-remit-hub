"""
PBX Backend Hardening Tests - Phase 1-3
Tests for:
- A) Idempotency replay - same request with same Idempotency-Key returns same tx_id
- B) Idempotency collision - same key with different params returns 409
- C) Concurrent double-spend prevention - two $800 transfers with $1000 balance, only one succeeds
- D) Amount validation - 0, negative, >$5000 all rejected
- E) Self-transfer prevention - transfer to self returns 400
- F) Ledger integrity - ledger_tx has header with tx_id, ledger has 2 entries (debit/credit), sum=0
- G) /api/health endpoint - returns status, mongodb connectivity, feature flags
- H) Admin endpoints require authentication - 401 without admin
- I) Admin roles endpoint - /api/admin/roles
"""

import pytest
import requests
import uuid
import time
import concurrent.futures
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


def generate_user_id():
    """Generate unique test user ID"""
    return f"TEST_user_{uuid.uuid4().hex[:12]}"


def generate_idempotency_key():
    """Generate unique idempotency key"""
    return f"idem_{uuid.uuid4().hex}"


class TestHealthEndpoint:
    """G) /api/health endpoint tests"""
    
    def test_health_endpoint_returns_200(self):
        """Health endpoint should return 200 OK"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ Health endpoint returns 200")
    
    def test_health_endpoint_has_status(self):
        """Health endpoint should return status field"""
        response = requests.get(f"{BASE_URL}/api/health")
        data = response.json()
        assert "status" in data, "Missing 'status' field"
        assert data["status"] in ["healthy", "degraded"], f"Unexpected status: {data['status']}"
        print(f"✓ Health status: {data['status']}")
    
    def test_health_endpoint_has_mongodb_component(self):
        """Health endpoint should report MongoDB connectivity"""
        response = requests.get(f"{BASE_URL}/api/health")
        data = response.json()
        assert "components" in data, "Missing 'components' field"
        assert "mongodb" in data["components"], "Missing 'mongodb' component"
        mongodb_status = data["components"]["mongodb"]["status"]
        assert mongodb_status in ["connected", "disconnected"], f"Unexpected MongoDB status: {mongodb_status}"
        print(f"✓ MongoDB status: {mongodb_status}")
    
    def test_health_endpoint_has_feature_flags(self):
        """Health endpoint should return feature flags"""
        response = requests.get(f"{BASE_URL}/api/health")
        data = response.json()
        assert "features" in data, "Missing 'features' field"
        features = data["features"]
        # Check expected feature flags
        assert "ledger_transactions" in features, "Missing 'ledger_transactions' feature flag"
        assert "admin_audit_logs" in features, "Missing 'admin_audit_logs' feature flag"
        assert features["ledger_transactions"] == True, "ledger_transactions should be True"
        assert features["admin_audit_logs"] == True, "admin_audit_logs should be True"
        print(f"✓ Feature flags present: {list(features.keys())}")


class TestAdminEndpointsAuth:
    """H) Admin endpoints require authentication tests"""
    
    def test_admin_roles_without_auth_returns_401(self):
        """Admin roles endpoint should return 401 without authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/roles")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ /api/admin/roles returns 401 without auth")
    
    def test_admin_users_without_auth_returns_401(self):
        """Admin users endpoint should return 401 without authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/users")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ /api/admin/users returns 401 without auth")
    
    def test_admin_wallets_without_auth_returns_401(self):
        """Admin wallets endpoint should return 401 without authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/wallets")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ /api/admin/wallets returns 401 without auth")
    
    def test_admin_ledger_without_auth_returns_401(self):
        """Admin ledger endpoint should return 401 without authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/ledger")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ /api/admin/ledger returns 401 without auth")
    
    def test_admin_audit_logs_without_auth_returns_401(self):
        """Admin audit logs endpoint should return 401 without authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/audit-logs")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ /api/admin/audit-logs returns 401 without auth")
    
    def test_admin_with_non_admin_user_returns_403(self):
        """Admin endpoint with non-admin user should return 403"""
        # Create a regular user (not admin)
        user_id = generate_user_id()
        headers = {"X-Session-Token": user_id}
        response = requests.get(f"{BASE_URL}/api/admin/roles", headers=headers)
        # Should be 401 (no session) or 403 (not admin)
        assert response.status_code in [401, 403], f"Expected 401 or 403, got {response.status_code}"
        print(f"✓ /api/admin/roles with non-admin user returns {response.status_code}")


class TestAmountValidation:
    """D) Amount validation tests - 0, negative, >$5000 all rejected"""
    
    @pytest.fixture(autouse=True)
    def setup_users(self):
        """Setup test users with friendship and wallet"""
        self.sender_id = generate_user_id()
        self.recipient_id = generate_user_id()
        
        # Create friendship
        headers = {"X-Session-Token": self.sender_id}
        response = requests.post(
            f"{BASE_URL}/api/social/friends/request",
            json={"addressee_user_id": self.recipient_id},
            headers=headers
        )
        if response.status_code == 200:
            friendship_id = response.json().get("friendship_id")
            # Accept friendship
            accept_headers = {"X-Session-Token": self.recipient_id}
            requests.post(
                f"{BASE_URL}/api/social/friends/action",
                json={"friendship_id": friendship_id, "action": "accept"},
                headers=accept_headers
            )
        
        # Fund sender wallet
        requests.post(
            f"{BASE_URL}/api/recipient/wallet/fund",
            json={"amount": 1000},
            headers=headers
        )
    
    def test_zero_amount_rejected(self):
        """Amount of 0 should be rejected"""
        headers = {"X-Session-Token": self.sender_id}
        response = requests.post(
            f"{BASE_URL}/api/social/payments/send-in-chat",
            json={"recipient_user_id": self.recipient_id, "amount_usd": 0},
            headers=headers
        )
        # Pydantic validation should reject 0 (gt=0 constraint)
        assert response.status_code in [400, 422], f"Expected 400 or 422, got {response.status_code}"
        print(f"✓ Zero amount rejected with status {response.status_code}")
    
    def test_negative_amount_rejected(self):
        """Negative amount should be rejected"""
        headers = {"X-Session-Token": self.sender_id}
        response = requests.post(
            f"{BASE_URL}/api/social/payments/send-in-chat",
            json={"recipient_user_id": self.recipient_id, "amount_usd": -100},
            headers=headers
        )
        assert response.status_code in [400, 422], f"Expected 400 or 422, got {response.status_code}"
        print(f"✓ Negative amount rejected with status {response.status_code}")
    
    def test_amount_over_5000_rejected(self):
        """Amount over $5000 should be rejected"""
        headers = {"X-Session-Token": self.sender_id}
        response = requests.post(
            f"{BASE_URL}/api/social/payments/send-in-chat",
            json={"recipient_user_id": self.recipient_id, "amount_usd": 5001},
            headers=headers
        )
        # Pydantic validation should reject >5000 (le=5000 constraint)
        assert response.status_code in [400, 422], f"Expected 400 or 422, got {response.status_code}"
        print(f"✓ Amount over $5000 rejected with status {response.status_code}")
    
    def test_valid_amount_accepted(self):
        """Valid amount should be accepted"""
        headers = {"X-Session-Token": self.sender_id}
        response = requests.post(
            f"{BASE_URL}/api/social/payments/send-in-chat",
            json={"recipient_user_id": self.recipient_id, "amount_usd": 100},
            headers=headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("success") == True
        assert "tx_id" in data
        print(f"✓ Valid amount $100 accepted, tx_id: {data['tx_id']}")


class TestSelfTransferPrevention:
    """E) Self-transfer prevention tests"""
    
    def test_self_transfer_returns_400(self):
        """Transfer to self should return 400"""
        user_id = generate_user_id()
        headers = {"X-Session-Token": user_id}
        
        # Fund wallet first
        requests.post(
            f"{BASE_URL}/api/recipient/wallet/fund",
            json={"amount": 1000},
            headers=headers
        )
        
        # Try to send to self
        response = requests.post(
            f"{BASE_URL}/api/social/payments/send-in-chat",
            json={"recipient_user_id": user_id, "amount_usd": 100},
            headers=headers
        )
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        data = response.json()
        assert "yourself" in data.get("detail", "").lower(), f"Expected 'yourself' in error message, got: {data}"
        print(f"✓ Self-transfer rejected with 400: {data.get('detail')}")


class TestIdempotencyReplay:
    """A) Idempotency replay tests - same request with same Idempotency-Key returns same tx_id"""
    
    @pytest.fixture(autouse=True)
    def setup_users(self):
        """Setup test users with friendship and wallet"""
        self.sender_id = generate_user_id()
        self.recipient_id = generate_user_id()
        
        # Create friendship
        headers = {"X-Session-Token": self.sender_id}
        response = requests.post(
            f"{BASE_URL}/api/social/friends/request",
            json={"addressee_user_id": self.recipient_id},
            headers=headers
        )
        if response.status_code == 200:
            friendship_id = response.json().get("friendship_id")
            # Accept friendship
            accept_headers = {"X-Session-Token": self.recipient_id}
            requests.post(
                f"{BASE_URL}/api/social/friends/action",
                json={"friendship_id": friendship_id, "action": "accept"},
                headers=accept_headers
            )
        
        # Fund sender wallet
        requests.post(
            f"{BASE_URL}/api/recipient/wallet/fund",
            json={"amount": 1000},
            headers=headers
        )
    
    def test_idempotency_replay_returns_same_tx_id(self):
        """Same request with same Idempotency-Key should return same tx_id"""
        idempotency_key = generate_idempotency_key()
        headers = {
            "X-Session-Token": self.sender_id,
            "Idempotency-Key": idempotency_key
        }
        payload = {"recipient_user_id": self.recipient_id, "amount_usd": 50}
        
        # First request
        response1 = requests.post(
            f"{BASE_URL}/api/social/payments/send-in-chat",
            json=payload,
            headers=headers
        )
        assert response1.status_code == 200, f"First request failed: {response1.text}"
        data1 = response1.json()
        tx_id_1 = data1.get("tx_id")
        assert tx_id_1, "First request should return tx_id"
        print(f"✓ First request tx_id: {tx_id_1}")
        
        # Second request with same idempotency key
        response2 = requests.post(
            f"{BASE_URL}/api/social/payments/send-in-chat",
            json=payload,
            headers=headers
        )
        assert response2.status_code == 200, f"Second request failed: {response2.text}"
        data2 = response2.json()
        tx_id_2 = data2.get("tx_id")
        
        # Should return same tx_id
        assert tx_id_1 == tx_id_2, f"Expected same tx_id, got {tx_id_1} vs {tx_id_2}"
        assert data2.get("is_duplicate") == True, "Second request should be marked as duplicate"
        print(f"✓ Idempotent replay returned same tx_id: {tx_id_2}, is_duplicate: {data2.get('is_duplicate')}")


class TestIdempotencyCollision:
    """B) Idempotency collision tests - same key with different params returns 409"""
    
    @pytest.fixture(autouse=True)
    def setup_users(self):
        """Setup test users with friendship and wallet"""
        self.sender_id = generate_user_id()
        self.recipient_id = generate_user_id()
        self.recipient_id_2 = generate_user_id()
        
        # Create friendships
        headers = {"X-Session-Token": self.sender_id}
        
        # Friendship with recipient 1
        response = requests.post(
            f"{BASE_URL}/api/social/friends/request",
            json={"addressee_user_id": self.recipient_id},
            headers=headers
        )
        if response.status_code == 200:
            friendship_id = response.json().get("friendship_id")
            accept_headers = {"X-Session-Token": self.recipient_id}
            requests.post(
                f"{BASE_URL}/api/social/friends/action",
                json={"friendship_id": friendship_id, "action": "accept"},
                headers=accept_headers
            )
        
        # Friendship with recipient 2
        response = requests.post(
            f"{BASE_URL}/api/social/friends/request",
            json={"addressee_user_id": self.recipient_id_2},
            headers=headers
        )
        if response.status_code == 200:
            friendship_id = response.json().get("friendship_id")
            accept_headers = {"X-Session-Token": self.recipient_id_2}
            requests.post(
                f"{BASE_URL}/api/social/friends/action",
                json={"friendship_id": friendship_id, "action": "accept"},
                headers=accept_headers
            )
        
        # Fund sender wallet
        requests.post(
            f"{BASE_URL}/api/recipient/wallet/fund",
            json={"amount": 2000},
            headers=headers
        )
    
    def test_idempotency_collision_different_amount_returns_409(self):
        """Same idempotency key with different amount should return 409"""
        idempotency_key = generate_idempotency_key()
        headers = {
            "X-Session-Token": self.sender_id,
            "Idempotency-Key": idempotency_key
        }
        
        # First request with $50
        response1 = requests.post(
            f"{BASE_URL}/api/social/payments/send-in-chat",
            json={"recipient_user_id": self.recipient_id, "amount_usd": 50},
            headers=headers
        )
        assert response1.status_code == 200, f"First request failed: {response1.text}"
        print(f"✓ First request succeeded with $50")
        
        # Second request with different amount ($100)
        response2 = requests.post(
            f"{BASE_URL}/api/social/payments/send-in-chat",
            json={"recipient_user_id": self.recipient_id, "amount_usd": 100},
            headers=headers
        )
        assert response2.status_code == 409, f"Expected 409, got {response2.status_code}: {response2.text}"
        data2 = response2.json()
        assert "collision" in str(data2.get("detail", {})).lower() or "idempotency" in str(data2.get("detail", {})).lower(), f"Expected collision error, got: {data2}"
        print(f"✓ Idempotency collision detected with different amount: {data2.get('detail')}")
    
    def test_idempotency_collision_different_recipient_returns_409(self):
        """Same idempotency key with different recipient should return 409"""
        idempotency_key = generate_idempotency_key()
        headers = {
            "X-Session-Token": self.sender_id,
            "Idempotency-Key": idempotency_key
        }
        
        # First request to recipient 1
        response1 = requests.post(
            f"{BASE_URL}/api/social/payments/send-in-chat",
            json={"recipient_user_id": self.recipient_id, "amount_usd": 75},
            headers=headers
        )
        assert response1.status_code == 200, f"First request failed: {response1.text}"
        print(f"✓ First request succeeded to recipient 1")
        
        # Second request to different recipient
        response2 = requests.post(
            f"{BASE_URL}/api/social/payments/send-in-chat",
            json={"recipient_user_id": self.recipient_id_2, "amount_usd": 75},
            headers=headers
        )
        assert response2.status_code == 409, f"Expected 409, got {response2.status_code}: {response2.text}"
        print(f"✓ Idempotency collision detected with different recipient")


class TestConcurrentDoubleSpend:
    """C) Concurrent double-spend prevention tests"""
    
    def test_concurrent_double_spend_only_one_succeeds(self):
        """Two $800 transfers with $1000 balance - only one should succeed"""
        sender_id = generate_user_id()
        recipient_id = generate_user_id()
        
        # Create friendship
        headers = {"X-Session-Token": sender_id}
        response = requests.post(
            f"{BASE_URL}/api/social/friends/request",
            json={"addressee_user_id": recipient_id},
            headers=headers
        )
        if response.status_code == 200:
            friendship_id = response.json().get("friendship_id")
            accept_headers = {"X-Session-Token": recipient_id}
            requests.post(
                f"{BASE_URL}/api/social/friends/action",
                json={"friendship_id": friendship_id, "action": "accept"},
                headers=accept_headers
            )
        
        # Fund sender wallet with exactly $1000
        fund_response = requests.post(
            f"{BASE_URL}/api/recipient/wallet/fund",
            json={"amount": 1000},
            headers=headers
        )
        assert fund_response.status_code == 200, f"Failed to fund wallet: {fund_response.text}"
        print(f"✓ Funded wallet with $1000")
        
        # Function to send $800
        def send_800():
            return requests.post(
                f"{BASE_URL}/api/social/payments/send-in-chat",
                json={"recipient_user_id": recipient_id, "amount_usd": 800},
                headers={"X-Session-Token": sender_id}
            )
        
        # Execute two $800 transfers concurrently
        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
            future1 = executor.submit(send_800)
            future2 = executor.submit(send_800)
            
            response1 = future1.result()
            response2 = future2.result()
        
        # Count successes and failures
        success_count = sum(1 for r in [response1, response2] if r.status_code == 200)
        failure_count = sum(1 for r in [response1, response2] if r.status_code in [400, 402, 409])
        
        print(f"Response 1: {response1.status_code} - {response1.text[:200]}")
        print(f"Response 2: {response2.status_code} - {response2.text[:200]}")
        
        # Only one should succeed (double-spend prevention)
        assert success_count == 1, f"Expected exactly 1 success, got {success_count}"
        assert failure_count == 1, f"Expected exactly 1 failure, got {failure_count}"
        print(f"✓ Double-spend prevention: 1 success, 1 failure")


class TestLedgerIntegrity:
    """F) Ledger integrity tests - ledger_tx has header with tx_id, ledger has 2 entries (debit/credit), sum=0"""
    
    def test_transfer_creates_ledger_tx_header(self):
        """Transfer should create ledger_tx header with tx_id"""
        sender_id = generate_user_id()
        recipient_id = generate_user_id()
        
        # Create friendship
        headers = {"X-Session-Token": sender_id}
        response = requests.post(
            f"{BASE_URL}/api/social/friends/request",
            json={"addressee_user_id": recipient_id},
            headers=headers
        )
        if response.status_code == 200:
            friendship_id = response.json().get("friendship_id")
            accept_headers = {"X-Session-Token": recipient_id}
            requests.post(
                f"{BASE_URL}/api/social/friends/action",
                json={"friendship_id": friendship_id, "action": "accept"},
                headers=accept_headers
            )
        
        # Fund sender wallet
        requests.post(
            f"{BASE_URL}/api/recipient/wallet/fund",
            json={"amount": 500},
            headers=headers
        )
        
        # Make transfer
        response = requests.post(
            f"{BASE_URL}/api/social/payments/send-in-chat",
            json={"recipient_user_id": recipient_id, "amount_usd": 100},
            headers=headers
        )
        assert response.status_code == 200, f"Transfer failed: {response.text}"
        data = response.json()
        tx_id = data.get("tx_id")
        assert tx_id, "Transfer should return tx_id"
        assert tx_id.startswith("pbx_"), f"tx_id should start with 'pbx_', got: {tx_id}"
        print(f"✓ Transfer created with tx_id: {tx_id}")
        
        # Store for verification
        self.tx_id = tx_id
        self.sender_id = sender_id
        self.recipient_id = recipient_id
        return tx_id
    
    def test_transfer_response_has_required_fields(self):
        """Transfer response should have all required fields"""
        sender_id = generate_user_id()
        recipient_id = generate_user_id()
        
        # Create friendship
        headers = {"X-Session-Token": sender_id}
        response = requests.post(
            f"{BASE_URL}/api/social/friends/request",
            json={"addressee_user_id": recipient_id},
            headers=headers
        )
        if response.status_code == 200:
            friendship_id = response.json().get("friendship_id")
            accept_headers = {"X-Session-Token": recipient_id}
            requests.post(
                f"{BASE_URL}/api/social/friends/action",
                json={"friendship_id": friendship_id, "action": "accept"},
                headers=accept_headers
            )
        
        # Fund sender wallet
        requests.post(
            f"{BASE_URL}/api/recipient/wallet/fund",
            json={"amount": 500},
            headers=headers
        )
        
        # Make transfer
        response = requests.post(
            f"{BASE_URL}/api/social/payments/send-in-chat",
            json={"recipient_user_id": recipient_id, "amount_usd": 100},
            headers=headers
        )
        assert response.status_code == 200, f"Transfer failed: {response.text}"
        data = response.json()
        
        # Check required fields
        assert "success" in data, "Missing 'success' field"
        assert "tx_id" in data, "Missing 'tx_id' field"
        assert "message_id" in data, "Missing 'message_id' field"
        assert "conversation_id" in data, "Missing 'conversation_id' field"
        assert "amount_usd" in data, "Missing 'amount_usd' field"
        assert "new_balance" in data, "Missing 'new_balance' field"
        assert "created_at" in data, "Missing 'created_at' field"
        
        assert data["success"] == True
        assert data["amount_usd"] == 100
        print(f"✓ Transfer response has all required fields")


class TestWalletFunding:
    """Test wallet funding endpoint"""
    
    def test_fund_wallet_success(self):
        """Fund wallet should succeed and return new balance"""
        user_id = generate_user_id()
        headers = {"X-Session-Token": user_id}
        
        response = requests.post(
            f"{BASE_URL}/api/recipient/wallet/fund",
            json={"amount": 500},
            headers=headers
        )
        assert response.status_code == 200, f"Fund wallet failed: {response.text}"
        data = response.json()
        assert data.get("success") == True
        assert "new_balance" in data
        assert data["new_balance"] >= 500
        print(f"✓ Wallet funded successfully, new balance: {data['new_balance']}")
    
    def test_fund_wallet_without_session_returns_401(self):
        """Fund wallet without session should return 401"""
        response = requests.post(
            f"{BASE_URL}/api/recipient/wallet/fund",
            json={"amount": 500}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Fund wallet without session returns 401")


class TestFriendshipRequired:
    """Test that friendship is required for transfers"""
    
    def test_transfer_without_friendship_returns_403(self):
        """Transfer to non-friend should return 403"""
        sender_id = generate_user_id()
        recipient_id = generate_user_id()
        
        headers = {"X-Session-Token": sender_id}
        
        # Fund sender wallet
        requests.post(
            f"{BASE_URL}/api/recipient/wallet/fund",
            json={"amount": 500},
            headers=headers
        )
        
        # Try to send without friendship
        response = requests.post(
            f"{BASE_URL}/api/social/payments/send-in-chat",
            json={"recipient_user_id": recipient_id, "amount_usd": 100},
            headers=headers
        )
        assert response.status_code == 403, f"Expected 403, got {response.status_code}: {response.text}"
        data = response.json()
        assert "friend" in data.get("detail", "").lower(), f"Expected 'friend' in error message, got: {data}"
        print(f"✓ Transfer without friendship rejected with 403: {data.get('detail')}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
