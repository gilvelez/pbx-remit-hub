# PBX Mock Circle API

## Overview

Mock implementation of Circle USDC transfer API for USD to PHP remittances. Simulates sending funds to Philippines via GCash or bank transfers.

## Endpoint

### POST /api/circle/sendFunds

Initiate a USD to PHP transfer (mock).

**Request:**
```bash
curl -b cookies.txt -X POST http://localhost:8001/api/circle/sendFunds \
  -H "Content-Type: application/json" \
  -d '{
    "amountUSD": 100.00,
    "destinationType": "GCash",
    "destinationTag": "+63-917-123-4567"
  }'
```

**Request Body:**
```typescript
{
  amountUSD: number,           // Amount in USD (must be > 0)
  destinationType: string,     // "GCash" or "PH_BANK"
  destinationTag: string       // Phone number, account number, etc.
}
```

**Response:**
```json
{
  "transactionId": "txn_fVQYR1d9UN",
  "status": "pending",
  "quotedRate": 56.1,
  "feesUSD": 1.0,
  "estPhp": 5610.0,
  "createdAt": "2025-10-26T09:19:33.120242Z",
  "destination": "GCash: +63-917-123-4567"
}
```

## Transfer Calculation

**Fixed Values:**
- Exchange Rate: **56.10 PHP per USD**
- Transfer Fee: **$1.00 USD**

**Formula:**
```
estPhp = amountUSD × 56.10
totalCost = amountUSD + 1.00
```

**Examples:**

| Amount USD | Rate  | Est. PHP | Fee  | Total Cost |
|-----------|-------|----------|------|-----------|
| $100      | 56.10 | ₱5,610   | $1   | $101      |
| $250.50   | 56.10 | ₱14,053  | $1   | $251.50   |
| $500      | 56.10 | ₱28,050  | $1   | $501      |

## Destination Types

### 1. GCash
Mobile wallet in the Philippines.

**destinationType:** `"GCash"`
**destinationTag examples:**
- `"+63-917-123-4567"`
- `"09171234567"`
- `"63917-123-4567"`

**Display format:** `"GCash: {tag}"`

### 2. Philippine Bank (PH_BANK)
Direct bank transfer to Philippine banks.

**destinationType:** `"PH_BANK"`
**destinationTag examples:**
- `"BPI-1234567890"`
- `"UnionBank-9876543210"`
- `"BDO-ACC-123456"`

**Display format:** `"Bank Account: {tag}"`

## Activity Tracking

Every transfer is appended to `SessionState.activity`:

```typescript
{
  id: string,              // "txn_{10 random chars}"
  type: "SEND",           // Transaction type
  amountUSD: number,      // Amount sent in USD
  estPhp: number,         // Estimated PHP received
  feesUSD: number,        // Transfer fee (1.00)
  status: "pending",      // Transaction status
  created_at: string      // ISO timestamp
}
```

## Status Flow

Current implementation only returns `"pending"` status.

**Future enhancement:** Status progression
1. `pending` - Transfer initiated
2. `processing` - Circle processing USDC conversion
3. `completed` - Recipient received funds
4. `failed` - Transfer failed (with reason)

## Validation

### Amount Validation
```bash
# Zero amount - REJECTED
curl ... -d '{"amountUSD": 0, ...}'
# Response: "Input should be greater than 0"

# Negative amount - REJECTED
curl ... -d '{"amountUSD": -10, ...}'
# Response: "Input should be greater than 0"

# Valid amount - ACCEPTED
curl ... -d '{"amountUSD": 100.00, ...}'
# Response: Transaction created
```

### Destination Type Validation
```bash
# Invalid type - REJECTED
curl ... -d '{"destinationType": "PayPal", ...}'
# Response: "destinationType must be 'GCash' or 'PH_BANK'"

# Valid types - ACCEPTED
curl ... -d '{"destinationType": "GCash", ...}'
curl ... -d '{"destinationType": "PH_BANK", ...}'
```

## Complete Flow Example

```bash
# 1. Initialize session
curl -c cookies.txt http://localhost:8001/api/state

# 2. Send funds to GCash
curl -b cookies.txt -X POST http://localhost:8001/api/circle/sendFunds \
  -H "Content-Type: application/json" \
  -d '{
    "amountUSD": 200.00,
    "destinationType": "GCash",
    "destinationTag": "+63-917-555-1234"
  }'

# Response:
{
  "transactionId": "txn_abc1234567",
  "status": "pending",
  "quotedRate": 56.1,
  "feesUSD": 1,
  "estPhp": 11220,
  "createdAt": "2025-10-26T09:19:33.120242Z",
  "destination": "GCash: +63-917-555-1234"
}

# 3. Send funds to bank
curl -b cookies.txt -X POST http://localhost:8001/api/circle/sendFunds \
  -H "Content-Type: application/json" \
  -d '{
    "amountUSD": 500.00,
    "destinationType": "PH_BANK",
    "destinationTag": "BPI-9876543210"
  }'

# 4. Check activity history
curl -b cookies.txt http://localhost:8001/api/state | jq '.activity'

# Response:
[
  {
    "id": "txn_abc1234567",
    "type": "SEND",
    "amountUSD": 200,
    "estPhp": 11220,
    "feesUSD": 1,
    "status": "pending",
    "created_at": "2025-10-26T09:19:33.120000"
  },
  {
    "id": "txn_xyz9876543",
    "type": "SEND",
    "amountUSD": 500,
    "estPhp": 28050,
    "feesUSD": 1,
    "status": "pending",
    "created_at": "2025-10-26T09:20:15.456000"
  }
]

# 5. Calculate totals
curl -b cookies.txt http://localhost:8001/api/state | jq '{
  total_sent_usd: ([.activity[].amountUSD] | add),
  total_sent_php: ([.activity[].estPhp] | add),
  total_fees: ([.activity[].feesUSD] | add),
  transaction_count: (.activity | length)
}'

# 6. Clear state (reset demo)
curl -b cookies.txt -X POST http://localhost:8001/api/state/clear
```

