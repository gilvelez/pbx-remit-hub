"""
PBX Ledger Utilities - Atomic Transactions & Idempotency
Implements double-entry accounting with idempotency keys for money-movement safety.

Collections:
- ledger_tx: Journal header (one per transfer)
- ledger: Individual postings (debit/credit lines)
- wallets: Balance snapshot (derived from ledger)
"""

from datetime import datetime, timezone
from typing import Optional, Dict, Any, Tuple
from fastapi import HTTPException, Request
import uuid
import logging

logger = logging.getLogger(__name__)


def utc_now():
    """Return current UTC datetime"""
    return datetime.now(timezone.utc)


def generate_tx_id() -> str:
    """Generate unique transaction ID"""
    return f"pbx_{uuid.uuid4().hex[:16]}"


def get_idempotency_key(request: Request) -> Optional[str]:
    """
    Extract idempotency key from request headers.
    Header: Idempotency-Key: <uuid or client-generated key>
    """
    return request.headers.get("Idempotency-Key") or request.headers.get("idempotency-key")


async def check_idempotency(db, idempotency_key: str) -> Optional[Dict[str, Any]]:
    """
    Check if this idempotency key has been used before.
    Returns the existing transaction if found, None otherwise.
    """
    if not idempotency_key:
        return None
    
    ledger_tx = db.ledger_tx
    existing = await ledger_tx.find_one(
        {"idempotency_key": idempotency_key},
        {"_id": 0}
    )
    return existing


async def check_idempotency_collision(
    db, 
    idempotency_key: str, 
    amount: float, 
    from_user_id: str, 
    to_user_id: str
) -> bool:
    """
    Check if the same idempotency key is being used with different parameters.
    This is a collision and should be rejected (409 Conflict).
    
    Returns True if there's a collision (same key, different body).
    """
    if not idempotency_key:
        return False
    
    ledger_tx = db.ledger_tx
    existing = await ledger_tx.find_one(
        {"idempotency_key": idempotency_key},
        {"_id": 0}
    )
    
    if not existing:
        return False
    
    # Check if parameters match
    if (existing.get("amount") != amount or 
        existing.get("from_user_id") != from_user_id or 
        existing.get("to_user_id") != to_user_id):
        return True
    
    return False


