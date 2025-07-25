import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const ForgotPasswordForm = ({ onSubmit, onBack, isLoading, isSuccess }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    setEmail(e.target.value);
    if (error) {
      setError('');
    }
  };

  const validateForm = () => {
    if (!email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(email);
    }
  };

  if (isSuccess) {
    return (
      <div className="w-full max-w-md mx-auto text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon name="Mail" size={32} className="text-success" />
          </div>
          <h3 className="text-xl font-semibold text-text-primary mb-2">
            Check Your Email
          </h3>
          <p className="text-text-secondary">
            We've sent a password reset link to <strong>{email}</strong>
          </p>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Didn't receive the email? Check your spam folder or try again.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={() => onSubmit(email)}
              disabled={isLoading}
              className="flex-1"
            >
              Resend Email
            </Button>
            
            <Button
              variant="default"
              onClick={onBack}
              className="flex-1"
            >
              Back to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Icon name="Lock" size={32} className="text-accent" />
        </div>
        <h3 className="text-xl font-semibold text-text-primary mb-2">
          Forgot Password?
        </h3>
        <p className="text-text-secondary">
          No worries! Enter your email and we'll send you a reset link.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Email Address"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={handleInputChange}
          error={error}
          required
          disabled={isLoading}
        />

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            disabled={isLoading}
            className="flex-1"
          >
            <Icon name="ArrowLeft" size={16} className="mr-2" />
            Back to Login
          </Button>
          
          <Button
            type="submit"
            variant="default"
            loading={isLoading}
            disabled={isLoading}
            className="flex-1"
          >
            Send Reset Link
          </Button>
        </div>
      </form>

      <div className="mt-6 p-4 bg-muted rounded-lg">
        <div className="flex items-start space-x-3">
          <Icon name="Info" size={16} className="text-accent mt-0.5 flex-shrink-0" />
          <div className="text-sm text-text-secondary">
            <p className="font-medium text-text-primary mb-1">Having trouble?</p>
            <p>
              If you don't receive an email within a few minutes, check your spam folder 
              or contact our support team for assistance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordForm;