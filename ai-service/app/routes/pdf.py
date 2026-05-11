import logging

from fastapi import APIRouter, Body, Header, HTTPException

from app.config import API_KEY, PUBLIC_URL
from app.models import MemberData
from app.services.pdf_generator import build_pdf

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/generate-pdf")
def generate_pdf(data: MemberData = Body(None), x_api_key: str = Header(None)):
    if x_api_key != API_KEY:
        raise HTTPException(status_code=403, detail="Forbidden: invalid API key")

    if data:
        logger.info(
            "PDF generation requested for: %s %s (%s) [id=%s, status=%s]",
            data.firstName, data.lastName, data.email,
            data.memberId, data.status,
        )
        filename = build_pdf(data)
        pdf_url = f"{PUBLIC_URL}/generated/{filename}"
    else:
        logger.info("PDF generation requested (no member data provided)")
        pdf_url = f"{PUBLIC_URL}/generated/report-2025.pdf"

    return {
        "pdf_url": pdf_url,
        "status": "generated",
        "message": "PDF report generated successfully",
    }
