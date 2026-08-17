import os

API_KEY = os.getenv("AI_SERVICE_API_KEY", "dev-secret-key")
PUBLIC_URL = os.getenv("AI_SERVICE_PUBLIC_URL", "http://localhost:8000")
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://backend:8080,http://localhost:8080").split(",")
GENERATED_DIR = "/app/generated"
DOCUMENTS_DIR = os.getenv("DOCUMENTS_DIR", "/app/documents")

LLM_MODEL = os.getenv("LLM_MODEL", "gemini-2.5-flash")

GOOGLE_APPLICATION_CREDENTIALS = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "")
GCP_PROJECT_ID = os.getenv("GCP_PROJECT_ID", "jobentra-crm-505722")
GCP_LOCATION = os.getenv("GCP_LOCATION", "europe-west3")
