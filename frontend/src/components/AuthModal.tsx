import React, { useState } from 'react';
import { Lock, ShieldCheck, UserPlus, LogIn, X, Sparkles, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AuthCardProps {
  embedded?: boolean;
}

export const AuthFormCard: React.FC<AuthCardProps> = ({ embedded = false }) => {
  const { login, register, closeAuthModal } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('Radiologist');
  const [department, setDepartment] = useState('Diagnostic Radiology');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fillDemoDoctor = () => {
    setMode('login');
    setUsername('dr.nehra');
    setPassword('doctor123');
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      if (mode === 'login') {
        await login(username, password);
      } else {
        await register({
          username,
          email,
          full_name: fullName,
          password,
          role,
          department,
        });
      }
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Authentication failed';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-medical-panel/95 backdrop-blur-xl border border-medical-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-950/60 via-medical-dark to-blue-950/40 px-6 py-4 border-b border-medical-border flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-lg bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center text-cyan-400">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight">
              Clinician Authentication
            </h2>
            <p className="text-[11px] text-medical-muted">
              JWT-Protected Case History & Sign-Off
            </p>
          </div>
        </div>
        {!embedded && (
          <button
            onClick={closeAuthModal}
            className="text-medical-muted hover:text-white p-1 rounded-lg hover:bg-medical-border/50 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Mode Tabs */}
      <div className="px-6 pt-5">
        <div className="grid grid-cols-2 gap-1 bg-medical-dark p-1 rounded-xl border border-medical-border text-xs">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`py-2 rounded-lg font-medium flex items-center justify-center gap-1.5 transition-all ${
              mode === 'login'
                ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
                : 'text-medical-muted hover:text-white'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={`py-2 rounded-lg font-medium flex items-center justify-center gap-1.5 transition-all ${
              mode === 'register'
                ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
                : 'text-medical-muted hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            Register Clinician
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {mode === 'login' && (
          <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/25 flex items-center justify-between gap-2">
            <div className="text-[11px] text-cyan-200/90">
              <span className="font-semibold block text-cyan-300">Demo Clinician Account</span>
              <span className="font-mono text-[10px] text-medical-muted">
                dr.nehra / doctor123
              </span>
            </div>
            <button
              type="button"
              onClick={fillDemoDoctor}
              className="px-2.5 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-300 text-[11px] font-semibold flex items-center gap-1 transition-colors"
            >
              <Sparkles className="w-3 h-3" />
              Auto-Fill
            </button>
          </div>
        )}

        {mode === 'register' && (
          <>
            <div>
              <label className="block text-xs font-medium text-medical-text mb-1">
                Full Name & Credentials
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Dr. A. Sharma, MD"
                className="w-full bg-medical-dark border border-medical-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-medical-text mb-1">
                Institutional Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="clinician@hospital.org"
                className="w-full bg-medical-dark border border-medical-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-medical-text mb-1">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-medical-dark border border-medical-border rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="Radiologist">Radiologist</option>
                  <option value="Attending Physician">Attending Physician</option>
                  <option value="Resident">Resident</option>
                  <option value="Clinical Researcher">Clinical Researcher</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-medical-text mb-1">Department</label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full bg-medical-dark border border-medical-border rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>
          </>
        )}

        <div>
          <label className="block text-xs font-medium text-medical-text mb-1">
            {mode === 'login' ? 'Username or Email' : 'Username'}
          </label>
          <input
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder={mode === 'login' ? 'dr.nehra' : 'choose_username'}
            className="w-full bg-medical-dark border border-medical-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400 font-mono"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-medical-text mb-1">
            Password
          </label>
          <input
            type="password"
            required
            minLength={4}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full bg-medical-dark border border-medical-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-sm shadow-lg shadow-cyan-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>
            {isSubmitting
              ? 'Verifying Credentials...'
              : mode === 'login'
              ? 'Authenticate & Unlock Archive'
              : 'Create Clinician Account'}
          </span>
        </button>

        <p className="text-[10px] text-center text-medical-muted pt-1">
          Protected via HS256 JSON Web Tokens &amp; bcrypt salted password hashing.
        </p>
      </form>
    </div>
  );
};

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal } = useAuth();
  if (!isAuthModalOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={closeAuthModal}
    >
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md">
        <AuthFormCard />
      </div>
    </div>
  );
};
