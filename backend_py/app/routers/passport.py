from fastapi import APIRouter, Depends, HTTPException
router = APIRouter()

@router.post("/mint")
async def mint_passport(user_id: str):
    # 1) validate user & metadata
    # 2) call blockchain_service.mint_skill_nft(...)
    return {"status":"minting_started", "tx": None}
