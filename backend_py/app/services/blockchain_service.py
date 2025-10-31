# backend_py/app/services/blockchain_service.py
from web3 import Web3
import os

w3 = Web3(Web3.HTTPProvider(os.getenv("THIRDWEB_RPC_URL")))

def mint_skill_nft(to_address, metadata_uri):
    account = w3.eth.account.from_key(os.getenv("THIRDWEB_PRIVATE_KEY"))
    # If using your own contract, load ABI and use contract.functions.mint...
    # For Thirdweb, prefer calling Thirdweb REST API or use their SDK (JS friendly).
    return {"tx": "not_implemented_sample"}
