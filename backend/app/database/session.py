"""
Database session management for MEDIVISTA AI.

Provides:
  - SQLite engine + SessionLocal factory
  - FastAPI dependency `get_db()`
  - Helper CRUD functions used by the analysis pipeline
"""

import json
import logging
from typing import Generator, List, Optional

from sqlalchemy import create_engine, desc
from sqlalchemy.orm import Session, sessionmaker

from .models import Base, StudyRecord

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Engine & session factory
# ---------------------------------------------------------------------------
DATABASE_URL = "sqlite:///./medivista_cases.db"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},  # Required for SQLite + FastAPI
    echo=False,  # Set True for SQL debug logging
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


# ---------------------------------------------------------------------------
# FastAPI dependency
# ---------------------------------------------------------------------------
def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency that yields a database session and guarantees cleanup.

    Usage::

        @app.get("/studies")
        def list_studies(db: Session = Depends(get_db)):
            return get_all_studies(db)
    """
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ---------------------------------------------------------------------------
# Schema initialisation
# ---------------------------------------------------------------------------
def init_db() -> None:
    """Create all tables defined in the ORM metadata (idempotent)."""
    logger.info("Initialising database schema …")
    Base.metadata.create_all(bind=engine)
    logger.info("Database schema ready.")


# ---------------------------------------------------------------------------
# CRUD helpers
# ---------------------------------------------------------------------------
def save_study(db: Session, study_response_dict: dict) -> StudyRecord:
    """
    Persist a StudyRecord built from the analysis-pipeline response dict.

    Expected keys in *study_response_dict* (all optional except ``study_id``):
        study_id, patient_id, modality, filename, is_dicom,
        age, gender, symptoms, clinical_history,
        findings (list), ruled_out (list), radiology_report (dict), cds (dict),
        urgency_level, processing_time_ms, has_critical_finding
    """
    d = study_response_dict  # shorthand

    def _to_json(value) -> Optional[str]:
        if value is None:
            return None
        if isinstance(value, str):
            return value  # already serialised
        try:
            return json.dumps(value)
        except (TypeError, ValueError) as exc:
            logger.warning("Could not serialise value to JSON: %s", exc)
            return None

    # Derive has_critical_finding from findings list if not explicitly provided
    findings_list: list = d.get("findings") or []
    has_critical = d.get("has_critical_finding", any(
        f.get("is_critical", False) for f in findings_list
    ))

    record = StudyRecord(
        study_id=d["study_id"],
        patient_id=d.get("patient_id"),
        modality=d.get("modality"),
        filename=d.get("filename"),
        is_dicom=bool(d.get("is_dicom", False)),
        age=d.get("age"),
        gender=d.get("gender"),
        symptoms=d.get("symptoms"),
        clinical_history=d.get("clinical_history"),
        findings_json=_to_json(findings_list),
        ruled_out_json=_to_json(d.get("ruled_out")),
        radiology_report_json=_to_json(d.get("radiology_report")),
        cds_json=_to_json(d.get("cds") or d.get("clinical_decision_support")),
        patient_guidance_json=_to_json(d.get("patient_guidance")),
        urgency_level=d.get("urgency_level") or (d.get("radiology_report") or {}).get("urgency_level", "ROUTINE"),
        processing_time_ms=d.get("processing_time_ms"),
        has_critical_finding=has_critical,
    )

    db.add(record)
    db.commit()
    db.refresh(record)
    logger.info("Saved StudyRecord study_id=%s id=%s", record.study_id, record.id)
    return record


def get_all_studies(db: Session, limit: int = 50) -> List[StudyRecord]:
    """
    Return up to *limit* most-recent studies, ordered by created_at descending.
    """
    return (
        db.query(StudyRecord)
        .order_by(desc(StudyRecord.created_at))
        .limit(limit)
        .all()
    )


def get_study_by_id(db: Session, study_id: str) -> Optional[StudyRecord]:
    """Return a single StudyRecord by its study_id, or None if not found."""
    return (
        db.query(StudyRecord)
        .filter(StudyRecord.study_id == study_id)
        .first()
    )
