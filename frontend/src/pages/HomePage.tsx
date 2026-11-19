import React, { useState } from 'react';
import { UploadPanel } from '../components/UploadPanel';
import { ImageViewer } from '../components/ImageViewer';
import { FindingsPanel } from '../components/FindingsPanel';
import { ReportPanel } from '../components/ReportPanel';
import { CDSPanel } from '../components/CDSPanel';
import { PatientGuidancePanel } from '../components/PatientGuidancePanel';
import { EvidenceChain } from '../components/EvidenceChain';
import { api } from '../api/client';
import { StudyAnalysisResponse } from '../types';
import { printClinicalReport, downloadReportText } from '../utils/reportDownloader';

export const HomePage: React.FC = () => {
  const [analysisResult, setAnalysisResult] = useState<StudyAnalysisResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleAnalyze = async (formData: FormData) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await api.analyzeStudy(formData);
      setAnalysisResult(data);
    } catch (err: any) {
      console.error('Analysis failed:', err);
      const detail = err.response?.data?.detail || err.message || 'Analysis pipeline execution failed';
      setErrorMessage(detail);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setAnalysisResult(null);
    setErrorMessage(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Banner / Welcome Info */}
      <div className="bg-gradient-to-r from-medical-panel via-medical-panel to-cyan-950/30 border border-medical-border rounded-xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <span>🔬</span> Multimodal Medical Imaging AI Copilot Workstation
          </h1>
          <p className="text-xs text-medical-muted mt-1 max-w-3xl leading-relaxed">
            Clinically grounded computer vision powered by <strong>Microsoft BioViL-T</strong> (Chest X-Ray) and <strong>Microsoft BiomedCLIP</strong> (CT, MRI, Ultrasound). Detects 44 pathologies with spatial bounding-box projection, epistemic safety abstention, structured reporting, and evidence-grounded clinical decision support.
          </p>
        </div>

        {analysisResult && (
          <button
            onClick={handleReset}
            className="flex-shrink-0 px-4 py-2 rounded-lg bg-medical-dark hover:bg-medical-border border border-medical-border text-xs text-white font-medium transition-colors"
          >
            ← New Study Analysis
          </button>
        )}
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 bg-rose-950/40 border border-rose-500 rounded-lg text-rose-200 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-lg">❌</span>
            <span><strong>Pipeline Error:</strong> {errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-rose-400 hover:text-white text-xs underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Interactive Layout */}
      {!analysisResult ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Upload Panel (5 cols) */}
          <div className="lg:col-span-5">
            <UploadPanel onAnalyze={handleAnalyze} isLoading={isLoading} />
          </div>

          {/* Educational Overview Card (7 cols) */}
          <div className="lg:col-span-7 bg-medical-panel border border-medical-border rounded-xl p-6 shadow-xl space-y-5">
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2 mb-1">
                <span>⚡</span> Multimodal Foundation Architecture (44 Pathologies)
              </h2>
              <p className="text-xs text-medical-muted">
                Zero-shot and grounded vision-language backbones fine-tuned on PubMed & MIMIC-CXR.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="bg-medical-dark p-3.5 rounded-lg border border-medical-border">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-white">🩻 Chest X-Ray</span>
                  <span className="text-[10px] text-cyan-400 font-mono">14 Pathologies</span>
                </div>
                <p className="text-[11px] text-cyan-300 font-mono mb-1">microsoft/BiomedVLP-BioViL-T</p>
                <p className="text-medical-muted text-[11px]">
                  Consolidation, Pleural Effusion, Cardiomegaly, Pneumothorax, Pulmonary Edema, Atelectasis, Bone Fracture.
                </p>
              </div>

              <div className="bg-medical-dark p-3.5 rounded-lg border border-medical-border">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-white">🫁 CT Scan</span>
                  <span className="text-[10px] text-cyan-400 font-mono">10 Pathologies</span>
                </div>
                <p className="text-[11px] text-cyan-300 font-mono mb-1">microsoft/BiomedCLIP-PubMedBERT</p>
                <p className="text-medical-muted text-[11px]">
                  Pulmonary Nodule, GGO, Intracranial Hemorrhage, Pulmonary Embolism, Emphysema, Appendicitis.
                </p>
              </div>

              <div className="bg-medical-dark p-3.5 rounded-lg border border-medical-border">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-white">🧲 MRI Scan</span>
                  <span className="text-[10px] text-cyan-400 font-mono">10 Pathologies</span>
                </div>
                <p className="text-[11px] text-cyan-300 font-mono mb-1">microsoft/BiomedCLIP-PubMedBERT</p>
                <p className="text-medical-muted text-[11px]">
                  Brain Tumor/Neoplasm, Vasogenic Edema, Acute Ischemic Stroke, Disc Herniation, ACL Tear, Hydrocephalus.
                </p>
              </div>

              <div className="bg-medical-dark p-3.5 rounded-lg border border-medical-border">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-white">🔊 Ultrasound</span>
                  <span className="text-[10px] text-cyan-400 font-mono">10 Pathologies</span>
                </div>
                <p className="text-[11px] text-cyan-300 font-mono mb-1">microsoft/BiomedCLIP-PubMedBERT</p>
                <p className="text-medical-muted text-[11px]">
                  Simple Cyst, Cholelithiasis (Gallstones), Acute Cholecystitis, Free Fluid (Ascites), DVT, Thyroid Nodule.
                </p>
              </div>
            </div>

            {/* Traceable Evidence Chain Workflow */}
            <div className="pt-3 border-t border-medical-border">
              <h3 className="text-xs font-semibold text-white mb-2">
                Traceable AI Evidence Chain:
              </h3>
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono text-cyan-300">
                <span className="bg-medical-dark px-2 py-1 rounded border border-medical-border">DICOM / Image</span>
                <span>→</span>
                <span className="bg-medical-dark px-2 py-1 rounded border border-medical-border">Preprocessing</span>
                <span>→</span>
                <span className="bg-medical-dark px-2 py-1 rounded border border-medical-border">Vision Backbone</span>
                <span>→</span>
                <span className="bg-medical-dark px-2 py-1 rounded border border-medical-border">Uncertainty Gate</span>
                <span>→</span>
                <span className="bg-medical-dark px-2 py-1 rounded border border-medical-border">Spatial BBox</span>
                <span>→</span>
                <span className="bg-medical-dark px-2 py-1 rounded border border-medical-border">Report Writer</span>
                <span>→</span>
                <span className="bg-medical-dark px-2 py-1 rounded border border-medical-border">CDS Guidelines</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Full Doctor Workstation Multi-Panel View */
        <div className="space-y-6">
          {/* Top Metadata Bar */}
          <div className="bg-medical-panel border border-medical-border rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center space-x-4">
              <div>
                <span className="text-medical-muted">Study ID:</span>{' '}
                <span className="font-mono font-bold text-white">{analysisResult.study_id}</span>
              </div>
              <div>
                <span className="text-medical-muted">Modality:</span>{' '}
                <span className="font-semibold text-cyan-400">{analysisResult.modality}</span>
              </div>
              <div>
                <span className="text-medical-muted">Patient:</span>{' '}
                <span className="text-white">{analysisResult.patient_info.patient_id} ({analysisResult.patient_info.age ?? 'N/A'}y, {analysisResult.patient_info.gender})</span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-medical-muted mr-1">Time:</span>
              <span className="font-mono text-cyan-400 font-semibold">{analysisResult.processing_time_ms.toFixed(1)} ms</span>

              <button
                onClick={() => downloadReportText(analysisResult)}
                className="ml-3 px-3 py-1.5 rounded-lg bg-medical-dark hover:bg-medical-border border border-medical-border text-white text-xs font-medium transition-colors flex items-center space-x-1"
                title="Download Plain Text Report"
              >
                <span>📥</span>
                <span>Text Report</span>
              </button>

              <button
                onClick={() => printClinicalReport(analysisResult)}
                className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold shadow-md shadow-cyan-600/20 transition-all flex items-center space-x-1.5 active:scale-95"
                title="Open Hospital-grade printable report (Save as PDF)"
              >
                <span>🖨️</span>
                <span>Download Report & Prescriptions (PDF)</span>
              </button>
            </div>
          </div>

          {/* Row 1: Scan Viewer + Structured Findings */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            <div className="lg:col-span-7">
              <ImageViewer
                grounding={analysisResult.grounding}
                findings={analysisResult.findings}
                modality={analysisResult.modality}
              />
            </div>
            <div className="lg:col-span-5">
              <FindingsPanel
                findings={analysisResult.findings}
                ruledOut={analysisResult.ruled_out_negatives}
                abstained={analysisResult.abstained_findings}
                uncertaintySummary={analysisResult.uncertainty_summary}
              />
            </div>
          </div>

          {/* Row 2: Structured Report + Clinical Decision Support */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            <ReportPanel report={analysisResult.radiology_report} fullAnalysis={analysisResult} />
            <CDSPanel cds={analysisResult.clinical_decision_support} />
          </div>

          {/* Row 3: Patient Care Guidance, Prescriptions & Phased Recovery Plan */}
          {analysisResult.patient_guidance && (
            <PatientGuidancePanel guidance={analysisResult.patient_guidance} />
          )}

          {/* Row 4: Traceable AI Evidence Chain */}
          <EvidenceChain
            chain={analysisResult.evidence_chain}
            processingTimeMs={analysisResult.processing_time_ms}
          />
        </div>
      )}
    </div>
  );
};
