"""
PBX Admin Utilities - Role-Based Access Control & Audit Logging
Implements admin authentication, authorization, and immutable audit trail.

Roles:
- admin_read: View-only access to users, wallets, ledger, logs
- admin_ops: Manage payouts, user support (reset MFA, resend magic links)
- admin_compliance: Review KYC/KYB flags, approve/deny
- admin_finance: View fees/revenue dashboards
- admin_super: Emergency full access (highest friction)

Audit Log: Immutable append-only collection for all admin actions.
"""

from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from fastapi import HTTPException, Request
import uuid
import logging

logger = logging.getLogger(__name__)


def utc_now():
    """Return current UTC datetime"""
    return datetime.now(timezone.utc)


# Role definitions with allowed permissions
ADMIN_ROLES = {
    "admin_read": {
        "description": "Read-only access to users, wallets, ledger, logs",
        "permissions": ["read:users", "read:wallets", "read:ledger", "read:logs", "read:transfers"]
    },
    "admin_ops": {
        "description": "Manage external payout issues, user support actions",
        "permissions": [
            "read:users", "read:wallets", "read:ledger", "read:logs", "read:transfers",
            "write:payout_retry", "write:user_support", "write:resend_magic_link", "write:reset_mfa"
        ]
    },
    "admin_compliance": {
        "description": "Review KYC/KYB flags, approve/deny",
        "permissions": [
            "read:users", "read:wallets", "read:ledger", "read:logs",
            "read:kyc", "write:kyc_decision"
        ]
    },
    "admin_finance": {
        "description": "View fees/revenue dashboards, export accounting",
        "permissions": [
            "read:users", "read:ledger", "read:logs",
            "read:fees", "read:revenue", "export:accounting"
        ]
    },
    "admin_super": {
        "description": "Emergency full access (highest friction required)",
        "permissions": ["*"],  # All permissions
        "requires_reason": True,
        "high_friction": True
    }
}

# High-risk actions that require admin_super and extra logging
HIGH_RISK_ACTIONS = [
    "balance_adjustment",
    "transfer_reversal",
    "compliance_override",
    "bank_details_change",
    "account_termination",
    "limits_override"
]


def generate_audit_id() -> str:
    """Generate unique audit log ID"""
    return f"aud_{uuid.uuid4().hex[:16]}"


async def get_admin_user(db, request: Request) -> Optional[Dict[str, Any]]:
    """
    Get admin user from request session.
    Returns user dict with admin info if valid admin, None otherwise.
    """
    user_id = request.headers.get("X-Session-Token", "")
    if not user_id:
        return None
    
    users = db.users
    user = await users.find_one(
        {"user_id": user_id, "is_admin": True},
        {"_id": 0}
    )
    return user


def check_permission(admin_role: str, required_permission: str) -> bool:
    """
    Check if an admin role has a specific permission.
    """
    if admin_role not in ADMIN_ROLES:
        return False
    
    role_info = ADMIN_ROLES[admin_role]
    permissions = role_info.get("permissions", [])
    
    # Super admin has all permissions
    if "*" in permissions:
        return True
    
    return required_permission in permissions


async def require_admin(
    db,
    request: Request,
    allowed_roles: Optional[List[str]] = None,
    required_permission: Optional[str] = None
) -> Dict[str, Any]:
    """
    Middleware helper to require admin access.
    
    Args:
        db: Database instance
        request: FastAPI Request object
        allowed_roles: List of roles allowed (if None, any admin role)
        required_permission: Specific permission required
        
    Returns:
        Admin user dict if authorized
        
    Raises:
        HTTPException 401/403 if not authorized
    """
    admin_user = await get_admin_user(db, request)
    
    if not admin_user:
        raise HTTPException(
            status_code=401,
            detail="Admin authentication required"
        )
    
    admin_role = admin_user.get("admin_role")
    
    if not admin_role:
        raise HTTPException(
            status_code=403,
            detail="User is not assigned an admin role"
        )
    
    # Check allowed roles
    if allowed_roles and admin_role not in allowed_roles:
        # admin_super can bypass role restrictions
        if admin_role != "admin_super":
            raise HTTPException(
                status_code=403,
                detail=f"This action requires one of these roles: {', '.join(allowed_roles)}"
            )
    
    # Check specific permission
    if required_permission and not check_permission(admin_role, required_permission):
        raise HTTPException(
            status_code=403,
            detail=f"Missing required permission: {required_permission}"
        )
    
    return admin_user


