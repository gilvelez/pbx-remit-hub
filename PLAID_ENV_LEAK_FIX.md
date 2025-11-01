# CRITICAL: Fix PLAID_ENV Leak in Frontend Bundle

## 🚨 Problem

**Error**: `Secret env var "PLAID_ENV"'s value detected in build/static/js/main.43fec118.js`

**Root Cause**: Netlify's secrets scanner detected PLAID_ENV in the compiled frontend JavaScript bundle. This happens when environment variables are exposed during the build process.

## ✅ Solution

### Step 1: Remove PLAID Variables from Build Environment

In **Netlify Dashboard**:

1. Go to: **Site settings → Environment variables**
2. Find these variables:
   - `PLAID_CLIENT_ID`
   - `PLAID_SECRET`
   - `PLAID_ENV`
3. For each variable, check the **Scopes** section
4. **UNCHECK "Builds"** ❌
5. **KEEP CHECKED "Functions"** ✅
6. **KEEP CHECKED "Runtime"** ✅

**Result**: Variables will be available to Functions but NOT to the build process

### Correct Configuration:

```
PLAID_CLIENT_ID:
  ❌ Builds (uncheck this)
  ✅ Functions (keep checked)
  ✅ Runtime (keep checked)

PLAID_SECRET:
  ❌ Builds (uncheck this)
  ✅ Functions (keep checked)
  ✅ Runtime (keep checked)

PLAID_ENV:
  ❌ Builds (uncheck this)
  ✅ Functions (keep checked)
  ✅ Runtime (keep checked)

APP_BASE_URL:
  ❌ Builds (uncheck this)
  ✅ Functions (keep checked)
  ✅ Runtime (keep checked)
```

### Step 2: Verify Frontend Code is Clean

**Already verified** ✅:
- No `process.env.PLAID_*` in frontend/src
- No PLAID references in React code
- All PLAID logic is in serverless functions only

### Step 3: Update netlify.toml (Already Done)

```toml
[build.environment]
  SECRETS_SCAN_OMIT_PATHS = "netlify/functions/**"
  
  # IMPORTANT: Don't list PLAID_* variables here
  # They will be bundled into client code if listed in [build.environment]
```

## Understanding the Issue

### How Webpack/Craco Handles Environment Variables

When you run `npm run build`:

1. **Webpack reads ALL environment variables** available during build
2. **Any env var starting with `REACT_APP_`** is automatically included in bundle
3. **Any env var referenced in code** (like `process.env.PLAID_ENV`) gets bundled
4. **Any env var in `[build.environment]`** might be exposed to the build process

### What Happens in Netlify

**Wrong Configuration** ❌:
```
Build Environment Variables (Exposed to build):
  PLAID_ENV=sandbox
  ↓
  Webpack sees this during build
  ↓
  Includes it in main.js bundle
  ↓
  Secrets scanner finds it
  ↓
  Build fails
```

**Correct Configuration** ✅:
```
Function Environment Variables (Runtime only):
  PLAID_ENV=sandbox
  ↓
  NOT available during build
  ↓
  Only available to serverless functions at runtime
  ↓
  Never in client bundle
  ↓
  Build succeeds
```

## Architecture

### How It Should Work

```
┌─────────────────────┐
│   React Frontend    │
│   (Public Bundle)   │
│                     │
│   ✅ No PLAID vars  │
└──────────┬──────────┘
           │
           │ Calls /.netlify/functions/plaid-link-token
           │
           v
┌────────────────────────────────┐
│   Netlify Function             │
│   (Server-side)                │
│                                │
│   Uses:                        │
│   - process.env.PLAID_CLIENT_ID ✅
│   - process.env.PLAID_SECRET   ✅
│   - process.env.PLAID_ENV      ✅
│   (Available at runtime only)  │
└────────────────────────────────┘
```

## Verification Steps

### 1. Check Netlify Environment Variables UI

