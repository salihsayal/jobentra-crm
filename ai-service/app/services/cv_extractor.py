import io
import json
import logging
import re
import tempfile

from fastapi import UploadFile
from google import genai
from google.genai import types
from pypdf import PdfReader

from app.config import GCP_LOCATION, GCP_PROJECT_ID, LLM_MODEL
from app.models import ExtractionResult

log = logging.getLogger(__name__)

_SYSTEM_PROMPT = (
    "You are a CV (Lebenslauf) parsing assistant. Extract structured information from the "
    "provided CV text. The CV may be written in German or English. "
    "Respond ONLY with a valid JSON object in the following shape: "
    '{"skills": ["skill1", "skill2", ...], "workExperience": [{"jobTitle": "...", '
    '"company": "...", "startDate": "...", "endDate": "...", "description": "..."}]}. '
    "Rules:\n"
    "- skills: technical skills, tools, programming languages, spoken languages, certifications. "
    "Return each skill as a short, clean label. Include at most 30 skills.\n"
    "- workExperience: one entry per position. jobTitle is the role, company the employer. "
    "startDate and endDate are free-form (e.g. \"03.2020\", \"2021\", \"heute\"). "
    "description: ONLY the responsibilities and tasks performed in this position. "
    "MUST NOT mention the company name or employer - the employer belongs exclusively "
    "in the 'company' field. Keep at most 3 short sentences.\n"
    "- If a section does not exist in the CV, return an empty list.\n"
    "- Do not invent information. Only use what is present in the text."
)


def _ocr_from_pdf(pdf_bytes: bytes) -> str:
    try:
        from pdf2image import convert_from_bytes
        import pytesseract
    except ImportError as e:
        raise ValueError(f"OCR dependencies not available: {e}")

    with tempfile.TemporaryDirectory() as tmpdir:
        images = convert_from_bytes(pdf_bytes, dpi=300, fmt="jpeg", output_folder=tmpdir)
        texts = []
        for img in images:
            ocr_text = pytesseract.image_to_string(img, lang="deu")
            if ocr_text and ocr_text.strip():
                texts.append(ocr_text.strip())
        return "\n".join(texts)


def extract_text(data: bytes, filename: str) -> str:
    lower = filename.lower()
    if lower.endswith('.pdf'):
        try:
            reader = PdfReader(io.BytesIO(data))
            text_parts = []
            for page in reader.pages:
                extracted = page.extract_text()
                if extracted:
                    text_parts.append(extracted)
            text = '\n'.join(text_parts).strip()
            if text:
                return text
        except Exception as e:
            log.warning("pypdf failed for %s: %s, trying OCR", filename, e)

        log.info("pypdf returned no text for %s, falling back to OCR", filename)
        ocr_text = _ocr_from_pdf(data)
        if ocr_text.strip():
            return ocr_text

        raise ValueError("No extractable text found in the uploaded file (tried pypdf and OCR).")
    elif lower.endswith('.txt'):
        return data.decode('utf-8', errors='replace')
    else:
        raise ValueError(f"Unsupported file type: {filename}. Only PDF and TXT are supported.")


def _parse_llm_json(raw: str) -> ExtractionResult:
    raw = raw.strip()
    if raw.startswith("```"):
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)
    start, end = raw.find("{"), raw.rfind("}")
    if start == -1 or end == -1:
        raise ValueError("LLM response did not contain a JSON object")
    data = json.loads(raw[start:end + 1])
    return ExtractionResult.model_validate(data)


def llm_extract(text: str) -> ExtractionResult:
    if not GCP_PROJECT_ID:
        raise ValueError("GCP_PROJECT_ID is not configured")

    client = genai.Client(
        vertexai=True,
        project=GCP_PROJECT_ID,
        location=GCP_LOCATION,
        http_options={"timeout": 120_000},
    )

    config = types.GenerateContentConfig(
        system_instruction=_SYSTEM_PROMPT,
        temperature=0,
        response_mime_type="application/json",
    )

    contents = [
        types.Content(role="user", parts=[types.Part.from_text(text=text[:60000])]),
    ]

    last_error = None
    raw = ""
    for attempt in range(2):
        try:
            response = client.models.generate_content(
                model=LLM_MODEL,
                contents=contents,
                config=config,
            )
            raw = response.text or ""
            return _parse_llm_json(raw)
        except ValueError as e:
            last_error = e
            contents.append(
                types.Content(role="model", parts=[types.Part.from_text(raw)])
            )
            contents.append(
                types.Content(
                    role="user",
                    parts=[
                        types.Part.from_text(
                            "Your previous answer was not valid JSON. Respond with ONLY the JSON object."
                        )
                    ],
                )
            )
        except Exception as e:
            last_error = e
            log.warning("LLM call failed (attempt %d): %s", attempt + 1, e)

    raise ValueError(f"LLM extraction failed: {last_error}")
