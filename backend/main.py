"""
MEDIVISTA AI — Main Application Entrypoint.

Starts the FastAPI server, initializes SQLite database schemas,
registers CORS middleware, and mounts API v1 routes.
"""

from __future__ import annotations

import logging
import sys
from pathlib import Path
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Ensure backend directory and root are in python search path
CURRENT_FILE = Path(__file__).resolve()
BACKEND_DIR = CURRENT_FILE.parent
PROJECT_ROOT = BACKEND_DIR.parent

for p in [str(PROJECT_ROOT), str(BACKEND_DIR)]:
    if p not in sys.path:
        sys.path.insert(0, p)

try:
    from backend.app.core.config import settings
    from backend.app.api.routes import router as api_v1_router
    from backend.app.database.session import init_db
except ImportError:
    from app.core.config import settings
    from app.api.routes import router as api_v1_router
    from app.database.session import init_db

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("medivista")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application startup and shutdown events.
    """
    logger.info("Initializing MEDIVISTA AI backend...")
    logger.info("Setting up SQLite database tables...")
    try:
        init_db()
        logger.info("Database initialized successfully.")
    except Exception as e:
        logger.warning(f"Database initialization warning: {e}")

    logger.info("MEDIVISTA AI is ready to receive multimodal analysis requests.")
    yield
    logger.info("MEDIVISTA AI shutting down.")


app = FastAPI(
    title=getattr(settings, "PROJECT_NAME", "MEDIVISTA AI"),
    description=getattr(settings, "PROJECT_DESCRIPTION", "Multimodal Medical Imaging AI Copilot"),
    version=getattr(settings, "VERSION", "1.0.0"),
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure Cross-Origin Resource Sharing (CORS) for Doctor Workstation UI
cors_origins = getattr(settings, "BACKEND_CORS_ORIGINS", ["*"])
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins if isinstance(cors_origins, list) else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(api_v1_router)


@app.get("/", summary="Root Status Endpoint")
async def root() -> JSONResponse:
    """
    Root discovery endpoint.
    """
    return JSONResponse(
        content={
            "service": "MEDIVISTA AI — Multimodal Medical Imaging Copilot API",
            "status": "online",
            "version": getattr(settings, "VERSION", "1.0.0"),
            "documentation": "/docs",
            "api_v1": "/api/v1",
            "endpoints": {
                "analyze": "POST /api/v1/analyze",
                "health": "GET /api/v1/health",
                "modalities": "GET /api/v1/modalities",
                "history": "GET /api/v1/history",
            },
        }
    )


if __name__ == "__main__":
    import uvicorn
    print("\n" + "=" * 70)
    print("   MEDIVISTA AI — Multimodal Medical Imaging Copilot")
    print("   Microsoft BioViL-T & BiomedCLIP Foundation Model Engine")
    print("   Listening on http://0.0.0.0:8000 | Interactive Docs: http://localhost:8000/docs")
    print("=" * 70 + "\n")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
