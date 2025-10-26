# Environment Variables & Security Configuration

## Required Environment Variables

All environment variables are stored in `/app/backend/.env` and are **server-side only** - never exposed to the frontend.

### Database Configuration

```bash
# MongoDB Connection
MONGODB_URI="mongodb://localhost:27017"
MONGO_URL="mongodb://localhost:27017"  # Fallback for backward compatibility
DB_NAME="pbx_database"
```

**Security Notes:**
- Never commit database credentials to git
- In production, use authenticated MongoDB with strong passwords
- Consider using MongoDB Atlas or managed database service
- Use connection string with authentication: `mongodb://username:password@host:port/database`

### Authentication & Authorization

```bash
# Admin Panel Password
ADMIN_PASSWORD="pbx_admin_2025"
```

**Security Notes:**
- Change default password before deployment
- Use strong password (min 16 characters, mixed case, numbers, symbols)
- Store in secrets manager in production (AWS Secrets Manager, HashiCorp Vault, etc.)
- Never log or expose this password in error messages
- Rotate regularly (every 90 days recommended)

### Plaid Integration

```bash
# Plaid Mode
PLAID_MODE="MOCK"  # "MOCK" or "SANDBOX"

# Plaid Credentials (required for SANDBOX mode)
PLAID_CLIENT_ID=""
PLAID_SECRET=""
PLAID_ENV="sandbox"  # "sandbox", "development", or "production"
```

**Security Notes:**
- Keep Plaid credentials secret and server-side only
- Never expose in frontend code or API responses
- Use environment-specific credentials (sandbox for dev, production for live)
- Monitor API usage for suspicious activity
- Rotate secrets if compromised

### CORS Configuration

```bash
# CORS Origins
CORS_ORIGINS="*"  # Development: wildcard, Production: explicit origins
```

**Security Notes:**
- In development: Uses localhost origins automatically
- In production: Set explicit comma-separated list:
  ```bash
  CORS_ORIGINS="https://example.com,https://www.example.com,https://app.example.com"
  ```
- Never use wildcard (`*`) with credentials in production
- Include all your domains and subdomains

## Security Features Implemented

### 1. Rate Limiting

**Endpoint:** `POST /api/leads`
**Limit:** 5 requests per minute per IP address

**Implementation:**
```python
@api_router.post("/leads")
@limiter.limit("5/minute")
async def create_lead(request: Request, lead_data: LeadCreate):
    # ...
```

**Protection against:**
- Spam submissions
- Brute force attacks
- Resource exhaustion
- Email list harvesting

**Response when rate limit exceeded:**
```json
{
  "detail": "Rate limit exceeded: 5 per 1 minute"
}
```
Status code: 429 (Too Many Requests)

**IP Detection:**
Checks in order:
1. `X-Forwarded-For` header (from load balancer)
2. `X-Real-IP` header (from nginx)
3. Direct connection IP

### 2. Input Validation

**JSON Body Validation:**
- Pydantic models validate all request bodies
- Returns 400 Bad Request on invalid input
- Validates required fields, data types, and constraints

**Email Validation:**
```python
# Multiple validation layers:
1. Pydantic model validation (basic)
2. Custom regex validation (strict)
3. Format checks (no consecutive dots, length limits, etc.)
```

**Validation Rules:**
- Email format: `user@domain.tld`
- Local part max length: 64 characters
- Domain max length: 253 characters
- No consecutive dots
- No leading/trailing dots

**Amount Validation:**
- Must be greater than 0
- Must be a valid number
- Validates via Pydantic Field with `gt=0`

**Destination Type Validation:**
- Must be exactly "GCash" or "PH_BANK"
- Case-sensitive
- No other values allowed

### 3. Authentication

**Basic Auth for Admin:**
- Username: `admin` (fixed)
- Password: from `ADMIN_PASSWORD` env var
- Uses standard HTTP Basic Authentication
- Credentials sent in Authorization header

**Implementation:**
```python
from fastapi.security import HTTPBasic, HTTPBasicCredentials

security = HTTPBasic()

def verify_admin_auth(credentials: HTTPBasicCredentials = Depends(security)):
    # Constant-time comparison to prevent timing attacks
    is_password_correct = secrets.compare_digest(
        credentials.password.encode('utf-8'),
        admin_password.encode('utf-8')
    )
    # ...
```

**Protection:**
- Timing attack resistant (constant-time comparison)
- Session-based caching (frontend stores in sessionStorage)
- No password in URLs or logs

### 4. CORS Configuration

**Development Mode:**
```python
cors_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000"
]
```

**Production Mode:**
```python
cors_origins = os.environ.get('CORS_ORIGINS').split(',')
# Example: ["https://example.com", "https://app.example.com"]
```

**Settings:**
- `allow_credentials=True` (for cookies/auth headers)
- `allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"]` (specific methods only)
- `max_age=3600` (cache preflight requests for 1 hour)

### 5. Secure Cookie Configuration

**Cookie: `pbx_uid`**
```python
response.set_cookie(
    key="pbx_uid",
    value=user_id,
    max_age=365 * 24 * 60 * 60,  # 1 year
    httponly=True,  # Not accessible via JavaScript (XSS protection)
    samesite="lax",  # CSRF protection
    secure=False     # Set to True in production with HTTPS
)
```

**Security attributes:**
- `httponly=True` → Prevents XSS attacks
- `samesite="lax"` → Prevents CSRF attacks
- `secure=True` (in production) → HTTPS only