**Navigate to**:
Site settings → Environment variables

**For each PLAID variable, verify**:
- [ ] "Builds" is UNCHECKED
- [x] "Functions" is CHECKED
- [x] "Runtime" is CHECKED

### 2. Trigger New Deploy

After changing variable scopes:

1. Go to **Deploys** tab
2. Click **"Trigger deploy"**
3. Select **"Clear cache and deploy site"**

### 3. Check Build Logs

Look for these lines:

**Success** ✅:
```
✅ Scanning complete. 88 file(s) scanned.
✅ No secrets detected in build output
✅ Deploy succeeded
```

**Still failing** ❌:
```
❌ Secret env var "PLAID_ENV"'s value detected
```

If still failing, check step 4.

### 4. Verify Variable Scopes via Netlify CLI

```bash
netlify env:list

# Should show:
PLAID_CLIENT_ID (functions, runtime) ✅
PLAID_SECRET (functions, runtime) ✅
PLAID_ENV (functions, runtime) ✅

# Should NOT show:
PLAID_ENV (builds) ❌
```

## Alternative Solutions (If Above Doesn't Work)

### Option A: Exclude from Secrets Scan (Not Recommended)

```toml
[build.environment]
  SECRETS_SCAN_OMIT_KEYS = "PLAID_ENV"
```

**Why not recommended**: This hides the problem instead of fixing it.

### Option B: Remove from Netlify UI Completely

1. Delete all PLAID_* variables from Netlify UI
2. Add them back ONLY with "Functions" and "Runtime" scopes
3. Never check "Builds"

## Common Mistakes

### ❌ Mistake 1: Adding variables with all scopes checked
When you add a new environment variable in Netlify UI, it defaults to ALL scopes checked. You must manually uncheck "Builds".

### ❌ Mistake 2: Using REACT_APP_ prefix for secrets
```javascript
// WRONG - Will be bundled into client code
process.env.REACT_APP_PLAID_SECRET
```

**Rule**: Never use `REACT_APP_` prefix for secrets!

### ❌ Mistake 3: Listing secrets in netlify.toml
```toml
# WRONG - Will expose to build
[build.environment]
  PLAID_ENV = "sandbox"
```

**Rule**: Only list non-sensitive config in netlify.toml

### ❌ Mistake 4: Referencing secrets in frontend code
```javascript
// WRONG - Even without REACT_APP_ prefix
const plaidEnv = process.env.PLAID_ENV;
```

**Rule**: Only reference secrets in serverless functions

## Testing After Fix

### 1. Clear Local Build Cache

```bash
cd /app/frontend
rm -rf build node_modules/.cache
npm run build
```

### 2. Search for PLAID in Bundle

```bash
cd /app/frontend/build
grep -r "PLAID_ENV" . || echo "✅ No PLAID_ENV in bundle"
grep -r "sandbox" static/js/ || echo "✅ No 'sandbox' in bundle"
```

### 3. Test Function Locally

```bash
# Functions should still have access to env vars
netlify dev

curl -X POST http://localhost:8888/.netlify/functions/plaid-link-token \
  -H "Content-Type: application/json" \
  -d '{"client_user_id":"test"}'

# Should return link_token (proving function has access to PLAID vars)
```

## Summary

**The Fix**:
1. ✅ Go to Netlify UI → Environment variables
2. ✅ For PLAID_CLIENT_ID, PLAID_SECRET, PLAID_ENV:
   - Uncheck "Builds"
   - Keep "Functions" checked
   - Keep "Runtime" checked
3. ✅ Trigger new deploy
4. ✅ Verify no secrets in build logs

**Why This Works**:
- Variables are NOT available during build (no webpack bundling)
- Variables ARE available to functions at runtime (via process.env)
- Secrets never touch the client bundle
- Secrets scanner passes

**Result**: Build succeeds, functions work, secrets stay secret! 🎉
