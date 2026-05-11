import os

API_KEY = os.getenv("AI_SERVICE_API_KEY", "dev-secret-key")
PUBLIC_URL = os.getenv("AI_SERVICE_PUBLIC_URL", "http://localhost:8000")
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://backend:8080,http://localhost:8080").split(",")
GENERATED_DIR = "/app/generated"
