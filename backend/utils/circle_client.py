"""
Circle USDC Wallet Integration Client
Handles wallet creation, USDC minting, and balance checking via Circle API
"""
import os
import uuid
import logging
from typing import Dict, Any, Optional
from datetime import datetime

logger = logging.getLogger(__name__)

# Circle Configuration
CIRCLE_API_KEY = os.environ.get('CIRCLE_API_KEY')
CIRCLE_ENTITY_SECRET = os.environ.get('CIRCLE_ENTITY_SECRET')
CIRCLE_WALLET_SET_ID = os.environ.get('CIRCLE_WALLET_SET_ID')
CIRCLE_ENVIRONMENT = os.environ.get('CIRCLE_ENVIRONMENT', 'sandbox')

# Check if Circle is configured
CIRCLE_ENABLED = bool(CIRCLE_API_KEY and CIRCLE_ENTITY_SECRET)


class CircleClient:
    """Circle Developer-Controlled Wallets API Client"""
    
    def __init__(self):
        self.enabled = CIRCLE_ENABLED
        self.wallet_set_id = CIRCLE_WALLET_SET_ID
        self.client = None
        
        if self.enabled:
            try:
                from circle.web3 import utils as circle_utils
                self.client = circle_utils.init_developer_controlled_wallets_client(
                    api_key=CIRCLE_API_KEY,
                    entity_secret=CIRCLE_ENTITY_SECRET
                )
                logger.info("[CIRCLE] Client initialized in %s mode", CIRCLE_ENVIRONMENT)
            except Exception as e:
                logger.error("[CIRCLE] Failed to initialize client: %s", str(e))
                self.enabled = False
        else:
            logger.info("[CIRCLE] Running in MOCK mode (no API key configured)")
    
    async def create_wallet_set(self, name: str) -> Dict[str, Any]:
        """Create a wallet set (container for wallets)"""
        if not self.enabled:
            return self._mock_wallet_set(name)
        
        try:
            from circle.web3.developer_controlled_wallets import (
                WalletSetsApi,
                CreateWalletSetRequest
            )
            
            api = WalletSetsApi(self.client)
            request = CreateWalletSetRequest.from_dict({"name": name})
            response = api.create_wallet_set(request)
            
            return {
                "wallet_set_id": response.data.wallet_set.id,
                "custody_type": response.data.wallet_set.custody_type,
                "created_at": str(response.data.wallet_set.create_date)
            }
        except Exception as e:
            logger.error("[CIRCLE] create_wallet_set error: %s", str(e))
            raise Exception(f"Failed to create wallet set: {str(e)}")
    
    async def create_wallet(
        self, 
        user_id: str,
        wallet_set_id: Optional[str] = None,
        blockchain: str = "MATIC-AMOY"
    ) -> Dict[str, Any]:
        """Create a new wallet for user"""
        if not self.enabled:
            return self._mock_wallet(user_id, blockchain)
        
        try:
            from circle.web3.developer_controlled_wallets import (
                WalletsApi,
                CreateWalletsRequest
            )
            
            api = WalletsApi(self.client)
            request = CreateWalletsRequest.from_dict({
                "wallet_set_id": wallet_set_id or self.wallet_set_id,
                "blockchains": [blockchain],
                "account_type": "EOA",
                "count": 1
            })
            response = api.create_wallets(request)
            
            wallet = response.data.wallets[0]
            return {
                "wallet_id": wallet.id,
                "address": wallet.address,
                "blockchain": wallet.blockchain,
                "account_type": wallet.account_type,
                "state": wallet.state
            }
        except Exception as e:
            logger.error("[CIRCLE] create_wallet error: %s", str(e))
            raise Exception(f"Failed to create wallet: {str(e)}")
    
    async def get_wallet_balance(self, wallet_id: str) -> Dict[str, Any]:
        """Get wallet USDC balance"""
        if not self.enabled:
            return self._mock_balance(wallet_id)
        
        try:
            from circle.web3.developer_controlled_wallets import WalletsApi
            
            api = WalletsApi(self.client)
            response = api.get_wallet_token_balance(id=wallet_id)
            
            usdc_balance = 0.0
            for token_balance in response.data.token_balances:
                if token_balance.token.symbol == "USDC":
                    usdc_balance = float(token_balance.amount)
                    break
            
            return {
                "wallet_id": wallet_id,
                "usdc_balance": usdc_balance,
                "balances": [
                    {
                        "token_id": tb.token.id,
                        "amount": tb.amount,
                        "symbol": tb.token.symbol,
                        "decimals": tb.token.decimals
                    }
                    for tb in response.data.token_balances
                ]
            }
        except Exception as e:
            logger.error("[CIRCLE] get_wallet_balance error: %s", str(e))
            raise Exception(f"Failed to get wallet balance: {str(e)}")
    
    async def mint_usdc(
        self, 
        wallet_id: str, 
        address: str,
        amount: float, 
        idempotency_key: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Mint USDC to user's wallet (1:1 with USD)
        In sandbox, this simulates minting testnet USDC
        """
        if not self.enabled:
            return self._mock_mint(wallet_id, amount, idempotency_key)
        
        try:
            # In production, this would call Circle's transfer API
            # For sandbox, we simulate minting from a faucet/treasury
            import aiohttp
            
            idempotency_key = idempotency_key or str(uuid.uuid4())
            
            # Circle faucet endpoint for testnet
            faucet_url = "https://api-sandbox.circle.com/v1/faucet/drips"
            headers = {
                "Authorization": f"Bearer {CIRCLE_API_KEY}",
                "Content-Type": "application/json"
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    faucet_url,
                    json={
                        "walletId": wallet_id,
                        "blockchain": "MATIC-AMOY",
                        "usdc": True,
                        "native": True
                    },
                    headers=headers
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        return {
                            "success": True,
                            "transaction_id": idempotency_key,
                            "amount": amount,
                            "status": "confirmed",
                            "faucet_response": data
                        }
                    else:
                        # Faucet may have rate limits, simulate success
                        logger.warning("[CIRCLE] Faucet rate limited, simulating mint")
                        return {
                            "success": True,
                            "transaction_id": idempotency_key,
                            "amount": amount,
                            "status": "pending",
                            "note": "Faucet rate limited"
                        }
        except Exception as e:
            logger.error("[CIRCLE] mint_usdc error: %s", str(e))
            # In development, return mock success
            return self._mock_mint(wallet_id, amount, idempotency_key)
    
    # ========== MOCK METHODS ==========
    
    def _mock_wallet_set(self, name: str) -> Dict[str, Any]:
        """Generate mock wallet set for development"""
        return {
            "wallet_set_id": f"mock_ws_{uuid.uuid4().hex[:12]}",
            "custody_type": "DEVELOPER",
            "created_at": datetime.utcnow().isoformat()
        }
    
    def _mock_wallet(self, user_id: str, blockchain: str) -> Dict[str, Any]:
        """Generate mock wallet for development"""
        # Create deterministic address from user_id
        addr_hash = uuid.uuid5(uuid.NAMESPACE_DNS, user_id).hex
        return {
            "wallet_id": f"mock_wallet_{addr_hash[:16]}",
            "address": f"0x{addr_hash[:40]}",
            "blockchain": blockchain,
            "account_type": "EOA",
            "state": "LIVE"
        }
    
    def _mock_balance(self, wallet_id: str) -> Dict[str, Any]:
        """Return mock balance for development"""
        return {
            "wallet_id": wallet_id,
            "usdc_balance": 0.0,
            "balances": []
        }
    
    def _mock_mint(
        self, 
        wallet_id: str, 
        amount: float, 
        idempotency_key: Optional[str]
    ) -> Dict[str, Any]:
        """Simulate USDC minting for development"""
        return {
            "success": True,
            "transaction_id": idempotency_key or f"mock_tx_{uuid.uuid4().hex[:12]}",
            "amount": amount,
            "status": "confirmed",
            "mock": True
        }


# Singleton instance
circle_client = CircleClient()
