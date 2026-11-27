import React, { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';

const STAGES = [
  'Ingesting DICOM / Raster Scan & Metadata',
  'Radiometric & Photometric Calibration',
  'Microsoft Vision-Language Inference (44 Pathologies)',
  'Epistemic Uncertainty & Abstention Gate',
  'Spatial Bounding-Box & Heatmap Projection',
  'Structured ACR Radiology Report Synthesis',
  'Evidence-Grounded CDS & Sequential Care Plan',
  'Persisting Study to Encrypted Archive',
];

export const AnalysisLoader: React.FC = () => {
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIdx((prev) => (prev < STAGES.length - 1 ? prev + 1 : prev));
    }, 320);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-medical-panel border border-cyan-500/30 rounded-2xl p-6 shadow-2xl space-y-5">
      <div className="flex items-center justify-between border-b border-medical-border pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center">
            <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">
              Executing 8-Stage Traceable AI Evidence Chain
            </h3>
            <p className="text-xs text-medical-muted">
              Running multimodal inference &amp; epistemic safety verification...
            </p>
          </div>
        </div>
        <span className="text-xs font-mono text-cyan-400 tabular-nums">
          {Math.round(((activeIdx + 1) / STAGES.length) * 100)}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-medical-dark rounded-full overflow-hidden border border-medical-border">
        <div
          className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
          style={{ width: `${((activeIdx + 1) / STAGES.length) * 100}%` }}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {STAGES.map((stage, idx) => {
          const isDone = idx < activeIdx;
          const isCurrent = idx === activeIdx;
          return (
            <div
              key={stage}
              className={`px-3 py-2 rounded-xl border text-xs flex items-center gap-2.5 transition-all ${
                isDone
                  ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                  : isCurrent
                  ? 'bg-cyan-950/30 border-cyan-400/50 text-white shadow-sm'
                  : 'bg-medical-dark/50 border-medical-border/50 text-medical-muted'
              }`}
            >
              {isDone ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              ) : isCurrent ? (
                <Loader2 className="w-4 h-4 text-cyan-400 animate-spin flex-shrink-0" />
              ) : (
                <span className="w-4 h-4 rounded-full border border-medical-border flex-shrink-0" />
              )}
              <span className="truncate">{stage}</span>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-center gap-2 text-[11px] text-medical-muted pt-1">
        <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
        <span>Non-autonomous advisory • Mandatory physician review enforced</span>
      </div>
    </div>
  );
};
