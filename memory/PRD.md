# PBX (Philippine Bayani Exchange) - Product Requirements Document

## Original Problem Statement
Build a subscription-based financial platform (PBX) for cross-border money transfers between the U.S. and the Philippines. Major UI/UX overhaul to Remitly-inspired design with mobile-first, clarity-focused interface.

## 🔒 HARD RULES (Locked In)

### Currency Rules
- **Subscriptions = USD** (charged to US/global senders via Stripe)
- **Transfers = PHP** (FX applies to send amounts)
- **FX is visible BEFORE signup** (builds trust)
- **No PHP pricing outside Send Money flow**

### Subscription Plans (USD)
| Plan | Price | Target |
|------|-------|--------|
| Basic | Free | Starting out |
| Premium | $10/mo | Individuals & families |
| SME | $50/mo | Small business |
| Enterprise | Custom | Large organizations |

---

## Live FX Rate - The Core Value Prop

### Where FX Must Appear (3 Locations)
1. **Landing Page Hero** - LiveFXTicker above CTAs
2. **Pricing Page** - LiveFXRate card below header
3. **App Home** - LiveFXRate as primary card

### LiveFXRate Component Features
- Auto-refresh every 30 seconds
- Green dot indicator (stable) / Pulse animation (updating)
- "15-min rate lock" badge
- "No fees" indicator
- "Indicative rate" disclaimer

---

## Architecture

### Theme Split
- **Marketing Pages** (Dark theme): `/`, `/pricing`, `/business`, `/how-it-works`, `/roadmap`
- **App Pages** (Light theme): `/app/*` routes with Remitly-style UI

### Global Design System
```css
Primary: PBX Navy (#0A2540)
Background: Off-white (#F8F9FA)
Accent: Gold (#F6C94B) for highlights
CTAs: Navy buttons with white text
Dark theme: neutral-950, amber-400, red-600
```

### Navigation Structure
**4-Tab Bottom Navigation:**
1. **Home** - Live FX rate, Send Money CTA, Trust indicators
2. **Send** - Multi-step transfer flow (5 steps)
3. **Activity** - Transfer history
4. **Manage** - Profile, Payment Methods, Recipients, Security, Legal

---

## User Flows

### Onboarding Flow (`/welcome`)
Progressive Remitly-style onboarding:
1. Welcome Carousel → 2. Corridor Selection → 3. Signup → 4. Account Type → 5. Phone OTP → 6. Complete

### Send Money Flow (`/app/send`)
5-step transfer process:
1. **Amount** - USD input → PHP output with live FX rate
2. **Recipient** - GCash, Maya, Bank, Cash Pickup
3. **Payment** - Bank (Plaid), Debit, Credit (+2.9%), Apple Pay
4. **Review** - Summary card with Edit options
5. **Confirmation** - Success with ETA

---

## File Structure
```
/app/frontend/src/
├── components/
│   ├── AppShell.jsx         # Light theme + 4-tab nav
│   ├── LiveFXRate.jsx       # Reusable FX display (NEW)
│   └── ui/                  # Shadcn components
├── pages/
│   ├── Landing.jsx          # Dark theme + LiveFXTicker
│   ├── Pricing.jsx          # USD pricing + LiveFXRate
│   ├── app/
│   │   ├── Home.jsx         # LiveFXRate as primary card
│   │   ├── Send.jsx         # 5-step transfer flow
│   │   ├── Activity.jsx
│   │   └── Manage.jsx
│   └── onboarding/
│       └── Welcome.jsx      # 6-step progressive flow
├── lib/
│   └── mockApi.js           # Mock API layer
└── styles/
    └── design-system.css    # CSS variables
```

---

## Test Results

### Iteration 4 (FX Fix + USD Pricing)
- **Status**: ✅ All 8 features passed
- **Key Verifications**:
  - USD pricing on Landing, Pricing pages
  - Live FX Ticker on Landing hero
  - Live FX Rate card on Pricing page
  - Live FX Rate component on App Home
  - PHP only in Send Money flow
- **Report**: `/app/test_reports/iteration_4.json`

---

## Prioritized Backlog

### P0 (Critical for Launch)
- [ ] Real FX rate API (OpenExchangeRates, Fixer, etc.)
- [ ] Plaid integration (real bank linking)
- [ ] Stripe subscription billing
- [ ] Backend API for transfers

### P1 (High Priority)
- [ ] Real email/OTP verification
- [ ] KYC/AML integration
- [ ] Transfer status webhooks
- [ ] Rate lock backend (15-min TTL)

### P2 (Medium Priority)
- [ ] Recurring transfers
- [ ] Push notifications
- [ ] Rate alerts

---

## Change Log

### January 12, 2025 - FX & Pricing Fix
- ✅ Changed subscription pricing from PHP to USD
- ✅ Created LiveFXRate reusable component
- ✅ Added Live FX Ticker to Landing hero
- ✅ Added Live FX Rate to Pricing page
- ✅ Updated App Home with LiveFXRate card
- ✅ Auto-refresh every 30 seconds
- ✅ All tests passed (100% success rate)

### January 12, 2025 - UI/UX Overhaul
- Split theme: Dark marketing, Light app
- New 4-tab navigation
- Remitly-style progressive onboarding
- 5-step Send Money flow
- Plaid only in Payment Method step

### Earlier
- Initial build with PayMongo integration
- Basic subscription model
