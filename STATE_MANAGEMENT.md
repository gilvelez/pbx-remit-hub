# PBX State Management API

## Overview

The state management system tracks user sessions and demo data using either authenticated user IDs or anonymous cookie-based identification.

## User Identification

### getUserId() Helper

Located in `/app/backend/utils/user_helper.py`

**Priority order:**
1. Authenticated user ID (when auth is implemented)
2. Cookie `pbx_uid` (UUID) - created if doesn't exist

**Cookie details:**
- Name: `pbx_uid`
- Value: UUID v4 string
- Max Age: 1 year
- HttpOnly: true
- SameSite: lax
- Secure: false (set to true in production with HTTPS)

## API Endpoints

### GET /api/state

Get or create session state for current user.

**Features:**
- Automatically creates session if it doesn't exist
- Sets `pbx_uid` cookie if user doesn't have one
- Returns complete SessionState object

**Request:**
```bash
curl -c cookies.txt http://localhost:8001/api/state
```

**Response:**
```json
{
  "_id": "68fde549f9b758b361b4fb8e",
  "user_id": "9e24008a-2a52-4977-ac7c-28dc3bf9a288",
  "access_token": null,
  "accounts": [],
  "transactions": [],
  "activity": [],
  "updated_at": "2025-10-26T09:09:29.751000"
}
```

### POST /api/state/clear

Clear demo state for current user and create fresh session.

**What it does:**
1. Deletes existing session from database
2. Creates new empty session with same user_id
3. Keeps the user_id cookie intact

**Request:**
```bash
curl -b cookies.txt -X POST http://localhost:8001/api/state/clear
```

**Response:**
```json
{
  "status": "ok",
  "message": "Demo state cleared successfully",
  "session": {
    "_id": "68fde56ef9b758b361b4fb8f",
    "user_id": "9e24008a-2a52-4977-ac7c-28dc3bf9a288",
    "access_token": null,
    "accounts": [],
    "transactions": [],
    "activity": [],
    "updated_at": "2025-10-26T09:10:06.312000"
  }
}
```

## SessionState Schema

```typescript
{
  _id: string,                    // MongoDB ObjectId (auto-generated)
  user_id: string,                // UUID or authenticated user ID
  access_token: string | null,    // Plaid mock token
  accounts: Array<any>,           // Account data from Plaid
  transactions: Array<any>,       // Transaction data from Plaid
  activity: Array<{               // Transfer activity
    id: string,
    type: string,
    amountUSD: number,
    estPhp: number,
    feesUSD: number,
    status: string,
    created_at: string
  }>,
  updated_at: string              // ISO timestamp
}
```

## Usage Examples

### Example 1: First-time user

```bash
# User visits site (no cookie)
curl -c cookies.txt http://localhost:8001/api/state

# Response includes new user_id, cookie is set
# Cookie: pbx_uid=9e24008a-2a52-4977-ac7c-28dc3bf9a288
```

### Example 2: Returning user

```bash
# User returns with cookie
curl -b cookies.txt http://localhost:8001/api/state

# Same user_id is used, existing session is retrieved
```

### Example 3: Update session data

```bash
# Update accounts, transactions, etc.
curl -b cookies.txt -X PUT \
  http://localhost:8001/api/sessions/9e24008a-2a52-4977-ac7c-28dc3bf9a288 \
  -H "Content-Type: application/json" \
  -d '{
    "accounts": [{"id": "acc_1", "balance": 1250}],
    "transactions": [{"id": "tx_1", "amount": 100}]
  }'
```

### Example 4: Clear demo data

```bash
# Reset user's demo state
curl -b cookies.txt -X POST http://localhost:8001/api/state/clear

# Old session deleted, new empty session created
# user_id remains the same
```

## Integration with Frontend

### React Example

```javascript
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Get user state (cookie is automatically handled by browser)
const getState = async () => {
  const response = await axios.get(`${API}/state`, {
    withCredentials: true  // Important: send cookies
  });
  return response.data;
};

// Clear state
const clearState = async () => {
  const response = await axios.post(`${API}/state/clear`, {}, {
    withCredentials: true
  });
  return response.data;
};
```

### Axios Configuration

Make sure to enable credentials in axios:

```javascript
axios.defaults.withCredentials = true;
```

Or per request:

```javascript
axios.get(url, { withCredentials: true })
```

## Testing Scenarios

### Test 1: New user gets session and cookie
```bash
curl -c /tmp/test1.txt -v http://localhost:8001/api/state 2>&1 | grep -i "set-cookie"
```
Expected: `Set-Cookie: pbx_uid=...`

### Test 2: Cookie persists across requests
```bash
curl -c /tmp/test2.txt http://localhost:8001/api/state
USER_ID=$(curl -s -b /tmp/test2.txt http://localhost:8001/api/state | jq -r .user_id)
echo "First: $USER_ID"

USER_ID2=$(curl -s -b /tmp/test2.txt http://localhost:8001/api/state | jq -r .user_id)
echo "Second: $USER_ID2"

# Should be identical
```

### Test 3: Clear preserves user_id
```bash
curl -c /tmp/test3.txt http://localhost:8001/api/state
ID_BEFORE=$(curl -s -b /tmp/test3.txt http://localhost:8001/api/state | jq -r .user_id)

curl -s -b /tmp/test3.txt -X POST http://localhost:8001/api/state/clear > /dev/null
ID_AFTER=$(curl -s -b /tmp/test3.txt http://localhost:8001/api/state | jq -r .user_id)

echo "Before: $ID_BEFORE"
echo "After:  $ID_AFTER"
# Should match
```

## Security Considerations

1. **HttpOnly cookie**: Prevents JavaScript access, mitigating XSS attacks
2. **SameSite=lax**: Provides CSRF protection
3. **UUID v4**: Cryptographically random, hard to guess
4. **No PII**: Cookie only stores UUID, not personal information
5. **Session isolation**: Each user_id has separate session data

## Future Enhancements

When authentication is implemented:
1. Update `get_user_id()` to check for authenticated user first
2. Migrate anonymous sessions to authenticated user on login
3. Add session expiration logic
4. Implement session refresh mechanism
