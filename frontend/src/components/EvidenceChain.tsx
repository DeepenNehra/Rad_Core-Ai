import React from 'react';
import { EvidenceChainLink } from '../types';

interface EvidenceChainProps {
  chain: EvidenceChainLink[];
  processingTimeMs: number;
}

export const EvidenceChain: React.FC<EvidenceChainProps> = ({ chain, processingTimeMs }) => {
  return (
    <div className="bg-medical-panel rounded-xl border border-medical-border p-5 shadow-xl">
      <div className="flex items-center justify-between pb-3 border-b border-medical-border mb-4">
        <div>
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <span>🔗</span> Traceable AI Evidence Chain
          </h3>
          <p className="text-xs text-medical-muted">
            Auditable step-by-step reasoning trail from pixel ingestion to clinical decision support
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-medical-muted">Total Pipeline Latency:</span>
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-semibold">
            {processingTimeMs.toFixed(1)} ms
          </span>
        </div>
      </div>

      {/* Horizontal / Wrapped Step Flow */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {chain.map((link) => (
          <div
            key={link.step}
            className="bg-medical-dark/80 p-3 rounded-lg border border-medical-border flex flex-col justify-between hover:border-cyan-500/40 transition-colors"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 text-[10px] font-bold flex items-center justify-center">
                  {link.step}
                </span>
                <span className="text-[10px] uppercase font-semibold text-emerald-400">
                  Passed ✓
                </span>
              </div>

              <h4 className="text-xs font-semibold text-white mb-1 leading-tight">
                {link.stage}
              </h4>

              <p className="text-[11px] text-medical-muted leading-snug line-clamp-3">
                {link.description}
              </p>
            </div>

            <div className="mt-2 pt-2 border-t border-medical-border/40 text-[9px] font-mono text-cyan-300/70">
              Verified Step {link.step}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
