# PBX Mock Plaid API

## Overview

Mock implementation of Plaid API endpoints for demo purposes. All data is stored in the user's SessionState and persists across requests until cleared.

## Base Path

All endpoints are under `/api/plaid/mock`

## Endpoints

### POST /api/plaid/mock/create-link-token

Create a mock Plaid Link token (simulates Plaid Link flow).

**Request:**
```bash
curl -X POST http://localhost:8001/api/plaid/mock/create-link-token
```

**Response:**
```json
{
  "link_token": "link-sandbox-b67c1d4ac599499e",
  "expiration": "2025-10-26T10:13:31.284442Z"
}
```

**Notes:**
- Link token expires in 1 hour
- No authentication required (public endpoint)
- Token format: `link-sandbox-{16 hex chars}`

---

### POST /api/plaid/mock/exchange

Exchange a public token for an access token (simulates Plaid token exchange).

**Request:**
```bash
curl -b cookies.txt -X POST http://localhost:8001/api/plaid/mock/exchange \
  -H "Content-Type: application/json" \
  -d '{"public_token": "public-sandbox-test"}'
```

**Response:**
```json
{
  "access_token": "access-sandbox-fb939d756c6248c386e1",
  "item_id": "item-sandbox-a31eebf9d2f54dcf"
}
```

**Behavior:**
- Generates mock access_token and item_id
- Saves access_token to user's SessionState
- Requires user cookie (pbx_uid) - creates if doesn't exist
- Token format: `access-sandbox-{20 hex chars}`
- Item ID format: `item-sandbox-{16 hex chars}`

---

### GET /api/plaid/mock/accounts

Get mock bank accounts. Seeds sample accounts on first call.

**Request:**
```bash
curl -b cookies.txt http://localhost:8001/api/plaid/mock/accounts
```

**Response:**
```json
{
  "accounts": [
    {
      "account_id": "acc_58e2b5a4",
      "name": "Plaid Checking",
      "mask": "0000",
      "subtype": "checking",
      "type": "depository",
      "balances": {
        "current": 1250.00,
        "available": 1200.00,
        "limit": null,
        "iso_currency_code": "USD",
        "unofficial_currency_code": null
      }
    },
    {
      "account_id": "acc_c8d37c65",
      "name": "Plaid Savings",
      "mask": "1111",
      "subtype": "savings",
      "type": "depository",
      "balances": {
        "current": 5420.50,
        "available": 5420.50,
        "limit": null,
        "iso_currency_code": "USD",
        "unofficial_currency_code": null
      }
    },
    {
      "account_id": "acc_a1bbef02",
      "name": "Plaid Credit Card",
      "mask": "3333",
      "subtype": "credit card",
      "type": "credit",
      "balances": {
        "current": 420.00,
        "available": 7580.00,
        "limit": 8000.00,
        "iso_currency_code": "USD",
        "unofficial_currency_code": null
      }
    }
  ]
}
```

**Behavior:**
- First call: Seeds 3 mock accounts (checking, savings, credit card)
- Subsequent calls: Returns cached accounts from SessionState
- Saves to SessionState.accounts
- Requires user cookie (pbx_uid)

---

### GET /api/plaid/mock/transactions?limit=10

Get mock transactions. Seeds sample transactions on first call.

**Parameters:**
- `limit` (query, optional): Number of transactions to return (default: 10)

**Request:**
```bash
curl -b cookies.txt "http://localhost:8001/api/plaid/mock/transactions?limit=5"
```

**Response:**
```json
{
  "transactions": [
    {
      "transaction_id": "tx_1199fe42cfa9",
      "account_id": "acc_58e2b5a4",
      "amount": -85.32,
      "date": "2025-10-26",
      "authorized_date": "2025-10-26",
      "name": "Whole Foods Market",
      "merchant_name": "Whole Foods Market",
      "category": ["Shops", "Food and Drink", "Groceries"],
      "category_id": "83320744",
      "pending": false,
      "iso_currency_code": "USD",
      "unofficial_currency_code": null,
      "payment_channel": "in store"
    },
    ...
  ]
}
```

**Transaction Categories:**
1. **Groceries**: Whole Foods, Trader Joe's, Safeway
2. **Bills**: PG&E, AT&T, Comcast
3. **Income**: Direct Deposit, Zelle Transfer
4. **Restaurants**: Chipotle, Starbucks
5. **Shopping**: Amazon, Target
6. **Transportation**: Shell Gas, Uber

**Behavior:**
- First call: Seeds up to 10 realistic transactions
- Transactions dated from today going back 2 days per transaction
- Links transactions to user's account IDs
- Subsequent calls: Returns cached transactions
- Saves to SessionState.transactions
- Requires user cookie (pbx_uid)

