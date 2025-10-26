import random
import string
from datetime import datetime

def generate_transaction_id(prefix: str = "txn", length: int = 10) -> str:
    """
    Generate a transaction ID similar to nanoid.
    Format: {prefix}_{random_alphanumeric}
    
    Args:
        prefix: Prefix for the transaction ID
        length: Length of random part (default 10)
    
    Returns:
        Transaction ID string
    """
    # Use alphanumeric characters (similar to nanoid default alphabet)
    alphabet = string.ascii_letters + string.digits
    random_part = ''.join(random.choices(alphabet, k=length))
    return f"{prefix}_{random_part}"

def calculate_php_transfer(amount_usd: float, quoted_rate: float = 56.10, fee_usd: float = 1.00) -> dict:
    """
    Calculate PHP transfer details.
    
    Args:
        amount_usd: Amount in USD to send
        quoted_rate: USD to PHP exchange rate (default 56.10)
        fee_usd: Transfer fee in USD (default 1.00)
    
    Returns:
        Dictionary with calculated values
    """
    est_php = round(amount_usd * quoted_rate, 2)
    total_usd = round(amount_usd + fee_usd, 2)
    
    return {
        "amount_usd": amount_usd,
        "quoted_rate": quoted_rate,
        "est_php": est_php,
        "fee_usd": fee_usd,
        "total_usd": total_usd
    }

def format_destination_tag(destination_type: str, tag: str) -> str:
    """
    Format destination tag for display.
    
    Args:
        destination_type: "GCash" or "PH_BANK"
        tag: Destination identifier (phone number, account number, etc.)
    
    Returns:
        Formatted destination string
    """
    if destination_type == "GCash":
        return f"GCash: {tag}"
    elif destination_type == "PH_BANK":
        return f"Bank Account: {tag}"
    else:
        return tag
