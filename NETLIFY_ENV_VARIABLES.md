# Netlify Environment Variables for PBX

## Required for Plaid Integration

# Plaid Environment (sandbox for testing, production for live)
PLAID_ENV=sandbox

# Plaid Client ID (get from Plaid Dashboard)
PLAID_CLIENT_ID=your_plaid_client_id_here

# Plaid Secret (sandbox or production secret)
PLAID_SECRET=your_plaid_secret_here

# Your deployed site URL
APP_BASE_URL=https://philippinebayaniexchange.com

## Optional - For Full Backend Features

# MongoDB Connection String (if using database features)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/pbx?retryWrites=true&w=majority

# Admin Password (for admin panel access)
ADMIN_PASSWORD=your_secure_admin_password

# Circle API Key (if using Circle for payments)
CIRCLE_API_KEY=your_circle_api_key_here

## How to Set These in Netlify

1. Go to your Netlify site dashboard
2. Navigate to: Site settings → Environment variables
3. Click "Add a variable"
4. Add each variable name and value from above
5. Save and redeploy your site

## Getting Plaid Credentials

1. Sign up at https://dashboard.plaid.com/signup
2. Create a new app in the Plaid Dashboard
3. Go to Team Settings → Keys
4. Copy your `client_id` and `sandbox` secret
5. For production, request production access and use production secret

## Testing Locally with Netlify Dev

Create a `.env` file in your project root:

```bash
PLAID_ENV=sandbox
PLAID_CLIENT_ID=your_client_id
PLAID_SECRET=your_secret
APP_BASE_URL=http://localhost:8888
```

Then run:
```bash
netlify dev
```

Your functions will be available at:
http://localhost:8888/.netlify/functions/plaid-link-token
