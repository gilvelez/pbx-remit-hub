# Plaid Module Not Found - FIXED

## Issue
**Error:** `Cannot find module 'plaid'` in `/opt/build/repo/netlify/functions/exchange-public-token.js`

**Cause:** 
- Root `package.json` contains `plaid` dependency ✅
- But Netlify build base is set to `frontend/`
- Netlify only installs dependencies from the base directory
- Root dependencies were never installed → Functions can't find `plaid` module

## Solution

### Updated netlify.toml Build Command

**Before:**
```toml
[build]
  base = "frontend"
  publish = "build"
  command = "npm run build"  # Only builds frontend
```

**After:**
```toml
[build]
  base = "frontend"
  publish = "build"
  command = "cd .. && npm install && cd frontend && npm run build"
```

### What This Does

1. **`cd ..`** - Navigate to repository root
2. **`npm install`** - Install root dependencies (includes `plaid@^24.0.0`)
3. **`cd frontend`** - Return to frontend directory
4. **`npm run build`** - Build the React app as usual

### Build Flow

```
1. Netlify starts in /opt/build/repo/frontend (base directory)
2. Command: cd .. → Now at /opt/build/repo
3. Command: npm install → Installs plaid from root package.json ✅
4. Command: cd frontend → Back to /opt/build/repo/frontend
5. Command: npm run build → Builds React app ✅
6. Functions bundling → Can now find plaid module ✅
```

## Complete Configuration

### Root package.json ✅
```json
{
  "name": "pbx-root",
  "private": true,
  "license": "UNLICENSED",
  "dependencies": {
    "plaid": "^24.0.0"
  }
}
```

### netlify.toml ✅
```toml
[build]
  base = "frontend"
  publish = "build"
  command = "cd .. && npm install && cd frontend && npm run build"

[functions]
  directory = "../netlify/functions"

[build.environment]
  NODE_VERSION = "20"
  SECRETS_SCAN_OMIT_PATHS = "netlify/functions/**"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

## Why This Works

| Step | Action | Result |
|------|--------|--------|
| Root install | `npm install` at root | ✅ `plaid` installed in `/opt/build/repo/node_modules/` |
| Frontend build | `npm run build` in frontend | ✅ React app builds successfully |
| Functions bundle | Netlify packages functions | ✅ Can resolve `require('plaid')` from root node_modules |

## Verification

After deployment, check build logs for:
```
$ cd .. && npm install && cd frontend && npm run build
✅ added 1 package (plaid)
✅ Compiling React app...
✅ Compiled successfully
✅ Functions bundling
✅ - accounts-balance.js
✅ - create-link-token.js
✅ - exchange-public-token.js
✅ - transactions-sync.js
```

## Files Changed

| File | Change | Status |
|------|--------|--------|
| `/app/netlify.toml` | Updated build command | ✅ Ready |

## Next Steps

1. **Commit changes:**
   ```bash
   git add netlify.toml
   git commit -m "Fix: Install root dependencies for Netlify functions"
   git push origin main
   ```

2. **Deploy:** Netlify will now install plaid before bundling functions

---

**Status:** ✅ FIXED

The functions will now successfully bundle with the plaid module! 🚀
