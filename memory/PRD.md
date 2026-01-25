# Philippine Bayani Exchange (PBX) - Product Requirements Document

## Original Problem Statement
Build the "Philippine Bayani Exchange" (PBX) into a secure, scalable, and production-ready social payment platform for Filipinos at home and abroad.

## Architecture Overview
- **Frontend**: React (Create React App) with Tailwind CSS
- **Backend (Local)**: FastAPI on port 8001
- **Backend (Production)**: Netlify Functions (Node.js)
- **Database**: MongoDB
- **Integrations**: Plaid (bank linking), Circle (USDC minting - stubbed)

## Completed Work

### January 25, 2026 - Bug Fix
**Fixed: "body stream already read" Error in Login Flow**

Fixed critical bug blocking authentication across multiple frontend API files:

1. **API Helper Files** - Fixed double `.json()` reads pattern:
   - `internalApi.js` (4 functions)
   - `profilesApi.js` (5 functions)
   - `businessesApi.js` (2 functions)
   - `socialApi.js` (5 functions)

2. **SessionContext.jsx** - Updated API paths and added smart API_BASE detection

3. **Backend Auth Endpoints** - Added `/api/auth/login` and `/api/auth/me` endpoints to FastAPI

4. **Frontend Proxy** - Added proxy configuration for local development

### Previous Session Work
- Plaid Linking Flow Fix
- Funding Flow Fix
- State Persistence Refactor (In-Memory to MongoDB)
- Authentication Flow Rework
- Demo Data Removal
- Build & Deployment Fixes (Node.js v20)
- Circle Integration Foundation (stubbed)
- ErrorBoundary component

## Key Database Schema
- **users**: `{ user_id, email, display_name, created_at, updated_at }`
- **sessions**: `{ token, user_id, email, verified, created_at, last_seen_at }`
- **banks**: `{ user_id, bank_id, plaid_item_id, institution_id, institution_name, name, mask, accounts, created_at }`
- **wallets**: `{ user_id, usd, php, usdc, created_at, updated_at }`

## Pending Tasks

### P0 - Critical
1. ~~Fix "body stream already read" error~~ ✅ DONE
2. Complete and Test Circle Integration
   - Update frontend "Add Money" to call `/api/add-money`
   - Implement dual balance UI (USD/USDC)
   - End-to-end test

### P1 - Important
3. Implement Internal FX Conversion UI
   - Create "Convert" button/modal in wallet view
   - Connect to `/api/fx/convert` endpoint

### P2 - Minor
4. Fix Mobile Menu Link (z-index issue on "Create account")

## Future Tasks
- Contact discovery (phone contacts sync)
- In-chat money requests
- Business profile completion and KYB flows
- Venmo-style public social feed with reactions/comments
- Stripe Subscription Billing

## 3rd Party Integrations
- **Plaid**: Bank account linking (sandbox mode)
- **MongoDB**: Primary database
- **Circle**: USDC minting (stubbed - requires CIRCLE_API_KEY)
- **OpenExchangeRates**: FX rates (requires OPENEXCHANGERATES_API_KEY)
- **Resend**: Email (requires RESEND_API_KEY)
- **Twilio**: SMS (stubbed)

## Known Mocked Features
- Circle USDC minting (`add-money-unified.js`)
- Core payment flows (`banks-add-money.js`)
- Phone verification SMS
