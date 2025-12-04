# PayMongo Integration Test Plan

## Prerequisites
Before testing, ensure these environment variables are set in Netlify:
- `PAYMONGO_SECRET_KEY` (test key: sk_test_...)
- `OXR_API_KEY` (for FX rates)

## Test Scenarios

### 1. Backend Function Tests

#### Test 1.1: Create Transfer - Success Case
**Endpoint**: `POST /.netlify/functions/pbx-create-transfer`

**Test Data**:
```json
{
  "amountPhp": 100.50,
  "institution_code": "GCSH",
  "account_name": "Maria Santos",
  "account_number": "09171234567",
  "provider": "instapay",
  "description": "Test PBX transfer",
  "metadata": {
    "usd_amount": 2,
    "fx_rate": 50.25,
    "user_id": "demo-user"
  }
}
```

**Expected Response**:
- Status: 200
- Body contains `data.id` (batch transfer ID)
- Body contains `data.attributes.transfers[0]` with transfer details

#### Test 1.2: Create Transfer - Missing Required Fields
**Test Data**:
```json
{
  "amountPhp": 100.50,
  "institution_code": "GCSH"
}
```

**Expected Response**:
- Status: 400
- Error message about missing required fields

#### Test 1.3: Create Transfer - Invalid Institution Code
**Test Data**:
```json
{
  "amountPhp": 100.50,
  "institution_code": "INVALID_CODE",
  "account_name": "Test User",
  "account_number": "09171234567"
}
```

**Expected Response**:
- Status: 400 or 422
- PayMongo error about invalid institution

#### Test 1.4: List Institutions
**Endpoint**: `GET /.netlify/functions/pbx-list-institutions`

**Expected Response**:
- Status: 200
- Body contains array of institutions with codes and names
- Should include "GCSH" for GCash

### 2. Frontend E2E Tests

#### Test 2.1: Complete GCash Payout Flow
**Steps**:
1. Navigate to "Send Money" page
2. Verify subtitle shows "Send USD → PHP via PayMongo (Real Payouts)"
3. Recipient dropdown should show "Maria Santos (@maria)" as first option
4. Enter amount: 10 USD
5. Wait for FX quote to appear (should show live PHP rate)
6. Verify preview shows:
   - Amount in USD: $10.00
   - PBX rate (live): 1 USD = ~50-58 PHP
   - Estimated PHP: ₱500-580
7. Click "Send" button
8. Confirm in modal
9. Verify loading state shows "Sending..."
10. Wait for success confirmation card
11. Verify confirmation shows:
    - Recipient: Maria Santos (09171234567)
    - Amount sent: $10.00
    - Fee: $0.00
    - PBX rate
    - Est. PHP received
    - Transaction reference
    - Timestamp
12. Navigate to "Wallet" page
13. Verify new entry appears in "Recent Activity"
14. Verify new entry appears in "PH Payouts" section

#### Test 2.2: Error Handling - No FX Quote
**Steps**:
1. Mock FX quote endpoint to fail (or disconnect internet)
2. Try to enter amount
3. Verify "Live rate unavailable" message appears
4. Verify "Send" button is disabled
5. Verify error message is user-friendly

#### Test 2.3: Error Handling - PayMongo API Failure
**Steps**:
1. Mock PayMongo endpoint to return error
2. Complete transfer flow
3. Verify error message displays: "Payout failed. Please try again in a few minutes."
4. Verify no entry is added to Wallet

#### Test 2.4: Non-GCash Recipient (Internal Transfer)
**Steps**:
1. Select "Juan Dela Cruz (@juan)" - no gcashNumber
2. Enter amount and complete transfer
3. Verify it uses internal transfer (not PayMongo)
4. Verify success message: "Transfer complete ✅"

### 3. Integration Tests

#### Test 3.1: End-to-End with Real PayMongo Test API
**Prerequisites**:
- Use PayMongo test keys
- Test account number from PayMongo docs

**Steps**:
1. Set `PAYMONGO_SECRET_KEY` to test key
2. Complete full transfer flow from UI
3. Verify transfer is created in PayMongo dashboard
4. Check transfer status in PayMongo
5. Verify correct amount in centavos (PHP * 100)

#### Test 3.2: Multiple Sequential Transfers
**Steps**:
1. Complete first transfer to Maria Santos
2. Immediately complete second transfer
3. Verify both succeed independently
4. Verify both appear in Wallet activity
5. Check for race conditions or state issues

### 4. Edge Cases

#### Test 4.1: Decimal Amounts
- Test: 10.01 USD → Should convert correctly to PHP centavos
- Test: 0.50 USD → Small amount
- Test: 100.99 USD → Large amount with decimals

#### Test 4.2: Special Characters in Names
- Test: Recipient name with accents: "José María"
- Test: Name with apostrophe: "O'Brien"

#### Test 4.3: Long Account Numbers
- Test: Maximum length account number
- Test: Minimum length account number

### 5. Security Tests

#### Test 5.1: Environment Variables
- Verify `PAYMONGO_SECRET_KEY` is never exposed in:
  - Frontend code
  - Browser console
  - Network responses
  - Error messages

#### Test 5.2: API Authentication
- Verify all PayMongo calls use Basic Auth
- Verify auth header format: `Basic base64(secret_key:)`

## Test Execution Order

**Phase 1: Backend Unit Tests**
1. Test 1.1 - Create Transfer Success
2. Test 1.2 - Missing Fields
3. Test 1.4 - List Institutions

**Phase 2: Frontend UI Tests**
1. Test 2.1 - Complete GCash Payout Flow
2. Test 2.4 - Non-GCash Recipient

**Phase 3: Integration Tests**
3. Test 3.1 - Real PayMongo Test API
4. Test 3.2 - Multiple Transfers

**Phase 4: Edge Cases & Error Handling**
5. Test 2.2 - No FX Quote
6. Test 2.3 - PayMongo Failure
7. Test 4.1-4.3 - Edge Cases

## Success Criteria

✅ All backend functions return correct status codes
✅ Frontend displays live FX rates
✅ Real PayMongo transfers are created successfully
✅ UI shows detailed confirmation after payout
✅ Wallet page updates with new entries
✅ Error messages are user-friendly
✅ No secrets exposed in frontend
✅ Decimal amounts convert correctly to centavos

## Known Limitations to Document
- GCash institution code is hardcoded to "GCSH"
- Transfer status assumed "completed" immediately
- No webhook handling yet
- Circle USDC burn not integrated

## Testing Notes
- All Netlify Function tests must be done on deployed site
- Local development cannot test Netlify Functions (returns 404)
- Use Netlify deploy previews for testing before production
