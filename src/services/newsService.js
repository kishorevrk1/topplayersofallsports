import axios from 'axios';

// Use environment variable or default to localhost:8082
const API_BASE_URL = import.meta.env.VITE_NEWS_API_URL || 'http://localhost:8082/api/news';

// Log the API URL for debugging
console.log('[NewsService] Using API URL:', API_BASE_URL);

/**
 * News API Service
 * Handles all news-related API calls
 */
class NewsService {
  /**
   * Get all news articles with pagination
   */
  async getAllNews(page = 0, size = 20) {
    try {
      const response = await axios.get(`${API_BASE_URL}`, {
        params: { page, size }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching news:', error);
      throw error;
    }
  }

  /**
   * Get news by sport
   */
  async getNewsBySport(sport, page = 0, size = 20) {
    try {
      console.log(`[NewsService] Fetching sport: ${sport}, page: ${page}, size: ${size}`);
      const response = await axios.get(`${API_BASE_URL}/sport/${sport}`, {
        params: { page, size }
      });
      console.log(`[NewsService] Received ${response.data.content?.length || 0} articles for ${sport}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching ${sport} news:`, error);
      throw error;
    }
  }

  /**
   * Search news articles
   */
  async searchNews(query, sport = null, page = 0, size = 20) {
    try {
      const params = { q: query, page, size };
      if (sport) params.sport = sport;
      
      const response = await axios.get(`${API_BASE_URL}/search`, { params });
      return response.data;
    } catch (error) {
      console.error('Error searching news:', error);
      throw error;
    }
  }

  /**
   * Get breaking news
   */
  async getBreakingNews(sport = null, page = 0, size = 10) {
    try {
      const params = { page, size };
      if (sport) params.sport = sport;
      
      const response = await axios.get(`${API_BASE_URL}/breaking`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching breaking news:', error);
      throw error;
    }
  }

  /**
   * Get trending news (most viewed)
   */
  async getTrendingNews(sport = null, page = 0, size = 10) {
    try {
      const params = { page, size };
      if (sport) params.sport = sport;
      
      const response = await axios.get(`${API_BASE_URL}/trending`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching trending news:', error);
      throw error;
    }
  }

  /**
   * Get recent articles (last 24 hours)
   */
  async getRecentNews(sport = null) {
    try {
      const params = {};
      if (sport) params.sport = sport;
      
      const response = await axios.get(`${API_BASE_URL}/recent`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching recent news:', error);
      throw error;
    }
  }

  /**
   * Get news by tag
   */
  async getNewsByTag(tag, page = 0, size = 20) {
    try {
      const response = await axios.get(`${API_BASE_URL}/tag/${tag}`, {
        params: { page, size }
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching news for tag ${tag}:`, error);
      throw error;
    }
  }

  /**
   * Get single article by ID
   */
  async getArticleById(id) {
    try {
      const response = await axios.get(`${API_BASE_URL}/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching article ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get news statistics
   */
  async getStats() {
    try {
      const response = await axios.get(`${API_BASE_URL}/stats`);
      return response.data;
    } catch (error) {
      console.error('Error fetching news stats:', error);
      throw error;
    }
  }

  /**
   * Get trending topics
   */
  async getTrendingTopics(sport = null, hours = 24, limit = 10) {
    try {
      const params = { hours, limit };
      if (sport) params.sport = this.mapSportToBackend(sport);
      
      const response = await axios.get(`${API_BASE_URL}/trending/topics`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching trending topics:', error);
      throw error;
    }
  }

  /**
   * Get trending players
   */
  async getTrendingPlayers(sport = null, hours = 24, limit = 10) {
    try {
      const params = { hours, limit };
      if (sport) params.sport = this.mapSportToBackend(sport);
      
      const response = await axios.get(`${API_BASE_URL}/trending/players`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching trending players:', error);
      throw error;
    }
  }

  /**
   * Map backend sport enum to frontend format
   */
  mapSportToBackend(sport) {
    const sportMap = {
      'all': null,
      'basketball': 'BASKETBALL',
      'football': 'FOOTBALL',
      'soccer': 'SOCCER',
      'hockey': 'HOCKEY',
      'tennis': 'TENNIS',
      'mma': 'MMA',
      'baseball': 'BASEBALL',
      'golf': 'GOLF'
    };
    return sportMap[sport?.toLowerCase()] || null;
  }

  /**
   * Transform backend article to frontend format
   */
  transformArticle(backendArticle) {
    return {
      id: backendArticle.id,
      headline: backendArticle.title,
      summary: backendArticle.description || backendArticle.content?.substring(0, 200),
      image: backendArticle.imageUrl,
      source: backendArticle.sourceName,
      publishedAt: new Date(backendArticle.publishedAt),
      tags: backendArticle.tags || [],
      views: backendArticle.viewCount,
      originalUrl: backendArticle.url,
      isBreaking: backendArticle.isBreaking,
      sport: backendArticle.sport,
      author: backendArticle.author
    };
  }

  /**
   * Transform paginated response
   */
  transformPaginatedResponse(backendResponse) {
    return {
      articles: backendResponse.content.map(article => this.transformArticle(article)),
      totalElements: backendResponse.totalElements,
      totalPages: backendResponse.totalPages,
      currentPage: backendResponse.pageable.pageNumber,
      pageSize: backendResponse.pageable.pageSize,
      hasMore: !backendResponse.last
    };
  }
}

export default new NewsService();
