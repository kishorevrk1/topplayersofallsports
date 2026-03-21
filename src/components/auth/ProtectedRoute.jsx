import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Wraps routes that require authentication.
 * - Shows a spinner while auth state is loading from localStorage / /me check.
 * - Redirects unauthenticated users to /user-authentication?from=<current-path>
 *   so they land back on the intended page after signing in.
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to={`/user-authentication?from=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
  }

  return children;
}
