import React from 'react';
import { Lightbulb, FlaskConical, Pill, BookOpen, ShieldAlert } from 'lucide-react';
import { ClinicalDecisionSupport } from '../types';

interface CDSPanelProps {
  cds: ClinicalDecisionSupport;
}

export const CDSPanel: React.FC<CDSPanelProps> = ({ cds }) => {
  return (
    <div className="bg-medical-panel/95 rounded-2xl border border-medical-border p-5 shadow-2xl flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between pb-3 border-b border-medical-border mb-4 gap-2">
        <div className="flex items-center space-x-2">
          <Lightbulb className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-bold text-white">Clinical Decision Support (CDS)</span>
          <span className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 font-mono">
            Evidence-Grounded
          </span>
        </div>

        <span className="text-[10px] text-amber-300 bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded-md font-medium flex items-center gap-1">
          <ShieldAlert className="w-3 h-3" />
          Non-Autonomous
        </span>
      </div>

      <div className="space-y-4 overflow-y-auto max-h-[460px] pr-1 text-xs">
        {/* Urgency Stratification */}
        <div className="p-3.5 bg-amber-950/20 border border-amber-500/40 rounded-xl">
          <span className="text-[10px] uppercase font-bold text-amber-300 block mb-1">
            Clinical Triage &amp; Urgency Stratification
          </span>
          <p className="text-white font-medium text-xs leading-snug">
            {cds.urgency_stratification}
          </p>
        </div>

        {/* Prioritized Differential Diagnoses */}
        <div>
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 mb-2">
            Prioritized Differential Diagnoses
          </h4>
          <div className="space-y-2">
            {cds.differentials.map((diff, idx) => {
              const probPct = Math.round(diff.probability * 100);
              return (
                <div
                  key={idx}
                  className="bg-medical-dark p-3 rounded-xl border border-medical-border"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-white text-xs">
                      {idx + 1}. {diff.diagnosis}
                    </span>
                    <span className="font-mono text-cyan-400 font-bold tabular-nums">
                      {probPct}% Prob
                    </span>
                  </div>

                  <div className="w-full bg-zinc-900 rounded-full h-1.5 mb-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        probPct >= 70
                          ? 'bg-cyan-400'
                          : probPct >= 40
                          ? 'bg-amber-400'
                          : 'bg-zinc-500'
                      }`}
                      style={{ width: `${probPct}%` }}
                    />
                  </div>

                  <p className="text-[11px] text-medical-muted leading-tight">{diff.evidence}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Suggested Confirmatory Tests */}
        <div>
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 mb-2 flex items-center gap-1.5">
            <FlaskConical className="w-3.5 h-3.5" />
            <span>Recommended Diagnostic Workup</span>
          </h4>
          <ul className="bg-medical-dark p-3 rounded-xl border border-medical-border space-y-1.5 text-medical-text">
            {cds.suggested_confirmatory_tests.map((test, idx) => (
              <li key={idx} className="flex items-start space-x-2 text-[11px]">
                <span className="text-cyan-400 font-bold">•</span>
                <span>{test}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Treatment Considerations Draft */}
        <div>
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-amber-400 mb-2 flex items-center gap-1.5">
            <Pill className="w-3.5 h-3.5" />
            <span>Clinician-Reviewable Treatment Considerations</span>
          </h4>
          <ul className="bg-medical-dark p-3 rounded-xl border border-medical-border space-y-1.5 text-medical-text">
            {cds.treatment_considerations_draft.map((trt, idx) => (
              <li key={idx} className="flex items-start space-x-2 text-[11px]">
                <span className="text-amber-400 font-bold">→</span>
                <span>{trt}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Guidelines Referenced */}
        <div>
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 mb-2 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Accredited Clinical Practice Guidelines</span>
          </h4>
          <div className="bg-medical-dark p-3 rounded-xl border border-medical-border space-y-1.5 text-[11px]">
            {cds.guidelines_referenced.map((gdl, idx) => (
              <div key={idx} className="flex items-center space-x-2 text-medical-text">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                <span>{gdl}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
