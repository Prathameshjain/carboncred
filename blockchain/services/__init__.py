"""
Blockchain Services Package for CarbonCred

Provides Web3 integration with the CarbonCredToken smart contract.
"""

from .contract_service import blockchain_service
from .blockchain_config import BLOCKCHAIN_ENABLED, get_config

__all__ = ['blockchain_service', 'BLOCKCHAIN_ENABLED', 'get_config']
