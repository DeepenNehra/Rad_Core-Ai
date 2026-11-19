import React, { useState } from 'react';
import { RadiologyReport, StudyAnalysisResponse } from '../types';
import { downloadReportText, printClinicalReport } from '../utils/reportDownloader';

interface ReportPanelProps {
  report: RadiologyReport;
  fullAnalysis?: StudyAnalysisResponse;
}

export const ReportPanel: React.FC<ReportPanelProps> = ({ report, fullAnalysis }) => {
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopyReport = () => {
    const fullText = `MEDIVISTA AI RADIOLOGY REPORT\n============================\nEXAMINATION: ${report.examination}\nTECHNIQUE: ${report.technique}\nCOMPARISON: ${report.comparison}\n\nFINDINGS:\n${report.findings}\n\nIMPRESSION:\n${report.impression}\n\nURGENCY LEVEL: ${report.urgency_level}\n\nDISCLAIMER:\n${report.disclaimer}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const urgencyBadge = {
    URGENT: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    INTERMEDIATE: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    ROUTINE: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  }[report.urgency_level] || 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';

  return (
    <div className="bg-medical-panel rounded-xl border border-medical-border p-5 shadow-xl flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-medical-border mb-4 gap-2">
        <div className="flex items-center space-x-2">
          <span className="text-base font-semibold text-white">📋 Structured Radiology Report</span>
          <span className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${urgencyBadge}`}>
            Triage: {report.urgency_level}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-1.5 text-xs">
          <button
            onClick={handleCopyReport}
            className="flex items-center space-x-1 px-2.5 py-1 rounded bg-medical-dark hover:bg-medical-border border border-medical-border text-medical-text transition-colors"
            title="Copy to Clipboard"
          >
            <span>{copied ? '✅' : '📋'}</span>
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          {fullAnalysis && (
            <>
              <button
                onClick={() => downloadReportText(fullAnalysis)}
                className="flex items-center space-x-1 px-2.5 py-1 rounded bg-medical-dark hover:bg-medical-border border border-medical-border text-medical-text transition-colors"
                title="Download text report"
              >
                <span>📥</span>
                <span>Text</span>
              </button>

              <button
                onClick={() => printClinicalReport(fullAnalysis)}
                className="flex items-center space-x-1 px-3 py-1 rounded bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-500/40 text-cyan-200 font-semibold transition-colors shadow-sm"
                title="Print or Save as PDF"
              >
                <span>🖨️</span>
                <span>Print / PDF</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Report Body */}
      <div className="space-y-4 overflow-y-auto max-h-[460px] pr-1 font-sans text-xs">
        {/* Examination & Technique Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-medical-dark/70 p-3 rounded-lg border border-medical-border/60">
          <div>
            <span className="text-[10px] uppercase font-bold text-medical-muted block">Examination</span>
            <span className="text-white font-medium">{report.examination}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-medical-muted block">Technique</span>
            <span className="text-medical-text">{report.technique}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-medical-muted block">Comparison</span>
            <span className="text-medical-text">{report.comparison}</span>
          </div>
        </div>

        {/* Structured Findings Narrative */}
        <div className="space-y-1.5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
            Organ-by-Organ Findings
          </h4>
          <div className="p-3 bg-medical-dark/90 rounded-lg border border-medical-border/80 text-medical-text leading-relaxed whitespace-pre-wrap font-mono text-[11px]">
            {report.findings}
          </div>
        </div>

        {/* Diagnostic Impression */}
        <div className="space-y-1.5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
            Diagnostic Impression
          </h4>
          <div className="p-3 bg-amber-950/10 rounded-lg border border-amber-500/30 text-amber-100 leading-relaxed whitespace-pre-wrap font-medium">
            {report.impression}
          </div>
        </div>

        {/* Mandatory Clinical Safety Disclaimer */}
        <div className="p-3 bg-red-950/10 border border-red-500/20 rounded-lg text-[11px] text-red-200/80 flex items-start space-x-2">
          <span className="text-base flex-shrink-0">⚠️</span>
          <p className="leading-tight">{report.disclaimer}</p>
        </div>
      </div>
    </div>
  );
};
