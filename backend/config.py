import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file from backend or root directory if present
BASE_DIR = Path(__file__).resolve().parent
ENV_PATH = BASE_DIR / ".env"
ROOT_ENV_PATH = BASE_DIR.parent / ".env"

if ENV_PATH.exists():
    load_dotenv(ENV_PATH)
elif ROOT_ENV_PATH.exists():
    load_dotenv(ROOT_ENV_PATH)
else:
    load_dotenv()

class Settings:
    PROJECT_NAME: str = "Rythu Nestham (రైతు నేస్తం) - Rural Agri-AI Platform"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"

    # API Keys
    SARVAM_API_KEY: str = os.getenv("SARVAM_API_KEY", "")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    BHASHINI_API_KEY: str = os.getenv("BHASHINI_API_KEY", "")
    BHASHINI_USER_ID: str = os.getenv("BHASHINI_USER_ID", "")
    BHASHINI_PIPELINE_ID: str = os.getenv("BHASHINI_PIPELINE_ID", "")

    # Endpoints & Service URLs
    SARVAM_STT_URL: str = "https://api.sarvam.ai/speech-to-text"
    SARVAM_TTS_URL: str = "https://api.sarvam.ai/text-to-speech"
    GEMINI_API_URL: str = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"

    # Storage paths
    PDF_OUTPUT_DIR: Path = BASE_DIR / "generated_pdfs"
    TEMPLATES_DIR: Path = BASE_DIR / "templates"

    # Fallback simulation flags
    ALLOW_MOCK_FALLBACK: bool = True

settings = Settings()
settings.PDF_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
settings.TEMPLATES_DIR.mkdir(parents=True, exist_ok=True)

