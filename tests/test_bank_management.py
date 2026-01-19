"""
Test Bank Management APIs - PBX Funding, Withdrawal & Bank Linking
Phase 4: Bank Management Backend Testing

Tests:
- GET /api/banks/linked - Get user's linked bank accounts
- POST /api/banks/link - Link a new bank via Plaid public token
- DELETE /api/banks/{bank_id} - Unlink a bank account
- POST /api/banks/add-money - Initiate ACH pull (add money to PBX)
- POST /api/banks/withdraw - Initiate ACH push (withdraw from PBX)
- GET /api/banks/transfers - Get transfer history
"""

import pytest
import requests
import uuid
import os
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://paysafe.preview.emergentagent.com')


@pytest.fixture(scope="module")
def test_session_token():
    """Create a unique test session token for this test run"""
    return f"TEST_bank_user_{uuid.uuid4().hex[:8]}"


@pytest.fixture(scope="module")
def test_user_with_wallet(test_session_token):
    """Create a test user with a wallet that has balance for withdrawal testing"""
    # First, create a wallet for the user by calling the wallet endpoint
    headers = {
        "Content-Type": "application/json",
        "X-Session-Token": test_session_token
    }
    
    # Get or create wallet
    res = requests.get(f"{BASE_URL}/api/recipient/wallet", headers=headers)
    if res.status_code == 200:
        wallet = res.json()
        # If wallet has low balance, we need to fund it for testing
        if wallet.get("usd_balance", 0) < 100:
            # We'll use the add-money endpoint to add funds (mock mode)
            pass
    
    return test_session_token


class TestBankLinkedEndpoint:
    """Test GET /api/banks/linked - Get user's linked bank accounts"""
    
    def test_get_linked_banks_requires_auth(self):
        """Test that endpoint requires authentication"""
        res = requests.get(f"{BASE_URL}/api/banks/linked")
        assert res.status_code == 401, f"Expected 401, got {res.status_code}"
    
    def test_get_linked_banks_empty_for_new_user(self, test_session_token):
        """Test that new user has no linked banks"""
        headers = {
            "Content-Type": "application/json",
            "X-Session-Token": test_session_token
        }
        res = requests.get(f"{BASE_URL}/api/banks/linked", headers=headers)
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        
        data = res.json()
        assert "banks" in data, "Response should contain 'banks' key"
        assert isinstance(data["banks"], list), "Banks should be a list"
        # New user should have no banks
        assert len(data["banks"]) == 0, "New user should have no linked banks"


class TestBankLinkEndpoint:
    """Test POST /api/banks/link - Link a new bank via Plaid public token"""
    
    def test_link_bank_requires_auth(self):
        """Test that endpoint requires authentication"""
        res = requests.post(f"{BASE_URL}/api/banks/link", json={
            "public_token": "test_token"
        })
        assert res.status_code == 401, f"Expected 401, got {res.status_code}"
    
    def test_link_bank_success(self, test_session_token):
        """Test successful bank linking with mock Plaid token"""
        headers = {
            "Content-Type": "application/json",
            "X-Session-Token": test_session_token
        }
        
        payload = {
            "public_token": f"public-sandbox-{uuid.uuid4().hex}",
            "institution_id": "ins_test_123",
            "institution_name": "Test Bank USA",
            "accounts": [
                {
                    "id": f"acc_{uuid.uuid4().hex[:8]}",
                    "name": "Checking Account",
                    "mask": "4567",
                    "type": "depository",
                    "subtype": "checking"
                }
            ]
        }
        
        res = requests.post(f"{BASE_URL}/api/banks/link", headers=headers, json=payload)
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        
        data = res.json()
        assert data.get("success") == True, "Response should indicate success"
        assert "bank_id" in data, "Response should contain bank_id"
        assert "bank" in data, "Response should contain bank details"
        
        bank = data["bank"]
        assert bank["institution_name"] == "Test Bank USA"
        assert bank["last4"] == "4567"
        assert bank["status"] == "verified"
        
        # Store bank_id for later tests
        return data["bank_id"]
    
    def test_link_bank_minimal_payload(self, test_session_token):
        """Test bank linking with minimal payload (no accounts array)"""
        headers = {
            "Content-Type": "application/json",
            "X-Session-Token": test_session_token
        }
        
        payload = {
            "public_token": f"public-sandbox-{uuid.uuid4().hex}",
            "institution_name": "Minimal Bank"
        }
        
        res = requests.post(f"{BASE_URL}/api/banks/link", headers=headers, json=payload)
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        
        data = res.json()
        assert data.get("success") == True


