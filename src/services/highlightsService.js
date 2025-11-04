/**
 * Highlights Service
 * Handles all API calls to the highlights-service backend
 */

import axios from 'axios';

// Remove trailing slash if present to avoid double slashes in URLs
const HIGHLIGHTS_API_BASE_URL = (import.meta.env.VITE_HIGHLIGHTS_API_URL || 'http://localhost:8081/api/highlights').replace(/\/$/, '');

// Create axios instance with default config
const highlightsClient = axios.create({
  baseURL: HIGHLIGHTS_API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
highlightsClient.interceptors.request.use(
  (config) => {
    if (import.meta.env.VITE_ENABLE_DEBUG_LOGGING === 'true') {
      console.log('🎬 Highlights API Request:', config.method?.toUpperCase(), config.url);
    }
    return config;
  },
  (error) => {
    console.error('❌ Highlights API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
highlightsClient.interceptors.response.use(
  (response) => {
    if (import.meta.env.VITE_ENABLE_DEBUG_LOGGING === 'true') {
      console.log('✅ Highlights API Response:', response.config.url, response.data);
    }
    return response;
  },
  (error) => {
    console.error('❌ Highlights API Error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      url: error.config?.url,
    });
    return Promise.reject(error);
  }
);

/**
 * Get all highlights with filters and pagination
 * @param {Object} params - Query parameters
 * @param {string} params.sport - Sport filter (basketball, football, mma, etc.)
 * @param {string} params.league - League filter (NBA, NFL, UFC, etc.)
 * @param {string} params.sort - Sort field (publishedAt, viewCount, likeCount, trending)
 * @param {string} params.direction - Sort direction (asc, desc)
 * @param {number} params.page - Page number (0-indexed)
 * @param {number} params.size - Page size
 * @returns {Promise} Paginated highlights response
 */
export const getHighlights = async (params = {}) => {
  const {
    sport,
    league,
    sort = 'publishedAt',
    direction = 'desc',
    page = 0,
    size = 20,
  } = params;

  // Use axios params option instead of query string
  const queryParams = {
    sort,
    direction,
    page,
    size,
  };
  
  if (sport) queryParams.sport = sport;
  if (league) queryParams.leagueId = league;

  const response = await highlightsClient.get('', { params: queryParams });
  return response.data;
};

/**
 * Search highlights by query string
 * @param {string} query - Search query
 * @param {Object} params - Additional filters
 * @returns {Promise} Search results
 */
export const searchHighlights = async (query, params = {}) => {
  const {
    sport,
    page = 0,
    size = 20,
  } = params;

  const queryParams = {
    q: query,
    page,
    size,
  };
  
  if (sport) queryParams.sport = sport;

  const response = await highlightsClient.get('/search', { params: queryParams });
  return response.data;
};

/**
 * Get trending highlights
 * @param {Object} params - Query parameters
 * @param {string} params.sport - Sport filter
 * @param {number} params.limit - Number of results
 * @returns {Promise} Trending highlights array
 */
export const getTrendingHighlights = async (params = {}) => {
  const {
    sport,
    limit = 10,
  } = params;

  const queryParams = { limit };
  if (sport) queryParams.sport = sport;

  const response = await highlightsClient.get('/trending', { params: queryParams });
  return response.data;
};

/**
 * Get featured highlights
 * @param {Object} params - Query parameters
 * @param {string} params.sport - Sport filter
 * @param {number} params.limit - Number of results
 * @returns {Promise} Featured highlights array
 */
export const getFeaturedHighlights = async (params = {}) => {
  const {
    sport,
    limit = 3,
  } = params;

  const queryParams = { limit };
  if (sport) queryParams.sport = sport;

  const response = await highlightsClient.get('/featured', { params: queryParams });
  return response.data;
};

/**
 * Get single highlight by ID
 * @param {number} id - Highlight ID
 * @returns {Promise} Highlight details
 */
export const getHighlightById = async (id) => {
  const response = await highlightsClient.get(`/${id}`);
  return response.data;
};

/**
 * Get related highlights
 * @param {number} id - Highlight ID
 * @param {number} limit - Number of results
 * @returns {Promise} Related highlights array
 */
export const getRelatedHighlights = async (id, limit = 10) => {
  const queryParams = { limit };

  const response = await highlightsClient.get(`/${id}/related`, { params: queryParams });
  return response.data;
};

/**
 * Transform backend highlight to frontend format
 * @param {Object} highlight - Backend highlight object
 * @returns {Object} Frontend-formatted highlight
 */
export const transformHighlight = (highlight) => {
  return {
    id: highlight.id,
    title: highlight.title,
    description: highlight.description,
    thumbnail: highlight.thumbnail,
    videoUrl: highlight.videoUrl,
    duration: highlight.duration,
    views: highlight.views,
    likes: highlight.likes,
    uploadedAt: new Date(highlight.uploadedAt),
    sport: highlight.sport,
    league: highlight.league,
    videoType: highlight.videoType,
    isFeatured: highlight.isFeatured,
    isLive: highlight.isLive || false,
    source: {
      name: highlight.source?.name || 'Unknown',
      logo: highlight.source?.logo || null,
      platform: highlight.source?.platform || 'YOUTUBE',
    },
    teams: highlight.teams || [],
    players: highlight.players || [],
  };
};

/**
 * Transform paginated response
 * @param {Object} response - Backend paginated response
 * @returns {Object} Transformed response
 */
export const transformPaginatedResponse = (response) => {
  return {
    content: response.content.map(transformHighlight),
    totalElements: response.totalElements,
    totalPages: response.totalPages,
    currentPage: response.number,
    pageSize: response.size,
    hasMore: !response.last,
  };
};

export default {
  getHighlights,
  searchHighlights,
  getTrendingHighlights,
  getFeaturedHighlights,
  getHighlightById,
  getRelatedHighlights,
  transformHighlight,
  transformPaginatedResponse,
};
