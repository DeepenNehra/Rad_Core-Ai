import os
from pathlib import Path
from typing import List

# Base directory paths
CORE_DIR = Path(__file__).resolve().parent
APP_DIR = CORE_DIR.parent
BACKEND_DIR = APP_DIR.parent
PROJECT_ROOT = BACKEND_DIR.parent

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
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    # 2. Key Directories
    BASE_DIR: Path = PROJECT_ROOT
    MODELS_DIR: Path = PROJECT_ROOT / "models"
    DATA_DIR: Path = PROJECT_ROOT / "data"
    SAMPLE_IMAGES_DIR: Path = PROJECT_ROOT / "data" / "sample_images"

    # 3. Model Safety & Uncertainty Thresholds (PRD Section 18)
    CONFIDENCE_THRESHOLD_HIGH: float = 0.80       # High trust finding (included directly)
    CONFIDENCE_THRESHOLD_MODERATE: float = 0.60   # Requires doctor review warning
    ABSTENTION_THRESHOLD: float = 0.50            # Below 50% -> Model abstains from guessing

    # 4. CORS (Allows React Frontend to connect to FastAPI Backend)
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "*"
    ]

# Singleton instance for easy import across the application
settings = Settings()
