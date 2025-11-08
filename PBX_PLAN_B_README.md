# PBX Plan B - Plaid + Circle Mocks

## Overview
Complete remittance orchestration demo using **real Plaid Sandbox** + **mock Circle API** - no Circle account needed!

## What You Get

### Full Flow Working
```
1. User clicks "Connect bank (Sandbox)"
2. Plaid Link opens (real sandbox)
3. User selects test bank + account
4. System gets access_token (real Plaid)
5. Mock "debit" check (fake ACH)
6. Mock "mint" USDC to wallet (fake Circle)
7. Mock "off-ramp" to GCash/PH bank (fake payout)
8. Shows complete receipt with FX rate + fees
```

## Project Structure

```
pbx-mvp/
├── netlify.toml               # Netlify config (esbuild bundler)
├── package.json               # Dependencies (plaid, node-fetch)
├── .env.example               # Environment template
├── frontend/
│   ├── index.html             # Simple test page
│   └── app.js                 # Frontend logic (ES modules)
└── netlify/functions/
    ├── plaid-create-link-token.js        # Real Plaid
    ├── plaid-exchange-public-token.js    # Real Plaid
    ├── circle-mock.js                    # Mock helpers
    ├── orchestrate-debit-mint-offramp.js # Main orchestrator
    └── health.js                         # Health check
```

## Files Created/Updated

### Configuration Files

#### 1. netlify.toml ✅
```toml
[build]
  command = "echo Build OK"
  publish = "frontend"

[functions]
  node_bundler = "esbuild"  # ES modules support
  directory = "netlify/functions"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200
```

**Key Features:**
- `node_bundler = "esbuild"` - Supports ES modules (import/export)
- Simple build (no compilation needed)
- `/api/*` redirects to functions

#### 2. package.json ✅
```json
{
  "name": "pbx-mvp",
  "type": "module",  // ES modules
  "dependencies": {
    "plaid": "^24.0.0",
    "node-fetch": "^3.3.2"
  },
  "devDependencies": {
    "netlify-cli": "^17.0.0"
  }
}
```

**Key Features:**
- `"type": "module"` enables ES6 imports
- Plaid SDK for real sandbox integration
- node-fetch v3 for fetch API support

#### 3. .env.example ✅
```env
# --- Plaid (Sandbox) ---
PLAID_ENV=sandbox
PLAID_CLIENT_ID=your_sandbox_client_id
PLAID_SECRET=your_sandbox_secret
PLAID_PRODUCTS=auth
PLAID_COUNTRY_CODES=US

# --- "Circle" mock switch ---
CIRCLE_USE_MOCKS=true

# Optional: tag this environment
PBX_ENV=dev
```

### Frontend Files

#### 4. frontend/index.html ✅
Simple test page with:
- Plaid Link CDN script
- Single "Connect bank" button
- Log output area
- Minimal styling

#### 5. frontend/app.js ✅
Frontend orchestration:
- Create link token
- Open Plaid Link UI
- Exchange public token
- Run full orchestrator
- Display results

### Netlify Functions

#### 6. plaid-create-link-token.js ✅
**Real Plaid integration**
- Creates link token for Plaid Link UI
- Uses sandbox credentials
- Returns link_token

#### 7. plaid-exchange-public-token.js ✅
**Real Plaid integration**
- Exchanges public_token for access_token
- Gets account details via authGet
- Returns access_token + account_id

#### 8. circle-mock.js ✅
**Mock helpers (no API calls)**
- `mockCreateWallet()` - Creates fake wallet
- `mockMintUSDC()` - Simulates USDC minting
- `mockTransfer()` - Simulates PH payout

#### 9. orchestrate-debit-mint-offramp.js ✅
**Main orchestrator**
- Step 1: Mock debit check (ACH)
- Step 2: Mock mint USDC
- Step 3: Mock off-ramp to PH
- Returns complete receipt

#### 10. health.js ✅
**Health check endpoint**
- Returns system status
- Shows environment (dev)
- Confirms mocks enabled

## Setup Instructions

### 1. Get Plaid Credentials
1. Go to https://dashboard.plaid.com/
2. Navigate to: Team Settings → Keys
3. Copy **Sandbox** client_id and secret
4. Keep these for step 3

