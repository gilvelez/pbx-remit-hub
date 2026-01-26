"""
P1 Verification Tests - Wallet Balance & FX Conversion
Tests: Registration, Login, Wallet Balance, FX Quote, FX Convert
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://pbx-social.preview.emergentagent.com').rstrip('/')

# Generate unique test user for this run
TEST_TIMESTAMP = int(time.time())


class TestAuthRegistration:
    """Test user registration with email/password"""
    
    def test_register_new_user(self):
        """POST /api/auth/register - Creates new user with demo wallet"""
        email = f"test_p1_{TEST_TIMESTAMP}@gmail.com"
        password = "testpass123"
        
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": password,
            "displayName": "Test P1 User"
        })
        
        assert response.status_code == 200, f"Registration failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "token" in data, "Missing token in response"
        assert "user" in data, "Missing user in response"
        assert data["user"]["email"] == email
        assert data["user"]["displayName"] == "Test P1 User"
        assert "userId" in data["user"]
        
        # Store for other tests
        TestAuthRegistration.test_token = data["token"]
        TestAuthRegistration.test_user_id = data["user"]["userId"]
        TestAuthRegistration.test_email = email
        TestAuthRegistration.test_password = password
        
        print(f"✓ Registered user: {email}")
    
    def test_register_duplicate_email_fails(self):
        """POST /api/auth/register - Duplicate email returns 400"""
        email = f"test_p1_{TEST_TIMESTAMP}@gmail.com"  # Same as above
        
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": "anotherpass123"
        })
        
        assert response.status_code == 400, f"Expected 400 for duplicate email, got {response.status_code}"
        data = response.json()
        assert "already registered" in data.get("detail", "").lower() or "already" in str(data).lower()
        print("✓ Duplicate email rejected")
    
    def test_register_short_password_fails(self):
        """POST /api/auth/register - Password < 6 chars returns 400"""
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": f"shortpw_{TEST_TIMESTAMP}@gmail.com",
            "password": "12345"  # Too short
        })
        
        assert response.status_code == 400, f"Expected 400 for short password, got {response.status_code}"
        print("✓ Short password rejected")


class TestAuthLogin:
    """Test user login with email/password"""
    
    def test_login_success(self):
        """POST /api/auth/login - Valid credentials return JWT token"""
        # First register a user
        email = f"login_test_{TEST_TIMESTAMP}@gmail.com"
        password = "loginpass123"
        
        reg_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": password
        })
        assert reg_response.status_code == 200, f"Registration failed: {reg_response.text}"
        
        # Now login
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": email,
            "password": password
        })
        
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        
        assert "token" in data
        assert "user" in data
        assert data["user"]["email"] == email
        
        TestAuthLogin.login_token = data["token"]
        print(f"✓ Login successful for {email}")
    
    def test_login_wrong_password_fails(self):
        """POST /api/auth/login - Wrong password returns 401"""
        email = f"login_test_{TEST_TIMESTAMP}@gmail.com"  # Existing user
        
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": email,
            "password": "wrongpassword"
        })
        
        assert response.status_code == 401, f"Expected 401 for wrong password, got {response.status_code}"
        print("✓ Wrong password rejected")
    
    def test_login_nonexistent_user_fails(self):
        """POST /api/auth/login - Non-existent user returns 401"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": f"nonexistent_{TEST_TIMESTAMP}@gmail.com",
            "password": "anypassword"
        })
        
        assert response.status_code == 401, f"Expected 401 for non-existent user, got {response.status_code}"
        print("✓ Non-existent user rejected")


class TestWalletBalance:
    """Test wallet balance endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Create test user and get token"""
        email = f"wallet_test_{TEST_TIMESTAMP}@gmail.com"
        password = "walletpass123"
        
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": password
        })
        
        if response.status_code == 200:
            self.token = response.json()["token"]
        elif response.status_code == 400:  # Already exists, login
            login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": email,
                "password": password
            })
            self.token = login_resp.json()["token"]
        
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "X-Session-Token": self.token,
            "Content-Type": "application/json"
        }
    
    def test_get_wallet_balance_authenticated(self):
        """GET /api/wallet/balance - Returns wallet balances with JWT auth"""
        response = requests.get(f"{BASE_URL}/api/wallet/balance", headers=self.headers)
        
        assert response.status_code == 200, f"Failed to get balance: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "usd" in data, "Missing usd balance"
        assert "php" in data, "Missing php balance"
        assert "usdc" in data, "Missing usdc balance"
        
        # Verify demo seeding (new users get $500 USD, ₱28,060 PHP)
        assert data["usd"] == 500, f"Expected $500 USD, got {data['usd']}"
        assert data["php"] == 28060, f"Expected ₱28,060 PHP, got {data['php']}"
        
        print(f"✓ Wallet balance: ${data['usd']} USD, ₱{data['php']} PHP")
    
    def test_get_wallet_balance_no_auth_fails(self):
        """GET /api/wallet/balance - No auth returns 401"""
        response = requests.get(f"{BASE_URL}/api/wallet/balance")
        
        assert response.status_code == 401, f"Expected 401 without auth, got {response.status_code}"
        print("✓ Unauthenticated request rejected")


