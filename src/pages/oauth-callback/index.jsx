import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import authService from '../../services/authService';

export default function OAuthCallback() {
  const navigate  = useNavigate();
  const { login } = useAuth();
  const ran       = useRef(false);

  useEffect(() => {
    // Prevent double-execution in React StrictMode
    if (ran.current) return;
    ran.current = true;

    const params      = new URLSearchParams(window.location.search);
    const code        = params.get('code');
    const redirectUri = `${window.location.origin}/oauth/callback`;

    if (!code) {
      console.error('No auth code in callback URL');
      navigate('/user-authentication?error=no_code');
      return;
    }

    authService.loginWithGoogle(code, redirectUri)
      .then(authResponse => {
        login(authResponse);
        navigate('/');
      })
      .catch(err => {
        console.error('Auth failed:', err);
        navigate('/user-authentication?error=auth_failed');
      });
  }, [login, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-text-secondary">Signing you in...</p>
      </div>
    </div>
  );
}
