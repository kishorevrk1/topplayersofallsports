/**
 * Custom React Hooks for Highlights
 * Handles data fetching, caching, and state management
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getHighlights,
  searchHighlights,
  getTrendingHighlights,
  getFeaturedHighlights,
  getHighlightById,
  getRelatedHighlights,
  transformPaginatedResponse,
  transformHighlight,
} from '../services/highlightsService';

/**
 * Hook for fetching paginated highlights with filters
 * @param {Object} initialFilters - Initial filter values
 * @returns {Object} Highlights data and control functions
 */
export const useHighlights = (initialFilters = {}) => {
  const [highlights, setHighlights] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [filters, setFilters] = useState({
    sport: null,
    league: null,
    sort: 'publishedAt',
    direction: 'desc',
    ...initialFilters,
  });

  const isFetchingRef = useRef(false);

  const fetchHighlights = useCallback(async (pageNum = 0, append = false) => {
    if (isFetchingRef.current) return;
    
    isFetchingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const response = await getHighlights({
        ...filters,
        page: pageNum,
        size: 20,
      });

      const transformed = transformPaginatedResponse(response);

      if (append) {
        setHighlights(prev => [...prev, ...transformed.content]);
      } else {
        setHighlights(transformed.content);
      }

      setHasMore(transformed.hasMore);
      setTotalElements(transformed.totalElements);
      setPage(pageNum);
    } catch (err) {
      console.error('Error fetching highlights:', err);
      setError(err.message || 'Failed to fetch highlights');
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [filters]);

  // Initial fetch
  useEffect(() => {
    fetchHighlights(0, false);
  }, [filters]);

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      fetchHighlights(page + 1, true);
    }
  }, [isLoading, hasMore, page, fetchHighlights]);

  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPage(0);
  }, []);

  const refresh = useCallback(() => {
    fetchHighlights(0, false);
  }, [fetchHighlights]);

  return {
    highlights,
    isLoading,
    error,
    hasMore,
    totalElements,
    page,
    filters,
    loadMore,
    updateFilters,
    refresh,
  };
};

/**
 * Hook for searching highlights
 * @param {string} query - Search query
 * @param {Object} filters - Additional filters
 * @returns {Object} Search results and control functions
 */
export const useSearchHighlights = (query, filters = {}) => {
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const isFetchingRef = useRef(false);

  const search = useCallback(async (searchQuery, pageNum = 0, append = false) => {
    if (!searchQuery || isFetchingRef.current) return;

    isFetchingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const response = await searchHighlights(searchQuery, {
        ...filters,
        page: pageNum,
        size: 20,
      });

      const transformed = transformPaginatedResponse(response);

      if (append) {
        setResults(prev => [...prev, ...transformed.content]);
      } else {
        setResults(transformed.content);
      }

      setHasMore(transformed.hasMore);
      setTotalElements(transformed.totalElements);
      setPage(pageNum);
    } catch (err) {
      console.error('Error searching highlights:', err);
      setError(err.message || 'Failed to search highlights');
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [filters]);

  useEffect(() => {
    if (query) {
      search(query, 0, false);
    } else {
      setResults([]);
      setTotalElements(0);
    }
  }, [query, filters, search]);

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore && query) {
      search(query, page + 1, true);
    }
  }, [isLoading, hasMore, page, query, search]);

  return {
    results,
    isLoading,
    error,
    hasMore,
    totalElements,
    page,
    loadMore,
  };
};

/**
 * Hook for fetching trending highlights
 * @param {Object} filters - Filter options
 * @returns {Object} Trending highlights and loading state
 */
export const useTrendingHighlights = (filters = {}) => {
  const [trending, setTrending] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTrending = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await getTrendingHighlights(filters);
        setTrending(response.map(transformHighlight));
      } catch (err) {
        console.error('Error fetching trending highlights:', err);
        setError(err.message || 'Failed to fetch trending highlights');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrending();
  }, [filters.sport, filters.limit]);

  return { trending, isLoading, error };
};

/**
 * Hook for fetching featured highlights
 * @param {Object} filters - Filter options
 * @returns {Object} Featured highlights and loading state
 */
export const useFeaturedHighlights = (filters = {}) => {
  const [featured, setFeatured] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFeatured = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await getFeaturedHighlights(filters);
        setFeatured(response.map(transformHighlight));
      } catch (err) {
        console.error('Error fetching featured highlights:', err);
        setError(err.message || 'Failed to fetch featured highlights');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeatured();
  }, [filters.sport, filters.limit]);

  return { featured, isLoading, error };
};

/**
 * Hook for fetching single highlight details
 * @param {number} id - Highlight ID
 * @returns {Object} Highlight details and loading state
 */
export const useHighlightDetails = (id) => {
  const [highlight, setHighlight] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;

    const fetchHighlight = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await getHighlightById(id);
        setHighlight(transformHighlight(response));
      } catch (err) {
        console.error('Error fetching highlight details:', err);
        setError(err.message || 'Failed to fetch highlight details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchHighlight();
  }, [id]);

  return { highlight, isLoading, error };
};

/**
 * Hook for fetching related highlights
 * @param {number} id - Highlight ID
 * @param {number} limit - Number of results
 * @returns {Object} Related highlights and loading state
 */
export const useRelatedHighlights = (id, limit = 10) => {
  const [related, setRelated] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;

    const fetchRelated = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await getRelatedHighlights(id, limit);
        setRelated(response.map(transformHighlight));
      } catch (err) {
        console.error('Error fetching related highlights:', err);
        setError(err.message || 'Failed to fetch related highlights');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRelated();
  }, [id, limit]);

  return { related, isLoading, error };
};

export default {
  useHighlights,
  useSearchHighlights,
  useTrendingHighlights,
  useFeaturedHighlights,
  useHighlightDetails,
  useRelatedHighlights,
};
