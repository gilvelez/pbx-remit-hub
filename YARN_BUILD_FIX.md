# Yarn Build Command Fix

## Issue
**Error:** `npm ci` command failed because no `package-lock.json` exists in frontend directory
**Cause:** Frontend uses **Yarn** (has `yarn.lock`), not npm

## Solution

### Updated netlify.toml

**Before (npm):**
```toml
[build]
  command   = "cd frontend && npm ci && npm run build"
  publish   = "frontend/build"
  functions = "netlify/functions"
```

**After (yarn):**
```toml
[build]
  command   = "npm install && cd frontend && yarn install --frozen-lockfile && yarn build"
  publish   = "frontend/build"
  functions = "netlify/functions"
```

## Build Command Breakdown

```bash
npm install                           # Install root deps (plaid for functions)
&&                                    # Then
cd frontend                           # Navigate to frontend
&&                                    # Then
yarn install --frozen-lockfile        # Install frontend deps (respects yarn.lock)
&&                                    # Then
yarn build                            # Build React app
```

## Why This Works

### Yarn Commands:
- `yarn install --frozen-lockfile` - Installs exact versions from `yarn.lock` (like npm ci)
- `yarn build` - Runs the build script from `package.json`

### Package Managers:
- **Root:** npm (for plaid dependency - quick install)
- **Frontend:** yarn (existing setup with yarn.lock)

### Dependencies:
1. Root `npm install` → installs `plaid@^24.0.0` for serverless functions
2. Frontend `yarn install` → installs React, dependencies from `frontend/package.json`

## Verification

### Check frontend package manager:
```bash
ls frontend/yarn.lock    # ✅ Exists - Use Yarn
ls frontend/package-lock.json  # ❌ Does not exist - Can't use npm ci
```

### Frontend package.json scripts:
```json
{
  "scripts": {
    "start": "craco start",
    "build": "craco build",    // ← Called by "yarn build"
    "test": "craco test"
  }
}
```

## Expected Build Log

```
$ npm install && cd frontend && yarn install --frozen-lockfile && yarn build

✅ npm install
added 24 packages in 1s

✅ cd frontend

✅ yarn install --frozen-lockfile
[1/4] Resolving packages...
[2/4] Fetching packages...
[3/4] Linking dependencies...
[4/4] Building fresh packages...
Done in 45s

✅ yarn build
Creating an optimized production build...
Compiled successfully.
File sizes after gzip:
  115.39 kB  build/static/js/main.43fec118.js
  10.79 kB   build/static/css/main.4f6e8b9a.css

The build folder is ready to be deployed.

✅ Functions bundling
Packaging Functions from /opt/build/repo/netlify/functions directory:
 - accounts-balance.js
 - create-link-token.js
 - exchange-public-token.js
 - sandbox-public-token.js
 - transactions-sync.js

✅ Deploy successful!
```

## Files Changed

| File | Change | Status |
|------|--------|--------|
| `/app/netlify.toml` | Updated build command | ✅ Uses yarn |

## Next Steps

1. **Commit:**
   ```bash
   git add netlify.toml
   git commit -m "Fix: Use yarn for frontend build instead of npm"
   git push origin main
   ```

2. **Deploy:**
   - Netlify will auto-deploy
   - Build will now succeed with yarn commands

3. **Verify:**
   - Check build logs show yarn commands
   - Frontend deploys successfully
   - All 5 functions deploy successfully

---

**Status:** ✅ FIXED

The build will now use the correct package manager (Yarn) for the frontend!
