import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Cpu,
  Layers,
  Brain,
  HeartPulse,
  Radio,
  ArrowLeft,
  Download,
  Printer,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { UploadPanel } from '../components/UploadPanel';
import { AnalysisLoader } from '../components/AnalysisLoader';
import { ImageViewer } from '../components/ImageViewer';
import { FindingsPanel } from '../components/FindingsPanel';
import { ReportPanel } from '../components/ReportPanel';
import { CDSPanel } from '../components/CDSPanel';
import { PatientGuidancePanel } from '../components/PatientGuidancePanel';
import { EvidenceChain } from '../components/EvidenceChain';
import { api } from '../api/client';
import { StudyAnalysisResponse } from '../types';
import { printClinicalReport, downloadReportText } from '../utils/reportDownloader';
import { useAuth } from '../context/AuthContext';

const MODALITY_CARDS = [
  {
    key: 'X-Ray',
    title: 'Chest X-Ray',
    count: '14 Pathologies',
    model: 'microsoft/BiomedVLP-BioViL-T',
    summary:
      'Consolidation, Pleural Effusion, Cardiomegaly, Pneumothorax, Pulmonary Edema, Atelectasis, Bone Fracture.',
    icon: Layers,
    accent: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10',
  },
  {
    key: 'CT',
    title: 'CT Scan',
    count: '10 Pathologies',
    model: 'microsoft/BiomedCLIP-PubMedBERT',
    summary:
      'Pulmonary Nodule, GGO, Intracranial Hemorrhage, Pulmonary Embolism, Emphysema, Acute Appendicitis.',
    icon: Cpu,
    accent: 'text-blue-400 border-blue-500/30 bg-blue-500/10',
  },
  {
    key: 'MRI',
    title: 'MRI Scan',
    count: '10 Pathologies',
    model: 'microsoft/BiomedCLIP-PubMedBERT',
    summary:
      'Brain Tumor/Neoplasm, Vasogenic Edema, Acute Ischemic Stroke, Disc Herniation, ACL Tear, Hydrocephalus.',
    icon: Brain,
    accent: 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10',
  },
  {
    key: 'Ultrasound',
    title: 'Ultrasound',
    count: '10 Pathologies',
    model: 'microsoft/BiomedCLIP-PubMedBERT',
    summary:
      'Simple Cyst, Cholelithiasis (Gallstones), Acute Cholecystitis, Ascites, DVT, Thyroid Nodule.',
    icon: Radio,
    accent: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
  },
];

