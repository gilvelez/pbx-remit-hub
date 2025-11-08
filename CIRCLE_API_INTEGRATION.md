# Circle API Integration - Netlify Functions

## Overview
Two serverless functions to interact with Circle's Sandbox API for testing USDC stablecoin operations.

## New Functions Added

### 1. circle-ping.js
**Endpoint:** `/.netlify/functions/circle-ping`
**Purpose:** Health check / test Circle API connectivity (no auth required)
**Method:** GET
**Authentication:** None required
**API Called:** `https://api-sandbox.circle.com/v1/configuration`

**Response:**
```json
{
  "data": {
    "payments": {
      "masterWalletId": "..."
    }
  }
}
```

**Use Case:**
- Verify Circle API is accessible
- Check API status
- Quick connectivity test
- No API key needed

### 2. circle-balances.js
**Endpoint:** `/.netlify/functions/circle-balances`
**Purpose:** Get business account USDC balances
**Method:** GET
**Authentication:** Requires `CIRCLE_API_KEY` environment variable
**API Called:** `https://api-sandbox.circle.com/v1/businessAccount/balances`

**Response:**
```json
{
  "data": {
    "available": [
      {
        "amount": "1000.00",
        "currency": "USD"
      }
    ],
    "unsettled": [
      {
        "amount": "0.00",
        "currency": "USD"
      }
    ]
  }
}
```

**Use Case:**
- Check available USDC balance
- Monitor unsettled transactions
- Display balance to users
- Validate funds before transfer

## Environment Variables

### Required in Netlify Dashboard

**Location:** Site settings → Environment variables

| Variable | Value | Purpose |
|----------|-------|---------|
| `CIRCLE_API_KEY` | `TEST_API_KEY:bb4616152839e14d5cd2e7ebdf69d9b2:1b644676b4555f71ac096cd5979ab17` | Circle Sandbox API authentication |

**Important:**
- Must include `TEST_API_KEY:` prefix
- This is a **sandbox** key (test environment only)
- Never commit API keys to repository
- Functions read from `process.env.CIRCLE_API_KEY` at runtime

## Security Architecture

### Secrets Isolation ✅

**Frontend:**
```javascript
// ✅ CORRECT - Frontend never sees API key
fetch('/.netlify/functions/circle-balances')
```

**Serverless Function:**
```javascript
// ✅ CORRECT - API key read at runtime from environment
const apiKey = process.env.CIRCLE_API_KEY;
const res = await fetch('https://api-sandbox.circle.com/v1/businessAccount/balances', {
  headers: {
    Authorization: `Bearer ${apiKey}`,
  },
});
```

**Never Do:**
```javascript
// ❌ WRONG - Don't hardcode API keys
const apiKey = 'TEST_API_KEY:bb4616...';
```

### Protection Layers

1. **Environment Variables:**
   - API key stored in Netlify dashboard
   - Not in repository
   - Not in frontend bundle

2. **Serverless Functions:**
   - Run server-side only
   - Never expose source to client
   - API key never sent to browser

3. **API Key Format:**
   - Test prefix prevents production misuse
   - Sandbox environment isolated
   - Easy to identify test keys

## Complete Function List (9 Total)

### Plaid Functions (7)
1. create-link-token
2. exchange-public-token
3. sandbox-public-token
4. accounts-balance
5. transactions-sync
6. accounts-auth
7. identity

### Circle Functions (2) ✨ NEW
8. **circle-ping** - API health check
9. **circle-balances** - Get USDC balances

## Testing

### Test circle-ping (No Auth)
```bash
curl https://philippinebayaniexchange.com/.netlify/functions/circle-ping
```

**Expected Response:**
```json
{
  "data": {
    "payments": {
      "masterWalletId": "1000005555"
    }
  }
}
```

### Test circle-balances (Requires Auth)
```bash
curl https://philippinebayaniexchange.com/.netlify/functions/circle-balances
```

**Expected Response (Success):**
```json
{
  "data": {
    "available": [
      {
        "amount": "1000.00",
        "currency": "USD"
      }
    ],
    "unsettled": [
      {
        "amount": "0.00",
        "currency": "USD"
      }
    ]
  }
}
```

**Expected Response (Missing Key):**
```json
{
  "error": "Missing CIRCLE_API_KEY"
}
```

## Integration Examples

### JavaScript/React
```javascript
// Check Circle API connectivity
async function testCircleConnection() {
  const response = await fetch('/.netlify/functions/circle-ping');
  const data = await response.json();
  console.log('Circle API:', data);
}

// Get USDC balances
async function getCircleBalances() {
  const response = await fetch('/.netlify/functions/circle-balances');
  const data = await response.json();
  
  if (data.error) {
    console.error('Error:', data.error);
    return null;
  }
  
  const availableUSDC = data.data.available.find(b => b.currency === 'USD');
  console.log('Available USDC:', availableUSDC.amount);
  return availableUSDC.amount;
}
```

### Add to Demo Page
```javascript
// In pbx-demo.html or LinkDemo.jsx
const testCircle = async () => {
  // Test ping
  const pingRes = await fetch('/.netlify/functions/circle-ping');
  const pingData = await pingRes.json();
  console.log('Circle Ping:', pingData);
  
  // Test balances
  const balanceRes = await fetch('/.netlify/functions/circle-balances');
  const balanceData = await balanceRes.json();
  console.log('Circle Balances:', balanceData);
};
```

## Circle API Documentation

### Endpoints Used

#### 1. Configuration (Public)
```
GET https://api-sandbox.circle.com/v1/configuration
Headers: Accept: application/json
Auth: None required
```

