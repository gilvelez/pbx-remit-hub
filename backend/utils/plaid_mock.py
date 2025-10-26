from datetime import datetime, timedelta
from typing import List, Dict, Any
import random
import uuid

def generate_link_token() -> Dict[str, Any]:
    """Generate a mock Plaid link token."""
    return {
        "link_token": f"link-sandbox-{uuid.uuid4().hex[:16]}",
        "expiration": (datetime.utcnow() + timedelta(hours=1)).isoformat() + "Z"
    }

def generate_access_token() -> str:
    """Generate a mock Plaid access token."""
    return f"access-sandbox-{uuid.uuid4().hex[:20]}"

def generate_item_id() -> str:
    """Generate a mock Plaid item ID."""
    return f"item-sandbox-{uuid.uuid4().hex[:16]}"

def generate_mock_accounts() -> List[Dict[str, Any]]:
    """Generate realistic mock bank accounts."""
    accounts = [
        {
            "account_id": f"acc_{uuid.uuid4().hex[:8]}",
            "name": "Plaid Checking",
            "mask": "0000",
            "subtype": "checking",
            "type": "depository",
            "balances": {
                "current": 1250.00,
                "available": 1200.00,
                "limit": None,
                "iso_currency_code": "USD",
                "unofficial_currency_code": None
            }
        },
        {
            "account_id": f"acc_{uuid.uuid4().hex[:8]}",
            "name": "Plaid Savings",
            "mask": "1111",
            "subtype": "savings",
            "type": "depository",
            "balances": {
                "current": 5420.50,
                "available": 5420.50,
                "limit": None,
                "iso_currency_code": "USD",
                "unofficial_currency_code": None
            }
        },
        {
            "account_id": f"acc_{uuid.uuid4().hex[:8]}",
            "name": "Plaid Credit Card",
            "mask": "3333",
            "subtype": "credit card",
            "type": "credit",
            "balances": {
                "current": 420.00,
                "available": 7580.00,
                "limit": 8000.00,
                "iso_currency_code": "USD",
                "unofficial_currency_code": None
            }
        }
    ]
    return accounts

def generate_mock_transactions(account_ids: List[str], limit: int = 10) -> List[Dict[str, Any]]:
    """Generate realistic mock transactions."""
    
    # Transaction templates for realistic data
    transaction_templates = [
        # Groceries
        {"name": "Whole Foods Market", "category": ["Shops", "Food and Drink", "Groceries"], "amount": -85.32},
        {"name": "Trader Joe's", "category": ["Shops", "Food and Drink", "Groceries"], "amount": -42.18},
        {"name": "Safeway", "category": ["Shops", "Food and Drink", "Groceries"], "amount": -67.45},
        
        # Bills
        {"name": "PG&E Electric Bill", "category": ["Payment", "Utilities"], "amount": -125.50},
        {"name": "AT&T Wireless", "category": ["Payment", "Phone"], "amount": -89.99},
        {"name": "Comcast Cable", "category": ["Payment", "Cable"], "amount": -79.99},
        
        # Remittances (positive for demo - money in before sending)
        {"name": "Direct Deposit - Salary", "category": ["Transfer", "Deposit"], "amount": 2500.00},
        {"name": "Zelle Transfer", "category": ["Transfer", "Credit"], "amount": 150.00},
        
        # Restaurants
        {"name": "Chipotle Mexican Grill", "category": ["Food and Drink", "Restaurants"], "amount": -15.84},
        {"name": "Starbucks", "category": ["Food and Drink", "Coffee Shop"], "amount": -6.75},
        
        # Shopping
        {"name": "Amazon.com", "category": ["Shops", "Online"], "amount": -42.99},
        {"name": "Target", "category": ["Shops", "Retail"], "amount": -78.23},
        
        # Transportation
        {"name": "Shell Gas Station", "category": ["Travel", "Gas Stations"], "amount": -52.00},
        {"name": "Uber", "category": ["Travel", "Taxi"], "amount": -18.50},
    ]
    
    transactions = []
    base_date = datetime.utcnow()
    
    for i in range(min(limit, len(transaction_templates))):
        template = transaction_templates[i]
        transaction_date = (base_date - timedelta(days=i * 2)).date()
        
        transaction = {
            "transaction_id": f"tx_{uuid.uuid4().hex[:12]}",
            "account_id": random.choice(account_ids) if account_ids else f"acc_{uuid.uuid4().hex[:8]}",
            "amount": template["amount"],
            "date": transaction_date.isoformat(),
            "authorized_date": transaction_date.isoformat(),
            "name": template["name"],
            "merchant_name": template["name"],
            "category": template["category"],
            "category_id": str(random.randint(10000000, 99999999)),
            "pending": False,
            "iso_currency_code": "USD",
            "unofficial_currency_code": None,
            "payment_channel": "in store" if template["amount"] < 0 else "online"
        }
        transactions.append(transaction)
    
    return transactions
