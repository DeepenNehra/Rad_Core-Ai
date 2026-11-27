import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Stethoscope,
  Activity,
  History,
  Lock,
  Unlock,
  LogIn,
  LogOut,
  ShieldAlert,
  UserCheck,
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export const Header: React.FC = () => {
  const location = useLocation();
  const { user, isAuthenticated, openAuthModal, logout } = useAuth();
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null);
  const [dbType, setDbType] = useState<string>('sqlite');

  useEffect(() => {
    let isMounted = true;
    api
      .getHealth()
      .then((data) => {
        if (isMounted) {
          setIsHealthy(data.status === 'healthy');
          if (data.database_backend) setDbType(data.database_backend);
        }
      })
      .catch(() => {
        if (isMounted) setIsHealthy(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <header className="bg-medical-panel/90 backdrop-blur-md border-b border-medical-border/80 px-4 sm:px-6 py-3 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Brand */}
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-400/30 flex items-center justify-center text-cyan-400 group-hover:border-cyan-400 group-hover:shadow-lg group-hover:shadow-cyan-500/20 transition-all">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg text-white tracking-tight">
                MEDIVISTA<span className="text-medical-accent">.AI</span>
              </span>
              <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/25">
                v1.1 Clinical
              </span>
            </div>
            <p className="text-[11px] text-medical-muted -mt-0.5 hidden sm:block">
              Multimodal Medical Imaging Copilot • BioViL-T &amp; BiomedCLIP
            </p>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center space-x-1.5 bg-medical-dark/80 p-1 rounded-xl border border-medical-border">
          <Link
            to="/"
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
              location.pathname === '/'
                ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-white border border-cyan-500/30 shadow-sm'
                : 'text-medical-muted hover:text-white hover:bg-medical-border/40'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>Workstation</span>
          </Link>
          <Link
            to="/history"
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
              location.pathname === '/history'
                ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-white border border-cyan-500/30 shadow-sm'
                : 'text-medical-muted hover:text-white hover:bg-medical-border/40'
            }`}
          >
            <History className="w-3.5 h-3.5 text-cyan-400" />
            <span>Case History</span>
            {isAuthenticated ? (
              <Unlock className="w-3 h-3 text-emerald-400" />
            ) : (
              <Lock className="w-3 h-3 text-amber-400" />
            )}
          </Link>
        </nav>

        {/* Engine Status & Clinician Session */}
        <div className="flex items-center space-x-2.5">
          <div className="hidden lg:flex items-center space-x-2 text-xs bg-medical-dark px-3 py-1.5 rounded-full border border-medical-border">
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
                ? `Engine Online (${dbType.toUpperCase()})`
                : isHealthy === false
                ? 'Backend Offline'
                : 'Connecting...'}
            </span>
          </div>

          <div className="hidden xl:flex items-center gap-1.5 text-[10px] text-amber-300/90 bg-amber-500/10 border border-amber-500/25 px-2.5 py-1.5 rounded-lg">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span>MD Sign-Off Required</span>
          </div>

          {isAuthenticated && user ? (
            <div className="flex items-center space-x-2 bg-medical-dark border border-emerald-500/30 rounded-xl pl-3 pr-1.5 py-1">
              <div className="flex items-center gap-1.5 text-xs">
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-white font-medium text-[11px] max-w-[130px] truncate">
                  {user.full_name}
                </span>
              </div>
              <button
                onClick={logout}
                className="p-1.5 rounded-lg text-medical-muted hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={openAuthModal}
              className="px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/35 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Clinician Login</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
