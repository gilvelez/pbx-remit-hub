# Netlify Configuration Guide - netlify.toml

## Complete Configuration Breakdown

### File: `/app/netlify.toml` (repo root)

```toml
# Netlify build + functions config for PBX

[build]
  # Your React app lives under /frontend
  base = "frontend"
  command = "npm run build"
  publish = "build"

  # IMPORTANT: With base=frontend, this path is relative to /frontend
  # so Netlify packages functions from /frontend/netlify/functions
  functions = "netlify/functions"

[build.environment]
  # Secrets scanner: omit serverless source (reads process.env at runtime)
  SECRETS_SCAN_OMIT_PATHS = "netlify/functions/**"

[functions]
  # Use esbuild for fast, Node 18+ compatible bundling
  node_bundler = "esbuild"
```

## Section-by-Section Explanation

### [build] Section

#### base = "frontend"
- **What it does**: Sets the working directory for build commands
- **Effect**: All relative paths are now relative to `/frontend`
- **Example**: `npm run build` runs in `/frontend` directory

#### command = "npm run build"
- **What it does**: The build command Netlify executes
- **Runs**: `/frontend/package.json` → `"build": "craco build"`
- **Output**: Creates `/frontend/build` directory with static files

#### publish = "build"
- **What it does**: Directory to deploy to CDN
- **Actual path**: `/frontend/build` (relative to base)
- **Contains**: Compiled React app (HTML, CSS, JS)

#### functions = "netlify/functions"
- **What it does**: Directory containing serverless functions
- **Actual path**: `/frontend/netlify/functions` (relative to base)
- **Contains**: 
  - `plaid-link-token.js`
  - `create-lead.js`
  - `package.json`

### [build.environment] Section

#### SECRETS_SCAN_OMIT_PATHS
- **Purpose**: Tell Netlify's secrets scanner to skip these paths
- **Why needed**: Prevents false positives from function code
- **Value**: `"netlify/functions/**"`
- **Effect**: Functions can use `process.env.PLAID_SECRET` without triggering alerts

**How Netlify Secret Scanner Works**:
1. Scans all files being deployed
2. Looks for patterns like API keys, passwords, tokens
3. Warns if it finds hardcoded secrets in client bundle

**What We're Avoiding**:
- ❌ False positive: Scanning function source code
- ✅ Functions read secrets at runtime from env vars
- ✅ No secrets are actually hardcoded

**Example of Safe Code** (in functions):
```javascript
// This is SAFE - reads at runtime, not bundled
const secret = process.env.PLAID_SECRET;
```

#### REACT_APP_PBX_MODE (Optional)
- **Comment**: Shows how to set non-sensitive frontend flags
- **Usage**: Set in Netlify UI, not in netlify.toml
- **Example**: `REACT_APP_PBX_MODE = "sandbox"`
- **Access in React**: `process.env.REACT_APP_PBX_MODE`

### [functions] Section

#### node_bundler = "esbuild"
- **What it does**: Use esbuild instead of default bundler
- **Benefits**:
  - ⚡ Faster builds
  - 🎯 Better Node 18+ support
  - 📦 Smaller function bundles
  - 🚀 Native ESM support

**Default vs esbuild**:
```
Default (zip-it-and-ship-it):
- Older bundler
- Slower
- Larger bundles

esbuild:
- Modern bundler
- 10-100x faster
- Tree-shaking
- Native Node 18 features
```

## Directory Structure After Config

```
Deployment Process:

1. Netlify reads /app/netlify.toml
2. Sets base to /frontend
3. Runs: cd frontend && npm run build
4. Output: /frontend/build (static files)
5. Packages: /frontend/netlify/functions (serverless)
6. Deploys both to Netlify

Result:
├── CDN (static files from /frontend/build)
│   ├── index.html
│   ├── static/
│   │   ├── js/
│   │   └── css/
│   └── assets/
│
└── Serverless Functions
    ├── /.netlify/functions/plaid-link-token
    └── /.netlify/functions/create-lead
```

## Common Issues & Solutions

### Issue 1: "non-existing directory" error

**Error**: 
```
The Netlify Functions setting targets a non-existing directory: netlify/functions
```

