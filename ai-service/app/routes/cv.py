import logging

from fastapi import APIRouter, UploadFile, File, Form, Header, HTTPException

from app.config import API_KEY
from app.services.cv_anonymizer import extract_text, anonymize_text, save_censored_file

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/anonymize-cv")
async def anonymize_cv(
    file: UploadFile = File(...),
    candidate_id: str = Form(...),
    x_api_key: str = Header(None),
):
    if x_api_key != API_KEY:
        raise HTTPException(status_code=403, detail="Forbidden: invalid API key")

    original_filename = file.filename or "document"

    try:
        raw_text = extract_text(file, original_filename)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error("Text extraction failed: %s", e)
        raise HTTPException(status_code=500, detail=f"Failed to extract text: {str(e)}")

    if not raw_text.strip():
        raise HTTPException(status_code=400, detail="No extractable text found in the uploaded file.")

    anonymized = anonymize_text(raw_text)

    censored_filepath = save_censored_file(anonymized, original_filename, candidate_id)

    logger.info(
        "CV anonymized for candidate %s: %s → %s (%d chars → %d chars)",
        candidate_id, original_filename, censored_filepath, len(raw_text), len(anonymized),
    )

    return {
        "anonymized_text": anonymized,
        "censored_filepath": censored_filepath,
        "candidate_id": candidate_id,
        "original_chars": len(raw_text),
        "anonymized_chars": len(anonymized),
        "status": "anonymized",
    }
