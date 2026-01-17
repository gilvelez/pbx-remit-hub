"""
PBX Recipient API Tests (Updated for MongoDB)
Tests for wallet, FX conversion, bills, transfers, and statements endpoints
All endpoints now require X-Session-Token header for authentication
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


@pytest.fixture
def session_token():
    """Generate a unique session token for testing"""
    return f"TEST-RECIP-{uuid.uuid4()}"


def get_headers(token):
    """Get headers with session token"""
    return {"X-Session-Token": token, "Content-Type": "application/json"}


class TestRecipientWallet:
    """Wallet endpoint tests"""
    
    def test_get_wallet_balances(self, session_token):
        """Test GET /api/recipient/wallet returns wallet balances"""
        response = requests.get(
            f"{BASE_URL}/api/recipient/wallet",
            headers=get_headers(session_token)
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "user_id" in data
        assert "usd_balance" in data
        assert "php_balance" in data
        assert "sub_wallets" in data
        assert "updated_at" in data
        
        # Verify data types
        assert isinstance(data["usd_balance"], (int, float))
        assert isinstance(data["php_balance"], (int, float))
        assert isinstance(data["sub_wallets"], dict)
        
        # Verify default values for new user
        assert data["usd_balance"] == 1500.0
        assert data["php_balance"] == 25000.0


class TestRecipientFxConversion:
    """FX conversion endpoint tests"""
    
    def test_get_fx_quote(self):
        """Test GET /api/recipient/convert returns FX quote (no auth required)"""
        response = requests.get(f"{BASE_URL}/api/recipient/convert?amount_usd=100")
        assert response.status_code == 200
        
        data = response.json()
        # Verify all required fields
        assert "mid_market_rate" in data
        assert "pbx_rate" in data
        assert "pbx_spread_percent" in data
        assert "bank_rate" in data
        assert "bank_spread_percent" in data
        assert "amount_usd" in data
        assert "amount_php" in data
        assert "savings_php" in data
        assert "lock_duration_seconds" in data
        assert "timestamp" in data
        assert "source" in data
        
        # Verify values
        assert data["amount_usd"] == 100.0
        assert data["pbx_spread_percent"] == 0.5
        assert data["bank_spread_percent"] == 2.5
        assert data["lock_duration_seconds"] == 900  # 15 minutes
        assert data["source"] == "mock"
        
        # Verify rate calculations
        assert data["pbx_rate"] < data["mid_market_rate"]  # PBX rate has spread
        assert data["bank_rate"] < data["pbx_rate"]  # Bank rate has higher spread
        assert data["savings_php"] > 0  # User saves money with PBX
    
    def test_get_fx_quote_different_amounts(self):
        """Test FX quote with different USD amounts"""
        for amount in [50, 500, 1000]:
            response = requests.get(f"{BASE_URL}/api/recipient/convert?amount_usd={amount}")
            assert response.status_code == 200
            data = response.json()
            assert data["amount_usd"] == amount
            assert data["amount_php"] > 0
    
    def test_lock_fx_rate(self, session_token):
        """Test POST /api/recipient/convert/lock locks rate for 15 minutes"""
        response = requests.post(
            f"{BASE_URL}/api/recipient/convert/lock",
            json={"amount_usd": 100},
            headers=get_headers(session_token)
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        assert "lock_id" in data
        assert "rate" in data
        assert "expires_at" in data
        assert "expires_in_seconds" in data
        assert data["expires_in_seconds"] == 900  # 15 minutes
    
    def test_execute_conversion(self, session_token):
        """Test POST /api/recipient/convert/execute converts USD to PHP"""
        response = requests.post(
            f"{BASE_URL}/api/recipient/convert/execute",
            json={"amount_usd": 100},
            headers=get_headers(session_token)
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        assert "transaction_id" in data
        assert data["from_amount"] == 100
        assert data["from_currency"] == "USD"
        assert data["to_currency"] == "PHP"
        assert data["to_amount"] > 0
        assert "rate" in data
        assert data["status"] == "completed"
    
    def test_execute_conversion_invalid_amount(self, session_token):
        """Test conversion with invalid amount returns 400"""
        response = requests.post(
            f"{BASE_URL}/api/recipient/convert/execute",
            json={"amount_usd": 0},
            headers=get_headers(session_token)
        )
        assert response.status_code == 400
        
        response = requests.post(
            f"{BASE_URL}/api/recipient/convert/execute",
            json={"amount_usd": -100},
            headers=get_headers(session_token)
        )
        assert response.status_code == 400


class TestRecipientBills:
    """Bills payment endpoint tests"""
    
    def test_get_billers(self):
        """Test GET /api/recipient/bills/billers returns Philippine billers (no auth required)"""
        response = requests.get(f"{BASE_URL}/api/recipient/bills/billers")
        assert response.status_code == 200
        
        data = response.json()
        assert "billers" in data
        billers = data["billers"]
        
        # Verify required billers exist
        biller_codes = [b["code"] for b in billers]
        assert "meralco" in biller_codes
        assert "pldt" in biller_codes
        assert "globe" in biller_codes
        assert "smart" in biller_codes
        assert "maynilad" in biller_codes
        assert "manila_water" in biller_codes
        
        # Verify biller structure
        for biller in billers:
            assert "code" in biller
            assert "name" in biller
            assert "category" in biller
            assert "logo" in biller
    
    def test_get_saved_billers(self, session_token):
        """Test GET /api/recipient/bills/saved returns saved billers"""
        response = requests.get(
            f"{BASE_URL}/api/recipient/bills/saved",
            headers=get_headers(session_token)
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "saved_billers" in data
    
    def test_get_bill_history(self, session_token):
        """Test GET /api/recipient/bills/history returns payment history"""
        response = requests.get(
            f"{BASE_URL}/api/recipient/bills/history",
            headers=get_headers(session_token)
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "payments" in data
    
    def test_pay_bill(self, session_token):
        """Test POST /api/recipient/bills/pay pays a bill"""
        response = requests.post(
            f"{BASE_URL}/api/recipient/bills/pay",
            json={
                "biller_code": "meralco",
                "account_no": "1234567890",
                "amount": 1000,
                "save_biller": False,
                "nickname": ""
            },
            headers=get_headers(session_token)
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        assert "transaction_id" in data
        assert data["biller_name"] == "Meralco"
        assert data["account_no"] == "1234567890"
        assert data["amount"] == 1000
        assert data["status"] == "paid"
    
    def test_pay_bill_invalid_biller(self, session_token):
        """Test paying with invalid biller returns 400"""
        response = requests.post(
            f"{BASE_URL}/api/recipient/bills/pay",
            json={
                "biller_code": "invalid_biller",
                "account_no": "1234567890",
                "amount": 1000
            },
            headers=get_headers(session_token)
        )
        assert response.status_code == 400
    
    def test_pay_bill_invalid_amount(self, session_token):
        """Test paying with invalid amount returns 400"""
        response = requests.post(
            f"{BASE_URL}/api/recipient/bills/pay",
            json={
                "biller_code": "meralco",
                "account_no": "1234567890",
                "amount": 0
            },
            headers=get_headers(session_token)
        )
        assert response.status_code == 400


class TestRecipientTransfers:
    """Transfer endpoint tests"""
    
    def test_get_transfer_methods(self):
        """Test GET /api/recipient/transfers/methods returns methods and banks (no auth required)"""
        response = requests.get(f"{BASE_URL}/api/recipient/transfers/methods")
        assert response.status_code == 200
        
        data = response.json()
        assert "methods" in data
        assert "banks" in data
        
        # Verify transfer methods
        method_ids = [m["id"] for m in data["methods"]]
        assert "instapay" in method_ids
        assert "pesonet" in method_ids
        assert "gcash" in method_ids
        assert "maya" in method_ids
        
        # Verify banks
        bank_codes = [b["code"] for b in data["banks"]]
        assert "bpi" in bank_codes
        assert "bdo" in bank_codes
    
    def test_get_transfer_history(self, session_token):
        """Test GET /api/recipient/transfers/history returns transfer history"""
        response = requests.get(
            f"{BASE_URL}/api/recipient/transfers/history",
            headers=get_headers(session_token)
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "transfers" in data
    
    def test_create_transfer_gcash(self, session_token):
        """Test POST /api/recipient/transfers/send creates GCash transfer"""
        response = requests.post(
            f"{BASE_URL}/api/recipient/transfers/send",
            json={
                "method": "gcash",
                "amount": 5000,
                "recipient_account": "09171234567",
                "recipient_name": "Juan Dela Cruz"
            },
            headers=get_headers(session_token)
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        assert "transaction_id" in data
        assert data["method"] == "GCash"
        assert data["amount"] == 5000
        assert data["status"] == "completed"  # E-wallet is instant
    
    def test_create_transfer_instapay(self, session_token):
        """Test POST /api/recipient/transfers/send creates InstaPay transfer"""
        response = requests.post(
            f"{BASE_URL}/api/recipient/transfers/send",
            json={
                "method": "instapay",
                "amount": 10000,
                "recipient_account": "1234567890",
                "recipient_name": "Juan Dela Cruz",
                "bank_code": "bpi"
            },
            headers=get_headers(session_token)
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        assert data["method"] == "InstaPay"
        assert data["status"] == "processing"  # Bank transfer is processing
    
    def test_create_transfer_invalid_method(self, session_token):
        """Test transfer with invalid method returns 400"""
        response = requests.post(
            f"{BASE_URL}/api/recipient/transfers/send",
            json={
                "method": "invalid_method",
                "amount": 5000,
                "recipient_account": "09171234567"
            },
            headers=get_headers(session_token)
        )
        assert response.status_code == 400
    
    def test_create_transfer_exceeds_limit(self, session_token):
        """Test transfer exceeding limit returns 400"""
        response = requests.post(
            f"{BASE_URL}/api/recipient/transfers/send",
            json={
                "method": "instapay",
                "amount": 100000,  # Exceeds InstaPay limit of 50000
                "recipient_account": "1234567890",
                "bank_code": "bpi"
            },
            headers=get_headers(session_token)
        )
        assert response.status_code == 400


class TestRecipientStatements:
    """Statements endpoint tests"""
    
    def test_get_statements(self, session_token):
        """Test GET /api/recipient/statements returns transaction history"""
        response = requests.get(
            f"{BASE_URL}/api/recipient/statements",
            headers=get_headers(session_token)
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "transactions" in data
        assert "total" in data
        assert "summary" in data
        
        # Verify summary fields
        summary = data["summary"]
        assert "total_credits_usd" in summary
        assert "total_conversions" in summary
        assert "total_bills_paid" in summary
        assert "total_transfers" in summary
    
    def test_get_statements_with_limit(self, session_token):
        """Test statements with limit parameter"""
        response = requests.get(
            f"{BASE_URL}/api/recipient/statements?limit=5",
            headers=get_headers(session_token)
        )
        assert response.status_code == 200
        
        data = response.json()
        assert len(data["transactions"]) <= 5
    
    def test_export_statement_pdf(self, session_token):
        """Test POST /api/recipient/statements/export generates PDF (mocked)"""
        response = requests.post(
            f"{BASE_URL}/api/recipient/statements/export",
            headers=get_headers(session_token)
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        assert "download_url" in data
        assert "filename" in data


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
