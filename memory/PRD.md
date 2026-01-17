# PBX (Philippine Bayani Exchange) - Product Requirements Document

## Original Problem Statement
Build a **social payments platform** (PBX) for cross-border money transfers between the U.S. and the Philippines. The application feels like Venmo/Cash App/Zelle with:
- **Senders** (Employers/Businesses): Send to friends, manage payroll, batch payments
- **Recipients** (End Users): Receive USD, convert to PHP, pay bills, transfer funds

**Core Feature: PBX Closed-Loop Transfers** - Send to PBX friends instantly and free. This is the default and primary UX.

## 🔒 HARD RULES (Locked In)

### Account Types - Phase 1 (P0 - COMPLETE ✅ Jan 2026)
- **Personal Account (People)**: @username, display name, avatar, friends system, social chat
- **Business Account**: Business name, @businesshandle, square logo, category, "Business" badge
- **One Login, Multi-Profile**: User → Profiles (personal + business) like Instagram account switching
- **Profile Switcher**: Top-right dropdown to switch between personal/business profiles
- **Friendships are Personal-only**: Businesses do NOT have friends, only transactional chats

### 6-Tab Navigation (P0 - COMPLETE ✅ Jan 2026)
- **Home**: Balance summary (USD + PHP), quick actions (Send PBX, Send External), recent activity, recent chats
- **Send**: External transfers (GCash, Maya, Bank, Cash Pickup)
- **People**: Personal friends only - search, requests, friends list
- **Businesses**: Business discovery, search, categories, recently paid businesses
- **Activity**: Transaction history
- **Settings**: Profile management, notification preferences, add business profile

### Social Network Features (P0 - COMPLETE)
- **People Tab**: Friends list, search by @username/name/phone/email
- **Friend Requests**: Add/Accept/Decline/Block/Unfriend like Instagram
- **Chat Threads**: 1:1 iMessage-style chat for each friend
- **In-Chat Payments**: Send PBX inside chat, appears as payment bubbles
- **No "Add Recipient"**: Users add friends, not recipients

### Business Features (P0 - COMPLETE ✅ Jan 2026)
- **Businesses Tab**: Separate from People, for business discovery
- **Business Search**: By business name or @businesshandle
- **Business Categories**: Retail, Food & Dining, Services, Health, Entertainment, etc.
- **Business Chat**: Person↔Business, Business↔Business (no friendship required)
- **Pay Business**: In-chat payments to businesses

### PBX-to-PBX Closed-Loop Transfers (P0)
- **Default Option**: PBX-to-PBX is the RECOMMENDED send option
- **Instant & Free**: Zero fees, instant delivery
- **USD Only**: Internal transfers are in USD
- **Transfer Limits**: $5,000/transaction, $25,000/day per sender
- **User Lookup**: By email OR phone (exact match, case-insensitive for email)
- **Atomic Ledger**: Two entries per transfer (sender out, recipient in)
- **Self-Transfer Prevention**: Cannot send to yourself

### Email + SMS Notifications (P0 - COMPLETE)
- **All Transfer Types**: PBX-to-PBX, outbound, bills, failed/delayed
- **Magic Link Auth**: Secure 15-minute expiry tokens for passwordless login
- **User Preferences**: SMS and Email toggles (default: ON)
- **Delivery Tracking**: sms_sent, email_sent, link_opened
- **SMS Rate Limiting**: Combine within 2-3 minutes
- **Security**: No balances in notifications, no raw tokens, short secure links
- **Trust Footer**: "PBX will never ask for your password"

### Dual-UX Architecture
- **Role Selection**: Mandatory question during onboarding determines UX path
- **Sender UX** (`/sender/*`): Home, Send, People, Chat, Activity, Settings
- **Recipient UX** (`/recipient/*`): Dashboard, Wallets, Convert, Bills, Transfers, Statements, Notifications
- **Strict Access Control**: Users confined to their role's routes

### Currency Rules
- **Subscriptions = USD** (charged to US/global senders via Stripe)
- **Transfers = PHP** (FX applies to send amounts)
- **FX is visible BEFORE signup** (builds trust)
- **No PHP pricing outside Send Money flow**

### Session & Role Persistence
- **Storage**: `localStorage` for durable session persistence across tabs/sessions
- **Role Persistence**: Saved to MongoDB `users` collection during onboarding
- **Backend API**: `POST /api/users/role`, `GET /api/users/me`

---

## Architecture

