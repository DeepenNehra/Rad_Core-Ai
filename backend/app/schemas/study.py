from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class PatientInfo(BaseModel):
    """
    Patient Clinical Metadata (PRD Section 10.2 & Diagram Box 1).
    """
    patient_id: str = Field(default="PT-UNKNOWN", description="Anonymized unique patient identifier")
    age: Optional[int] = Field(default=None, ge=0, le=125, description="Patient age in years")
    gender: Optional[str] = Field(default="Unknown", description="Biological sex (Male, Female, Other)")
    symptoms: Optional[str] = Field(default=None, description="Presenting complaints (e.g. fever, cough, chest pain)")
    clinical_history: Optional[str] = Field(default=None, description="Relevant prior clinical history")

class BoundingBox(BaseModel):
    """
    Spatial 2D Coordinates for anatomical localization (PRD Section 13.2 & Diagram Box 2).
    """
    x: int = Field(..., ge=0, description="Top-left X coordinate in pixels")
    y: int = Field(..., ge=0, description="Top-left Y coordinate in pixels")
    width: int = Field(..., gt=0, description="Bounding box width in pixels")
    height: int = Field(..., gt=0, description="Bounding box height in pixels")

class PathologyFinding(BaseModel):
    """
    Structured Finding Output from Vision Backbone (PRD Section 16 & Diagram Box 2).
    """
    id: str = Field(..., description="Unique finding ID (e.g. FINDING-CON-01)")
    label: str = Field(..., description="Pathology label (e.g. Consolidation, Pleural Effusion)")
    anatomical_location: str = Field(..., description="Anatomical location (e.g. Right Lower Lobe)")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Calibrated model probability [0.0 - 1.0]")
    uncertainty: float = Field(default=0.0, ge=0.0, le=1.0, description="Epistemic uncertainty score")
    severity: str = Field(default="Mild", description="Severity grade: Normal, Mild, Moderate, Severe")
    bounding_box: Optional[BoundingBox] = Field(default=None, description="Spatial coordinates if localized")
    evidence_text: Optional[str] = Field(default=None, description="Radiological description of visual pattern")
    is_critical: bool = Field(default=False, description="Flag for urgent clinical attention")

class EvidenceChainLink(BaseModel):
    """
    Step in the traceable AI Evidence Chain (PRD Section 1.1, 10.1).
    """
    step: int = Field(..., description="Step sequence number")
    stage: str = Field(..., description="Name of processing stage")
    description: str = Field(..., description="Human-readable explanation of operation")
    data: Dict[str, Any] = Field(default_factory=dict, description="Diagnostic payload at this stage")

class RadiologyReport(BaseModel):
    """
    Structured Multi-Section Radiology Report (PRD Section 13.2 & Diagram Box 3).
    """
    examination: str = Field(default="Chest Radiograph (PA View)", description="Exam type and protocol")
    technique: str = Field(default="Digital chest radiograph", description="Technical exposure details")
    comparison: str = Field(default="No prior studies available", description="Longitudinal comparison context")
    findings: str = Field(..., description="Structured findings narrative across lungs, pleura, heart")
    impression: str = Field(..., description="Summary diagnostic impression paragraphs")
    urgency_level: str = Field(default="ROUTINE", description="ROUTINE, INTERMEDIATE, or URGENT")
    disclaimer: str = Field(
        default="AI-generated draft for educational/research evaluation only. "
                "Requires review and sign-off by a qualified licensed physician.",
        description="Mandatory clinical safety disclaimer"
    )

class DifferentialItem(BaseModel):
    """
    Individual differential diagnosis candidate (PRD Section 17 & Diagram Box 3).
    """
    diagnosis: str = Field(..., description="Disease or condition name")
    probability: float = Field(..., ge=0.0, le=1.0, description="Relative statistical probability")
    evidence: str = Field(..., description="Reasoning connecting imaging finding to diagnosis")

class ClinicalDecisionSupport(BaseModel):
    """
    Evidence-grounded Clinical Decision Support (PRD Section 17 & Diagram Box 3).
    """
    differentials: List[DifferentialItem] = Field(default_factory=list, description="Prioritized differential diagnoses")
    urgency_stratification: str = Field(..., description="Triage category (e.g. CURB-65 / Pneumonia severity)")
    suggested_confirmatory_tests: List[str] = Field(default_factory=list, description="Recommended laboratory/imaging workup")
    treatment_considerations_draft: List[str] = Field(default_factory=list, description="Clinician-reviewable treatment guidance")
    guidelines_referenced: List[str] = Field(default_factory=list, description="Accredited clinical guidelines cited (ATS/IDSA, GOLD)")
    human_oversight_required: bool = Field(default=True, description="Strict safety constraint requiring physician sign-off")

class StudyAnalysisResponse(BaseModel):
    """
    Master Response Payload returned to Doctor Workstation (PRD Section 11 & Diagram Box 4).
    """
    study_id: str = Field(..., description="Unique study tracking ID")
    modality: str = Field(default="X-Ray", description="Imaging modality (X-Ray, CT, MRI, Ultrasound)")
    patient_info: PatientInfo = Field(..., description="Patient demographic and clinical metadata")
    findings: List[PathologyFinding] = Field(default_factory=list, description="List of detected abnormalities")
    ruled_out_negatives: List[str] = Field(default_factory=list, description="Verified negative conditions for clinical assurance")
    evidence_chain: List[EvidenceChainLink] = Field(default_factory=list, description="Full traceable AI Evidence Chain")
    radiology_report: RadiologyReport = Field(..., description="Complete generated Findings & Impression report")
    clinical_decision_support: ClinicalDecisionSupport = Field(..., description="Evidence-grounded decision support guidance")
    processing_time_ms: float = Field(..., description="Total pipeline latency in milliseconds")
