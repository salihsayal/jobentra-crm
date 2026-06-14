import logging
import os
import re
import tempfile

from pypdf import PdfReader
from fastapi import UploadFile

from app.config import GENERATED_DIR, DOCUMENTS_DIR

log = logging.getLogger(__name__)


def _ocr_from_pdf(file: UploadFile) -> str:
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


def extract_text(file: UploadFile, filename: str) -> str:
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
        ocr_text = _ocr_from_pdf(file)
        if ocr_text.strip():
            return ocr_text

        raise ValueError("No extractable text found in the uploaded file (tried pypdf and OCR).")
    elif lower.endswith('.txt'):
        file.file.seek(0)
        content = file.file.read()
        return content.decode('utf-8', errors='replace')
    else:
        raise ValueError(f"Unsupported file type: {filename}. Only PDF and TXT are supported.")


def anonymize_text(raw_text: str) -> str:
    text = raw_text

    # Emails
    text = re.sub(
        r'[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}',
        '[EMAIL_CENSORED]',
        text,
    )

    # Phone numbers: international (+49...), German (0049...), local (0...), various separators
    text = re.sub(
        r'(?:\+?\d{1,3}[\-.\s]?)?\(?\d{2,4}\)?[\-.\s]?\d{2,4}[\-.\s]?\d{2,4}[\-.\s]?\d{0,4}',
        lambda m: '[PHONE_CENSORED]' if re.search(r'\d{7,}', m.group()) else m.group(),
        text,
    )

    # Greeting + name: "Herr/Frau Vorname Nachname"
    text = re.sub(
        r'\b(Herr|Frau)\s+[A-ZÄÖÜ][a-zäöüß\-]+(?:\s+[A-ZÄÖÜ][a-zäöüß\-]+)?',
        r'\1 [NAME_CENSORED]',
        text,
    )

    # Title + name: "Dr./Prof./Dipl.-Ing. Vorname Nachname"
    text = re.sub(
        r'\b(Dr\.|Prof\.|Dipl\.-Ing\.)\s+[A-ZÄÖÜ][a-zäöüß\-]+(?:\s+[A-ZÄÖÜ][a-zäöüß\-]+)?',
        r'\1 [NAME_CENSORED]',
        text,
    )

    # German postal code + city (5-digit PLZ followed by capitalized city name)
    text = re.sub(
        r'\b\d{5}\s+[A-ZÄÖÜ][a-zäöüß\-]+(?:\s+[A-ZÄÖÜ][a-zäöüß\-]+)*',
        '[PLZ_CENSORED] [CITY_CENSORED]',
        text,
    )

    # Street addresses: "Straße/Platz/Weg/etc." with number
    text = re.sub(
        r'\b[A-ZÄÖÜ][a-zäöüß\-]+(?:straße|str\.|Straße|Str\.|platz|Platz|weg|Weg|allee|Allee|gasse|Gasse|ring|Ring|damm|Damm)\s+\d{1,4}[a-zA-Z]?\b',
        '[ADDRESS_CENSORED]',
        text,
    )

    return text


def save_censored_file(anonymized_text: str, original_filename: str, candidate_id: str) -> str:
    out_dir = os.path.join(DOCUMENTS_DIR, candidate_id, "censored")
    os.makedirs(out_dir, exist_ok=True)
    base_name = os.path.splitext(original_filename)[0]
    filename = f"{base_name}_censored.txt"
    filepath = os.path.join(out_dir, filename)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(anonymized_text)
    return filepath
