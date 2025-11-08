# Circle Auth Debugging - circle-auth-check

## Purpose
Debug function to diagnose Circle API authentication issues without exposing the actual API key.

## New Function Added

### circle-auth-check.js ✨
**Endpoint:** `/.netlify/functions/circle-auth-check`
**Purpose:** Diagnose Circle API authentication issues
**Method:** GET
**Security:** Safe - never exposes full API key

## What It Checks

### 1. Key Presence
```javascript
keyPresent: !!key  // true if CIRCLE_API_KEY is set
```
Verifies environment variable exists.

### 2. Key Format
```javascript
keyLooksPrefixed: key.startsWith("TEST_API_KEY:")
```
Verifies key has correct `TEST_API_KEY:` prefix.

### 3. Key Sample
```javascript
keySample: key.slice(13, 21)  // Shows chars 13-20 only
```
Shows first 8 characters of secret part (safe to expose).

**Example:**
- Full key: `TEST_API_KEY:bb4616152839e14d5cd2e7ebdf69d9b2:1b644676b4555f71ac096cd5979ab17`
- Sample shown: `bb461615`
- **Safe:** Only shows 8 chars out of 64-char secret

### 4. Circle Response
```javascript
statusFromCircle: res.status  // HTTP status from Circle
circleBody: {...}             // Response body from Circle
```
Shows what Circle API returns with this key.

## Response Format

### Success (Key Valid)
```json
{
  "statusFromCircle": 200,
  "keyPresent": true,
  "keyLooksPrefixed": true,
  "keySample": "bb461615",
  "circleBody": {
    "data": {
      "payments": {
        "masterWalletId": "1000005555"
      }
    }
  }
}
```

### Failure (Key Invalid)
```json
{
  "statusFromCircle": 401,
  "keyPresent": true,
  "keyLooksPrefixed": true,
  "keySample": "bb461615",
  "circleBody": {
    "code": 401,
    "message": "Unauthorized"
  }
}
```

### Failure (Key Missing)
```json
{
  "statusFromCircle": 401,
  "keyPresent": false,
  "keyLooksPrefixed": false,
  "keySample": null,
  "circleBody": {
    "code": 401,
    "message": "Unauthorized"
  }
}
```

### Failure (Wrong Prefix)
```json
{
  "statusFromCircle": 401,
  "keyPresent": true,
  "keyLooksPrefixed": false,  // ⚠️ Missing TEST_API_KEY: prefix
  "keySample": "bb461615",
  "circleBody": {
    "code": 401,
    "message": "Unauthorized"
  }
}
```

## Testing

### Test Circle Auth
```bash
curl https://philippinebayaniexchange.com/.netlify/functions/circle-auth-check
```

### Interpret Results

#### ✅ All Good (200 status)
```json
{
  "statusFromCircle": 200,
  "keyPresent": true,
  "keyLooksPrefixed": true,
  "keySample": "bb461615",
  "circleBody": {"data": {...}}
}
```
**Meaning:** Key is correct, Circle accepts it

#### ❌ Key Missing
```json
{
  "keyPresent": false,
  "keyLooksPrefixed": false,
  "keySample": null
}
```
**Solution:** Set CIRCLE_API_KEY in Netlify environment variables

#### ❌ Wrong Prefix
```json
{
  "keyPresent": true,
  "keyLooksPrefixed": false,  // ⚠️
  "keySample": "..."
}
```
**Solution:** Ensure key starts with `TEST_API_KEY:`

#### ❌ Invalid Key
```json
{
  "statusFromCircle": 401,
  "keyPresent": true,
  "keyLooksPrefixed": true,
  "keySample": "...",
  "circleBody": {"message": "Unauthorized"}
}
```
**Solution:** 
1. Verify key is correct in Netlify dashboard
2. Check for extra spaces/newlines
3. Regenerate key from Circle dashboard

## Updated circle-balances.js

### Changes Made
1. **Trim key:** `key.trim()` removes whitespace
2. **Add Content-Type header:** Matches Circle API docs
3. **Consistent error handling:** Same as other functions

### Before
```javascript
const apiKey = process.env.CIRCLE_API_KEY;
```

### After
```javascript
const key = (process.env.CIRCLE_API_KEY || "").trim();
```

**Why trim()?**
- Removes leading/trailing whitespace
- Prevents copy-paste errors
- Handles newlines in env var

## Security Notes

### Safe Information Exposed
✅ **keySample:** First 8 chars (8 out of 64) - safe
✅ **keyPresent:** Boolean - safe
✅ **keyLooksPrefixed:** Boolean - safe
✅ **statusFromCircle:** HTTP status - safe
✅ **circleBody:** Circle's public response - safe

