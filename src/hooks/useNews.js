import { useState, useEffect, useCallback } from 'react';
import newsService from '../services/newsService';

/**
 * Custom hook for fetching and managing news articles
 */
export const useNews = (initialFilters = {}) => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalArticles, setTotalArticles] = useState(0);
  const [filters, setFilters] = useState({
    sport: 'all',
    searchQuery: '',
    pageSize: 20,
    ...initialFilters
  });

  /**
   * Fetch news articles based on current filters
   */
  const fetchNews = useCallback(async (pageNum = 0, append = false) => {
    try {
      setLoading(true);
      setError(null);

      let response;
      const backendSport = newsService.mapSportToBackend(filters.sport);

      // Determine which API to call based on filters
      if (filters.searchQuery) {
        response = await newsService.searchNews(
          filters.searchQuery,
          backendSport,
          pageNum,
          filters.pageSize
        );
      } else if (filters.sport === 'all' || !filters.sport) {
        response = await newsService.getAllNews(pageNum, filters.pageSize);
      } else {
        response = await newsService.getNewsBySport(
          backendSport,
          pageNum,
          filters.pageSize
        );
      }

      const transformed = newsService.transformPaginatedResponse(response);

      if (append) {
        setArticles(prev => [...prev, ...transformed.articles]);
      } else {
        setArticles(transformed.articles);
      }

      setHasMore(transformed.hasMore);
      setTotalArticles(transformed.totalElements);
      setPage(pageNum);
    } catch (err) {
      console.error('Error fetching news:', err);
      setError(err.message || 'Failed to fetch news');
      setArticles([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  /**
   * Load more articles (pagination)
   */
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchNews(page + 1, true);
    }
  }, [loading, hasMore, page, fetchNews]);

  /**
   * Refresh articles (reload from beginning)
   */
  const refresh = useCallback(() => {
    setPage(0);
    fetchNews(0, false);
  }, [fetchNews]);

  /**
   * Update filters and refetch
   */
  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPage(0);
  }, []);

  /**
   * Fetch on mount and when filters change
   */
  useEffect(() => {
    fetchNews(0, false);
  }, [filters.sport, filters.searchQuery]);

  return {
    articles,
    loading,
    error,
    hasMore,
    totalArticles,
    page,
    filters,
    loadMore,
    refresh,
    updateFilters,
    fetchNews
  };
};

/**
 * Hook for fetching breaking news
 */
export const useBreakingNews = (sport = null, limit = 10) => {
  const [breakingNews, setBreakingNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBreakingNews = async () => {
      try {
        setLoading(true);
        const backendSport = newsService.mapSportToBackend(sport);
        const response = await newsService.getBreakingNews(backendSport, 0, limit);
        const transformed = newsService.transformPaginatedResponse(response);
        setBreakingNews(transformed.articles);
      } catch (err) {
        console.error('Error fetching breaking news:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBreakingNews();
  }, [sport, limit]);

  return { breakingNews, loading, error };
};

/**
 * Hook for fetching trending news
 */
export const useTrendingNews = (sport = null, limit = 10) => {
  const [trendingNews, setTrendingNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTrendingNews = async () => {
      try {
        setLoading(true);
        const backendSport = newsService.mapSportToBackend(sport);
        const response = await newsService.getTrendingNews(backendSport, 0, limit);
        const transformed = newsService.transformPaginatedResponse(response);
        setTrendingNews(transformed.articles);
      } catch (err) {
        console.error('Error fetching trending news:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingNews();
  }, [sport, limit]);

  return { trendingNews, loading, error };
};

/**
 * Hook for fetching news statistics
 */
export const useNewsStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await newsService.getStats();
        setStats(data);
      } catch (err) {
        console.error('Error fetching news stats:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return { stats, loading, error };
};

/**
 * Hook for fetching trending topics
 */
export const useTrendingTopics = (sport = null, limit = 10, hours = 24) => {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTrendingTopics = async () => {
      try {
        setLoading(true);
        const data = await newsService.getTrendingTopics(sport, hours, limit);
        setTopics(data);
      } catch (err) {
        console.error('Error fetching trending topics:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingTopics();
  }, [sport, limit, hours]);

  return { topics, loading, error };
};

/**
 * Hook for fetching trending players
 */
export const useTrendingPlayers = (sport = null, limit = 10, hours = 24) => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTrendingPlayers = async () => {
      try {
        setLoading(true);
        const data = await newsService.getTrendingPlayers(sport, hours, limit);
        setPlayers(data);
      } catch (err) {
        console.error('Error fetching trending players:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingPlayers();
  }, [sport, limit, hours]);

  return { players, loading, error };
};
