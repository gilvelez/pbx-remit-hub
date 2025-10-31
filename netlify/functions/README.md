# PBX Netlify Functions

This directory contains serverless functions for the Philippine Bayani Exchange landing page.

## Available Functions

### 1. plaid-link-token.js
**Endpoint**: `/.netlify/functions/plaid-link-token`  
**Method**: POST  
**Purpose**: Generates a Plaid Link token for bank account connection

**Request Body**:
```json
{
  "client_user_id": "user-123"  // Optional, defaults to "pbx-demo-user"
}
```

**Response**:
```json
{
  "link_token": "link-sandbox-abc123..."
}
```

**Environment Variables Required**:
- `PLAID_CLIENT_ID`
- `PLAID_SECRET`
- `PLAID_ENV` (set to "sandbox")
- `APP_BASE_URL`

**Example Usage**:
```javascript
import { getPlaidLinkToken } from '@/lib/netlify-api';

const { link_token } = await getPlaidLinkToken('user-123');
```

### 2. create-lead.js
**Endpoint**: `/.netlify/functions/create-lead`  
**Method**: POST  
**Purpose**: Saves email signups to MongoDB

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

**Response**:
```json
{
  "message": "Lead created successfully",
  "id": "..."
}
```

**Environment Variables Required**:
- `MONGODB_URI`

## Setup

### Install Dependencies

```bash
cd netlify/functions
npm install
```

### Dependencies Needed

```json
{
  "dependencies": {
    "mongodb": "^6.0.0"
  }
}
```

Note: Plaid function uses native `fetch` (available in Node 18+)

## Testing Locally

### 1. Install Netlify CLI

```bash
npm install -g netlify-cli
```

### 2. Create .env file in project root

```bash
PLAID_CLIENT_ID=your_client_id
PLAID_SECRET=your_secret
PLAID_ENV=sandbox
APP_BASE_URL=http://localhost:8888
MONGODB_URI=mongodb://localhost:27017/pbx
```

### 3. Run Netlify Dev

```bash
netlify dev
```

Your functions will be available at:
- http://localhost:8888/.netlify/functions/plaid-link-token
- http://localhost:8888/.netlify/functions/create-lead

### 4. Test with curl

```bash
# Test Plaid Link Token
curl -X POST http://localhost:8888/.netlify/functions/plaid-link-token \
  -H "Content-Type: application/json" \
  -d '{"client_user_id": "test-user"}'

# Test Create Lead
curl -X POST http://localhost:8888/.netlify/functions/create-lead \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

## Deployment

### Set Environment Variables in Netlify

1. Go to Site settings → Environment variables
2. Add all required variables listed above
3. Redeploy your site

### Production URLs

Your functions will be available at:
```
https://your-site.netlify.app/.netlify/functions/plaid-link-token
https://your-site.netlify.app/.netlify/functions/create-lead
```

## Security Notes

- All secrets should be stored as environment variables
- Never commit `.env` files to git
- Use Plaid sandbox for testing
- MongoDB connection strings should use authentication
- Functions automatically include CORS headers

## Adding New Functions

1. Create a new file in `netlify/functions/`
2. Export a `handler` function:
   ```javascript
   exports.handler = async (event) => {
     return {
       statusCode: 200,
       body: JSON.stringify({ message: 'Hello' })
     };
   };
   ```
3. Deploy - Netlify automatically detects new functions
4. Access at `/.netlify/functions/your-file-name`

## Troubleshooting

### Function not found
- Check file is in `netlify/functions/` directory
- Verify netlify.toml has correct base path
- Redeploy after adding new functions

### Environment variables not working
- Double-check variable names in Netlify dashboard
- Redeploy after setting new variables
- Check logs for error messages

### MongoDB connection issues
- Verify MongoDB Atlas IP whitelist includes 0.0.0.0/0 for Netlify
- Check connection string format
- Ensure database user has correct permissions

## Resources

- [Netlify Functions Docs](https://docs.netlify.com/functions/overview/)
- [Plaid API Reference](https://plaid.com/docs/api/)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
