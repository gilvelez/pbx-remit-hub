"""
PBX Recipient - Wallet, FX, Bills, Transfers, Statements APIs
For Philippine-based users receiving USD income
"""
from fastapi import APIRouter, HTTPException, status, Request, Response
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
import random

router = APIRouter(prefix="/api/recipient", tags=["recipient"])

# === Mock mode toggle ===
USE_MOCKS = True

# === Constants ===
PBX_SPREAD_BPS = 50  # 0.50% spread
BANK_SPREAD_BPS = 250  # 2.5% typical bank spread
RATE_LOCK_DURATION_SECONDS = 15 * 60  # 15 minutes

# === Mock Data ===
DEFAULT_WALLET = {
    "usd_balance": 1500.00,
    "php_balance": 25000.00,
    "sub_wallets": {
        "bills": 5000.00,
        "savings": 10000.00,
        "family": 2500.00,
    }
}

BILLERS = [
    {"code": "meralco", "name": "Meralco", "category": "electricity", "logo": "⚡"},
    {"code": "pldt", "name": "PLDT", "category": "telecom", "logo": "📞"},
    {"code": "globe", "name": "Globe", "category": "telecom", "logo": "🌐"},
    {"code": "smart", "name": "Smart", "category": "telecom", "logo": "📱"},
    {"code": "maynilad", "name": "Maynilad", "category": "water", "logo": "💧"},
    {"code": "manila_water", "name": "Manila Water", "category": "water", "logo": "🚰"},
]

TRANSFER_METHODS = [
    {"id": "instapay", "name": "InstaPay", "type": "bank", "eta": "Instant (within minutes)", "fee": 0, "max_amount": 50000, "description": "Real-time bank transfers"},
    {"id": "pesonet", "name": "PESONet", "type": "bank", "eta": "Same day (cutoff 3PM)", "fee": 0, "max_amount": None, "description": "Batch bank transfers"},
    {"id": "gcash", "name": "GCash", "type": "ewallet", "eta": "Instant", "fee": 0, "max_amount": 100000, "description": "Send to GCash wallet"},
    {"id": "maya", "name": "Maya", "type": "ewallet", "eta": "Instant", "fee": 0, "max_amount": 100000, "description": "Send to Maya wallet"},
]

BANKS = [
    {"code": "bpi", "name": "BPI"},
    {"code": "bdo", "name": "BDO"},
    {"code": "unionbank", "name": "UnionBank"},
    {"code": "metrobank", "name": "Metrobank"},
    {"code": "landbank", "name": "Landbank"},
    {"code": "pnb", "name": "PNB"},
    {"code": "security_bank", "name": "Security Bank"},
    {"code": "china_bank", "name": "China Bank"},
    {"code": "rcbc", "name": "RCBC"},
    {"code": "eastwest", "name": "EastWest Bank"},
]


# === Pydantic Models ===
class WalletResponse(BaseModel):
    user_id: str
    usd_balance: float
    php_balance: float
    sub_wallets: Dict[str, float]
    updated_at: str


class FxQuoteResponse(BaseModel):
    mid_market_rate: float
    pbx_rate: float
    pbx_spread_percent: float
    bank_rate: float
    bank_spread_percent: float
    amount_usd: float
    amount_php: float
    savings_php: float
    lock_duration_seconds: int
    timestamp: int
    source: str


class LockRateRequest(BaseModel):
    amount_usd: float
    locked_rate: Optional[float] = None


class ConvertRequest(BaseModel):
    amount_usd: float
    locked_rate: Optional[float] = None
    lock_id: Optional[str] = None


class PayBillRequest(BaseModel):
    biller_code: str
    account_no: str
    amount: float
    save_biller: bool = False
    nickname: str = ""


class TransferRequest(BaseModel):
    method: str
    amount: float
    recipient_account: str
    recipient_name: str = ""
    bank_code: Optional[str] = None


# === Helper Functions ===
def get_mid_market_rate():
    """Get simulated mid-market rate with slight fluctuation"""
    base_rate = 56.25
    fluctuation = (random.random() - 0.5) * 0.3
    return round(base_rate + fluctuation, 2)


def get_user_id_from_headers(request: Request) -> str:
    """Extract user ID from session token or use demo user"""
    token = request.headers.get("X-Session-Token", "")
    return token[:36] if token else "demo_user"


# === Wallet Endpoints ===
@router.get("/wallet")
async def get_wallet(request: Request):
    """Get wallet balances for current user"""
    user_id = get_user_id_from_headers(request)
    
    return WalletResponse(
        user_id=user_id,
        usd_balance=DEFAULT_WALLET["usd_balance"],
        php_balance=DEFAULT_WALLET["php_balance"],
        sub_wallets=DEFAULT_WALLET["sub_wallets"],
        updated_at=datetime.utcnow().isoformat()
    )


