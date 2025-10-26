# PBX API Lead Routes - Testing Guide

## Endpoints

### POST /api/leads
Submit email for early access signup.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Responses:**

1. **Success (new email)**
```json
{
  "status": "ok",
  "lead": {
    "id": "68fde42a37dff03f01e96ecb",
    "email": "user@example.com",
    "created_at": "2025-10-26T09:04:42.744000"
  }
}
```

2. **Email already subscribed**
```json
{
  "status": "already_subscribed",
  "message": "This email is already subscribed"
}
```

3. **Invalid email format**
```json
{
  "status": "invalid_email",
  "message": "Please provide a valid email address"
}
```

### GET /api/leads (Admin Only)
Retrieve last 500 leads, newest first.

**Authentication:** Basic Auth
- Username: `admin`
- Password: Value of `ADMIN_PASSWORD` env variable (default: `pbx_admin_2025`)

**Response:**
```json
[
  {
    "_id": "68fde42a37dff03f01e96ecb",
    "email": "newuser@pbx.com",
    "created_at": "2025-10-26T09:04:42.744000"
  },
  ...
]
```

**Error (no auth):**
```json
{
  "detail": "Not authenticated"
}
```

**Error (invalid credentials):**
```json
{
  "detail": "Invalid credentials"
}
```

## Testing Examples

### Test 1: Create new lead
```bash
curl -X POST http://localhost:8001/api/leads \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

Expected: `{"status": "ok", "lead": {...}}`

### Test 2: Duplicate email
```bash
curl -X POST http://localhost:8001/api/leads \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

Expected: `{"status": "already_subscribed", ...}`

### Test 3: Invalid email
```bash
curl -X POST http://localhost:8001/api/leads \
  -H "Content-Type: application/json" \
  -d '{"email": "notanemail"}'
```

Expected: `{"status": "invalid_email", ...}`

### Test 4: Get leads without auth (should fail)
```bash
curl http://localhost:8001/api/leads
```

Expected: `{"detail": "Not authenticated"}`

### Test 5: Get leads with wrong password (should fail)
```bash
curl -u admin:wrongpass http://localhost:8001/api/leads
```

Expected: `{"detail": "Invalid credentials"}`

### Test 6: Get leads with correct auth
```bash
curl -u admin:pbx_admin_2025 http://localhost:8001/api/leads
```

Expected: Array of leads

## Email Validation Rules

The endpoint validates emails using regex:
```
^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$
```

Valid examples:
- user@example.com
- john.doe@company.co.uk
- test+tag@domain.org

Invalid examples:
- notanemail
- @example.com
- user@
- user@domain

## Security Notes

1. **Basic Auth**: Admin endpoint uses HTTP Basic Authentication
2. **Timing-safe comparison**: Password comparison uses `secrets.compare_digest()` to prevent timing attacks
3. **Lowercase emails**: All emails are automatically converted to lowercase and trimmed
4. **Duplicate prevention**: Unique constraint on email field prevents duplicates at database level
5. **No error details**: Failed authentication returns generic "Invalid credentials" message

## Environment Variables

Required in `/app/backend/.env`:
```
ADMIN_PASSWORD=pbx_admin_2025
```

Change this password in production!