async def create_transfer_atomic(
    db,
    from_user_id: str,
    to_user_id: str,
    amount: float,
    currency: str = "USD",
    note: Optional[str] = None,
    idempotency_key: Optional[str] = None,
    transfer_type: str = "pbx_transfer",
    metadata: Optional[Dict[str, Any]] = None
) -> Tuple[Dict[str, Any], bool]:
    """
    Create an atomic PBX-to-PBX transfer using MongoDB transactions.
    
    This function:
    1. Checks idempotency (returns existing tx if duplicate)
    2. Validates sender has sufficient balance
    3. Creates ledger_tx header
    4. Creates two ledger entries (debit + credit)
    5. Updates both wallets atomically
    
    Returns:
        Tuple of (transaction_result, is_duplicate)
        - transaction_result: The ledger_tx document
        - is_duplicate: True if this was a duplicate request (idempotent replay)
    
    Raises:
        HTTPException: On validation failures or insufficient balance
    """
    now = utc_now()
    
    # Check idempotency first - return existing if duplicate
    if idempotency_key:
        existing = await check_idempotency(db, idempotency_key)
        if existing:
            # Check for collision (same key, different body)
            if (existing.get("amount") != amount or 
                existing.get("from_user_id") != from_user_id or 
                existing.get("to_user_id") != to_user_id):
                raise HTTPException(
                    status_code=409,
                    detail={
                        "error": "idempotency_collision",
                        "message": "This idempotency key was already used with different parameters",
                        "original_tx_id": existing.get("tx_id")
                    }
                )
            # Same request repeated - return original result (idempotent replay)
            logger.info(f"Idempotent replay detected: {idempotency_key} -> {existing.get('tx_id')}")
            return existing, True
    
    # Validate amount
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than 0")
    
    if amount > 5000:
        raise HTTPException(status_code=400, detail="Amount exceeds single transaction limit of $5,000")
    
    # Self-transfer check
    if from_user_id == to_user_id:
        raise HTTPException(status_code=400, detail="Cannot transfer to yourself")
    
    # Get collections
    wallets = db.wallets
    ledger = db.ledger
    ledger_tx = db.ledger_tx
    
    # DO NOT check balance here - do it atomically in the update operation
    # This prevents race conditions where balance changes between check and update
    
    # Ensure sender wallet exists (but don't check balance yet)
    sender_wallet = await wallets.find_one({"user_id": from_user_id})
    if not sender_wallet:
        # Auto-create wallet with 0 balance
        sender_wallet = {
            "user_id": from_user_id,
            "usd_balance": 0.0,
            "php_balance": 0.0,
            "created_at": now,
            "updated_at": now
        }
        await wallets.insert_one(sender_wallet)
        # New wallet has 0 balance - will fail balance check below
        sender_wallet = await wallets.find_one({"user_id": from_user_id})
    
    balance_field = "usd_balance" if currency == "USD" else "php_balance"
    
    # Quick pre-check for user feedback (not authoritative - atomic check is in update)
    current_balance = sender_wallet.get(balance_field, 0)
    if current_balance < amount:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "insufficient_balance",
                "message": f"Insufficient balance. Available: {currency} {current_balance:.2f}, Required: {currency} {amount:.2f}",
                "available": current_balance,
                "required": amount,
                "currency": currency
            }
        )
    
    # Ensure recipient wallet exists
    recipient_wallet = await wallets.find_one({"user_id": to_user_id})
    if not recipient_wallet:
        recipient_wallet = {
            "user_id": to_user_id,
            "usd_balance": 0.0,
            "php_balance": 0.0,
            "created_at": now,
            "updated_at": now
        }
        await wallets.insert_one(recipient_wallet)
    
    # Generate transaction ID
    tx_id = generate_tx_id()
    
    # Prepare documents
    # 1. Ledger TX header (journal entry)
    ledger_tx_doc = {
        "tx_id": tx_id,
        "idempotency_key": idempotency_key,
        "type": transfer_type,
        "currency": currency,
        "amount": amount,
        "from_user_id": from_user_id,
        "to_user_id": to_user_id,
        "status": "completed",
        "note": note,
        "metadata": metadata or {},
        "created_at": now,
        "updated_at": now
    }
    
    # 2. Ledger entries (debit + credit)
    debit_entry = {
        "ledger_tx_id": tx_id,
        "tx_id": tx_id,
        "user_id": from_user_id,
        "type": "internal_transfer_out",
        "entry_type": "debit",
        "currency": currency,
        "amount": -amount,
        "counterparty_user_id": to_user_id,
        "note": note,
        "status": "completed",
        "created_at": now
    }
    
    credit_entry = {
        "ledger_tx_id": tx_id,
        "tx_id": tx_id,
        "user_id": to_user_id,
        "type": "internal_transfer_in",
        "entry_type": "credit",
        "currency": currency,
        "amount": amount,
        "counterparty_user_id": from_user_id,
        "note": note,
        "status": "completed",
        "created_at": now
    }
    
    # Execute atomic transaction using MongoDB session
    # Note: This requires MongoDB replica set. For standalone, we use optimistic approach.
    try:
        # Try transaction approach first (requires replica set)
        async with await db.client.start_session() as session:
            async with session.start_transaction():
                # Insert ledger_tx header
                await ledger_tx.insert_one(ledger_tx_doc, session=session)
                
                # Insert ledger entries
                await ledger.insert_one(debit_entry, session=session)
                await ledger.insert_one(credit_entry, session=session)
                
                # Update sender wallet (debit)
                result = await wallets.update_one(
                    {
                        "user_id": from_user_id,
                        f"{balance_field}": {"$gte": amount}  # Ensure still has balance
                    },
                    {"$inc": {balance_field: -amount}, "$set": {"updated_at": now}},
                    session=session
                )
                
                if result.modified_count == 0:
                    raise HTTPException(
                        status_code=400,
                        detail="Insufficient balance (concurrent modification)"
                    )
                
                # Update recipient wallet (credit)
                await wallets.update_one(
                    {"user_id": to_user_id},
                    {"$inc": {balance_field: amount}, "$set": {"updated_at": now}},
                    session=session
                )
                
                logger.info(f"Transfer completed atomically: {tx_id} ({from_user_id} -> {to_user_id}, {currency} {amount})")
        
        return ledger_tx_doc, False
        
    except Exception as e:
        # Check if it's a transaction not supported error (standalone MongoDB)
        error_str = str(e).lower()
        if "transaction" in error_str and ("replica" in error_str or "not supported" in error_str):
            logger.warning("MongoDB transactions not available, falling back to sequential writes")
            return await _create_transfer_sequential(
                db, ledger_tx, ledger, wallets,
                ledger_tx_doc, debit_entry, credit_entry,
                from_user_id, to_user_id, amount, balance_field, now, tx_id
            )
        raise


