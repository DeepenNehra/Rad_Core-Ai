"""
Database session management for MEDIVISTA AI.

Supports:
  - Production PostgreSQL via DATABASE_URL (Neon / Supabase / Railway / Render)
  - Local SQLite fallback (`sqlite:///./medivista_cases.db`)
  - Automatic schema initialization & lightweight column migration
  - Default demo clinician seeding
  - Full Study & User CRUD helpers
"""

import json
import logging
from datetime import datetime
from typing import Generator, List, Optional

from sqlalchemy import create_engine, desc, func, inspect, text
from sqlalchemy.orm import Session, sessionmaker

from .models import Base, StudyRecord, UserRecord

try:
    from backend.app.core.config import settings
except ImportError:
    from app.core.config import settings

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Engine & session factory
# ---------------------------------------------------------------------------
DATABASE_URL = (settings.DATABASE_URL or "").strip() or "sqlite:///./medivista_cases.db"
_is_sqlite = DATABASE_URL.startswith("sqlite")


def _build_engine(db_url: str):
    kwargs = {"echo": False, "pool_pre_ping": True}
    if db_url.startswith("sqlite"):
        kwargs["connect_args"] = {"check_same_thread": False}
    try:
        return create_engine(db_url, **kwargs), db_url
    except Exception as exc:
        logger.error("Failed to initialize SQLAlchemy engine for configured DATABASE_URL (%s): %s", db_url.split("://")[0], exc)
        fallback_url = "sqlite:///./medivista_cases.db"
        logger.warning("Falling back to local SQLite database: %s", fallback_url)
        return create_engine(fallback_url, echo=False, pool_pre_ping=True, connect_args={"check_same_thread": False}), fallback_url


engine, DATABASE_URL = _build_engine(DATABASE_URL)
_is_sqlite = DATABASE_URL.startswith("sqlite")

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


# ---------------------------------------------------------------------------
# FastAPI dependency
# ---------------------------------------------------------------------------
def get_db() -> Generator[Session, None, None]:
    """Yields a SQLAlchemy database session and guarantees cleanup."""
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ---------------------------------------------------------------------------
# Schema initialisation & safe local migration
# ---------------------------------------------------------------------------
def _ensure_study_columns() -> None:
    """Safely add new audit columns if upgrading an existing local SQLite DB."""
    try:
        inspector = inspect(engine)
        if "study_records" not in inspector.get_table_names():
            return
        existing_cols = {col["name"] for col in inspector.get_columns("study_records")}
        migrations = {
            "evidence_chain_json": "TEXT",
            "grounding_json": "TEXT",
            "created_by_user": "VARCHAR(120)",
            "signed_off_by": "VARCHAR(120)",
            "signed_off_at": "TIMESTAMP",
        }
        with engine.begin() as conn:
            for col_name, col_type in migrations.items():
                if col_name not in existing_cols:
                    conn.execute(text(f"ALTER TABLE study_records ADD COLUMN {col_name} {col_type}"))
                    logger.info("Migrated column study_records.%s", col_name)
    except Exception as exc:
        logger.warning("Column migration check skipped/warning: %s", exc)


def _seed_demo_doctor() -> None:
    """Ensure a default clinician account exists for immediate testing & viva demos."""
    try:
        try:
            from backend.app.core.security import hash_password
        except ImportError:
            from app.core.security import hash_password

        db = SessionLocal()
        try:
            existing = db.query(UserRecord).first()
            if not existing:
                demo_user = UserRecord(
                    username=settings.DEMO_DOCTOR_USERNAME,
                    email=settings.DEMO_DOCTOR_EMAIL,
                    full_name=settings.DEMO_DOCTOR_NAME,
                    role="Senior Radiologist",
                    department="Multimodal Diagnostic Imaging",
                    hashed_password=hash_password(settings.DEMO_DOCTOR_PASSWORD),
                    is_active=True,
                )
                db.add(demo_user)
                db.commit()
                logger.info("Seeded default demo clinician account: %s", demo_user.username)
        finally:
            db.close()
    except Exception as exc:
        logger.warning("Could not seed demo clinician account: %s", exc)


def init_db() -> None:
    """Create all tables defined in the ORM metadata and seed demo clinician."""
    logger.info("Initialising database schema (%s) …", "SQLite" if _is_sqlite else "PostgreSQL")
    Base.metadata.create_all(bind=engine)
    _ensure_study_columns()
    _seed_demo_doctor()
    logger.info("Database schema ready.")


# ---------------------------------------------------------------------------
# User CRUD helpers
# ---------------------------------------------------------------------------
def get_user_by_username(db: Session, username: str) -> Optional[UserRecord]:
    clean = (username or "").strip().lower()
    if not clean:
        return None
    return db.query(UserRecord).filter(func.lower(UserRecord.username) == clean).first()


