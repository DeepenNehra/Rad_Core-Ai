import React, { useState, useRef } from 'react';

interface UploadPanelProps {
  onAnalyze: (formData: FormData) => void;
  isLoading: boolean;
}

export const UploadPanel: React.FC<UploadPanelProps> = ({ onAnalyze, isLoading }) => {
  const [file, setFile] = useState<File | null>(null);
  const [modality, setModality] = useState<string>('X-Ray');
  const [patientId, setPatientId] = useState<string>('PT-2026-8914');
  const [age, setAge] = useState<string>('54');
  const [gender, setGender] = useState<string>('Male');
  const [symptoms, setSymptoms] = useState<string>(
    'Persistent productive cough x 5 days, pleuritic right-sided chest pain, fever 38.6°C'
  );
  const [clinicalHistory, setClinicalHistory] = useState<string>(
    'Type 2 Diabetes Mellitus, 10 pack-year tobacco use history, no prior thoracic surgeries'
  );
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

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
    if (!file) {
      alert('Please select or drop a medical scan file (DICOM, PNG, JPG).');
      return;
    }

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
    <div className="bg-medical-panel rounded-xl border border-medical-border p-6 shadow-xl">
      <div className="flex items-center justify-between pb-4 border-b border-medical-border mb-5">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <span>📥</span> Study Ingestion & Acquisition
          </h2>
          <p className="text-xs text-medical-muted">
            Upload DICOM or raster scan with clinical metadata
          </p>
        </div>
        <span className="text-xs px-2 py-0.5 rounded bg-medical-dark border border-medical-border text-cyan-400 font-mono">
          Stage 1 / 8
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Drag & Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${
            isDragOver
              ? 'border-cyan-400 bg-cyan-950/20'
              : file
              ? 'border-emerald-500/50 bg-emerald-950/10'
              : 'border-medical-border hover:border-cyan-500/50 bg-medical-dark/50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".dcm,.dicom,.png,.jpg,.jpeg"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="flex flex-col items-center">
            <span className="text-3xl mb-2">
              {file ? '✅' : '🩻'}
            </span>
            {file ? (
              <div className="space-y-1">
                <p className="text-sm font-medium text-emerald-400 break-all">
                  {file.name}
                </p>
                <p className="text-xs text-medical-muted">
                  {(file.size / 1024).toFixed(1)} KB • Ready for Multimodal Inference
                </p>
              </div>
            ) : (
              <div>
                <p className="text-sm font-medium text-medical-text">
                  Drop medical scan here or <span className="text-cyan-400 underline">browse</span>
                </p>
                <p className="text-xs text-medical-muted mt-1">
                  Supports DICOM (.dcm), PNG, JPG, JPEG (Grayscale/Color)
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Modality & Demographics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-medical-text mb-1">
              Imaging Modality
            </label>
            <select
              value={modality}
              onChange={(e) => setModality(e.target.value)}
              className="w-full bg-medical-dark border border-medical-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
            >
              <option value="X-Ray">X-Ray (Chest) — Microsoft BioViL-T</option>
              <option value="CT">CT Scan (Axial) — Microsoft BiomedCLIP</option>
              <option value="MRI">MRI Scan (Multi-sequence) — BiomedCLIP</option>
              <option value="Ultrasound">Ultrasound (B-Mode) — BiomedCLIP</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-medical-text mb-1">
              Patient Identifier (Anonymized)
            </label>
            <input
              type="text"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              placeholder="e.g. PT-2026-001"
              className="w-full bg-medical-dark border border-medical-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-medical-text mb-1">
              Patient Age (Years)
            </label>
            <input
              type="number"
              min="0"
              max="125"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="e.g. 54"
              className="w-full bg-medical-dark border border-medical-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-medical-text mb-1">
              Biological Sex
            </label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full bg-medical-dark border border-medical-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other / Intersex</option>
              <option value="Unknown">Unknown</option>
            </select>
          </div>
        </div>

        {/* Symptoms */}
        <div>
          <label className="block text-xs font-medium text-medical-text mb-1">
            Presenting Clinical Symptoms
          </label>
          <textarea
            rows={2}
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            placeholder="e.g. Fever, acute shortness of breath, left sided hemiparesis..."
            className="w-full bg-medical-dark border border-medical-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
          />
        </div>

        {/* History */}
        <div>
          <label className="block text-xs font-medium text-medical-text mb-1">
            Prior Clinical History & Risk Factors
          </label>
          <textarea
            rows={2}
            value={clinicalHistory}
            onChange={(e) => setClinicalHistory(e.target.value)}
            placeholder="e.g. HTN, prior malignancy, immunosuppression, surgery history..."
            className="w-full bg-medical-dark border border-medical-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
          />
        </div>

        {/* Submit Action */}
        <button
          type="submit"
          disabled={isLoading || !file}
          className={`w-full py-3 px-4 rounded-lg font-semibold text-sm flex items-center justify-center space-x-2 transition-all ${
            isLoading
              ? 'bg-cyan-900/50 text-cyan-300/60 cursor-not-allowed border border-cyan-700/30'
              : !file
              ? 'bg-medical-dark text-medical-muted border border-medical-border cursor-not-allowed'
              : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-600/20 active:scale-[0.99]'
          }`}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-4 w-4 mr-2 text-cyan-400" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Executing 8-Stage Evidence Chain...</span>
            </>
          ) : (
            <>
              <span>🔍 Run Grounded Clinical Analysis</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