class TestFXQuote:
    """Test FX quote endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Create test user and get token"""
        email = f"fx_quote_{TEST_TIMESTAMP}@gmail.com"
        password = "fxquotepass123"
        
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": password
        })
        
        if response.status_code == 200:
            self.token = response.json()["token"]
        elif response.status_code == 400:
            login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": email,
                "password": password
            })
            self.token = login_resp.json()["token"]
        
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "X-Session-Token": self.token,
            "Content-Type": "application/json"
        }
    
    def test_get_fx_quote_usd_to_php(self):
        """GET /api/fx/quote - Returns FX quote for USD→PHP"""
        response = requests.get(
            f"{BASE_URL}/api/fx/quote",
            params={"from": "USD", "to": "PHP", "amount": 100},
            headers=self.headers
        )
        
        assert response.status_code == 200, f"Failed to get quote: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "from" in data and data["from"] == "USD"
        assert "to" in data and data["to"] == "PHP"
        assert "amount" in data and data["amount"] == 100
        assert "rate" in data
        assert "converted" in data
        assert "timestamp" in data
        
        # Verify rate is reasonable (fallback is 56.10)
        assert data["rate"] > 50 and data["rate"] < 70, f"Rate {data['rate']} seems unreasonable"
        
        # Verify conversion math
        expected_converted = round(100 * data["rate"], 2)
        assert data["converted"] == expected_converted, f"Conversion mismatch: {data['converted']} != {expected_converted}"
        
        print(f"✓ FX Quote: $100 USD = ₱{data['converted']} PHP @ rate {data['rate']}")
    
    def test_get_fx_quote_zero_amount_fails(self):
        """GET /api/fx/quote - Zero amount returns 400"""
        response = requests.get(
            f"{BASE_URL}/api/fx/quote",
            params={"from": "USD", "to": "PHP", "amount": 0},
            headers=self.headers
        )
        
        assert response.status_code == 400, f"Expected 400 for zero amount, got {response.status_code}"
        print("✓ Zero amount rejected")
    
    def test_get_fx_quote_negative_amount_fails(self):
        """GET /api/fx/quote - Negative amount returns 400"""
        response = requests.get(
            f"{BASE_URL}/api/fx/quote",
            params={"from": "USD", "to": "PHP", "amount": -50},
            headers=self.headers
        )
        
        assert response.status_code == 400, f"Expected 400 for negative amount, got {response.status_code}"
        print("✓ Negative amount rejected")
    
    def test_get_fx_quote_no_auth_fails(self):
        """GET /api/fx/quote - No auth returns 401"""
        response = requests.get(
            f"{BASE_URL}/api/fx/quote",
            params={"from": "USD", "to": "PHP", "amount": 100}
        )
        
        assert response.status_code == 401, f"Expected 401 without auth, got {response.status_code}"
        print("✓ Unauthenticated request rejected")