def get_user_by_email(db: Session, email: str) -> Optional[UserRecord]:
    clean = (email or "").strip().lower()
    if not clean:
        return None
    return db.query(UserRecord).filter(func.lower(UserRecord.email) == clean).first()


def create_user(
    db: Session,
    username: str,
    email: str,
    full_name: str,
    hashed_password: str,
    role: str = "Radiologist",
    department: str = "Diagnostic Radiology",
) -> UserRecord:
    user = UserRecord(
        username=username,
        email=email,
        full_name=full_name,
        role=role,
        department=department,
        hashed_password=hashed_password,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


# ---------------------------------------------------------------------------
# Study CRUD helpers
# ---------------------------------------------------------------------------
def save_study(
    db: Session,
    study_response_dict: dict,
    filename: Optional[str] = None,
    created_by_user: Optional[str] = None,
) -> StudyRecord:
    """Persist a StudyRecord built from the analysis-pipeline response dict."""
    d = study_response_dict
    pinfo = d.get("patient_info") or {}

    def _to_json(value) -> Optional[str]:
        if value is None:
            return None
        if isinstance(value, str):
            return value
        try:
            return json.dumps(value)
        except (TypeError, ValueError) as exc:
            logger.warning("Could not serialise value to JSON: %s", exc)
            return None

    findings_list: list = d.get("findings") or []
    has_critical = d.get(
        "has_critical_finding",
        any(f.get("is_critical", False) for f in findings_list),
    )

    # Extract DICOM flag from step 1 of evidence chain if not explicitly set
    evidence_chain = d.get("evidence_chain") or []
    is_dicom = bool(d.get("is_dicom", False))
    if not is_dicom and evidence_chain:
        is_dicom = bool((evidence_chain[0].get("data") or {}).get("is_dicom", False))

    record = StudyRecord(
        study_id=d["study_id"],
        patient_id=d.get("patient_id") or pinfo.get("patient_id") or "PT-UNKNOWN",
        modality=d.get("modality"),
        filename=filename or d.get("filename"),
        is_dicom=is_dicom,
        age=d.get("age") if d.get("age") is not None else pinfo.get("age"),
        gender=d.get("gender") or pinfo.get("gender") or "Unknown",
        symptoms=d.get("symptoms") or pinfo.get("symptoms"),
        clinical_history=d.get("clinical_history") or pinfo.get("clinical_history"),
        findings_json=_to_json(findings_list),
        ruled_out_json=_to_json(d.get("ruled_out_negatives") or d.get("ruled_out")),
        radiology_report_json=_to_json(d.get("radiology_report")),
        cds_json=_to_json(d.get("clinical_decision_support") or d.get("cds")),
        patient_guidance_json=_to_json(d.get("patient_guidance")),
        evidence_chain_json=_to_json(evidence_chain),
        grounding_json=_to_json(d.get("grounding")),
        urgency_level=d.get("urgency_level")
        or (d.get("radiology_report") or {}).get("urgency_level", "ROUTINE"),
        processing_time_ms=d.get("processing_time_ms"),
        has_critical_finding=has_critical,
        created_by_user=created_by_user,
    )

    db.add(record)
    db.commit()
    db.refresh(record)
    logger.info("Saved StudyRecord study_id=%s id=%s", record.study_id, record.id)
    return record


def get_all_studies(
    db: Session,
    limit: int = 50,
    modality: Optional[str] = None,
    search: Optional[str] = None,
) -> List[StudyRecord]:
    """Return up to *limit* most-recent studies with optional filtering."""
    query = db.query(StudyRecord)
    if modality and modality.lower() != "all":
        query = query.filter(StudyRecord.modality == modality)
    if search:
        pattern = f"%{search.strip()}%"
        query = query.filter(
            (StudyRecord.study_id.ilike(pattern))
            | (StudyRecord.patient_id.ilike(pattern))
            | (StudyRecord.findings_json.ilike(pattern))
        )
    return query.order_by(desc(StudyRecord.created_at)).limit(limit).all()


def get_study_by_id(db: Session, study_id: str) -> Optional[StudyRecord]:
    """Return a single StudyRecord by its study_id, or None if not found."""
    return db.query(StudyRecord).filter(StudyRecord.study_id == study_id).first()


def sign_off_study(db: Session, study_id: str, doctor_name: str) -> Optional[StudyRecord]:
    """Mark a study as verified & signed off by the authenticated clinician."""
    record = get_study_by_id(db, study_id)
    if not record:
        return None
    record.signed_off_by = doctor_name
    record.signed_off_at = datetime.utcnow()
    db.commit()
    db.refresh(record)
    return record


def delete_study_by_id(db: Session, study_id: str) -> bool:
    """Delete a study record by study_id. Returns True if deleted."""
    record = get_study_by_id(db, study_id)
    if not record:
        return False
    db.delete(record)
    db.commit()
    return True