### Route Structure
```
/sender/*           - Sender (employer/business) routes
  /sender/dashboard - Sender home with transfer stats
  /sender/send      - Initiate transfers
  /sender/recipients - Manage recipients
  /sender/activity  - Transfer history
  /sender/settings  - Account settings

/recipient/*        - Recipient (end user) routes
  /recipient/dashboard - Wallet overview, FX rate
  /recipient/wallets   - USD/PHP balances
  /recipient/convert   - USD→PHP conversion with rate lock
  /recipient/bills     - Pay Philippine billers
  /recipient/transfers - GCash, Maya, InstaPay, PESONet
  /recipient/statements - Transaction history
```

### Global Design System
```css
Primary: PBX Navy (#0A2540)
Background: Off-white (#F8F9FA)
Accent: Gold (#F6C94B) for highlights
CTAs: Navy buttons with white text
Dark theme: neutral-950, amber-400, red-600
```

### Key Components
- `SenderShell.jsx` - Navigation for sender app
- `RecipientShell.jsx` - Navigation for recipient app
- `SenderProtectedRoute` - Access control for sender routes
- `RecipientProtectedRoute` - Access control for recipient routes

---

## File Structure
```
/app/
├── backend/
│   ├── routes/
│   │   ├── recipient.py    # Recipient wallet, FX, bills, transfers APIs
│   │   ├── users.py        # User role persistence APIs
│   │   └── plaid.py        # Plaid bank linking
│   ├── server.py           # FastAPI main app
│   └── database/
│       └── connection.py   # MongoDB connection
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── SenderShell.jsx
│       │   ├── RecipientShell.jsx
│       │   └── PublicShell.jsx
│       ├── contexts/
│       │   └── SessionContext.jsx  # Session + role management
│       ├── pages/
│       │   ├── onboarding/
│       │   │   └── Welcome.jsx     # Role selection flow
│       │   ├── recipient/          # Recipient-only pages
│       │   │   ├── Dashboard.jsx
│       │   │   ├── Wallets.jsx
│       │   │   ├── Convert.jsx
│       │   │   ├── Bills.jsx
│       │   │   ├── Transfers.jsx
│       │   │   └── Statements.jsx
│       │   └── app/                # Sender-only pages
│       └── App.jsx                 # Dual-route structure
└── test_reports/
    └── iteration_*.json
```

---

## API Endpoints

### User Management
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/users/role` | POST | Set user role (sender/recipient) |
| `/api/users/me` | GET | Get current user info including role |

### PBX Internal Transfers (P0 - Closed-Loop)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/internal/lookup` | POST | Find PBX user by email or phone |
| `/api/internal/transfer` | POST | Execute instant USD transfer to PBX user |
| `/api/internal/incoming` | GET | Get incoming PBX transfers for current user |
| `/api/internal/invite` | POST | Generate invite message for non-PBX user |

### Social Features (P0 - COMPLETE)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/social/friends/request` | POST | Send friend request |
| `/api/social/friends/action` | POST | Accept/decline/block/unfriend |
| `/api/social/friends/list` | GET | Get friends, incoming/outgoing requests |
| `/api/social/friends/status/:userId` | GET | Get friendship status |
| `/api/social/conversations` | GET | Get all conversations |
| `/api/social/conversations/:userId` | GET | Get/create conversation with user |
| `/api/social/messages/:conversationId` | GET | Get messages |
| `/api/social/messages/send` | POST | Send text message |
| `/api/social/payments/send-in-chat` | POST | Send PBX payment in chat |

### Notification System (P0 - COMPLETE)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/notifications/preferences` | GET | Get user's SMS/Email preferences |
| `/api/notifications/preferences` | PUT | Update notification preferences |
| `/api/notifications/status` | GET | Get provider status (Resend/Twilio) |
| `/api/auth/magic/verify` | POST | Verify magic link token |
| `/api/auth/magic/resend` | POST | Resend new magic link |
| `/api/auth/magic/info` | GET | Get magic link info (15-min expiry) |

### Recipient APIs (Live MongoDB)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/recipient/wallet` | GET | Get wallet balances (USD, PHP) |
| `/api/recipient/wallet/fund` | POST | Simulate wallet funding (dev/demo) |
| `/api/recipient/convert` | GET | Get FX quote with rate comparison |
| `/api/recipient/convert/lock` | POST | Lock FX rate for 15 minutes |
| `/api/recipient/convert/execute` | POST | Execute USD→PHP conversion |
| `/api/recipient/bills/billers` | GET | List supported Philippine billers |
| `/api/recipient/bills/pay` | POST | Pay a bill |
| `/api/recipient/transfers/methods` | GET | Get transfer methods (InstaPay, GCash, etc.) |
| `/api/recipient/transfers/send` | POST | Create PHP transfer |
| `/api/recipient/statements` | GET | Get transaction history |