class TestFXConvert:
    """Test FX conversion endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Create test user and get token"""
        email = f"fx_convert_{TEST_TIMESTAMP}@gmail.com"
        password = "fxconvertpass123"
        
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": password
        })
        
        if response.status_code == 200:
            self.token = response.json()["token"]
        elif response.status_code == 400:
            login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": email,
                "password": password
            })
            self.token = login_resp.json()["token"]
        
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "X-Session-Token": self.token,
            "Content-Type": "application/json"
        }
    
    def test_convert_usd_to_php_success(self):
        """POST /api/fx/convert - Converts USD to PHP and updates balances"""
        # First get initial balance
        balance_resp = requests.get(f"{BASE_URL}/api/wallet/balance", headers=self.headers)
        initial_balance = balance_resp.json()
        initial_usd = initial_balance["usd"]
        initial_php = initial_balance["php"]
        
        # Convert $100 USD to PHP
        convert_amount = 100
        response = requests.post(
            f"{BASE_URL}/api/fx/convert",
            json={"amount": convert_amount, "from_currency": "USD", "to_currency": "PHP"},
            headers=self.headers
        )
        
        assert response.status_code == 200, f"Conversion failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert data["success"] == True
        assert "converted" in data
        assert "rate" in data
        assert "new_balances" in data
        
        # Verify balance updates
        new_usd = data["new_balances"]["usd"]
        new_php = data["new_balances"]["php"]
        
        assert new_usd == initial_usd - convert_amount, f"USD not deducted: {new_usd} != {initial_usd - convert_amount}"
        assert new_php == initial_php + data["converted"], f"PHP not credited: {new_php} != {initial_php + data['converted']}"
        
        # Verify by fetching balance again
        verify_resp = requests.get(f"{BASE_URL}/api/wallet/balance", headers=self.headers)
        verify_balance = verify_resp.json()
        
        assert verify_balance["usd"] == new_usd, "Balance not persisted correctly"
        assert verify_balance["php"] == new_php, "Balance not persisted correctly"
        
        print(f"✓ Converted ${convert_amount} USD → ₱{data['converted']} PHP")
        print(f"  New balances: ${new_usd} USD, ₱{new_php} PHP")
    
    def test_convert_insufficient_balance_fails(self):
        """POST /api/fx/convert - Insufficient balance returns 400"""
        # Try to convert more than available ($500 default)
        response = requests.post(
            f"{BASE_URL}/api/fx/convert",
            json={"amount": 10000, "from_currency": "USD", "to_currency": "PHP"},
            headers=self.headers
        )
        
        assert response.status_code == 400, f"Expected 400 for insufficient balance, got {response.status_code}"
        data = response.json()
        assert "insufficient" in data.get("detail", "").lower()
        print("✓ Insufficient balance rejected")
    
    def test_convert_zero_amount_fails(self):
        """POST /api/fx/convert - Zero amount returns 400"""
        response = requests.post(
            f"{BASE_URL}/api/fx/convert",
            json={"amount": 0, "from_currency": "USD", "to_currency": "PHP"},
            headers=self.headers
        )
        
        assert response.status_code == 400, f"Expected 400 for zero amount, got {response.status_code}"
        print("✓ Zero amount rejected")
    
    def test_convert_negative_amount_fails(self):
        """POST /api/fx/convert - Negative amount returns 400"""
        response = requests.post(
            f"{BASE_URL}/api/fx/convert",
            json={"amount": -50, "from_currency": "USD", "to_currency": "PHP"},
            headers=self.headers
        )
        
        assert response.status_code == 400, f"Expected 400 for negative amount, got {response.status_code}"
        print("✓ Negative amount rejected")
    
    def test_convert_no_auth_fails(self):
        """POST /api/fx/convert - No auth returns 401"""
        response = requests.post(
            f"{BASE_URL}/api/fx/convert",
            json={"amount": 100, "from_currency": "USD", "to_currency": "PHP"}
        )
        
        assert response.status_code == 401, f"Expected 401 without auth, got {response.status_code}"
        print("✓ Unauthenticated request rejected")


class TestAuthMe:
    """Test /api/auth/me endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Create test user and get token"""
        email = f"auth_me_{TEST_TIMESTAMP}@gmail.com"
        password = "authmepass123"
        
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": password,
            "displayName": "Auth Me Test"
        })
        
        if response.status_code == 200:
            self.token = response.json()["token"]
            self.email = email
        elif response.status_code == 400:
            login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": email,
                "password": password
            })
            self.token = login_resp.json()["token"]
            self.email = email
        
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "X-Session-Token": self.token,
            "Content-Type": "application/json"
        }
    
    def test_get_current_user(self):
        """GET /api/auth/me - Returns current user info"""
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=self.headers)
        
        assert response.status_code == 200, f"Failed to get user: {response.text}"
        data = response.json()
        
        assert "user" in data
        assert data["user"]["email"] == self.email
        assert "userId" in data["user"]
        assert "linkedBanks" in data
        
        print(f"✓ Got user info: {data['user']['email']}")
    
    def test_get_current_user_no_auth_fails(self):
        """GET /api/auth/me - No auth returns 401"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        
        assert response.status_code == 401, f"Expected 401 without auth, got {response.status_code}"
        print("✓ Unauthenticated request rejected")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