## Complete Flow Example

```bash
# 1. Get initial state (creates user cookie)
curl -c cookies.txt http://localhost:8001/api/state

# 2. Create link token (would be used in Plaid Link UI)
curl -X POST http://localhost:8001/api/plaid/mock/create-link-token

# 3. Exchange public token for access token
curl -b cookies.txt -X POST http://localhost:8001/api/plaid/mock/exchange \
  -H "Content-Type: application/json" \
  -d '{"public_token": "public-sandbox-test"}'

# 4. Get accounts (seeds on first call)
curl -b cookies.txt http://localhost:8001/api/plaid/mock/accounts

# 5. Get transactions (seeds on first call)
curl -b cookies.txt "http://localhost:8001/api/plaid/mock/transactions?limit=10"

# 6. Verify all data is in session
curl -b cookies.txt http://localhost:8001/api/state

# 7. Clear state (reset demo)
curl -b cookies.txt -X POST http://localhost:8001/api/state/clear

# 8. Get accounts again (will seed fresh data)
curl -b cookies.txt http://localhost:8001/api/plaid/mock/accounts
```

## Data Persistence

All mock data is stored in MongoDB via SessionState:

```javascript
{
  user_id: "743fbb9b-493b-44eb-8020-93c2b2bd6b28",
  access_token: "access-sandbox-fb939d756c6248c386e1",
  accounts: [...],      // 3 accounts
  transactions: [...],  // Up to 10 transactions
  activity: []          // Transfer activity (separate)
}
```

## State Management

- **First visit**: Creates user_id cookie, empty session
- **After exchange**: Stores access_token
- **After accounts call**: Stores 3 mock accounts
- **After transactions call**: Stores mock transactions
- **After clear**: Deletes session, creates fresh one with same user_id

## Testing Scenarios

### Scenario 1: New User Flow
```bash
rm -f /tmp/test.txt
curl -c /tmp/test.txt -s http://localhost:8001/api/state | jq '.user_id'
# Creates new UUID

curl -b /tmp/test.txt -s -X POST http://localhost:8001/api/plaid/mock/exchange \
  -H "Content-Type: application/json" -d '{}' | jq '.access_token'
# Generates access token

curl -b /tmp/test.txt -s http://localhost:8001/api/plaid/mock/accounts | jq '.accounts | length'
# Returns 3 accounts

curl -b /tmp/test.txt -s http://localhost:8001/api/state | jq '{
  has_token: (.access_token != null),
  accounts: (.accounts | length)
}'
# Verify data persisted
```

### Scenario 2: Data Persistence
```bash
# Get accounts
ID1=$(curl -b /tmp/test.txt -s http://localhost:8001/api/plaid/mock/accounts | jq -r '.accounts[0].account_id')

# Get accounts again
ID2=$(curl -b /tmp/test.txt -s http://localhost:8001/api/plaid/mock/accounts | jq -r '.accounts[0].account_id')

# Should match
echo "$ID1 == $ID2"
```

### Scenario 3: State Reset
```bash
# Clear state
curl -b /tmp/test.txt -s -X POST http://localhost:8001/api/state/clear > /dev/null

# Get accounts (will generate new ones)
curl -b /tmp/test.txt -s http://localhost:8001/api/plaid/mock/accounts | jq '.accounts[0].account_id'
# Different account_id than before
```

## Frontend Integration

```javascript
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Create link token
const createLinkToken = async () => {
  const { data } = await axios.post(`${API}/plaid/mock/create-link-token`, {}, {
    withCredentials: true
  });
  return data.link_token;
};

// Exchange token
const exchangeToken = async (publicToken) => {
  const { data } = await axios.post(`${API}/plaid/mock/exchange`, 
    { public_token: publicToken },
    { withCredentials: true }
  );
  return data.access_token;
};

// Get accounts
const getAccounts = async () => {
  const { data } = await axios.get(`${API}/plaid/mock/accounts`, {
    withCredentials: true
  });
  return data.accounts;
};

// Get transactions
const getTransactions = async (limit = 10) => {
  const { data } = await axios.get(`${API}/plaid/mock/transactions`, {
    params: { limit },
    withCredentials: true
  });
  return data.transactions;
};
```

## Notes

1. **Sandbox Only**: This is for demo purposes. Real Plaid integration requires actual API keys.
2. **No Validation**: Public token is not validated (any value works).
3. **Seeding Logic**: Data is seeded once per user and cached until cleared.
4. **Account Linking**: Transactions reference actual account_ids from seeded accounts.
5. **Realistic Data**: Transaction names, amounts, and categories mirror real banking data.
