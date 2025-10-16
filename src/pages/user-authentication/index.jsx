import React from 'react';
import { Outlet } from 'react-router-dom';
import AuthHeader from './components/AuthHeader';
import AuthBackground from './components/AuthBackground';
import AuthErrorBoundary from '../../components/AuthErrorBoundary';

/**
 * This component now serves as the main layout for all authentication pages.
 * The actual forms (Login, Register, etc.) will be rendered via the <Outlet />
 * based on the nested route.
 */
const UserAuthentication = () => {
  return (
    <AuthErrorBoundary>
      <div className="min-h-screen bg-background flex flex-col lg:flex-row">
        {/* Mobile Header */}
        <div className="lg:hidden">
          <AuthHeader showBackButton={true} />
        </div>

        {/* Desktop Background */}
        <AuthBackground />

        {/* Auth Form Section */}
        <div className="flex-1 flex flex-col justify-center px-4 py-8 lg:px-12 lg:py-16">
          {/* Desktop Header */}
          <div className="hidden lg:block mb-8">
            <AuthHeader showBackButton={true} />
          </div>

          {/* Outlet for nested routes (renders LoginPage, RegisterPage, etc.) */}
          <div className="w-full max-w-md mx-auto">
            <Outlet />
          </div>

          {/* Footer */}
          <div className="mt-auto pt-8 text-center text-sm text-text-secondary">
            <p>&copy; {new Date().getFullYear()} TopPlayersofAllSports. All rights reserved.</p>
          </div>
        </div>
      </div>
    </AuthErrorBoundary>
  );
};

export default UserAuthentication;