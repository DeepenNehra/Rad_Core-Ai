export interface PatientInfo {
  patient_id: string;
  age?: number | null;
  gender?: string | null;
  symptoms?: string | null;
  clinical_history?: string | null;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PathologyFinding {
  id: string;
  label: string;
  anatomical_location: string;
  confidence: number;
  uncertainty: number;
  severity: string;
  bounding_box?: BoundingBox;
  evidence_text?: string;
  is_critical: boolean;
}

export interface RadiologyReport {
  examination: string;
  technique: string;
  comparison: string;
  findings: string;
  impression: string;
  urgency_level: "ROUTINE" | "INTERMEDIATE" | "URGENT";
  disclaimer: string;
}

export interface DifferentialItem {
  diagnosis: string;
  probability: number;
  evidence: string;
}

export interface ClinicalDecisionSupport {
  differentials: DifferentialItem[];
  urgency_stratification: string;
  suggested_confirmatory_tests: string[];
  treatment_considerations_draft: string[];
  guidelines_referenced: string[];
  human_oversight_required: boolean;
}

export interface EvidenceChainLink {
  step: number;
  stage: string;
  description: string;
  data: Record<string, unknown>;
}

export interface GroundingData {
  annotated_image_b64?: string;
  heatmap_image_b64?: string;
  grounded_findings_count?: number;
}

export interface UncertaintySummary {
  total_findings?: number;
  high_confidence_count?: number;
  review_required_count?: number;
  abstention_count?: number;
  mean_confidence?: number;
}

export interface PrescriptionItem {
  medication_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  route: string;
  instructions: string;
  precaution?: string | null;
}

export interface SequentialCareStep {
  step_number: number;
  phase: string;
  timeframe: string;
  actions: string[];
}

export interface PatientGuidance {
  things_to_avoid: string[];
  lifestyle_and_diet_recommendations: string[];
  red_flag_warning_symptoms: string[];
  sequential_care_plan: SequentialCareStep[];
  prescriptions_draft: PrescriptionItem[];
}

export interface StudyAnalysisResponse {
  study_id: string;
  modality: string;
  patient_info: PatientInfo;
  findings: PathologyFinding[];
  ruled_out_negatives: string[];
  evidence_chain: EvidenceChainLink[];
  radiology_report: RadiologyReport;
  clinical_decision_support: ClinicalDecisionSupport;
  patient_guidance?: PatientGuidance;
  processing_time_ms: number;
  grounding?: GroundingData;
  uncertainty_summary?: UncertaintySummary;
  abstained_findings?: string[];
}

export interface StudySummary {
  study_id: string;
  patient_id?: string;
  modality: string;
  filename?: string;
  age?: number;
  gender?: string;
  urgency_level: string;
  findings_count: number;
  has_critical_finding: boolean;
  created_at: string;
}
