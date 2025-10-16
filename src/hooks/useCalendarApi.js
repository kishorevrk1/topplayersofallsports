import { useState, useCallback } from 'react';

/**
 * Custom hook for Calendar API calls
 * Best Practice: Centralized API logic with proper error handling
 */
export const useCalendarApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const apiCall = useCallback(async (apiFunction) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiFunction();
      return result;
    } catch (err) {
      setError(err.message || 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get user preferences with fallback to defaults
   */
  const getUserPreferences = useCallback(async (userId = 'default') => {
    return apiCall(async () => {
      const response = await fetch(`/api/calendar/preferences?userId=${userId}`);
      if (!response.ok) {
        throw new Error('Failed to load user preferences');
      }
      return response.json();
    });
  }, [apiCall]);

  /**
   * Get available sports for selection
   */
  const getAvailableSports = useCallback(async () => {
    return apiCall(async () => {
      const response = await fetch('/api/calendar/sports');
      if (!response.ok) {
        throw new Error('Failed to load sports');
      }
      return response.json();
    });
  }, [apiCall]);

  /**
   * Get leagues with intelligent filtering
   */
  const getLeagues = useCallback(async (sport = null, favoritesOnly = false, userId = 'default') => {
    return apiCall(async () => {
      const params = new URLSearchParams();
      if (sport) params.append('sport', sport);
      if (favoritesOnly) params.append('favoritesOnly', 'true');
      params.append('userId', userId);

      const response = await fetch(`/api/calendar/leagues?${params}`);
      if (!response.ok) {
        throw new Error('Failed to load leagues');
      }
      return response.json();
    });
  }, [apiCall]);

  /**
   * Get teams by league with pagination
   */
  const getTeams = useCallback(async (leagueId, page = 0, size = 50) => {
    return apiCall(async () => {
      const params = new URLSearchParams({
        leagueId: leagueId.toString(),
        page: page.toString(),
        size: size.toString()
      });

      const response = await fetch(`/api/calendar/teams?${params}`);
      if (!response.ok) {
        throw new Error('Failed to load teams');
      }
      return response.json();
    });
  }, [apiCall]);

  /**
   * Get calendar view with comprehensive filtering
   */
  const getCalendarView = useCallback(async (filters) => {
    return apiCall(async () => {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          params.append(key, value.toString());
        }
      });

      const response = await fetch(`/api/calendar/view?${params}`);
      if (!response.ok) {
        throw new Error('Failed to load calendar data');
      }
      return response.json();
    });
  }, [apiCall]);

  /**
   * Get quick access data
   */
  const getQuickAccess = useCallback(async (type = 'today', userId = 'default', limit = 10) => {
    return apiCall(async () => {
      const params = new URLSearchParams({
        type,
        userId,
        limit: limit.toString()
      });

      const response = await fetch(`/api/calendar/quick-access?${params}`);
      if (!response.ok) {
        throw new Error('Failed to load quick access data');
      }
      return response.json();
    });
  }, [apiCall]);

  /**
   * Update user preferences
   */
  const updateUserPreferences = useCallback(async (userId, preferences) => {
    return apiCall(async () => {
      const response = await fetch(`/api/calendar/preferences?userId=${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences),
      });

      if (!response.ok) {
        throw new Error('Failed to update preferences');
      }
      return response.json();
    });
  }, [apiCall]);

  return {
    loading,
    error,
    getUserPreferences,
    getAvailableSports,
    getLeagues,
    getTeams,
    getCalendarView,
    getQuickAccess,
    updateUserPreferences,
  };
};