async def _create_transfer_sequential(
    db, ledger_tx, ledger, wallets,
    ledger_tx_doc, debit_entry, credit_entry,
    from_user_id, to_user_id, amount, balance_field, now, tx_id
):
    """
    Fallback for environments without replica set.
    Uses optimistic concurrency with balance check.
    """
    try:
        # Insert ledger_tx header first (idempotency protection)
        await ledger_tx.insert_one(ledger_tx_doc)
        
        # Update sender wallet with balance check
        result = await wallets.update_one(
            {
                "user_id": from_user_id,
                f"{balance_field}": {"$gte": amount}
            },
            {"$inc": {balance_field: -amount}, "$set": {"updated_at": now}}
        )
        
        if result.modified_count == 0:
            # Rollback: mark ledger_tx as failed
            await ledger_tx.update_one(
                {"tx_id": tx_id},
                {"$set": {"status": "failed", "failure_reason": "insufficient_balance_concurrent", "updated_at": now}}
            )
            raise HTTPException(
                status_code=400,
                detail="Insufficient balance (concurrent modification)"
            )
        
        # Insert ledger entries
        await ledger.insert_one(debit_entry)
        await ledger.insert_one(credit_entry)
        
        # Update recipient wallet
        await wallets.update_one(
            {"user_id": to_user_id},
            {"$inc": {balance_field: amount}, "$set": {"updated_at": now}}
        )
        
        logger.info(f"Transfer completed sequentially: {tx_id} ({from_user_id} -> {to_user_id})")
        return ledger_tx_doc, False
        
    except HTTPException:
        raise
    except Exception as e:
        # Log error and attempt to mark transaction as failed
        logger.error(f"Transfer failed: {tx_id} - {str(e)}")
        try:
            await ledger_tx.update_one(
                {"tx_id": tx_id},
                {"$set": {"status": "failed", "failure_reason": str(e), "updated_at": now}}
            )
        except Exception:
            pass
        raise HTTPException(status_code=500, detail="Transfer failed due to system error")


async def get_transfer_by_tx_id(db, tx_id: str) -> Optional[Dict[str, Any]]:
    """Get a transfer by its transaction ID"""
    ledger_tx = db.ledger_tx
    return await ledger_tx.find_one({"tx_id": tx_id}, {"_id": 0})


async def get_ledger_entries_for_tx(db, tx_id: str) -> list:
    """Get all ledger entries for a transaction"""
    ledger = db.ledger
    cursor = ledger.find({"ledger_tx_id": tx_id}, {"_id": 0})
    return await cursor.to_list(10)


async def verify_ledger_integrity(db, tx_id: str) -> Dict[str, Any]:
    """
    Verify a transaction's ledger integrity:
    - sum(debits) == sum(credits)
    - Exactly one header per transfer
    - Entries reference ledger_tx_id
    
    Returns verification result with any discrepancies.
    """
    ledger_tx = db.ledger_tx
    ledger = db.ledger
    
    # Get header
    header = await ledger_tx.find_one({"tx_id": tx_id}, {"_id": 0})
    if not header:
        return {"valid": False, "error": "No ledger_tx header found"}
    
    # Get entries
    cursor = ledger.find({"ledger_tx_id": tx_id}, {"_id": 0})
    entries = await cursor.to_list(10)
    
    if len(entries) != 2:
        return {
            "valid": False,
            "error": f"Expected 2 entries, found {len(entries)}",
            "entries_count": len(entries)
        }
    
    # Sum amounts (should be 0 for balanced entries)
    total = sum(e.get("amount", 0) for e in entries)
    
    if abs(total) > 0.001:  # Allow tiny floating point variance
        return {
            "valid": False,
            "error": "Ledger entries do not balance",
            "total": total,
            "entries": entries
        }
    
    # Check entries reference correct tx
    for entry in entries:
        if entry.get("ledger_tx_id") != tx_id:
            return {
                "valid": False,
                "error": "Entry does not reference correct ledger_tx_id",
                "entry": entry
            }
    
    return {
        "valid": True,
        "tx_id": tx_id,
        "header": header,
        "entries": entries,
        "sum": total
    }


async def setup_ledger_indexes(db):
    """
    Create necessary indexes for ledger collections.
    Should be called on application startup.
    """
    try:
        # Unique index on idempotency_key (sparse to allow null)
        await db.ledger_tx.create_index(
            "idempotency_key",
            unique=True,
            sparse=True,
            name="idx_ledger_tx_idempotency_key"
        )
        
        # Unique index on tx_id
        await db.ledger_tx.create_index(
            "tx_id",
            unique=True,
            name="idx_ledger_tx_tx_id"
        )
        
        # Index for querying by user
        await db.ledger_tx.create_index(
            [("from_user_id", 1), ("created_at", -1)],
            name="idx_ledger_tx_from_user"
        )
        await db.ledger_tx.create_index(
            [("to_user_id", 1), ("created_at", -1)],
            name="idx_ledger_tx_to_user"
        )
        
        # Ledger entries indexes
        await db.ledger.create_index(
            "ledger_tx_id",
            name="idx_ledger_tx_ref"
        )
        await db.ledger.create_index(
            [("user_id", 1), ("created_at", -1)],
            name="idx_ledger_user_created"
        )
        
        # Compound unique index to prevent duplicate entries
        await db.ledger.create_index(
            [("tx_id", 1), ("user_id", 1), ("entry_type", 1)],
            unique=True,
            name="idx_ledger_unique_entry"
        )
        
        logger.info("Ledger indexes created successfully")
        return True
        
    except Exception as e:
        logger.warning(f"Index creation warning (may already exist): {e}")
        return False
