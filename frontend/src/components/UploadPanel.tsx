import React, { useEffect, useRef, useState } from 'react';
import {
  UploadCloud,
  FileCheck2,
  Scan,
  Sparkles,
  Search,
  Loader2,
  X,
} from 'lucide-react';

interface UploadPanelProps {
  onAnalyze: (formData: FormData) => void;
  isLoading: boolean;
  selectedModality?: string;
  onModalityChange?: (modality: string) => void;
}

interface PresetCase {
  label: string;
  modality: string;
  patientId: string;
  age: string;
  gender: string;
  symptoms: string;
  history: string;
}

const CLINICAL_PRESETS: PresetCase[] = [
  {
    label: 'Pneumonia (X-Ray)',
    modality: 'X-Ray',
    patientId: 'PT-2026-8914',
    age: '58',
    gender: 'Female',
    symptoms:
      'High-grade fever (38.9°C) with chills x 4 days, persistent productive cough, right-sided pleuritic chest pain.',
    history: 'Type 2 Diabetes Mellitus, non-smoker, no prior thoracic surgery.',
  },
  {
    label: 'Brain Lesion (MRI)',
    modality: 'MRI',
    patientId: 'PT-2026-3401',
    age: '42',
    gender: 'Female',
    symptoms:
      'Progressive morning headaches x 3 weeks with nausea, right visual field blurring, focal weakness.',
    history: 'History of mild migraine; no prior neurosurgical intervention.',
  },
  {
    label: 'Lung Nodule (CT)',
    modality: 'CT',
    patientId: 'PT-2026-1188',
    age: '62',
    gender: 'Male',
    symptoms: 'Mild exertional dyspnea and dry cough for 2 months. Denies hemoptysis.',
    history: 'Former smoker (25 pack-years), mild essential hypertension.',
  },
  {
    label: 'Gallstone (Ultrasound)',
    modality: 'Ultrasound',
    patientId: 'PT-2026-6120',
    age: '46',
    gender: 'Female',
    symptoms:
      'Episodic colicky RUQ abdominal pain radiating to right back ~45 mins post fatty meals.',
    history: 'BMI 29.4, no prior abdominal surgery or jaundice.',
  },
];

