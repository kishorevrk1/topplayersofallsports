import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

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
    await authService.logout();
    setUser(null);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      const storedUser  = localStorage.getItem('auth_user');
      const accessToken = localStorage.getItem('access_token');

      if (!storedUser || !accessToken) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        await authService.getMe();
        if (isMounted) setUser(JSON.parse(storedUser));
      } catch {
        try {
          const refreshed = await authService.refreshAccessToken();
          if (isMounted) setUser({
            id:    refreshed.userId,
            email: refreshed.email,
            name:  refreshed.name,
            role:  refreshed.role,
          });
        } catch {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('auth_user');
          if (isMounted) setUser(null);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    restoreSession();

    return () => { isMounted = false; };
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