---

## Database Schema

### MongoDB Collections
```javascript
// users collection
{
  user_id: String,      // Session token (first 36 chars)
  email: String,
  role: "sender" | "recipient",
  created_at: DateTime,
  updated_at: DateTime
}

// wallets collection (planned)
{
  user_id: String,
  usd_balance: Number,
  php_balance: Number,
  sub_wallets: Object,
  updated_at: DateTime
}

// ledger collection (planned)
{
  user_id: String,
  type: String,
  currency: "USD" | "PHP",
  amount: Number,
  status: String,
  created_at: DateTime,
  metadata: Object
}
```

---

## Test Results

### Iteration 6 (Session & Role Persistence)
- **Status**: ✅ Backend 14/14 passed, Frontend 10/10 passed
- **Key Fixes**:
  - Migrated from sessionStorage to localStorage
  - Fixed role loss during signup (login() now preserves role)
  - Added useEffect for automatic backend persistence
- **Report**: `/app/test_reports/iteration_6.json`

### Iteration 5 (Dual-UX Architecture)
- **Status**: ✅ All 13 features passed
- **Key Verifications**:
  - Role selection screen works
  - Sender/Recipient routing works
  - Route protection blocks cross-role access
  - Compliance footer on all pages
- **Report**: `/app/test_reports/iteration_5.json`

---

## Prioritized Backlog

### ✅ Completed
- [x] Dual-UX architecture (Sender vs Recipient)
- [x] Role selection during onboarding
- [x] Session persistence (localStorage)
- [x] Role persistence to MongoDB
- [x] Route protection based on role
- [x] Wire recipient APIs to real MongoDB
- [x] Implement real USD/PHP wallet balances
- [x] Store transactions in ledger collection
- [x] Real FX rate API (OpenExchangeRates)
- [x] **PBX Closed-Loop Transfers (P0)** ✅
  - User lookup by email/phone
  - Instant, free USD transfers
  - Transfer limits ($5,000/txn, $25,000/day)
  - Atomic ledger entries
  - Recipient dashboard incoming transfers
- [x] **Email + SMS Notifications (P0)** ✅
  - Magic link authentication (15-min expiry)
  - User notification preferences
  - SMS/Email templates for all transfer types
  - Delivery tracking
  - Rate limiting (2-3 min window)
  - Graceful degradation without API keys
- [x] **Social Network Features (P0)** ✅
  - People tab with Friends/Requests sections
  - Friend requests (add/accept/decline/block/unfriend)
  - User search by name/@username/phone/email
  - 1:1 Chat threads (iMessage-style)
  - In-chat PBX payments with payment bubbles
  - Navigation: Home, Send, People, Activity, Settings

### P1 (High Priority)
- [ ] Plaid integration for sender flow
- [ ] Stripe subscription billing
- [ ] Rate lock backend with TTL (Redis)

### P2 (Medium Priority)
- [ ] OAuth integration (Google/Apple)
- [ ] Recurring transfers
- [ ] Push notifications (mobile)
- [ ] Rate alerts

### P3 (Future)
- [ ] Real payment integrations (GCash, Maya APIs)
- [ ] KYC/AML integration
- [ ] Multi-corridor support (beyond US-PH)

---

## Change Log

### January 17, 2025 - Enhanced Add Recipient with PBX-to-PBX (P0 COMPLETE)
- ✅ Added "PBX Wallet (Instant)" as first delivery method with "Recommended" badge
- ✅ Created Venmo/Cash App-style "PBX Friends" and "Manual Details" tabs
- ✅ Implemented PBX user search (name/@username/phone/email)
- ✅ Added invite flow for non-PBX users (SMS/Email)
- ✅ Dynamic form fields: PBX Wallet needs phone/email, GCash/Maya needs phone, Bank needs account
- ✅ Info text: "Fastest option — funds stay in PBX and can be used anytime"
- ✅ User search endpoint: `/api/users/search?q=...`
- ✅ Tests: 13/13 backend, 100% frontend UI verified

