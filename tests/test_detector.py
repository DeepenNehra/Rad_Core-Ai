import sys
import os
import numpy as np
from PIL import Image

# Ensure both project root and backend are in Python path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(CURRENT_DIR)
BACKEND_DIR = os.path.join(PROJECT_ROOT, "backend")

for p in [PROJECT_ROOT, BACKEND_DIR]:
    if p not in sys.path:
        sys.path.insert(0, p)

try:
    from backend.app.ml.abnormality_detector import AbnormalityDetector, MODALITY_KNOWLEDGE_BASE
except ImportError:
    from app.ml.abnormality_detector import AbnormalityDetector, MODALITY_KNOWLEDGE_BASE

def test_multimodal_detector():
    print("Testing AbnormalityDetector with Microsoft Models Knowledge Base...")
    print(f"Total Modalities Registered: {len(MODALITY_KNOWLEDGE_BASE)}")

    total_diseases = 0
    for mod, kb in MODALITY_KNOWLEDGE_BASE.items():
        count = len(kb["pathologies"])
        total_diseases += count
        print(f"  • {mod.ljust(11)}: {count} Pathologies | Model: {kb['model_name']}")

    print(f"\nTotal Diseases Covered Across System: {total_diseases}")

    det = AbnormalityDetector()
    dummy_img = Image.new("RGB", (224, 224), color=(50, 50, 50))
    dummy_arr = np.zeros((224, 224), dtype=np.float32)

    for mod in ["X-Ray", "CT", "MRI", "Ultrasound"]:
        findings, ruled_out = det.predict(dummy_arr, dummy_img, modality=mod)
        assert len(findings) > 0, f"No findings returned for {mod}"
        top_f = findings[0]
        print(f"\n[{mod} Verification]")
        print(f"  Top Finding : {top_f['label']}")
        print(f"  Location    : {top_f['anatomical_location']}")
        print(f"  Confidence  : {top_f['confidence'] * 100:.1f}%")
        print(f"  Bounding Box: {top_f['bounding_box']}")
        print(f"  Ruled Out   : {ruled_out[0]}")

    print("\nAll 4 Modalities verified successfully!")

if __name__ == "__main__":
    test_multimodal_detector()
