# PayMongo Integration Documentation

## Overview
This document describes the PayMongo integration implemented for PBX (Philippine Bayani Exchange) to enable real-time PHP payouts to GCash and other Philippine banks/e-wallets.

## Architecture

### Files Created
1. **`/app/paymongoClient.js`** - Shared PayMongo API client with authentication
2. **`/app/netlify/functions/pbx-create-transfer.js`** - Creates real transfers via PayMongo Transfer V2 API
3. **`/app/netlify/functions/pbx-list-institutions.js`** - Lists supported receiving institutions

### Files Modified
- **`/app/frontend/src/pages/SendMoney.jsx`** - Updated to call real PayMongo transfer endpoint

## PayMongo API Details

### Authentication
- **Method**: HTTP Basic Auth
- **Format**: Base64-encoded `PAYMONGO_SECRET_KEY:`
- **Header**: `Authorization: Basic <base64_token>`

### Endpoints Used
1. **POST /v2/batch_transfers** - Create batch transfers
2. **GET /v2/receiving_institutions** - Get supported banks/e-wallets

## Environment Variables Required

### Netlify Environment Variables
Add these in: **Netlify Dashboard → Site Settings → Environment Variables**

```
PAYMONGO_SECRET_KEY=sk_test_... (or sk_live_...)
PAYMONGO_PUBLIC_KEY=pk_test_... (or pk_live_...) [optional for now]
OXR_API_KEY=<your_openexchangerates_key>
```

## Flow

### 1. User Initiates Transfer
- User enters USD amount on SendMoney page
- Live FX rate is fetched from `get-fx-quote` function
- User confirms transfer

### 2. Frontend Calls `pbx-create-transfer`
```javascript
POST /.netlify/functions/pbx-create-transfer
{
  "amountPhp": 5000.50,
  "institution_code": "GCSH",
  "account_name": "Juan Dela Cruz",
  "account_number": "09171234567",
  "provider": "instapay",
  "description": "PBX transfer",
  "metadata": { ... }
}
```

### 3. Backend Calls PayMongo
- Converts PHP to centavos (multiply by 100)
- Constructs Transfer V2 batch transfer request
- Sends to PayMongo API: `POST /v2/batch_transfers`

### 4. PayMongo Response
Success:
```json
{
  "data": {
    "id": "batch_transfer_id",
    "type": "batch_transfer",
    "attributes": {
      "transfers": [
        {
          "id": "transfer_id",
          "amount": 500050,
          "currency": "PHP",
          "status": "pending",
          ...
        }
      ]
    }
  }
}
```

Error:
```json
{
  "errors": [
    {
      "detail": "Error message",
      "code": "error_code"
    }
  ]
}
```

### 5. UI Updates
- Shows success confirmation with transaction details
- Adds entry to Recent Activity and PH Payouts lists

## Institution Codes

### Common Codes (GCash Example)
- **GCash**: `GCSH`
- **BPI**: `BPI`
- **BDO**: `BDO`

To get full list:
```bash
curl https://api.paymongo.com/v2/receiving_institutions \
  -u sk_test_...:
```

Or call frontend function:
```javascript
GET /.netlify/functions/pbx-list-institutions
```

## Testing Checklist

### Local Development
⚠️ **Note**: Netlify Functions don't run locally. Full testing requires deployment.

- [ ] Frontend compiles without errors
- [ ] UI shows "Real Payouts" subtitle
- [ ] Amount input triggers FX quote fetch

### Deployed Testing (Required)

#### 1. Environment Setup
- [ ] `PAYMONGO_SECRET_KEY` set in Netlify
- [ ] `OXR_API_KEY` set in Netlify
- [ ] Deploy to Netlify

#### 2. Backend Function Tests
Test `pbx-create-transfer`:
```bash
curl -X POST https://your-site.netlify.app/.netlify/functions/pbx-create-transfer \
  -H "Content-Type: application/json" \
  -d '{
    "amountPhp": 100,
    "institution_code": "GCSH",
    "account_name": "Test User",
    "account_number": "09171234567",
    "provider": "instapay",
    "description": "Test transfer"
  }'
```

Test `pbx-list-institutions`:
```bash
curl https://your-site.netlify.app/.netlify/functions/pbx-list-institutions
```

#### 3. Frontend E2E Tests
- [ ] Navigate to "Send Money" page
- [ ] Select recipient with GCash number
- [ ] Enter amount (triggers FX quote)
- [ ] Click "Send"
- [ ] Confirm in modal
- [ ] Verify success confirmation shows
- [ ] Check "Wallet" page for new payout entry

#### 4. Error Handling Tests
- [ ] Test with invalid GCash number
- [ ] Test with insufficient PayMongo balance
- [ ] Test with invalid institution code
- [ ] Verify user-friendly error messages display

## Known Limitations & Next Steps

### Current Implementation
- ✅ Real PayMongo transfers to GCash
- ✅ Live FX rates from OpenExchangeRates
- ✅ Transaction tracking on Wallet page
- ✅ Error handling and user feedback

### Limitations
- ⚠️ GCash institution code (`GCSH`) is hardcoded
- ⚠️ Status is assumed "completed" immediately
- ⚠️ No webhook handling for async status updates
- ⚠️ Circle USDC burn not yet integrated

### Upcoming Features
1. **Institution Selection**: Allow users to select from dropdown of banks/e-wallets
2. **Webhook Integration**: Handle PayMongo webhooks for status updates (pending → completed/failed)
3. **Circle Integration**: Burn USDC before initiating PHP payout
4. **Real Authentication**: Replace hardcoded "demo-user"
5. **Transaction History**: Persist transactions in database

## Troubleshooting

### "PAYMONGO_SECRET_KEY is not set"
- Verify environment variable is set in Netlify dashboard
- Redeploy after setting environment variables

### "PayMongo API error (status 401)"
- Check that secret key is correct
- Ensure key matches environment (test vs live)

### "Transfer failed" with institution error
- Verify institution code is correct (use `pbx-list-institutions`)
- Check that provider matches institution capability

### Function returns 404
- Ensure you're testing on deployed Netlify site, not local
- Verify function files are in `netlify/functions/` directory
- Check `netlify.toml` configuration

## References
- [PayMongo API Docs](https://developers.paymongo.com)
- [Transfer V2 Documentation](https://developers.paymongo.com/reference/transfer-resource)
- [PayMongo Receiving Institutions](https://developers.paymongo.com/reference/receiving-institutions)
