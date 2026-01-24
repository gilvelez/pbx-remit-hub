"""
PBX Recipient - Wallet, FX, Bills, Transfers, Statements APIs
For Philippine-based users receiving USD income

Database Collections:
- wallets: User wallet balances (USD, PHP, sub_wallets)
- ledger: All transaction records (credits, conversions, bills, transfers)
- saved_billers: User's saved biller accounts
"""
from fastapi import APIRouter, HTTPException, status, Request, Response
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import random
import logging
import os
import httpx

from database.connection import get_database

router = APIRouter(prefix="/api/recipient", tags=["recipient"])
logger = logging.getLogger(__name__)

# === FX Configuration ===
OPENEXCHANGERATES_API_KEY = os.environ.get("OPENEXCHANGERATES_API_KEY", "")
OPENEXCHANGERATES_BASE_URL = "https://openexchangerates.org/api"
FX_API_TIMEOUT = 10.0  # seconds

# === Constants ===
PBX_SPREAD_BPS = 50  # 0.50% spread
BANK_SPREAD_BPS = 250  # 2.5% typical bank spread
RATE_LOCK_DURATION_SECONDS = 15 * 60  # 15 minutes
MOCK_FX_RATE = 56.25  # Fallback USD/PHP rate when API unavailable

# === Static Reference Data ===
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

# === Default wallet for NEW users - starts at $0 ===
# NO HARDCODED DEMO BALANCES - users start with $0
DEFAULT_WALLET = {
    "usd_balance": 0.00,
    "php_balance": 0.00,
    "sub_wallets": {
        "bills": 0.00,
        "savings": 0.00,
        "family": 0.00,
    }
}


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


class SaveBillerRequest(BaseModel):
    biller_code: str
    account_no: str
    nickname: str = ""


# === Helper Functions ===
async def fetch_live_fx_rate() -> tuple[float, str]:
    """
    Fetch live USD/PHP rate from OpenExchangeRates API.
    Returns tuple of (rate, source) where source is 'live' or 'mock'.
    Falls back to mock rate if API is unavailable.
    """
    if not OPENEXCHANGERATES_API_KEY:
        logger.warning("OPENEXCHANGERATES_API_KEY not configured, using mock rate")
        return MOCK_FX_RATE, "mock"
    
    try:
        async with httpx.AsyncClient(timeout=FX_API_TIMEOUT) as client:
            response = await client.get(
                f"{OPENEXCHANGERATES_BASE_URL}/latest.json",
                params={
                    "app_id": OPENEXCHANGERATES_API_KEY,
                    "base": "USD",
                    "symbols": "PHP"
                }
            )
            response.raise_for_status()
            
            data = response.json()
            
            if "rates" not in data or "PHP" not in data["rates"]:
                logger.error("Invalid response structure from OpenExchangeRates API")
                return MOCK_FX_RATE, "mock"
            
            rate = float(data["rates"]["PHP"])
            logger.info(f"Fetched live FX rate: 1 USD = {rate} PHP")
            return rate, "live"
            
    except httpx.TimeoutException:
        logger.warning("OpenExchangeRates API timeout, using mock rate")
        return MOCK_FX_RATE, "mock"
    except httpx.HTTPError as e:
        logger.warning(f"OpenExchangeRates API HTTP error: {e}, using mock rate")
        return MOCK_FX_RATE, "mock"
    except Exception as e:
        logger.warning(f"OpenExchangeRates API error: {e}, using mock rate")
        return MOCK_FX_RATE, "mock"


def get_mock_mid_market_rate():
    """Get mock mid-market rate with slight fluctuation (fallback only)"""
    fluctuation = (random.random() - 0.5) * 0.3
    return round(MOCK_FX_RATE + fluctuation, 2)


def get_user_id_from_headers(request: Request) -> str:
    """Extract user ID from session token"""
    token = request.headers.get("X-Session-Token", "")
    if not token:
        return None
    return token[:36]


def utc_now():
    """Get current UTC time"""
    return datetime.now(timezone.utc)


