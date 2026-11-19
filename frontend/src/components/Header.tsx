import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { api } from '../api/client';

export const Header: React.FC = () => {
  const location = useLocation();
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;
    api.getHealth()
      .then((data) => {
        if (isMounted) setIsHealthy(data.status === 'healthy');
      })
      .catch(() => {
        if (isMounted) setIsHealthy(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <header className="bg-medical-panel border-b border-medical-border px-6 py-3 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-xl group-hover:border-cyan-400 transition-colors">
            🩺
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg text-white tracking-wide">
                MEDIVISTA<span className="text-medical-accent">.AI</span>
              </span>
              <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                Research v1.0
              </span>
            </div>
            <p className="text-[11px] text-medical-muted -mt-0.5">
              Multimodal Medical Imaging AI Copilot (BioViL-T & BiomedCLIP)
            </p>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center space-x-2">
          <Link
            to="/"
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              location.pathname === '/'
                ? 'bg-medical-border text-white'
                : 'text-medical-muted hover:text-white hover:bg-medical-border/50'
            }`}
          >
            Doctor Workstation
          </Link>
          <Link
            to="/history"
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              location.pathname === '/history'
                ? 'bg-medical-border text-white'
                : 'text-medical-muted hover:text-white hover:bg-medical-border/50'
            }`}
          >
            Case History
          </Link>
        </nav>

        {/* System Engine Status */}
        <div className="flex items-center space-x-3">
          <div className="hidden md:flex items-center space-x-2 text-xs bg-medical-dark px-3 py-1.5 rounded-full border border-medical-border">
            <span
              className={`w-2 h-2 rounded-full ${
                isHealthy === true
                  ? 'bg-emerald-400 animate-pulse'
                  : isHealthy === false
                  ? 'bg-rose-500'
                  : 'bg-amber-400'
              }`}
            />
            <span className="text-[11px] text-medical-muted">
              {isHealthy === true
                ? 'Microsoft Vision Engine Online'
                : isHealthy === false
                ? 'Backend Connecting...'
                : 'Initializing...'}
            </span>
          </div>

          <div className="text-[10px] text-amber-300/80 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded">
            ⚠️ Physician Sign-off Mandatory
          </div>
        </div>
      </div>
    </header>
  );
};
