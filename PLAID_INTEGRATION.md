# Plaid Integration - Mock vs Sandbox

## Overview

The PBX application supports two modes for Plaid integration:
- **MOCK**: Uses local mock data (no external API calls, no credentials needed)
- **SANDBOX**: Uses real Plaid Sandbox API (requires Plaid credentials)

The frontend code remains unchanged - response shapes are identical in both modes.

## Configuration

### Environment Variables

Add to `/app/backend/.env`:

```bash
# Plaid Configuration
PLAID_MODE="MOCK"              # "MOCK" or "SANDBOX"
PLAID_CLIENT_ID=""             # Required for SANDBOX mode
PLAID_SECRET=""                # Required for SANDBOX mode
PLAID_ENV="sandbox"            # "sandbox", "development", or "production"
```

### Mode Selection

**MOCK Mode (Default)**
- No external API calls
- No credentials required
- Generates realistic fake data
- Instant responses
- Perfect for development and demos

**SANDBOX Mode**
- Connects to real Plaid Sandbox API
- Requires Plaid account and credentials
- Uses real test bank accounts
- Realistic latency and behavior
- Good for integration testing

## Getting Plaid Credentials

To use SANDBOX mode:

1. Sign up at https://dashboard.plaid.com/signup
2. Create a new application
3. Copy your credentials from the dashboard:
   - Client ID
   - Secret (sandbox)
4. Add them to `.env`:
   ```bash
   PLAID_MODE="SANDBOX"
   PLAID_CLIENT_ID="your_client_id_here"
   PLAID_SECRET="your_sandbox_secret_here"
   ```

## Response Format Consistency

Both modes return identical response shapes:

### Create Link Token
```json
{
  "link_token": "link-sandbox-...",
  "expiration": "2025-10-26T10:30:40.934849Z"
}
```

### Exchange Token
```json
{
  "access_token": "access-sandbox-...",
  "item_id": "item-sandbox-..."
}
```

### Get Accounts
```json
{
  "accounts": [
    {
      "account_id": "acc_123",
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
    }
  ]
}
```

### Get Transactions
```json
{
  "transactions": [
    {
      "transaction_id": "tx_123",
      "account_id": "acc_123",
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
    }
  ]
}
```

## Implementation Details

### Plaid Service Factory

Location: `/app/backend/services/plaid_service.py`

The `PlaidService` class provides a unified interface:

```python
from services.plaid_service import get_plaid_service

plaid_service = get_plaid_service()

# Works in both MOCK and SANDBOX modes
link_token = await plaid_service.create_link_token(user_id)
```

### Mode Detection

The service automatically detects mode from `PLAID_MODE` env var:

```python
def get_plaid_mode() -> str:
    return os.environ.get('PLAID_MODE', 'MOCK').upper()
```

### Lazy Loading

In MOCK mode, the Plaid SDK is not imported (avoids dependency issues):

```python
if mode == 'SANDBOX':
    import plaid  # Only imported when needed
```

## Testing

### Test MOCK Mode

```bash
# Ensure MOCK mode
echo 'PLAID_MODE="MOCK"' >> /app/backend/.env
sudo supervisorctl restart backend

# Test endpoints
curl -X POST http://localhost:8001/api/plaid/mock/create-link-token
curl -X POST http://localhost:8001/api/plaid/mock/exchange -d '{"public_token":"test"}'
curl http://localhost:8001/api/plaid/mock/accounts
curl http://localhost:8001/api/plaid/mock/transactions?limit=5
```

### Test SANDBOX Mode

```bash
# Configure credentials
cat >> /app/backend/.env <<EOF
PLAID_MODE="SANDBOX"
PLAID_CLIENT_ID="your_client_id"
PLAID_SECRET="your_secret"
PLAID_ENV="sandbox"
EOF

# Restart backend
sudo supervisorctl restart backend

# Check logs for initialization
tail -f /var/log/supervisor/backend.err.log | grep "PlaidService"
# Should show: "PlaidService initialized in SANDBOX mode"

# Test endpoints (same as MOCK mode)
curl -X POST http://localhost:8001/api/plaid/mock/create-link-token
```

## Frontend Integration

No changes needed! The frontend calls the same endpoints:

