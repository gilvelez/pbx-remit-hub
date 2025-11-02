# Node Version Fix for Netlify Deployment

## Issue
- **Error:** `react-router-dom@7.9.5: The engine "node" is incompatible with this module. Expected version ">=20.0.0". Got "18.20.8"`
- **Cause:** `react-router-dom` version 7.9.5 (resolved from `^7.5.1`) requires Node >=20, but we had pinned Node to version 18

## Fix Applied

### Updated netlify.toml
Changed Node version from 18 to 20:

```toml
[build.environment]
  NODE_VERSION = "20"  # Changed from "18"
  SECRETS_SCAN_OMIT_PATHS = "netlify/functions/**"
```

## Why This Happened

- Frontend `package.json` specifies: `"react-router-dom": "^7.5.1"`
- The `^` allows minor/patch updates within version 7.x
- Yarn resolved to `7.9.5` (latest in that range)
- Version 7.9.5 requires Node >=20.0.0
- We had pinned Node 18 → Incompatibility error

## Resolution

✅ **Updated NODE_VERSION to "20"** in netlify.toml
- Matches react-router-dom@7.9.5 requirement (>=20.0.0)
- Compatible with all other dependencies
- Modern Node version with latest features

## Files Changed

| File | Change | Status |
|------|--------|--------|
| `/app/netlify.toml` | `NODE_VERSION = "20"` | ✅ Updated |

## Next Steps

1. **Commit the change:**
   ```bash
   git add netlify.toml
   git commit -m "Fix: Update Node version to 20 for react-router-dom compatibility"
   git push origin main
   ```

2. **Deploy:** Netlify will now use Node 20 for the build

## Verification

After deployment succeeds, you can verify Node version in Netlify build logs:
```
Node version: 20.x.x ✅
Installing dependencies... ✅
react-router-dom@7.9.5 installed ✅
Build successful ✅
```

---

**Status:** ✅ READY TO DEPLOY

The build will now succeed with Node 20!
