import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import { HomePage } from './pages/HomePage';
import { HistoryPage } from './pages/HistoryPage';

export const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-medical-dark text-medical-text flex flex-col font-sans">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </main>
      <footer className="border-t border-medical-border py-4 px-6 text-center text-xs text-medical-muted bg-medical-panel">
        <p>
          MEDIVISTA AI — Multimodal Medical Imaging Copilot • Academic & Educational Research Prototype
        </p>
        <p className="text-[11px] text-amber-400/70 mt-0.5">
          Mandatory clinical disclaimer: Not an autonomous diagnostic device. All AI findings must be verified by a licensed clinician.
        </p>
      </footer>
    </div>
  );
};

export default App;
