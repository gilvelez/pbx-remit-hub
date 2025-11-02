# Sandbox Public Token Function

## Overview
This Netlify serverless function creates a sandbox public token directly from Plaid's API, which can be used for testing the Plaid Link flow without manually opening the Link UI.

## Endpoint
```
POST https://philippinebayaniexchange.com/.netlify/functions/sandbox-public-token
```

## Purpose
- **Testing shortcut**: Generates a public_token instantly for sandbox testing
- **No user interaction needed**: Unlike the full Plaid Link flow
- **Pre-configured**: Uses Plaid's test institution (`ins_109508`)

## How It Works

### 1. Configuration
```javascript
const config = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV || 'sandbox'],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    },
  },
});
```

### 2. Creates Public Token
```javascript
const response = await client.sandboxPublicTokenCreate({
  institution_id: 'ins_109508', // Plaid Test Institution
  initial_products: ['transactions', 'auth'],
});
```

### 3. Returns Token
```javascript
{
  "public_token": "public-sandbox-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "request_id": "xxxxxxxxxxxxxxxxxx"
}
```

## Usage

### Using curl
```bash
curl -X POST "https://philippinebayaniexchange.com/.netlify/functions/sandbox-public-token" \
  -H "Content-Type: application/json"
```

### Expected Response (Success)
```json
{
  "public_token": "public-sandbox-8ab976e6-64bc-4b38-98f7-831e7ea9ccf8",
  "request_id": "CtW6qOgQw1v11Cm"
}
```

### Expected Response (Error)
```json
{
  "error": {
    "error_type": "INVALID_REQUEST",
    "error_code": "MISSING_FIELDS",
    "error_message": "...",
    "display_message": null
  }
}
```

## Testing Workflow

### Full Testing Flow:
```bash
# Step 1: Get sandbox public token
curl -X POST "https://philippinebayaniexchange.com/.netlify/functions/sandbox-public-token"
# Returns: {"public_token":"public-sandbox-..."}

# Step 2: Exchange public token for access token
curl -X POST "https://philippinebayaniexchange.com/.netlify/functions/exchange-public-token" \
  -H "Content-Type: application/json" \
  -d '{"public_token":"public-sandbox-..."}'
# Returns: {"access_token":"access-sandbox-...","item_id":"..."}

# Step 3: Get account balances
curl -X POST "https://philippinebayaniexchange.com/.netlify/functions/accounts-balance" \
  -H "Content-Type: application/json" \
  -d '{"access_token":"access-sandbox-..."}'
# Returns: {"accounts":[...]}

# Step 4: Get transactions
curl -X POST "https://philippinebayaniexchange.com/.netlify/functions/transactions-sync" \
  -H "Content-Type: application/json" \
  -d '{"access_token":"access-sandbox-...","count":50}'
# Returns: {"added":[...],"modified":[],"removed":[]}
```

## Environment Variables Required

These should be set in Netlify Dashboard (Site settings → Environment variables):

| Variable | Value | Description |
|----------|-------|-------------|
| `PLAID_CLIENT_ID` | Your client ID | From Plaid Dashboard |
| `PLAID_SECRET` | Your sandbox secret | From Plaid Dashboard |
| `PLAID_ENV` | `sandbox` | Environment (sandbox/development/production) |

## Test Institution

**Institution ID:** `ins_109508`
- **Name:** First Platypus Bank (Plaid's test bank)
- **Products:** Transactions, Auth
- **Test Credentials:** Any username/password works in sandbox

## Function Details

### File Location
```
/app/netlify/functions/sandbox-public-token.js
```

### Dependencies
- `plaid` (^24.0.0) - Installed from root package.json

### HTTP Method
- **POST** (recommended for consistency)
- **GET** also works (no body required)

### Response Headers
```
Content-Type: application/json
```

### Status Codes
- **200** - Success, public_token created
- **500** - Error (invalid credentials, API failure, etc.)

## Integration Example

### JavaScript/React
```javascript
// Function to get sandbox public token
async function getSandboxPublicToken() {
  try {
    const response = await fetch('/.netlify/functions/sandbox-public-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    const data = await response.json();
    return data.public_token;
  } catch (error) {
    console.error('Error getting sandbox token:', error);
    throw error;
  }
}

// Use in testing
async function testPlaidFlow() {
  // Get public token
  const publicToken = await getSandboxPublicToken();
  console.log('Public token:', publicToken);
  
  // Exchange for access token
  const exchangeResponse = await fetch('/.netlify/functions/exchange-public-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ public_token: publicToken })
  });
  
  const { access_token } = await exchangeResponse.json();
  console.log('Access token:', access_token);
  
  // Now you can use access_token for accounts, transactions, etc.
}
```

## Comparison with Production Flow

### Production Flow (Real Users):
```
1. User opens Plaid Link UI
2. User selects bank and enters credentials
3. User authorizes connection
4. Plaid returns public_token to your app
5. Your app exchanges public_token for access_token
```

### Sandbox Testing (This Function):
```
1. Call sandbox-public-token function ✅
2. Instantly get public_token (no UI) ✅
3. Exchange public_token for access_token ✅
4. Test accounts/transactions APIs ✅
```

## Benefits

✅ **Faster testing** - No UI interaction needed
✅ **Automated testing** - Can be scripted/automated
✅ **Consistent** - Always uses same test institution
✅ **Sandbox-only** - Won't work in production (safe)

## Security Notes

⚠️ **Sandbox Only**
- This function only works with `PLAID_ENV=sandbox`
- Cannot create real public tokens
- Safe for testing environments

✅ **Secrets Protected**
- PLAID credentials read from environment variables
- Never exposed to client
- Function runs server-side only

## Troubleshooting

### Error: "PLAID_CLIENT_ID is not defined"
**Solution:** Set `PLAID_CLIENT_ID` in Netlify environment variables

### Error: "INVALID_CREDENTIALS"
**Solution:** Verify `PLAID_SECRET` matches your sandbox secret in Plaid Dashboard

### Error: "Cannot find module 'plaid'"
**Solution:** Ensure root `package.json` has `"plaid": "^24.0.0"` and deploy includes root dependencies

## Next Steps After Deployment

1. **Push to GitHub:**
   ```bash
   git add netlify/functions/sandbox-public-token.js
   git commit -m "Add sandbox public token function for Plaid testing"
   git push origin main
   ```

2. **Deploy to Netlify:**
   - Netlify will detect the new function
   - Build and deploy automatically

3. **Test the endpoint:**
   ```bash
   curl -X POST "https://philippinebayaniexchange.com/.netlify/functions/sandbox-public-token"
   ```

4. **Use in your testing workflow:**
   - Get public token from this endpoint
   - Exchange it for access token
   - Test accounts and transactions APIs

---

## Complete Netlify Functions List

After adding this function, you now have:

1. **create-link-token.js** - Create Plaid Link token for UI
2. **exchange-public-token.js** - Exchange public token for access token
3. **accounts-balance.js** - Get account balances
4. **transactions-sync.js** - Sync transactions
5. **sandbox-public-token.js** ✨ **NEW** - Get sandbox public token directly

All functions available at: `https://philippinebayaniexchange.com/.netlify/functions/{function-name}`
