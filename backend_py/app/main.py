# backend_py/app/main.py
from fastapi import FastAPI
from .routers import auth, passport, ai

app = FastAPI(title="SkillLink API")

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(passport.router, prefix="/passport", tags=["passport"])
app.include_router(ai.router, prefix="/ai", tags=["ai"])

@app.get("/health")
async def health():
    return {"status":"ok"}
