# PBX (Philippine Bayani Exchange) - Product Requirements Document

## Original Problem Statement
Build a subscription-based financial platform (PBX) for cross-border money transfers between the U.S. and the Philippines. Major UI/UX overhaul to Remitly-inspired design with mobile-first, clarity-focused interface.

## Target Users
- **Individuals**: Expats, travelers, families, retirees moving money between countries
- **Small & Medium Enterprises (SMEs)**: Businesses with international payroll/payouts
- **Enterprises**: Large volume cross-border payment needs

---

## Current Architecture (January 2025)

### Theme Split
- **Marketing Pages** (Dark theme): `/`, `/pricing`, `/business`, `/how-it-works`, `/roadmap`
- **App Pages** (Light theme): `/app/*` routes with Remitly-style UI

### Global Design System
```css
Primary: PBX Navy (#0A2540)
Background: Off-white (#F8F9FA)
Accent: Gold (#F6C94B) for highlights
CTAs: Navy buttons with white text
Border: Light gray (#E5E7EB)
```

### Navigation Structure
**4-Tab Bottom Navigation:**
1. **Home** - Live FX rate, Send Money CTA, Trust indicators
2. **Send** - Multi-step transfer flow
3. **Activity** - Transfer history
4. **Manage** - Profile, Payment Methods, Recipients, Security, Legal

---

## User Flows

### Onboarding Flow (`/welcome`)
Progressive Remitly-style onboarding:
1. **Welcome Carousel** - 3 slides explaining PBX benefits
2. **Corridor Selection** - US → Philippines (more coming soon)
3. **Signup** - Email/password + Google/Apple OAuth buttons
4. **Account Type** - Personal or Business
5. **Phone Verification** - OTP to mobile number
6. **Complete** - Success screen, redirect to Home

### Send Money Flow (`/app/send`)
5-step transfer process:
1. **Amount** - USD input → PHP output with live FX rate
2. **Recipient** - Select existing or add new (GCash, Maya, Bank, Cash Pickup)
3. **Payment Method** - Bank (Plaid), Debit, Credit (+2.9%), Apple Pay
4. **Review** - Summary card with Edit options, disclosures
5. **Confirmation** - Success with ETA, Send again option

### Plaid Integration
- Appears ONLY in Send Flow → Payment Method → Bank Account option
- Shows benefits: Security, Speed, One-time setup
- "Connect Bank" / "Maybe later" options

---

## Pages & Components

### Marketing Pages (Dark Theme)
| Page | Route | Status |
|------|-------|--------|
| Landing | `/` | ✅ Dark theme with gold/red |
| Pricing | `/pricing` | ✅ PHP pricing (₱499, ₱2,499) |
| Business | `/business` | ✅ B2B focused |
| How It Works | `/how-it-works` | ✅ 4-step process |
| Roadmap | `/roadmap` | ✅ Q1-Q4 2025 |

### App Pages (Light Theme)
| Page | Route | Status |
|------|-------|--------|
| Home | `/app/home` | ✅ FX rate, Send CTA |
| Send | `/app/send` | ✅ 5-step flow |
| Activity | `/app/activity` | ✅ Transfer history |
| Manage | `/app/manage` | ✅ Profile/Settings |

### Auth Pages
| Page | Route | Status |
|------|-------|--------|
| Welcome | `/welcome` | ✅ 6-step onboarding |
| Login | `/login` | ✅ Dark theme |
| Verify | `/verify` | ✅ OTP entry |

---

## File Structure
```
/app/frontend/src/
├── components/
│   ├── AppShell.jsx         # Light theme wrapper + 4-tab nav
│   └── ui/                  # Shadcn components
├── pages/
│   ├── Landing.jsx          # Dark theme marketing
│   ├── Pricing.jsx          # Dark theme, PHP pricing
│   ├── Business.jsx         # Dark theme, B2B
│   ├── HowItWorks.jsx
│   ├── Roadmap.jsx
│   ├── Login.jsx            # Dark theme auth
│   ├── Verify.jsx
│   ├── onboarding/
│   │   └── Welcome.jsx      # 6-step progressive flow
│   └── app/
│       ├── Home.jsx         # Light theme
│       ├── Send.jsx         # 5-step transfer
│       ├── Activity.jsx     # History
│       └── Manage.jsx       # Settings
├── lib/
│   └── mockApi.js           # Mock API layer
├── styles/
│   └── design-system.css    # Global CSS variables
└── App.jsx                  # Routing with theme split
```

---

## API Layer (MOCKED)

All APIs are mocked for demo. Interface designed for easy real API integration:

```javascript
// mockApi.js exports
getQuote(amountUsd)         // Returns rate, amountPhp, quoteId
lockRate(quoteId)           // Locks rate for 15 min
createTransfer(data)        // Creates transfer, returns transferId
linkFundingSource(token)    // Plaid integration stub
getTransfers()              // History from localStorage
getRecipients()             // Saved recipients
saveRecipient(recipient)    // Auto-save on send
```

---

## Test Results

### Iteration 3 (UI/UX Overhaul)
- **Status**: ✅ All 13 features passed
- **Coverage**: Full user journey tested
- **Report**: `/app/test_reports/iteration_3.json`

---

## Prioritized Backlog

### P0 (Critical for Launch)
- [ ] Wire up real backend API
- [ ] Implement real FX rate provider
- [ ] Plaid integration (real)
- [ ] Stripe/PayMongo for payments

### P1 (High Priority)
- [ ] Real email/OTP verification
- [ ] KYC/AML integration
- [ ] Transfer status webhooks
- [ ] Error handling for edge cases

### P2 (Medium Priority)
- [ ] Mobile responsive polish
- [ ] Recurring transfers backend
- [ ] Push notifications
- [ ] Rate alerts

### P3 (Nice to Have)
- [ ] Mobile app (iOS/Android)
- [ ] PBX debit card
- [ ] Virtual card numbers

---

## Known Limitations (MOCKED)
- FX rates simulated (random fluctuation around 56.25)
- Plaid "Connect Bank" is a UI stub
- Transfers saved to localStorage only
- No real email/SMS verification
- Session uses sessionStorage (no persistence)

---

## Change Log

### January 12, 2025 - Major UI/UX Overhaul
- ✅ Split theme: Dark marketing, Light app
- ✅ New 4-tab navigation structure
- ✅ Remitly-style progressive onboarding at /welcome
- ✅ Streamlined 5-step Send Money flow
- ✅ Plaid moved to Payment Method step only
- ✅ Global design system with CSS variables
- ✅ Mock API layer for future backend integration
- ✅ All tests passed (100% success rate)

### January 11, 2025 - Feature Update
- PHP-based pricing (₱499, ₱2,499)
- 15-min FX rate lock indicator
- 1% APY interest badge for Premium
- Dark theme across all pages

### Earlier - Initial Build
- Core remittance platform
- PayMongo integration (test mode)
- Basic subscription model
