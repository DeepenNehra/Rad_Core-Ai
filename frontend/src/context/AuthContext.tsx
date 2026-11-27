import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, TOKEN_STORAGE_KEY, USER_STORAGE_KEY } from '../api/client';
import { ClinicianUser } from '../types';

interface AuthContextValue {
  user: ClinicianUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  login: (username: string, password: string) => Promise<void>;
  register: (payload: {
    username: string;
    email: string;
    full_name: string;
    password: string;
    role?: string;
    department?: string;
  }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_STORAGE_KEY));
  const [user, setUser] = useState<ClinicianUser | null>(() => {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Verify existing token on mount
  useEffect(() => {
    if (!token) return;
    api
      .getMe()
      .then((profile) => {
        setUser(profile);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(profile));
      })
      .catch(() => {
        // Token expired or invalid
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        localStorage.removeItem(USER_STORAGE_KEY);
        setToken(null);
        setUser(null);
      });
  }, [token]);

  const persistSession = (newToken: string, newUser: ClinicianUser) => {
    localStorage.setItem(TOKEN_STORAGE_KEY, newToken);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const login = async (username: string, password: string) => {
    const data = await api.login(username, password);
    persistSession(data.access_token, data.user);
    setIsAuthModalOpen(false);
  };

  const register = async (payload: {
    username: string;
    email: string;
    full_name: string;
    password: string;
    role?: string;
    department?: string;
  }) => {
    const data = await api.register(payload);
    persistSession(data.access_token, data.user);
    setIsAuthModalOpen(false);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(token && user),
        isAuthModalOpen,
        openAuthModal: () => setIsAuthModalOpen(true),
        closeAuthModal: () => setIsAuthModalOpen(false),
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }
  return ctx;
};
