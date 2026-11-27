import axios from 'axios';
import { AuthResponse, ClinicianUser, StudyAnalysisResponse, StudySummary } from '../types';

export const TOKEN_STORAGE_KEY = 'medivista_jwt_token';
export const USER_STORAGE_KEY = 'medivista_clinician_user';

function resolveApiBase(): string {
  const envUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (!envUrl || !envUrl.trim()) {
    return '/api/v1';
  }
  const cleaned = envUrl.trim().replace(/\/+$/, '');
  return cleaned.endsWith('/api/v1') ? cleaned : `${cleaned}/api/v1`;
}

export const API_BASE = resolveApiBase();

const http = axios.create({
  baseURL: API_BASE,
  timeout: 120000,
});

// Attach JWT Bearer token automatically on every request
http.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const api = {
  // ---------------- Auth ----------------
  async login(username: string, password: string): Promise<AuthResponse> {
    const res = await http.post<AuthResponse>('/auth/login', { username, password });
    return res.data;
  },

  async register(payload: {
    username: string;
    email: string;
    full_name: string;
    password: string;
    role?: string;
    department?: string;
  }): Promise<AuthResponse> {
    const res = await http.post<AuthResponse>('/auth/register', payload);
    return res.data;
  },

  async getMe(): Promise<ClinicianUser> {
    const res = await http.get<ClinicianUser>('/auth/me');
    return res.data;
  },

  // ---------------- Multimodal Analysis ----------------
  async analyzeStudy(formData: FormData): Promise<StudyAnalysisResponse> {
    const res = await http.post<StudyAnalysisResponse>('/analyze', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  async getHealth(): Promise<{
    status: string;
    version: string;
    active_backbone: string;
    modalities_supported: string[];
    total_pathologies_covered: number;
    database_backend?: string;
    auth_scheme?: string;
  }> {
    const res = await http.get('/health');
    return res.data;
  },

  async getModalities(): Promise<any> {
    const res = await http.get('/modalities');
    return res.data;
  },

  // ---------------- Protected History & Audit ----------------
  async getHistory(params?: { modality?: string; search?: string; limit?: number }): Promise<StudySummary[]> {
    const res = await http.get<StudySummary[]>('/history', { params });
    return res.data;
  },

  async getStudy(studyId: string): Promise<StudyAnalysisResponse> {
    const res = await http.get<StudyAnalysisResponse>(`/studies/${studyId}`);
    return res.data;
  },

  async signOffStudy(studyId: string): Promise<StudySummary> {
    const res = await http.post<StudySummary>(`/studies/${studyId}/sign-off`);
    return res.data;
  },

  async deleteStudy(studyId: string): Promise<{ deleted: boolean; study_id: string }> {
    const res = await http.delete<{ deleted: boolean; study_id: string }>(`/studies/${studyId}`);
    return res.data;
  },
};
