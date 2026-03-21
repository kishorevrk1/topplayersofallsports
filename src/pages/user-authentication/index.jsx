import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import AuthHeader from './components/AuthHeader';
import AuthBackground from './components/AuthBackground';
import AuthErrorBoundary from '../../components/AuthErrorBoundary';
import SocialLogins from './components/SocialLogins';
import { useAuth } from '../../contexts/AuthContext';

const ERROR_MESSAGES = {
  no_code:     'Sign-in was cancelled. Please try again.',
  auth_failed: 'Sign-in failed. Please try again.',
};

const UserAuthentication = () => {
  const { isAuthenticated } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const errorKey = searchParams.get('error');
  const from = searchParams.get('from') || '/';

  React.useEffect(() => {
    if (isAuthenticated) navigate(from, { replace: true });
  }, [isAuthenticated, from, navigate]);

  return (
    <AuthErrorBoundary>
      <div className="min-h-screen bg-background flex flex-col lg:flex-row">
        <div className="lg:hidden">
          <AuthHeader showBackButton={false} />
        </div>

        <AuthBackground />

        <div className="flex-1 flex flex-col justify-center px-4 py-8 lg:px-12 lg:py-16">
          <div className="hidden lg:block mb-8">
            <AuthHeader showBackButton={false} />
          </div>

          <div className="w-full max-w-md mx-auto">
            <h2 className="text-2xl font-bold text-text-primary mb-2">
              Welcome to TopPlayers
            </h2>
            <p className="text-text-secondary mb-8">
              Sign in to track your favourite athletes and access personalised rankings.
            </p>

            {errorKey && (
              <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                {ERROR_MESSAGES[errorKey] ?? 'Something went wrong. Please try again.'}
              </div>
            )}

            <SocialLogins />
          </div>

          <div className="mt-auto pt-8 text-center text-sm text-text-secondary">
            <p>&copy; {new Date().getFullYear()} TopPlayersofAllSports. All rights reserved.</p>
          </div>
        </div>
      </div>
    </AuthErrorBoundary>
  );
};

export default UserAuthentication;
