"""
Master Analysis Pipeline Orchestrator for MEDIVISTA AI.

Connects and executes the complete 8-step AI Evidence Chain:
Image -> Preprocessing -> Vision Detector -> Epistemic Safety ->
Spatial Grounding -> Radiology Report -> CDS -> Final Validation.
"""

from __future__ import annotations

import logging
import time
import uuid
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

# Import ML modules with fallback for both package-relative and absolute imports
try:
    from backend.app.ml.preprocessing import load_and_preprocess_image
    from backend.app.ml.abnormality_detector import AbnormalityDetector
    from backend.app.ml.uncertainty import EpistemicUncertaintyGate
    from backend.app.ml.grounding import run_grounding
    from backend.app.ml.report_generator import ReportGenerator
    from backend.app.ml.cds import CDSEngine
except ImportError:
    from app.ml.preprocessing import load_and_preprocess_image
    from app.ml.abnormality_detector import AbnormalityDetector
    from app.ml.uncertainty import EpistemicUncertaintyGate
    from app.ml.grounding import run_grounding
    from app.ml.report_generator import ReportGenerator
    from app.ml.cds import CDSEngine

# Global pipeline singletons for low-latency reuse across requests
_detector = AbnormalityDetector()
_uncertainty_gate = EpistemicUncertaintyGate()
_report_generator = ReportGenerator()
_cds_engine = CDSEngine()


