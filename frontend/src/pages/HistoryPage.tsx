import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { StudySummary } from '../types';

export const HistoryPage: React.FC = () => {
  const [history, setHistory] = useState<StudySummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    api.getHistory()
      .then((data) => {
        if (isMounted) {
          setHistory(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Failed to fetch history');
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Page Title */}
      <div className="bg-medical-panel border border-medical-border rounded-xl p-5 shadow-lg flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <span>🗄️</span> Case History & Audit Records
          </h1>
          <p className="text-xs text-medical-muted mt-1">
            Persisted radiology studies stored in local SQLite database for clinical review and retrospective audit.
          </p>
        </div>

        <span className="text-xs px-3 py-1 rounded bg-medical-dark border border-medical-border text-cyan-400 font-mono">
          {history.length} Cases Logged
        </span>
      </div>

      {/* Table Area */}
      <div className="bg-medical-panel border border-medical-border rounded-xl shadow-xl overflow-hidden">
        {isLoading ? (
          <div className="text-center py-16 text-medical-muted text-xs">
            <svg className="animate-spin h-5 w-5 mx-auto mb-2 text-cyan-400" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>Retrieving patient studies from database...</span>
          </div>
        ) : error ? (
          <div className="text-center py-12 text-rose-300 text-xs">
            <p>Could not load case history: {error}</p>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-16 text-medical-muted space-y-2">
            <span className="text-3xl block">📁</span>
            <p className="text-sm font-medium text-white">No Studies Analyzed Yet</p>
            <p className="text-xs max-w-sm mx-auto">
              Studies processed via the Doctor Workstation will automatically be saved and indexed here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-medical-dark/90 text-[11px] uppercase tracking-wider text-medical-muted border-b border-medical-border">
                <tr>
                  <th className="py-3 px-4">Study ID</th>
                  <th className="py-3 px-4">Patient ID</th>
                  <th className="py-3 px-4">Modality</th>
                  <th className="py-3 px-4">Demographics</th>
                  <th className="py-3 px-4">Findings</th>
                  <th className="py-3 px-4">Urgency</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-medical-border/60 text-medical-text">
                {history.map((record) => (
                  <tr key={record.study_id} className="hover:bg-medical-dark/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-cyan-400">
                      {record.study_id}
                    </td>
                    <td className="py-3 px-4 font-mono text-white">
                      {record.patient_id || 'PT-UNKNOWN'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-medical-dark border border-medical-border text-[11px]">
                        {record.modality}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-medical-muted">
                      {record.age ? `${record.age}y` : 'Age N/A'}, {record.gender || 'Unknown'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-white">
                        {record.findings_count} findings
                      </span>
                      {record.has_critical_finding && (
                        <span className="ml-1.5 text-[10px] text-rose-400 font-bold">
                          🚨 CRITICAL
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                          record.urgency_level === 'URGENT'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : record.urgency_level === 'INTERMEDIATE'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {record.urgency_level}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-medical-muted text-[11px] font-mono">
                      {new Date(record.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