export const UploadPanel: React.FC<UploadPanelProps> = ({
  onAnalyze,
  isLoading,
  selectedModality,
  onModalityChange,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [modality, setModality] = useState<string>(selectedModality || 'X-Ray');
  const [patientId, setPatientId] = useState<string>('PT-2026-8914');
  const [age, setAge] = useState<string>('58');
  const [gender, setGender] = useState<string>('Female');
  const [symptoms, setSymptoms] = useState<string>(CLINICAL_PRESETS[0].symptoms);
  const [clinicalHistory, setClinicalHistory] = useState<string>(CLINICAL_PRESETS[0].history);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selectedModality && selectedModality !== modality) {
      setModality(selectedModality);
    }
  }, [selectedModality]);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const isRaster = /\.(png|jpg|jpeg)$/i.test(file.name);
    if (!isRaster) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const applyPreset = (preset: PresetCase) => {
    setModality(preset.modality);
    onModalityChange?.(preset.modality);
    setPatientId(preset.patientId);
    setAge(preset.age);
    setGender(preset.gender);
    setSymptoms(preset.symptoms);
    setClinicalHistory(preset.history);
  };

  const handleModalitySelect = (value: string) => {
    setModality(value);
    onModalityChange?.(value);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('modality', modality);
    formData.append('patient_id', patientId || 'PT-UNKNOWN');
    if (age) formData.append('age', age);
    if (gender) formData.append('gender', gender);
    if (symptoms) formData.append('symptoms', symptoms);
    if (clinicalHistory) formData.append('clinical_history', clinicalHistory);

    onAnalyze(formData);
  };

  return (
    <div className="bg-medical-panel/95 rounded-2xl border border-medical-border p-6 shadow-2xl">
      <div className="flex items-center justify-between pb-4 border-b border-medical-border mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Scan className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Study Ingestion &amp; Acquisition</h2>
            <p className="text-[11px] text-medical-muted">
              DICOM (.dcm) or PNG / JPG with patient context
            </p>
          </div>
        </div>
        <span className="text-[10px] px-2.5 py-1 rounded-full bg-medical-dark border border-medical-border text-cyan-400 font-mono">
          Stage 1 / 8
        </span>
      </div>

      {/* 1-Click Clinical Demo Presets */}
      <div className="mb-4">
        <div className="flex items-center gap-1.5 text-[11px] text-medical-muted mb-1.5">
          <Sparkles className="w-3 h-3 text-cyan-400" />
          <span>Quick-Fill Patient Context Presets:</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {CLINICAL_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => applyPreset(preset)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all ${
                modality === preset.modality && patientId === preset.patientId
                  ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-200'
                  : 'bg-medical-dark border-medical-border text-medical-muted hover:text-white hover:border-cyan-500/30'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Drag & Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
            isDragOver
              ? 'border-cyan-400 bg-cyan-950/25'
              : file
              ? 'border-emerald-500/50 bg-emerald-950/10'
              : 'border-medical-border hover:border-cyan-500/50 bg-medical-dark/60'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".dcm,.dicom,.png,.jpg,.jpeg"
            onChange={handleFileChange}
            className="hidden"
          />

          {file ? (
            <div className="flex items-center justify-between gap-3 text-left">
              <div className="flex items-center gap-3 min-w-0">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Scan preview"
                    className="w-14 h-14 rounded-lg object-cover border border-emerald-500/40 bg-black flex-shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0">
                    <FileCheck2 className="w-6 h-6" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-emerald-300 truncate">{file.name}</p>
                  <p className="text-[11px] text-medical-muted tabular-nums">
                    {(file.size / 1024).toFixed(1)} KB • Ready for Inference
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                }}
                className="p-1.5 rounded-lg text-medical-muted hover:text-rose-300 hover:bg-rose-500/10"
                title="Remove file"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center py-2">
              <div className="w-11 h-11 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-2.5">
                <UploadCloud className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium text-medical-text">
                Drop medical scan here or <span className="text-cyan-400 underline">browse</span>
              </p>
              <p className="text-[11px] text-medical-muted mt-1">
                Supports DICOM (.dcm), PNG, JPG, JPEG
              </p>
            </div>
          )}
        </div>

        {/* Modality & Demographics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-[11px] font-medium text-medical-text mb-1">
              Imaging Modality
            </label>
            <select
              value={modality}
              onChange={(e) => handleModalitySelect(e.target.value)}
              className="w-full bg-medical-dark border border-medical-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
            >
              <option value="X-Ray">X-Ray (Chest) — BioViL-T</option>
              <option value="CT">CT Scan (Axial) — BiomedCLIP</option>
              <option value="MRI">MRI Scan — BiomedCLIP</option>
              <option value="Ultrasound">Ultrasound — BiomedCLIP</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-medical-text mb-1">
              Patient ID (Anonymized)
            </label>
            <input
              type="text"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              placeholder="PT-2026-001"
              className="w-full bg-medical-dark border border-medical-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-medical-text mb-1">
              Age (Years)
            </label>
            <input
              type="number"
              min="0"
              max="125"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="w-full bg-medical-dark border border-medical-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 tabular-nums"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-medical-text mb-1">
              Biological Sex
            </label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full bg-medical-dark border border-medical-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
              <option value="Unknown">Unknown</option>
            </select>
          </div>
        </div>

        {/* Symptoms */}
        <div>
          <label className="block text-[11px] font-medium text-medical-text mb-1">
            Presenting Clinical Symptoms
          </label>
          <textarea
            rows={2}
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            className="w-full bg-medical-dark border border-medical-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
          />
        </div>

        {/* History */}
        <div>
          <label className="block text-[11px] font-medium text-medical-text mb-1">
            Prior Clinical History &amp; Risk Factors
          </label>
          <textarea
            rows={2}
            value={clinicalHistory}
            onChange={(e) => setClinicalHistory(e.target.value)}
            className="w-full bg-medical-dark border border-medical-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading || !file}
          className={`w-full py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
            isLoading
              ? 'bg-cyan-900/40 text-cyan-300/70 cursor-not-allowed border border-cyan-700/30'
              : !file
              ? 'bg-medical-dark text-medical-muted border border-medical-border cursor-not-allowed'
              : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-600/25 active:scale-[0.99]'
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
              <span>Executing 8-Stage Evidence Chain...</span>
            </>
          ) : (
            <>
              <Search className="w-4 h-4" />
              <span>{file ? 'Run Grounded Clinical Analysis' : 'Select a Scan File First'}</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
