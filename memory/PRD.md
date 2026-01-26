# Philippine Bayani Exchange (PBX) - Product Requirements Document

## Original Problem Statement
Build the "Philippine Bayani Exchange" (PBX) into a secure, scalable, and production-ready social payment platform for Filipinos at home and abroad.

## Architecture Overview
- **Frontend**: React (Create React App) with Tailwind CSS
- **Backend (Local)**: FastAPI on port 8001
- **Backend (Production)**: Netlify Functions (Node.js)
- **Database**: MongoDB
- **Authentication**: JWT tokens (7-day expiry) + Dual-token support (Bearer + X-Session-Token)
- **Integrations**: Plaid (bank linking), Circle (USDC minting), OpenExchangeRates (FX rates)

## Completed Work

### January 26, 2026 - P1 Verification Complete ✅

**Fixed Home.jsx and completed full verification:**

1. **Wallet Routes** (`/app/backend/routes/wallet.py`) - NEW:
   - `GET /api/wallet/balance` - Fetches USD, PHP, USDC balances with JWT auth
   - `GET /api/fx/quote` - Gets FX quote with rate and converted amount
   - `POST /api/fx/convert` - Converts USD→PHP and updates wallet atomically
   - Supports both JWT and legacy session token auth
   - Handles both `userId` and `user_id` field formats for Netlify/FastAPI compatibility

2. **Demo Wallet Seeding** - Updated auth to seed new users with:
   - $500 USD (demo amount)
   - ₱28,060 PHP (demo amount)
   - 0 USDC

3. **FX Conversion UI** (`/app/frontend/src/pages/app/Home.jsx`):
   - "Convert →" button in wallet card
   - Modal with USD amount input
   - "Get Quote" displays exchange rate (56.1 fallback) and converted PHP
   - "Confirm Conversion" executes conversion and updates balances
   - All elements have data-testid attributes for testing

4. **Test Results** (iteration_21.json):
   - Backend: 19/19 tests passed (100%)
   - Frontend: All UI flows verified (100%)

### January 25, 2026 - JWT Authentication & Demo Tools

1. **Backend Auth Routes** (`/app/backend/routes/auth.py`):
   - `POST /api/auth/register` - Creates user with password, returns JWT
   - `POST /api/auth/login` - Authenticates with email/password, returns JWT
   - `GET /api/auth/me` - Returns user info (requires JWT)

2. **Frontend SessionContext** (`/app/frontend/src/contexts/SessionContext.jsx`):
   - Dual-token management: JWT in `Authorization: Bearer` + legacy `X-Session-Token`
   - `authFetch()` helper adds both headers automatically

3. **Demo Tools** (`/app/frontend/src/components/DemoTools.jsx`):
   - "+$100 USD", "+₱5,000 PHP" buttons for testing
   - Visible in demo mode

### Previous Work
- Circle USDC Integration (MOCK mode - ready for production keys)
- Plaid Bank Linking (Sandbox mode)
- Body stream fix for API calls

## Key Database Schema
- **users**: `{ user_id, email, display_name, password_hash, created_at, updated_at }`
- **wallets**: `{ user_id/userId, usd, php, usdc, demoSeeded, circleWallet, created_at, updated_at }`
- **transactions**: `{ userId, type, from, to, amount_from, amount_to, rate, createdAt }`
- **sessions**: `{ token, userId, email, createdAt, lastSeenAt }` (Netlify functions)

## Key API Endpoints
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/auth/register` | POST | None | Register new user with demo wallet |
| `/api/auth/login` | POST | None | Login and get JWT token |
| `/api/auth/me` | GET | JWT | Get current user info |
| `/api/wallet/balance` | GET | JWT | Get USD, PHP, USDC balances |
| `/api/fx/quote` | GET | JWT | Get FX quote (amount, rate, converted) |
| `/api/fx/convert` | POST | JWT | Convert USD→PHP and update wallet |

## Environment Variables

### Backend (.env)
```
JWT_SECRET=your-secret-key           # JWT signing key (change in production!)
ADMIN_MINT_KEY=demo-mint-key-12345   # Demo mint authorization key
OPENEXCHANGERATES_API_KEY=xxx        # Optional - uses fallback rate 56.10 if not set
```

### Frontend (.env)
```
REACT_APP_BACKEND_URL=https://pbx-social.preview.emergentagent.com
REACT_APP_DEMO_MODE=true              # Show Demo Tools panel
```

## Done Checklist ✅
- [x] Register creates user + wallet ($500 USD, ₱28,060 PHP demo amounts)
- [x] Login requires password
- [x] Wallet page loads balances only when logged in
- [x] Demo Mint updates balances instantly
- [x] FX Quote retrieval (GET /api/fx/quote)
- [x] FX Conversion USD→PHP (POST /api/fx/convert)
- [x] FX Conversion UI modal in Home page
- [x] Balance updates after conversion
- [x] All tests passing (19/19 backend, all UI flows verified)

## Pending Tasks

### P1 - Auto-FX Toggle
Add toggle in "Add Money" flow to auto-convert to PHP after deposit

### P2 - FX Spread Controls
Server-side controls for adding spread to FX quotes via env vars

### P2 - Fix Mobile Menu
Fix z-index issue on "Create account" link in mobile menu (Landing.jsx)

## Future Tasks
- Locked FX quotes (session-based)
- PBX-to-PBX internal transfers
- Contact discovery (phone contacts sync)
- In-chat money requests
- Business profile completion and KYB flows
- Venmo-style public social feed

## 3rd Party Integrations
| Integration | Status | Notes |
|-------------|--------|-------|
| MongoDB | ✅ Active | Primary database |
| Plaid | ✅ Sandbox | Bank account linking |
| Circle | ⏸️ MOCK | USDC minting (hidden UI) |
| OpenExchangeRates | ⏸️ Fallback | FX rates (uses 56.10 if no key) |
| Resend | ⏸️ Ready | Email (requires key) |
| Twilio | ⏸️ Stubbed | SMS |

## Test Reports
- `/app/test_reports/iteration_21.json` - P1 verification complete
