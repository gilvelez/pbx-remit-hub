# PBX Money Flow Documentation

## Overview

This document describes how funds move through the Philippine Bayani Exchange (PBX) platform, from the sender's U.S. bank account to the recipient's Philippine wallet or bank account.

---

## Fund Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PBX REMITTANCE FLOW                                 │
└─────────────────────────────────────────────────────────────────────────────┘

    ┌──────────┐      ┌──────────────┐      ┌──────────┐      ┌─────────────┐
    │   USD    │      │     PBX      │      │   USDC   │      │     PHP     │
    │  (Plaid) │ ──── │  Custodial   │ ──── │ (Circle) │ ──── │ (PayMongo)  │
    │          │      │   Account    │      │          │      │             │
    └──────────┘      └──────────────┘      └──────────┘      └─────────────┘
         │                   │                   │                   │
         ▼                   ▼                   ▼                   ▼
    ┌──────────┐      ┌──────────────┐      ┌──────────┐      ┌─────────────┐
    │  User's  │      │   Holding    │      │ Stablecoin│     │   GCash /   │
    │ US Bank  │      │   & FX Ops   │      │   Rails   │      │  PH Bank    │
    └──────────┘      └──────────────┘      └──────────┘      └─────────────┘
```

---

## Step-by-Step Flow

### Step 1: USD Collection (Plaid)
| Attribute | Value |
|-----------|-------|
| **Provider** | Plaid |
| **Action** | User links U.S. bank account via Plaid Link |
| **Result** | ACH authorization to pull USD from user's account |
| **Timeline** | Instant link; ACH settlement 1-3 business days |

**What happens:**
- User connects their U.S. bank account using Plaid's secure bank link
- PBX initiates an ACH debit for the transfer amount
- Funds are pulled into PBX's custodial account

---

### Step 2: PBX Custodial Holding
| Attribute | Value |
|-----------|-------|
| **Provider** | PBX (Licensed Partner) |
| **Action** | Funds held in segregated custodial account |
| **Result** | Compliance checks, AML screening |
| **Timeline** | Immediate upon ACH settlement |

**What happens:**
- USD is held in PBX's regulated custodial account
- Compliance and AML screening performed
- FX rate locked for the transaction

---

### Step 3: USDC Conversion (Circle)
| Attribute | Value |
|-----------|-------|
| **Provider** | Circle |
| **Action** | USD converted to USDC (1:1 stablecoin) |
| **Result** | Funds on blockchain rails for fast settlement |
| **Timeline** | Near-instant |

**What happens:**
- USD is converted to USDC via Circle's infrastructure
- USDC provides transparent, auditable fund movement
- Enables faster cross-border settlement vs. traditional SWIFT

---

### Step 4: PHP Payout (PayMongo)
| Attribute | Value |
|-----------|-------|
| **Provider** | PayMongo |
| **Action** | USDC off-ramped to PHP, disbursed to recipient |
| **Result** | PHP delivered to GCash wallet or PH bank account |
| **Timeline** | GCash: Instant; Bank: Same-day to 1 business day |

**What happens:**
- USDC is converted to PHP at the locked FX rate
- PayMongo initiates payout to recipient's chosen destination
- Recipient receives PHP in their GCash wallet or bank account

---

## Supported Payout Destinations

| Destination | Type | Settlement Time |
|-------------|------|-----------------|
| **GCash** | E-Wallet | Instant |
| **Maya (PayMaya)** | E-Wallet | Instant |
| **BDO** | Bank | Same-day to 1 BD |
| **BPI** | Bank | Same-day to 1 BD |
| **Metrobank** | Bank | Same-day to 1 BD |
| **UnionBank** | Bank | Same-day to 1 BD |
| **Other PH Banks** | Bank | 1-2 BD |

---

## Fee Structure (Illustrative)

| Component | Amount | Notes |
|-----------|--------|-------|
| Transfer Fee | $2.99 flat | Per transaction |
| FX Spread | 0.4% | Built into rate |
| ACH Fee | Included | No additional charge |
| Payout Fee | Included | Absorbed by PBX |

*Note: Actual fees subject to partner agreements and may vary.*

---

## Compliance & Licensing

| Requirement | Status |
|-------------|--------|
| U.S. Money Transmitter | Via licensed partner |
| BSP Registration (PH) | Via PayMongo/partner |
| AML/KYC | Integrated |
| OFAC Screening | Automated |

---

## Technical Integration Summary

```
┌────────────────────────────────────────────────────────────────┐
│                    INTEGRATION STACK                           │
├────────────────────────────────────────────────────────────────┤
│  LAYER          │  PROVIDER       │  PURPOSE                   │
├────────────────────────────────────────────────────────────────┤
│  Bank Link      │  Plaid          │  ACH authorization         │
│  Stablecoin     │  Circle         │  USD → USDC rails          │
│  PH Payout      │  PayMongo       │  PHP disbursement          │
│  FX Rates       │  OpenExchangeRates │ Real-time USD/PHP       │
└────────────────────────────────────────────────────────────────┘
```

---

## Example Transaction

**Scenario:** Maria in California sends $200 to her mother in Manila via GCash.

| Step | Action | Amount | Time |
|------|--------|--------|------|
| 1 | Maria initiates transfer | $200.00 USD | T+0 |
| 2 | Fee deducted | -$2.99 | T+0 |
| 3 | Net amount for conversion | $197.01 | T+0 |
| 4 | FX rate applied (₱58.25) | ₱11,475.83 | T+0 |
| 5 | FX spread (0.4%) | -₱45.90 | T+0 |
| 6 | **Recipient receives** | **₱11,429.93** | T+0 (GCash) |

---

## Contact

For partnership inquiries or technical integration questions, please contact the PBX team.

---

*Document Version: 1.0*  
*Last Updated: December 2024*  
*Classification: Partner Documentation*
