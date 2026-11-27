"""
MEDIVISTA AI — Main Application Entrypoint.

Starts the FastAPI server, initializes database schemas (PostgreSQL or SQLite),
configures CORS for Vercel & local React frontends, and mounts API v1 routes.
"""

from __future__ import annotations

import logging
import os
import sys
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
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
    """Application startup and shutdown events."""
    logger.info("Initializing MEDIVISTA AI backend...")
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
    version=getattr(settings, "VERSION", "1.1.0"),
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS cleanly for local dev + Vercel deployments
# (Using Bearer JWT headers, so allow_credentials=False with allow_origins=["*"] or explicit regex works cleanly across all origins)
cors_origins = list(getattr(settings, "BACKEND_CORS_ORIGINS", []))
extra_frontend = os.getenv("FRONTEND_URL", "").strip()
if extra_frontend and extra_frontend not in cors_origins:
    cors_origins.append(extra_frontend)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins if cors_origins else ["*"],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(api_v1_router)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Ensure unhandled exceptions still pass through CORSMiddleware with JSON detail."""
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {str(exc)}"},
    )


@app.get("/", summary="Root Status Endpoint")
async def root() -> JSONResponse:
    """Root discovery endpoint."""
    return JSONResponse(
        content={
            "service": "MEDIVISTA AI — Multimodal Medical Imaging Copilot API",
            "status": "online",
            "version": getattr(settings, "VERSION", "1.1.0"),
            "documentation": "/docs",
            "api_v1": "/api/v1",
            "endpoints": {
                "login": "POST /api/v1/auth/login",
                "register": "POST /api/v1/auth/register",
                "analyze": "POST /api/v1/analyze",
                "health": "GET /api/v1/health",
                "modalities": "GET /api/v1/modalities",
                "history": "GET /api/v1/history (JWT protected)",
            },
        }
    )


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    print("\n" + "=" * 70)
    print("   MEDIVISTA AI — Multimodal Medical Imaging Copilot")
    print("   Microsoft BioViL-T & BiomedCLIP Foundation Model Engine")
    print(f"   Listening on http://0.0.0.0:{port} | Docs: http://localhost:{port}/docs")
    print("=" * 70 + "\n")
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=os.getenv("ENV", "dev") == "dev")
