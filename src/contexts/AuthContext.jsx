import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore user from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('auth_user');
    if (stored) {
      try { setUser(JSON.parse(stored)); }
      catch { localStorage.removeItem('auth_user'); }
    }
    setLoading(false);
  }, []);

  const login = useCallback((authResponse) => {
    localStorage.setItem('access_token',  authResponse.accessToken);
    localStorage.setItem('refresh_token', authResponse.refreshToken);
    const userInfo = {
      id:    authResponse.userId,
      email: authResponse.email,
      name:  authResponse.name,
      role:  authResponse.role,
    };
    localStorage.setItem('auth_user', JSON.stringify(userInfo));
    setUser(userInfo);
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      await authService.logout(refreshToken);
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('auth_user');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      logout,
      isAuthenticated: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export default AuthContext;