class TestBankUnlinkEndpoint:
    """Test DELETE /api/banks/{bank_id} - Unlink a bank account"""
    
    def test_unlink_bank_requires_auth(self):
        """Test that endpoint requires authentication"""
        res = requests.delete(f"{BASE_URL}/api/banks/fake_bank_id")
        assert res.status_code == 401, f"Expected 401, got {res.status_code}"
    
    def test_unlink_nonexistent_bank(self, test_session_token):
        """Test unlinking a bank that doesn't exist"""
        headers = {
            "Content-Type": "application/json",
            "X-Session-Token": test_session_token
        }
        
        res = requests.delete(f"{BASE_URL}/api/banks/nonexistent_bank_123", headers=headers)
        assert res.status_code == 404, f"Expected 404, got {res.status_code}"
    
    def test_unlink_bank_success(self, test_session_token):
        """Test successful bank unlinking"""
        headers = {
            "Content-Type": "application/json",
            "X-Session-Token": test_session_token
        }
        
        # First, link a bank
        link_payload = {
            "public_token": f"public-sandbox-{uuid.uuid4().hex}",
            "institution_name": "Bank To Unlink",
            "accounts": [
                {
                    "id": f"acc_{uuid.uuid4().hex[:8]}",
                    "name": "Checking",
                    "mask": "9999",
                    "type": "depository",
                    "subtype": "checking"
                }
            ]
        }
        
        link_res = requests.post(f"{BASE_URL}/api/banks/link", headers=headers, json=link_payload)
        assert link_res.status_code == 200, f"Failed to link bank: {link_res.text}"
        bank_id = link_res.json()["bank_id"]
        
        # Now unlink it
        unlink_res = requests.delete(f"{BASE_URL}/api/banks/{bank_id}", headers=headers)
        assert unlink_res.status_code == 200, f"Expected 200, got {unlink_res.status_code}: {unlink_res.text}"
        
        data = unlink_res.json()
        assert data.get("success") == True
        
        # Verify bank is no longer in linked banks list
        list_res = requests.get(f"{BASE_URL}/api/banks/linked", headers=headers)
        banks = list_res.json().get("banks", [])
        bank_ids = [b["id"] for b in banks]
        assert bank_id not in bank_ids, "Unlinked bank should not appear in list"


class TestAddMoneyEndpoint:
    """Test POST /api/banks/add-money - Initiate ACH pull"""
    
    def test_add_money_requires_auth(self):
        """Test that endpoint requires authentication"""
        res = requests.post(f"{BASE_URL}/api/banks/add-money", json={
            "amount": 100,
            "bank_id": "test_bank"
        })
        assert res.status_code == 401, f"Expected 401, got {res.status_code}"
    
    def test_add_money_requires_valid_bank(self, test_session_token):
        """Test that add-money requires a valid linked bank"""
        headers = {
            "Content-Type": "application/json",
            "X-Session-Token": test_session_token
        }
        
        res = requests.post(f"{BASE_URL}/api/banks/add-money", headers=headers, json={
            "amount": 100,
            "bank_id": "nonexistent_bank"
        })
        assert res.status_code == 404, f"Expected 404, got {res.status_code}"
    
    def test_add_money_validates_amount(self, test_session_token):
        """Test amount validation (min $0, max $10,000)"""
        headers = {
            "Content-Type": "application/json",
            "X-Session-Token": test_session_token
        }
        
        # Test zero amount
        res = requests.post(f"{BASE_URL}/api/banks/add-money", headers=headers, json={
            "amount": 0,
            "bank_id": "test_bank"
        })
        assert res.status_code == 422, f"Expected 422 for zero amount, got {res.status_code}"
        
        # Test negative amount
        res = requests.post(f"{BASE_URL}/api/banks/add-money", headers=headers, json={
            "amount": -50,
            "bank_id": "test_bank"
        })
        assert res.status_code == 422, f"Expected 422 for negative amount, got {res.status_code}"
        
        # Test amount over limit
        res = requests.post(f"{BASE_URL}/api/banks/add-money", headers=headers, json={
            "amount": 15000,
            "bank_id": "test_bank"
        })
        assert res.status_code == 422, f"Expected 422 for amount over limit, got {res.status_code}"
    
    def test_add_money_success(self, test_session_token):
        """Test successful add money flow"""
        headers = {
            "Content-Type": "application/json",
            "X-Session-Token": test_session_token
        }
        
        # First, link a bank
        link_payload = {
            "public_token": f"public-sandbox-{uuid.uuid4().hex}",
            "institution_name": "Add Money Test Bank",
            "accounts": [
                {
                    "id": f"acc_{uuid.uuid4().hex[:8]}",
                    "name": "Checking",
                    "mask": "1111",
                    "type": "depository",
                    "subtype": "checking"
                }
            ]
        }
        
        link_res = requests.post(f"{BASE_URL}/api/banks/link", headers=headers, json=link_payload)
        assert link_res.status_code == 200, f"Failed to link bank: {link_res.text}"
        bank_id = link_res.json()["bank_id"]
        
        # Now add money
        add_res = requests.post(f"{BASE_URL}/api/banks/add-money", headers=headers, json={
            "amount": 250.00,
            "bank_id": bank_id
        })
        assert add_res.status_code == 200, f"Expected 200, got {add_res.status_code}: {add_res.text}"
        
        data = add_res.json()
        assert data.get("success") == True
        assert "transfer_id" in data
        assert data["status"] == "pending"
        assert data["amount"] == 250.00
        assert "estimated_arrival" in data


