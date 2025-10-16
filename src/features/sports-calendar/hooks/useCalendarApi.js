import { useState, useCallback } from 'react';
import calendarService from '../services/calendarService';
import { LOADING_STATES, ERROR_MESSAGES, DEFAULTS } from '../constants/calendar.constants';

/**
 * Custom hook for Calendar API calls
 * Best Practice: Centralized API logic with service integration and proper error handling
 */
export const useCalendarApi = () => {
  const [loading, setLoading] = useState({
    preferences: false,
    sports: false,
    leagues: false,
    teams: false,
    calendar: false,
    quickAccess: false
  });
  
  const [error, setError] = useState({
    preferences: null,
    sports: null,
    leagues: null,
    teams: null,
    calendar: null,
    quickAccess: null
  });

  // Generic loading state management
  const setLoadingState = useCallback((operation, isLoading) => {
    setLoading(prev => ({ ...prev, [operation]: isLoading }));
  }, []);

  // Generic error state management
  const setErrorState = useCallback((operation, errorMessage) => {
    setError(prev => ({ ...prev, [operation]: errorMessage }));
  }, []);

  // Generic API call wrapper with error handling
  const apiCall = useCallback(async (operation, apiFunction) => {
    setLoadingState(operation, true);
    setErrorState(operation, null);
    
    try {
      const result = await apiFunction();
      if (!result.success) {
        throw new Error(result.error || `Failed to ${operation}`);
      }
      return result;
    } catch (err) {
      const errorMessage = err.message || ERROR_MESSAGES.NETWORK_ERROR;
      setErrorState(operation, errorMessage);
      throw err;
    } finally {
      setLoadingState(operation, false);
    }
  }, [setLoadingState, setErrorState]);

  /**
   * Get user preferences with intelligent defaults
   */
  const getUserPreferences = useCallback(async () => {
    return apiCall('preferences', () => calendarService.getUserPreferences());
  }, [apiCall]);

  /**
   * Update user preferences
   */
  const updateUserPreferences = useCallback(async (preferences) => {
    return apiCall('preferences', () => calendarService.updateUserPreferences(preferences));
  }, [apiCall]);

  /**
   * Get available sports with metadata
   */
  const getAvailableSports = useCallback(async () => {
    return apiCall('sports', () => calendarService.getAvailableSports());
  }, [apiCall]);

  /**
   * Get leagues for a sport with favorites prioritization
   */
  const getLeagues = useCallback(async (sport = null, favoritesOnly = false) => {
    return apiCall('leagues', () => calendarService.getLeagues(sport, favoritesOnly));
  }, [apiCall]);

  /**
   * Get teams for a league with pagination
   */
  const getTeams = useCallback(async (sport = null, league = null, page = 0, size = DEFAULTS.PAGE_SIZE) => {
    return apiCall('teams', () => calendarService.getTeams(sport, league, page, size));
  }, [apiCall]);

  /**
   * Get calendar view with comprehensive filtering
   */
  const getCalendarView = useCallback(async (filters = {}) => {
    return apiCall('calendar', () => calendarService.getCalendarView(filters));
  }, [apiCall]);

  /**
   * Get quick access data for common actions
   */
  const getQuickAccess = useCallback(async (type = 'today', limit = DEFAULTS.MAX_QUICK_ACCESS_ITEMS) => {
    return apiCall('quickAccess', () => calendarService.getQuickAccess(type, limit));
  }, [apiCall]);

  /**
   * Get live games for real-time updates
   */
  const getLiveGames = useCallback(async (limit = DEFAULTS.MAX_QUICK_ACCESS_ITEMS) => {
    return apiCall('quickAccess', () => calendarService.getLiveGames(limit));
  }, [apiCall]);

  /**
   * Search matches with query and filters
   */
  const searchMatches = useCallback(async (query, filters = {}) => {
    return apiCall('calendar', () => calendarService.searchMatches(query, filters));
  }, [apiCall]);

  /**
   * Get detailed match information
   */
  const getMatchDetails = useCallback(async (matchId) => {
    return apiCall('calendar', () => calendarService.getMatchDetails(matchId));
  }, [apiCall]);

  /**
   * Toggle favorite team
   */
  const toggleFavoriteTeam = useCallback(async (teamId, action = 'add') => {
    return apiCall('preferences', () => calendarService.toggleFavoriteTeam(teamId, action));
  }, [apiCall]);

  /**
   * Toggle favorite league
   */
  const toggleFavoriteLeague = useCallback(async (leagueId, action = 'add') => {
    return apiCall('preferences', () => calendarService.toggleFavoriteLeague(leagueId, action));
  }, [apiCall]);

  /**
   * Load initial data for calendar page
   */
  const getInitialData = useCallback(async () => {
    return apiCall('preferences', () => calendarService.getInitialData());
  }, [apiCall]);

  /**
   * Clear all cached data
   */
  const clearCache = useCallback((pattern = null) => {
    calendarService.clearCache(pattern);
  }, []);

  /**
   * Check if any operation is loading
   */
  const isAnyLoading = useCallback(() => {
    return Object.values(loading).some(isLoading => isLoading);
  }, [loading]);

  /**
   * Check if specific operation is loading
   */
  const isLoading = useCallback((operation) => {
    return loading[operation] || false;
  }, [loading]);

  /**
   * Get error for specific operation
   */
  const getError = useCallback((operation) => {
    return error[operation] || null;
  }, [error]);

  /**
   * Clear error for specific operation
   */
  const clearError = useCallback((operation) => {
    setErrorState(operation, null);
  }, [setErrorState]);

  /**
   * Clear all errors
   */
  const clearAllErrors = useCallback(() => {
    setError({
      preferences: null,
      sports: null,
      leagues: null,
      teams: null,
      calendar: null,
      quickAccess: null
    });
  }, []);

  return {
    // API Methods
    getUserPreferences,
    updateUserPreferences,
    getAvailableSports,
    getLeagues,
    getTeams,
    getCalendarView,
    getQuickAccess,
    getLiveGames,
    searchMatches,
    getMatchDetails,
    toggleFavoriteTeam,
    toggleFavoriteLeague,
    getInitialData,

    // State Management
    loading,
    error,
    isAnyLoading,
    isLoading,
    getError,
    clearError,
    clearAllErrors,
    clearCache,

    // Convenience getters
    get isLoadingPreferences() { return loading.preferences; },
    get isLoadingSports() { return loading.sports; },
    get isLoadingLeagues() { return loading.leagues; },
    get isLoadingTeams() { return loading.teams; },
    get isLoadingCalendar() { return loading.calendar; },
    get isLoadingQuickAccess() { return loading.quickAccess; },
    
    get preferencesError() { return error.preferences; },
    get sportsError() { return error.sports; },
    get leaguesError() { return error.leagues; },
    get teamsError() { return error.teams; },
    get calendarError() { return error.calendar; },
    get quickAccessError() { return error.quickAccess; }
  };
};