async def get_or_create_wallet(db, user_id: str) -> dict:
    """Get existing wallet or create new one with default balances"""
    wallets = db.wallets
    
    wallet = await wallets.find_one({"user_id": user_id}, {"_id": 0})
    
    if not wallet:
        # Create new wallet with default balances
        now = utc_now()
        wallet = {
            "user_id": user_id,
            "usd_balance": DEFAULT_WALLET["usd_balance"],
            "php_balance": DEFAULT_WALLET["php_balance"],
            "sub_wallets": DEFAULT_WALLET["sub_wallets"].copy(),
            "created_at": now,
            "updated_at": now
        }
        await wallets.insert_one(wallet)
        wallet.pop("_id", None)
        logger.info(f"Created new wallet for user: {user_id}")
    
    return wallet


async def record_transaction(db, user_id: str, txn_type: str, category: str, 
                            description: str, currency: str, amount: float,
                            metadata: dict = None) -> str:
    """Record a transaction in the ledger"""
    ledger = db.ledger
    
    now = utc_now()
    txn_id = f"{txn_type[:4]}_{int(now.timestamp())}_{random.randint(1000, 9999)}"
    
    transaction = {
        "txn_id": txn_id,
        "user_id": user_id,
        "type": txn_type,
        "category": category,
        "description": description,
        "currency": currency,
        "amount": amount,
        "status": "completed",
        "created_at": now,
        "metadata": metadata or {}
    }
    
    await ledger.insert_one(transaction)
    logger.info(f"Recorded transaction: {txn_id} for user {user_id}")
    
    return txn_id


