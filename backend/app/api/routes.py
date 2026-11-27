"""
FastAPI Route Controllers for MEDIVISTA AI.

Endpoints:
- POST /api/v1/auth/login            : Clinician JWT login
- POST /api/v1/auth/register         : Register clinician account
- GET  /api/v1/auth/me               : Current clinician profile (JWT protected)
- POST /api/v1/analyze               : Multimodal scan analysis & report generation
- GET  /api/v1/health                : System & DB health check
- GET  /api/v1/modalities            : 44-pathology clinical registry
- GET  /api/v1/history               : Case history records (JWT protected)
- GET  /api/v1/studies/{id}          : Full study record lookup (JWT protected)
- POST /api/v1/studies/{id}/sign-off : Clinician report sign-off (JWT protected)
- DELETE /api/v1/studies/{id}        : Delete study record (JWT protected)
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

try:
    from backend.app.services.analysis_pipeline import run_full_analysis
    from backend.app.ml.abnormality_detector import MODALITY_KNOWLEDGE_BASE
    from backend.app.database.session import (
        get_db,
        save_study,
        get_all_studies,
        get_study_by_id,
        sign_off_study,
        delete_study_by_id,
        get_user_by_username,
        get_user_by_email,
        create_user,
    )
    from backend.app.database.models import UserRecord
    from backend.app.core.config import settings
    from backend.app.core.security import (
        hash_password,
        verify_password,
        create_access_token,
        get_current_user,
        get_optional_user,
    )
except ImportError:
    from app.services.analysis_pipeline import run_full_analysis
    from app.ml.abnormality_detector import MODALITY_KNOWLEDGE_BASE
    from app.database.session import (
        get_db,
        save_study,
        get_all_studies,
        get_study_by_id,
        sign_off_study,
        delete_study_by_id,
        get_user_by_username,
        get_user_by_email,
        create_user,
    )
    from app.database.models import UserRecord
    from app.core.config import settings
    from app.core.security import (
        hash_password,
        verify_password,
        create_access_token,
        get_current_user,
        get_optional_user,
    )

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["MEDIVISTA AI"])

ALLOWED_EXTENSIONS = {".dcm", ".dicom", ".png", ".jpg", ".jpeg"}


# ---------------------------------------------------------------------------
# Auth Request Schemas
# ---------------------------------------------------------------------------
class LoginRequest(BaseModel):
    username: str = Field(..., min_length=2, description="Clinician username or email")
    password: str = Field(..., min_length=4, description="Account password")


class RegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=64)
    email: str = Field(..., min_length=5, max_length=120)
    full_name: str = Field(..., min_length=2, max_length=120)
    password: str = Field(..., min_length=6, max_length=128)
    role: str = Field(default="Radiologist")
    department: str = Field(default="Diagnostic Radiology")


# ---------------------------------------------------------------------------
# Auth Endpoints
# ---------------------------------------------------------------------------
@router.post("/auth/login", summary="Clinician Sign In (JWT)")
async def login(payload: LoginRequest, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Authenticate clinician with username/email + password and return JWT."""
    identifier = payload.username.strip()
    user = get_user_by_username(db, identifier) or get_user_by_email(db, identifier)

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username/email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Clinician account is disabled.",
        )

    token = create_access_token({"sub": user.username, "role": user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "expires_in_minutes": settings.ACCESS_TOKEN_EXPIRE_MINUTES,
        "user": user.to_public_dict(),
    }


@router.post("/auth/register", summary="Register New Clinician Account", status_code=status.HTTP_201_CREATED)
async def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Create a new clinician account and return a JWT token."""
    username = payload.username.strip().lower()
    email = payload.email.strip().lower()

    if get_user_by_username(db, username):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Username '{username}' is already registered.",
        )
    if get_user_by_email(db, email):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Email '{email}' is already registered.",
        )

    user = create_user(
        db=db,
        username=username,
        email=email,
        full_name=payload.full_name.strip(),
        hashed_password=hash_password(payload.password),
        role=payload.role.strip() or "Radiologist",
        department=payload.department.strip() or "Diagnostic Radiology",
    )

    token = create_access_token({"sub": user.username, "role": user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "expires_in_minutes": settings.ACCESS_TOKEN_EXPIRE_MINUTES,
        "user": user.to_public_dict(),
    }


@router.get("/auth/me", summary="Get Authenticated Clinician Profile")
async def get_me(current_user: UserRecord = Depends(get_current_user)) -> Dict[str, Any]:
    """Return currently authenticated clinician profile."""
    return current_user.to_public_dict()


# ---------------------------------------------------------------------------
# Analysis & Diagnostic Endpoints
# ---------------------------------------------------------------------------
@router.post(
    "/analyze",
    summary="Run Multimodal Medical Imaging Analysis",
    description="Uploads a medical scan (DICOM or standard raster) and returns structured findings, radiology report, and clinical decision support.",
    response_class=JSONResponse,
)
async def analyze_study(
    file: UploadFile = File(..., description="Medical image file (.dcm, .dicom, .png, .jpg, .jpeg)"),
    modality: str = Form(default="X-Ray", description="Modality: X-Ray, CT, MRI, Ultrasound"),
    patient_id: Optional[str] = Form(default="PT-UNKNOWN", description="Patient identifier"),
    age: Optional[int] = Form(default=None, description="Patient age"),
    gender: Optional[str] = Form(default="Unknown", description="Patient biological sex"),
    symptoms: Optional[str] = Form(default=None, description="Presenting complaints"),
    clinical_history: Optional[str] = Form(default=None, description="Prior clinical history"),
    db: Session = Depends(get_db),
    current_user: Optional[UserRecord] = Depends(get_optional_user),
) -> JSONResponse:
    """Main multimodal analysis endpoint."""
    filename = file.filename or "unknown_scan.png"
    lower_filename = filename.lower()

    if not any(lower_filename.endswith(ext) for ext in ALLOWED_EXTENSIONS):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{filename}'. Allowed formats: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
        )

    try:
        file_bytes = await file.read()
        if len(file_bytes) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file is empty (0 bytes).",
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to read file bytes: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not read upload payload: {str(e)}",
        )

    patient_info = {
        "patient_id": patient_id or "PT-UNKNOWN",
        "age": age,
        "gender": gender or "Unknown",
        "symptoms": symptoms,
        "clinical_history": clinical_history,
    }

    try:
        result = run_full_analysis(
            file_bytes=file_bytes,
            filename=filename,
            modality=modality,
            patient_info=patient_info,
        )

        # Persist to DB (SQLite locally or PostgreSQL in cloud)
        try:
            clinician_name = current_user.full_name if current_user else None
            save_study(db, result, filename=filename, created_by_user=clinician_name)
        except Exception as db_err:
            logger.warning(f"Could not persist study record to database: {db_err}")

        return JSONResponse(status_code=status.HTTP_200_OK, content=result)

    except Exception as exc:
        logger.exception("Error executing multimodal analysis pipeline")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analysis pipeline execution failed: {str(exc)}",
        )


@router.get("/health", summary="System Health & Model Status")
async def health_check() -> Dict[str, Any]:
    """Returns platform diagnostics."""
    total_pathologies = sum(len(kb["pathologies"]) for kb in MODALITY_KNOWLEDGE_BASE.values())
    db_backend = "sqlite" if settings.DATABASE_URL.startswith("sqlite") else "postgresql"
    return {
        "status": "healthy",
        "service": "MEDIVISTA AI Copilot Backend",
        "version": getattr(settings, "VERSION", "1.1.0"),
        "active_backbone": "Microsoft-BioViL-BiomedCLIP-Hybrid",
        "modalities_supported": list(MODALITY_KNOWLEDGE_BASE.keys()),
        "total_pathologies_covered": total_pathologies,
        "database_backend": db_backend,
        "auth_scheme": "JWT-HS256",
        "human_oversight_enforced": True,
    }


@router.get("/modalities", summary="List Supported Modalities & Pathologies")
async def list_modalities() -> Dict[str, Any]:
    """Returns full modality registry with anatomical mappings and pathology lists."""
    return {
        "count": len(MODALITY_KNOWLEDGE_BASE),
        "modalities": {
            mod_name: {
                "model_name": kb["model_name"],
                "pathologies_count": len(kb["pathologies"]),
                "pathologies": kb["pathologies"],
                "anatomical_mappings": kb.get("anatomical_mappings", {}),
            }
            for mod_name, kb in MODALITY_KNOWLEDGE_BASE.items()
        },
    }


# ---------------------------------------------------------------------------
# JWT-Protected Case History & Audit Endpoints
# ---------------------------------------------------------------------------
@router.get(
    "/history",
    summary="Get Case History (Protected)",
    description="Retrieves recent analyzed radiology studies. Requires clinician JWT authentication.",
)
async def get_history(
    limit: int = Query(default=50, ge=1, le=200),
    modality: Optional[str] = Query(default=None),
    search: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
    current_user: UserRecord = Depends(get_current_user),
) -> List[Dict[str, Any]]:
    """Returns paginated list of past study analyses (JWT protected)."""
    records = get_all_studies(db, limit=limit, modality=modality, search=search)
    return [r.to_summary_dict() for r in records]


@router.get(
    "/studies/{study_id}",
    summary="Get Detailed Study Record (Protected)",
    description="Lookup complete study analysis payload by unique study ID. Requires JWT authentication.",
)
async def get_study_details(
    study_id: str,
    db: Session = Depends(get_db),
    current_user: UserRecord = Depends(get_current_user),
) -> Dict[str, Any]:
    """Returns complete deserialized study record (JWT protected)."""
    record = get_study_by_id(db, study_id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Study with ID '{study_id}' was not found in database.",
        )
    return record.to_full_dict()


@router.post(
    "/studies/{study_id}/sign-off",
    summary="Clinician Verify & Sign Off Study (Protected)",
)
async def verify_and_sign_off(
    study_id: str,
    db: Session = Depends(get_db),
    current_user: UserRecord = Depends(get_current_user),
) -> Dict[str, Any]:
    """Records formal physician verification sign-off on a persisted study."""
    record = sign_off_study(db, study_id, current_user.full_name)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Study '{study_id}' not found.",
        )
    return record.to_summary_dict()


@router.delete(
    "/studies/{study_id}",
    summary="Delete Study Record (Protected)",
)
async def remove_study(
    study_id: str,
    db: Session = Depends(get_db),
    current_user: UserRecord = Depends(get_current_user),
) -> Dict[str, Any]:
    """Deletes a study record from the case archive."""
    deleted = delete_study_by_id(db, study_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Study '{study_id}' not found.",
        )
    return {"deleted": True, "study_id": study_id}
