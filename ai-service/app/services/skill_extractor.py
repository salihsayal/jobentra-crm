import json
import logging
import re
import tempfile

import httpx
from fastapi import UploadFile
from pypdf import PdfReader

from app.config import OLLAMA_URL

log = logging.getLogger(__name__)

MODEL = "qwen2.5-coder:7b"

PROMPT_TEMPLATE = """Du bist ein zentraler Baustein eines automatisierten CRM-Recruiting-Systems. Deine einzige Aufgabe ist es, das folgende Bewerberprofil zu analysieren und alle fachlichen, technischen und Soft-Skill-Fähigkeiten in eine standardisierte Liste zu extrahieren.

Strikte Regeln:
1. Gib AUSSCHLIESSLICH ein gültiges JSON-Objekt aus.
2. Füge keine Einleitungssätze, Erklärungen oder Schlussbemerkungen hinzu. Kein Smalltalk.
3. Denke NICHT laut nach, nutze KEINE <think>-Tags. Springe direkt zur JSON-Ausgabe.
4. Alle extrahierten Skills müssen zwingend auf Deutsch ausgegeben werden.
5. Das JSON muss genau einen Schlüssel namens "skills" enthalten, der ein flaches Array von Strings beinhaltet.

Erwartetes JSON-Format:
{{"skills": ["Skill 1", "Skill 2", "Skill 3"]}}

Bewerberprofil-Text:
---
{text}
---"""


def _ocr_fallback(file: UploadFile) -> str:
    try:
        from pdf2image import convert_from_bytes
        import pytesseract
    except ImportError as e:
        raise ValueError(f"OCR dependencies not available: {e}")

    file.file.seek(0)
    pdf_bytes = file.file.read()

    with tempfile.TemporaryDirectory() as tmpdir:
        images = convert_from_bytes(pdf_bytes, dpi=300, fmt="jpeg", output_folder=tmpdir)
        texts = []
        for img in images:
            ocr_text = pytesseract.image_to_string(img, lang="deu")
            if ocr_text and ocr_text.strip():
                texts.append(ocr_text.strip())
        return "\n".join(texts)


def extract_text_from_file(file: UploadFile, filename: str) -> str:
    lower = filename.lower()
    if lower.endswith('.pdf'):
        file.file.seek(0)
        reader = PdfReader(file.file)
        text_parts = []
        for page in reader.pages:
            extracted = page.extract_text()
            if extracted:
                text_parts.append(extracted)
        text = '\n'.join(text_parts).strip()
        if text:
            return text

        log.info("pypdf returned no text for %s, falling back to OCR", filename)
        return _ocr_fallback(file)
    elif lower.endswith('.txt'):
        file.file.seek(0)
        content = file.file.read()
        return content.decode('utf-8', errors='replace')
    else:
        raise ValueError(f"Unsupported file type: {filename}")


def call_ollama(text: str) -> list[str]:
    prompt = PROMPT_TEMPLATE.format(text=text)

    try:
        with httpx.Client(timeout=120.0) as client:
            resp = client.post(
                f"{OLLAMA_URL}/api/generate",
                json={
                    "model": MODEL,
                    "prompt": prompt,
                    "stream": False,
                },
            )
            resp.raise_for_status()
    except httpx.ConnectError:
        raise RuntimeError(f"Ollama is not reachable at {OLLAMA_URL}")
    except httpx.HTTPStatusError as e:
        raise RuntimeError(f"Ollama returned {e.response.status_code}: {e.response.text[:200]}")

    data = resp.json()
    raw_response = data.get("response", "")

    if not raw_response.strip():
        log.warning("Ollama returned empty response")
        return []

    json_str = raw_response.strip()

    # Strip markdown code fences if present
    if json_str.startswith("```"):
        json_str = re.sub(r"^```(?:json)?\s*", "", json_str)
        json_str = re.sub(r"\s*```$", "", json_str)

    try:
        parsed = json.loads(json_str)
    except json.JSONDecodeError:
        log.warning("Failed to parse Ollama JSON response: %s", raw_response[:200])
        return []

    skills = parsed.get("skills", [])
    if isinstance(skills, list):
        return [str(s).strip() for s in skills if str(s).strip()]
    return []
