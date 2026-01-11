# PBX (Philippine Bayani Exchange) - Product Requirements Document

## Original Problem Statement
Build a subscription-based financial platform (PBX) for cross-border money transfers between the U.S. and the Philippines. The platform has pivoted from a per-transaction remittance model to a **multi-tiered subscription service model** (B2C and B2B).

## Target Users
- **Individuals**: Expats, travelers, families, retirees moving money between countries
- **Small & Medium Enterprises (SMEs)**: Businesses with international payroll/payouts
- **Enterprises**: Large volume cross-border payment needs

## Subscription Tiers
| Tier | Price | FX Spread | Transfer Fee | Monthly Limit |
|------|-------|-----------|--------------|---------------|
| Basic | Free | ~1.5% | $2.00/transfer | $5,000 |
| Premium | $10/mo | ~0.8% | Free | $25,000 |
| SME | $50/mo | ~0.5% | Free | $100,000 |
| Enterprise | Custom | ~0.3% | Free | Unlimited |

## Core Requirements

### Public Pages (Implemented ✅)
- **Landing Page** (`/`): Hero, FX rate preview, subscription tier cards, "Why PBX" section
- **Pricing Page** (`/pricing`): Full tier comparison with feature table
- **How It Works** (`/how-it-works`): 4-step process explanation
- **Business Page** (`/business`): B2B/SME focused sales page
- **Roadmap Page** (`/roadmap`): Q1-Q4 2025 product roadmap

### Onboarding Flows (Implemented ✅)
- **Personal Onboarding** (`/onboarding/personal`): 3-step flow
  1. Email signup
  2. KYC verification (name, ID)
  3. Plan selection (Basic/Premium)
  
- **Business Onboarding** (`/onboarding/business`): 4-step flow
  1. Work email
  2. Plan selection (SME/Enterprise)
  3. Company information
  4. FX preferences

### Protected App Pages (Implemented ✅)
- **Dashboard** (`/app/dashboard`): Wallet balance, recent activity, upgrade CTA, FX simulator
- **Send Money** (`/app/send`): Transfer flow (existing)
- **Wallet** (`/app/wallet`): Balance management (existing)

### Components (Implemented ✅)
- **FX Simulator**: Interactive rate calculator with tier-based rates
- **Navigation**: Updated with Dashboard, Pricing, Business links

## Tech Stack
- **Frontend**: React 19, React Router, Tailwind CSS
- **Backend**: Currently MOCKED (no backend)
- **Session**: SessionStorage-based (mocked)

## Design Theme
- **Filipino Premium Theme**: Gold (#F6C94B), Navy (#0A2540), Dark backgrounds
- **Fonts**: Georgia (headings), System sans-serif (body)
- **Style**: Premium, high-trust financial aesthetic

---

## What's Been Implemented (December 2025)

### Session 1: Initial Build
- Core remittance platform with mocked Plaid
- PayMongo integration (test mode)
- Basic UI with SendMoney, Wallet, Login flows

### Session 2: UI Overhaul
- Premium Filipino theme applied across all pages
- Pixel-perfect landing page redesign
- Compliance text and disclaimers added

### Session 3 (Current): Subscription Model Pivot
- ✅ Created Pricing page with 4-tier comparison
- ✅ Created HowItWorks page with 4-step process
- ✅ Created Business page for B2B users
- ✅ Created Roadmap page with Q1-Q4 2025 timeline
- ✅ Created OnboardingPersonal (3-step flow)
- ✅ Created OnboardingBusiness (4-step flow)
- ✅ Created Dashboard with FX simulator
- ✅ Created FXSimulator component with tier-based rates
- ✅ Updated Landing page with subscription tier cards
- ✅ Updated App.jsx routing for all new pages
- ✅ All tests passed (100% success rate)

---

## Prioritized Backlog

### P0 (Critical for Launch)
- [ ] Wire up real backend API integration
- [ ] Implement production authentication (JWT or OAuth)
- [ ] Connect to real FX rate provider
- [ ] Implement payment processing for subscriptions (Stripe)

### P1 (High Priority)
- [ ] Circle Integration for fund custody
- [ ] PayMongo Webhooks for transfer status
- [ ] Email verification in onboarding
- [ ] Real KYC/AML integration

### P2 (Medium Priority)
- [ ] Mobile responsive polish
- [ ] Recurring transfers feature
- [ ] Multi-currency wallet
- [ ] API documentation for business tier

### P3 (Nice to Have)
- [ ] Mobile app (iOS/Android)
- [ ] PBX debit card
- [ ] Virtual card numbers
- [ ] Yield on idle balances

---

## Known Limitations (MOCKED)
- All FX rates are hardcoded simulation
- Onboarding uses setTimeout, no real API calls
- Session management is sessionStorage only
- No real payment processing
- No email verification

## File Structure
```
/app/frontend/src/
├── pages/
│   ├── Landing.jsx       # Main landing page
│   ├── Pricing.jsx       # Pricing comparison
│   ├── HowItWorks.jsx    # How it works
│   ├── Business.jsx      # B2B page
│   ├── Roadmap.jsx       # Product roadmap
│   ├── Dashboard.jsx     # User dashboard
│   ├── OnboardingPersonal.jsx
│   ├── OnboardingBusiness.jsx
│   └── ...
├── components/
│   ├── FXSimulator.jsx   # FX calculator
│   └── ui/               # Shadcn components
└── App.jsx               # Main routing
```