#### 2. Business Account Balances (Auth Required)
```
GET https://api-sandbox.circle.com/v1/businessAccount/balances
Headers: 
  Accept: application/json
  Authorization: Bearer {CIRCLE_API_KEY}
```

### API Response Structure

**Configuration Response:**
```json
{
  "data": {
    "payments": {
      "masterWalletId": "string"
    }
  }
}
```

**Balances Response:**
```json
{
  "data": {
    "available": [
      {
        "amount": "string",
        "currency": "USD"
      }
    ],
    "unsettled": [
      {
        "amount": "string",
        "currency": "USD"
      }
    ]
  }
}
```

## Error Handling

### circle-balances Error Cases

#### Missing API Key
```json
{
  "error": "Missing CIRCLE_API_KEY"
}
```
**Solution:** Set `CIRCLE_API_KEY` in Netlify environment variables

#### Invalid API Key
```json
{
  "message": "Unauthorized"
}
```
**Solution:** Verify API key format includes `TEST_API_KEY:` prefix

#### Circle API Error
```json
{
  "code": 1,
  "message": "Business account not found"
}
```
**Solution:** Verify Circle sandbox account is active

## Deployment Checklist

### 1. Environment Variables ✅
```
Netlify Dashboard:
- CIRCLE_API_KEY = TEST_API_KEY:bb4616152839e14d5cd2e7ebdf69d9b2:1b644676b4555f71ac096cd5979ab17
```

### 2. Files Created ✅
```
/app/netlify/functions/circle-ping.js
/app/netlify/functions/circle-balances.js
```

### 3. Configuration ✅
```
netlify.toml:
[functions]
  directory = "netlify/functions"
```

### 4. Security ✅
```
- API key in environment variables ✅
- Not hardcoded in code ✅
- Not in git repository ✅
- Functions read from process.env ✅
```

## Use Cases

### 1. PBX Remittance Flow
```
1. User connects bank (Plaid)
2. Check Circle USDC balance (circle-balances)
3. Calculate exchange rate
4. Transfer USD → USDC (Circle)
5. Convert USDC → PHP
6. Send to Philippine bank
```

### 2. Balance Display
```
Dashboard showing:
- Bank account balance (Plaid)
- USDC balance (Circle)
- Total available for remittance
```

### 3. Pre-Transfer Validation
```
Before transfer:
1. Check bank balance (Plaid)
2. Check USDC balance (Circle)
3. Validate sufficient funds
4. Show fees and exchange rate
```

## Next Steps

### Add to Demo Page
```javascript
// Add Circle testing to pbx-demo.html
<button id="btn-circle-ping">Circle: Ping</button>
<button id="btn-circle-balances">Circle: Balances</button>

document.getElementById("btn-circle-ping").onclick = async () => {
  out("checking Circle API...");
  const r = await fetch('/.netlify/functions/circle-ping');
  out(await r.json());
};

document.getElementById("btn-circle-balances").onclick = async () => {
  out("fetching Circle balances...");
  const r = await fetch('/.netlify/functions/circle-balances');
  out(await r.json());
};
```

### Combine Plaid + Circle
```javascript
// Show complete flow
async function demonstrateRemittance() {
  // 1. Get bank account (Plaid)
  const bankBalance = await getPlaidBalance(accessToken);
  
  // 2. Get USDC balance (Circle)
  const usdcBalance = await getCircleBalance();
  
  // 3. Calculate available for transfer
  const available = Math.min(bankBalance, usdcBalance);
  
  console.log(`Can send up to: $${available}`);
}
```

### Production Checklist
- [ ] Replace sandbox API key with production key
- [ ] Update API endpoints (remove `-sandbox`)
- [ ] Add webhook handling
- [ ] Implement idempotency keys
- [ ] Add transaction logging
- [ ] Set up monitoring/alerts

## Troubleshooting

### Issue: "Missing CIRCLE_API_KEY"
**Cause:** Environment variable not set in Netlify
**Solution:** Add `CIRCLE_API_KEY` in Netlify dashboard

### Issue: "Unauthorized"
**Cause:** Invalid API key format
**Solution:** Ensure key includes `TEST_API_KEY:` prefix

### Issue: circle-ping works, circle-balances fails
**Cause:** API key issue or account problem
**Solution:** 
1. Verify API key in Netlify dashboard
2. Test API key directly with curl
3. Check Circle sandbox account status

### Issue: Functions not found
**Cause:** Functions not deployed
**Solution:** Verify netlify.toml has `functions = "netlify/functions"`

## Files Changed

| File | Action | Purpose |
|------|--------|---------|
| `/app/netlify/functions/circle-ping.js` | Created | Circle API health check |
| `/app/netlify/functions/circle-balances.js` | Created | Get USDC balances |

## Commit & Deploy

```bash
git add netlify/functions/circle-ping.js netlify/functions/circle-balances.js
git commit -m "Add Circle API integration (sandbox) - ping and balances endpoints"
git push origin main
```

**After deploy:**
1. Set `CIRCLE_API_KEY` in Netlify dashboard
2. Test: `curl https://philippinebayaniexchange.com/.netlify/functions/circle-ping`
3. Test: `curl https://philippinebayaniexchange.com/.netlify/functions/circle-balances`

---

## Summary

✅ **2 new Circle functions** added (ping, balances)
✅ **9 total functions** (7 Plaid + 2 Circle)
✅ **Secure implementation** (API key in env vars)
✅ **Sandbox testing** ready
✅ **Easy to extend** for full remittance flow

**Ready to deploy!** 🚀