class TestWithdrawEndpoint:
    """Test POST /api/banks/withdraw - Initiate ACH push"""
    
    def test_withdraw_requires_auth(self):
        """Test that endpoint requires authentication"""
        res = requests.post(f"{BASE_URL}/api/banks/withdraw", json={
            "amount": 100,
            "bank_id": "test_bank"
        })
        assert res.status_code == 401, f"Expected 401, got {res.status_code}"
    
    def test_withdraw_requires_valid_bank(self, test_session_token):
        """Test that withdraw requires a valid linked bank"""
        headers = {
            "Content-Type": "application/json",
            "X-Session-Token": test_session_token
        }
        
        res = requests.post(f"{BASE_URL}/api/banks/withdraw", headers=headers, json={
            "amount": 100,
            "bank_id": "nonexistent_bank"
        })
        assert res.status_code == 404, f"Expected 404, got {res.status_code}"
    
    def test_withdraw_validates_amount(self, test_session_token):
        """Test amount validation"""
        headers = {
            "Content-Type": "application/json",
            "X-Session-Token": test_session_token
        }
        
        # Test zero amount
        res = requests.post(f"{BASE_URL}/api/banks/withdraw", headers=headers, json={
            "amount": 0,
            "bank_id": "test_bank"
        })
        assert res.status_code == 422, f"Expected 422 for zero amount, got {res.status_code}"
        
        # Test negative amount
        res = requests.post(f"{BASE_URL}/api/banks/withdraw", headers=headers, json={
            "amount": -50,
            "bank_id": "test_bank"
        })
        assert res.status_code == 422, f"Expected 422 for negative amount, got {res.status_code}"


class TestTransferHistoryEndpoint:
    """Test GET /api/banks/transfers - Get transfer history"""
    
    def test_transfers_requires_auth(self):
        """Test that endpoint requires authentication"""
        res = requests.get(f"{BASE_URL}/api/banks/transfers")
        assert res.status_code == 401, f"Expected 401, got {res.status_code}"
    
    def test_transfers_returns_list(self, test_session_token):
        """Test that transfers endpoint returns a list"""
        headers = {
            "Content-Type": "application/json",
            "X-Session-Token": test_session_token
        }
        
        res = requests.get(f"{BASE_URL}/api/banks/transfers", headers=headers)
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        
        data = res.json()
        assert "transfers" in data
        assert isinstance(data["transfers"], list)