```javascript
// This works in both MOCK and SANDBOX modes
const { data } = await axios.post(`${API}/plaid/mock/create-link-token`);
const linkToken = data.link_token;
```

## Switching Between Modes

### Switch to MOCK Mode

```bash
# Update .env
sed -i 's/PLAID_MODE="SANDBOX"/PLAID_MODE="MOCK"/' /app/backend/.env

# Restart
sudo supervisorctl restart backend

# Verify logs
tail -n 5 /var/log/supervisor/backend.err.log | grep "MOCK mode"
```

### Switch to SANDBOX Mode

```bash
# Update .env (with your credentials)
cat > /app/backend/.env <<EOF
PLAID_MODE="SANDBOX"
PLAID_CLIENT_ID="your_client_id"
PLAID_SECRET="your_secret"
EOF

# Restart
sudo supervisorctl restart backend

# Verify logs
tail -n 5 /var/log/supervisor/backend.err.log | grep "SANDBOX mode"
```

## Error Handling

### MOCK Mode Errors
Rarely fails - only if logic errors in mock generators.

### SANDBOX Mode Errors

**Missing Credentials:**
```
ValueError: PLAID_CLIENT_ID and PLAID_SECRET must be set for SANDBOX mode
```
→ Add credentials to `.env`

**Invalid Credentials:**
```
plaid.ApiException: invalid_api_keys
```
→ Verify credentials in Plaid dashboard

**Network Issues:**
```
Failed to fetch accounts: Connection timeout
```
→ Check internet connection and Plaid status

## Development Workflow

**Recommended approach:**

1. **Local Development**: Use MOCK mode
   - Fast iteration
   - No API quota usage
   - Works offline

2. **Integration Testing**: Use SANDBOX mode
   - Test with real Plaid behavior
   - Verify error handling
   - Check edge cases

3. **Production**: Use PRODUCTION mode (not covered in this guide)
   - Real bank data
   - Requires additional compliance
   - Needs production credentials

## Advantages of This Architecture

1. **Consistent Interface**: Frontend doesn't care about mode
2. **Fast Development**: MOCK mode is instant, no API delays
3. **Easy Testing**: Switch modes without code changes
4. **No Lock-in**: Can test without Plaid account
5. **Realistic Mock Data**: Mock responses mirror real Plaid structure

## Plaid SDK Installation

The Plaid Python SDK (`plaid-python==37.1.0`) is already installed.

If needed, reinstall with:
```bash
pip install plaid-python
pip freeze > requirements.txt
```

## Logs

Check which mode is active:

```bash
# Backend startup logs
tail -f /var/log/supervisor/backend.err.log | grep "PlaidService"

# Example output:
# INFO - PlaidService initialized in MOCK mode
# or
# INFO - PlaidService initialized in SANDBOX mode
```

## Comparison Table

| Feature | MOCK Mode | SANDBOX Mode |
|---------|-----------|--------------|
| Credentials Required | ❌ No | ✅ Yes |
| External API Calls | ❌ No | ✅ Yes |
| Response Time | Instant | 100-500ms |
| Quota Limits | None | Plaid sandbox limits |
| Internet Required | ❌ No | ✅ Yes |
| Data Realism | High (crafted) | Highest (real test data) |
| Setup Complexity | None | Medium |
| Cost | Free | Free (sandbox) |

## Security Notes

1. **Never commit credentials** to git
2. Store secrets in `.env` only
3. Use environment-specific credentials
4. Rotate secrets regularly
5. In production, use secrets management (AWS Secrets Manager, etc.)

## Troubleshooting

**Issue**: "PlaidService initialized in MOCK mode" but I set SANDBOX
**Solution**: Restart backend after changing `.env`

**Issue**: "Plaid SDK not installed"
**Solution**: `pip install plaid-python`

**Issue**: Frontend still shows mock data in SANDBOX mode
**Solution**: Clear browser cache and SessionState: POST /api/state/clear

**Issue**: Accounts not showing in SANDBOX mode
**Solution**: Ensure you've exchanged the public token first

## Additional Resources

- Plaid Quickstart: https://plaid.com/docs/quickstart/
- Plaid Sandbox: https://plaid.com/docs/sandbox/
- API Reference: https://plaid.com/docs/api/
