import logging
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import ALLOWED_ORIGINS, GENERATED_DIR
from app.routes.health import router as health_router
from app.routes.pdf import router as pdf_router

logging.basicConfig(level=logging.INFO)
os.makedirs(GENERATED_DIR, exist_ok=True)

app = FastAPI(title="Jobentra AI Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in ALLOWED_ORIGINS],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
    allow_credentials=True,
)

app.mount("/generated", StaticFiles(directory=GENERATED_DIR), name="generated")

app.include_router(health_router)
app.include_router(pdf_router)
