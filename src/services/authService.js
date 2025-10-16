/**
 * Authentication Service
 * Handles all authentication-related API calls including normal login/register and Google OAuth
 * Production-ready implementation with proper error handling and security
 */

// Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
const TOKEN_REFRESH_THRESHOLD = import.meta.env.VITE_TOKEN_REFRESH_THRESHOLD || 5 * 60 * 1000; // 5 minutes before expiry
const DEBUG_LOGGING = import.meta.env.VITE_ENABLE_DEBUG_LOGGING === 'true';

class AuthService {
  constructor() {
    this.token = this.getStoredToken();
    this.user = this.getStoredUser();
    this.refreshTimer = null;
    this.pendingRequests = new Map(); // For request deduplication
    this.setupTokenRefreshTimer();
  }

  // ===== TOKEN MANAGEMENT =====
  
  getStoredToken() {
    return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  }

  getStoredUser() {
    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  setAuthData(token, user, rememberMe = false, refreshToken = null) {
    this.token = token;
    this.user = user;
    
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem('authToken', token);
    storage.setItem('user', JSON.stringify(user));
    storage.setItem('isAuthenticated', 'true');
    storage.setItem('userLastUpdated', Date.now().toString()); // Track when user data was last updated
    
    // Store refresh token if provided
    if (refreshToken) {
      storage.setItem('refreshToken', refreshToken);
    }
    
    // Setup automatic token refresh
    this.setupTokenRefreshTimer();
  }

  clearAuthData() {
    this.token = null;
    this.user = null;
    
    // Clear refresh timer
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
    
    // Clear pending requests
    this.pendingRequests.clear();
    
    // Clear from both storages
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userLastUpdated');
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('refreshToken');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('isAuthenticated');
    sessionStorage.removeItem('userLastUpdated');
  }

  isAuthenticated() {
    if (!this.token || !this.user) return false;
    
    // Check if token is expired (with 30 second buffer to avoid edge cases)
    const tokenExp = this.getTokenExpiration();
    if (tokenExp && tokenExp <= (Date.now() + 30000)) {
      this.clearAuthData();
      return false;
    }
    
    return true;
  }

  // Check if user data is fresh enough to avoid API calls
  isUserDataFresh() {
    const userData = this.getStoredUser();
    if (!userData) return false;
    
    // Check if user data was updated recently (within last 5 minutes)
    const lastUpdated = localStorage.getItem('userLastUpdated') || sessionStorage.getItem('userLastUpdated');
    if (!lastUpdated) return false;
    
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    return parseInt(lastUpdated) > fiveMinutesAgo;
  }

  // Parse JWT token to get expiration
  getTokenExpiration() {
    if (!this.token) return null;
    
    try {
      const payload = JSON.parse(atob(this.token.split('.')[1]));
      return payload.exp ? payload.exp * 1000 : null; // Convert to milliseconds
    } catch (error) {
      console.error('Failed to parse token:', error);
      return null;
    }
  }

  // Setup automatic token refresh
  setupTokenRefreshTimer() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    if (!this.token) return;

    const tokenExp = this.getTokenExpiration();
    if (!tokenExp) return;

    const timeUntilRefresh = tokenExp - Date.now() - TOKEN_REFRESH_THRESHOLD;
    
    if (timeUntilRefresh > 0) {
      this.refreshTimer = setTimeout(() => {
        this.refreshToken().catch(error => {
          console.error('Auto token refresh failed:', error);
          this.clearAuthData();
        });
      }, timeUntilRefresh);
    }
  }

  // ===== API HELPERS =====

  debugLog(message, data = null) {
    if (DEBUG_LOGGING) {
      console.log(`[AuthService] ${message}`, data || '');
    }
  }

