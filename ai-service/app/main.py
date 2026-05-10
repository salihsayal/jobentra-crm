from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI(title="Jobentra AI Service")

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://backend:8080,http://localhost:8080").split(",")
API_KEY = os.getenv("AI_SERVICE_API_KEY", "dev-secret-key")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in ALLOWED_ORIGINS],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
    allow_credentials=True,
)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/generate-pdf")
def generate_pdf(x_api_key: str = Header(None)):
    if x_api_key != API_KEY:
        raise HTTPException(status_code=403, detail="Forbidden: invalid API key")
    return {
        "pdf_url": "https://storage.example.com/generated/report-2025.pdf",
        "status": "generated",
        "message": "PDF report generated successfully",
    }
