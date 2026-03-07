/**
 * Custom hook for authentication form state management.
 * Google sign-in is handled via OAuth redirect in SocialLogins component.
 */

import { useState, useCallback } from 'react';

export const useAuthForm = () => {
  const [formData, setFormData]           = useState({});
  const [errors, setErrors]               = useState({});
  const [isSubmitting, setIsSubmitting]   = useState(false);
  const [submitAttempts, setSubmitAttempts] = useState(0);

  const validateField = useCallback((name, value, currentFormData = {}) => {
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

      case 'confirmPassword': {
        const pwd = currentFormData.password || formData.password;
        if (!value) {
          newErrors.confirmPassword = 'Please confirm your password';
        } else if (value !== pwd) {
          newErrors.confirmPassword = 'Passwords do not match';
        } else {
          delete newErrors.confirmPassword;
        }
        break;
      }

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
    if (errors[name]) {
      validateField(name, value);
    }
  }, [errors, validateField]);

  const validateForm = useCallback((requiredFields) => {
    let isValid = true;
    requiredFields.forEach(field => {
      if (!validateField(field, formData[field], formData)) {
        isValid = false;
      }
    });
    return isValid;
  }, [formData, validateField]);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const clearForm = useCallback(() => {
    setFormData({});
    setErrors({});
    setSubmitAttempts(0);
  }, []);

  return {
    formData,
    errors,
    isSubmitting,
    setIsSubmitting,
    submitAttempts,
    setSubmitAttempts,
    handleInputChange,
    validateField,
    validateForm,
    clearErrors,
    clearForm,
  };
};