## Frontend Integration

### React Example

```javascript
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Send funds
const sendFunds = async (amountUSD, destinationType, destinationTag) => {
  try {
    const { data } = await axios.post(
      `${API}/circle/sendFunds`,
      {
        amountUSD,
        destinationType,
        destinationTag
      },
      { withCredentials: true }
    );
    
    return {
      success: true,
      transaction: data
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.detail || 'Transfer failed'
    };
  }
};

// Example usage
const handleTransfer = async () => {
  const result = await sendFunds(
    100.00,
    'GCash',
    '+63-917-123-4567'
  );
  
  if (result.success) {
    console.log('Transfer initiated:', result.transaction);
    // Show success message with transaction ID
    alert(`Transfer pending: ${result.transaction.transactionId}`);
  } else {
    console.error('Transfer failed:', result.error);
    // Show error message
    alert(`Transfer failed: ${result.error}`);
  }
};

// Get activity history
const getActivity = async () => {
  const { data } = await axios.get(`${API}/state`, {
    withCredentials: true
  });
  return data.activity;
};
```

### Form Component Example

```jsx
import React, { useState } from 'react';

function TransferForm() {
  const [amount, setAmount] = useState('');
  const [destType, setDestType] = useState('GCash');
  const [destTag, setDestTag] = useState('');
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const response = await sendFunds(
      parseFloat(amount),
      destType,
      destTag
    );
    
    setResult(response);
  };

  // Calculate preview
  const quotedRate = 56.10;
  const fee = 1.00;
  const estPhp = amount ? (parseFloat(amount) * quotedRate).toFixed(2) : 0;
  const totalCost = amount ? (parseFloat(amount) + fee).toFixed(2) : 0;

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="number"
        step="0.01"
        min="0.01"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Amount in USD"
        required
      />
      
      <select value={destType} onChange={(e) => setDestType(e.target.value)}>
        <option value="GCash">GCash</option>
        <option value="PH_BANK">Bank Account</option>
      </select>
      
      <input
        type="text"
        value={destTag}
        onChange={(e) => setDestTag(e.target.value)}
        placeholder={destType === 'GCash' ? 'Phone number' : 'Account number'}
        required
      />
      
      {amount && (
        <div className="preview">
          <p>They receive: ₱{estPhp}</p>
          <p>Rate: 1 USD = {quotedRate} PHP</p>
          <p>Fee: ${fee}</p>
          <p>Total cost: ${totalCost}</p>
        </div>
      )}
      
      <button type="submit">Send Funds</button>
      
      {result && (
        <div className={result.success ? 'success' : 'error'}>
          {result.success ? (
            <p>✓ Transfer initiated: {result.transaction.transactionId}</p>
          ) : (
            <p>✗ {result.error}</p>
          )}
        </div>
      )}
    </form>
  );
}
```

## Testing Scenarios

### Test 1: Small transfer to GCash
```bash
curl -b cookies.txt -X POST http://localhost:8001/api/circle/sendFunds \
  -H "Content-Type: application/json" \
  -d '{"amountUSD": 50, "destinationType": "GCash", "destinationTag": "+63-917-555-0001"}'

# Expected: ₱2,805 (50 × 56.10)
```

### Test 2: Large transfer to bank
```bash
curl -b cookies.txt -X POST http://localhost:8001/api/circle/sendFunds \
  -H "Content-Type: application/json" \
  -d '{"amountUSD": 1000, "destinationType": "PH_BANK", "destinationTag": "BPI-1234567890"}'

# Expected: ₱56,100 (1000 × 56.10)
```

### Test 3: Activity accumulation
```bash
# Send 3 transfers
for i in 100 200 300; do
  curl -b cookies.txt -X POST http://localhost:8001/api/circle/sendFunds \
    -H "Content-Type: application/json" \
    -d "{\"amountUSD\": $i, \"destinationType\": \"GCash\", \"destinationTag\": \"+63-917-555-000$i\"}"
done

# Check total
curl -b cookies.txt http://localhost:8001/api/state | jq '[.activity[].amountUSD] | add'
# Expected: 600
```

## Error Handling

| Error | Status | Message |
|-------|--------|---------|
| Amount ≤ 0 | 422 | "Input should be greater than 0" |
| Invalid destination type | 400 | "destinationType must be 'GCash' or 'PH_BANK'" |
| Missing required field | 422 | Pydantic validation error |
| No session/cookie | 500 | "Failed to send funds" |

## Notes

1. **Mock Implementation**: This is for demo purposes only. Real Circle integration requires API keys and KYC.
2. **Fixed Rate**: Exchange rate is hardcoded at 56.10. Real implementation would fetch live rates.
3. **Instant Status**: All transfers are marked "pending" immediately. Real transfers have actual processing time.
4. **No Settlement**: Mock doesn't actually move money or interact with GCash/banks.
5. **Activity Persistence**: All transactions persist in MongoDB until state is cleared.
6. **Transaction IDs**: Generated randomly with format `txn_{10 alphanumeric chars}`.
