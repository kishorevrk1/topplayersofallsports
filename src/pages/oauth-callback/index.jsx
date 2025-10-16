import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithOAuthCode, loginWithTokens, isAuthenticated, isLoading, error } = useAuth();
  const [callbackError, setCallbackError] = useState('');
  const [isProcessing, setIsProcessing] = useState(true);
  const [hasProcessed, setHasProcessed] = useState(false); // Prevent double processing

  useEffect(() => {
    // Prevent processing if already processed or if user is already authenticated
    if (hasProcessed || isAuthenticated) {
      return;
    }

    const handleCallback = async () => {
      try {
        setIsProcessing(true);
        setHasProcessed(true); // Mark as processed immediately
        
        // Check if we have direct tokens (from backend success handler)
        const accessToken = searchParams.get('access_token');
        const refreshToken = searchParams.get('refresh_token');
        const tokenType = searchParams.get('token_type');
        const expiresIn = searchParams.get('expires_in');
        const userDataParam = searchParams.get('user');
        
        if (accessToken) {
          console.log('Processing direct token flow...');
          
          try {
            let userData = null;
            if (userDataParam) {
              try {
                userData = JSON.parse(decodeURIComponent(userDataParam));
                console.log('User data received from OAuth redirect:', userData);
              } catch (parseError) {
                console.warn('Failed to parse user data from URL, will fetch from API:', parseError);
              }
            }
            
            await loginWithTokens(accessToken, refreshToken, expiresIn, userData);
            console.log('OAuth authentication successful');
            navigate('/home-dashboard', { replace: true });
            return;
          } catch (error) {
            console.error('Failed to authenticate with tokens:', error);
            setCallbackError('Failed to complete authentication');
            setIsProcessing(false);
            return;
          }
        }

        // Fallback to traditional OAuth code flow
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');

        if (error) {
          console.error('OAuth error received:', error);
          setCallbackError(`OAuth error: ${error}`);
          setIsProcessing(false);
          setTimeout(() => navigate('/user-authentication'), 3000);
          return;
        }

        if (!code) {
          setCallbackError('No authorization code or tokens received');
          setIsProcessing(false);
          setTimeout(() => navigate('/user-authentication'), 3000);
          return;
        }

        console.log('Processing OAuth code flow...');
        // Exchange the code for tokens
        await loginWithOAuthCode(code, state);
        
      } catch (error) {
        console.error('OAuth callback error:', error);
        setCallbackError(error.message || 'OAuth login failed');
        setIsProcessing(false);
        setTimeout(() => navigate('/user-authentication'), 3000);
      }
    };

    handleCallback();
  }, [searchParams, loginWithOAuthCode, loginWithTokens, navigate, hasProcessed, isAuthenticated]);

  // Separate effect for handling authentication success
  useEffect(() => {
    if (isAuthenticated && hasProcessed && !isProcessing) {
      navigate('/home-dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate, hasProcessed, isProcessing]);

  if (callbackError || error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Failed</h2>
            <p className="text-gray-600 mb-4">{callbackError || error}</p>
            <p className="text-sm text-gray-500">Redirecting to login page...</p>
          </div>
        </div>
      </div>
    );
  }

  if (isProcessing || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Completing Authentication</h2>
            <p className="text-gray-600">Please wait while we sign you in...</p>
          </div>
        </div>
      </div>
    );
  }

  // If we get here, authentication should be complete
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Successful</h2>
          <p className="text-gray-600">Redirecting to dashboard...</p>
        </div>
      </div>
    </div>
  );
};

export default OAuthCallback;
