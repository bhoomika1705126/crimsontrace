from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import analyze
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="CrimsonTrace API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyze.router, prefix="/api", tags=["analysis"])

@app.get("/")
async def root():
    return {"message": "CrimsonTrace API running"}

@app.get("/health")
async def health():
    return {"status": "ok"}
