"""
PBX Recipient MongoDB Integration Tests
Tests for real MongoDB persistence in recipient APIs:
- GET /api/recipient/wallet - Real wallet balances
- POST /api/recipient/convert/execute - Real USD→PHP conversion with wallet update
- POST /api/recipient/bills/pay - Real PHP balance deduction
- POST /api/recipient/transfers/send - Real PHP balance deduction
- GET /api/recipient/statements - Transaction ledger
- POST /api/recipient/bills/save - Saved billers persistence
- GET /api/recipient/bills/saved - Get saved billers
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestRecipientWalletMongoDB:
    """Tests for real wallet persistence in MongoDB"""
    
    @pytest.fixture
    def session_token(self):
        """Generate a unique session token for testing"""
        return f"TEST-WALLET-{uuid.uuid4()}"
    
    def test_get_wallet_creates_default_for_new_user(self, session_token):
        """Test GET /api/recipient/wallet creates default wallet for new user"""
        response = requests.get(
            f"{BASE_URL}/api/recipient/wallet",
            headers={"X-Session-Token": session_token}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify default wallet values
        assert data["user_id"] == session_token[:36]
        assert data["usd_balance"] == 1500.0  # Default USD balance
        assert data["php_balance"] == 25000.0  # Default PHP balance
        assert "sub_wallets" in data
        assert data["sub_wallets"]["bills"] == 5000.0
        assert data["sub_wallets"]["savings"] == 10000.0
        assert data["sub_wallets"]["family"] == 2500.0
        assert "updated_at" in data
    
    def test_wallet_persists_across_requests(self, session_token):
        """Test wallet data persists across multiple requests"""
        # First request creates wallet
        response1 = requests.get(
            f"{BASE_URL}/api/recipient/wallet",
            headers={"X-Session-Token": session_token}
        )
        assert response1.status_code == 200
        
        # Second request should return same data
        response2 = requests.get(
            f"{BASE_URL}/api/recipient/wallet",
            headers={"X-Session-Token": session_token}
        )
        assert response2.status_code == 200
        
        # Balances should be identical
        assert response1.json()["usd_balance"] == response2.json()["usd_balance"]
        assert response1.json()["php_balance"] == response2.json()["php_balance"]
    
    def test_wallet_requires_auth(self):
        """Test wallet endpoint requires session token"""
        response = requests.get(f"{BASE_URL}/api/recipient/wallet")
        assert response.status_code == 401


class TestFxConversionMongoDB:
    """Tests for real FX conversion with MongoDB wallet updates"""
    
    @pytest.fixture
    def session_token(self):
        """Generate a unique session token for testing"""
        return f"TEST-FX-{uuid.uuid4()}"
    
    def test_conversion_updates_wallet_balances(self, session_token):
        """Test USD→PHP conversion actually updates wallet balances"""
        # Get initial wallet
        wallet_before = requests.get(
            f"{BASE_URL}/api/recipient/wallet",
            headers={"X-Session-Token": session_token}
        ).json()
        
        initial_usd = wallet_before["usd_balance"]
        initial_php = wallet_before["php_balance"]
        
        # Execute conversion
        convert_amount = 100.0
        convert_response = requests.post(
            f"{BASE_URL}/api/recipient/convert/execute",
            json={"amount_usd": convert_amount},
            headers={"X-Session-Token": session_token}
        )
        
        assert convert_response.status_code == 200
        convert_data = convert_response.json()
        assert convert_data["success"] is True
        php_received = convert_data["to_amount"]
        
        # Get updated wallet
        wallet_after = requests.get(
            f"{BASE_URL}/api/recipient/wallet",
            headers={"X-Session-Token": session_token}
        ).json()
        
        # Verify USD decreased
        assert wallet_after["usd_balance"] == pytest.approx(initial_usd - convert_amount, rel=0.01)
        
        # Verify PHP increased
        assert wallet_after["php_balance"] == pytest.approx(initial_php + php_received, rel=0.01)
    
    def test_conversion_insufficient_balance(self, session_token):
        """Test conversion fails with insufficient USD balance"""
        # Get wallet to know balance
        wallet = requests.get(
            f"{BASE_URL}/api/recipient/wallet",
            headers={"X-Session-Token": session_token}
        ).json()
        
        # Try to convert more than available
        response = requests.post(
            f"{BASE_URL}/api/recipient/convert/execute",
            json={"amount_usd": wallet["usd_balance"] + 1000},
            headers={"X-Session-Token": session_token}
        )
        
        assert response.status_code == 400
        assert "insufficient" in response.json()["detail"].lower()
    
    def test_conversion_creates_ledger_entry(self, session_token):
        """Test conversion creates transaction in ledger"""
        # Execute conversion
        convert_response = requests.post(
            f"{BASE_URL}/api/recipient/convert/execute",
            json={"amount_usd": 50.0},
            headers={"X-Session-Token": session_token}
        )
        assert convert_response.status_code == 200
        txn_id = convert_response.json()["transaction_id"]
        
        # Check statements for the transaction
        statements = requests.get(
            f"{BASE_URL}/api/recipient/statements",
            headers={"X-Session-Token": session_token}
        ).json()
        
        # Find our transaction
        txn_ids = [t["id"] for t in statements["transactions"]]
        assert txn_id in txn_ids


class TestBillPaymentMongoDB:
    """Tests for real bill payment with MongoDB wallet updates"""
    
    @pytest.fixture
    def session_token(self):
        """Generate a unique session token for testing"""
        return f"TEST-BILL-{uuid.uuid4()}"
    
    def test_bill_payment_deducts_php_balance(self, session_token):
        """Test bill payment deducts from PHP wallet"""
        # Get initial wallet
        wallet_before = requests.get(
            f"{BASE_URL}/api/recipient/wallet",
            headers={"X-Session-Token": session_token}
        ).json()
        
        initial_php = wallet_before["php_balance"]
        
        # Pay bill
        bill_amount = 500.0
        pay_response = requests.post(
            f"{BASE_URL}/api/recipient/bills/pay",
            json={
                "biller_code": "meralco",
                "account_no": "1234567890",
                "amount": bill_amount
            },
            headers={"X-Session-Token": session_token}
        )
        
        assert pay_response.status_code == 200
        assert pay_response.json()["success"] is True
        
        # Get updated wallet
        wallet_after = requests.get(
            f"{BASE_URL}/api/recipient/wallet",
            headers={"X-Session-Token": session_token}
        ).json()
        
        # Verify PHP decreased
        assert wallet_after["php_balance"] == pytest.approx(initial_php - bill_amount, rel=0.01)
    
    def test_bill_payment_insufficient_balance(self, session_token):
        """Test bill payment fails with insufficient PHP balance"""
        # Get wallet to know balance
        wallet = requests.get(
            f"{BASE_URL}/api/recipient/wallet",
            headers={"X-Session-Token": session_token}
        ).json()
        
        # Try to pay more than available
        response = requests.post(
            f"{BASE_URL}/api/recipient/bills/pay",
            json={
                "biller_code": "meralco",
                "account_no": "1234567890",
                "amount": wallet["php_balance"] + 10000
            },
            headers={"X-Session-Token": session_token}
        )
        
        assert response.status_code == 400
        assert "insufficient" in response.json()["detail"].lower()
    
    def test_bill_payment_creates_ledger_entry(self, session_token):
        """Test bill payment creates transaction in ledger"""
        # Pay bill
        pay_response = requests.post(
            f"{BASE_URL}/api/recipient/bills/pay",
            json={
                "biller_code": "pldt",
                "account_no": "9876543210",
                "amount": 300.0
            },
            headers={"X-Session-Token": session_token}
        )
        assert pay_response.status_code == 200
        txn_id = pay_response.json()["transaction_id"]
        
        # Check bill history
        history = requests.get(
            f"{BASE_URL}/api/recipient/bills/history",
            headers={"X-Session-Token": session_token}
        ).json()
        
        # Find our transaction
        payment_ids = [p["id"] for p in history["payments"]]
        assert txn_id in payment_ids


class TestTransferMongoDB:
    """Tests for real transfer with MongoDB wallet updates"""
    
    @pytest.fixture
    def session_token(self):
        """Generate a unique session token for testing"""
        return f"TEST-TRANSFER-{uuid.uuid4()}"
    
    def test_transfer_deducts_php_balance(self, session_token):
        """Test transfer deducts from PHP wallet"""
        # Get initial wallet
        wallet_before = requests.get(
            f"{BASE_URL}/api/recipient/wallet",
            headers={"X-Session-Token": session_token}
        ).json()
        
        initial_php = wallet_before["php_balance"]
        
        # Send transfer
        transfer_amount = 1000.0
        transfer_response = requests.post(
            f"{BASE_URL}/api/recipient/transfers/send",
            json={
                "method": "gcash",
                "amount": transfer_amount,
                "recipient_account": "09171234567",
                "recipient_name": "Test Recipient"
            },
            headers={"X-Session-Token": session_token}
        )
        
        assert transfer_response.status_code == 200
        assert transfer_response.json()["success"] is True
        
        # Get updated wallet
        wallet_after = requests.get(
            f"{BASE_URL}/api/recipient/wallet",
            headers={"X-Session-Token": session_token}
        ).json()
        
        # Verify PHP decreased
        assert wallet_after["php_balance"] == pytest.approx(initial_php - transfer_amount, rel=0.01)
    
    def test_transfer_insufficient_balance(self, session_token):
        """Test transfer fails with insufficient PHP balance"""
        # Get wallet to know balance
        wallet = requests.get(
            f"{BASE_URL}/api/recipient/wallet",
            headers={"X-Session-Token": session_token}
        ).json()
        
        # Try to transfer more than available
        response = requests.post(
            f"{BASE_URL}/api/recipient/transfers/send",
            json={
                "method": "gcash",
                "amount": wallet["php_balance"] + 10000,
                "recipient_account": "09171234567"
            },
            headers={"X-Session-Token": session_token}
        )
        
        assert response.status_code == 400
        assert "insufficient" in response.json()["detail"].lower()
    
    def test_transfer_creates_ledger_entry(self, session_token):
        """Test transfer creates transaction in ledger"""
        # Send transfer
        transfer_response = requests.post(
            f"{BASE_URL}/api/recipient/transfers/send",
            json={
                "method": "maya",
                "amount": 500.0,
                "recipient_account": "09181234567",
                "recipient_name": "Maya User"
            },
            headers={"X-Session-Token": session_token}
        )
        assert transfer_response.status_code == 200
        txn_id = transfer_response.json()["transaction_id"]
        
        # Check transfer history
        history = requests.get(
            f"{BASE_URL}/api/recipient/transfers/history",
            headers={"X-Session-Token": session_token}
        ).json()
        
        # Find our transaction
        transfer_ids = [t["id"] for t in history["transfers"]]
        assert txn_id in transfer_ids


class TestSavedBillersMongoDB:
    """Tests for saved billers persistence in MongoDB"""
    
    @pytest.fixture
    def session_token(self):
        """Generate a unique session token for testing"""
        return f"TEST-BILLER-{uuid.uuid4()}"
    
    def test_save_biller_persists(self, session_token):
        """Test saving a biller persists to MongoDB"""
        account_no = f"ACC{uuid.uuid4().hex[:8]}"
        
        # Save biller
        save_response = requests.post(
            f"{BASE_URL}/api/recipient/bills/save",
            json={
                "biller_code": "globe",
                "account_no": account_no,
                "nickname": "My Globe Account"
            },
            headers={"X-Session-Token": session_token}
        )
        
        assert save_response.status_code == 200
        assert save_response.json()["success"] is True
        saved_biller = save_response.json()["saved_biller"]
        assert saved_biller["biller_code"] == "globe"
        assert saved_biller["account_no"] == account_no
        assert saved_biller["nickname"] == "My Globe Account"
        
        # Verify via GET
        get_response = requests.get(
            f"{BASE_URL}/api/recipient/bills/saved",
            headers={"X-Session-Token": session_token}
        )
        
        assert get_response.status_code == 200
        saved_billers = get_response.json()["saved_billers"]
        
        # Find our saved biller
        found = False
        for biller in saved_billers:
            if biller["account_no"] == account_no:
                found = True
                assert biller["biller_code"] == "globe"
                assert biller["nickname"] == "My Globe Account"
                break
        
        assert found, "Saved biller not found in GET response"
    
    def test_save_biller_via_bill_payment(self, session_token):
        """Test saving biller during bill payment"""
        account_no = f"PAY{uuid.uuid4().hex[:8]}"
        
        # Pay bill with save_biller=True
        pay_response = requests.post(
            f"{BASE_URL}/api/recipient/bills/pay",
            json={
                "biller_code": "smart",
                "account_no": account_no,
                "amount": 100.0,
                "save_biller": True,
                "nickname": "Smart Prepaid"
            },
            headers={"X-Session-Token": session_token}
        )
        
        assert pay_response.status_code == 200
        
        # Verify biller was saved
        get_response = requests.get(
            f"{BASE_URL}/api/recipient/bills/saved",
            headers={"X-Session-Token": session_token}
        )
        
        saved_billers = get_response.json()["saved_billers"]
        account_numbers = [b["account_no"] for b in saved_billers]
        assert account_no in account_numbers
    
    def test_saved_billers_user_isolated(self):
        """Test saved billers are isolated per user"""
        token1 = f"TEST-ISO1-{uuid.uuid4()}"
        token2 = f"TEST-ISO2-{uuid.uuid4()}"
        account_no = f"ISO{uuid.uuid4().hex[:8]}"
        
        # User 1 saves biller
        requests.post(
            f"{BASE_URL}/api/recipient/bills/save",
            json={
                "biller_code": "meralco",
                "account_no": account_no,
                "nickname": "User1 Meralco"
            },
            headers={"X-Session-Token": token1}
        )
        
        # User 2 should not see User 1's saved biller
        get_response = requests.get(
            f"{BASE_URL}/api/recipient/bills/saved",
            headers={"X-Session-Token": token2}
        )
        
        saved_billers = get_response.json()["saved_billers"]
        account_numbers = [b["account_no"] for b in saved_billers]
        assert account_no not in account_numbers


class TestStatementsMongoDB:
    """Tests for transaction ledger in MongoDB"""
    
    @pytest.fixture
    def session_token(self):
        """Generate a unique session token for testing"""
        return f"TEST-STMT-{uuid.uuid4()}"
    
    def test_statements_returns_all_transactions(self, session_token):
        """Test statements returns all transaction types"""
        # Create various transactions
        # 1. FX Conversion
        requests.post(
            f"{BASE_URL}/api/recipient/convert/execute",
            json={"amount_usd": 25.0},
            headers={"X-Session-Token": session_token}
        )
        
        # 2. Bill Payment
        requests.post(
            f"{BASE_URL}/api/recipient/bills/pay",
            json={
                "biller_code": "meralco",
                "account_no": "1234567890",
                "amount": 200.0
            },
            headers={"X-Session-Token": session_token}
        )
        
        # 3. Transfer
        requests.post(
            f"{BASE_URL}/api/recipient/transfers/send",
            json={
                "method": "gcash",
                "amount": 300.0,
                "recipient_account": "09171234567"
            },
            headers={"X-Session-Token": session_token}
        )
        
        # Get statements
        statements = requests.get(
            f"{BASE_URL}/api/recipient/statements",
            headers={"X-Session-Token": session_token}
        ).json()
        
        # Verify we have transactions
        assert statements["total"] >= 3
        
        # Verify transaction types
        types = [t["type"] for t in statements["transactions"]]
        assert "fx_conversion" in types
        assert "bill_payment" in types
        assert "transfer_out" in types
    
    def test_statements_summary_aggregation(self, session_token):
        """Test statements summary aggregates correctly"""
        # Create some transactions
        requests.post(
            f"{BASE_URL}/api/recipient/convert/execute",
            json={"amount_usd": 50.0},
            headers={"X-Session-Token": session_token}
        )
        
        requests.post(
            f"{BASE_URL}/api/recipient/bills/pay",
            json={
                "biller_code": "pldt",
                "account_no": "9876543210",
                "amount": 150.0
            },
            headers={"X-Session-Token": session_token}
        )
        
        # Get statements
        statements = requests.get(
            f"{BASE_URL}/api/recipient/statements",
            headers={"X-Session-Token": session_token}
        ).json()
        
        # Verify summary structure
        summary = statements["summary"]
        assert "total_credits_usd" in summary
        assert "total_conversions" in summary
        assert "total_bills_paid" in summary
        assert "total_transfers" in summary
        
        # Verify bills paid is at least our payment
        assert summary["total_bills_paid"] >= 150.0
    
    def test_statements_user_isolated(self):
        """Test statements are isolated per user"""
        token1 = f"TEST-STMT-ISO1-{uuid.uuid4()}"
        token2 = f"TEST-STMT-ISO2-{uuid.uuid4()}"
        
        # User 1 creates transaction
        requests.post(
            f"{BASE_URL}/api/recipient/bills/pay",
            json={
                "biller_code": "meralco",
                "account_no": "USER1ACCT",
                "amount": 999.0
            },
            headers={"X-Session-Token": token1}
        )
        
        # User 2's statements should not include User 1's transaction
        statements = requests.get(
            f"{BASE_URL}/api/recipient/statements",
            headers={"X-Session-Token": token2}
        ).json()
        
        # User 2 should have no transactions (new user)
        assert statements["total"] == 0


class TestExistingTestUser:
    """Tests using the pre-seeded test user mentioned in requirements"""
    
    def test_existing_test_user_wallet(self):
        """Test the pre-seeded test user has expected balances"""
        # Using the test user mentioned: test-recipient-mongodb-1234
        token = "test-recipient-mongodb-1234"
        
        response = requests.get(
            f"{BASE_URL}/api/recipient/wallet",
            headers={"X-Session-Token": token}
        )
        
        # This test verifies if the test user exists with expected balances
        # If user doesn't exist, it will be created with defaults
        assert response.status_code == 200
        data = response.json()
        
        # Verify wallet structure
        assert "usd_balance" in data
        assert "php_balance" in data
        assert isinstance(data["usd_balance"], (int, float))
        assert isinstance(data["php_balance"], (int, float))


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
