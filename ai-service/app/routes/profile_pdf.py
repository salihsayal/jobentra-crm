import logging

from fastapi import APIRouter, Header, HTTPException
from fastapi.responses import Response

from app.config import API_KEY
from app.models import ProfilePdfData
from app.services.profile_pdf_generator import build_profile_pdf

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/profile-pdf")
def generate_profile_pdf(data: ProfilePdfData, x_api_key: str = Header(None)):
    if x_api_key != API_KEY:
        raise HTTPException(status_code=403, detail="Forbidden: invalid API key")

    try:
        pdf_bytes = build_profile_pdf(data)
    except Exception as e:
        logger.error("Profile PDF generation failed: %s", e)
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")

    filename = data.fileName or f"Kandidaten-Profil-{data.refNumber}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
