import logging

from fastapi import APIRouter, UploadFile, File, Form, Header, HTTPException

from app.config import API_KEY
from app.services.skill_extractor import extract_text_from_file, call_ollama

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/extract-skills")
async def extract_skills(
    file: UploadFile = File(...),
    x_api_key: str = Header(None),
):
    if x_api_key != API_KEY:
        raise HTTPException(status_code=403, detail="Forbidden: invalid API key")

    original_filename = file.filename or "document"

    try:
        raw_text = extract_text_from_file(file, original_filename)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error("Text extraction failed: %s", e)
        raise HTTPException(status_code=500, detail=f"Failed to extract text: {str(e)}")

    if not raw_text.strip():
        raise HTTPException(status_code=400, detail="No extractable text found in the uploaded file.")

    try:
        skills = call_ollama(raw_text)
    except RuntimeError as e:
        logger.error("Ollama call failed: %s", e)
        raise HTTPException(status_code=503, detail=str(e))

    logger.info("Extracted %d skills from %s", len(skills), original_filename)

    return {
        "skills": skills,
        "text_length": len(raw_text),
        "status": "extracted",
    }
