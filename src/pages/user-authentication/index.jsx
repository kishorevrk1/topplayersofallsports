import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthHeader from './components/AuthHeader';
import AuthBackground from './components/AuthBackground';
import AuthTabs from './components/AuthTabs';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import ForgotPasswordForm from './components/ForgotPasswordForm';

const UserAuthentication = () => {
  const [activeTab, setActiveTab] = useState('login');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Mock credentials for demonstration
  const mockCredentials = {
    admin: { email: "admin@tpas.com", password: "Admin123!" },
    user: { email: "user@tpas.com", password: "User123!" },
    demo: { email: "demo@tpas.com", password: "Demo123!" }
  };

  useEffect(() => {
    // Check if user is already authenticated
    const isAuthenticated = localStorage.getItem('isAuthenticated');
    if (isAuthenticated === 'true') {
      const from = location.state?.from?.pathname || '/home-dashboard';
      navigate(from, { replace: true });
    }
  }, [navigate, location]);

  const handleLogin = async (formData) => {
    setIsLoading(true);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Check mock credentials
      const isValidCredentials = Object.values(mockCredentials).some(
        cred => cred.email === formData.email && cred.password === formData.password
      );
      
      if (!isValidCredentials) {
        throw new Error('Invalid email or password. Try: admin@tpas.com / Admin123!');
      }
      
      // Store authentication state
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('userEmail', formData.email);
      localStorage.setItem('rememberMe', formData.rememberMe.toString());
      
      // Redirect to previous page or dashboard
      const from = location.state?.from?.pathname || '/home-dashboard';
      navigate(from, { replace: true });
      
    } catch (error) {
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (formData) => {
    setIsLoading(true);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Store authentication state
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('userEmail', formData.email);
      localStorage.setItem('userName', `${formData.firstName} ${formData.lastName}`);
      
      // Redirect to dashboard with welcome message
      navigate('/home-dashboard', { 
        replace: true,
        state: { welcomeMessage: `Welcome to TopPlayersofAllSports, ${formData.firstName}!` }
      });
      
    } catch (error) {
      alert('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (email) => {
    setIsLoading(true);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      setForgotPasswordSuccess(true);
    } catch (error) {
      alert('Failed to send reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider) => {
    setIsLoading(true);
    
    try {
      // Simulate social login delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Store authentication state
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('userEmail', `user@${provider}.com`);
      localStorage.setItem('loginProvider', provider);
      
      // Redirect to dashboard
      const from = location.state?.from?.pathname || '/home-dashboard';
      navigate(from, { replace: true });
      
    } catch (error) {
      alert(`${provider} login failed. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setShowForgotPassword(false);
    setForgotPasswordSuccess(false);
    setActiveTab('login');
  };

  const renderAuthContent = () => {
    if (showForgotPassword) {
      return (
        <ForgotPasswordForm
          onSubmit={handleForgotPassword}
          onBack={handleBackToLogin}
          isLoading={isLoading}
          isSuccess={forgotPasswordSuccess}
        />
      );
    }

    return (
      <>
        <AuthTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          isLoading={isLoading}
        />
        
        {activeTab === 'login' ? (
          <LoginForm
            onSubmit={handleLogin}
            isLoading={isLoading}
            onForgotPassword={() => setShowForgotPassword(true)}
            onSocialLogin={handleSocialLogin}
          />
        ) : (
          <RegisterForm
            onSubmit={handleRegister}
            isLoading={isLoading}
            onSocialLogin={handleSocialLogin}
          />
        )}
      </>
    );
  };

  return (
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

        {/* Auth Form Container */}
        <div className="w-full max-w-md mx-auto">
          {!showForgotPassword && (
            <div className="text-center mb-8">
              <h1 className="text-2xl lg:text-3xl font-bold text-text-primary mb-2">
                {activeTab === 'login' ? 'Welcome Back!' : 'Create Account'}
              </h1>
              <p className="text-text-secondary">
                {activeTab === 'login' ?'Sign in to access your personalized sports experience' :'Join thousands of sports fans worldwide'
                }
              </p>
            </div>
          )}

          {renderAuthContent()}

          {/* Demo Credentials Info */}
          {!showForgotPassword && activeTab === 'login' && (
            <div className="mt-8 p-4 bg-muted rounded-lg">
              <div className="text-sm text-text-secondary">
                <p className="font-medium text-text-primary mb-2">Demo Credentials:</p>
                <div className="space-y-1">
                  <p><strong>Admin:</strong> admin@tpas.com / Admin123!</p>
                  <p><strong>User:</strong> user@tpas.com / User123!</p>
                  <p><strong>Demo:</strong> demo@tpas.com / Demo123!</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-auto pt-8 text-center text-sm text-text-secondary">
          <p>&copy; {new Date().getFullYear()} TopPlayersofAllSports. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default UserAuthentication;