**Cause**: Path is wrong or functions not in expected location

**Solution**: 
- Verify `functions = "netlify/functions"` (relative to base)
- Check actual directory: `/frontend/netlify/functions` exists
- Ensure functions are not at repo root

### Issue 2: Secrets detected in bundle

**Error**:
```
⚠️  Secret scan: PLAID_SECRET value found in bundle
```

**Cause**: Secrets are in frontend code or client bundle

**Solution**:
1. Search frontend/src for PLAID_ references
2. Remove any `process.env.PLAID_SECRET` from React
3. Add path to `SECRETS_SCAN_OMIT_PATHS`

### Issue 3: Functions not working

**Error**: 404 when calling `/.netlify/functions/plaid-link-token`

**Causes & Solutions**:
- **Function file missing**: Check `/frontend/netlify/functions/plaid-link-token.js` exists
- **Export error**: Ensure `exports.handler = async (event) => {...}`
- **Environment vars not set**: Add in Netlify dashboard
- **Build failed**: Check Netlify logs for packaging errors

## Environment Variables Setup

### In Netlify Dashboard

**Location**: Site settings → Environment variables

**Add these**:
```bash
# Sensitive - Never commit
PLAID_CLIENT_ID=your_client_id
PLAID_SECRET=your_secret

# Configuration
PLAID_ENV=sandbox
APP_BASE_URL=https://philippinebayaniexchange.com

# Optional MongoDB
MONGODB_URI=mongodb+srv://...
```

### In netlify.toml

**Don't put secrets here!** Only non-sensitive config:

```toml
[build.environment]
  # ❌ DON'T: PLAID_SECRET = "sk-sandbox-..."  
  # ✅ DO: Set in Netlify Dashboard
  
  # ✅ OK for non-sensitive flags
  NODE_VERSION = "18"
  REACT_APP_PBX_MODE = "demo"
```

## Testing Locally

### Install Netlify CLI

```bash
npm install -g netlify-cli
```

### Create .env at repo root

```bash
# /app/.env (gitignored)
PLAID_CLIENT_ID=your_client_id
PLAID_SECRET=your_secret
PLAID_ENV=sandbox
APP_BASE_URL=http://localhost:8888
```

### Run Netlify Dev

```bash
cd /app
netlify dev
```

**What happens**:
1. Reads netlify.toml configuration
2. Loads .env file
3. Starts dev server on port 8888
4. Functions available at `http://localhost:8888/.netlify/functions/...`
5. Frontend available at `http://localhost:8888`

### Test Function Locally

```bash
curl -X POST http://localhost:8888/.netlify/functions/plaid-link-token \
  -H "Content-Type: application/json" \
  -d '{"client_user_id": "test123"}'
```

## Deployment Verification

### What to Check in Netlify Logs

```
✅ Starting Netlify Build
✅ Base directory: frontend
✅ Installing dependencies
✅ Running: npm run build
✅ Build succeeded
✅ Packaging Functions from netlify/functions
   - plaid-link-token.js
   - create-lead.js
✅ Functions bundled with esbuild
✅ Deploy succeeded
ℹ️  Secret scan: No sensitive values detected
```

### Success Indicators

- ✅ Build completes without errors
- ✅ Functions packaged successfully
- ✅ No secrets detected in client bundle
- ✅ Function endpoints respond with 200
- ✅ Environment variables loaded correctly

## Advanced Configuration

### Multiple Environments

```toml
# Production
[context.production.environment]
  REACT_APP_PBX_MODE = "production"

# Staging/Preview
[context.branch-deploy.environment]
  REACT_APP_PBX_MODE = "staging"

# Development
[context.dev.environment]
  REACT_APP_PBX_MODE = "development"
```

### Custom Headers

```toml
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
```

### Redirects

```toml
[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200
```

## Summary

✅ **Configuration Complete**
- Base directory set to frontend
- Build command configured (craco build)
- Functions path correct (relative to base)
- Secrets scanner optimized
- esbuild bundler enabled
- Well-documented with comments

✅ **Ready for Deployment**
- Commit netlify.toml
- Push to GitHub
- Connect to Netlify
- Add environment variables
- Deploy!

Your PBX application is now optimally configured for Netlify!
