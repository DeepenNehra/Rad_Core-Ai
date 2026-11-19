"""
End-to-End Pipeline Unit & Integration Tests for MEDIVISTA AI.
Tests ingestion, vision detection, uncertainty gate, spatial grounding,
structured report writer, and clinical decision support.
"""

import os
import sys
import numpy as np
from PIL import Image

# Setup paths
TEST_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(TEST_DIR)
BACKEND_DIR = os.path.join(PROJECT_ROOT, "backend")

for p in [PROJECT_ROOT, BACKEND_DIR]:
    if p not in sys.path:
        sys.path.insert(0, p)

try:
    from backend.app.services.analysis_pipeline import run_full_analysis
    from backend.app.ml.abnormality_detector import MODALITY_KNOWLEDGE_BASE
except ImportError:
    from app.services.analysis_pipeline import run_full_analysis
    from app.ml.abnormality_detector import MODALITY_KNOWLEDGE_BASE


def test_full_pipeline_all_modalities():
    """
    Validates end-to-end execution for all 4 modalities:
    X-Ray, CT, MRI, and Ultrasound.
    """
    print("\n" + "=" * 70)
    print("RUNNING MEDIVISTA AI END-TO-END PIPELINE VALIDATION")
    print("=" * 70)

    # Create dummy PNG image bytes
    dummy_img = Image.new("RGB", (256, 256), color=(40, 40, 40))
    import io
    img_byte_arr = io.BytesIO()
    dummy_img.save(img_byte_arr, format="PNG")
    raw_bytes = img_byte_arr.getvalue()

    patient_payload = {
        "patient_id": "PT-VERIFY-001",
        "age": 58,
        "gender": "Male",
        "symptoms": "Cough, low-grade fever, mild dyspnea on exertion",
        "clinical_history": "Former smoker (15 pack-years), mild hypertension",
    }

    modalities = ["X-Ray", "CT", "MRI", "Ultrasound"]

    for mod in modalities:
        print(f"\n--- Testing Pipeline Modality: {mod} ---")
        result = run_full_analysis(
            file_bytes=raw_bytes,
            filename=f"test_scan_{mod.lower()}.png",
            modality=mod,
            patient_info=patient_payload,
        )

        assert "study_id" in result, "Missing study_id in response"
        assert result["modality"] == mod, f"Modality mismatch: {result['modality']}"
        assert len(result["findings"]) > 0, "No findings returned"
        assert len(result["ruled_out_negatives"]) > 0, "No ruled-out negatives"
        assert len(result["evidence_chain"]) >= 7, "Incomplete evidence chain"
        assert "radiology_report" in result, "Missing radiology report"
        assert "clinical_decision_support" in result, "Missing CDS"
        assert "patient_guidance" in result, "Missing patient guidance"
        assert len(result["patient_guidance"]["prescriptions_draft"]) > 0, "No prescriptions generated"
        assert len(result["patient_guidance"]["things_to_avoid"]) > 0, "No things to avoid generated"
        assert len(result["patient_guidance"]["sequential_care_plan"]) > 0, "No sequential care plan"
        assert "grounding" in result, "Missing spatial grounding"

        report = result["radiology_report"]
        cds = result["clinical_decision_support"]
        guidance = result["patient_guidance"]

        print(f"  • Study ID        : {result['study_id']}")
        print(f"  • Latency         : {result['processing_time_ms']:.2f} ms")
        print(f"  • Findings Count  : {len(result['findings'])}")
        print(f"  • Top Finding     : {result['findings'][0]['label']} ({result['findings'][0]['confidence']*100:.1f}%)")
        print(f"  • Report Urgency  : {report.get('urgency_level')}")
        print(f"  • Top Differential: {cds['differentials'][0]['diagnosis']} ({cds['differentials'][0]['probability']*100:.0f}%)")
        print(f"  • Prescriptions   : {len(guidance['prescriptions_draft'])} Rx items generated")
        print(f"  • Avoidance Items : {len(guidance['things_to_avoid'])} triggers listed")
        print(f"  • Sequential Care : {len(guidance['sequential_care_plan'])} recovery phases")
        print(f"  • Guidelines Cited: {len(cds['guidelines_referenced'])}")
        print(f"  • Grounding Ready : {'annotated_image_b64' in result['grounding']}")

    print("\n" + "=" * 70)
    print("ALL 4 MODALITIES PASSED PIPELINE INTEGRATION VERIFICATION")
    print("=" * 70)


if __name__ == "__main__":
    test_full_pipeline_all_modalities()
