import logging

from fastapi import APIRouter, UploadFile, File, Form, Header, HTTPException

from app.config import API_KEY
from app.models import ExtractionResult
from app.services.cv_extractor import extract_text, llm_extract

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/extract-cv", response_model=ExtractionResult)
async def extract_cv(
    file: UploadFile = File(...),
    candidate_id: str = Form(""),
    x_api_key: str = Header(None),
):
    if x_api_key != API_KEY:
        raise HTTPException(status_code=403, detail="Forbidden: invalid API key")

    original_filename = file.filename or "document"

    try:
        raw = await file.read()
        raw_text = extract_text(raw, original_filename)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error("Text extraction failed for %s: %s", original_filename, e)
        raise HTTPException(status_code=500, detail=f"Failed to extract text: {str(e)}")

    if not raw_text.strip():
        raise HTTPException(status_code=400, detail="No extractable text found in the uploaded file.")

    try:
        result = llm_extract(raw_text)
    except ValueError as e:
        logger.error("LLM extraction failed for %s: %s", original_filename, e)
        raise HTTPException(status_code=502, detail=str(e))

    logger.info(
        "CV extracted for candidate %s from %s: %d skills, %d work experience entries",
        candidate_id or "unknown", original_filename,
        len(result.skills), len(result.workExperience),
    )

    return result