### 6. Error Handling

**Principles:**
- Never expose internal errors to users
- Log detailed errors server-side
- Return generic error messages to clients
- Use appropriate HTTP status codes

**Status Codes Used:**
- `200` - Success
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (auth required)
- `404` - Not Found
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

**Example:**
```python
try:
    # ... operation
except Exception as e:
    logger.error(f"Detailed error: {e}")  # Server-side only
    raise HTTPException(
        status_code=500,
        detail="Failed to process request"  # Generic message
    )
```

### 7. Logging & Monitoring

**What's logged:**
- Rate limit violations (with IP address)
- Invalid email formats
- Duplicate email attempts
- Successful operations
- All errors with full stack traces

**What's NOT logged:**
- Passwords
- Plaid secrets
- User session tokens
- Sensitive personal data

**Log format:**
```
2025-10-26 10:30:00 - INFO - Lead created from IP 192.168.1.1: user@example.com
2025-10-26 10:30:15 - WARNING - Rate limit exceeded: IP=192.168.1.1, Path=/api/leads, Limit=5/minute
```

## Production Checklist

Before deploying to production:

### Environment Variables
- [ ] Change `ADMIN_PASSWORD` to strong password
- [ ] Set `CORS_ORIGINS` to explicit list of domains
- [ ] Configure `MONGODB_URI` with authentication
- [ ] Add Plaid production credentials (if using SANDBOX mode)
- [ ] Set `PLAID_MODE` appropriately

### Security
- [ ] Enable HTTPS (set cookie `secure=True`)
- [ ] Set up firewall rules (restrict database access)
- [ ] Enable MongoDB authentication
- [ ] Set up rate limiting with Redis (for multi-instance)
- [ ] Configure logging to external service (DataDog, Sentry, etc.)
- [ ] Set up monitoring and alerts
- [ ] Enable DDoS protection (Cloudflare, AWS Shield, etc.)
- [ ] Add API key authentication for sensitive endpoints
- [ ] Implement request signing for critical operations

### Secrets Management
- [ ] Move secrets to secrets manager (AWS, GCP, Azure)
- [ ] Set up secret rotation
- [ ] Remove `.env` from production (use container secrets)
- [ ] Audit access to secrets

### Compliance
- [ ] Add privacy policy
- [ ] Add terms of service
- [ ] Implement GDPR data deletion (if serving EU)
- [ ] Add email unsubscribe mechanism
- [ ] Document data retention policies

## Testing Rate Limiting

### Test 1: Rate limit enforcement
```bash
# Send 6 requests quickly (should block 6th)
for i in {1..6}; do
  curl -X POST http://localhost:8001/api/leads \
    -H "Content-Type: application/json" \
    -d '{"email": "test'$i'@example.com"}'
  echo ""
done

# Expected: First 5 succeed, 6th returns 429
```

### Test 2: Rate limit per IP
```bash
# Different IPs should have separate limits
curl -X POST http://localhost:8001/api/leads \
  -H "X-Forwarded-For: 192.168.1.1" \
  -d '{"email": "user1@example.com"}'

curl -X POST http://localhost:8001/api/leads \
  -H "X-Forwarded-For: 192.168.1.2" \
  -d '{"email": "user2@example.com"}'

# Both should succeed (different IPs)
```

### Test 3: Rate limit reset
```bash
# Wait 60 seconds, should be able to submit again
curl -X POST http://localhost:8001/api/leads \
  -d '{"email": "test@example.com"}'

sleep 60

curl -X POST http://localhost:8001/api/leads \
  -d '{"email": "test2@example.com"}'

# Should succeed after wait
```

## Testing Input Validation

### Test 1: Invalid email format
```bash
curl -X POST http://localhost:8001/api/leads \
  -H "Content-Type: application/json" \
  -d '{"email": "notanemail"}'

# Expected: {"status": "invalid_email", "message": "..."}
```

### Test 2: Missing required field
```bash
curl -X POST http://localhost:8001/api/leads \
  -H "Content-Type: application/json" \
  -d '{}'

# Expected: 400 Bad Request with validation error
```

### Test 3: Invalid amount
```bash
curl -X POST http://localhost:8001/api/circle/sendFunds \
  -H "Content-Type: application/json" \
  -d '{"amountUSD": -10, "destinationType": "GCash", "destinationTag": "test"}'

# Expected: 400 Bad Request "Amount must be greater than 0"
```

## Monitoring Rate Limits

Check backend logs for rate limit violations:

```bash
# View rate limit logs
tail -f /var/log/supervisor/backend.err.log | grep "Rate limit"

# Count rate limit violations
grep "Rate limit exceeded" /var/log/supervisor/backend.err.log | wc -l

# View top offending IPs
grep "Rate limit exceeded" /var/log/supervisor/backend.err.log | \
  grep -oP "IP=\K[0-9.]+" | sort | uniq -c | sort -rn | head -10
```

## Security Headers (Future Enhancement)

Consider adding security headers middleware:

```python
@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000"
    return response
```

## Rate Limiting with Redis (Production)

For multi-instance deployments, use Redis:

```python
# Install: pip install redis
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(
    key_func=get_remote_address,
    storage_uri="redis://localhost:6379"  # Use Redis
)
```

**Benefits:**
- Shared rate limit across multiple instances
- Persistent rate limit counters
- Better performance at scale
- Configurable TTL