# === FX Conversion Endpoints ===
@router.get("/convert")
async def get_fx_quote(amount_usd: float = 100):
    """Get current FX quote with rate comparison"""
    mid_rate = get_mid_market_rate()
    pbx_spread = mid_rate * (PBX_SPREAD_BPS / 10000)
    pbx_rate = round(mid_rate - pbx_spread, 2)
    bank_spread = mid_rate * (BANK_SPREAD_BPS / 10000)
    bank_rate = round(mid_rate - bank_spread, 2)
    
    amount_php_pbx = round(amount_usd * pbx_rate, 2)
    amount_php_bank = round(amount_usd * bank_rate, 2)
    savings = round(amount_php_pbx - amount_php_bank, 2)
    
    return FxQuoteResponse(
        mid_market_rate=mid_rate,
        pbx_rate=pbx_rate,
        pbx_spread_percent=PBX_SPREAD_BPS / 100,
        bank_rate=bank_rate,
        bank_spread_percent=BANK_SPREAD_BPS / 100,
        amount_usd=amount_usd,
        amount_php=amount_php_pbx,
        savings_php=savings,
        lock_duration_seconds=RATE_LOCK_DURATION_SECONDS,
        timestamp=int(datetime.utcnow().timestamp() * 1000),
        source="mock" if USE_MOCKS else "live"
    )


@router.post("/convert/lock")
async def lock_fx_rate(request: Request, data: LockRateRequest):
    """Lock an FX rate for 15 minutes"""
    user_id = get_user_id_from_headers(request)
    
    mid_rate = get_mid_market_rate()
    pbx_spread = mid_rate * (PBX_SPREAD_BPS / 10000)
    pbx_rate = data.locked_rate or round(mid_rate - pbx_spread, 2)
    
    lock_id = f"lock_{int(datetime.utcnow().timestamp())}_{random.randint(1000, 9999)}"
    expires_at = datetime.utcnow().timestamp() + RATE_LOCK_DURATION_SECONDS
    
    return {
        "success": True,
        "lock_id": lock_id,
        "rate": pbx_rate,
        "expires_at": datetime.fromtimestamp(expires_at).isoformat(),
        "expires_in_seconds": RATE_LOCK_DURATION_SECONDS
    }


@router.post("/convert/execute")
async def execute_conversion(request: Request, data: ConvertRequest):
    """Execute USD → PHP conversion"""
    user_id = get_user_id_from_headers(request)
    
    if data.amount_usd <= 0:
        raise HTTPException(status_code=400, detail="Invalid amount")
    
    mid_rate = get_mid_market_rate()
    pbx_spread = mid_rate * (PBX_SPREAD_BPS / 10000)
    rate = data.locked_rate or round(mid_rate - pbx_spread, 2)
    amount_php = round(data.amount_usd * rate, 2)
    
    transaction_id = f"conv_{int(datetime.utcnow().timestamp())}_{random.randint(1000, 9999)}"
    
    return {
        "success": True,
        "transaction_id": transaction_id,
        "from_amount": data.amount_usd,
        "from_currency": "USD",
        "to_amount": amount_php,
        "to_currency": "PHP",
        "rate": rate,
        "status": "completed"
    }


# === Bills Endpoints ===
@router.get("/bills/billers")
async def get_billers():
    """Get list of supported billers"""
    return {"billers": BILLERS}


@router.get("/bills/saved")
async def get_saved_billers(request: Request):
    """Get user's saved billers"""
    return {
        "saved_billers": [
            {"id": "saved_1", "biller_code": "meralco", "account_no": "1234567890", "nickname": "Home Electric"},
            {"id": "saved_2", "biller_code": "pldt", "account_no": "0987654321", "nickname": "Internet"},
        ]
    }


@router.get("/bills/history")
async def get_bill_history(request: Request):
    """Get bill payment history"""
    return {
        "payments": [
            {
                "id": "bill_1",
                "biller_code": "meralco",
                "biller_name": "Meralco",
                "account_no": "1234567890",
                "amount": 3500.00,
                "status": "paid",
                "paid_at": (datetime.utcnow()).isoformat()
            },
            {
                "id": "bill_2",
                "biller_code": "pldt",
                "biller_name": "PLDT",
                "account_no": "0987654321",
                "amount": 1899.00,
                "status": "paid",
                "paid_at": (datetime.utcnow()).isoformat()
            }
        ]
    }


@router.post("/bills/pay")
async def pay_bill(request: Request, data: PayBillRequest):
    """Pay a bill from PHP wallet"""
    biller = next((b for b in BILLERS if b["code"] == data.biller_code), None)
    if not biller:
        raise HTTPException(status_code=400, detail="Invalid biller")
    
    if data.amount <= 0:
        raise HTTPException(status_code=400, detail="Invalid amount")
    
    transaction_id = f"bill_{int(datetime.utcnow().timestamp())}_{random.randint(1000, 9999)}"
    
    return {
        "success": True,
        "transaction_id": transaction_id,
        "biller_name": biller["name"],
        "account_no": data.account_no,
        "amount": data.amount,
        "status": "paid",
        "paid_at": datetime.utcnow().isoformat()
    }


