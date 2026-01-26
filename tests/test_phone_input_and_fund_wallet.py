"""
Test Phone Input with Country Selector and Fund Wallet API
Tests for FIX #1 (Phone input with country selector) and FIX #2 (Fund wallet clone error fix)
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://pbx-social.preview.emergentagent.com')


class TestFundWalletAPI:
    """Test Fund Wallet API - FIX #2: Clone error fix"""
    
    def test_fund_wallet_success(self):
        """Test successful wallet funding"""
        response = requests.post(
            f"{BASE_URL}/api/recipient/wallet/fund",
            headers={
                "Content-Type": "application/json",
                "X-Session-Token": "test-fund-wallet-001"
            },
            json={"amount": 100}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert data["success"] == True
        assert "transaction_id" in data
        assert data["amount"] == 100
        assert data["currency"] == "USD"
        assert "new_balance" in data
        assert data["is_simulation"] == True
        assert "message" in data
    
    def test_fund_wallet_multiple_calls_no_clone_error(self):
        """Test multiple fund wallet calls don't cause clone error"""
        for i in range(3):
            response = requests.post(
                f"{BASE_URL}/api/recipient/wallet/fund",
                headers={
                    "Content-Type": "application/json",
                    "X-Session-Token": f"test-fund-wallet-multi-{i}"
                },
                json={"amount": 50}
            )
            
            assert response.status_code == 200
            data = response.json()
            assert data["success"] == True
            assert "transaction_id" in data
    
    def test_fund_wallet_invalid_amount_zero(self):
        """Test funding with zero amount fails"""
        response = requests.post(
            f"{BASE_URL}/api/recipient/wallet/fund",
            headers={
                "Content-Type": "application/json",
                "X-Session-Token": "test-fund-wallet-zero"
            },
            json={"amount": 0}
        )
        
        assert response.status_code == 422  # Validation error
    
    def test_fund_wallet_invalid_amount_negative(self):
        """Test funding with negative amount fails"""
        response = requests.post(
            f"{BASE_URL}/api/recipient/wallet/fund",
            headers={
                "Content-Type": "application/json",
                "X-Session-Token": "test-fund-wallet-negative"
            },
            json={"amount": -100}
        )
        
        assert response.status_code == 422  # Validation error
    
    def test_fund_wallet_exceeds_max(self):
        """Test funding exceeding max amount ($5000) fails"""
        response = requests.post(
            f"{BASE_URL}/api/recipient/wallet/fund",
            headers={
                "Content-Type": "application/json",
                "X-Session-Token": "test-fund-wallet-max"
            },
            json={"amount": 6000}
        )
        
        assert response.status_code == 422  # Validation error
    
    def test_fund_wallet_no_session(self):
        """Test funding without session token fails"""
        response = requests.post(
            f"{BASE_URL}/api/recipient/wallet/fund",
            headers={
                "Content-Type": "application/json"
            },
            json={"amount": 100}
        )
        
        assert response.status_code == 401


class TestQuickAddAPI:
    """Test Quick Add API for phone invites"""
    
    def test_quick_add_phone_e164_format(self):
        """Test quick add with E.164 formatted phone number"""
        response = requests.post(
            f"{BASE_URL}/api/social/quick-add",
            headers={
                "Content-Type": "application/json",
                "X-Session-Token": "test-quick-add-001"
            },
            json={
                "contact": "+15551234567",  # E.164 format
                "name": "Test User"
            }
        )
        
        # Should return 200 (user found or invite sent)
        assert response.status_code in [200, 201]
        data = response.json()
        
        # Should have either found or invited
        assert "found" in data or "invited" in data
    
    def test_quick_add_ph_phone_e164_format(self):
        """Test quick add with Philippines E.164 formatted phone number"""
        response = requests.post(
            f"{BASE_URL}/api/social/quick-add",
            headers={
                "Content-Type": "application/json",
                "X-Session-Token": "test-quick-add-ph-001"
            },
            json={
                "contact": "+639171234567",  # E.164 format for PH
                "name": "Test PH User"
            }
        )
        
        # Should return 200 (user found or invite sent)
        assert response.status_code in [200, 201]
        data = response.json()
        
        # Should have either found or invited
        assert "found" in data or "invited" in data


class TestHealthCheck:
    """Basic health check tests"""
    
    def test_api_health(self):
        """Test API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
