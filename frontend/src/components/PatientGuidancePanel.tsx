import React, { useState } from 'react';
import { PatientGuidance } from '../types';

interface PatientGuidancePanelProps {
  guidance: PatientGuidance;
}

export const PatientGuidancePanel: React.FC<PatientGuidancePanelProps> = ({ guidance }) => {
  const [activeTab, setActiveTab] = useState<'prescriptions' | 'avoid' | 'sequential' | 'redflags'>('prescriptions');

  return (
    <div className="bg-medical-panel rounded-xl border border-medical-border p-5 shadow-xl flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-medical-border mb-4 gap-2">
        <div className="flex items-center space-x-2">
          <span className="text-base font-semibold text-white">💊 Patient Guidance & Care Trajectory</span>
          <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
            Sequential Care
          </span>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1 bg-medical-dark p-0.5 rounded-lg border border-medical-border text-xs">
          <button
            onClick={() => setActiveTab('prescriptions')}
            className={`px-2.5 py-1 rounded transition-colors ${
              activeTab === 'prescriptions'
                ? 'bg-cyan-500 text-black font-semibold'
                : 'text-medical-muted hover:text-white'
            }`}
          >
            Rx Prescriptions ({guidance.prescriptions_draft.length})
          </button>
          <button
            onClick={() => setActiveTab('avoid')}
            className={`px-2.5 py-1 rounded transition-colors ${
              activeTab === 'avoid'
                ? 'bg-cyan-500 text-black font-semibold'
                : 'text-medical-muted hover:text-white'
            }`}
          >
            What to Avoid ({guidance.things_to_avoid.length})
          </button>
          <button
            onClick={() => setActiveTab('sequential')}
            className={`px-2.5 py-1 rounded transition-colors ${
              activeTab === 'sequential'
                ? 'bg-cyan-500 text-black font-semibold'
                : 'text-medical-muted hover:text-white'
            }`}
          >
            Sequential Plan ({guidance.sequential_care_plan.length} Phases)
          </button>
          <button
            onClick={() => setActiveTab('redflags')}
            className={`px-2.5 py-1 rounded transition-colors ${
              activeTab === 'redflags'
                ? 'bg-cyan-500 text-black font-semibold'
                : 'text-medical-muted hover:text-white'
            }`}
          >
            Red Flags 🚨
          </button>
        </div>
      </div>

      {/* Tab 1: Prescriptions Draft */}
      {activeTab === 'prescriptions' && (
        <div className="space-y-3 overflow-y-auto max-h-[460px] pr-1 text-xs">
          <div className="p-2.5 bg-cyan-950/20 border border-cyan-500/30 rounded-lg text-cyan-200/90 text-[11px] flex items-center justify-between">
            <span>⚕️ <strong>Physician Reviewable Draft (Rx):</strong> Formulated based on clinical presentation and guidelines. Mandatory verification by attending clinician.</span>
          </div>

          <div className="space-y-3">
            {guidance.prescriptions_draft.map((rx, idx) => (
              <div
                key={idx}
                className="bg-medical-dark rounded-lg border border-medical-border p-3.5 hover:border-cyan-500/40 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-cyan-400 font-bold text-sm">Rx #{idx + 1}</span>
                    <h4 className="font-bold text-white text-sm tracking-tight">
                      {rx.medication_name}
                    </h4>
                  </div>
                  <div className="flex items-center space-x-2 text-[10px]">
                    <span className="px-2 py-0.5 rounded bg-medical-panel border border-medical-border text-cyan-300 font-mono">
                      {rx.dosage}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-medical-panel border border-medical-border text-medical-muted">
                      {rx.route}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] mb-2 bg-black/30 p-2.5 rounded border border-medical-border/40">
                  <div>
                    <span className="text-medical-muted block text-[10px] uppercase font-semibold">Frequency & Schedule:</span>
                    <span className="text-white font-medium">{rx.frequency}</span>
                  </div>
                  <div>
                    <span className="text-medical-muted block text-[10px] uppercase font-semibold">Duration:</span>
                    <span className="text-emerald-400 font-semibold">{rx.duration}</span>
                  </div>
                </div>

                <p className="text-[11px] text-medical-text mb-1.5">
                  <strong className="text-medical-muted">Directions:</strong> {rx.instructions}
                </p>

                {rx.precaution && (
                  <p className="text-[10px] text-amber-300/90 italic bg-amber-950/20 px-2 py-1 rounded border border-amber-500/20">
                    ⚠️ Precaution: {rx.precaution}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: What Patient Must Avoid */}
      {activeTab === 'avoid' && (
        <div className="space-y-3 overflow-y-auto max-h-[460px] pr-1 text-xs">
          <div className="p-2.5 bg-rose-950/20 border border-rose-500/40 rounded-lg text-rose-300 text-[11px]">
            🚫 <strong>Strict Contraindications & Triggers:</strong> These factors can aggravate pathology, impede recovery, or trigger severe acute exacerbations.
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {guidance.things_to_avoid.map((item, idx) => (
              <div
                key={idx}
                className="bg-medical-dark p-3 rounded-lg border border-rose-500/20 flex items-start space-x-3 text-medical-text"
              >
                <span className="text-base flex-shrink-0">⚠️</span>
                <span className="text-xs leading-relaxed">{item}</span>
              </div>
            ))}
          </div>

          {/* Lifestyle & Nutrition recommendations */}
          <div className="mt-4 pt-3 border-t border-medical-border">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2">
              Supportive Lifestyle & Nutrition Recommendations:
            </h4>
            <div className="space-y-2">
              {guidance.lifestyle_and_diet_recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className="bg-medical-dark p-2.5 rounded-lg border border-medical-border text-xs text-medical-text flex items-start space-x-2"
                >
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Sequential Care Plan (Chronological Milestones) */}
      {activeTab === 'sequential' && (
        <div className="space-y-4 overflow-y-auto max-h-[460px] pr-1 text-xs">
          <div className="p-2.5 bg-cyan-950/20 border border-cyan-500/30 rounded-lg text-cyan-200 text-[11px]">
            ⏱️ <strong>Phased Clinical Trajectory:</strong> Step-by-step milestones to guide patient through acute stabilization to complete recovery and clearance.
          </div>

          <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-cyan-500/40">
            {guidance.sequential_care_plan.map((step) => (
              <div key={step.step_number} className="relative">
                {/* Step Circle Marker */}
                <div className="absolute -left-[27px] top-0 w-6 h-6 rounded-full bg-cyan-500 text-black font-bold text-xs flex items-center justify-center shadow-md shadow-cyan-500/30">
                  {step.step_number}
                </div>

                <div className="bg-medical-dark p-3.5 rounded-lg border border-medical-border space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-1.5 border-b border-medical-border/60">
                    <h4 className="font-bold text-white text-sm">
                      {step.phase}
                    </h4>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-medical-panel border border-cyan-500/30 text-cyan-300">
                      ⏱️ {step.timeframe}
                    </span>
                  </div>

                  <ul className="space-y-1.5 text-medical-text text-xs pt-1">
                    {step.actions.map((act, actIdx) => (
                      <li key={actIdx} className="flex items-start space-x-2">
                        <span className="text-cyan-400 font-bold">→</span>
                        <span>{act}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Emergency Red Flags */}
      {activeTab === 'redflags' && (
        <div className="space-y-3 overflow-y-auto max-h-[460px] pr-1 text-xs">
          <div className="p-3 bg-rose-950/30 border border-rose-500/50 rounded-lg text-rose-200 text-xs">
            <h4 className="font-bold text-sm mb-1 text-rose-300 flex items-center gap-1.5">
              <span>🚨</span> Emergency Department (ER) Admission Criteria
            </h4>
            <p className="text-[11px] leading-relaxed">
              If the patient experiences ANY of the following warning signs, seek immediate emergency medical care without waiting for clinic hours:
            </p>
          </div>

          <div className="space-y-2.5">
            {guidance.red_flag_warning_symptoms.map((rf, idx) => (
              <div
                key={idx}
                className="bg-rose-950/20 p-3 rounded-lg border border-rose-500/30 flex items-start space-x-3 text-rose-100"
              >
                <span className="text-base flex-shrink-0">⚠️</span>
                <span className="text-xs font-semibold leading-relaxed">{rf}</span>
              </div>
            ))}
          </div>

          <div className="p-3 bg-medical-dark rounded-lg border border-medical-border text-[11px] text-medical-muted">
            <p>• Emergency Medical Contact: Dial 108 / 911 or visit the nearest acute care emergency hospital.</p>
            <p>• Carry this printed study report and prescription draft with you to the hospital.</p>
          </div>
        </div>
      )}
    </div>
  );
};