# === Transfers Endpoints ===
@router.get("/transfers/methods")
async def get_transfer_methods():
    """Get available transfer methods and banks"""
    return {
        "methods": TRANSFER_METHODS,
        "banks": BANKS
    }


@router.get("/transfers/history")
async def get_transfer_history(request: Request):
    """Get transfer history"""
    return {
        "transfers": [
            {
                "id": "txn_1",
                "method": "gcash",
                "method_name": "GCash",
                "recipient": "0917****890",
                "amount": 5000.00,
                "status": "completed",
                "eta": "Delivered",
                "created_at": datetime.utcnow().isoformat()
            },
            {
                "id": "txn_2",
                "method": "instapay",
                "method_name": "InstaPay",
                "recipient": "BPI ****4567",
                "amount": 15000.00,
                "status": "completed",
                "eta": "Delivered",
                "created_at": datetime.utcnow().isoformat()
            }
        ]
    }


@router.post("/transfers/send")
async def create_transfer(request: Request, data: TransferRequest):
    """Create a PHP transfer"""
    method = next((m for m in TRANSFER_METHODS if m["id"] == data.method), None)
    if not method:
        raise HTTPException(status_code=400, detail="Invalid transfer method")
    
    if data.amount <= 0:
        raise HTTPException(status_code=400, detail="Invalid amount")
    
    if method["max_amount"] and data.amount > method["max_amount"]:
        raise HTTPException(status_code=400, detail=f"Amount exceeds {data.method} limit of ₱{method['max_amount']}")
    
    # Mask recipient for display
    recipient_display = data.recipient_account
    if method["type"] == "ewallet":
        recipient_display = data.recipient_account[:4] + "****" + data.recipient_account[-3:]
    elif method["type"] == "bank":
        bank_name = next((b["name"] for b in BANKS if b["code"] == data.bank_code), "Bank")
        recipient_display = f"{bank_name} ****{data.recipient_account[-4:]}"
    
    transaction_id = f"txn_{int(datetime.utcnow().timestamp())}_{random.randint(1000, 9999)}"
    
    return {
        "success": True,
        "transaction_id": transaction_id,
        "method": method["name"],
        "recipient": recipient_display,
        "amount": data.amount,
        "status": "completed" if method["type"] == "ewallet" else "processing",
        "eta": method["eta"],
        "created_at": datetime.utcnow().isoformat()
    }


# === Statements Endpoints ===
@router.get("/statements")
async def get_statements(
    request: Request,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    type: Optional[str] = None,
    currency: Optional[str] = None,
    limit: int = 50
):
    """Get transaction statements"""
    transactions = [
        {
            "id": "txn_001",
            "type": "credit",
            "category": "USD Received",
            "description": "Payment from Acme Corp",
            "currency": "USD",
            "amount": 500.00,
            "created_at": datetime.utcnow().isoformat()
        },
        {
            "id": "txn_002",
            "type": "fx_conversion",
            "category": "FX Conversion",
            "description": "USD → PHP @ 56.12",
            "currency": "PHP",
            "amount": 28060.00,
            "created_at": datetime.utcnow().isoformat()
        },
        {
            "id": "txn_003",
            "type": "bill_payment",
            "category": "Bill Payment",
            "description": "Meralco - 1234567890",
            "currency": "PHP",
            "amount": -3500.00,
            "created_at": datetime.utcnow().isoformat()
        },
        {
            "id": "txn_004",
            "type": "transfer_out",
            "category": "Transfer",
            "description": "GCash to 0917****890",
            "currency": "PHP",
            "amount": -5000.00,
            "created_at": datetime.utcnow().isoformat()
        },
        {
            "id": "txn_005",
            "type": "credit",
            "category": "USD Received",
            "description": "Freelance payment",
            "currency": "USD",
            "amount": 1000.00,
            "created_at": datetime.utcnow().isoformat()
        },
    ]
    
    # Filter by type if specified
    if type:
        transactions = [t for t in transactions if t["type"] == type]
    
    # Filter by currency if specified
    if currency:
        transactions = [t for t in transactions if t["currency"] == currency]
    
    return {
        "transactions": transactions[:limit],
        "total": len(transactions),
        "summary": {
            "total_credits_usd": 1500.00,
            "total_conversions": 28060.00,
            "total_bills_paid": 3500.00,
            "total_transfers": 5000.00
        }
    }


@router.post("/statements/export")
async def export_statement_pdf(request: Request):
    """Export statement as PDF (mock)"""
    return {
        "success": True,
        "message": "Statement PDF generated",
        "download_url": "#",
        "filename": f"PBX_Statement_{datetime.utcnow().strftime('%Y-%m-%d')}.pdf"
    }
