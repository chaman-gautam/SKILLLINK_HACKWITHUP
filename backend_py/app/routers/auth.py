# backend_py/app/routers/auth.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import os
from supabase import create_client

router = APIRouter()
supabase = create_client(os.environ["VITE_SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])

class SignupIn(BaseModel):
    email: str
    password: str
    name: str | None = None

@router.post("/signup")
async def signup(payload: SignupIn):
    user = supabase.auth.sign_up({"email": payload.email, "password": payload.password})
    if user.get("error"):
        raise HTTPException(status_code=400, detail=user["error"]["message"])
    # optionally insert profile in Postgres via supabase
    return {"msg":"signup initiated"}
