/**
 * Custom hook for authentication with comprehensive error handling and loading states
 * Production-ready implementation with proper TypeScript support
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const useAuthForm = () => {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitAttempts, setSubmitAttempts] = useState(0);
  
  const { login, register, loginWithGoogle, error: authError, clearError } = useAuth();

  // Clear errors when auth context error changes
  useEffect(() => {
    if (authError) {
      setErrors(prev => ({ ...prev, general: authError }));
    }
  }, [authError]);

  const validateField = useCallback((name, value) => {
    const newErrors = { ...errors };
    
    switch (name) {
      case 'email':
        if (!value) {
          newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          newErrors.email = 'Please enter a valid email address';
        } else {
          delete newErrors.email;
        }
        break;
        
      case 'password':
        if (!value) {
          newErrors.password = 'Password is required';
        } else if (value.length < 6) {
          newErrors.password = 'Password must be at least 6 characters';
        } else {
          delete newErrors.password;
        }
        break;
        
      case 'confirmPassword':
        if (!value) {
          newErrors.confirmPassword = 'Please confirm your password';
        } else if (value !== formData.password) {
          newErrors.confirmPassword = 'Passwords do not match';
        } else {
          delete newErrors.confirmPassword;
        }
        break;
        
      case 'firstName':
        if (!value) {
          newErrors.firstName = 'First name is required';
        } else if (value.length < 2) {
          newErrors.firstName = 'First name must be at least 2 characters';
        } else {
          delete newErrors.firstName;
        }
        break;
        
      case 'lastName':
        if (!value) {
          newErrors.lastName = 'Last name is required';
        } else if (value.length < 2) {
          newErrors.lastName = 'Last name must be at least 2 characters';
        } else {
          delete newErrors.lastName;
        }
        break;
        
      default:
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [errors, formData.password]);

  const handleInputChange = useCallback((name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear general error when user starts typing
    if (errors.general) {
      setErrors(prev => ({ ...prev, general: undefined }));
      clearError();
    }
    
    // Validate field on change
    if (errors[name]) {
      validateField(name, value);
    }
  }, [errors, validateField, clearError]);

  const validateForm = useCallback((requiredFields) => {
    let isValid = true;
    requiredFields.forEach(field => {
      if (!validateField(field, formData[field])) {
        isValid = false;
      }
    });
    return isValid;
  }, [formData, validateField]);

  const handleLogin = useCallback(async (loginData) => {
    setIsSubmitting(true);
    setSubmitAttempts(prev => prev + 1);
    
    try {
      await login(loginData.email, loginData.password, loginData.rememberMe);
      return { success: true };
    } catch (error) {
      setErrors(prev => ({ ...prev, general: error.message }));
      return { success: false, error: error.message };
    } finally {
      setIsSubmitting(false);
    }
  }, [login]);

  const handleRegister = useCallback(async (registerData) => {
    setIsSubmitting(true);
    setSubmitAttempts(prev => prev + 1);
    
    try {
      await register(registerData);
      return { success: true };
    } catch (error) {
      setErrors(prev => ({ ...prev, general: error.message }));
      return { success: false, error: error.message };
    } finally {
      setIsSubmitting(false);
    }
  }, [register]);

  const handleSocialLogin = useCallback(async (provider) => {
    setIsSubmitting(true);
    
    try {
      if (provider === 'google') {
        await loginWithGoogle();
        return { success: true };
      } else {
        throw new Error(`${provider} login is not supported yet`);
      }
    } catch (error) {
      setErrors(prev => ({ ...prev, general: error.message }));
      return { success: false, error: error.message };
    } finally {
      setIsSubmitting(false);
    }
  }, [loginWithGoogle]);

  const clearErrors = useCallback(() => {
    setErrors({});
    clearError();
  }, [clearError]);

  const clearForm = useCallback(() => {
    setFormData({});
    setErrors({});
    setSubmitAttempts(0);
  }, []);

  return {
    formData,
    errors,
    isSubmitting,
    submitAttempts,
    handleInputChange,
    validateField,
    validateForm,
    handleLogin,
    handleRegister,
    handleSocialLogin,
    clearErrors,
    clearForm,
  };
};
