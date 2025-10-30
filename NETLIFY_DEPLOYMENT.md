# Netlify Deployment Guide for PBX

## Overview
This guide explains how to deploy the PBX landing page to Netlify with serverless functions.

## Architecture
- **Frontend**: Static React app (built with CRA)
- **Backend**: Netlify serverless functions (replaces FastAPI)
- **Database**: MongoDB Atlas (or other cloud MongoDB)

## Files Created

### 1. `netlify.toml` (root)
Configures Netlify build settings:
```toml
[build]
  base = "frontend"
  command = "npm ci && npm run build"
  publish = "frontend/build"
```

### 2. `src/lib/netlify-api.js`
Unified API bridge for calling Netlify functions from React.

## Setup Steps

### Step 1: Create Netlify Functions Directory
```bash
mkdir -p netlify/functions
```

### Step 2: Create Serverless Functions

Create these files in `netlify/functions/`:

#### a. `plaid-create-link-token.js`
```javascript
const { Configuration, PlaidApi, PlaidEnvironments } = require('plaid');

const client = new PlaidApi(new Configuration({
  basePath: PlaidEnvironments.sandbox,
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    },
  },
}));

exports.handler = async (event) => {
  try {
    const { userId } = JSON.parse(event.body);
    const response = await client.linkTokenCreate({
      user: { client_user_id: userId },
      client_name: 'PBX',
      products: ['auth'],
      country_codes: ['US'],
      language: 'en',
    });
    return {
      statusCode: 200,
      body: JSON.stringify({ link_token: response.data.link_token }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
```

#### b. `create-lead.js`
```javascript
const { MongoClient } = require('mongodb');

let cachedDb = null;

async function connectToDatabase(uri) {
  if (cachedDb) return cachedDb;
  const client = await MongoClient.connect(uri);
  cachedDb = client.db('pbx');
  return cachedDb;
}

exports.handler = async (event) => {
  try {
    const { email } = JSON.parse(event.body);
    const db = await connectToDatabase(process.env.MONGODB_URI);
    
    await db.collection('leads').insertOne({
      email,
      created_at: new Date(),
    });
    
    return {
      statusCode: 201,
      body: JSON.stringify({ message: 'Lead created' }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
```

### Step 3: Install Function Dependencies
```bash
cd netlify/functions
npm init -y
npm install plaid mongodb
```

### Step 4: Configure Environment Variables in Netlify

In Netlify dashboard → Site settings → Environment variables, add:
- `PLAID_CLIENT_ID`
- `PLAID_SECRET`
- `MONGODB_URI`
- `CIRCLE_API_KEY` (if using Circle)
- `ADMIN_PASSWORD`

### Step 5: Update Frontend Environment Variable

Create `.env.production` in `frontend/`:
```
REACT_APP_NETLIFY_URL=https://your-site.netlify.app
```

### Step 6: Deploy

#### Option A: Connect GitHub
1. Push code to GitHub
2. Connect repo in Netlify dashboard
3. Netlify auto-deploys on push

#### Option B: Manual Deploy
```bash
npm install -g netlify-cli
netlify login
netlify deploy --prod
```

## Testing Locally with Netlify Dev

```bash
npm install -g netlify-cli
netlify dev
```

This runs both frontend and functions locally.

## Current State

✅ **Already configured:**
- netlify.toml
- package-lock.json for consistent builds
- Build scripts (react-scripts build)
- API bridge (src/lib/netlify-api.js)

⚠️ **To be created:**
- Netlify functions (in netlify/functions/)
- Function dependencies (package.json in netlify/functions/)
- Environment variables in Netlify dashboard

## Notes

- Current Landing.jsx doesn't use backend APIs (pure static)
- Admin page would need serverless functions for lead management
- Demo functionality is client-side only (no real API calls)

## Production Checklist

- [ ] Create netlify/functions directory
- [ ] Implement serverless functions
- [ ] Configure environment variables
- [ ] Test with `netlify dev`
- [ ] Deploy to Netlify
- [ ] Update DNS (if custom domain)
- [ ] Test production deployment
