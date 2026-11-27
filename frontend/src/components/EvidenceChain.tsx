import React from 'react';
import { Link2, CheckCircle2 } from 'lucide-react';
import { EvidenceChainLink } from '../types';

interface EvidenceChainProps {
  chain: EvidenceChainLink[];
  processingTimeMs: number;
}

export const EvidenceChain: React.FC<EvidenceChainProps> = ({ chain, processingTimeMs }) => {
  return (
    <div className="bg-medical-panel/95 rounded-2xl border border-medical-border p-5 shadow-2xl">
      <div className="flex flex-wrap items-center justify-between pb-3 border-b border-medical-border mb-4 gap-2">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Link2 className="w-4 h-4 text-cyan-400" />
            <span>Traceable AI Evidence Chain</span>
          </h3>
          <p className="text-[11px] text-medical-muted">
            Auditable step-by-step reasoning trail from DICOM ingestion to clinical decision support
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-[11px] text-medical-muted">Total Latency:</span>
          <span className="text-xs font-mono px-2.5 py-0.5 rounded-md bg-cyan-500/10 text-cyan-300 border border-cyan-500/25 font-semibold tabular-nums">
            {processingTimeMs.toFixed(1)} ms
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {chain.map((link) => (
          <div
            key={link.step}
            className="bg-medical-dark/80 p-3.5 rounded-xl border border-medical-border flex flex-col justify-between hover:border-cyan-500/40 transition-colors"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="w-6 h-6 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/35 text-[11px] font-bold flex items-center justify-center tabular-nums">
                  {link.step}
                </span>
                <span className="text-[10px] uppercase font-semibold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Verified
                </span>
              </div>

              <h4 className="text-xs font-semibold text-white mb-1 leading-tight">{link.stage}</h4>

              <p className="text-[11px] text-medical-muted leading-snug line-clamp-3">
                {link.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
