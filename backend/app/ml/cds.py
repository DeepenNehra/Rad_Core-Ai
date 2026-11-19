"""
Clinical Decision Support (CDS) Engine for MEDIVISTA AI.

Generates evidence-grounded differential diagnoses, guideline-referenced
recommendations, urgency stratification, and confirmatory testing workup
tailored to identified imaging pathologies across all 4 modalities.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Comprehensive Clinical Knowledge Base across Modalities
# ---------------------------------------------------------------------------

CDS_KNOWLEDGE_BASE: Dict[str, Dict[str, Any]] = {
    # ------------------ X-Ray Chest Pathologies ------------------
    "Consolidation": {
        "differentials": [
            {
                "diagnosis": "Community-Acquired Pneumonia (CAP)",
                "probability": 0.72,
                "evidence": "Lobar alveolar consolidation with air bronchograms in presenting patient.",
            },
            {
                "diagnosis": "Hospital-Acquired / Aspiration Pneumonia",
                "probability": 0.15,
                "evidence": "Dependent gravitational distribution or post-aspiration infiltrate.",
            },
            {
                "diagnosis": "Pulmonary Tuberculosis",
                "probability": 0.08,
                "evidence": "Segmental consolidation; requires evaluation for apical involvement or cavitation.",
            },
            {
                "diagnosis": "Organizing Pneumonia / Bronchoalveolar Neoplasm",
                "probability": 0.05,
                "evidence": "Non-resolving alveolar infiltrate refractory to standard antimicrobials.",
            },
        ],
        "urgency_stratification": "Intermediate to Urgent — Assess CURB-65 / PSI score. Hospital admission recommended if score >= 2.",
        "suggested_confirmatory_tests": [
            "Complete Blood Count (CBC) with differential & ESR/CRP",
            "Sputum gram stain and bacterial / fungal culture with antimicrobial sensitivity",
            "Blood cultures (2 sets drawn prior to initiation of empirical antimicrobials)",
            "Serum Procalcitonin (PCT) level for bacterial load stratification",
            "Urinary Legionella and Streptococcus pneumoniae antigens",
            "High-Resolution Computed Tomography (HRCT) of chest if non-resolving after 48-72h",
        ],
        "treatment_considerations_draft": [
            "Outpatient CAP (no comorbidities): Amoxicillin 1g PO TID OR Doxycycline 100mg PO BID",
            "Outpatient CAP (with comorbidities): Amoxicillin-clavulanate 875/125mg BID + Macrolide (Azithromycin 500mg daily)",
            "Inpatient non-severe: IV Ceftriaxone 1-2g daily + IV/PO Azithromycin 500mg daily",
            "Inpatient severe / ICU: IV Beta-lactam (Ampicillin-sulbactam or Ceftriaxone) + Macrolide / Respiratory Fluoroquinolone",
            "Supportive: Supplemental oxygen to maintain SpO2 >= 92% (88-92% in chronic hypercapnia), targeted fluid hydration",
        ],
        "guidelines_referenced": [
            "ATS / IDSA Clinical Practice Guideline on Community-Acquired Pneumonia (2019 / 2024 Update)",
            "BTS (British Thoracic Society) Guidelines for the Management of Community Acquired Pneumonia in Adults",
            "NICE Clinical Guideline CG191: Pneumonia in adults — diagnosis and management",
        ],
    },
    "Pleural Effusion": {
        "differentials": [
            {
                "diagnosis": "Parapneumonic Effusion / Empyema",
                "probability": 0.52,
                "evidence": "Associated with ipsilateral parenchymal opacity and acute febrile symptoms.",
            },
            {
                "diagnosis": "Congestive Heart Failure (Transudative)",
                "probability": 0.28,
                "evidence": "Often bilateral or associated with cardiomegaly and vascular redistribution.",
            },
            {
                "diagnosis": "Malignant Pleural Effusion",
                "probability": 0.12,
                "evidence": "Exudative accumulation; consider if volume is large or patient has history of malignancy.",
            },
            {
                "diagnosis": "Pulmonary Thromboembolism / Tuberculous Pleuritis",
                "probability": 0.08,
                "evidence": "Can present as small unilateral reactive exudative pleural effusion.",
            },
        ],
        "urgency_stratification": "Intermediate — Risk of progression to loculated empyema or compromised pulmonary mechanics.",
        "suggested_confirmatory_tests": [
            "Diagnostic Thoracentesis with pleural fluid analysis (Protein, LDH, Glucose, pH, Cell count)",
            "Calculation of Light's Criteria to differentiate transudate vs exudate",
            "Pleural fluid Gram stain, bacterial culture, and Mycobacterial AFB stain/PCR",
            "Pleural fluid Cytopathology (rule out metastatic adenocarcinoma / mesothelioma)",
            "Chest Ultrasound (bedside POCUS) to evaluate fluid depth and septation/loculation",
        ],
        "treatment_considerations_draft": [
            "If complicated parapneumonic effusion or frank pus (pH < 7.20 or glucose < 3.3 mmol/L): Urgent chest tube thoracostomy (12-14 Fr pigtail)",
            "If uncomplicated parapneumonic: Continue targeted IV antibiotics for underlying pulmonary source",
            "If cardiogenic transudate: Loop diuretics (Furosemide), sodium restriction, optimize cardiac afterload",
        ],
        "guidelines_referenced": [
            "British Thoracic Society (BTS) Pleural Disease Guideline (2023 Update)",
            "American College of Chest Physicians (CHEST) Guideline: Parapneumonic Effusion & Empyema",
        ],
    },
    "Cardiomegaly": {
        "differentials": [
            {
                "diagnosis": "Dilated / Ischemic Cardiomyopathy",
                "probability": 0.60,
                "evidence": "Enlarged cardiac silhouette (CTR > 0.50) reflecting ventricular dilatation.",
            },
            {
                "diagnosis": "Pericardial Effusion ('Water-Bottle' Cardiac Silhouette)",
                "probability": 0.25,
                "evidence": "Rapid enlargement of cardiac shadow without pulmonary vascular congestion.",
            },
            {
                "diagnosis": "Valvular Heart Disease (Aortic / Mitral Regurgitation)",
                "probability": 0.15,
                "evidence": "Chronic volume overload leading to chamber enlargement.",
            },
        ],
        "urgency_stratification": "Intermediate — Evaluate for acute decompensated heart failure or cardiac tamponade.",
        "suggested_confirmatory_tests": [
            "Transthoracic Echocardiography (TTE) — gold standard for EF, chamber dimensions, pericardium",
            "Serum NT-proBNP or BNP quantitative assay",
            "12-Lead Electrocardiogram (ECG) for rhythm and ischemic/hypertrophy changes",
            "Serum cardiac troponin to rule out acute coronary syndrome",
        ],
        "treatment_considerations_draft": [
            "Assess clinical volume status (JVP, peripheral edema, crackles)",
            "If acute decompensation: IV loop diuretics, preload reduction, hemodynamic stabilization",
            "Guideline-Directed Medical Therapy (GDMT): ACEi/ARNI + Beta-blocker + MRA + SGLT2i",
        ],
        "guidelines_referenced": [
            "ACC / AHA / HFSA Guideline for the Management of Heart Failure",
            "ESC Guidelines for the Diagnosis and Treatment of Acute and Chronic Heart Failure",
        ],
    },
    "Pneumothorax": {
        "differentials": [
            {
                "diagnosis": "Primary / Secondary Spontaneous Pneumothorax",
                "probability": 0.70,
                "evidence": "Peripheral pleural line with absent visceral lung markings laterally.",
            },
            {
                "diagnosis": "Tension Pneumothorax (Critical Emergency)",
                "probability": 0.20,
                "evidence": "Evaluate urgently for contralateral mediastinal shift, tracheal deviation, and hypotension.",
            },
            {
                "diagnosis": "Traumatic / Iatrogenic Pneumothorax",
                "probability": 0.10,
                "evidence": "Associated rib fractures, prior central line placement, or lung biopsy.",
            },
        ],
        "urgency_stratification": "CRITICAL / URGENT — Immediate evaluation for tension physiology required.",
        "suggested_confirmatory_tests": [
            "Immediate bedside assessment of hemodynamics, tracheal alignment, and breath sounds",
            "Bedside thoracic ultrasound (POCUS) — confirm absent lung sliding and stratosphere sign",
            "Low-dose CT chest if diagnosis equivocal or complex apical bullae suspected",
        ],
        "treatment_considerations_draft": [
            "If Tension Pneumothorax suspected: IMMEDIATE needle decompression (14G cannula at 2nd intercostal space MCL or 5th ICS anterior axillary line) followed by tube thoracostomy",
            "If large (>2cm at level of hilum) or symptomatic: Small-bore chest drain (10-14 Fr) insertion with Heimlich valve or underwater seal",
            "If small (<2cm) and asymptomatic: High-flow supplemental oxygen (100% via non-rebreather) to enhance nitrogen resorption and monitor closely",
        ],
        "guidelines_referenced": [
            "British Thoracic Society (BTS) Guideline for Pleural Disease: Spontaneous Pneumothorax",
            "American College of Chest Physicians (ACCP) Consensus Statement on Pneumothorax",
        ],
    },
    "Pulmonary Edema": {
        "differentials": [
            {
                "diagnosis": "Cardiogenic Pulmonary Edema",
                "probability": 0.75,
                "evidence": "Perihilar alveolar opacities ('bat-wing' distribution), cephalization, Kerley B lines.",
            },
            {
                "diagnosis": "Non-Cardiogenic Edema / Acute Respiratory Distress Syndrome (ARDS)",
                "probability": 0.20,
                "evidence": "Diffuse alveolar infiltrates without elevated left ventricular filling pressures.",
            },
            {
                "diagnosis": "Fluid Overload / End-Stage Renal Disease",
                "probability": 0.05,
                "evidence": "Hypervolemic state due to renal insufficiency and sodium retention.",
            },
        ],
        "urgency_stratification": "URGENT — Risk of acute hypoxemic respiratory failure.",
        "suggested_confirmatory_tests": [
            "Arterial Blood Gas (ABG) for PaO2/FiO2 ratio and acid-base status",
            "Bedside Echocardiography (assess LV ejection fraction, wall motion, E/e' ratio)",
            "Serum NT-proBNP and Troponin I/T",
            "Serum electrolytes, BUN, Creatinine",
        ],
        "treatment_considerations_draft": [
            "High-flow supplemental oxygen / Non-Invasive Positive Pressure Ventilation (CPAP / BiPAP)",
            "IV Loop Diuretics (Furosemide 40-80mg IV bolus)",
            "IV Vasodilators (Nitroglycerin infusion if systolic BP > 110 mmHg)",
            "Avoid Beta-blocker uptitration during acute decompensated phase",
        ],
        "guidelines_referenced": [
            "ESC / ACC Guidelines for Acute Heart Failure and Cardiogenic Shock",
            "Berlin Definition and Guidelines for Acute Respiratory Distress Syndrome (ARDS)",
        ],
    },

    # ------------------ CT Pathologies ------------------
    "Pulmonary Nodule / Mass": {
        "differentials": [
            {
                "diagnosis": "Primary Bronchogenic Carcinoma (Adenocarcinoma / SCC)",
                "probability": 0.55,
                "evidence": "Spiculated or solid parenchymal nodule with irregular borders.",
            },
            {
                "diagnosis": "Benign Granuloma (Histoplasmosis / TB / Sarcoidosis)",
                "probability": 0.30,
                "evidence": "Well-circumscribed nodule; prior granulomatous infection.",
            },
            {
                "diagnosis": "Solitary Metastatic Focus",
                "probability": 0.15,
                "evidence": "In patient with known extrathoracic primary malignancy.",
            },
        ],
        "urgency_stratification": "Intermediate — Apply Fleischner Society 2017 risk stratification guidelines.",
        "suggested_confirmatory_tests": [
            "Comparison with prior imaging studies (assess volume doubling time)",
            "Contrast-Enhanced CT Chest with thin-slice (1mm) reconstructions",
            "18F-FDG PET-CT scan if nodule > 8mm for metabolic activity assessment",
            "CT-guided transthoracic needle biopsy or navigational bronchoscopy for tissue diagnosis",
        ],
        "treatment_considerations_draft": [
            "If solid nodule > 8mm and high risk: Multidisciplinary tumor board review, PET-CT, tissue biopsy or surgical resection",
            "If 6-8mm: Follow-up CT at 6-12 months, then at 18-24 months per Fleischner criteria",
            "Smoking cessation counseling and pulmonary function testing",
        ],
        "guidelines_referenced": [
            "Fleischner Society Guidelines for Management of Incidental Pulmonary Nodules (2017)",
            "American College of Radiology (ACR) Lung-RADS Version 2022",
        ],
    },
    "Ground-Glass Opacity (GGO)": {
        "differentials": [
            {
                "diagnosis": "Atypical / Viral Pneumonia (COVID-19, Influenza, CMV, PCP)",
                "probability": 0.55,
                "evidence": "Bilateral peripheral and subpleural ground-glass attenuation.",
            },
            {
                "diagnosis": "Alveolar Hemorrhage Syndrome / Vasculitis",
                "probability": 0.20,
                "evidence": "Associated with hemoptysis, glomerulonephritis, or anticoagulation.",
            },
            {
                "diagnosis": "Drug-Induced Pneumonitis / Hypersensitivity Pneumonitis",
                "probability": 0.15,
                "evidence": "Temporal relationship with cytotoxic drugs, immunotherapy, or organic antigens.",
            },
            {
                "diagnosis": "Minimally Invasive Adenocarcinoma / Lepidic Growth",
                "probability": 0.10,
                "evidence": "Persistent non-resolving subsolid/pure ground-glass nodule.",
            },
        ],
        "urgency_stratification": "Intermediate — Risk of rapid oxygen desaturation in infectious or inflammatory etiologies.",
        "suggested_confirmatory_tests": [
            "Viral multiplex respiratory PCR panel (COVID-19, Influenza A/B, RSV)",
            "Induced sputum or Bronchoalveolar Lavage (BAL) for Pneumocystis jirovecii (Grocott stain/PCR)",
            "Autoimmune serologies (ANCA, ANA, Anti-GBM) if diffuse alveolar hemorrhage suspected",
        ],
        "treatment_considerations_draft": [
            "Targeted antimicrobial/antiviral therapy based on clinical picture and PCR",
            "If PCP suspected in immunocompromised: High-dose TMP-SMX (Co-trimoxazole) + Corticosteroids if PaO2 < 70 mmHg",
            "If hypersensitivity or drug toxicity: Discontinue offending agent; systemic corticosteroid evaluation",
        ],
        "guidelines_referenced": [
            "Infectious Diseases Society of America (IDSA) Guidelines on Viral Pneumonia",
            "ERS / ATS Guidelines on Management of Interstitial Lung Diseases",
        ],
    },
    "Intracranial Hemorrhage": {
        "differentials": [
            {
                "diagnosis": "Hypertensive Intracerebral Hemorrhage (Basal Ganglia / Lobar)",
                "probability": 0.60,
                "evidence": "Hyperdense parenchymal hematoma with surrounding mass effect.",
            },
            {
                "diagnosis": "Hemorrhagic Transformation of Ischemic Infarct",
                "probability": 0.20,
                "evidence": "Petechial or confluent hematoma within known vascular territory.",
            },
            {
                "diagnosis": "Ruptured Cerebral Aneurysm / Arteriovenous Malformation (AVM)",
                "probability": 0.15,
                "evidence": "Subarachnoid or lobar hematoma with vascular nidus.",
            },
            {
                "diagnosis": "Cerebral Amyloid Angiopathy",
                "probability": 0.05,
                "evidence": "Recurrent lobar hemorrhages in elderly normotensive patient.",
            },
        ],
        "urgency_stratification": "CRITICAL EMERGENCY — Immediate neurosurgical and neuro-ICU consultation required.",
        "suggested_confirmatory_tests": [
            "Immediate non-contrast CT head to calculate ICH volume (ABC/2 method)",
            "CT Angiography (CTA) of head/neck — check for 'spot sign' predicting hematoma expansion",
            "Stat Coagulation profile (PT/INR, aPTT, Fibrinogen, Platelet count)",
            "Neurological checks every 15-30 minutes with Glasgow Coma Scale (GCS)",
        ],
        "treatment_considerations_draft": [
            "Blood Pressure control: Target systolic BP 130-140 mmHg using IV labetalol or nicardipine infusion",
            "Urgent reversal of anticoagulation (4-Factor PCC for Warfarin, Idarucizumab for Dabigatran, Andexanet for Factor Xa inhibitors)",
            "Intracranial Pressure (ICP) management: Head elevation 30 degrees, IV Mannitol or Hypertonic saline (3% NaCl)",
            "Emergency neurosurgical evaluation for surgical evacuation or EVD placement",
        ],
        "guidelines_referenced": [
            "AHA / ASA Guideline for the Management of Patients With Spontaneous Intracerebral Hemorrhage",
            "Neurocritical Care Society Guidelines on Management of Acute Intracranial Hemorrhage",
        ],
    },
    "Pulmonary Embolism": {
        "differentials": [
            {
                "diagnosis": "Acute Pulmonary Thromboembolism (PE)",
                "probability": 0.85,
                "evidence": "Intraluminal filling defect within pulmonary arterial tree.",
            },
            {
                "diagnosis": "Chronic Thromboembolic Pulmonary Hypertension (CTEPH)",
                "probability": 0.10,
                "evidence": "Eccentric filling defects, vascular webs, mosaic attenuation.",
            },
            {
                "diagnosis": "Tumor Embolism / Non-Thrombotic Embolism",
                "probability": 0.05,
                "evidence": "Rare intravascular metastatic dissemination or fat/air embolus.",
            },
        ],
        "urgency_stratification": "CRITICAL / URGENT — Stratify hemodynamically into High, Intermediate, or Low Risk.",
        "suggested_confirmatory_tests": [
            "CT Pulmonary Angiography (CTPA) — definitive diagnostic modality",
            "Transthoracic Echocardiogram (TTE) to assess RV strain, McConnel's sign, TAPSE",
            "Serum Troponin and NT-proBNP for myocardial stretch and necrosis stratification",
            "Bilateral lower extremity venous duplex ultrasound for source DVT",
        ],
        "treatment_considerations_draft": [
            "If High-risk PE (Shock / Hypotension SBP < 90 mmHg): Systemic thrombolysis (Alteplase 100mg IV over 2h) or catheter-directed embolectomy",
            "If Intermediate- or Low-risk: Therapeutic anticoagulation initiated immediately (LMWH, Fondaparinux, or direct DOAC: Apixaban / Rivaroxaban)",
            "Oxygenation, hemodynamic inotropic support (Norepinephrine if in shock), avoid fluid boluses",
        ],
        "guidelines_referenced": [
            "ESC / ERS Guidelines for the Diagnosis and Management of Acute Pulmonary Embolism",
            "CHEST Guideline and Expert Panel Report: Antithrombotic Therapy for VTE Disease",
        ],
    },

    # ------------------ MRI Pathologies ------------------
    "Brain Tumor / Neoplasm": {
        "differentials": [
            {
                "diagnosis": "High-Grade Glioma (Glioblastoma, IDH-wildtype)",
                "probability": 0.55,
                "evidence": "Heterogeneously enhancing intra-axial mass with central necrosis and surrounding vasogenic edema.",
            },
            {
                "diagnosis": "Metastatic Brain Neoplasm (Solitary or Multiple)",
                "probability": 0.30,
                "evidence": "Well-circumscribed enhancing lesion at gray-white matter junction with disproportionate edema.",
            },
            {
                "diagnosis": "Primary CNS Lymphoma / Meningioma",
                "probability": 0.10,
                "evidence": "Homogeneous dense enhancement, restricted diffusion, or dural-tail sign.",
            },
            {
                "diagnosis": "Cerebral Pyogenic Abscess",
                "probability": 0.05,
                "evidence": "Ring-enhancing lesion with smooth thin capsule and intense central DWI restriction.",
            },
        ],
        "urgency_stratification": "URGENT — Risk of brain herniation, mass effect, or status epilepticus.",
        "suggested_confirmatory_tests": [
            "MRI Brain with and without IV Gadolinium (Perfusion-weighted, Diffusion-weighted, MR Spectroscopy)",
            "Systemic staging CT (Chest, Abdomen, Pelvis) or whole-body PET-CT to evaluate primary site",
            "Neurosurgical consult for stereotactic biopsy or craniotomy for maximal safe surgical resection",
            "Molecular pathology testing on biopsy: IDH1/2 mutation, MGMT promoter methylation, 1p/19q codeletion",
        ],
        "treatment_considerations_draft": [
            "Vasogenic edema control: Dexamethasone 4-8mg IV/PO q6h with PPI gastroprotection",
            "Seizure prophylaxis: Levetiracetam (Keppra) 500-1000mg BID if symptomatic seizures or cortical involvement",
            "Urgent neurosurgical multidisciplinary oncology referral",
        ],
        "guidelines_referenced": [
            "EANO (European Association of Neuro-Oncology) Guidelines for Diffuse Gliomas",
            "NCCN Clinical Practice Guidelines in Oncology: Central Nervous System Cancers",
        ],
    },
    "Acute Ischemic Stroke": {
        "differentials": [
            {
                "diagnosis": "Acute Ischemic Infarction (Large-Vessel / Lacunar)",
                "probability": 0.85,
                "evidence": "Restricted diffusion (bright on DWI, dark on ADC map) matching arterial territory.",
            },
            {
                "diagnosis": "Transient Ischemic Attack / Reversible Deficit",
                "probability": 0.10,
                "evidence": "Clinical focal neurological deficit with resolved or small ischemic core.",
            },
            {
                "diagnosis": "Stroke Mimic (Hemiplegic Migraine, Seizure / Todd's Paresis)",
                "probability": 0.05,
                "evidence": "Atypical temporal evolution or lack of concordant vascular territory restriction.",
            },
        ],
        "urgency_stratification": "TIME-CRITICAL EMERGENCY ('Time is Brain') — Determine onset time immediately.",
        "suggested_confirmatory_tests": [
            "Stat MRI DWI/FLAIR mismatch assessment OR multimodal perfusion CT",
            "CT / MR Angiography of head and neck (assess Large Vessel Occlusion: ICA, MCA M1/M2)",
            "Continuous cardiac telemetry monitoring for Atrial Fibrillation",
            "Transthoracic / Transesophageal Echocardiogram and Carotid Doppler ultrasound",
        ],
        "treatment_considerations_draft": [
            "If within 4.5 hours of last known normal: IV Thrombolysis (Tenecteplase 0.25 mg/kg or Alteplase 0.9 mg/kg)",
            "If Large Vessel Occlusion within 24 hours (DAWN/DEFUSE-3 criteria): Urgent Endovascular Thrombectomy (EVT)",
            "Antiplatelet therapy: Aspirin 300mg / Dual antiplatelet after 24h post-thrombolytic CT exclusion of hemorrhage",
            "Permissive hypertension: Allow BP up to 220/120 (or 185/110 if thrombolysis planned)",
        ],
        "guidelines_referenced": [
            "AHA / ASA Guidelines for the Early Management of Patients With Acute Ischemic Stroke",
            "ESO (European Stroke Organisation) Guidelines on Endovascular Thrombectomy",
        ],
    },

    # ------------------ Ultrasound Pathologies ------------------
    "Simple Cyst (Hepatic/Renal)": {
        "differentials": [
            {
                "diagnosis": "Benign Simple Renal / Hepatic Cyst (Bosniak I)",
                "probability": 0.92,
                "evidence": "Anechoic lesion with posterior acoustic enhancement, imperceptible wall, no internal septa.",
            },
            {
                "diagnosis": "Minimally Complicated Cyst (Bosniak II)",
                "probability": 0.06,
                "evidence": "Fine hairline thin septation or tiny non-enhancing calcification.",
            },
            {
                "diagnosis": "Cystic Renal Cell Carcinoma / Hydatid Cyst",
                "probability": 0.02,
                "evidence": "Requires evaluation if thick walls, nodular enhancement, or endemic exposure.",
            },
        ],
        "urgency_stratification": "ROUTINE — Benign imaging characteristics with virtually zero malignant potential.",
        "suggested_confirmatory_tests": [
            "No routine follow-up required for classic simple cysts (Bosniak I criteria)",
            "Renal Protocol Contrast-Enhanced CT or MRI only if thick septa or solid wall nodules are observed",
            "Serum creatinine and urinalysis to ensure normal renal baseline",
        ],
        "treatment_considerations_draft": [
            "Reassurance to patient of benign non-neoplastic etiology",
            "Symptomatic management only if cyst is exceptionally large (>10cm) causing local compression",
            "Percutaneous aspiration and sclerotherapy reserved strictly for symptomatic mass effect",
        ],
        "guidelines_referenced": [
            "ACR Appropriateness Criteria: Indeterminate Renal Masses and Simple Cysts",
            "Bosniak Classification of Cystic Renal Masses (Version 2019 Update)",
        ],
    },
    "Cholelithiasis (Gallstone)": {
        "differentials": [
            {
                "diagnosis": "Uncomplicated Cholelithiasis (Symptomatic Biliary Colic)",
                "probability": 0.78,
                "evidence": "Mobile echogenic focus with clean posterior acoustic shadowing in dependent lumen.",
            },
            {
                "diagnosis": "Choledocholithiasis (Common Bile Duct Calculus)",
                "probability": 0.14,
                "evidence": "Gallbladder calculi with possible secondary CBD dilation (>6mm).",
            },
            {
                "diagnosis": "Gallbladder Polyp / Adenomyomatosis",
                "probability": 0.08,
                "evidence": "Non-mobile mucosal projection without acoustic shadowing or comet-tail artifact.",
            },
        ],
        "urgency_stratification": "ROUTINE to INTERMEDIATE — Elective surgical referral unless signs of cholecystitis develop.",
        "suggested_confirmatory_tests": [
            "Liver Function Tests (Total and direct Bilirubin, ALT, AST, Alkaline Phosphatase, GGT)",
            "Serum Lipase and Amylase (rule out acute gallstone pancreatitis)",
            "MRCP (Magnetic Resonance Cholangiopancreatography) if CBD is dilated or LFTs elevated",
        ],
        "treatment_considerations_draft": [
            "If symptomatic biliary colic: NSAIDs (Diclofenac / Ketorolac) for acute pain control",
            "Surgical consultation for Elective Laparoscopic Cholecystectomy to prevent recurrent colic/pancreatitis",
            "Patient education on low-fat diet and warning signs of acute infection (fever, persistent RUQ pain, jaundice)",
        ],
        "guidelines_referenced": [
            "WSES (World Society of Emergency Surgery) Guidelines for Biliary Calculi",
            "EASL Clinical Practice Guidelines on the Prevention, Diagnosis and Treatment of Gallstones",
        ],
    },
    "Acute Cholecystitis": {
        "differentials": [
            {
                "diagnosis": "Acute Calculous Cholecystitis",
                "probability": 0.88,
                "evidence": "Gallbladder wall thickening (>3mm), pericholecystic fluid, impacted stone, positive sonographic Murphy's sign.",
            },
            {
                "diagnosis": "Acute Acalculous Cholecystitis",
                "probability": 0.07,
                "evidence": "Severe wall inflammation in critically ill/fasting patient without demonstrable calculi.",
            },
            {
                "diagnosis": "Acute Cholangitis / Peptic Ulcer Perforation",
                "probability": 0.05,
                "evidence": "Overlapping RUQ peritoneal signs; assess for Charcot's triad.",
            },
        ],
        "urgency_stratification": "URGENT — Apply Tokyo Guidelines (TG18) severity criteria. Requires inpatient surgical admission.",
        "suggested_confirmatory_tests": [
            "Complete Blood Count (leukocytosis with left shift) and CRP",
            "Comprehensive Metabolic Panel and Liver Function Tests",
            "Blood cultures prior to antibiotic initiation",
            "Hepatobiliary Iminodiacetic Acid (HIDA) cholescintigraphy if ultrasound is indeterminate",
        ],
        "treatment_considerations_draft": [
            "Inpatient admission, NPO (nil per os), and IV isotonic fluid resuscitation",
            "Empirical IV Antimicrobial therapy: Ceftriaxone 1g daily + Metronidazole 500mg TID OR Piperacillin-tazobactam 4.5g TID",
            "Early Laparoscopic Cholecystectomy (recommended within 72 hours of symptom onset)",
            "Percutaneous cholecystostomy tube drainage if patient is unfit/high-risk for emergency surgery",
        ],
        "guidelines_referenced": [
            "Tokyo Guidelines 2018 (TG18) for Management of Acute Cholecystitis and Cholangitis",
            "World Society of Emergency Surgery (WSES) Guidelines on Acute Calculous Cholecystitis",
        ],
    },
}

# ---------------------------------------------------------------------------
# Default Clinical Fallback for unmapped findings
# ---------------------------------------------------------------------------

DEFAULT_CDS: Dict[str, Any] = {
    "differentials": [
        {
            "diagnosis": "Pathological finding as identified by multimodal vision model",
            "probability": 0.70,
            "evidence": "Consistent with radiological features extracted by foundation model backbone.",
        },
        {
            "diagnosis": "Secondary reactive or non-specific inflammatory change",
            "probability": 0.20,
            "evidence": "Localized tissue response or physiological variation.",
        },
        {
            "diagnosis": "Artifact or atypical anatomical variant",
            "probability": 0.10,
            "evidence": "Acquisition parameter or positioning effect requiring correlation.",
        },
    ],
    "urgency_stratification": "ROUTINE — Correlate with patient symptoms, vitals, and laboratory indicators.",
    "suggested_confirmatory_tests": [
        "Clinical review and comprehensive physical examination",
        "Targeted follow-up imaging in appropriate clinical window",
        "Routine baseline hematology and metabolic panel",
    ],
    "treatment_considerations_draft": [
        "Review current medications and clinical trajectory",
        "Symptomatic management as indicated by attending clinician",
        "Seek formal sub-specialty consultation if symptoms persist or escalate",
    ],
    "guidelines_referenced": [
        "American College of Radiology (ACR) Appropriateness Criteria",
        "National Institute for Health and Care Excellence (NICE) Imaging & Clinical Guidelines",
    ],
}


# ---------------------------------------------------------------------------
# CDS Engine Class
# ---------------------------------------------------------------------------

class CDSEngine:
    """
    Synthesizes clinical decision support recommendations from AI findings,
    patient demographic context, and accredited clinical practice guidelines.
    """

    def __init__(self) -> None:
        self.kb = CDS_KNOWLEDGE_BASE

    def _match_finding_to_kb(self, finding_label: str) -> Dict[str, Any]:
        """
        Fuzzy match a finding label against the CDS knowledge base.
        """
        label_lower = finding_label.lower()
        for key, entry in self.kb.items():
            if key.lower() in label_lower or label_lower in key.lower():
                return entry
            # Check key tokens
            tokens = [t.strip() for t in key.replace("/", " ").replace("-", " ").split()]
            if any(len(tok) > 4 and tok.lower() in label_lower for tok in tokens):
                return entry

        return DEFAULT_CDS

    def _determine_urgency_stratification(self, findings: List[Dict[str, Any]]) -> str:
        """
        Select highest clinical urgency stratification among detected findings.
        """
        has_critical = any(f.get("is_critical", False) for f in findings)
        if has_critical:
            for f in findings:
                if f.get("is_critical", False):
                    kb_entry = self._match_finding_to_kb(f.get("label", ""))
                    return kb_entry.get(
                        "urgency_stratification",
                        "CRITICAL EMERGENCY — Immediate medical / surgical review required.",
                    )
            return "CRITICAL EMERGENCY — Immediate medical / surgical review required."

        # Check for high confidence non-critical findings
        for f in findings:
            if float(f.get("confidence", 0.0)) >= 0.75:
                kb_entry = self._match_finding_to_kb(f.get("label", ""))
                urgency = kb_entry.get("urgency_stratification")
                if urgency:
                    return urgency

        return "ROUTINE — Correlate with clinical findings and outpatient workup."

    def generate(
        self,
        findings: List[Dict[str, Any]],
        modality: str = "X-Ray",
        patient_info: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Generates clinical decision support payload conforming to
        the ClinicalDecisionSupport Pydantic schema.
        """
        patient_info = patient_info or {}
        differentials: List[Dict[str, Any]] = []
        all_tests: List[str] = []
        all_treatments: List[str] = []
        all_guidelines: List[str] = []

        if not findings:
            return {
                "differentials": [
                    {
                        "diagnosis": "Normal / Unremarkable Examination",
                        "probability": 0.95,
                        "evidence": "No discrete pathology or structural abnormality identified on imaging.",
                    }
                ],
                "urgency_stratification": "ROUTINE — No urgent acute radiological interventions needed.",
                "suggested_confirmatory_tests": [
                    "Routine follow-up per primary clinical indication",
                    "Repeat imaging only if new symptoms develop",
                ],
                "treatment_considerations_draft": [
                    "Continue baseline supportive care and clinical observation",
                ],
                "guidelines_referenced": [
                    "American College of Radiology (ACR) Practice Parameters",
                ],
                "human_oversight_required": True,
            }

        # Process primary and secondary findings
        for finding in findings:
            label = finding.get("label", "")
            kb_entry = self._match_finding_to_kb(label)

            # Add differentials with finding-specific weighting
            for diff in kb_entry.get("differentials", []):
                # Avoid duplicate diagnoses
                if not any(d["diagnosis"] == diff["diagnosis"] for d in differentials):
                    differentials.append({
                        "diagnosis": diff["diagnosis"],
                        "probability": diff["probability"],
                        "evidence": diff["evidence"],
                    })

            # Collect suggested tests
            for test in kb_entry.get("suggested_confirmatory_tests", []):
                if test not in all_tests:
                    all_tests.append(test)

            # Collect treatments
            for trt in kb_entry.get("treatment_considerations_draft", []):
                if trt not in all_treatments:
                    all_treatments.append(trt)

            # Collect guidelines
            for gdl in kb_entry.get("guidelines_referenced", []):
                if gdl not in all_guidelines:
                    all_guidelines.append(gdl)

        # Sort differentials by descending probability
        differentials.sort(key=lambda x: x["probability"], reverse=True)

        urgency_stratification = self._determine_urgency_stratification(findings)

        # Append age-specific considerations if relevant
        patient_age = patient_info.get("age")
        if patient_age and patient_age >= 65:
            if "Assess geriatric frailty and renal drug dosing adjustments" not in all_treatments:
                all_treatments.append("Geriatric consideration: Adjust antimicrobial/fluid dosages based on estimated GFR; monitor electrolyte balance closely.")

        return {
            "differentials": differentials[:5],  # top 5 ranked
            "urgency_stratification": urgency_stratification,
            "suggested_confirmatory_tests": all_tests[:6],
            "treatment_considerations_draft": all_treatments[:6],
            "guidelines_referenced": all_guidelines[:4],
            "human_oversight_required": True,
        }

    def generate_patient_guidance(
        self,
        findings: List[Dict[str, Any]],
        modality: str = "X-Ray",
        patient_info: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Synthesizes comprehensive patient care instructions, avoidance triggers,
        warning red flags, sequential recovery milestones, and physician-reviewable prescriptions.
        """
        patient_info = patient_info or {}
        top_label = findings[0].get("label", "").lower() if findings else "normal"

        # 1. Disease-tailored Prescriptions
        prescriptions: List[Dict[str, Any]] = []
        things_to_avoid: List[str] = []
        lifestyle_suggestions: List[str] = []
        red_flags: List[str] = []
        sequential_plan: List[Dict[str, Any]] = []

        if "consolidation" in top_label or "pneumonia" in top_label or "infiltration" in top_label:
            prescriptions = [
                {
                    "medication_name": "Amoxicillin + Clavulanic Acid (Augmentin)",
                    "dosage": "625 mg (or 875/125 mg)",
                    "frequency": "Twice daily (every 12 hours) after meals",
                    "duration": "7 consecutive days",
                    "route": "Oral tablet",
                    "instructions": "Complete full antimicrobial course even if symptoms resolve early. Take with food to minimize GI discomfort.",
                    "precaution": "Contraindicated in severe penicillin allergy or prior cholestatic jaundice."
                },
                {
                    "medication_name": "Azithromycin (AzaSite / Zithromax)",
                    "dosage": "500 mg",
                    "frequency": "Once daily (1 hour before or 2 hours after meals)",
                    "duration": "3 - 5 days",
                    "route": "Oral tablet",
                    "instructions": "Covers atypical respiratory pathogens (Mycoplasma, Legionella, Chlamydia pneumoniae).",
                    "precaution": "Caution with QT prolongation or concomitant antiarrhythmics."
                },
                {
                    "medication_name": "Paracetamol (Acetaminophen)",
                    "dosage": "650 mg",
                    "frequency": "Every 6 hours as needed for fever > 38.0°C or pleuritic pain",
                    "duration": "As needed (Max 3000 mg / 24 hours)",
                    "route": "Oral tablet",
                    "instructions": "Symptomatic relief of fever and thoracic muscular ache.",
                    "precaution": "Do not exceed maximum daily dose. Avoid alcohol consumption."
                },
                {
                    "medication_name": "N-Acetylcysteine (Mucolytic)",
                    "dosage": "600 mg effervescent tablet",
                    "frequency": "Once daily dissolved in 200 ml water",
                    "duration": "5 - 7 days",
                    "route": "Oral solution",
                    "instructions": "Thins thick bronchial mucus secretions for easier expectoration.",
                    "precaution": "Use with caution in active peptic ulcer disease."
                },
                {
                    "medication_name": "Pantoprazole",
                    "dosage": "40 mg",
                    "frequency": "Once daily in the morning 30 minutes before breakfast",
                    "duration": "7 days",
                    "route": "Oral tablet",
                    "instructions": "Gastroprotective prophylaxis during systemic antibiotic and analgesic therapy.",
                    "precaution": "Take on an empty stomach."
                }
            ]

            things_to_avoid = [
                "🚫 Active & Passive Tobacco Smoke / Vaping: Severely impairs ciliary clearance and doubles consolidation resolution time.",
                "🚫 Vigorous Physical Exertion & Heavy Lifting: Restrict activity to avoid hypoxemic strain and tachycardia.",
                "🚫 Supine Flat Bed Rest: Lying flat promotes posterior alveolar collapse; keep torso elevated 30-45°.",
                "🚫 Strong OTC Cough Suppressants (e.g., high-dose Codeine / Dextromethorphan): Suppressing the productive cough prevents clearance of infected purulent sputum.",
                "🚫 Chilled Liquids & Extremely Dry Air: Cold air triggers bronchospasm; use warm fluids and gentle room humidification.",
                "🚫 Dehydration: Inadequate hydration thickens airway mucus plugs making breathing harder."
            ]

            lifestyle_suggestions = [
                "💧 High Fluid Intake: Drink 2.5 to 3.0 liters of warm fluids (water, clear broths, herbal teas) daily to thin mucus.",
                "🛌 Semi-Fowler Resting Position: Sleep with 2-3 pillows elevating the head and chest to optimize ventilation-perfusion matching.",
                "🫁 Deep Breathing & Incentive Spirometry: Perform 10 slow, deep diaphragmatic inspirations every waking hour to expand atelectatic alveoli.",
                "🍲 Nutrient-Dense Light Diet: Emphasize easily digestible proteins (lentils, poultry, eggs), zinc, vitamin C, and fresh vegetables.",
                "🌡️ Vital Signs Log: Maintain a written log of body temperature and resting pulse oximetry (SpO2) every 6 hours."
            ]

            red_flags = [
                "🚨 Resting Oxygen Saturation (SpO2) dropping below 92% on ambient room air.",
                "🚨 Respiratory rate exceeding 28 breaths per minute or feeling unable to speak a full sentence.",
                "🚨 Hemoptysis (coughing up fresh bright red blood or dark clots).",
                "🚨 High persistent fever > 39.0°C (102.2°F) failing to respond to antipyretics within 2 hours.",
                "🚨 Confusion, severe lethargy, inability to maintain fluid intake, or blue discoloration of lips/fingers (cyanosis)."
            ]

            sequential_plan = [
                {
                    "step_number": 1,
                    "phase": "Immediate Stabilization & Triage",
                    "timeframe": "Hours 0 — 24",
                    "actions": [
                        "Obtain baseline vitals (Blood pressure, Heart rate, SpO2, Temperature).",
                        "Initiate primary oral antimicrobial and mucolytic regimen immediately after clinical sign-off.",
                        "Collect sputum sample for Gram stain and culture before or at first dose if possible.",
                        "Establish continuous SpO2 monitoring and set up semi-recumbent resting station."
                    ]
                },
                {
                    "step_number": 2,
                    "phase": "Active Antimicrobial Therapy & Symptom De-escalation",
                    "timeframe": "Days 2 — 5",
                    "actions": [
                        "Expect defervescence (fever reduction) within 48 to 72 hours of starting antibiotics.",
                        "If fever persists or dyspnea worsens by Day 3, return immediately for physician reassessment / blood work.",
                        "Perform incentive spirometry hourly; encourage active productive expectoration.",
                        "Maintain strict medication compliance — do not miss or delay doses."
                    ]
                },
                {
                    "step_number": 3,
                    "phase": "Convalescence & Gradual Mobilization",
                    "timeframe": "Days 6 — 14",
                    "actions": [
                        "Complete the full 7-day antibiotic course even if feeling fully recovered.",
                        "Transition from bed rest to short, gentle indoor walking sessions (5-10 minutes).",
                        "Monitor for secondary medication side effects (rash, diarrhea, oral thrush).",
                        "Continue hydration and avoid all environmental smoke or dusty areas."
                    ]
                },
                {
                    "step_number": 4,
                    "phase": "Radiological Clearance & Preventive Immunization",
                    "timeframe": "Weeks 4 — 6",
                    "actions": [
                        "Schedule repeat chest radiograph (PA view) at 6 weeks to confirm complete resolution of lobar consolidation and rule out underlying endobronchial lesion.",
                        "Evaluate candidacy for Pneumococcal conjugate vaccine (PCV20) and annual Influenza immunization.",
                        "Smoking cessation referral if patient is an active smoker."
                    ]
                }
            ]

        elif "effusion" in top_label:
            prescriptions = [
                {
                    "medication_name": "Targeted Broad-Spectrum Antibiotic",
                    "dosage": "As per microbiological sensitivity",
                    "frequency": "Hospital-directed dosing",
                    "duration": "10 - 14 days",
                    "route": "Oral / IV",
                    "instructions": "Treats primary source of parapneumonic exudative effusion.",
                    "precaution": "Guided by pleural fluid cultures."
                },
                {
                    "medication_name": "Paracetamol + Codeine (Mild analgesic)",
                    "dosage": "500mg / 30mg",
                    "frequency": "Every 8 hours as needed",
                    "duration": "3 - 5 days",
                    "route": "Oral",
                    "instructions": "Relief of pleuritic chest friction pain to allow adequate inspiratory effort.",
                    "precaution": "Monitor for constipation and sedation."
                }
            ]
            things_to_avoid = [
                "🚫 Strenuous aerobic exercise or heavy thoracic loading.",
                "🚫 Air travel until pleural fluid status is clinically reassessed.",
                "🚫 Delaying medical consultation if breathlessness worsens on lying down."
            ]
            lifestyle_suggestions = [
                "🛌 Rest lying on the affected side to maximize ventilation in the healthy contralateral lung.",
                "💧 Monitor daily weight and fluid balance carefully.",
                "🥗 Maintain high-protein nutrition to offset fluid protein depletion."
            ]
            red_flags = [
                "🚨 Severe orthopnea (inability to breathe while lying flat).",
                "🚨 Sudden sharp increase in pleuritic chest pain with rapid shallow breathing.",
                "🚨 New high fever with shivering/rigors indicating empyema formation."
            ]
            sequential_plan = [
                {
                    "step_number": 1,
                    "phase": "Diagnostic Fluid Sampling",
                    "timeframe": "Hours 0 — 24",
                    "actions": [
                        "Ultrasound-guided diagnostic thoracentesis with pleural fluid biochemical analysis.",
                        "Calculate Light's criteria (Protein, LDH) to confirm exudate vs transudate."
                    ]
                },
                {
                    "step_number": 2,
                    "phase": "Source Control & Drainage",
                    "timeframe": "Days 2 — 5",
                    "actions": [
                        "If fluid pH < 7.20 or frank pus: place small-bore chest tube.",
                        "Administer targeted systemic antimicrobials."
                    ]
                },
                {
                    "step_number": 3,
                    "phase": "Resolution Monitoring",
                    "timeframe": "Week 2",
                    "actions": [
                        "Repeat bedside thoracic ultrasound to verify fluid resorption.",
                        "Assess re-expansion of underlying lung parenchyma."
                    ]
                }
            ]

        elif "nodule" in top_label or "mass" in top_label:
            prescriptions = [
                {
                    "medication_name": "Symptomatic Respiratory Support (if cough present)",
                    "dosage": "As indicated",
                    "frequency": "As directed",
                    "duration": "Short term",
                    "route": "Oral / Inhaler",
                    "instructions": "Supportive care while formal diagnostic staging is executed.",
                    "precaution": "Do not delay formal specialist imaging."
                }
            ]
            things_to_avoid = [
                "🚫 ALL tobacco products, secondhand smoke, and occupational carcinogen inhalation (radon, asbestos).",
                "🚫 Missing the scheduled surveillance CT imaging timeline.",
                "🚫 Unverified alternative herbal remedies that delay clinical staging."
            ]
            lifestyle_suggestions = [
                "🚭 Immediate complete smoking cessation program enrollment.",
                "🥗 Mediterranean diet rich in antioxidants, fresh fruits, and cruciferous vegetables.",
                "🏃 Regular moderate aerobic exercise (walking 30 minutes daily)."
            ]
            red_flags = [
                "🚨 Unexplained weight loss (>5% over 1 month) or persistent night sweats.",
                "🚨 Hemoptysis (blood streaks in sputum).",
                "🚨 Persistent hoarseness of voice or persistent focal bone pain."
            ]
            sequential_plan = [
                {
                    "step_number": 1,
                    "phase": "Risk Stratification & Prior Image Comparison",
                    "timeframe": "Week 1",
                    "actions": [
                        "Retrieve any previous chest CT/X-rays from past 1-5 years to evaluate doubling time.",
                        "Apply Fleischner Society 2017 high-risk vs low-risk criteria based on nodule size."
                    ]
                },
                {
                    "step_number": 2,
                    "phase": "High-Resolution Diagnostic Imaging",
                    "timeframe": "Weeks 2 — 4",
                    "actions": [
                        "Undergo thin-slice (1mm) Contrast-Enhanced CT Chest or PET-CT scan.",
                        "Pulmonology / Thoracic Oncology multidisciplinary review."
                    ]
                },
                {
                    "step_number": 3,
                    "phase": "Tissue Biopsy or Serial Surveillance",
                    "timeframe": "Months 3 — 12",
                    "actions": [
                        "Execute CT-guided core biopsy if PET positive or >8mm solid nodule.",
                        "Otherwise, follow Fleischner protocol for 6 or 12-month low-dose CT follow-up."
                    ]
                }
            ]

        elif "cyst" in top_label or "gallstone" in top_label or "cholecyst" in top_label:
            prescriptions = [
                {
                    "medication_name": "Antispasmodic / Analgesic (Drotaverine / Hyoscine)",
                    "dosage": "40 - 80 mg",
                    "frequency": "Three times daily as needed for biliary colic",
                    "duration": "3 - 5 days during acute discomfort",
                    "route": "Oral tablet",
                    "instructions": "Relieves smooth muscle biliary spasm.",
                    "precaution": "Contraindicated in glaucoma or severe hepatic impairment."
                },
                {
                    "medication_name": "Ursodeoxycholic Acid (UDCA - if non-surgical dissolution candidate)",
                    "dosage": "300 mg",
                    "frequency": "Twice daily with meals",
                    "duration": "As directed by gastroenterologist (typically 3-6 months)",
                    "route": "Oral capsule",
                    "instructions": "Helps dissolve small radiolucent cholesterol stones in selected cases.",
                    "precaution": "Regular liver function test monitoring required."
                }
            ]
            things_to_avoid = [
                "🚫 High-Fat & Deep-Fried Foods: Butter, cheese, greasy fast foods trigger intense gallbladder contraction.",
                "🚫 Large Heavy Meals: Eat smaller, frequent meals instead of heavy dinners.",
                "🚫 Prolonged Fasting / Crash Diets: Rapid weight loss increases cholesterol saturation in bile.",
                "🚫 Refined Sugars and Excessive Dairy Fats: Promotes biliary stasis."
            ]
            lifestyle_suggestions = [
                "🥗 Low-Fat High-Fiber Diet: Whole grains, oats, steamed vegetables, lean chicken breast, and fish.",
                "💧 Abundant Water Intake: 2.5 - 3.0 liters of plain water daily.",
                "🏃 Gradual Weight Management: Aim for safe weight loss (0.5 - 1 kg per week)."
            ]
            red_flags = [
                "🚨 Severe unremitting right upper quadrant abdominal pain lasting > 4 hours.",
                "🚨 High fever with chills and yellowing of eyes/skin (Jaundice) — indicates acute cholangitis.",
                "🚨 Persistent vomiting with inability to retain fluids."
            ]
            sequential_plan = [
                {
                    "step_number": 1,
                    "phase": "Dietary Adjustment & Colic Control",
                    "timeframe": "Week 1",
                    "actions": [
                        "Transition immediately to ultra-low fat dietary regimen.",
                        "Check liver function tests (LFTs) and serum amylase/lipase."
                    ]
                },
                {
                    "step_number": 2,
                    "phase": "Surgical Gastroenterology Consultation",
                    "timeframe": "Weeks 2 — 4",
                    "actions": [
                        "Consult general surgeon for elective laparoscopic cholecystectomy evaluation if symptomatic.",
                        "Discuss benefits of definitive surgical cure vs recurrence risk."
                    ]
                }
            ]

        else:
            # Universal clinical safety fallback guidance
            prescriptions = [
                {
                    "medication_name": "Symptomatic Supportive Prescription",
                    "dosage": "As tailored by physician",
                    "frequency": "Per doctor directions",
                    "duration": "As indicated",
                    "route": "Oral",
                    "instructions": "Undergo comprehensive in-person medical evaluation before beginning new medications.",
                    "precaution": "Always disclose existing allergies and ongoing drug regimens."
                }
            ]
            things_to_avoid = [
                "🚫 Self-Medicating with OTC Antibiotics or Corticosteroids without clinician sign-off.",
                "🚫 Ignoring progressive or worsening symptoms.",
                "🚫 Strenuous physical exertion beyond comfortable baseline."
            ]
            lifestyle_suggestions = [
                "💧 Maintain optimal hydration and balanced nutrition.",
                "🛌 Ensure 7-8 hours of quality restorative sleep.",
                "📝 Keep a daily symptom diary noting timing, severity, and triggers."
            ]
            red_flags = [
                "🚨 Sudden onset of severe breathlessness, chest pressure, or syncope.",
                "🚨 High persistent fever or acute focal neurological deficits.",
                "🚨 Severe intractable pain unresponsive to baseline analgesia."
            ]
            sequential_plan = [
                {
                    "step_number": 1,
                    "phase": "Initial Diagnostic Review",
                    "timeframe": "Day 1 — 3",
                    "actions": [
                        "Review AI imaging report with primary care physician or specialist.",
                        "Correlate findings with physical examination and baseline laboratory tests."
                    ]
                },
                {
                    "step_number": 2,
                    "phase": "Follow-Up & Surveillance",
                    "timeframe": "Weeks 2 — 4",
                    "actions": [
                        "Follow scheduled medical appointments.",
                        "Repeat diagnostic imaging if indicated by attending clinician."
                    ]
                }
            ]

        return {
            "things_to_avoid": things_to_avoid,
            "lifestyle_and_diet_recommendations": lifestyle_suggestions,
            "red_flag_warning_symptoms": red_flags,
            "sequential_care_plan": sequential_plan,
            "prescriptions_draft": prescriptions,
        }

