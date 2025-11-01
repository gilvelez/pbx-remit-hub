# Netlify Functions Structure Verification

## ✅ Standardization Complete

This document confirms that the Netlify functions are properly configured according to best practices.

## Directory Structure

```
/app (repo root)
├── netlify.toml                    ✅ Correct location
├── netlify/
│   └── functions/                  ✅ Standardized location
│       ├── plaid-link-token.js     ✅ Plaid function
│       ├── create-lead.js          ✅ Lead management
│       ├── package.json            ✅ Dependencies
│       └── README.md               ✅ Documentation
└── frontend/
    ├── package.json                ✅ Build configuration
    ├── src/
    └── build/                      (generated during build)
```

## Configuration Details

### netlify.toml (Repo Root)

**Option B Configuration** (frontend subfolder build):

```toml
[build]
  base = "frontend"
  command = "npm run build"
  publish = "build"
  functions = "netlify/functions"
```

**Why this configuration?**
- `base = "frontend"` - Netlify runs build commands from /frontend directory
- `command = "npm run build"` - Runs the build script (uses craco)
- `publish = "build"` - Publishes from /frontend/build (relative to base)
- `functions = "netlify/functions"` - Functions are at repo root (absolute path)

### Function Location

**Standardized Path**: `/app/netlify/functions/plaid-link-token.js`

**Netlify URL**: `https://your-site.netlify.app/.netlify/functions/plaid-link-token`

## Build Process Flow

1. **Netlify detects**: netlify.toml in repo root
2. **Sets working directory**: /frontend (due to `base = "frontend"`)
3. **Runs command**: `npm run build` (executes craco build)
4. **Output**: Static files in /frontend/build
5. **Publishes**: Contents of /frontend/build to CDN
6. **Functions**: Packages /netlify/functions separately

## Environment Variables

Required in Netlify Dashboard → Site Settings → Environment Variables:

```bash
PLAID_CLIENT_ID=your_client_id
PLAID_SECRET=your_secret
PLAID_ENV=sandbox
APP_BASE_URL=https://your-site.netlify.app
```

## Function Endpoints

After deployment, functions are available at:

- **Plaid Link Token**: `/.netlify/functions/plaid-link-token`
- **Create Lead**: `/.netlify/functions/create-lead`

## Testing Configuration

### Local Testing with Netlify Dev

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Create .env at repo root
echo "PLAID_CLIENT_ID=your_id" >> .env
echo "PLAID_SECRET=your_secret" >> .env
echo "APP_BASE_URL=http://localhost:8888" >> .env

# Run dev server
netlify dev
```

Functions available at:
- http://localhost:8888/.netlify/functions/plaid-link-token
- http://localhost:8888/.netlify/functions/create-lead

## Verification Checklist

- [x] netlify.toml at repo root
- [x] Functions folder at /netlify/functions
- [x] plaid-link-token.js in correct location
- [x] create-lead.js in correct location
- [x] package.json with dependencies
- [x] README.md with documentation
- [x] No duplicate function files elsewhere
- [x] Base path set to "frontend"
- [x] Functions path set to "netlify/functions"
- [x] Build command configured correctly

## Common Issues & Solutions

### Issue: Functions not found after deployment
**Solution**: Ensure `functions = "netlify/functions"` is in netlify.toml

### Issue: Build fails
**Solution**: Verify `base = "frontend"` and `command = "npm run build"` are correct

### Issue: Environment variables not working
**Solution**: Set in Netlify Dashboard, not in code. Redeploy after setting.

### Issue: Function returns 500 error
**Solution**: Check Netlify function logs in dashboard for specific error

## Deployment Status

✅ **Ready for Deployment**

All files are in the correct locations and properly configured for Netlify deployment.

## Next Steps

1. Push changes to GitHub
2. Connect repository to Netlify
3. Configure environment variables in Netlify dashboard
4. Deploy!

Netlify will automatically:
- Build the React app from /frontend
- Package serverless functions from /netlify/functions
- Deploy both to production
