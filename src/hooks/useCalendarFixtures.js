/**
 * useCalendarFixtures Hook
 * 
 * Custom hook for managing calendar fixtures with:
 * - Loading states
 * - Error handling
 * - Auto-refresh for live games
 * - Caching
 * - Optimistic updates
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import calendarApiService from '../services/calendarApiService';

export const useCalendarFixtures = (options = {}) => {
  const {
    sport = null,
    date = null,
    autoRefresh = false,
    refreshInterval = 30000, // 30 seconds for live games
    enabled = true
  } = options;

  const [fixtures, setFixtures] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  
  const refreshTimerRef = useRef(null);
  const abortControllerRef = useRef(null);

  /**
   * Fetch fixtures
   */
  const fetchFixtures = useCallback(async (showLoading = true) => {
    if (!enabled) return;

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    try {
      if (showLoading) {
        setLoading(true);
      }
      setError(null);

      let result;
      
      if (date) {
        // Fetch by date
        result = await calendarApiService.getFixturesByDate(sport, date);
      } else {
        // Fetch today's fixtures
        result = await calendarApiService.getTodaysFixtures(sport);
      }

      setFixtures(result.fixtures || []);
      setLastUpdated(new Date());

    } catch (err) {
      console.error('[useCalendarFixtures] Error:', err);
      setError(err.message || 'Failed to load fixtures');
    } finally {
      setLoading(false);
    }
  }, [sport, date, enabled]);

  /**
   * Refresh fixtures (without loading state)
   */
  const refresh = useCallback(() => {
    fetchFixtures(false);
  }, [fetchFixtures]);

  /**
   * Fetch live fixtures
   */
  const fetchLiveFixtures = useCallback(async () => {
    try {
      const result = await calendarApiService.getLiveFixtures(sport);
      return result.fixtures || [];
    } catch (err) {
      console.error('[useCalendarFixtures] Error fetching live:', err);
      return [];
    }
  }, [sport]);

  /**
   * Setup auto-refresh for live games
   */
  useEffect(() => {
    if (!autoRefresh || !enabled) return;

    // Clear existing timer
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
    }

    // Set up new timer
    refreshTimerRef.current = setInterval(() => {
      console.log('[useCalendarFixtures] Auto-refreshing...');
      refresh();
    }, refreshInterval);

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [autoRefresh, refreshInterval, refresh, enabled]);

  /**
   * Initial fetch
   */
  useEffect(() => {
    fetchFixtures();

    return () => {
      // Cleanup
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [fetchFixtures]);

  /**
   * Get live fixtures from current list
   */
  const liveFixtures = fixtures.filter(f => f.isLive);

  /**
   * Get upcoming fixtures from current list
   */
  const upcomingFixtures = fixtures.filter(f => 
    f.status === 'NS' || f.status === 'Not Started'
  );

  /**
   * Get finished fixtures from current list
   */
  const finishedFixtures = fixtures.filter(f => 
    f.status === 'FT' || f.status === 'AOT' || f.status === 'Finished'
  );

  return {
    fixtures,
    loading,
    error,
    lastUpdated,
    liveFixtures,
    upcomingFixtures,
    finishedFixtures,
    refresh,
    fetchLiveFixtures,
    hasLiveGames: liveFixtures.length > 0
  };
};

/**
 * useUpcomingFixtures Hook
 * Fetch upcoming fixtures for next N days
 */
export const useUpcomingFixtures = (sport = null, days = 7) => {
  const [fixtures, setFixtures] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUpcoming = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const result = await calendarApiService.getUpcomingFixtures(sport, days);
        setFixtures(result.fixtures || []);
        
      } catch (err) {
        console.error('[useUpcomingFixtures] Error:', err);
        setError(err.message || 'Failed to load upcoming fixtures');
      } finally {
        setLoading(false);
      }
    };

    fetchUpcoming();
  }, [sport, days]);

  return { fixtures, loading, error };
};

/**
 * useLiveFixtures Hook
 * Fetch and auto-refresh live fixtures
 */
export const useLiveFixtures = (sport = null, refreshInterval = 15000) => {
  const [fixtures, setFixtures] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchLive = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      setError(null);
      
      const result = await calendarApiService.getLiveFixtures(sport);
      setFixtures(result.fixtures || []);
      setLastUpdated(new Date());
      
    } catch (err) {
      console.error('[useLiveFixtures] Error:', err);
      setError(err.message || 'Failed to load live fixtures');
    } finally {
      setLoading(false);
    }
  }, [sport]);

  // Initial fetch
  useEffect(() => {
    fetchLive();
  }, [fetchLive]);

  // Auto-refresh
  useEffect(() => {
    if (fixtures.length === 0) return;

    const timer = setInterval(() => {
      console.log('[useLiveFixtures] Auto-refreshing live games...');
      fetchLive(false);
    }, refreshInterval);

    return () => clearInterval(timer);
  }, [fixtures.length, refreshInterval, fetchLive]);

  return {
    fixtures,
    loading,
    error,
    lastUpdated,
    refresh: () => fetchLive(false),
    hasLiveGames: fixtures.length > 0
  };
};

/**
 * useMonthlyFixtures Hook
 * 
 * Fetches fixtures for an entire month to populate calendar grid
 */
export const useMonthlyFixtures = (options = {}) => {
  const {
    sport = null,
    month = new Date().getMonth(),
    year = new Date().getFullYear(),
    enabled = true
  } = options;

  const [fixtures, setFixtures] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchMonthlyFixtures = useCallback(async () => {
    if (!enabled) return;

    try {
      setLoading(true);
      setError(null);

      // Get first and last day of month
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0);

      // Format dates as YYYY-MM-DD
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      // Fetch fixtures for date range
      const result = await calendarApiService.getFixturesByDateRange(
        sport,
        startDateStr,
        endDateStr
      );

      setFixtures(result.fixtures || []);

    } catch (err) {
      console.error('[useMonthlyFixtures] Error:', err);
      setError(err.message || 'Failed to load monthly fixtures');
    } finally {
      setLoading(false);
    }
  }, [sport, month, year, enabled]);

  // Fetch on mount and when dependencies change
  useEffect(() => {
    fetchMonthlyFixtures();
  }, [fetchMonthlyFixtures]);

  return {
    fixtures,
    loading,
    error,
    refetch: fetchMonthlyFixtures
  };
};

export default useCalendarFixtures;
