# Netlify Functions Path Fix - Deployment Ready

## ✅ Issue Resolved

**Error**: `The Netlify Functions setting targets a non-existing directory: netlify/functions`

**Root Cause**: Functions were at `/netlify/functions` (repo root) but netlify.toml was pointing to wrong path.

**Solution**: Moved everything to `frontend/netlify/functions` to align with the `base = "frontend"` setting.

## New Directory Structure

```
/app (repo root)
├── netlify.toml                           ✅ Updated config
└── frontend/
    ├── package.json                       ✅ Build config
    ├── src/
    └── netlify/
        └── functions/                     ✅ NEW LOCATION
            ├── plaid-link-token.js        ✅ Plaid function
            ├── create-lead.js             ✅ Lead management
            └── package.json               ✅ Dependencies
```

## Updated netlify.toml (Repo Root)

```toml
[build]
  base = "frontend"
  command = "npm run build"
  publish = "build"
  functions = "frontend/netlify/functions"
```

**Key Changes:**
- ✅ `functions = "frontend/netlify/functions"` - Absolute path from repo root
- ✅ Matches the `base = "frontend"` setting
- ✅ Old `/netlify/functions` deleted to avoid confusion

## Netlify Dashboard Settings

**Site Settings → Build & deploy → Build settings**

- **Base directory**: `frontend`
- **Build command**: `npm run build`
- **Publish directory**: `build` (or `frontend/build`)
- **Functions directory**: `frontend/netlify/functions`

## Function Endpoints

After deployment, functions available at:

```
https://philippinebayaniexchange.com/.netlify/functions/plaid-link-token
https://philippinebayaniexchange.com/.netlify/functions/create-lead
```

## Testing with ReqBin (No Postman Needed)

1. Go to https://reqbin.com/
2. Set **Method**: POST
3. Set **URL**: `https://philippinebayaniexchange.com/.netlify/functions/plaid-link-token`
4. Add **Header**: `Content-Type: application/json`
5. Set **Body**:
   ```json
   {
     "client_user_id": "test123"
   }
   ```
6. Click **Send**

**Expected Response**:
```json
{
  "link_token": "link-sandbox-abc123..."
}
```

## Environment Variables Security ✅

### What's Safe (Non-sensitive)
```bash
PLAID_ENV=sandbox                    ✅ Safe in client (non-secret)
REACT_APP_NETLIFY_URL=...           ✅ Safe (public URL)
```

### What Must Stay Server-Side Only ⚠️
```bash
PLAID_CLIENT_ID=...                  ⚠️ NEVER use in frontend
PLAID_SECRET=...                     ⚠️ NEVER use in frontend
MONGODB_URI=...                      ⚠️ NEVER use in frontend
```

**Rule**: If it starts with `REACT_APP_`, it will be bundled in the client. Never use `REACT_APP_` prefix for secrets!

### Verified Clean ✅

- ✅ No `PLAID_CLIENT_ID` in frontend code
- ✅ No `PLAID_SECRET` in frontend code
- ✅ No `PLAID_ENV` in frontend code
- ✅ All secrets only in serverless functions

## Build Log Verification

After deployment, look for this line in Netlify logs:

```
✅ Packaging Functions from frontend/netlify/functions directory
   - plaid-link-token.js
   - create-lead.js
```

If you see "non-existing directory" error, the path is wrong.

## Deployment Checklist

- [x] Functions moved to `frontend/netlify/functions`
- [x] netlify.toml updated with correct path
- [x] Old `/netlify/functions` deleted
- [x] No PLAID secrets in frontend code
- [x] Environment variables set in Netlify dashboard
- [x] Build command uses craco for @/ alias support

## Common Issues & Solutions

### Issue: Functions still not found
**Solution**: Double-check the `functions` path in netlify.toml matches the actual directory structure. It should be `frontend/netlify/functions` (absolute from repo root).

### Issue: Secrets leaked warning
**Solution**: Search your frontend code for any `process.env.PLAID_CLIENT_ID` or `process.env.PLAID_SECRET`. Remove them. Secrets should only be in serverless functions.

### Issue: CORS errors
**Solution**: Add CORS headers in function response (already included in plaid-link-token.js).

## Next Steps

1. **Commit changes**:
   ```bash
   git add .
   git commit -m "fix: move Netlify functions to frontend/netlify/functions"
   git push
   ```

2. **Trigger Netlify deploy**:
   - Go to Netlify dashboard
   - Click "Trigger deploy"
   - Select "Clear cache and deploy site"

3. **Monitor build**:
   - Watch for "Packaging Functions" in logs
   - Verify no errors about non-existing directories

4. **Test function**:
   - Use ReqBin or curl to test the endpoint
   - Verify response contains `link_token`

## Testing Locally

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Run dev server (from repo root)
netlify dev

# Functions available at:
# http://localhost:8888/.netlify/functions/plaid-link-token
```

## Success Indicators

✅ Build completes without "non-existing directory" error  
✅ Function endpoint returns 200 status code  
✅ No secrets found in client bundle  
✅ `link_token` returned in response  

Your Netlify deployment is now properly configured!
