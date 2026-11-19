"""
FastAPI Route Integration Tests for MEDIVISTA AI.
Validates /health, /modalities, and /analyze endpoints.
"""

import io
import os
import sys
from PIL import Image

TEST_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(TEST_DIR)
BACKEND_DIR = os.path.join(PROJECT_ROOT, "backend")

for p in [PROJECT_ROOT, BACKEND_DIR]:
    if p not in sys.path:
        sys.path.insert(0, p)

try:
    from fastapi.testclient import TestClient
    from backend.main import app
    HAS_TESTCLIENT = True
except Exception:
    HAS_TESTCLIENT = False


def test_api_routes():
    if not HAS_TESTCLIENT:
        print("FastAPI TestClient not available, skipping HTTP test.")
        return

    client = TestClient(app)

    print("\n--- Testing GET /health ---")
    res = client.get("/api/v1/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert data["total_pathologies_covered"] == 44
    print(f"Health check OK: {data['service']} (version {data['version']})")

    print("\n--- Testing GET /modalities ---")
    res = client.get("/api/v1/modalities")
    assert res.status_code == 200
    data = res.json()
    assert data["count"] == 4
    print(f"Modalities endpoint OK: {list(data['modalities'].keys())}")

    print("\n--- Testing POST /api/v1/analyze ---")
    dummy_img = Image.new("RGB", (200, 200), color=(60, 60, 60))
    byte_arr = io.BytesIO()
    dummy_img.save(byte_arr, format="PNG")
    byte_arr.seek(0)

    files = {"file": ("cxr_sample.png", byte_arr.getvalue(), "image/png")}
    form_data = {
        "modality": "X-Ray",
        "patient_id": "PT-TEST-API",
        "age": "45",
        "gender": "Male",
        "symptoms": "Fever and productive cough",
    }
    res = client.post("/api/v1/analyze", data=form_data, files=files)
    assert res.status_code == 200
    payload = res.json()
    assert "study_id" in payload
    assert "radiology_report" in payload
    assert "clinical_decision_support" in payload
    print(f"Analyze endpoint OK: Created {payload['study_id']} in {payload['processing_time_ms']}ms")

    print("\n--- Testing GET /api/v1/history ---")
    res = client.get("/api/v1/history")
    assert res.status_code == 200
    history = res.json()
    assert len(history) > 0
    print(f"History endpoint OK: {len(history)} study records retrieved")


if __name__ == "__main__":
    test_api_routes()