  // Rate limiting for API calls
  rateLimitCheck(endpoint) {
    const now = Date.now();
    const rateLimitKey = `rateLimit_${endpoint}`;
    const lastCall = this[rateLimitKey] || 0;
    const minInterval = 1000; // 1 second minimum between same endpoint calls
    
    if (now - lastCall < minInterval) {
      console.warn(`[AuthService] Rate limiting ${endpoint} - too many calls`);
      return false;
    }
    
    this[rateLimitKey] = now;
    return true;
  }

  async makeRequest(endpoint, options = {}, retryCount = 0) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add auth token if available
    if (this.token) {
      config.headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, config);
      
      // Handle 401 Unauthorized - attempt token refresh
      if (response.status === 401 && this.token && retryCount === 0) {
        try {
          await this.refreshToken();
          // Retry the request with new token
          return this.makeRequest(endpoint, options, 1);
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          this.clearAuthData();
          throw new Error('Session expired. Please login again.');
        }
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: `HTTP error! status: ${response.status}`
        }));
        
        // Handle specific error cases
        if (response.status === 403) {
          throw new Error(errorData.message || 'Access forbidden. Please check your permissions.');
        }
        if (response.status >= 500) {
          throw new Error('Server error. Please try again later.');
        }
        
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      
      return await response.text();
    } catch (error) {
      // Handle network errors
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error. Please check your internet connection.');
      }
      
      console.error('API Request failed:', error);
      throw error;
    }
  }

  // ===== AUTHENTICATION METHODS =====

  /**
   * Login with email and password
   */
  async login(email, password, rememberMe = false) {
    this.debugLog('Attempting login', { email, rememberMe });
    
    try {
      const response = await this.makeRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      // Handle both token formats (accessToken from backend or token)
      const token = response.accessToken || response.token;
      
      if (token && response.user) {
        this.debugLog('Login successful', { userId: response.user.id });
        this.setAuthData(token, response.user, rememberMe, response.refreshToken);
        return { 
          success: true, 
          user: response.user, 
          token: token,
          refreshToken: response.refreshToken,
          expiresIn: response.expiresIn
        };
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      this.debugLog('Login failed', error.message);
      console.error('Login failed:', error);
      throw new Error(error.message || 'Login failed. Please check your credentials.');
    }
  }

  /**
   * Register new user
   */
  async register(userData) {
    this.debugLog('Attempting registration', { email: userData.email });
    
    try {
      const response = await this.makeRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });

      // Handle both token formats (accessToken from backend or token)
      const token = response.accessToken || response.token;
      
      if (token && response.user) {
        this.debugLog('Registration successful', { userId: response.user.id });
        this.setAuthData(token, response.user, false, response.refreshToken);
        return { 
          success: true, 
          user: response.user, 
          token: token,
          refreshToken: response.refreshToken,
          expiresIn: response.expiresIn
        };
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      this.debugLog('Registration failed', error.message);
      console.error('Registration failed:', error);
      throw new Error(error.message || 'Registration failed. Please try again.');
    }
  }

  /**
   * Initiate Google OAuth login
   */
  async initiateGoogleLogin() {
    try {
      // Directly redirect to Spring Security OAuth2 endpoint
      // Note: OAuth2 endpoints are not under /api path
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
      const authUrl = `${baseUrl.replace('/api', '')}/oauth2/authorization/google`;
      window.location.href = authUrl;
      return { success: true };
    } catch (error) {
      console.error('Google OAuth initiation failed:', error);
      throw new Error(error.message || 'Failed to start Google authentication');
    }
  }

  /**
   * Handle OAuth callback (if using popup or custom handling)
   */
  async handleOAuthCallback(code, state) {
    this.debugLog('Handling OAuth callback', { code: code?.substring(0, 10) + '...', state });
    
    try {
      const response = await this.makeRequest('/auth/oauth2/callback', {
        method: 'POST',
        body: JSON.stringify({ code, state }),
      });

      // Handle both token formats (accessToken from backend or token)
      const token = response.accessToken || response.token;
      
      if (token && response.user) {
        this.debugLog('OAuth callback successful', { userId: response.user.id });
        this.setAuthData(token, response.user, true, response.refreshToken);
        return { 
          success: true, 
          user: response.user, 
          token: token,
          refreshToken: response.refreshToken,
          expiresIn: response.expiresIn
        };
      } else {
        throw new Error('OAuth authentication failed');
      }
    } catch (error) {
      this.debugLog('OAuth callback failed', error.message);
      console.error('OAuth callback failed:', error);
      throw new Error(error.message || 'OAuth authentication failed');
    }
  }

  /**
   * Forgot password
   */
  async forgotPassword(email) {
    try {
      await this.makeRequest('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      return { success: true };
    } catch (error) {
      console.error('Forgot password failed:', error);
      throw new Error(error.message || 'Failed to send reset email');
    }
  }

  /**
   * Reset password
   */
  async resetPassword(token, newPassword) {
    try {
      await this.makeRequest('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, newPassword }),
      });
      return { success: true };
    } catch (error) {
      console.error('Password reset failed:', error);
      throw new Error(error.message || 'Failed to reset password');
    }
  }

  /**
   * Logout
   */
  async logout() {
    try {
      if (this.token) {
        await this.makeRequest('/auth/logout', {
          method: 'POST',
        });
      }
    } catch (error) {
      console.error('Logout API call failed:', error);
      // Continue with local logout even if API fails
    } finally {
      this.clearAuthData();
    }
  }

  /**
   * Refresh token
   */
  async refreshToken() {
    try {
      const response = await this.makeRequest('/auth/refresh', {
        method: 'POST',
      });

      if (response.token) {
        const storage = localStorage.getItem('authToken') ? localStorage : sessionStorage;
        storage.setItem('authToken', response.token);
        this.token = response.token;
        return { success: true, token: response.token };
      } else {
        throw new Error('Token refresh failed');
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.clearAuthData();
      throw error;
    }
  }

  /**
   * Get current user profile with request deduplication and caching
   */
  async getCurrentUser(forceRefresh = false) {
    // If user data is fresh and we're not forcing refresh, return cached data
    if (!forceRefresh && this.isUserDataFresh() && this.user) {
      this.debugLog('Using cached user data (fresh within 5 minutes)');
      return this.user;
    }

    // Rate limiting check
    if (!this.rateLimitCheck('/auth/me')) {
      console.warn('getCurrentUser call blocked by rate limiting');
      return this.user || null;
    }

    // Check if there's already a pending request for current user
    const cacheKey = 'getCurrentUser';
    if (this.pendingRequests.has(cacheKey)) {
      this.debugLog('Using pending getCurrentUser request');
      return this.pendingRequests.get(cacheKey);
    }

    try {
      this.debugLog('Making fresh API call to /auth/me');
      
      // Create the request promise and cache it
      const requestPromise = this.makeRequest('/auth/me').then(response => {
        this.user = response;
        
        const storage = localStorage.getItem('user') ? localStorage : sessionStorage;
        storage.setItem('user', JSON.stringify(response));
        storage.setItem('userLastUpdated', Date.now().toString());
        
        // Clear the pending request
        this.pendingRequests.delete(cacheKey);
        
        this.debugLog('Successfully fetched and cached user data');
        return response;
      }).catch(error => {
        // Clear the pending request on error
        this.pendingRequests.delete(cacheKey);
        this.debugLog('Failed to fetch user data', error.message);
        throw error;
      });

      // Cache the promise
      this.pendingRequests.set(cacheKey, requestPromise);
      
      return await requestPromise;
    } catch (error) {
      console.error('Failed to get current user:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(updates) {
    try {
      const response = await this.makeRequest('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(updates),
      });

      this.user = { ...this.user, ...response };
      const storage = localStorage.getItem('user') ? localStorage : sessionStorage;
      storage.setItem('user', JSON.stringify(this.user));
      
      return this.user;
    } catch (error) {
      console.error('Profile update failed:', error);
      throw error;
    }
  }
}

// Create singleton instance
const authService = new AuthService();

export default authService;