### 2. Create Environment File
```bash
cp .env.example .env
```

### 3. Set Plaid Credentials
Edit `.env`:
```env
PLAID_CLIENT_ID=your_actual_sandbox_client_id
PLAID_SECRET=your_actual_sandbox_secret
```

**Important:**
- Use **Sandbox** credentials (not Development or Production)
- Do NOT commit `.env` to git
- `.env.example` can be committed (template only)

### 4. Install Dependencies
```bash
yarn install
# or
npm install
```

### 5. Set Netlify Environment Variables
In Netlify Dashboard → Site settings → Environment variables:

| Variable | Value | Source |
|----------|-------|--------|
| `PLAID_ENV` | `sandbox` | Static |
| `PLAID_CLIENT_ID` | `your_sandbox_client_id` | From Plaid |
| `PLAID_SECRET` | `your_sandbox_secret` | From Plaid |
| `PLAID_PRODUCTS` | `auth` | Static |
| `PLAID_COUNTRY_CODES` | `US` | Static |
| `CIRCLE_USE_MOCKS` | `true` | Static |
| `PBX_ENV` | `dev` | Static |

### 6. Deploy
```bash
git add netlify.toml package.json frontend/ netlify/functions/ .env.example
git commit -m "Add PBX Plan B - Plaid + Circle Mocks"
git push origin main
```

### 7. Test
```
Visit: https://your-site.netlify.app/
Click: "Connect bank (Sandbox)"
Follow: Plaid Link flow
See: Complete orchestration result
```

## Testing Workflow

### User Flow
```
1. Open: https://your-site.netlify.app/
2. Click: "Connect bank (Sandbox)"
3. Plaid Link opens
4. Select: "First Platypus Bank" (test institution)
5. Username: any
6. Password: any
7. Select account
8. Authorize
9. Watch log:
   - Creating link token…
   - Public token: public-sandbox-xxx
   - Selected account: xxx
   - Exchanged for access_token
   - Flow result: (full JSON)
```

### Expected Output
```json
{
  "step1_debit_check": {
    "ok": true,
    "method": "ACH (sandbox)",
    "account_id": "xxx",
    "maxDebitAllowed": 2500
  },
  "step2_mint": {
    "id": "mint_xxx",
    "walletId": "wlt_xxx",
    "amount": "50",
    "asset": "USDC",
    "txHash": "0xxxx",
    "status": "confirmed"
  },
  "step3_offramp": {
    "id": "xfer_xxx",
    "route": "gcash",
    "amount": "50",
    "asset": "USDC",
    "quoteFx": {
      "usdToPhp": 56.25,
      "feesUsd": 0.50,
      "feesPhp": 28
    },
    "status": "delivered",
    "reference": "PBX-xxx"
  },
  "receipt": {
    "usd": 50,
    "php": 2813,
    "fx_rate": 56.25,
    "fees_usd": 0.50,
    "delivered_to": {
      "type": "gcash",
      "handle": "09171234567"
    }
  }
}
```

## API Endpoints

### Health Check
```bash
GET /api/health
```
**Response:**
```json
{
  "ok": true,
  "env": "dev",
  "mocks": true
}
```

### Create Link Token (Plaid)
```bash
GET /api/plaid-create-link-token
```
**Response:**
```json
{
  "link_token": "link-sandbox-xxx"
}
```

### Exchange Token (Plaid)
```bash
POST /api/plaid-exchange-public-token
Body: {"public_token": "public-sandbox-xxx"}
```
**Response:**
```json
{
  "access_token": "access-sandbox-xxx",
  "item_id": "xxx",
  "account_id": "xxx"
}
```

### Orchestrate Flow (Mock)
```bash
POST /api/orchestrate-debit-mint-offramp
Body: {
  "access_token": "access-sandbox-xxx",
  "account_id": "xxx",
  "amount": 50,
  "recipient": {
    "type": "gcash",
    "handle": "09171234567"
  }
}
```
**Response:** See "Expected Output" above

## Mock Behavior

### Deterministic Fakes
All mocks are **deterministic** - same inputs = same outputs:

