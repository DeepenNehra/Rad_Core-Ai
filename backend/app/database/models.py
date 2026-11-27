"""
SQLAlchemy ORM models for MEDIVISTA AI case history and clinician authentication.
Uses SQLAlchemy 2.x style with declarative_base.
"""

import json
from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    Index,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import declarative_base

Base = declarative_base()


class UserRecord(Base):
    """Clinician / Physician user account for JWT-protected workstation access."""

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(64), unique=True, nullable=False, index=True)
    email = Column(String(120), unique=True, nullable=False, index=True)
    full_name = Column(String(120), nullable=False)
    role = Column(String(32), default="Radiologist", nullable=False)
    department = Column(String(80), default="Diagnostic Radiology", nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    def to_public_dict(self) -> dict:
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "full_name": self.full_name,
            "role": self.role,
            "department": self.department,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class StudyRecord(Base):
    """Persisted record for a single radiology study analysis."""

    __tablename__ = "study_records"

    # Primary key
    id = Column(Integer, primary_key=True, autoincrement=True)

    # Study / patient identifiers
    study_id = Column(String(50), unique=True, nullable=False, index=True)
    patient_id = Column(String(50), nullable=True, index=True)

    # Acquisition metadata
    modality = Column(String(20), nullable=True)          # X-Ray / CT / MRI / Ultrasound
    filename = Column(String(255), nullable=True)
    is_dicom = Column(Boolean, default=False, nullable=False)

    # Patient demographics
    age = Column(Integer, nullable=True)
    gender = Column(String(20), nullable=True)

    # Clinical context
    symptoms = Column(Text, nullable=True)
    clinical_history = Column(Text, nullable=True)

    # Analysis results (stored as JSON strings)
    findings_json = Column(Text, nullable=True)           # List[dict]
    ruled_out_json = Column(Text, nullable=True)          # List[str]
    radiology_report_json = Column(Text, nullable=True)   # RadiologyReport dict
    cds_json = Column(Text, nullable=True)                # ClinicalDecisionSupport dict
    patient_guidance_json = Column(Text, nullable=True)   # PatientGuidance dict
    evidence_chain_json = Column(Text, nullable=True)     # List[EvidenceChainLink]
    grounding_json = Column(Text, nullable=True)          # GroundingData dict (annotated + heatmap b64)

    # Risk / workflow fields
    urgency_level = Column(String(20), default="ROUTINE", nullable=False)
    processing_time_ms = Column(Float, nullable=True)
    has_critical_finding = Column(Boolean, default=False, nullable=False)

    # Clinician Audit & Sign-Off
    created_by_user = Column(String(120), nullable=True)
    signed_off_by = Column(String(120), nullable=True)
    signed_off_at = Column(DateTime, nullable=True)

    # Audit
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index("ix_study_records_patient_created", "patient_id", "created_at"),
    )

    def __repr__(self) -> str:
        return (
            f"<StudyRecord id={self.id!r} study_id={self.study_id!r} "
            f"modality={self.modality!r} urgency={self.urgency_level!r}>"
        )

    def to_summary_dict(self) -> dict:
        """Return a lightweight dict suitable for history list views."""
        findings: list = []
        try:
            raw = self.findings_json
            if raw:
                findings = json.loads(raw)
        except (json.JSONDecodeError, TypeError):
            findings = []

        finding_count = len(findings)
        top_finding: str | None = findings[0].get("label") if findings else None

        return {
            "id": self.id,
            "study_id": self.study_id,
            "patient_id": self.patient_id,
            "modality": self.modality,
            "filename": self.filename,
            "is_dicom": self.is_dicom,
            "age": self.age,
            "gender": self.gender,
            "urgency_level": self.urgency_level,
            "has_critical_finding": self.has_critical_finding,
            "findings_count": finding_count,
            "finding_count": finding_count,
            "top_finding": top_finding,
            "processing_time_ms": self.processing_time_ms,
            "created_by_user": self.created_by_user,
            "signed_off_by": self.signed_off_by,
            "signed_off_at": self.signed_off_at.isoformat() if self.signed_off_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def to_full_dict(self) -> dict:
        """Return the complete record including all JSON blobs (deserialized)."""

        def _safe_json(value):
            if value is None:
                return None
            try:
                return json.loads(value)
            except (json.JSONDecodeError, TypeError):
                return value

        return {
            **self.to_summary_dict(),
            "patient_info": {
                "patient_id": self.patient_id or "PT-UNKNOWN",
                "age": self.age,
                "gender": self.gender or "Unknown",
                "symptoms": self.symptoms,
                "clinical_history": self.clinical_history,
            },
            "symptoms": self.symptoms,
            "clinical_history": self.clinical_history,
            "findings": _safe_json(self.findings_json) or [],
            "ruled_out_negatives": _safe_json(self.ruled_out_json) or [],
            "ruled_out": _safe_json(self.ruled_out_json) or [],
            "radiology_report": _safe_json(self.radiology_report_json),
            "clinical_decision_support": _safe_json(self.cds_json),
            "cds": _safe_json(self.cds_json),
            "patient_guidance": _safe_json(self.patient_guidance_json),
            "evidence_chain": _safe_json(self.evidence_chain_json) or [],
            "grounding": _safe_json(self.grounding_json),
        }