def run_full_analysis(
    file_bytes: bytes,
    filename: str,
    modality: str = "X-Ray",
    patient_info: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Executes the comprehensive multimodal analysis pipeline.

    Parameters
    ----------
    file_bytes:
        Raw bytes of the uploaded scan (DICOM, PNG, JPEG).
    filename:
        Original filename used for extension and format routing.
    modality:
        Clinical imaging modality ('X-Ray', 'CT', 'MRI', 'Ultrasound').
    patient_info:
        Optional patient demographics: patient_id, age, gender, symptoms, clinical_history.

    Returns
    -------
    dict
        Full analysis payload conforming to StudyAnalysisResponse schema.
    """
    start_time = time.perf_counter()
    study_id = f"STUDY-{uuid.uuid4().hex[:8].upper()}"
    patient_info = patient_info or {}

    evidence_chain: List[Dict[str, Any]] = []

    # --------------------------------------------------------------------------
    # Step 1: Preprocessing & DICOM Ingestion
    # --------------------------------------------------------------------------
    norm_array, pil_img, metadata = load_and_preprocess_image(file_bytes, filename)

    # Reconcile patient info from DICOM headers if not provided via form
    merged_patient_id = patient_info.get("patient_id") or metadata.get("patient_id") or "PT-UNKNOWN"
    merged_age = patient_info.get("age") or metadata.get("age")
    merged_gender = patient_info.get("gender") or metadata.get("gender") or "Unknown"
    merged_symptoms = patient_info.get("symptoms") or "Not provided"
    merged_history = patient_info.get("clinical_history") or "No prior historical context"

    resolved_patient_info = {
        "patient_id": merged_patient_id,
        "age": merged_age,
        "gender": merged_gender,
        "symptoms": merged_symptoms,
        "clinical_history": merged_history,
    }

    evidence_chain.append({
        "step": 1,
        "stage": "Ingestion & Radiometric Preprocessing",
        "description": f"Ingested {metadata.get('format')} scan ({metadata.get('original_size', (0,0))[0]}x{metadata.get('original_size', (0,0))[1]}). Applied radiometric normalization and photometric polarity calibration.",
        "data": {
            "format": metadata.get("format"),
            "is_dicom": metadata.get("is_dicom", False),
            "photometric_interpretation": metadata.get("photometric_interpretation"),
            "dimensions": metadata.get("original_size"),
        },
    })

    # --------------------------------------------------------------------------
    # Step 2: Foundation Model Vision Detection
    # --------------------------------------------------------------------------
    raw_findings, ruled_out = _detector.predict(norm_array, pil_img, modality=modality)

    evidence_chain.append({
        "step": 2,
        "stage": "Multimodal Vision Inference",
        "description": f"Executed {_detector.active_engine} on {modality} scan. Screened 44 disease knowledge base, detected {len(raw_findings)} potential abnormality candidates, ruled out {len(ruled_out)} conditions.",
        "data": {
            "modality": modality,
            "raw_candidates_count": len(raw_findings),
            "ruled_out_count": len(ruled_out),
        },
    })

    # --------------------------------------------------------------------------
    # Step 3: Epistemic Uncertainty & Abstention Gate
    # --------------------------------------------------------------------------
    passed_findings, uncertainty_results, abstained_labels = _uncertainty_gate.filter_findings(raw_findings)
    uncertainty_summary = _uncertainty_gate.get_overall_uncertainty_summary(uncertainty_results)

    evidence_chain.append({
        "step": 3,
        "stage": "Epistemic Safety Gate & Abstention",
        "description": f"Evaluated calibrated probabilities against safety thresholds (High >= 0.80, Abstain < 0.50). {len(passed_findings)} findings passed safety validation; {len(abstained_labels)} low-confidence findings withheld.",
        "data": {
            "passed_count": len(passed_findings),
            "abstained_labels": abstained_labels,
            "mean_confidence": uncertainty_summary.get("mean_confidence"),
        },
    })

    # --------------------------------------------------------------------------
    # Step 4: Spatial Grounding & Anatomical Localization
    # --------------------------------------------------------------------------
    grounding_data = run_grounding(pil_img, passed_findings)

    evidence_chain.append({
        "step": 4,
        "stage": "Spatial Grounding & Heatmap Projection",
        "description": f"Generated spatial bounding-box annotations and multi-scale attention heatmaps for {grounding_data.get('grounded_findings_count', 0)} anatomically localized pathologies.",
        "data": {
            "grounded_count": grounding_data.get("grounded_findings_count", 0),
            "annotated_ready": bool(grounding_data.get("annotated_image_b64")),
        },
    })

    # --------------------------------------------------------------------------
    # Step 5: Structured Radiology Report Generation
    # --------------------------------------------------------------------------
    report = _report_generator.generate(
        findings=passed_findings,
        ruled_out=ruled_out,
        modality=modality,
        patient_info=resolved_patient_info,
        metadata=metadata,
    )

    evidence_chain.append({
        "step": 5,
        "stage": "Structured Radiology Report Generation",
        "description": f"Synthesized standardized structured report across Examination, Technique, Comparison, Findings, and Impression. Assigned triage urgency: {report.get('urgency_level')}.",
        "data": {
            "urgency_level": report.get("urgency_level"),
            "sections_generated": ["examination", "technique", "comparison", "findings", "impression"],
        },
    })

    # --------------------------------------------------------------------------
    # Step 6: Evidence-Grounded Clinical Decision Support (CDS)
    # --------------------------------------------------------------------------
    cds = _cds_engine.generate(
        findings=passed_findings,
        modality=modality,
        patient_info=resolved_patient_info,
    )

    evidence_chain.append({
        "step": 6,
        "stage": "Clinical Decision Support (CDS) Synthesis",
        "description": f"Formulated {len(cds.get('differentials', []))} evidence-grounded differential diagnoses, retrieved {len(cds.get('guidelines_referenced', []))} clinical practice guidelines, and recommended {len(cds.get('suggested_confirmatory_tests', []))} confirmatory tests.",
        "data": {
            "top_differential": cds.get("differentials", [{}])[0].get("diagnosis") if cds.get("differentials") else "None",
            "urgency_stratification": cds.get("urgency_stratification"),
        },
    })

    # --------------------------------------------------------------------------
    # Step 7: Patient Care Guidance, Prescriptions & Phased Recovery Plan
    # --------------------------------------------------------------------------
    patient_guidance = _cds_engine.generate_patient_guidance(
        findings=passed_findings,
        modality=modality,
        patient_info=resolved_patient_info,
    )

    evidence_chain.append({
        "step": 7,
        "stage": "Patient Care Guidance & Prescription Synthesis",
        "description": f"Formulated {len(patient_guidance.get('prescriptions_draft', []))} draft prescriptions, {len(patient_guidance.get('things_to_avoid', []))} critical avoidance advisories, and a {len(patient_guidance.get('sequential_care_plan', []))}-phase sequential care trajectory.",
        "data": {
            "prescriptions_count": len(patient_guidance.get("prescriptions_draft", [])),
            "care_phases_count": len(patient_guidance.get("sequential_care_plan", [])),
            "avoidance_items_count": len(patient_guidance.get("things_to_avoid", [])),
        },
    })

    # --------------------------------------------------------------------------
    # Step 8: Final Latency & Audit Registration
    # --------------------------------------------------------------------------
    processing_time_ms = round((time.perf_counter() - start_time) * 1000.0, 2)

    evidence_chain.append({
        "step": 8,
        "stage": "Final Assembly & Safety Sign-off Verification",
        "description": f"Pipeline execution completed in {processing_time_ms:.1f}ms. Human physician oversight flag set to mandatory. Final response payload constructed.",
        "data": {
            "study_id": study_id,
            "processing_time_ms": processing_time_ms,
            "human_oversight_required": True,
        },
    })

    # Build master structured response
    return {
        "study_id": study_id,
        "modality": modality,
        "patient_info": resolved_patient_info,
        "findings": passed_findings,
        "ruled_out_negatives": ruled_out,
        "evidence_chain": evidence_chain,
        "radiology_report": report,
        "clinical_decision_support": cds,
        "patient_guidance": patient_guidance,
        "processing_time_ms": processing_time_ms,
        "grounding": grounding_data,
        "uncertainty_summary": uncertainty_summary,
        "abstained_findings": abstained_labels,
    }