# === Wallet Endpoints ===
@router.get("/wallet")
async def get_wallet(request: Request):
    """Get wallet balances for current user from MongoDB"""
    user_id = get_user_id_from_headers(request)
    
    if not user_id:
        raise HTTPException(status_code=401, detail="No session token provided")
    
    try:
        db = get_database()
        wallet = await get_or_create_wallet(db, user_id)
        
        return WalletResponse(
            user_id=user_id,
            usd_balance=wallet["usd_balance"],
            php_balance=wallet["php_balance"],
            sub_wallets=wallet.get("sub_wallets", {}),
            updated_at=wallet.get("updated_at", utc_now()).isoformat() if isinstance(wallet.get("updated_at"), datetime) else str(wallet.get("updated_at", utc_now()))
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting wallet: {e}")
        raise HTTPException(status_code=500, detail="Failed to get wallet")


# === Test Funding (Simulation Only) ===
class FundWalletRequest(BaseModel):
    amount: float = Field(..., gt=0, le=5000, description="Amount to fund (max $5,000)")


@router.post("/wallet/fund")
async def fund_wallet_simulation(request: Request, data: FundWalletRequest):
    """
    [DEV/DEMO ONLY] Simulate funding the USD wallet.
    
    This is for testing purposes only - no real money is involved.
    Funds are credited to the USD wallet and recorded in the ledger
    with type "simulated_credit".
    
    Max funding per request: $5,000
    """
    user_id = get_user_id_from_headers(request)
    
    if not user_id:
        raise HTTPException(status_code=401, detail="No session token provided")
    
    if data.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")
    
    if data.amount > 5000:
        raise HTTPException(status_code=400, detail="Maximum funding amount is $5,000 per request")
    
    try:
        db = get_database()
        wallets = db.wallets
        
        # Ensure wallet exists
        await get_or_create_wallet(db, user_id)
        
        now = utc_now()
        
        # Credit USD wallet
        result = await wallets.update_one(
            {"user_id": user_id},
            {
                "$inc": {"usd_balance": data.amount},
                "$set": {"updated_at": now}
            }
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=500, detail="Failed to credit wallet")
        
        # Record in ledger with clear simulation flag
        txn_id = await record_transaction(
            db, user_id,
            txn_type="simulated_credit",
            category="Test Funding",
            description=f"Demo credit - ${data.amount:.2f} USD (simulation only)",
            currency="USD",
            amount=data.amount,  # Positive for incoming
            metadata={
                "is_simulation": True,
                "note": "DEV/DEMO ONLY - Not real funds"
            }
        )
        
        # Get updated wallet
        wallet = await wallets.find_one({"user_id": user_id}, {"_id": 0})
        
        logger.info(f"[SIMULATION] Wallet funded: user_id={user_id}, amount=${data.amount}")
        
        return {
            "success": True,
            "transaction_id": txn_id,
            "amount": data.amount,
            "currency": "USD",
            "new_balance": wallet["usd_balance"],
            "is_simulation": True,
            "message": "Test funding completed (simulation only - no real money)"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error funding wallet: {e}")
        raise HTTPException(status_code=500, detail="Failed to fund wallet")


# === FX Conversion Endpoints ===
@router.get("/convert")
async def get_fx_quote(amount_usd: float = 100):
    """Get current FX quote with rate comparison using live OpenExchangeRates API"""
    # Fetch live mid-market rate (with fallback to mock)
    mid_rate, fx_source = await fetch_live_fx_rate()
    
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
        timestamp=int(utc_now().timestamp() * 1000),
        source=fx_source
    )


@router.post("/convert/lock")
async def lock_fx_rate(request: Request, data: LockRateRequest):
    """Lock an FX rate for 15 minutes (read-only - no Redis/TTL yet)"""
    user_id = get_user_id_from_headers(request)
    
    if not user_id:
        raise HTTPException(status_code=401, detail="No session token provided")
    
    # Fetch live rate for locking
    mid_rate, fx_source = await fetch_live_fx_rate()
    pbx_spread = mid_rate * (PBX_SPREAD_BPS / 10000)
    pbx_rate = data.locked_rate or round(mid_rate - pbx_spread, 2)
    
    lock_id = f"lock_{int(utc_now().timestamp())}_{random.randint(1000, 9999)}"
    expires_at = utc_now().timestamp() + RATE_LOCK_DURATION_SECONDS
    
    return {
        "success": True,
        "lock_id": lock_id,
        "rate": pbx_rate,
        "source": fx_source,
        "expires_at": datetime.fromtimestamp(expires_at, tz=timezone.utc).isoformat(),
        "expires_in_seconds": RATE_LOCK_DURATION_SECONDS
    }


@router.post("/convert/execute")
async def execute_conversion(request: Request, data: ConvertRequest):
    """Execute USD → PHP conversion with real wallet update and live FX rate"""
    user_id = get_user_id_from_headers(request)
    
    if not user_id:
        raise HTTPException(status_code=401, detail="No session token provided")
    
    if data.amount_usd <= 0:
        raise HTTPException(status_code=400, detail="Invalid amount")
    
    try:
        db = get_database()
        wallets = db.wallets
        
        # Get current wallet
        wallet = await get_or_create_wallet(db, user_id)
        
        # Check sufficient USD balance
        if wallet["usd_balance"] < data.amount_usd:
            raise HTTPException(status_code=400, detail="Insufficient USD balance")
        
        # Get live FX rate (or use locked rate if provided)
        mid_rate, fx_source = await fetch_live_fx_rate()
        pbx_spread = mid_rate * (PBX_SPREAD_BPS / 10000)
        rate = data.locked_rate or round(mid_rate - pbx_spread, 2)
        amount_php = round(data.amount_usd * rate, 2)
        
        now = utc_now()
        
        # Update wallet balances atomically
        result = await wallets.update_one(
            {"user_id": user_id, "usd_balance": {"$gte": data.amount_usd}},
            {
                "$inc": {
                    "usd_balance": -data.amount_usd,
                    "php_balance": amount_php
                },
                "$set": {"updated_at": now}
            }
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=400, detail="Insufficient USD balance or concurrent update")
        
        # Record transaction in ledger
        txn_id = await record_transaction(
            db, user_id,
            txn_type="fx_conversion",
            category="FX Conversion",
            description=f"USD → PHP @ {rate}",
            currency="PHP",
            amount=amount_php,
            metadata={
                "from_currency": "USD",
                "from_amount": data.amount_usd,
                "rate": rate,
                "fx_source": fx_source,  # Track if rate was live or mock for auditability
                "lock_id": data.lock_id
            }
        )
        
        logger.info(f"Conversion executed: {user_id} converted ${data.amount_usd} to ₱{amount_php} @ {rate} ({fx_source})")
        
        return {
            "success": True,
            "transaction_id": txn_id,
            "from_amount": data.amount_usd,
            "from_currency": "USD",
            "to_amount": amount_php,
            "to_currency": "PHP",
            "rate": rate,
            "fx_source": fx_source,
            "status": "completed"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error executing conversion: {e}")
        raise HTTPException(status_code=500, detail="Failed to execute conversion")


# === Bills Endpoints ===
@router.get("/bills/billers")
async def get_billers():
    """Get list of supported billers (static reference data)"""
    return {"billers": BILLERS}


@router.get("/bills/saved")
async def get_saved_billers(request: Request):
    """Get user's saved billers from MongoDB"""
    user_id = get_user_id_from_headers(request)
    
    if not user_id:
        raise HTTPException(status_code=401, detail="No session token provided")
    
    try:
        db = get_database()
        saved_billers = db.saved_billers
        
        billers = await saved_billers.find(
            {"user_id": user_id},
            {"_id": 0, "user_id": 0}
        ).to_list(50)
        
        return {"saved_billers": billers}
        
    except Exception as e:
        logger.error(f"Error getting saved billers: {e}")
        raise HTTPException(status_code=500, detail="Failed to get saved billers")


@router.post("/bills/save")
async def save_biller(request: Request, data: SaveBillerRequest):
    """Save a biller for quick access"""
    user_id = get_user_id_from_headers(request)
    
    if not user_id:
        raise HTTPException(status_code=401, detail="No session token provided")
    
    # Validate biller code
    biller = next((b for b in BILLERS if b["code"] == data.biller_code), None)
    if not biller:
        raise HTTPException(status_code=400, detail="Invalid biller code")
    
    try:
        db = get_database()
        saved_billers = db.saved_billers
        
        now = utc_now()
        biller_id = f"saved_{int(now.timestamp())}_{random.randint(100, 999)}"
        
        saved_biller = {
            "id": biller_id,
            "user_id": user_id,
            "biller_code": data.biller_code,
            "biller_name": biller["name"],
            "account_no": data.account_no,
            "nickname": data.nickname or biller["name"],
            "created_at": now
        }
        
        await saved_billers.insert_one(saved_biller)
        saved_biller.pop("_id", None)
        saved_biller.pop("user_id", None)
        
        return {"success": True, "saved_biller": saved_biller}
        
    except Exception as e:
        logger.error(f"Error saving biller: {e}")
        raise HTTPException(status_code=500, detail="Failed to save biller")


@router.get("/bills/history")
async def get_bill_history(request: Request):
    """Get bill payment history from ledger"""
    user_id = get_user_id_from_headers(request)
    
    if not user_id:
        raise HTTPException(status_code=401, detail="No session token provided")
    
    try:
        db = get_database()
        ledger = db.ledger
        
        payments = await ledger.find(
            {"user_id": user_id, "type": "bill_payment"},
            {"_id": 0, "user_id": 0}
        ).sort("created_at", -1).limit(50).to_list(50)
        
        # Format response
        formatted = []
        for p in payments:
            formatted.append({
                "id": p.get("txn_id"),
                "biller_code": p.get("metadata", {}).get("biller_code"),
                "biller_name": p.get("metadata", {}).get("biller_name"),
                "account_no": p.get("metadata", {}).get("account_no"),
                "amount": abs(p.get("amount", 0)),
                "status": p.get("status"),
                "paid_at": p.get("created_at").isoformat() if isinstance(p.get("created_at"), datetime) else str(p.get("created_at"))
            })
        
        return {"payments": formatted}
        
    except Exception as e:
        logger.error(f"Error getting bill history: {e}")
        raise HTTPException(status_code=500, detail="Failed to get bill history")


@router.post("/bills/pay")
async def pay_bill(request: Request, data: PayBillRequest):
    """Pay a bill from PHP wallet with real balance update"""
    user_id = get_user_id_from_headers(request)
    
    if not user_id:
        raise HTTPException(status_code=401, detail="No session token provided")
    
    # Validate biller
    biller = next((b for b in BILLERS if b["code"] == data.biller_code), None)
    if not biller:
        raise HTTPException(status_code=400, detail="Invalid biller")
    
    if data.amount <= 0:
        raise HTTPException(status_code=400, detail="Invalid amount")
    
    try:
        db = get_database()
        wallets = db.wallets
        
        # Get current wallet
        wallet = await get_or_create_wallet(db, user_id)
        
        # Check sufficient PHP balance
        if wallet["php_balance"] < data.amount:
            raise HTTPException(status_code=400, detail="Insufficient PHP balance")
        
        now = utc_now()
        
        # Deduct from PHP wallet atomically
        result = await wallets.update_one(
            {"user_id": user_id, "php_balance": {"$gte": data.amount}},
            {
                "$inc": {"php_balance": -data.amount},
                "$set": {"updated_at": now}
            }
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=400, detail="Insufficient PHP balance or concurrent update")
        
        # Record transaction
        txn_id = await record_transaction(
            db, user_id,
            txn_type="bill_payment",
            category="Bill Payment",
            description=f"{biller['name']} - {data.account_no}",
            currency="PHP",
            amount=-data.amount,  # Negative for outgoing
            metadata={
                "biller_code": data.biller_code,
                "biller_name": biller["name"],
                "account_no": data.account_no
            }
        )
        
        # Optionally save biller
        if data.save_biller:
            saved_billers = db.saved_billers
            existing = await saved_billers.find_one({
                "user_id": user_id,
                "biller_code": data.biller_code,
                "account_no": data.account_no
            })
            if not existing:
                await saved_billers.insert_one({
                    "id": f"saved_{int(now.timestamp())}_{random.randint(100, 999)}",
                    "user_id": user_id,
                    "biller_code": data.biller_code,
                    "biller_name": biller["name"],
                    "account_no": data.account_no,
                    "nickname": data.nickname or biller["name"],
                    "created_at": now
                })
        
        logger.info(f"Bill paid: {user_id} paid ₱{data.amount} to {biller['name']}")
        
        return {
            "success": True,
            "transaction_id": txn_id,
            "biller_name": biller["name"],
            "account_no": data.account_no,
            "amount": data.amount,
            "status": "paid",
            "paid_at": now.isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error paying bill: {e}")
        raise HTTPException(status_code=500, detail="Failed to pay bill")


# === Transfers Endpoints ===
@router.get("/transfers/methods")
async def get_transfer_methods():
    """Get available transfer methods and banks (static reference data)"""
    return {
        "methods": TRANSFER_METHODS,
        "banks": BANKS
    }


@router.get("/transfers/history")
async def get_transfer_history(request: Request):
    """Get transfer history from ledger"""
    user_id = get_user_id_from_headers(request)
    
    if not user_id:
        raise HTTPException(status_code=401, detail="No session token provided")
    
    try:
        db = get_database()
        ledger = db.ledger
        
        transfers = await ledger.find(
            {"user_id": user_id, "type": "transfer_out"},
            {"_id": 0, "user_id": 0}
        ).sort("created_at", -1).limit(50).to_list(50)
        
        # Format response
        formatted = []
        for t in transfers:
            meta = t.get("metadata", {})
            formatted.append({
                "id": t.get("txn_id"),
                "method": meta.get("method"),
                "method_name": meta.get("method_name"),
                "recipient": meta.get("recipient_display"),
                "amount": abs(t.get("amount", 0)),
                "status": t.get("status"),
                "eta": meta.get("eta"),
                "created_at": t.get("created_at").isoformat() if isinstance(t.get("created_at"), datetime) else str(t.get("created_at"))
            })
        
        return {"transfers": formatted}
        
    except Exception as e:
        logger.error(f"Error getting transfer history: {e}")
        raise HTTPException(status_code=500, detail="Failed to get transfer history")


@router.post("/transfers/send")
async def create_transfer(request: Request, data: TransferRequest):
    """Create a PHP transfer with real balance update (payout is mocked)"""
    user_id = get_user_id_from_headers(request)
    
    if not user_id:
        raise HTTPException(status_code=401, detail="No session token provided")
    
    # Validate method
    method = next((m for m in TRANSFER_METHODS if m["id"] == data.method), None)
    if not method:
        raise HTTPException(status_code=400, detail="Invalid transfer method")
    
    if data.amount <= 0:
        raise HTTPException(status_code=400, detail="Invalid amount")
    
    if method["max_amount"] and data.amount > method["max_amount"]:
        raise HTTPException(status_code=400, detail=f"Amount exceeds {data.method} limit of ₱{method['max_amount']}")
    
    try:
        db = get_database()
        wallets = db.wallets
        
        # Get current wallet
        wallet = await get_or_create_wallet(db, user_id)
        
        # Check sufficient PHP balance
        if wallet["php_balance"] < data.amount:
            raise HTTPException(status_code=400, detail="Insufficient PHP balance")
        
        # Mask recipient for display
        recipient_display = data.recipient_account
        if method["type"] == "ewallet":
            if len(data.recipient_account) > 7:
                recipient_display = data.recipient_account[:4] + "****" + data.recipient_account[-3:]
        elif method["type"] == "bank":
            bank_name = next((b["name"] for b in BANKS if b["code"] == data.bank_code), "Bank")
            if len(data.recipient_account) >= 4:
                recipient_display = f"{bank_name} ****{data.recipient_account[-4:]}"
        
        now = utc_now()
        
        # Deduct from PHP wallet atomically
        result = await wallets.update_one(
            {"user_id": user_id, "php_balance": {"$gte": data.amount}},
            {
                "$inc": {"php_balance": -data.amount},
                "$set": {"updated_at": now}
            }
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=400, detail="Insufficient PHP balance or concurrent update")
        
        # Determine status (e-wallets instant, bank transfers processing)
        status = "completed" if method["type"] == "ewallet" else "processing"
        
        # Record transaction
        txn_id = await record_transaction(
            db, user_id,
            txn_type="transfer_out",
            category="Transfer",
            description=f"{method['name']} to {recipient_display}",
            currency="PHP",
            amount=-data.amount,  # Negative for outgoing
            metadata={
                "method": data.method,
                "method_name": method["name"],
                "recipient_account": data.recipient_account,
                "recipient_name": data.recipient_name,
                "recipient_display": recipient_display,
                "bank_code": data.bank_code,
                "eta": method["eta"],
                "status": status
            }
        )
        
        # In production: Call actual payout API (GCash, InstaPay, etc.)
        
        logger.info(f"Transfer created: {user_id} sent ₱{data.amount} via {method['name']}")
        
        return {
            "success": True,
            "transaction_id": txn_id,
            "method": method["name"],
            "recipient": recipient_display,
            "amount": data.amount,
            "status": status,
            "eta": method["eta"],
            "created_at": now.isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating transfer: {e}")
        raise HTTPException(status_code=500, detail="Failed to create transfer")


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
    """Get transaction statements from ledger"""
    user_id = get_user_id_from_headers(request)
    
    if not user_id:
        raise HTTPException(status_code=401, detail="No session token provided")
    
    try:
        db = get_database()
        ledger = db.ledger
        
        # Build query
        query = {"user_id": user_id}
        
        if type:
            query["type"] = type
        if currency:
            query["currency"] = currency
        
        # Date filters
        if start_date or end_date:
            query["created_at"] = {}
            if start_date:
                query["created_at"]["$gte"] = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            if end_date:
                query["created_at"]["$lte"] = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        
        # Fetch transactions
        transactions = await ledger.find(
            query,
            {"_id": 0, "user_id": 0, "metadata": 0}
        ).sort("created_at", -1).limit(limit).to_list(limit)
        
        # Format response
        formatted = []
        for t in transactions:
            formatted.append({
                "id": t.get("txn_id"),
                "type": t.get("type"),
                "category": t.get("category"),
                "description": t.get("description"),
                "currency": t.get("currency"),
                "amount": t.get("amount"),
                "created_at": t.get("created_at").isoformat() if isinstance(t.get("created_at"), datetime) else str(t.get("created_at"))
            })
        
        # Calculate summary from all user transactions
        pipeline = [
            {"$match": {"user_id": user_id}},
            {"$group": {
                "_id": "$type",
                "total": {"$sum": "$amount"}
            }}
        ]
        summary_cursor = ledger.aggregate(pipeline)
        summary_data = await summary_cursor.to_list(10)
        
        summary = {
            "total_credits_usd": 0,
            "total_conversions": 0,
            "total_bills_paid": 0,
            "total_transfers": 0
        }
        for s in summary_data:
            if s["_id"] == "credit":
                summary["total_credits_usd"] = abs(s["total"])
            elif s["_id"] == "fx_conversion":
                summary["total_conversions"] = abs(s["total"])
            elif s["_id"] == "bill_payment":
                summary["total_bills_paid"] = abs(s["total"])
            elif s["_id"] == "transfer_out":
                summary["total_transfers"] = abs(s["total"])
        
        return {
            "transactions": formatted,
            "total": len(formatted),
            "summary": summary
        }
        
    except Exception as e:
        logger.error(f"Error getting statements: {e}")
        raise HTTPException(status_code=500, detail="Failed to get statements")


@router.post("/statements/export")
async def export_statement_pdf(request: Request):
    """Export statement as PDF (mock - would generate real PDF in production)"""
    user_id = get_user_id_from_headers(request)
    
    if not user_id:
        raise HTTPException(status_code=401, detail="No session token provided")
    
    return {
        "success": True,
        "message": "Statement PDF generated",
        "download_url": "#",
        "filename": f"PBX_Statement_{utc_now().strftime('%Y-%m-%d')}.pdf"
    }
