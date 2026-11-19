import axios from 'axios';
import { StudyAnalysisResponse, StudySummary } from '../types';

const API_BASE = '/api/v1';

export const api = {
  /**
   * Uploads medical image and runs full multimodal inference pipeline.
   */
  async analyzeStudy(formData: FormData): Promise<StudyAnalysisResponse> {
    const res = await axios.post<StudyAnalysisResponse>(`${API_BASE}/analyze`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 120000, // 2 minutes for deep learning pipeline
    });
    return res.data;
  },

  /**
   * Diagnostic health check for backend and Microsoft model backbones.
   */
  async getHealth(): Promise<{
    status: string;
    version: string;
    active_backbone: string;
    modalities_supported: string[];
    total_pathologies_covered: number;
  }> {
    const res = await axios.get(`${API_BASE}/health`);
    return res.data;
  },

  /**
   * Retrieves supported modality registry.
   */
  async getModalities(): Promise<any> {
    const res = await axios.get(`${API_BASE}/modalities`);
    return res.data;
  },

  /**
   * Retrieves case history records from SQLite database.
   */
  async getHistory(): Promise<StudySummary[]> {
    const res = await axios.get<StudySummary[]>(`${API_BASE}/history`);
    return res.data;
  },

  /**
   * Look up full study record by ID.
   */
  async getStudy(studyId: string): Promise<any> {
    const res = await axios.get(`${API_BASE}/studies/${studyId}`);
    return res.data;
  },
};
