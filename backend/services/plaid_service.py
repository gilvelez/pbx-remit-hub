"""
Plaid client factory - switches between mock and real Plaid based on PLAID_MODE env var.
"""

import os
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
import logging

from utils.plaid_mock import (
    generate_link_token,
    generate_access_token,
    generate_item_id,
    generate_mock_accounts,
    generate_mock_transactions
)

logger = logging.getLogger(__name__)

# Lazy import plaid to avoid errors if not installed in mock mode
_plaid_client = None


def get_plaid_mode() -> str:
    """Get Plaid mode from environment (MOCK or SANDBOX)."""
    return os.environ.get('PLAID_MODE', 'MOCK').upper()


def get_plaid_client():
    """
    Get Plaid client based on PLAID_MODE.
    Returns None if in MOCK mode.
    """
    global _plaid_client
    
    mode = get_plaid_mode()
    
    if mode == 'MOCK':
        return None
    
    if mode == 'SANDBOX' and _plaid_client is None:
        try:
            import plaid
            from plaid.api import plaid_api
            from plaid.model.products import Products
            from plaid.model.country_code import CountryCode
            
            client_id = os.environ.get('PLAID_CLIENT_ID')
            secret = os.environ.get('PLAID_SECRET')
            env = os.environ.get('PLAID_ENV', 'sandbox')
            
            if not client_id or not secret:
                raise ValueError("PLAID_CLIENT_ID and PLAID_SECRET must be set for SANDBOX mode")
            
            # Map environment string to Plaid environment
            plaid_env_map = {
                'sandbox': plaid.Environment.Sandbox,
                'development': plaid.Environment.Development,
                'production': plaid.Environment.Production
            }
            
            configuration = plaid.Configuration(
                host=plaid_env_map.get(env, plaid.Environment.Sandbox),
                api_key={
                    'clientId': client_id,
                    'secret': secret,
                }
            )
            
            api_client = plaid.ApiClient(configuration)
            _plaid_client = plaid_api.PlaidApi(api_client)
            
            logger.info(f"Initialized Plaid client in {env} mode")
            
        except ImportError:
            logger.error("Plaid SDK not installed. Install with: pip install plaid-python")
            raise
        except Exception as e:
            logger.error(f"Failed to initialize Plaid client: {e}")
            raise
    
    return _plaid_client


class PlaidService:
    """
    Unified Plaid service that works with both mock and real Plaid.
    Response shapes are consistent regardless of mode.
    """
    
    def __init__(self):
        self.mode = get_plaid_mode()
        self.client = get_plaid_client()
        logger.info(f"PlaidService initialized in {self.mode} mode")
    
    async def create_link_token(self, user_id: str) -> Dict[str, Any]:
        """
        Create a link token for Plaid Link.
        Returns: { link_token: str, expiration: str }
        """
        if self.mode == 'MOCK':
            return generate_link_token()
        
        try:
            from plaid.model.link_token_create_request import LinkTokenCreateRequest
            from plaid.model.link_token_create_request_user import LinkTokenCreateRequestUser
            from plaid.model.products import Products
            from plaid.model.country_code import CountryCode
            
            request = LinkTokenCreateRequest(
                user=LinkTokenCreateRequestUser(client_user_id=user_id),
                client_name="PBX - Philippine Bayani Exchange",
                products=[Products("auth"), Products("transactions")],
                country_codes=[CountryCode("US")],
                language='en'
            )
            
            response = self.client.link_token_create(request)
            
            return {
                "link_token": response['link_token'],
                "expiration": response['expiration']
            }
        except Exception as e:
            logger.error(f"Error creating link token: {e}")
            raise
    
    async def exchange_public_token(self, public_token: str) -> Dict[str, Any]:
        """
        Exchange public token for access token.
        Returns: { access_token: str, item_id: str }
        """
        if self.mode == 'MOCK':
            return {
                "access_token": generate_access_token(),
                "item_id": generate_item_id()
            }
        
        try:
            from plaid.model.item_public_token_exchange_request import ItemPublicTokenExchangeRequest
            
            request = ItemPublicTokenExchangeRequest(public_token=public_token)
            response = self.client.item_public_token_exchange(request)
            
            return {
                "access_token": response['access_token'],
                "item_id": response['item_id']
            }
        except Exception as e:
            logger.error(f"Error exchanging public token: {e}")
            raise
    
    async def get_accounts(self, access_token: str) -> Dict[str, Any]:
        """
        Get accounts for access token.
        Returns: { accounts: List[Dict] }
        """
        if self.mode == 'MOCK':
            return {"accounts": generate_mock_accounts()}
        
        try:
            from plaid.model.accounts_get_request import AccountsGetRequest
            
            request = AccountsGetRequest(access_token=access_token)
            response = self.client.accounts_get(request)
            
            # Transform to match mock format
            accounts = []
            for account in response['accounts']:
                accounts.append({
                    "account_id": account['account_id'],
                    "name": account['name'],
                    "mask": account.get('mask'),
                    "subtype": account.get('subtype'),
                    "type": account['type'],
                    "balances": {
                        "current": account['balances'].get('current'),
                        "available": account['balances'].get('available'),
                        "limit": account['balances'].get('limit'),
                        "iso_currency_code": account['balances'].get('iso_currency_code'),
                        "unofficial_currency_code": account['balances'].get('unofficial_currency_code')
                    }
                })
            
            return {"accounts": accounts}
        except Exception as e:
            logger.error(f"Error getting accounts: {e}")
            raise
    
    async def get_transactions(self, access_token: str, limit: int = 10) -> Dict[str, Any]:
        """
        Get transactions for access token.
        Returns: { transactions: List[Dict] }
        """
        if self.mode == 'MOCK':
            # For mock, we need account IDs from somewhere - generate them
            mock_accounts = generate_mock_accounts()
            account_ids = [acc["account_id"] for acc in mock_accounts]
            return {"transactions": generate_mock_transactions(account_ids, limit)}
        
        try:
            from plaid.model.transactions_sync_request import TransactionsSyncRequest
            
            # Use transactions sync for latest transactions
            request = TransactionsSyncRequest(access_token=access_token)
            response = self.client.transactions_sync(request)
            
            # Get added transactions and limit them
            transactions = response.get('added', [])[:limit]
            
            # Transform to match mock format
            formatted_transactions = []
            for tx in transactions:
                formatted_transactions.append({
                    "transaction_id": tx['transaction_id'],
                    "account_id": tx['account_id'],
                    "amount": tx['amount'],
                    "date": tx['date'],
                    "authorized_date": tx.get('authorized_date'),
                    "name": tx['name'],
                    "merchant_name": tx.get('merchant_name'),
                    "category": tx.get('category', []),
                    "category_id": tx.get('category_id'),
                    "pending": tx.get('pending', False),
                    "iso_currency_code": tx.get('iso_currency_code'),
                    "unofficial_currency_code": tx.get('unofficial_currency_code'),
                    "payment_channel": tx.get('payment_channel')
                })
            
            return {"transactions": formatted_transactions}
        except Exception as e:
            logger.error(f"Error getting transactions: {e}")
            raise


# Singleton instance
_plaid_service = None


def get_plaid_service() -> PlaidService:
    """Get or create PlaidService singleton."""
    global _plaid_service
    if _plaid_service is None:
        _plaid_service = PlaidService()
    return _plaid_service
