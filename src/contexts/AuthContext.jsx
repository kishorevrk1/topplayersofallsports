/**
 * Authentication Context
 * Provides authentication state and methods throughout the app
 */

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import authService from '../services/authService';
import userProfileService from '../services/userProfileService';

// Initial state
const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// Action types
const AUTH_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGOUT: 'LOGOUT',
  UPDATE_USER: 'UPDATE_USER',
  CLEAR_ERROR: 'CLEAR_ERROR',
};

// Reducer
function authReducer(state, action) {
  switch (action.type) {
    case AUTH_ACTIONS.SET_LOADING:
      return { ...state, isLoading: action.payload };
    
    case AUTH_ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, isLoading: false };
    
    case AUTH_ACTIONS.LOGIN_SUCCESS:
      // Set token in userProfileService when login succeeds
      if (action.payload.token) {
        userProfileService.setAuthToken(action.payload.token);
      }
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    
    case AUTH_ACTIONS.LOGOUT:
      // Clear token from userProfileService when logging out
      userProfileService.setAuthToken(null);
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    
    case AUTH_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      };
    
    case AUTH_ACTIONS.CLEAR_ERROR:
      return { ...state, error: null };
    
    default:
      return state;
  }
}

// Create context
const AuthContext = createContext();

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth Provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize auth state on app load
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (authService.isAuthenticated()) {
          // Set token in userProfileService
          userProfileService.setAuthToken(authService.token);
          
          // Get user from local storage first to avoid API call
          const storedUser = authService.getStoredUser();
          if (storedUser) {
            dispatch({
              type: AUTH_ACTIONS.LOGIN_SUCCESS,
              payload: { user: storedUser, token: authService.token },
            });
            dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
            
            // Optionally validate token in background (no blocking)
            authService.getCurrentUser().catch(error => {
              console.warn('Background token validation failed:', error);
              // Only clear auth if it's a 401 error (invalid token)
              if (error.message.includes('401') || error.message.includes('Session expired')) {
                authService.clearAuthData();
                dispatch({ type: AUTH_ACTIONS.LOGOUT });
              }
            });
          } else {
            // No stored user, need to fetch from server
            const user = await authService.getCurrentUser();
            dispatch({
              type: AUTH_ACTIONS.LOGIN_SUCCESS,
              payload: { user, token: authService.token },
            });
          }
        } else {
          dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
        // Clear invalid auth data
        authService.clearAuthData();
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      }
    };

    initializeAuth();
  }, []);

  // Auth methods
  const login = useCallback(async (email, password, rememberMe = false) => {
    dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
    
    try {
      const result = await authService.login(email, password, rememberMe);
      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: result,
      });
      return result;
    } catch (error) {
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: error.message });
      throw error;
    }
  }, []);

  const register = useCallback(async (userData) => {
    dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
    
    try {
      const result = await authService.register(userData);
      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: result,
      });
      return result;
    } catch (error) {
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: error.message });
      throw error;
    }
  }, []);

  const loginWithGoogle = async () => {
    dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
    
    try {
      const result = await authService.initiateGoogleLogin();
      // Note: Actual login success will be handled after redirect
      return result;
    } catch (error) {
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: error.message });
      throw error;
    }
  };

  const loginWithOAuthCode = async (code, state) => {
    dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
    
    try {
      const result = await authService.handleOAuthCallback(code, state);
      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: result,
      });
      return result;
    } catch (error) {
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: error.message });
      throw error;
    }
  };

  const logout = async () => {
    dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
    
    try {
      await authService.logout();
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    } catch (error) {
      console.error('Logout failed:', error);
      // Force logout even if API call fails
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  };

  const forgotPassword = async (email) => {
    dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
    
    try {
      const result = await authService.forgotPassword(email);
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      return result;
    } catch (error) {
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: error.message });
      throw error;
    }
  };

  const updateProfile = async (updates) => {
    dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
    
    try {
      const updatedUser = await authService.updateProfile(updates);
      dispatch({ type: AUTH_ACTIONS.UPDATE_USER, payload: updatedUser });
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      return updatedUser;
    } catch (error) {
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: error.message });
      throw error;
    }
  };

  const updateUser = async (userData) => {
    try {
      // Update the user data in the context
      dispatch({ type: AUTH_ACTIONS.UPDATE_USER, payload: userData });
      return userData;
    } catch (error) {
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: error.message });
      throw error;
    }
  };

  const loginWithTokens = async (accessToken, refreshToken, expiresIn, userData = null) => {
    dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
    
    try {
      let user = userData;
      
      if (userData) {
        // We have user data from OAuth redirect, use it directly
        authService.setAuthData(accessToken, userData, true, refreshToken);
        console.log('Using user data from OAuth redirect');
      } else {
        // Fallback: set token first, then fetch user data
        authService.setAuthData(accessToken, null, true, refreshToken);
        console.log('Fetching user data from API');
        user = await authService.getCurrentUser();
      }
      
      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: { 
          user, 
          token: accessToken,
          refreshToken: refreshToken,
          expiresIn: expiresIn 
        },
      });
      
      return { success: true, user, token: accessToken };
    } catch (error) {
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: error.message });
      throw error;
    }
  };

  const clearError = useCallback(() => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  }, []);

  const refreshToken = async () => {
    try {
      const result = await authService.refreshToken();
      return result;
    } catch (error) {
      // Token refresh failed, logout user
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
      throw error;
    }
  };

  // Context value
  const value = {
    // State
    user: state.user,
    token: state.token,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,
    
    // Methods
    login,
    register,
    loginWithGoogle,
    loginWithOAuthCode,
    loginWithTokens,
    logout,
    forgotPassword,
    updateProfile,
    updateUser,
    clearError,
    refreshToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
