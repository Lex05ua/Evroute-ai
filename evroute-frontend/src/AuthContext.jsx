import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser, isAuthenticated, logout as apiLogout } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getCurrentUser());
  const [authed, setAuthed] = useState(isAuthenticated());

  function refreshUser() {
    const u = getCurrentUser();
    setUser(u);
    setAuthed(!!u);
  }

  function logout() {
    apiLogout();
    setUser(null);
    setAuthed(false);
  }

  useEffect(() => {
    const handler = () => refreshUser();
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  return (
    <AuthContext.Provider value={{ user, authed, refreshUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