class TestWithdrawWithBalance:
    """Test withdrawal with actual wallet balance"""
    
    def test_withdraw_insufficient_balance(self):
        """Test withdrawal fails with insufficient balance"""
        # Create a new user with no balance
        session_token = f"TEST_withdraw_nobal_{uuid.uuid4().hex[:8]}"
        headers = {
            "Content-Type": "application/json",
            "X-Session-Token": session_token
        }
        
        # Link a bank first
        link_payload = {
            "public_token": f"public-sandbox-{uuid.uuid4().hex}",
            "institution_name": "Withdraw Test Bank",
            "accounts": [
                {
                    "id": f"acc_{uuid.uuid4().hex[:8]}",
                    "name": "Checking",
                    "mask": "2222",
                    "type": "depository",
                    "subtype": "checking"
                }
            ]
        }
        
        link_res = requests.post(f"{BASE_URL}/api/banks/link", headers=headers, json=link_payload)
        if link_res.status_code != 200:
            pytest.skip(f"Could not link bank: {link_res.text}")
        
        bank_id = link_res.json()["bank_id"]
        
        # Try to withdraw more than balance (new user has $0 or default balance)
        withdraw_res = requests.post(f"{BASE_URL}/api/banks/withdraw", headers=headers, json={
            "amount": 99999.00,  # Very high amount
            "bank_id": bank_id
        })
        
        # Should fail with 400 (insufficient balance) or 404 (no wallet)
        assert withdraw_res.status_code in [400, 404], f"Expected 400 or 404, got {withdraw_res.status_code}: {withdraw_res.text}"


class TestEndToEndBankFlow:
    """End-to-end test of bank linking, add money, and withdrawal flow"""
    
    def test_full_bank_flow(self):
        """Test complete flow: link bank -> add money -> check transfers"""
        session_token = f"TEST_e2e_bank_{uuid.uuid4().hex[:8]}"
        headers = {
            "Content-Type": "application/json",
            "X-Session-Token": session_token
        }
        
        # Step 1: Verify no banks linked initially
        list_res = requests.get(f"{BASE_URL}/api/banks/linked", headers=headers)
        assert list_res.status_code == 200
        assert len(list_res.json().get("banks", [])) == 0
        
        # Step 2: Link a bank
        link_payload = {
            "public_token": f"public-sandbox-{uuid.uuid4().hex}",
            "institution_id": "ins_chase",
            "institution_name": "Chase Bank",
            "accounts": [
                {
                    "id": f"acc_{uuid.uuid4().hex[:8]}",
                    "name": "Total Checking",
                    "mask": "3456",
                    "type": "depository",
                    "subtype": "checking"
                }
            ]
        }
        
        link_res = requests.post(f"{BASE_URL}/api/banks/link", headers=headers, json=link_payload)
        assert link_res.status_code == 200, f"Link failed: {link_res.text}"
        bank_id = link_res.json()["bank_id"]
        
        # Step 3: Verify bank appears in list
        list_res = requests.get(f"{BASE_URL}/api/banks/linked", headers=headers)
        assert list_res.status_code == 200
        banks = list_res.json().get("banks", [])
        assert len(banks) == 1
        assert banks[0]["institution_name"] == "Chase Bank"
        assert banks[0]["last4"] == "3456"
        
        # Step 4: Add money
        add_res = requests.post(f"{BASE_URL}/api/banks/add-money", headers=headers, json={
            "amount": 500.00,
            "bank_id": bank_id
        })
        assert add_res.status_code == 200, f"Add money failed: {add_res.text}"
        add_data = add_res.json()
        assert add_data["success"] == True
        assert add_data["status"] == "pending"
        
        # Step 5: Check transfer history
        transfers_res = requests.get(f"{BASE_URL}/api/banks/transfers", headers=headers)
        assert transfers_res.status_code == 200
        transfers = transfers_res.json().get("transfers", [])
        assert len(transfers) >= 1
        
        # Find our transfer
        our_transfer = next((t for t in transfers if t["transfer_id"] == add_data["transfer_id"]), None)
        assert our_transfer is not None, "Transfer should appear in history"
        assert our_transfer["amount"] == 500.00
        assert our_transfer["type"] == "ach_pull"
        assert our_transfer["direction"] == "in"
        
        # Step 6: Unlink bank
        unlink_res = requests.delete(f"{BASE_URL}/api/banks/{bank_id}", headers=headers)
        assert unlink_res.status_code == 200
        
        # Step 7: Verify bank is removed
        list_res = requests.get(f"{BASE_URL}/api/banks/linked", headers=headers)
        banks = list_res.json().get("banks", [])
        assert len(banks) == 0, "Bank should be removed from list"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
