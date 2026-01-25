# Philippine Bayani Exchange (PBX) - Product Requirements Document

## Original Problem Statement
Build the "Philippine Bayani Exchange" (PBX) into a secure, scalable, and production-ready social payment platform for Filipinos at home and abroad.

## Architecture Overview
- **Frontend**: React (Create React App) with Tailwind CSS
- **Backend (Local)**: FastAPI on port 8001
- **Backend (Production)**: Netlify Functions (Node.js)
- **Database**: MongoDB
- **Integrations**: Plaid (bank linking), Circle (USDC minting)

## Completed Work

### January 25, 2026 - Circle USDC Integration
**Implemented Circle integration for Add Money flow:**

1. **Backend Circle Client** (`/app/backend/utils/circle_client.py`):
   - Wallet creation for users
   - USDC minting (1:1 with USD)
   - Balance queries
   - Mock mode for development (no API key needed)

2. **Circle API Routes** (`/app/backend/routes/circle.py`):
   - `POST /api/circle/create-wallet` - Creates Circle wallet for user
   - `POST /api/circle/mint-usdc` - Mints USDC (adds USD to wallet)
   - `GET /api/circle/balance` - Gets wallet balance
   - `GET /api/circle/status` - Checks Circle integration status

3. **Frontend Circle API** (`/app/frontend/src/lib/circleApi.js`):
   - `addMoneyFlow()` - Combined wallet creation + USDC minting
   - `getWalletBalance()` - Fetches USD balance (USDC hidden from user)

4. **Updated Components**:
   - `AddMoney.jsx` - Now uses Circle API for adding money
   - `Home.jsx` - Fetches balance from Circle API

**User Experience**: Users only see USD amounts - USDC is a hidden implementation detail.

### January 25, 2026 - Bug Fix
**Fixed: "body stream already read" Error in Login Flow**

Fixed critical bug blocking authentication across multiple frontend API files.

### Previous Session Work
- Plaid Linking Flow Fix
- Funding Flow Fix
- State Persistence Refactor (In-Memory to MongoDB)
- Authentication Flow Rework
- Demo Data Removal
- Build & Deployment Fixes (Node.js v20)
- ErrorBoundary component

## Key Database Schema
- **users**: `{ user_id, email, display_name, created_at, updated_at }`
- **sessions**: `{ token, user_id, email, verified, created_at, last_seen_at }`
- **banks**: `{ user_id, bank_id, plaid_item_id, institution_id, institution_name, name, mask, accounts, created_at }`
- **wallets**: `{ user_id, usd, php, usdc, circle_wallet: { wallet_id, address, blockchain }, created_at, updated_at }`
- **transactions**: `{ transaction_id, user_id, type, amount_usd, amount_usdc, circle_tx_id, status, created_at }`

## Environment Variables for Circle Integration
```
CIRCLE_API_KEY=your_api_key          # Optional - runs in mock mode if not set
CIRCLE_ENTITY_SECRET=your_secret     # Optional
CIRCLE_WALLET_SET_ID=your_set_id     # Optional
CIRCLE_ENVIRONMENT=sandbox           # sandbox or production
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

## Known Mocked Features
- Circle USDC minting (uses mock client when no API key - ready for real integration)
- Phone verification SMS
