import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Database,
  Lock,
  ShieldCheck,
  Search,
  Eye,
  Trash2,
  CheckCircle2,
  AlertOctagon,
  FileCheck,
  Loader2,
  FolderOpen,
} from 'lucide-react';
import { api } from '../api/client';
import { StudySummary } from '../types';
import { useAuth } from '../context/AuthContext';
import { AuthFormCard } from '../components/AuthModal';

const MODALITIES = ['All', 'X-Ray', 'CT', 'MRI', 'Ultrasound'];

export const HistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const [history, setHistory] = useState<StudySummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [modalityFilter, setModalityFilter] = useState<string>('All');
  const [loadingStudyId, setLoadingStudyId] = useState<string | null>(null);

  const fetchHistory = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getHistory({
        limit: 100,
        modality: modalityFilter !== 'All' ? modalityFilter : undefined,
      });
      setHistory(data);
    } catch (err: any) {
      if (err.response?.status === 401) {
        logout();
      }
      setError(err.response?.data?.detail || err.message || 'Failed to fetch history');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchHistory();
    }
  }, [isAuthenticated, modalityFilter]);

  const filteredHistory = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return history;
    return history.filter(
      (r) =>
        r.study_id.toLowerCase().includes(q) ||
        (r.patient_id || '').toLowerCase().includes(q) ||
        (r.top_finding || '').toLowerCase().includes(q) ||
        (r.modality || '').toLowerCase().includes(q)
    );
  }, [history, searchQuery]);

  const stats = useMemo(() => {
    const total = history.length;
    const critical = history.filter((h) => h.has_critical_finding || h.urgency_level === 'URGENT').length;
    const signed = history.filter((h) => Boolean(h.signed_off_by)).length;
    const dicom = history.filter((h) => Boolean(h.is_dicom)).length;
    return { total, critical, signed, dicom };
  }, [history]);

  const handleViewStudy = async (studyId: string) => {
    setLoadingStudyId(studyId);
    try {
      const fullRecord = await api.getStudy(studyId);
      navigate('/', { state: { loadedStudy: fullRecord } });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Could not load study details');
    } finally {
      setLoadingStudyId(null);
    }
  };

  const handleSignOff = async (studyId: string) => {
    try {
      const updated = await api.signOffStudy(studyId);
      setHistory((prev) =>
        prev.map((item) => (item.study_id === studyId ? { ...item, ...updated } : item))
      );
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to sign off study');
    }
  };

  const handleDelete = async (studyId: string) => {
    if (!window.confirm(`Delete study record ${studyId} from archive?`)) return;
    try {
      await api.deleteStudy(studyId);
      setHistory((prev) => prev.filter((item) => item.study_id !== studyId));
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete study');
    }
  };

  // Protected Auth Gate if not logged in
  if (!isAuthenticated) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-6 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
              <Lock className="w-3.5 h-3.5" />
              <span>Protected Patient Archive</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Clinician Authentication Required
            </h1>
            <p className="text-sm text-medical-muted leading-relaxed">
              Patient diagnostic reports, DICOM metadata, and prescription drafts are protected by
              <strong className="text-cyan-300"> JWT (HS256) Bearer Authentication</strong>. Sign in
              to inspect past studies, perform physician sign-offs, and manage audit records.
            </p>

            <div className="space-y-2.5 pt-2 text-xs">
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-medical-panel border border-medical-border">
                <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-white block">Role-Based Clinician Access</span>
                  <span className="text-medical-muted">
                    Every API request to <code className="text-cyan-300">/api/v1/history</code> &amp;{' '}
                    <code className="text-cyan-300">/studies/*</code> verifies a signed JWT token.
                  </span>
                </div>
              </div>
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-medical-panel border border-medical-border">
                <FileCheck className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-white block">Digital Sign-Off Audit Trail</span>
                  <span className="text-medical-muted">
                    Authenticated physicians can digitally verify studies and stamp their credentials onto exported PDFs.
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 flex justify-center">
            <AuthFormCard embedded />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Page Header */}
      <div className="bg-medical-panel/95 border border-medical-border rounded-2xl p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-cyan-400" />
            <span>Protected Case History &amp; Clinical Audit Archive</span>
          </h1>
          <p className="text-xs text-medical-muted mt-1">
            Authenticated Session: <strong className="text-emerald-300">{user?.full_name}</strong>{' '}
            ({user?.role}) • All queries authenticated via JWT.
          </p>
        </div>

        <button
          onClick={fetchHistory}
          className="px-3.5 py-2 rounded-xl bg-medical-dark hover:bg-medical-border border border-medical-border text-xs text-cyan-300 font-semibold transition-colors"
        >
          Refresh Archive
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-medical-panel border border-medical-border rounded-xl p-4">
          <span className="text-[11px] uppercase font-semibold text-medical-muted">Total Studies</span>
          <p className="text-2xl font-bold text-white mt-1 tabular-nums">{stats.total}</p>
        </div>
        <div className="bg-medical-panel border border-rose-500/25 rounded-xl p-4">
          <span className="text-[11px] uppercase font-semibold text-rose-300">Urgent / Critical</span>
          <p className="text-2xl font-bold text-rose-400 mt-1 tabular-nums">{stats.critical}</p>
        </div>
        <div className="bg-medical-panel border border-emerald-500/25 rounded-xl p-4">
          <span className="text-[11px] uppercase font-semibold text-emerald-300">MD Signed Off</span>
          <p className="text-2xl font-bold text-emerald-400 mt-1 tabular-nums">{stats.signed}</p>
        </div>
        <div className="bg-medical-panel border border-cyan-500/25 rounded-xl p-4">
          <span className="text-[11px] uppercase font-semibold text-cyan-300">DICOM Studies</span>
          <p className="text-2xl font-bold text-cyan-400 mt-1 tabular-nums">{stats.dicom}</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-medical-panel border border-medical-border rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-medical-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Study ID, Patient ID, or Finding..."
            className="w-full bg-medical-dark border border-medical-border rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {MODALITIES.map((mod) => (
            <button
              key={mod}
              onClick={() => setModalityFilter(mod)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                modalityFilter === mod
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-semibold'
                  : 'bg-medical-dark text-medical-muted border-medical-border hover:text-white'
              }`}
            >
              {mod}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/40 text-rose-200 text-xs">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-medical-panel border border-medical-border rounded-2xl shadow-xl overflow-hidden">
        {isLoading ? (
          <div className="text-center py-16 text-medical-muted text-xs space-y-2">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-cyan-400" />
            <p>Retrieving encrypted clinical archive...</p>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="text-center py-16 text-medical-muted space-y-2">
            <FolderOpen className="w-10 h-10 mx-auto text-medical-muted/60" />
            <p className="text-sm font-semibold text-white">No Matching Studies Found</p>
            <p className="text-xs max-w-sm mx-auto">
              Run an analysis on the Doctor Workstation to automatically persist studies here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-medical-dark/90 text-[11px] uppercase tracking-wider text-medical-muted border-b border-medical-border">
                <tr>
                  <th className="py-3.5 px-4">Study ID</th>
                  <th className="py-3.5 px-4">Patient</th>
                  <th className="py-3.5 px-4">Modality</th>
                  <th className="py-3.5 px-4">Primary Finding</th>
                  <th className="py-3.5 px-4">Urgency</th>
                  <th className="py-3.5 px-4">Verification</th>
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-medical-border/60 text-medical-text">
                {filteredHistory.map((record) => {
                  const count = record.findings_count ?? record.finding_count ?? 0;
                  return (
                    <tr key={record.study_id} className="hover:bg-medical-dark/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-cyan-400">
                        {record.study_id}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-mono text-white font-medium">
                          {record.patient_id || 'PT-UNKNOWN'}
                        </div>
                        <div className="text-[10px] text-medical-muted">
                          {record.age ? `${record.age}y` : 'Age N/A'}, {record.gender || 'Unknown'}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-medical-dark border border-medical-border text-[11px]">
                          {record.modality}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-white max-w-[200px] truncate">
                          {record.top_finding || `${count} findings`}
                        </div>
                        <div className="text-[10px] text-medical-muted flex items-center gap-1.5">
                          <span>{count} total</span>
                          {record.has_critical_finding && (
                            <span className="text-rose-400 font-bold inline-flex items-center gap-0.5">
                              <AlertOctagon className="w-3 h-3" />
                              CRITICAL
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase ${
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
                      <td className="py-3 px-4">
                        {record.signed_off_by ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {record.signed_off_by}
                          </span>
                        ) : (
                          <button
                            onClick={() => handleSignOff(record.study_id)}
                            className="px-2 py-1 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[10px] font-semibold transition-colors"
                          >
                            Sign Off
                          </button>
                        )}
                      </td>
                      <td className="py-3 px-4 text-medical-muted text-[11px] font-mono tabular-nums">
                        {new Date(record.created_at).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleViewStudy(record.study_id)}
                            disabled={loadingStudyId === record.study_id}
                            className="px-2.5 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/35 text-cyan-300 text-[11px] font-semibold inline-flex items-center gap-1 transition-colors"
                            title="Open Full Report & CDS"
                          >
                            {loadingStudyId === record.study_id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Eye className="w-3 h-3" />
                            )}
                            <span>Open</span>
                          </button>
                          <button
                            onClick={() => handleDelete(record.study_id)}
                            className="p-1.5 rounded-lg text-medical-muted hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Delete Study"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
