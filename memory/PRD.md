# PBX (Philippine Bayani Exchange) - Product Requirements Document

## Original Problem Statement
Build a dual-UX financial platform (PBX) for cross-border money transfers between the U.S. and the Philippines. The application supports two distinct user roles:
- **Senders** (Employers/Businesses): Manage payroll, batch payments, recipient management
- **Recipients** (End Users): Receive USD, convert to PHP, pay bills, transfer funds

## 🔒 HARD RULES (Locked In)

### Dual-UX Architecture
- **Role Selection**: Mandatory question during onboarding determines UX path
- **Sender UX** (`/sender/*`): Dashboard, Send, Recipients, Activity, Settings
- **Recipient UX** (`/recipient/*`): Dashboard, Wallets, Convert, Bills, Transfers, Statements
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

### Recipient APIs (MOCKED)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/recipient/wallet` | GET | Get wallet balances (USD, PHP) |
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
- [x] Mock recipient APIs (wallet, FX, bills, transfers)

### P0 (Critical - Next Up)
- [x] Wire recipient APIs to real MongoDB ✅
- [x] Implement real USD/PHP wallet balances ✅
- [x] Store transactions in ledger collection ✅
- [ ] Test and verify all edge cases (insufficient balance, concurrent updates)

### P1 (High Priority)
- [ ] Real FX rate API (OpenExchangeRates)
- [ ] Plaid integration for sender flow
- [ ] Stripe subscription billing
- [ ] Rate lock backend with TTL

### P2 (Medium Priority)
- [ ] OAuth integration (Google/Apple)
- [ ] Recurring transfers
- [ ] Push notifications
- [ ] Rate alerts

### P3 (Future)
- [ ] Real payment integrations (GCash, Maya APIs)
- [ ] KYC/AML integration
- [ ] Multi-corridor support (beyond US-PH)

---

## Change Log

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