```javascript
// Wallet ID based on owner tag
mockCreateWallet({ ownerTag: 'pbx-user-123' })
// Always returns: wlt_7062782d2d757365

// Mint ID based on wallet ID
mockMintUSDC({ walletId: 'wlt_xxx', amount: 50 })
// Always returns: mint_ + last 6 chars of walletId

// Transfer ID based on wallet ID
mockTransfer({ fromWalletId: 'wlt_xxx', ... })
// Always returns: xfer_ + last 6 chars of walletId
```

### FX Rate & Fees (Hardcoded)
```javascript
quoteFx: {
  usdToPhp: 56.25,    // Fixed rate
  feesUsd: 0.50,      // $0.50 fee
  feesPhp: 28         // ₱28 fee
}
```

### Status (Always Success)
```javascript
status: 'confirmed'  // Mint
status: 'delivered'  // Transfer
```

## Advantages of Plan B

### ✅ No Circle Account Needed
- No API keys to manage
- No sandbox limitations
- No account verification
- Instant setup

### ✅ Deterministic Testing
- Same inputs = same outputs
- Repeatable tests
- Easy debugging
- Predictable behavior

### ✅ Real Plaid Integration
- Actual Plaid sandbox
- Real Link UI experience
- Real access tokens
- Real account data

### ✅ Complete Flow Demo
- Debit check
- USDC minting
- Off-ramp payout
- Receipt generation

### ✅ Fast Development
- No API delays
- No rate limits
- No failures
- Instant responses

## Limitations (vs Real Circle)

| Feature | Plan B (Mock) | Real Circle |
|---------|--------------|-------------|
| Plaid integration | ✅ Real | ✅ Real |
| ACH debit | ❌ Simulated | ✅ Real |
| USDC minting | ❌ Simulated | ✅ Real |
| Blockchain tx | ❌ Fake hash | ✅ Real hash |
| PH payout | ❌ Simulated | ✅ Real delivery |
| FX rate | ❌ Hardcoded | ✅ Live rate |
| Fees | ❌ Hardcoded | ✅ Dynamic |

## Migration Path to Real Circle

### When Ready for Production:
1. Get Circle API credentials
2. Set `CIRCLE_USE_MOCKS=false`
3. Add `CIRCLE_API_KEY` environment variable
4. Replace mock functions with real Circle SDK calls
5. Add error handling for real failures
6. Add idempotency keys
7. Add webhook handling

### Code Changes Needed:
```javascript
// Instead of:
import { mockMintUSDC } from './circle-mock.js';
const mint = mockMintUSDC({ walletId, amount });

// Use:
import { CircleClient } from '@circle-fin/circle-sdk';
const circle = new CircleClient(process.env.CIRCLE_API_KEY);
const mint = await circle.transfers.createWireTransfer({...});
```

## Troubleshooting

### Issue: "Missing PLAID_CLIENT_ID"
**Solution:** Set Plaid credentials in Netlify environment variables

### Issue: Plaid Link doesn't open
**Solution:** Check browser console, verify Plaid CDN script loaded

### Issue: Functions return 500
**Solution:** Check Netlify function logs for errors

### Issue: "Cannot find module 'plaid'"
**Solution:** Ensure `package.json` has `"plaid": "^24.0.0"` and deploy

### Issue: ES module errors
**Solution:** Ensure `package.json` has `"type": "module"`

## Next Steps

### Add to Demo Page
Update existing `/pbx-demo.html` to link to Plan B:
```html
<a href="/">Plan B: Full Orchestrator (Plaid + Circle Mocks)</a>
```

### Enhance Mocks
- Add realistic delays
- Add failure scenarios
- Add balance checks
- Add transaction history

### Add UI
- Progress indicators
- Error handling
- Receipt display
- Transaction history

### Productionize
- Replace mocks with real Circle
- Add database persistence
- Add user authentication
- Add webhook handling
- Add monitoring/logging

---

## Summary

✅ **Complete orchestrator** working with Plaid Sandbox + Circle Mocks
✅ **No Circle account needed** - all API calls mocked
✅ **Deterministic testing** - repeatable, predictable
✅ **Real Plaid integration** - actual sandbox Link UI
✅ **Full flow demo** - debit → mint → off-ramp → receipt
✅ **Easy setup** - just Plaid credentials needed
✅ **Fast development** - instant responses, no rate limits

**Ready to test the complete remittance flow!** 🚀

**Test URL after deploy:** `https://your-site.netlify.app/`
