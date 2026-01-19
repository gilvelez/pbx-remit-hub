"""
PBX Admin Routes - Read-Only Audit & Admin Endpoints
Implements admin role-based access control and audit log viewing.

NO UI required - these are API-only endpoints for admin operations.

MVP Roles:
- admin_read: View-only access
- admin_ops: User support operations
- admin_super: Full access (emergency only)

All admin actions are logged to the immutable audit_log collection.
"""

from fastapi import APIRouter, HTTPException, Request, Query
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timezone, timedelta
import logging

from database.connection import get_database
from utils.admin import (
    require_admin,
    write_audit_event,
    get_audit_logs,
    create_adjustment_entry,
    ADMIN_ROLES,
    HIGH_RISK_ACTIONS
)
from utils.ledger import (
    get_transfer_by_tx_id,
    get_ledger_entries_for_tx,
    verify_ledger_integrity
)

router = APIRouter(prefix="/api/admin", tags=["admin"])
logger = logging.getLogger(__name__)


def utc_now():
    return datetime.now(timezone.utc)


def get_user_id_from_headers(request: Request) -> str:
    """Extract user ID from session token"""
    return request.headers.get("X-Session-Token", "")


# ============================================================
# READ-ONLY ENDPOINTS (admin_read and above)
# ============================================================

@router.get("/roles")
async def list_admin_roles(request: Request):
    """List all available admin roles and their permissions"""
    db = get_database()
    await require_admin(db, request, required_permission="read:users")
    
    return {
        "roles": ADMIN_ROLES,
        "high_risk_actions": HIGH_RISK_ACTIONS
    }


@router.get("/users")
async def list_users(
    request: Request,
    limit: int = Query(50, ge=1, le=500),
    skip: int = Query(0, ge=0),
    email: Optional[str] = None,
    user_id: Optional[str] = None
):
    """
    List users with optional filters.
    Requires: admin_read permission
    """
    db = get_database()
    admin_user = await require_admin(db, request, required_permission="read:users")
    
    users_coll = db.users
    
    query = {}
    if email:
        query["email"] = {"$regex": email, "$options": "i"}
    if user_id:
        query["user_id"] = user_id
    
    cursor = users_coll.find(query, {"_id": 0}).skip(skip).limit(limit).sort("created_at", -1)
    users = await cursor.to_list(limit)
    
    total = await users_coll.count_documents(query)
    
    # Log this access
    await write_audit_event(
        db=db,
        actor_user_id=admin_user.get("user_id"),
        actor_role=admin_user.get("admin_role"),
        action="view_users",
        target_type="users_list",
        target_id="*",
        reason="Admin user listing",
        request=request,
        metadata={"filter": query, "count": len(users)}
    )
    
    return {
        "users": users,
        "total": total,
        "limit": limit,
        "skip": skip
    }


