import React, { useState } from 'react';
import { PathologyFinding, UncertaintySummary } from '../types';

interface FindingsPanelProps {
  findings: PathologyFinding[];
  ruledOut: string[];
  abstained?: string[];
  uncertaintySummary?: UncertaintySummary;
}

export const FindingsPanel: React.FC<FindingsPanelProps> = ({
  findings,
  ruledOut,
  abstained = [],
  uncertaintySummary,
}) => {
  const [activeTab, setActiveTab] = useState<'detected' | 'ruledOut' | 'safety'>('detected');

  return (
    <div className="bg-medical-panel rounded-xl border border-medical-border p-4 shadow-xl flex flex-col h-full">
      {/* Panel Navigation */}
      <div className="flex items-center justify-between pb-3 border-b border-medical-border mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-base font-semibold text-white">🔍 Structured Findings</span>
          <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
            {findings.length} Detected
          </span>
        </div>

        <div className="flex items-center space-x-1 bg-medical-dark p-0.5 rounded-lg border border-medical-border text-xs">
          <button
            onClick={() => setActiveTab('detected')}
            className={`px-2.5 py-1 rounded transition-colors ${
              activeTab === 'detected'
                ? 'bg-cyan-500 text-black font-semibold'
                : 'text-medical-muted hover:text-white'
            }`}
          >
            Pathologies ({findings.length})
          </button>
          <button
            onClick={() => setActiveTab('ruledOut')}
            className={`px-2.5 py-1 rounded transition-colors ${
              activeTab === 'ruledOut'
                ? 'bg-cyan-500 text-black font-semibold'
                : 'text-medical-muted hover:text-white'
            }`}
          >
            Ruled Out ({ruledOut.length})
          </button>
          <button
            onClick={() => setActiveTab('safety')}
            className={`px-2.5 py-1 rounded transition-colors ${
              activeTab === 'safety'
                ? 'bg-cyan-500 text-black font-semibold'
                : 'text-medical-muted hover:text-white'
            }`}
          >
            Safety Gate
          </button>
        </div>
      </div>

      {/* Tab 1: Detected Findings */}
      {activeTab === 'detected' && (
        <div className="space-y-3 overflow-y-auto max-h-[460px] pr-1">
          {findings.length === 0 ? (
            <div className="text-center py-10 text-medical-muted">
              <span className="text-3xl block mb-2">✨</span>
              <p className="text-sm font-medium">No Pathologies Detected</p>
              <p className="text-xs mt-1">Image features fall within normative reference distribution.</p>
            </div>
          ) : (
            findings.map((f) => {
              const confPct = Math.round(f.confidence * 100);
              const uncertPct = Math.round(f.uncertainty * 100);

              return (
                <div
                  key={f.id}
                  className={`rounded-lg border p-3 transition-all ${
                    f.is_critical
                      ? 'bg-rose-950/20 border-rose-500/50 shadow-sm shadow-rose-950/40'
                      : f.confidence >= 0.8
                      ? 'bg-medical-dark border-cyan-500/30'
                      : 'bg-medical-dark border-amber-500/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">
                        {f.is_critical ? '🚨' : f.confidence >= 0.8 ? '⚠️' : 'ℹ️'}
                      </span>
                      <h3 className="font-semibold text-white text-sm tracking-tight">
                        {f.label}
                      </h3>
                    </div>

                    <div className="flex items-center space-x-1">
                      {f.is_critical && (
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-rose-500 text-white">
                          CRITICAL
                        </span>
                      )}
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded border ${
                          f.severity.toLowerCase().includes('severe')
                            ? 'bg-red-500/10 text-red-300 border-red-500/30'
                            : f.severity.toLowerCase().includes('moderate')
                            ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                            : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                        }`}
                      >
                        {f.severity}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-cyan-300/90 font-medium mb-1.5 flex items-center gap-1">
                    <span>📍</span> {f.anatomical_location}
                  </p>

                  {f.evidence_text && (
                    <p className="text-xs text-medical-muted italic bg-black/30 p-2 rounded border border-medical-border/40 mb-2">
                      "{f.evidence_text}"
                    </p>
                  )}

                  {/* Confidence & Uncertainty Bars */}
                  <div className="grid grid-cols-2 gap-3 pt-1 border-t border-medical-border/40 text-[11px]">
                    <div>
                      <div className="flex justify-between text-medical-text mb-1">
                        <span>Calibrated Probability</span>
                        <span className="font-mono font-semibold text-cyan-400">{confPct}%</span>
                      </div>
                      <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            f.is_critical
                              ? 'bg-rose-500'
                              : f.confidence >= 0.8
                              ? 'bg-cyan-400'
                              : 'bg-amber-400'
                          }`}
                          style={{ width: `${confPct}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-medical-text mb-1">
                        <span>Epistemic Uncertainty</span>
                        <span className="font-mono text-amber-400">{uncertPct}%</span>
                      </div>
                      <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full bg-amber-400 rounded-full"
                          style={{ width: `${uncertPct}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {f.bounding_box && (
                    <div className="mt-2 text-[10px] text-medical-muted font-mono flex items-center gap-2">
                      <span>Bounds: [{f.bounding_box.x}, {f.bounding_box.y}]</span>
                      <span>Dim: {f.bounding_box.width}×{f.bounding_box.height}px</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab 2: Ruled Out Conditions */}
      {activeTab === 'ruledOut' && (
        <div className="space-y-2 overflow-y-auto max-h-[460px]">
          <div className="p-2.5 rounded bg-emerald-950/20 border border-emerald-500/30 text-xs text-emerald-300 mb-3">
            🛡️ <strong>Negative Predictive Screening:</strong> The foundation vision backbone verified the following pathologies as absent or within normative limits.
          </div>
          {ruledOut.map((ro, idx) => (
            <div
              key={idx}
              className="flex items-center space-x-2.5 p-2.5 rounded-lg bg-medical-dark border border-medical-border text-xs text-medical-text"
            >
              <span className="text-emerald-400 font-bold">✓</span>
              <span>{ro}</span>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Epistemic Safety Gate Summary */}
      {activeTab === 'safety' && (
        <div className="space-y-4 overflow-y-auto max-h-[460px] text-xs">
          <div className="p-3 bg-medical-dark rounded-lg border border-medical-border space-y-2">
            <h4 className="font-semibold text-white">Epistemic Uncertainty Gate Statistics</h4>
            <div className="grid grid-cols-2 gap-2 text-medical-muted pt-1">
              <div>Total Evaluated Candidates:</div>
              <div className="font-mono text-white text-right">
                {uncertaintySummary?.total_findings ?? findings.length}
              </div>
              <div>High Confidence (≥80%):</div>
              <div className="font-mono text-emerald-400 text-right">
                {uncertaintySummary?.high_confidence_count ?? findings.filter((f) => f.confidence >= 0.8).length}
              </div>
              <div>Review Required (60-79%):</div>
              <div className="font-mono text-amber-400 text-right">
                {uncertaintySummary?.review_required_count ?? findings.filter((f) => f.confidence >= 0.6 && f.confidence < 0.8).length}
              </div>
              <div>Abstained (&lt;50% withheld):</div>
              <div className="font-mono text-rose-400 text-right">
                {uncertaintySummary?.abstention_count ?? abstained.length}
              </div>
            </div>
          </div>

          {abstained.length > 0 && (
            <div className="p-3 bg-rose-950/20 border border-rose-500/40 rounded-lg">
              <h4 className="font-semibold text-rose-300 mb-1 flex items-center gap-1.5">
                <span>🚫</span> Abstained Predictions (Withheld for Clinical Safety)
              </h4>
              <p className="text-[11px] text-rose-200/80 mb-2">
                The model refused to diagnose these conditions because confidence fell below the 50% safety gate:
              </p>
              <ul className="list-disc list-inside space-y-1 text-medical-text">
                {abstained.map((label, idx) => (
                  <li key={idx} className="font-mono text-[11px]">{label}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="p-3 bg-cyan-950/20 border border-cyan-500/30 rounded-lg text-medical-muted text-[11px] space-y-1">
            <p className="font-semibold text-cyan-300">Safety Policy Enforcement</p>
            <p>• Medical AI models are calibrated using Platt scaling & Monte Carlo dropout.</p>
            <p>• Uncalibrated high-entropy hypotheses are automatically filtered to prevent hallucinated diagnoses.</p>
          </div>
        </div>
      )}
    </div>
  );
};