async def write_audit_event(
    db,
    actor_user_id: str,
    actor_role: str,
    action: str,
    target_type: str,
    target_id: str,
    reason: str,
    before: Optional[Dict[str, Any]] = None,
    after: Optional[Dict[str, Any]] = None,
    request: Optional[Request] = None,
    metadata: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Write an immutable audit log entry.
    
    Args:
        db: Database instance
        actor_user_id: User who performed the action
        actor_role: Admin role of the actor
        action: Action performed (e.g., "balance_adjustment", "payout_retry")
        target_type: Type of target (e.g., "user", "transfer", "wallet")
        target_id: ID of the target entity
        reason: Required explanation for the action
        before: State before the action (optional)
        after: State after the action (optional)
        request: FastAPI request for IP/User-Agent (optional)
        metadata: Additional metadata (optional)
        
    Returns:
        The created audit log entry
        
    Raises:
        HTTPException if reason is insufficient for high-risk actions
    """
    # Validate reason for high-risk actions
    if action in HIGH_RISK_ACTIONS:
        if not reason or len(reason.strip()) < 10:
            raise HTTPException(
                status_code=400,
                detail=f"High-risk action '{action}' requires a reason of at least 10 characters"
            )
    
    now = utc_now()
    audit_id = generate_audit_id()
    
    # Extract request info
    ip_address = None
    user_agent = None
    if request:
        ip_address = request.client.host if request.client else None
        user_agent = request.headers.get("User-Agent")
    
    audit_entry = {
        "audit_id": audit_id,
        "actor_user_id": actor_user_id,
        "actor_role": actor_role,
        "action": action,
        "target_type": target_type,
        "target_id": target_id,
        "reason": reason,
        "before": before,
        "after": after,
        "ip": ip_address,
        "user_agent": user_agent,
        "metadata": metadata or {},
        "created_at": now
    }
    
    audit_log = db.audit_log
    await audit_log.insert_one(audit_entry)
    
    logger.info(f"Audit event: {audit_id} - {action} by {actor_user_id} on {target_type}/{target_id}")
    
    # Remove _id before returning
    audit_entry.pop("_id", None)
    return audit_entry


async def get_audit_logs(
    db,
    actor_user_id: Optional[str] = None,
    target_type: Optional[str] = None,
    target_id: Optional[str] = None,
    action: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    limit: int = 100,
    skip: int = 0
) -> List[Dict[str, Any]]:
    """
    Query audit logs with filters.
    Read-only - no modifications allowed.
    """
    audit_log = db.audit_log
    
    query = {}
    if actor_user_id:
        query["actor_user_id"] = actor_user_id
    if target_type:
        query["target_type"] = target_type
    if target_id:
        query["target_id"] = target_id
    if action:
        query["action"] = action
    if start_date or end_date:
        query["created_at"] = {}
        if start_date:
            query["created_at"]["$gte"] = start_date
        if end_date:
            query["created_at"]["$lte"] = end_date
    
    cursor = audit_log.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit)
    return await cursor.to_list(limit)


async def setup_audit_indexes(db):
    """
    Create indexes for audit_log collection.
    Should be called on application startup.
    """
    try:
        audit_log = db.audit_log
        
        # Unique audit_id
        await audit_log.create_index(
            "audit_id",
            unique=True,
            name="idx_audit_id"
        )
        
        # Query by actor
        await audit_log.create_index(
            [("actor_user_id", 1), ("created_at", -1)],
            name="idx_audit_actor"
        )
        
        # Query by target
        await audit_log.create_index(
            [("target_type", 1), ("target_id", 1), ("created_at", -1)],
            name="idx_audit_target"
        )
        
        # Query by action type
        await audit_log.create_index(
            [("action", 1), ("created_at", -1)],
            name="idx_audit_action"
        )
        
        # Time-based queries
        await audit_log.create_index(
            "created_at",
            name="idx_audit_created"
        )
        
        logger.info("Audit log indexes created successfully")
        return True
        
    except Exception as e:
        logger.warning(f"Audit index creation warning (may already exist): {e}")
        return False


async def create_adjustment_entry(
    db,
    admin_user_id: str,
    admin_role: str,
    target_user_id: str,
    currency: str,
    amount: float,
    reason: str,
    request: Optional[Request] = None
) -> Dict[str, Any]:
    """
    Create a balance adjustment with full audit trail.
    Only admin_super can perform this action.
    
    This creates:
    1. A ledger entry of type 'adjustment'
    2. An audit log entry with before/after snapshots
    3. Updates the wallet balance
    """
    if admin_role != "admin_super":
        raise HTTPException(
            status_code=403,
            detail="Balance adjustments require admin_super role"
        )
    
    if not reason or len(reason.strip()) < 10:
        raise HTTPException(
            status_code=400,
            detail="Balance adjustment requires detailed reason (min 10 characters)"
        )
    
    now = utc_now()
    wallets = db.wallets
    ledger = db.ledger
    
    balance_field = "usd_balance" if currency == "USD" else "php_balance"
    
    # Get before state
    wallet_before = await wallets.find_one({"user_id": target_user_id}, {"_id": 0})
    balance_before = wallet_before.get(balance_field, 0) if wallet_before else 0
    
    # Create adjustment tx_id
    tx_id = f"adj_{uuid.uuid4().hex[:12]}"
    
    # Create ledger entry
    ledger_entry = {
        "tx_id": tx_id,
        "ledger_tx_id": tx_id,
        "user_id": target_user_id,
        "type": "adjustment",
        "entry_type": "adjustment",
        "currency": currency,
        "amount": amount,
        "adjustment_reason": reason,
        "adjusted_by": admin_user_id,
        "status": "completed",
        "created_at": now
    }
    
    await ledger.insert_one(ledger_entry)
    
    # Update wallet
    if wallet_before:
        await wallets.update_one(
            {"user_id": target_user_id},
            {"$inc": {balance_field: amount}, "$set": {"updated_at": now}}
        )
    else:
        # Create wallet
        await wallets.insert_one({
            "user_id": target_user_id,
            balance_field: amount,
            "created_at": now,
            "updated_at": now
        })
    
    # Get after state
    wallet_after = await wallets.find_one({"user_id": target_user_id}, {"_id": 0})
    balance_after = wallet_after.get(balance_field, 0) if wallet_after else 0
    
    # Write audit log
    audit_entry = await write_audit_event(
        db=db,
        actor_user_id=admin_user_id,
        actor_role=admin_role,
        action="balance_adjustment",
        target_type="wallet",
        target_id=target_user_id,
        reason=reason,
        before={"balance": balance_before, "currency": currency},
        after={"balance": balance_after, "currency": currency},
        request=request,
        metadata={"tx_id": tx_id, "amount": amount}
    )
    
    logger.info(f"Balance adjustment: {tx_id} - {target_user_id} {currency} {amount:+.2f} by {admin_user_id}")
    
    return {
        "tx_id": tx_id,
        "audit_id": audit_entry.get("audit_id"),
        "target_user_id": target_user_id,
        "currency": currency,
        "amount": amount,
        "balance_before": balance_before,
        "balance_after": balance_after,
        "reason": reason
    }