### Never Exposed
❌ Full API key
❌ Complete secret
❌ Sensitive credentials

### Why keySample is Safe
- Full secret: 64 characters
- Sample shown: 8 characters (12.5%)
- Brute force: 62^56 remaining possibilities
- Effectively impossible to reconstruct

## Diagnostic Workflow

### Step 1: Check Auth
```bash
curl https://site.com/.netlify/functions/circle-auth-check
```

### Step 2: Interpret Response
```javascript
if (statusFromCircle === 200) {
  // ✅ Key works! Problem is elsewhere
} else if (!keyPresent) {
  // ❌ Set CIRCLE_API_KEY in Netlify
} else if (!keyLooksPrefixed) {
  // ❌ Add TEST_API_KEY: prefix
} else if (statusFromCircle === 401) {
  // ❌ Key is invalid - check Circle dashboard
}
```

### Step 3: Test Balances
```bash
curl https://site.com/.netlify/functions/circle-balances
```

### Step 4: Compare
- If auth-check succeeds but balances fails → Endpoint issue
- If both fail with 401 → Key is invalid
- If auth-check succeeds and balances succeeds → All working!

## Common Issues & Solutions

### Issue: 401 from circle-balances
**Check:**
```bash
curl https://site.com/.netlify/functions/circle-auth-check
```

**If statusFromCircle = 401:**
- Check `keyPresent` - is key set?
- Check `keyLooksPrefixed` - has correct prefix?
- Check `keySample` - matches expected start?

**Solutions:**
1. **Missing key:** Set in Netlify dashboard
2. **Wrong prefix:** Must be `TEST_API_KEY:...`
3. **Invalid key:** Regenerate from Circle dashboard
4. **Whitespace:** Now auto-trimmed (fixed)

### Issue: Key looks correct but still 401
**Possible causes:**
1. **Copied incorrectly:** Hidden characters
2. **Wrong environment:** Production vs sandbox
3. **Expired key:** Regenerate from Circle
4. **Account issue:** Check Circle dashboard

**Solution:**
1. Delete CIRCLE_API_KEY from Netlify
2. Copy key fresh from Circle dashboard
3. Paste in Netlify (no extra spaces)
4. Redeploy
5. Test circle-auth-check

## Complete Circle Functions (3 Total)

### 1. circle-ping.js
**Purpose:** Basic connectivity test (no auth)
**Use:** Verify Circle API is accessible

### 2. circle-auth-check.js ✨ NEW
**Purpose:** Debug authentication issues
**Use:** Diagnose 401 errors safely

### 3. circle-balances.js (Updated)
**Purpose:** Get USDC balances
**Use:** Production balance checking
**Updated:** Added trim() and Content-Type header

## Testing Checklist

### 1. Test Auth Check
```bash
curl https://site.com/.netlify/functions/circle-auth-check
```
**Expected:** statusFromCircle = 200, keyPresent = true

### 2. Verify Key Format
```json
{
  "keyLooksPrefixed": true  // ✅ Must be true
}
```

### 3. Check Sample
```json
{
  "keySample": "bb461615"  // Should match first 8 chars after prefix
}
```

### 4. Test Balances
```bash
curl https://site.com/.netlify/functions/circle-balances
```
**Expected:** 200 status with balance data

## Files Changed

| File | Action | Purpose |
|------|--------|---------|
| `/app/netlify/functions/circle-auth-check.js` | Created | Auth debugging |
| `/app/netlify/functions/circle-balances.js` | Updated | Added trim(), Content-Type |

## Deployment

```bash
git add netlify/functions/circle-auth-check.js netlify/functions/circle-balances.js
git commit -m "Add Circle auth debugging and fix balances function"
git push origin main
```

**After deploy:**
1. Test: `curl https://site.com/.netlify/functions/circle-auth-check`
2. Verify: `statusFromCircle` should be 200
3. Test: `curl https://site.com/.netlify/functions/circle-balances`
4. Verify: Should return balance data

---

## Summary

✅ **New debug function** (circle-auth-check) safely diagnoses auth issues
✅ **Updated circle-balances** with trim() and proper headers
✅ **Security maintained** - never exposes full API key
✅ **Easy troubleshooting** - clear diagnostic output

**Use circle-auth-check to:**
- Verify key is set correctly
- Check key format/prefix
- See Circle's response
- Diagnose 401 errors

**Ready to deploy!** 🚀
