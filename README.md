# MEDIVISTA AI — Multimodal Medical Imaging AI Copilot

**Multimodal Medical Imaging AI Copilot for Grounded Analysis, Report Generation and Clinical Decision Support**  
*Academic & Educational Research Prototype (X-Ray, CT, MRI, Ultrasound)*

---

## 1. Project Overview

MEDIVISTA AI is a modular, research-oriented medical imaging interpretation platform designed to assist qualified healthcare professionals and researchers. The system implements a fully traceable **AI Evidence Chain**:

$$\text{Image} \longrightarrow \text{Finding} \longrightarrow \text{Anatomical Location} \longrightarrow \text{Measurement} \longrightarrow \text{Structured Finding} \longrightarrow \text{Report Statement} \longrightarrow \text{Clinical Evidence} \longrightarrow \text{Clinical Decision Support}$$

---

## 2. Multi-Modality Vision Models (Microsoft Foundation Stack)

The platform supports 4 cornerstone imaging modalities covering **44 clinical pathologies**:

| Modality | Foundation Model Backbone | Pathologies Covered | Key Clinical Detections |
| :---: | :---: | :---: | :--- |
| **X-Ray** | `microsoft/BiomedVLP-BioViL-T` | **14 Pathologies** | Consolidation, Pleural Effusion, Cardiomegaly, Pneumothorax, Pulmonary Edema, Atelectasis |
| **CT Scan** | `microsoft/BiomedCLIP` | **10 Pathologies** | Pulmonary Nodule, Ground-Glass Opacity (GGO), Intracranial Hemorrhage, Pulmonary Embolism |
| **MRI** | `microsoft/BiomedCLIP` | **10 Pathologies** | Brain Tumor/Neoplasm, Vasogenic Edema, Acute Ischemic Stroke, L4-L5 Disc Herniation |
| **Ultrasound** | `microsoft/BiomedCLIP` | **10 Pathologies** | Simple Hepatic/Renal Cysts, Gallstones (Cholelithiasis), Acute Cholecystitis, Free Fluid (Ascites) |

---

## 3. Repository Architecture

```text
MEDIVISTA-AI/
├── backend/
│   ├── main.py                          # FastAPI application entrypoint & SQLite startup
│   ├── requirements.txt                 # Python dependencies
│   └── app/
│       ├── api/
│       │   └── routes.py                # REST endpoints (/analyze, /health, /modalities, /history)
│       ├── core/
│       │   └── config.py                # Global settings, confidence thresholds, CORS
│       ├── database/
│       │   ├── models.py                # SQLAlchemy ORM models (StudyRecord)
│       │   └── session.py               # SQLite session manager and queries
│       ├── ml/                          # Core AI pipeline:
│       │   ├── preprocessing.py         # DICOM (.dcm) & image ingestion + auto-extraction
│       │   ├── abnormality_detector.py  # 44-disease multimodal vision detector
│       │   ├── uncertainty.py           # Epistemic safety gate & abstention filter
│       │   ├── grounding.py             # Spatial bounding box & heatmap engine
│       │   ├── report_generator.py      # Structured Findings & Impression generator
│       │   └── cds.py                   # Clinical Decision Support (ATS/IDSA guidelines)
│       ├── schemas/
│       │   └── study.py                 # Pydantic data schemas (StudyAnalysisResponse)
│       └── services/
│           └── analysis_pipeline.py     # Master 8-stage AI Evidence Chain orchestrator
├── frontend/                            # Doctor Workstation UI (React 18 + Vite + TypeScript + Tailwind)
│   ├── src/
│   │   ├── api/client.ts                # Axios backend API client
│   │   ├── components/
│   │   │   ├── Header.tsx               # Status bar and navigation
│   │   │   ├── UploadPanel.tsx          # DICOM/raster upload with clinical metadata
│   │   │   ├── ImageViewer.tsx          # Grounded scan viewer with bounding boxes & heatmaps
│   │   │   ├── FindingsPanel.tsx        # Structured findings, ruled-out conditions & safety gate
│   │   │   ├── ReportPanel.tsx          # Copyable structured radiology report
│   │   │   ├── CDSPanel.tsx             # Evidence-grounded differential diagnoses & guidelines
│   │   │   └── EvidenceChain.tsx        # Traceable 8-step AI reasoning timeline
│   │   ├── pages/
│   │   │   ├── HomePage.tsx             # Main workstation interface
│   │   │   └── HistoryPage.tsx          # Persisted SQLite case audit history
│   │   ├── types/index.ts               # TypeScript data contracts
│   │   ├── App.tsx                      # Router and application shell
│   │   └── main.tsx                     # React entrypoint
│   └── dist/                            # Optimized production build bundle
├── tests/
│   ├── test_detector.py                 # Multimodal knowledge base verification
│   ├── test_pipeline.py                 # End-to-end pipeline integration tests
│   └── test_api.py                      # FastAPI route integration tests
└── README.md
```

---

## 4. Quickstart Guide

### Prerequisites
* Python 3.10+
* Node.js 18+ and npm

---

### Step 1: Start Backend (FastAPI)

```bash
# Navigate to backend directory
cd backend

# Install Python requirements
pip install -r requirements.txt

# Start the API server on port 8000
python main.py
```
* Interactive API Documentation (Swagger): `http://localhost:8000/docs`
* Health Endpoint: `http://localhost:8000/api/v1/health`

---

### Step 2: Start Frontend (Doctor Workstation UI)

```bash
# Open a new terminal and navigate to frontend directory
cd frontend

# Install npm dependencies (if not already installed)
npm install

# Start Vite development server
npm run dev
```
* Open in browser: `http://localhost:3000`

---

### Step 3: Run Test Suite

```bash
# Run pipeline integration test
python tests/test_pipeline.py

# Run detector test
python tests/test_detector.py

# Run API endpoint test
python tests/test_api.py
```

---

## 5. Safety Disclaimer & Ethical Boundaries

**Educational & Academic Research Prototype:**  
MEDIVISTA AI is designed solely for educational research and investigational analysis. It does **not** provide autonomous medical diagnosis, clinical prescribing, or independent treatment directives. All AI-generated outputs require mandatory verification and sign-off by a licensed physician.
