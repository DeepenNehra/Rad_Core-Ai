# MEDIVISTA AI — Multimodal Medical Imaging AI Copilot

**Multimodal Medical Imaging AI Copilot for Grounded Analysis, Report Generation and Clinical Decision Support**  
*Academic & Educational Research Prototype (X-Ray, CT, MRI, Ultrasound)*

---

## 1. Project Overview

MEDIVISTA AI is a modular, research-oriented medical imaging interpretation platform designed to assist qualified healthcare professionals and researchers. The system implements a traceable **AI Evidence Chain**:

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
│   ├── app/
│   │   ├── api/          # FastAPI route controllers (/analyze, /health)
│   │   ├── core/         # Project settings, thresholds, CORS (config.py)
│   │   ├── database/     # DB models & case history
│   │   ├── ml/           # Core AI pipeline:
│   │   │   ├── preprocessing.py         # DICOM (.dcm) & image ingestion + auto-extraction
│   │   │   ├── abnormality_detector.py  # 44-disease multimodal vision detector
│   │   │   ├── grounding.py             # Spatial bounding box & heatmap engine
│   │   │   ├── uncertainty.py           # Epistemic safety gate & abstention filter
│   │   │   ├── report_generator.py      # Structured Findings & Impression generator
│   │   │   └── cds.py                   # Clinical Decision Support (ATS/IDSA guidelines)
│   │   ├── schemas/      # Pydantic data schemas (PatientInfo, PathologyFinding, StudyAnalysisResponse)
│   │   └── services/     # Business logic
│   └── requirements.txt  # Python dependencies
├── frontend/             # Doctor Workstation UI (React)
├── models/               # Model weights storage (xray, ct, mri, ultrasound)
├── data/                 # Sample studies & cached benchmarks
├── tests/                # Automated pipeline and detector unit tests
├── docs/                 # Architectural specifications
└── README.md             # Project documentation
```

---

## 4. Setup & Quickstart

### Prerequisites
* Python 3.10+ (Tested on Python 3.13)
* PyTorch 2.14+, Transformers 5.4+, OpenCLIP 3.3+

### Step 1: Install Dependencies
```bash
pip install -r backend/requirements.txt
```

### Step 2: Run Multimodal Detector Test
```bash
python tests/test_detector.py
```

---

## 5. Safety Disclaimer & Ethical Boundaries

**Educational & Academic Research Prototype:**  
MEDIVISTA AI is designed solely for educational research and investigational analysis. It does **not** provide autonomous medical diagnosis, clinical prescribing, or independent treatment directives. All AI-generated outputs require mandatory verification and sign-off by a licensed physician.
