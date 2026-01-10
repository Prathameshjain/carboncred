"""
Blockchain Service Layer for CarbonCred

This module provides the interface between Django backend and the blockchain.
Handles all smart contract interactions for credit minting, marketplace, etc.
"""

from web3 import Web3
from typing import Optional, Dict, Any
from datetime import datetime
import logging

from .blockchain_config import (
    ALCHEMY_URL,
    PRIVATE_KEY,
    CONTRACT_ADDRESS,
    CHAIN_ID,
    BLOCKCHAIN_ENABLED,
    CONTRACT_ABI,
    load_full_abi
)

logger = logging.getLogger(__name__)


class BlockchainService:
    """
    Service class for interacting with CarbonCredToken smart contract.
    
    Usage:
        from blockchain.services.contract_service import blockchain_service
        
        # Mint credits after verification
        tx_hash = blockchain_service.mint_credits(
            owner_wallet='0x...',
            amount=100,
            project_id=123,
            vintage_year=2025
        )
    """

    def __init__(self):
        self.enabled = BLOCKCHAIN_ENABLED
        self.w3 = None
        self.contract = None
        self.account = None
        
        if self.enabled:
            self._initialize_web3()
    
    def _initialize_web3(self):
        """Initialize Web3 connection and contract instance."""
        try:
            # Connect to Alchemy/Infura
            self.w3 = Web3(Web3.HTTPProvider(ALCHEMY_URL))
            
            # Note: PoA middleware is not needed for Sepolia with web3 v7+
            
            if not self.w3.is_connected():
                logger.error("Failed to connect to blockchain network")
                self.enabled = False
                return
            
            # Load account from private key
            self.account = self.w3.eth.account.from_key(PRIVATE_KEY)
            
            # Load contract
            abi = load_full_abi() if load_full_abi() else CONTRACT_ABI
            self.contract = self.w3.eth.contract(
                address=Web3.to_checksum_address(CONTRACT_ADDRESS),
                abi=abi
            )
            
            logger.info(f"Blockchain service initialized. Network: {CHAIN_ID}")
            
        except Exception as e:
            logger.error(f"Failed to initialize blockchain service: {e}")
            self.enabled = False


    def _send_transaction(self, tx_function) -> Optional[str]:
        """
        Build, sign, and send a transaction.
        
        Args:
            tx_function: Contract function to call
            
        Returns:
            Transaction hash if successful, None otherwise
        """
        if not self.enabled:
            logger.warning("Blockchain service not enabled, skipping transaction")
            return None
        
        try:
            # Build transaction
            nonce = self.w3.eth.get_transaction_count(self.account.address)
            
            tx = tx_function.build_transaction({
                'from': self.account.address,
                'nonce': nonce,
                'gas': 500000,  # Estimate, will be adjusted
                'gasPrice': self.w3.eth.gas_price,
                'chainId': CHAIN_ID
            })
            
            # Estimate gas
            try:
                estimated_gas = self.w3.eth.estimate_gas(tx)
                tx['gas'] = int(estimated_gas * 1.2)  # 20% buffer
            except Exception as e:
                logger.warning(f"Gas estimation failed, using default: {e}")
            
            # Sign transaction
            signed_tx = self.w3.eth.account.sign_transaction(tx, PRIVATE_KEY)
            
            # Send transaction
            tx_hash = self.w3.eth.send_raw_transaction(signed_tx.raw_transaction)
            
            # Wait for receipt
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
            
            if receipt.status == 1:
                # Ensure hash has 0x prefix for Etherscan compatibility
                tx_hash_hex = tx_hash.hex()
                if not tx_hash_hex.startswith('0x'):
                    tx_hash_hex = '0x' + tx_hash_hex
                logger.info(f"Transaction successful: {tx_hash_hex}")
                return tx_hash_hex
            else:
                logger.error(f"Transaction failed: {tx_hash.hex()}")
                return None
                
        except Exception as e:
            logger.error(f"Transaction error: {e}")
            return None

    # ==================== CREDIT ISSUANCE ====================

    def mint_credits(
        self,
        owner_wallet: str,
        amount: int,
        project_id: int,
        vintage_year: int = None
    ) -> Optional[str]:
        """
        Mint credits to a wallet after ML verification.
        
        Args:
            owner_wallet: MetaMask wallet address of project owner
            amount: Number of credits to mint (integer, will be scaled to 18 decimals)
            project_id: Django Project model ID
            vintage_year: Year for vintage tracking (defaults to current year)
            
        Returns:
            Transaction hash if successful, None otherwise
        """
        if not self.enabled:
            logger.info(f"[MOCK] Would mint {amount} credits to {owner_wallet} for project {project_id}")
            return f"mock_tx_{project_id}_{amount}"
        
        if not vintage_year:
            vintage_year = datetime.now().year
        
        try:
            checksum_wallet = Web3.to_checksum_address(owner_wallet)
            
            tx_function = self.contract.functions.mintVerifiedCredits(
                checksum_wallet,
                amount,
                project_id,
                vintage_year
            )
            
            return self._send_transaction(tx_function)
            
        except Exception as e:
            logger.error(f"Error minting credits: {e}")
            return None

    # ==================== MARKETPLACE ====================

    def create_sell_order(
        self,
        order_id: int,
        seller_wallet: str,
        credits: int,
        price_per_credit: int,  # In wei
        project_id: int
    ) -> Optional[str]:
        """
        Create a sell order on blockchain (locks credits in escrow).
        
        Args:
            order_id: Django SellOrder model ID
            seller_wallet: MetaMask wallet address of seller
            credits: Number of credits to sell
            price_per_credit: Price per credit in wei
            project_id: Associated Django Project ID
            
        Returns:
            Transaction hash if successful, None otherwise
        """
        if not self.enabled:
            logger.info(f"[MOCK] Would create sell order {order_id}: {credits} credits at {price_per_credit} wei")
            return f"mock_sell_order_{order_id}"
        
        try:
            checksum_seller = Web3.to_checksum_address(seller_wallet)
            
            tx_function = self.contract.functions.createSellOrder(
                order_id,
                checksum_seller,
                credits,
                price_per_credit,
                project_id
            )
            
            return self._send_transaction(tx_function)
            
        except Exception as e:
            logger.error(f"Error creating sell order: {e}")
            return None

    def execute_purchase(
        self,
        order_id: int,
        buyer_wallet: str,
        credits_to_buy: int
    ) -> Optional[str]:
        """
        Execute a purchase from a sell order.
        
        Args:
            order_id: Django SellOrder model ID
            buyer_wallet: MetaMask wallet address of buyer
            credits_to_buy: Number of credits to purchase
            
        Returns:
            Transaction hash if successful, None otherwise
        """
        if not self.enabled:
            logger.info(f"[MOCK] Would execute purchase from order {order_id}: {credits_to_buy} credits to {buyer_wallet}")
            return f"mock_purchase_{order_id}"
        
        try:
            checksum_buyer = Web3.to_checksum_address(buyer_wallet)
            
            tx_function = self.contract.functions.executePurchase(
                order_id,
                checksum_buyer,
                credits_to_buy
            )
            
            return self._send_transaction(tx_function)
            
        except Exception as e:
            logger.error(f"Error executing purchase: {e}")
            return None

    def cancel_sell_order(self, order_id: int) -> Optional[str]:
        """
        Cancel a sell order (returns credits from escrow to seller).
        
        Args:
            order_id: Django SellOrder model ID
            
        Returns:
            Transaction hash if successful, None otherwise
        """
        if not self.enabled:
            logger.info(f"[MOCK] Would cancel sell order {order_id}")
            return f"mock_cancel_{order_id}"
        
        try:
            tx_function = self.contract.functions.cancelSellOrder(order_id)
            return self._send_transaction(tx_function)
            
        except Exception as e:
            logger.error(f"Error cancelling sell order: {e}")
            return None

    # ==================== VIEW FUNCTIONS ====================

    def get_balance(self, wallet_address: str) -> int:
        """Get credit balance for a wallet (in whole credits, not scaled)."""
        if not self.enabled:
            return 0
        
        try:
            checksum_wallet = Web3.to_checksum_address(wallet_address)
            return self.contract.functions.getBalanceInCredits(checksum_wallet).call()
        except Exception as e:
            logger.error(f"Error getting balance: {e}")
            return 0

    def get_project_record(self, project_id: int) -> Optional[Dict[str, Any]]:
        """Get project record from blockchain."""
        if not self.enabled:
            return None
        
        try:
            record = self.contract.functions.getProjectRecord(project_id).call()
            return {
                'project_id': record[0],
                'owner': record[1],
                'credits_issued': record[2],
                'vintage_year': record[3],
                'exists': record[4]
            }
        except Exception as e:
            logger.error(f"Error getting project record: {e}")
            return None

    def get_sell_order(self, order_id: int) -> Optional[Dict[str, Any]]:
        """Get sell order from blockchain."""
        if not self.enabled:
            return None
        
        try:
            order = self.contract.functions.getSellOrder(order_id).call()
            return {
                'seller': order[0],
                'credits': order[1],
                'price_per_credit': order[2],
                'project_id': order[3],
                'active': order[4]
            }
        except Exception as e:
            logger.error(f"Error getting sell order: {e}")
            return None

    def is_connected(self) -> bool:
        """Check if blockchain connection is active."""
        if not self.enabled:
            return False
        return self.w3 and self.w3.is_connected()


# Singleton instance
blockchain_service = BlockchainService()