export const HomePage: React.FC = () => {
  const location = useLocation();
  const { isAuthenticated, openAuthModal } = useAuth();
  const [analysisResult, setAnalysisResult] = useState<StudyAnalysisResponse | null>(null);
  const [selectedModality, setSelectedModality] = useState<string>('X-Ray');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSigningOff, setIsSigningOff] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Allow HistoryPage to open a persisted study directly in the workstation
  useEffect(() => {
    const state = location.state as { loadedStudy?: StudyAnalysisResponse } | null;
    if (state?.loadedStudy) {
      setAnalysisResult(state.loadedStudy);
      setErrorMessage(null);
    }
  }, [location.state]);

  const handleAnalyze = async (formData: FormData) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await api.analyzeStudy(formData);
      setAnalysisResult(data);
    } catch (err: any) {
      console.error('Analysis failed:', err);
      const detail =
        err.response?.data?.detail || err.message || 'Analysis pipeline execution failed';
      setErrorMessage(detail);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOff = async () => {
    if (!analysisResult) return;
    if (!isAuthenticated) {
      openAuthModal();
      return;
    }
    setIsSigningOff(true);
    try {
      const updated = await api.signOffStudy(analysisResult.study_id);
      setAnalysisResult({
        ...analysisResult,
        signed_off_by: updated.signed_off_by,
        signed_off_at: updated.signed_off_at,
      });
    } catch (err: any) {
      setErrorMessage(err.response?.data?.detail || 'Could not record physician sign-off');
    } finally {
      setIsSigningOff(false);
    }
  };

  const handleReset = () => {
    setAnalysisResult(null);
    setErrorMessage(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Workstation Banner */}
      <div className="bg-gradient-to-r from-medical-panel via-medical-panel to-cyan-950/30 border border-medical-border rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Multimodal Medical Imaging AI Copilot Workstation
            </h1>
          </div>
          <p className="text-xs text-medical-muted max-w-3xl leading-relaxed">
            Clinically grounded vision-language diagnostics powered by{' '}
            <strong className="text-cyan-300">Microsoft BioViL-T</strong> (Chest X-Ray) and{' '}
            <strong className="text-cyan-300">Microsoft BiomedCLIP</strong> (CT, MRI, Ultrasound).
            44 pathologies with spatial grounding, epistemic safety abstention, and phased care plans.
          </p>
        </div>

        {analysisResult && (
          <button
            onClick={handleReset}
            className="flex-shrink-0 px-4 py-2 rounded-xl bg-medical-dark hover:bg-medical-border border border-medical-border text-xs text-white font-semibold flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-cyan-400" />
            <span>New Study Analysis</span>
          </button>
        )}
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 bg-rose-950/40 border border-rose-500/60 rounded-xl text-rose-200 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>
              <strong>Pipeline Error:</strong> {errorMessage}
            </span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-rose-300 hover:text-white text-xs underline flex-shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Ingestion vs Results View */}
      {!analysisResult ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Upload Panel (5 cols) */}
          <div className="lg:col-span-5">
            <UploadPanel
              onAnalyze={handleAnalyze}
              isLoading={isLoading}
              selectedModality={selectedModality}
              onModalityChange={setSelectedModality}
            />
          </div>

          {/* Right Panel: Live Loader OR Foundation Architecture Overview (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {isLoading ? (
              <AnalysisLoader />
            ) : (
              <div className="bg-medical-panel/95 border border-medical-border rounded-2xl p-6 shadow-2xl space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <HeartPulse className="w-4 h-4 text-cyan-400" />
                      <span>Multimodal Foundation Stack (44 Pathologies)</span>
                    </h2>
                    <p className="text-xs text-medical-muted mt-0.5">
                      Click any modality card below to switch the active acquisition pipeline.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {MODALITY_CARDS.map((card) => {
                    const Icon = card.icon;
                    const isSelected = selectedModality === card.key;
                    return (
                      <button
                        key={card.key}
                        type="button"
                        onClick={() => setSelectedModality(card.key)}
                        className={`text-left p-4 rounded-xl border transition-all ${
                          isSelected
                            ? 'bg-cyan-950/25 border-cyan-400/60 shadow-md shadow-cyan-500/10'
                            : 'bg-medical-dark/80 border-medical-border hover:border-cyan-500/35'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-7 h-7 rounded-lg border flex items-center justify-center ${card.accent}`}
                            >
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                            <span className="font-bold text-white text-sm">{card.title}</span>
                          </div>
                          <span className="text-[10px] text-cyan-300 font-mono bg-medical-panel px-2 py-0.5 rounded border border-medical-border">
                            {card.count}
                          </span>
                        </div>
                        <p className="text-[11px] text-cyan-300 font-mono mb-1.5">{card.model}</p>
                        <p className="text-medical-muted text-[11px] leading-relaxed">
                          {card.summary}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {/* Traceable Evidence Chain Strip */}
                <div className="pt-3 border-t border-medical-border">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-medical-muted mb-2.5">
                    8-Stage Traceable AI Evidence Chain
                  </h3>
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono text-cyan-300">
                    {[
                      'DICOM / Scan',
                      'Calibration',
                      'Vision Inference',
                      'Safety Gate',
                      'Spatial BBox',
                      'ACR Report',
                      'CDS & Rx',
                      'Audit DB',
                    ].map((step, i, arr) => (
                      <React.Fragment key={step}>
                        <span className="bg-medical-dark px-2.5 py-1 rounded-lg border border-medical-border">
                          {step}
                        </span>
                        {i < arr.length - 1 && <span className="text-medical-muted">→</span>}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Full Doctor Workstation Multi-Panel View */
        <div className="space-y-6">
          {/* Top Metadata & Action Bar */}
          <div className="bg-medical-panel/95 border border-medical-border rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs shadow-xl">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
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
                <span className="text-white">
                  {analysisResult.patient_info.patient_id} ({analysisResult.patient_info.age ?? 'N/A'}
                  y, {analysisResult.patient_info.gender})
                </span>
              </div>
              <div>
                <span className="text-medical-muted">Latency:</span>{' '}
                <span className="font-mono text-cyan-300 font-semibold tabular-nums">
                  {(analysisResult.processing_time_ms || 0).toFixed(1)} ms
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {analysisResult.signed_off_by ? (
                <span className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Signed: {analysisResult.signed_off_by}</span>
                </span>
              ) : (
                <button
                  onClick={handleSignOff}
                  disabled={isSigningOff}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/35 border border-emerald-500/40 text-emerald-300 font-semibold flex items-center gap-1.5 transition-colors"
                  title="Clinician Sign-Off (JWT Protected)"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{isSigningOff ? 'Signing...' : 'Verify & Sign Off'}</span>
                </button>
              )}

              <button
                onClick={() => downloadReportText(analysisResult)}
                className="px-3 py-1.5 rounded-xl bg-medical-dark hover:bg-medical-border border border-medical-border text-white font-medium transition-colors flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>TXT</span>
              </button>

              <button
                onClick={() => printClinicalReport(analysisResult)}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold shadow-md shadow-cyan-600/20 transition-all flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Download Report &amp; Rx (PDF)</span>
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

          {/* Row 2: Structured Report + CDS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            <ReportPanel
              report={analysisResult.radiology_report}
              fullAnalysis={analysisResult}
              signedOffBy={analysisResult.signed_off_by}
            />
            <CDSPanel cds={analysisResult.clinical_decision_support} />
          </div>

          {/* Row 3: Patient Care Guidance */}
          {analysisResult.patient_guidance && (
            <PatientGuidancePanel guidance={analysisResult.patient_guidance} />
          )}

          {/* Row 4: Traceable Evidence Chain */}
          {analysisResult.evidence_chain?.length > 0 && (
            <EvidenceChain
              chain={analysisResult.evidence_chain}
              processingTimeMs={analysisResult.processing_time_ms || 0}
            />
          )}
        </div>
      )}
    </div>
  );
};
