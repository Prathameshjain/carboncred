"""
Blockchain Configuration for CarbonCred

This module contains configuration settings for blockchain integration.
Loads contract address, ABI, and network settings from environment variables.
"""

import os
import json
from pathlib import Path

# Environment variables
ALCHEMY_URL = os.getenv('ALCHEMY_URL', '')
PRIVATE_KEY = os.getenv('BLOCKCHAIN_PRIVATE_KEY', '')
CONTRACT_ADDRESS = os.getenv('CONTRACT_ADDRESS', '')
CHAIN_ID = int(os.getenv('BLOCKCHAIN_CHAIN_ID', '11155111'))  # Sepolia default

# Is blockchain integration enabled?
BLOCKCHAIN_ENABLED = bool(ALCHEMY_URL and PRIVATE_KEY and CONTRACT_ADDRESS)

# Contract ABI (will be populated after compilation)
# This is a minimal ABI with the functions we need
CONTRACT_ABI = [
    # mintVerifiedCredits
    {
        "inputs": [
            {"name": "_owner", "type": "address"},
            {"name": "_amount", "type": "uint256"},
            {"name": "_projectId", "type": "uint256"},
            {"name": "_vintageYear", "type": "uint256"}
        ],
        "name": "mintVerifiedCredits",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    # createSellOrder
    {
        "inputs": [
            {"name": "_orderId", "type": "uint256"},
            {"name": "_seller", "type": "address"},
            {"name": "_credits", "type": "uint256"},
            {"name": "_pricePerCredit", "type": "uint256"},
            {"name": "_projectId", "type": "uint256"}
        ],
        "name": "createSellOrder",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    # executePurchase
    {
        "inputs": [
            {"name": "_orderId", "type": "uint256"},
            {"name": "_buyer", "type": "address"},
            {"name": "_creditsToBuy", "type": "uint256"}
        ],
        "name": "executePurchase",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    # cancelSellOrder
    {
        "inputs": [
            {"name": "_orderId", "type": "uint256"}
        ],
        "name": "cancelSellOrder",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    # balanceOf
    {
        "inputs": [
            {"name": "", "type": "address"}
        ],
        "name": "balanceOf",
        "outputs": [
            {"name": "", "type": "uint256"}
        ],
        "stateMutability": "view",
        "type": "function"
    },
    # getBalanceInCredits
    {
        "inputs": [
            {"name": "_owner", "type": "address"}
        ],
        "name": "getBalanceInCredits",
        "outputs": [
            {"name": "", "type": "uint256"}
        ],
        "stateMutability": "view",
        "type": "function"
    },
    # getProjectRecord
    {
        "inputs": [
            {"name": "_projectId", "type": "uint256"}
        ],
        "name": "getProjectRecord",
        "outputs": [
            {
                "components": [
                    {"name": "projectId", "type": "uint256"},
                    {"name": "owner", "type": "address"},
                    {"name": "creditsIssued", "type": "uint256"},
                    {"name": "vintageYear", "type": "uint256"},
                    {"name": "exists", "type": "bool"}
                ],
                "name": "",
                "type": "tuple"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    # getSellOrder
    {
        "inputs": [
            {"name": "_orderId", "type": "uint256"}
        ],
        "name": "getSellOrder",
        "outputs": [
            {
                "components": [
                    {"name": "seller", "type": "address"},
                    {"name": "credits", "type": "uint256"},
                    {"name": "pricePerCredit", "type": "uint256"},
                    {"name": "projectId", "type": "uint256"},
                    {"name": "active", "type": "bool"}
                ],
                "name": "",
                "type": "tuple"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    # Events
    {
        "anonymous": False,
        "inputs": [
            {"indexed": True, "name": "projectId", "type": "uint256"},
            {"indexed": True, "name": "owner", "type": "address"},
            {"indexed": False, "name": "amount", "type": "uint256"},
            {"indexed": False, "name": "vintageYear", "type": "uint256"}
        ],
        "name": "CreditsIssued",
        "type": "event"
    },
    {
        "anonymous": False,
        "inputs": [
            {"indexed": True, "name": "orderId", "type": "uint256"},
            {"indexed": True, "name": "seller", "type": "address"},
            {"indexed": False, "name": "credits", "type": "uint256"},
            {"indexed": False, "name": "pricePerCredit", "type": "uint256"}
        ],
        "name": "SellOrderCreated",
        "type": "event"
    },
    {
        "anonymous": False,
        "inputs": [
            {"indexed": True, "name": "orderId", "type": "uint256"},
            {"indexed": True, "name": "buyer", "type": "address"},
            {"indexed": False, "name": "creditsBought", "type": "uint256"}
        ],
        "name": "SellOrderExecuted",
        "type": "event"
    },
    {
        "anonymous": False,
        "inputs": [
            {"indexed": True, "name": "from", "type": "address"},
            {"indexed": True, "name": "to", "type": "address"},
            {"indexed": False, "name": "value", "type": "uint256"}
        ],
        "name": "Transfer",
        "type": "event"
    }
]


def load_full_abi():
    """
    Load the full ABI from compiled contract artifacts.
    Call this after running 'npx hardhat compile' in blockchain directory.
    """
    abi_path = Path(__file__).parent.parent / 'artifacts' / 'contracts' / 'CarbonCredToken.sol' / 'CarbonCredToken.json'
    if abi_path.exists():
        with open(abi_path, 'r') as f:
            contract_json = json.load(f)
            return contract_json.get('abi', CONTRACT_ABI)
    return CONTRACT_ABI


def get_config():
    """Get blockchain configuration as a dictionary."""
    return {
        'alchemy_url': ALCHEMY_URL,
        'private_key': PRIVATE_KEY,
        'contract_address': CONTRACT_ADDRESS,
        'chain_id': CHAIN_ID,
        'enabled': BLOCKCHAIN_ENABLED,
        'abi': CONTRACT_ABI
    }
