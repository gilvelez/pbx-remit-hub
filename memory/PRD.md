# Philippine Bayani Exchange (PBX) - Product Requirements Document

## Original Problem Statement
Build the "Philippine Bayani Exchange" (PBX) into a secure, scalable, and production-ready social payment platform for Filipinos at home and abroad.

## Architecture Overview
- **Frontend**: React (Create React App) with Tailwind CSS
- **Backend (Local)**: FastAPI on port 8001
- **Backend (Production)**: Netlify Functions (Node.js)
- **Database**: MongoDB
- **Authentication**: JWT tokens (7-day expiry)
- **Integrations**: Plaid (bank linking), Circle (USDC minting)

## Completed Work

### January 25, 2026 - JWT Authentication & Demo Tools
**Implemented complete JWT authentication system:**

1. **Backend Auth Routes** (`/app/backend/routes/auth.py`):
   - `POST /api/auth/register` - Creates user with password, returns JWT
   - `POST /api/auth/login` - Authenticates with email/password, returns JWT
   - `GET /api/auth/me` - Returns user info (requires JWT)
   - Password hashing with PBKDF2
   - 7-day JWT token expiry

2. **Frontend SessionContext** (`/app/frontend/src/contexts/SessionContext.jsx`):
   - `login(email, password)` - Authenticates and stores JWT
   - `register(email, password, displayName)` - Creates account
   - `logout()` - Clears JWT token
   - `authFetch()` - Helper that adds Authorization header to all requests

3. **New Pages**:
   - `Register.jsx` - New user registration with email/password
   - Updated `Login.jsx` - Now requires password

4. **Demo Tools** (`/app/frontend/src/components/DemoTools.jsx`):
   - Visible when `REACT_APP_DEMO_MODE=true`
   - Buttons: "+ $100 USD", "+ ₱5,000 PHP", "+ 100 USDC"
   - Instantly updates wallet balances via `/api/admin/mint`

5. **Admin Mint Endpoint** (`/app/backend/routes/admin.py`):
   - `POST /api/admin/mint` - Mints test balances
   - Protected with `x-admin-mint-key` header

### January 25, 2026 - Circle USDC Integration
**Implemented Circle integration for Add Money flow** (see previous section)

### January 25, 2026 - Bug Fix
**Fixed: "body stream already read" Error in Login Flow**

## Key Database Schema
- **users**: `{ user_id, email, display_name, password_hash, created_at, updated_at }`
- **sessions**: `{ token, user_id, email, verified, created_at, last_seen_at }` (legacy)
- **banks**: `{ user_id, bank_id, plaid_item_id, institution_id, institution_name, name, mask, accounts, created_at }`
- **wallets**: `{ user_id, usd, php, usdc, circle_wallet: { wallet_id, address, blockchain }, created_at, updated_at }`
- **transactions**: `{ transaction_id, user_id, type, amount_usd, amount_usdc, circle_tx_id, status, created_at }`

## Environment Variables

### Backend (.env)
```
JWT_SECRET=your-secret-key           # JWT signing key (change in production!)
ADMIN_MINT_KEY=demo-mint-key-12345   # Demo mint authorization key
CIRCLE_API_KEY=your_api_key          # Optional - runs in mock mode if not set
CIRCLE_ENTITY_SECRET=your_secret     # Optional
CIRCLE_WALLET_SET_ID=your_set_id     # Optional
```

### Frontend (.env)
```
REACT_APP_DEMO_MODE=true              # Show Demo Tools panel
REACT_APP_ADMIN_MINT_KEY=demo-mint-key-12345  # Demo mint key
```

## Pending Tasks

### P1 - Important
1. Implement Internal FX Conversion UI
   - Create "Convert" button/modal in wallet view
   - Connect to `/api/fx/convert` endpoint

### P2 - Minor
2. Fix Mobile Menu Link (z-index issue on "Create account")

## Future Tasks
- Contact discovery (phone contacts sync)
- In-chat money requests
- Business profile completion and KYB flows
- Venmo-style public social feed with reactions/comments
- Stripe Subscription Billing
- Real Circle API integration (production keys)

## 3rd Party Integrations
- **Plaid**: Bank account linking (sandbox mode)
- **MongoDB**: Primary database
- **Circle**: USDC wallet creation and minting (MOCK mode - ready for production keys)
- **OpenExchangeRates**: FX rates (requires OPENEXCHANGERATES_API_KEY)
- **Resend**: Email (requires RESEND_API_KEY)
- **Twilio**: SMS (stubbed)

## Done Checklist (from user requirements)
✅ Register creates user + wallet (0 balances)
✅ Login requires password
✅ Wallet page loads balances only when logged in
✅ Demo Mint updates balances instantly
✅ Plaid unchanged
✅ Circle unchanged (ready for later)

