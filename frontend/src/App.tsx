import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import { HomePage } from './pages/HomePage';
import { HistoryPage } from './pages/HistoryPage';
import { AuthProvider } from './context/AuthContext';
import { AuthModal } from './components/AuthModal';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-medical-dark bg-medical-grid text-medical-text flex flex-col font-sans">
        <Header />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="*" element={<HomePage />} />
          </Routes>
        </main>
        <AuthModal />
        <footer className="border-t border-medical-border/80 py-4 px-6 text-center text-xs text-medical-muted bg-medical-panel/90">
          <p>
            MEDIVISTA AI — Multimodal Medical Imaging Copilot • Academic &amp; Educational Research
            Prototype
          </p>
          <p className="text-[11px] text-amber-400/75 mt-0.5">
            Mandatory clinical disclaimer: Not an autonomous diagnostic device. All AI findings must
            be verified by a licensed clinician.
          </p>
        </footer>
      </div>
    </AuthProvider>
  );
};

export default App;
