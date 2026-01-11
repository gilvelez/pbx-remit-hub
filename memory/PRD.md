# PBX (Philippine Bayani Exchange) - Product Requirements Document

## Original Problem Statement
Build a subscription-based financial platform (PBX) for cross-border money transfers between the U.S. and the Philippines. The platform pivoted from a per-transaction remittance model to a **multi-tiered subscription service model** (B2C and B2B).

## Target Users
- **Individuals**: Expats, travelers, families, retirees moving money between countries
- **Small & Medium Enterprises (SMEs)**: Businesses with international payroll/payouts
- **Enterprises**: Large volume cross-border payment needs

## Subscription Tiers (Updated January 2025)
| Tier | Price | FX Spread | Transfer Fee | Monthly Limit | Interest |
|------|-------|-----------|--------------|---------------|----------|
| Basic | Free | ~1.5% | ₱100/transfer | ₱250,000 | — |
| Premium | ₱499/mo | ~0.8% | Free | ₱1,250,000 | 1% APY |
| SME | ₱2,499/mo | ~0.5% | Free | ₱5,000,000 | — |
| Enterprise | Custom | ~0.3% | Free | Unlimited | — |

## Core Features (January 2025 Update)

### New Features Added
1. **Recurring Transfers** - Schedule automatic weekly/monthly payments (Premium, SME, Enterprise)
2. **PBX Wallet with Interest** - 1% APY on balances for Premium users only
3. **15-Minute FX Rate Lock** - Guaranteed exchange rates for 15 minutes after quote
4. **PHP-based Pricing** - All subscription prices in Philippine Pesos

### Design Theme
- **Dark Theme**: `bg-neutral-950` (almost black) backgrounds
- **Gold Headers**: `text-amber-400` for headings and accents
- **Red CTAs**: `bg-red-600` for primary action buttons
- **Fonts**: Georgia for headings, System sans-serif for body

## Pages & Components

### Public Pages (All Implemented ✅)
| Page | Route | Description |
|------|-------|-------------|
| Landing | `/` | Hero, features (Recurring, Wallet, FX Lock), pricing preview |
| Pricing | `/pricing` | Full 4-tier comparison with feature table |
| How It Works | `/how-it-works` | 4-step process with FX lock explanation |
| Business | `/business` | B2B/SME focused sales page |
| Roadmap | `/roadmap` | Q1-Q4 2025 product timeline |
| Login | `/login` | Dark theme login form |
| Verify | `/verify` | 6-digit code verification |

### Onboarding Flows (All Implemented ✅)
| Flow | Route | Steps |
|------|-------|-------|
| Personal | `/onboarding/personal` | Email → KYC → Plan Selection (Basic/Premium) |
| Business | `/onboarding/business` | Email → Plan → Company → FX Preferences |

### Protected App Pages (All Implemented ✅)
| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/app/dashboard` | Wallet balance (PHP), yield indicator, FX lock timer |
| Send Money | `/app/send` | Transfer flow (existing) |
| Wallet | `/app/wallet` | Balance management (existing) |

### Components
- **FXQuoteSimulator** - Interactive rate calculator with 15-min countdown timer
- **SubscriptionTier cards** - Plan selection with feature checkmarks

## Tech Stack
- **Frontend**: React 19, React Router, Tailwind CSS, shadcn/ui
- **Backend**: Currently MOCKED (no backend)
- **Session**: SessionStorage-based (mocked)

---

## What's Been Implemented

### Session 1: Initial Build
- Core remittance platform with mocked Plaid
- PayMongo integration (test mode)
- Basic UI with SendMoney, Wallet, Login flows

### Session 2: UI Overhaul
- Premium Filipino theme applied across all pages
- Pixel-perfect landing page redesign
- Compliance text and disclaimers added

### Session 3: Subscription Model Pivot
- Created all subscription pages (Pricing, Dashboard, Onboarding)
- Added routing for all new pages
- FX Simulator component with tier-based rates

### Session 4 (January 2025): Feature Update + Dark Theme
- ✅ New dark theme (`bg-neutral-950`) with gold headers and red CTAs
- ✅ PHP-based pricing (₱499, ₱2,499 per month)
- ✅ **15-minute FX Rate Lock** with countdown timer in FXQuoteSimulator
- ✅ **1% APY Interest indicator** for Premium users in Dashboard
- ✅ **Recurring Transfers** feature indicators throughout app
- ✅ Updated all pages to consistent dark theme (Login, Verify included)
- ✅ Feature comparison table on Pricing page
- ✅ All tests passed (100% success rate)

---

## Prioritized Backlog

### P0 (Critical for Launch)
- [ ] Wire up real backend API integration
- [ ] Implement production authentication (JWT or OAuth)
- [ ] Connect to real FX rate provider
- [ ] Implement Stripe/PayMongo for PHP subscription payments

### P1 (High Priority)
- [ ] Circle Integration for fund custody
- [ ] Real recurring transfer scheduling backend
- [ ] Email verification in onboarding
- [ ] Real KYC/AML integration

### P2 (Medium Priority)
- [ ] Mobile responsive polish
- [ ] Interest calculation engine (1% APY)
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
- 15-min rate lock is visual only (no backend lock)
- Interest calculation is frontend simulation
- Onboarding uses setTimeout, no real API calls
- Session management is sessionStorage only
- No real payment processing
- No email verification

## File Structure
```
/app/frontend/src/
├── pages/
│   ├── Landing.jsx       # Dark theme landing page
│   ├── Pricing.jsx       # PHP pricing with feature table
│   ├── HowItWorks.jsx    # 4-step process
│   ├── Business.jsx      # B2B page
│   ├── Roadmap.jsx       # Q1-Q4 2025 timeline
│   ├── Dashboard.jsx     # Wallet, yield, FX timer
│   ├── OnboardingPersonal.jsx  # 3-step personal flow
│   ├── OnboardingBusiness.jsx  # 4-step business flow
│   ├── Login.jsx         # Dark theme login
│   ├── Verify.jsx        # Dark theme verify
│   └── SendMoney.jsx     # Transfer flow
├── components/
│   ├── FXQuoteSimulator.jsx   # 15-min rate lock
│   └── ui/               # Shadcn components
└── App.jsx               # Main routing
```

---

## Test Reports
- `/app/test_reports/iteration_1.json` - Initial subscription model tests
- `/app/test_reports/iteration_2.json` - Feature update tests (all passed)