@router.get("/users/{user_id}")
async def get_user_detail(request: Request, user_id: str):
    """
    Get detailed user information including profiles and wallet.
    Requires: admin_read permission
    """
    db = get_database()
    admin_user = await require_admin(db, request, required_permission="read:users")
    
    users_coll = db.users
    profiles_coll = db.profiles
    wallets_coll = db.wallets
    
    user = await users_coll.find_one({"user_id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get profiles
    profiles_cursor = profiles_coll.find({"user_id": user_id}, {"_id": 0})
    profiles = await profiles_cursor.to_list(10)
    
    # Get wallet
    wallet = await wallets_coll.find_one({"user_id": user_id}, {"_id": 0})
    
    # Log access
    await write_audit_event(
        db=db,
        actor_user_id=admin_user.get("user_id"),
        actor_role=admin_user.get("admin_role"),
        action="view_user_detail",
        target_type="user",
        target_id=user_id,
        reason="Admin user detail view",
        request=request
    )
    
    return {
        "user": user,
        "profiles": profiles,
        "wallet": wallet
    }


@router.get("/wallets")
async def list_wallets(
    request: Request,
    limit: int = Query(50, ge=1, le=500),
    skip: int = Query(0, ge=0),
    min_balance: Optional[float] = None,
    max_balance: Optional[float] = None
):
    """
    List wallets with optional balance filters.
    Requires: admin_read permission
    """
    db = get_database()
    admin_user = await require_admin(db, request, required_permission="read:wallets")
    
    wallets_coll = db.wallets
    
    query = {}
    if min_balance is not None:
        query["usd_balance"] = {"$gte": min_balance}
    if max_balance is not None:
        if "usd_balance" in query:
            query["usd_balance"]["$lte"] = max_balance
        else:
            query["usd_balance"] = {"$lte": max_balance}
    
    cursor = wallets_coll.find(query, {"_id": 0}).skip(skip).limit(limit)
    wallets = await cursor.to_list(limit)
    
    total = await wallets_coll.count_documents(query)
    
    return {
        "wallets": wallets,
        "total": total,
        "limit": limit,
        "skip": skip
    }


@router.get("/ledger")
async def list_ledger_entries(
    request: Request,
    limit: int = Query(50, ge=1, le=500),
    skip: int = Query(0, ge=0),
    user_id: Optional[str] = None,
    tx_type: Optional[str] = None,
    status: Optional[str] = None
):
    """
    List ledger entries with optional filters.
    Requires: admin_read permission
    """
    db = get_database()
    admin_user = await require_admin(db, request, required_permission="read:ledger")
    
    ledger_coll = db.ledger
    
    query = {}
    if user_id:
        query["user_id"] = user_id
    if tx_type:
        query["type"] = tx_type
    if status:
        query["status"] = status
    
    cursor = ledger_coll.find(query, {"_id": 0}).skip(skip).limit(limit).sort("created_at", -1)
    entries = await cursor.to_list(limit)
    
    total = await ledger_coll.count_documents(query)
    
    return {
        "entries": entries,
        "total": total,
        "limit": limit,
        "skip": skip
    }


@router.get("/ledger-tx")
async def list_ledger_transactions(
    request: Request,
    limit: int = Query(50, ge=1, le=500),
    skip: int = Query(0, ge=0),
    from_user_id: Optional[str] = None,
    to_user_id: Optional[str] = None,
    status: Optional[str] = None
):
    """
    List ledger transaction headers (journal entries).
    Requires: admin_read permission
    """
    db = get_database()
    admin_user = await require_admin(db, request, required_permission="read:ledger")
    
    ledger_tx_coll = db.ledger_tx
    
    query = {}
    if from_user_id:
        query["from_user_id"] = from_user_id
    if to_user_id:
        query["to_user_id"] = to_user_id
    if status:
        query["status"] = status
    
    cursor = ledger_tx_coll.find(query, {"_id": 0}).skip(skip).limit(limit).sort("created_at", -1)
    transactions = await cursor.to_list(limit)
    
    total = await ledger_tx_coll.count_documents(query)
    
    return {
        "transactions": transactions,
        "total": total,
        "limit": limit,
        "skip": skip
    }


@router.get("/transfers/{tx_id}")
async def get_transfer_detail(request: Request, tx_id: str):
    """
    Get detailed transfer information including ledger entries.
    Requires: admin_read permission
    """
    db = get_database()
    admin_user = await require_admin(db, request, required_permission="read:transfers")
    
    # Get transaction header
    transfer = await get_transfer_by_tx_id(db, tx_id)
    if not transfer:
        raise HTTPException(status_code=404, detail="Transfer not found")
    
    # Get ledger entries
    entries = await get_ledger_entries_for_tx(db, tx_id)
    
    # Verify integrity
    integrity = await verify_ledger_integrity(db, tx_id)
    
    # Log access
    await write_audit_event(
        db=db,
        actor_user_id=admin_user.get("user_id"),
        actor_role=admin_user.get("admin_role"),
        action="view_transfer_detail",
        target_type="transfer",
        target_id=tx_id,
        reason="Admin transfer detail view",
        request=request
    )
    
    return {
        "transfer": transfer,
        "ledger_entries": entries,
        "integrity": integrity
    }


@router.get("/audit-logs")
async def list_audit_logs(
    request: Request,
    limit: int = Query(100, ge=1, le=1000),
    skip: int = Query(0, ge=0),
    actor_user_id: Optional[str] = None,
    target_type: Optional[str] = None,
    target_id: Optional[str] = None,
    action: Optional[str] = None,
    days: int = Query(30, ge=1, le=365)
):
    """
    List audit logs with optional filters.
    Requires: admin_read permission
    
    Note: Audit logs are immutable - no update/delete operations available.
    """
    db = get_database()
    admin_user = await require_admin(db, request, required_permission="read:logs")
    
    start_date = utc_now() - timedelta(days=days)
    
    logs = await get_audit_logs(
        db=db,
        actor_user_id=actor_user_id,
        target_type=target_type,
        target_id=target_id,
        action=action,
        start_date=start_date,
        limit=limit,
        skip=skip
    )
    
    return {
        "logs": logs,
        "limit": limit,
        "skip": skip,
        "days": days
    }


# ============================================================
# RECONCILIATION & INTEGRITY ENDPOINTS
# ============================================================

@router.get("/reconciliation/wallet/{user_id}")
async def reconcile_wallet(request: Request, user_id: str):
    """
    Reconcile wallet balance against ledger entries.
    Computes expected balance from ledger and compares to wallet snapshot.
    
    Requires: admin_read permission
    """
    db = get_database()
    admin_user = await require_admin(db, request, required_permission="read:wallets")
    
    wallets_coll = db.wallets
    ledger_coll = db.ledger
    
    # Get current wallet balance
    wallet = await wallets_coll.find_one({"user_id": user_id}, {"_id": 0})
    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")
    
    wallet_usd = wallet.get("usd_balance", 0)
    wallet_php = wallet.get("php_balance", 0)
    
    # Sum ledger entries
    pipeline = [
        {"$match": {"user_id": user_id}},
        {"$group": {
            "_id": "$currency",
            "total": {"$sum": "$amount"}
        }}
    ]
    
    cursor = ledger_coll.aggregate(pipeline)
    ledger_totals = {doc["_id"]: doc["total"] async for doc in cursor}
    
    ledger_usd = ledger_totals.get("USD", 0)
    ledger_php = ledger_totals.get("PHP", 0)
    
    # Check for discrepancies
    usd_diff = abs(wallet_usd - ledger_usd)
    php_diff = abs(wallet_php - ledger_php)
    
    is_balanced = usd_diff < 0.01 and php_diff < 0.01
    
    result = {
        "user_id": user_id,
        "wallet_balances": {
            "usd": wallet_usd,
            "php": wallet_php
        },
        "ledger_computed": {
            "usd": ledger_usd,
            "php": ledger_php
        },
        "discrepancy": {
            "usd": round(wallet_usd - ledger_usd, 2),
            "php": round(wallet_php - ledger_php, 2)
        },
        "is_balanced": is_balanced,
        "status": "ok" if is_balanced else "DISCREPANCY_DETECTED"
    }
    
    # Log reconciliation check
    await write_audit_event(
        db=db,
        actor_user_id=admin_user.get("user_id"),
        actor_role=admin_user.get("admin_role"),
        action="reconciliation_check",
        target_type="wallet",
        target_id=user_id,
        reason="Balance reconciliation check",
        request=request,
        metadata=result
    )
    
    return result


@router.get("/integrity/transfer/{tx_id}")
async def check_transfer_integrity(request: Request, tx_id: str):
    """
    Verify a specific transfer's ledger integrity.
    Checks: debits == credits, exactly 1 header, 2 entries, correct references.
    
    Requires: admin_read permission
    """
    db = get_database()
    await require_admin(db, request, required_permission="read:ledger")
    
    integrity = await verify_ledger_integrity(db, tx_id)
    return integrity


# ============================================================
# ADMIN OPS ENDPOINTS (admin_ops and above)
# ============================================================

class ResendMagicLinkRequest(BaseModel):
    user_id: str
    reason: str = Field(..., min_length=10)


@router.post("/ops/resend-magic-link")
async def admin_resend_magic_link(request: Request, data: ResendMagicLinkRequest):
    """
    Resend magic link for a user.
    Requires: admin_ops permission
    """
    db = get_database()
    admin_user = await require_admin(
        db, request, 
        allowed_roles=["admin_ops", "admin_super"],
        required_permission="write:resend_magic_link"
    )
    
    users_coll = db.users
    
    # Verify user exists
    user = await users_coll.find_one({"user_id": data.user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Log action
    await write_audit_event(
        db=db,
        actor_user_id=admin_user.get("user_id"),
        actor_role=admin_user.get("admin_role"),
        action="resend_magic_link",
        target_type="user",
        target_id=data.user_id,
        reason=data.reason,
        request=request
    )
    
    # TODO: Actually trigger magic link resend via notifications service
    # For now, just return success with audit trail
    
    return {
        "success": True,
        "message": f"Magic link resend requested for user {data.user_id}",
        "user_email": user.get("email")
    }


# ============================================================
# ADMIN SUPER ENDPOINTS (admin_super only - high friction)
# ============================================================

class BalanceAdjustmentRequest(BaseModel):
    target_user_id: str
    currency: str = Field(..., pattern="^(USD|PHP)$")
    amount: float
    reason: str = Field(..., min_length=10)


@router.post("/super/balance-adjustment")
async def admin_balance_adjustment(request: Request, data: BalanceAdjustmentRequest):
    """
    Adjust a user's wallet balance.
    
    REQUIRES: admin_super role
    HIGH FRICTION: Requires detailed reason (10+ chars)
    
    Creates:
    - Ledger entry of type 'adjustment'
    - Immutable audit log with before/after snapshots
    """
    db = get_database()
    admin_user = await require_admin(
        db, request, 
        allowed_roles=["admin_super"]
    )
    
    result = await create_adjustment_entry(
        db=db,
        admin_user_id=admin_user.get("user_id"),
        admin_role=admin_user.get("admin_role"),
        target_user_id=data.target_user_id,
        currency=data.currency,
        amount=data.amount,
        reason=data.reason,
        request=request
    )
    
    return result
