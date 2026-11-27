import React, { useState } from 'react';
import {
  Pill,
  Ban,
  Clock,
  AlertOctagon,
  ShieldCheck,
  AlertTriangle,
  HeartPulse,
  PhoneCall,
} from 'lucide-react';
import { PatientGuidance } from '../types';

interface PatientGuidancePanelProps {
  guidance: PatientGuidance;
}

export const PatientGuidancePanel: React.FC<PatientGuidancePanelProps> = ({ guidance }) => {
  const [activeTab, setActiveTab] = useState<'prescriptions' | 'avoid' | 'sequential' | 'redflags'>(
    'prescriptions'
  );

  return (
    <div className="bg-medical-panel/95 rounded-2xl border border-medical-border p-5 shadow-2xl flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-3 border-b border-medical-border mb-4 gap-2">
        <div className="flex items-center space-x-2">
          <HeartPulse className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-bold text-white">
            Patient Guidance, Prescriptions &amp; Care Trajectory
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-300 border border-cyan-500/25 font-mono">
            Sequential Plan
          </span>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1 bg-medical-dark p-1 rounded-xl border border-medical-border text-xs">
          <button
            onClick={() => setActiveTab('prescriptions')}
            className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all ${
              activeTab === 'prescriptions'
                ? 'bg-cyan-500 text-slate-950 font-semibold'
                : 'text-medical-muted hover:text-white'
            }`}
          >
            <Pill className="w-3.5 h-3.5" />
            <span>Rx Draft ({guidance.prescriptions_draft.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('avoid')}
            className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all ${
              activeTab === 'avoid'
                ? 'bg-cyan-500 text-slate-950 font-semibold'
                : 'text-medical-muted hover:text-white'
            }`}
          >
            <Ban className="w-3.5 h-3.5" />
            <span>Avoid ({guidance.things_to_avoid.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('sequential')}
            className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all ${
              activeTab === 'sequential'
                ? 'bg-cyan-500 text-slate-950 font-semibold'
                : 'text-medical-muted hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Sequential ({guidance.sequential_care_plan.length} Phases)</span>
          </button>
          <button
            onClick={() => setActiveTab('redflags')}
            className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all ${
              activeTab === 'redflags'
                ? 'bg-rose-500 text-white font-semibold'
                : 'text-medical-muted hover:text-rose-300'
            }`}
          >
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>Red Flags</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Prescriptions Draft */}
      {activeTab === 'prescriptions' && (
        <div className="space-y-3 overflow-y-auto max-h-[460px] pr-1 text-xs">
          <div className="p-3 bg-cyan-950/20 border border-cyan-500/30 rounded-xl text-cyan-200/90 text-[11px] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400 flex-shrink-0" />
            <span>
              <strong>Physician Reviewable Draft (Rx):</strong> Formulated from clinical presentation
              and guidelines. Requires physician sign-off prior to dispensing.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {guidance.prescriptions_draft.map((rx, idx) => (
              <div
                key={idx}
                className="bg-medical-dark rounded-xl border border-medical-border p-3.5 hover:border-cyan-500/40 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-cyan-400 font-bold text-xs">Rx #{idx + 1}</span>
                      <h4 className="font-bold text-white text-sm tracking-tight">
                        {rx.medication_name}
                      </h4>
                    </div>
                    <div className="flex items-center space-x-1.5 text-[10px] flex-shrink-0">
                      <span className="px-2 py-0.5 rounded bg-medical-panel border border-medical-border text-cyan-300 font-mono">
                        {rx.dosage}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-medical-panel border border-medical-border text-medical-muted">
                        {rx.route}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] mb-2.5 bg-black/30 p-2.5 rounded-lg border border-medical-border/40">
                    <div>
                      <span className="text-medical-muted block text-[10px] uppercase font-semibold">
                        Schedule
                      </span>
                      <span className="text-white font-medium">{rx.frequency}</span>
                    </div>
                    <div>
                      <span className="text-medical-muted block text-[10px] uppercase font-semibold">
                        Duration
                      </span>
                      <span className="text-emerald-400 font-semibold">{rx.duration}</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-medical-text mb-2">
                    <strong className="text-medical-muted">Directions:</strong> {rx.instructions}
                  </p>
                </div>

                {rx.precaution && (
                  <p className="text-[10px] text-amber-300/90 italic bg-amber-950/20 px-2.5 py-1.5 rounded-lg border border-amber-500/20 flex items-start gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <span>{rx.precaution}</span>
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
          <div className="p-3 bg-rose-950/20 border border-rose-500/40 rounded-xl text-rose-300 text-[11px] flex items-center gap-2">
            <Ban className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>
              <strong>Strict Contraindications &amp; Triggers:</strong> Avoid these factors to
              prevent complications or delayed healing.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {guidance.things_to_avoid.map((item, idx) => (
              <div
                key={idx}
                className="bg-medical-dark p-3 rounded-xl border border-rose-500/25 flex items-start space-x-2.5 text-medical-text"
              >
                <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                <span className="text-xs leading-relaxed">{item}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-medical-border">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 mb-2">
              Supportive Lifestyle &amp; Nutrition Recommendations
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {guidance.lifestyle_and_diet_recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className="bg-medical-dark p-2.5 rounded-xl border border-medical-border text-xs text-medical-text flex items-start space-x-2"
                >
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Sequential Care Plan */}
      {activeTab === 'sequential' && (
        <div className="space-y-4 overflow-y-auto max-h-[460px] pr-1 text-xs">
          <div className="p-3 bg-cyan-950/20 border border-cyan-500/30 rounded-xl text-cyan-200 text-[11px] flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400 flex-shrink-0" />
            <span>
              <strong>Phased Clinical Trajectory:</strong> Chronological milestones from acute
              stabilization to radiological clearance.
            </span>
          </div>

          <div className="relative pl-6 space-y-5 before:content-[''] before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-cyan-500/35">
            {guidance.sequential_care_plan.map((step) => (
              <div key={step.step_number} className="relative">
                <div className="absolute -left-[27px] top-0 w-6 h-6 rounded-full bg-cyan-500 text-slate-950 font-bold text-xs flex items-center justify-center shadow-md shadow-cyan-500/30 tabular-nums">
                  {step.step_number}
                </div>

                <div className="bg-medical-dark p-3.5 rounded-xl border border-medical-border space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-1.5 border-b border-medical-border/60">
                    <h4 className="font-bold text-white text-sm">{step.phase}</h4>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-medical-panel border border-cyan-500/30 text-cyan-300">
                      {step.timeframe}
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
          <div className="p-3.5 bg-rose-950/30 border border-rose-500/50 rounded-xl text-rose-200 text-xs">
            <h4 className="font-bold text-sm mb-1 text-rose-300 flex items-center gap-1.5">
              <AlertOctagon className="w-4 h-4" />
              Emergency Department (ER) Admission Criteria
            </h4>
            <p className="text-[11px] leading-relaxed">
              Seek immediate emergency hospital care if ANY of the following warning symptoms appear:
            </p>
          </div>

          <div className="space-y-2.5">
            {guidance.red_flag_warning_symptoms.map((rf, idx) => (
              <div
                key={idx}
                className="bg-rose-950/20 p-3 rounded-xl border border-rose-500/30 flex items-start space-x-3 text-rose-100"
              >
                <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                <span className="text-xs font-semibold leading-relaxed">{rf}</span>
              </div>
            ))}
          </div>

          <div className="p-3 bg-medical-dark rounded-xl border border-medical-border text-[11px] text-medical-muted flex items-center gap-2">
            <PhoneCall className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>
              Emergency Services: Dial 108 / 911 and carry the printed clinical PDF report to the ER.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