### January 17, 2025 - Email + SMS Notification System (P0 COMPLETE)
- ✅ Implemented `/api/notifications/preferences` - User SMS/Email preferences
- ✅ Implemented `/api/notifications/status` - Provider status (Resend/Twilio)
- ✅ Implemented `/api/auth/magic/verify` - Verify magic link token
- ✅ Implemented `/api/auth/magic/resend` - Resend new magic link
- ✅ Magic link authentication with 15-minute expiry
- ✅ SHA-256 token hashing for secure storage
- ✅ SMS templates: PBX-to-PBX, outbound, failed/delayed
- ✅ Email templates: PBX-to-PBX (with CTA), outbound, failed/delayed
- ✅ Delivery tracking: sms_sent, email_sent, link_opened
- ✅ SMS rate limiting (combine within 2-3 minutes)
- ✅ Notification Settings page at /recipient/notifications
- ✅ Magic Link Handler with resend option at /auth/magic
- ✅ Trust footer: "PBX will never ask for your password"
- ✅ Graceful degradation when RESEND_API_KEY/Twilio not configured
- ✅ Tests: 19/19 backend, 100% frontend UI verified

### January 17, 2025 - PBX Closed-Loop Transfer System (P0 COMPLETE)
- ✅ Implemented `/api/internal/lookup` - User lookup by email OR phone (case-insensitive)
- ✅ Implemented `/api/internal/transfer` - Atomic USD transfer with dual ledger entries
- ✅ Implemented `/api/internal/incoming` - Get incoming transfers for recipient
- ✅ Implemented `/api/internal/invite` - Generate invite message for non-PBX users
- ✅ Transfer limits: $5,000/transaction, $25,000/day per sender
- ✅ Self-transfer prevention
- ✅ Insufficient balance validation
- ✅ Mock user directory for demo (maria.santos, juan.delacruz, anna.reyes)
- ✅ Frontend: Transfer type selection (PBX User vs External Payout)
- ✅ Frontend: PBX recipient search modal
- ✅ Frontend: Amount entry with quick-select buttons
- ✅ Frontend: Review & confirmation screens
- ✅ Frontend: Recipient dashboard shows incoming transfers
- ✅ Landing page: PBX-to-PBX feature highlight
- ✅ Sender dashboard: "Send to PBX Users" CTA card
- ✅ Tests: 17/17 backend, 100% frontend UI verified

### January 17, 2025 - Netlify Deploy Fix (MongoDB Graceful Fallback)
- ✅ Added `mongodb` to root package.json dependencies
- ✅ Generated package-lock.json for Netlify build
- ✅ Updated all recipient Netlify functions to gracefully handle missing MONGODB_URI
- ✅ Functions return mock data when DB unavailable (DB_MODE=mock vs live in logs)
- ✅ No breaking changes to sender flow

### January 17, 2025 - OpenExchangeRates FX API & Phone Country Code
- ✅ Integrated OpenExchangeRates API for live USD/PHP rates
- ✅ Fallback to mock rate (56.25) when API unavailable
- ✅ FX source tracked in responses and ledger ("live" or "mock")
- ✅ Added country code selector to phone input
- ✅ Philippines (+63) and US (+1) pinned at top of dropdown
- ✅ Role-based default: Recipients → +63, Senders → +1
- ✅ Search functionality in country dropdown
- ✅ E.164 format stored in session (countryCode + phone)

### January 17, 2025 - Fund Wallet (Simulation) Feature
- ✅ Added POST /api/recipient/wallet/fund endpoint
- ✅ Credits USD wallet with max $5,000 per request
- ✅ Clear "SIMULATION ONLY" labeling in UI
- ✅ Warning banner explaining it's for testing only
- ✅ Transaction recorded in ledger as "simulated_credit"
- ✅ Success modal with updated balance

### January 17, 2025 - Email Persistence & Real MongoDB APIs
- ✅ Added email persistence during signup (normalized, unique constraint)
- ✅ Wired recipient APIs to real MongoDB (wallets, ledger, saved_billers)
- ✅ Real wallet balance tracking (USD/PHP)
- ✅ Real transaction ledger for all operations
- ✅ Fixed recipientApi.js to use localStorage (was sessionStorage)
- ✅ Fixed ESLint build error in SessionContext.jsx

### January 17, 2025 - Session & Role Persistence Fix
- ✅ Migrated session from sessionStorage to localStorage
- ✅ Fixed critical bug: role was lost during signup
- ✅ Added automatic role persistence to backend via useEffect
- ✅ Created /api/users/role and /api/users/me endpoints
- ✅ All tests passed (14/14 backend, 10/10 frontend)

### January 16, 2025 - Dual-UX Implementation
- ✅ Implemented role selection screen in onboarding
- ✅ Created separate route namespaces (/sender/*, /recipient/*)
- ✅ Built SenderShell and RecipientShell navigation
- ✅ Implemented route protection components
- ✅ Created mock recipient APIs (wallet, FX, bills, transfers)

### Earlier
- Initial build with Remitly-style sender flow
- Marketing pages with dark theme
- Plaid mock integration
