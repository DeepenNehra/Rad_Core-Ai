import os
from pathlib import Path
from typing import List

# Base directory paths
CORE_DIR = Path(__file__).resolve().parent
APP_DIR = CORE_DIR.parent
BACKEND_DIR = APP_DIR.parent
PROJECT_ROOT = BACKEND_DIR.parent


def _resolve_database_url() -> str:
    raw_url = os.getenv("DATABASE_URL", "sqlite:///./medivista_cases.db")
    # Render / Heroku / Railway sometimes provide postgres:// which SQLAlchemy 2.x rejects
    if raw_url.startswith("postgres://"):
        return raw_url.replace("postgres://", "postgresql://", 1)
    return raw_url


class Settings:
    """
    Core Configuration Settings for MEDIVISTA AI (PRD Section 19 & 20).
    """
    # 1. Project Information
    PROJECT_NAME: str = "MEDIVISTA AI"
    PROJECT_DESCRIPTION: str = (
        "Multimodal Medical Imaging AI Copilot for Grounded Analysis, "
        "Report Generation and Clinical Decision Support"
    )
    VERSION: str = "1.1.0"
    API_V1_STR: str = "/api/v1"

    # 2. Key Directories
    BASE_DIR: Path = PROJECT_ROOT
    MODELS_DIR: Path = PROJECT_ROOT / "models"
    DATA_DIR: Path = PROJECT_ROOT / "data"
    SAMPLE_IMAGES_DIR: Path = PROJECT_ROOT / "data" / "sample_images"

    # 3. Database & Persistence (PostgreSQL via DATABASE_URL, or SQLite locally)
    DATABASE_URL: str = _resolve_database_url()

    # 4. JWT Authentication & Security
    JWT_SECRET_KEY: str = os.getenv(
        "JWT_SECRET_KEY",
        "medivista-ai-clinical-secret-key-change-in-production-2026"
    )
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "720"))

    # Default Demo Clinician (auto-seeded on fresh DB if no users exist)
    DEMO_DOCTOR_USERNAME: str = os.getenv("DEMO_DOCTOR_USERNAME", "dr.nehra")
    DEMO_DOCTOR_PASSWORD: str = os.getenv("DEMO_DOCTOR_PASSWORD", "doctor123")
    DEMO_DOCTOR_NAME: str = os.getenv("DEMO_DOCTOR_NAME", "Dr. Deepen Nehra, MD")
    DEMO_DOCTOR_EMAIL: str = os.getenv("DEMO_DOCTOR_EMAIL", "dr.nehra@medivista.ai")

    # 5. Model Safety & Uncertainty Thresholds (PRD Section 18)
    CONFIDENCE_THRESHOLD_HIGH: float = 0.80       # High trust finding (included directly)
    CONFIDENCE_THRESHOLD_MODERATE: float = 0.60   # Requires doctor review warning
    ABSTENTION_THRESHOLD: float = 0.50            # Below 50% -> Model abstains from guessing

    # 6. CORS (Allows local & Vercel React Frontend to connect to FastAPI Backend)
    BACKEND_CORS_ORIGINS: List[str] = [
        origin.strip()
        for origin in os.getenv(
            "CORS_ORIGINS",
            "http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173"
        ).split(",")
        if origin.strip()
    ]


# Singleton instance for easy import across the application
settings = Settings()
