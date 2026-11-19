"""
FastAPI Route Controllers for MEDIVISTA AI.

Endpoints:
- POST /api/v1/analyze     : Full multimodal image analysis & report generation
- GET  /api/v1/health      : System health, foundation model status, and runtime metrics
- GET  /api/v1/modalities  : Supported imaging modalities and 44-pathology taxonomy
- GET  /api/v1/history     : Clinical case history and recent study records
- GET  /api/v1/studies/{id}: Detailed study record lookup by ID
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

# Import backend services and knowledge bases with fallbacks
try:
    from backend.app.services.analysis_pipeline import run_full_analysis
    from backend.app.ml.abnormality_detector import MODALITY_KNOWLEDGE_BASE
    from backend.app.database.session import get_db, save_study, get_all_studies, get_study_by_id
    from backend.app.core.config import settings
except ImportError:
    from app.services.analysis_pipeline import run_full_analysis
    from app.ml.abnormality_detector import MODALITY_KNOWLEDGE_BASE
    from app.database.session import get_db, save_study, get_all_studies, get_study_by_id
    from app.core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["MEDIVISTA AI"])

ALLOWED_EXTENSIONS = {".dcm", ".dicom", ".png", ".jpg", ".jpeg"}


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
) -> JSONResponse:
    """
    Main multimodal analysis endpoint.
    """
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
        # Run master end-to-end pipeline
        result = run_full_analysis(
            file_bytes=file_bytes,
            filename=filename,
            modality=modality,
            patient_info=patient_info,
        )

        # Save to database (non-blocking safety wrap)
        try:
            save_study(db, result)
        except Exception as db_err:
            logger.warning(f"Could not persist study record to database: {db_err}")

        return JSONResponse(status_code=status.HTTP_200_OK, content=result)

    except Exception as exc:
        logger.exception("Error executing multimodal analysis pipeline")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analysis pipeline execution failed: {str(exc)}",
        )


@router.get(
    "/health",
    summary="System Health & Model Status",
    description="Returns runtime status of MEDIVISTA AI, connected Microsoft vision backbones, and operational statistics.",
)
async def health_check() -> Dict[str, Any]:
    """
    Returns platform diagnostics.
    """
    total_pathologies = sum(len(kb["pathologies"]) for kb in MODALITY_KNOWLEDGE_BASE.values())
    return {
        "status": "healthy",
        "service": "MEDIVISTA AI Copilot Backend",
        "version": getattr(settings, "VERSION", "1.0.0"),
        "active_backbone": "Microsoft-BioViL-BiomedCLIP-Hybrid",
        "modalities_supported": list(MODALITY_KNOWLEDGE_BASE.keys()),
        "total_pathologies_covered": total_pathologies,
        "human_oversight_enforced": True,
    }


@router.get(
    "/modalities",
    summary="List Supported Modalities & Pathologies",
    description="Returns the complete 44-pathology clinical registry organized by modality and foundational model.",
)
async def list_modalities() -> Dict[str, Any]:
    """
    Returns full modality registry with anatomical mappings and pathology lists.
    """
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


@router.get(
    "/history",
    summary="Get Case History",
    description="Retrieves the 50 most recent analyzed radiology studies from persistent case storage.",
)
async def get_history(
    limit: int = 50,
    db: Session = Depends(get_db),
) -> List[Dict[str, Any]]:
    """
    Returns paginated list of past study analyses.
    """
    try:
        records = get_all_studies(db, limit=limit)
        return [r.to_summary_dict() for r in records]
    except Exception as e:
        logger.warning(f"Error querying history: {e}")
        return []


@router.get(
    "/studies/{study_id}",
    summary="Get Detailed Study Record",
    description="Lookup complete study analysis payload by unique study tracking identifier.",
)
async def get_study_details(
    study_id: str,
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """
    Returns complete deserialized study record.
    """
    record = get_study_by_id(db, study_id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Study with ID '{study_id}' was not found in database.",
        )
    return record.to_full_dict()
