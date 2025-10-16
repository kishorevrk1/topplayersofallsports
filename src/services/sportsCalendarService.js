/**
 * Sports Calendar Service - Frontend integration with backend API
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

class SportsCalendarService {
  constructor() {
    this.baseUrl = `${API_BASE_URL}/api/sports-calendar`;
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes cache
  }

  /**
   * Generate cache key
   */
  getCacheKey(endpoint, params) {
    const paramString = params ? new URLSearchParams(params).toString() : '';
    return `${endpoint}_${paramString}`;
  }

  /**
   * Get cached data if available and not expired
   */
  getCachedData(cacheKey) {
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  /**
   * Set data in cache
   */
  setCachedData(cacheKey, data) {
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Make HTTP request with caching
   */
  async makeRequest(endpoint, params = {}) {
    const cacheKey = this.getCacheKey(endpoint, params);
    
    // Check cache first
    const cachedData = this.getCachedData(cacheKey);
    if (cachedData) {
      console.log(`[SportsCalendar] Using cached data for ${endpoint}`);
      return cachedData;
    }

    try {
      const url = new URL(`${this.baseUrl}${endpoint}`);
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          url.searchParams.append(key, params[key]);
        }
      });

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Add auth header if available
          ...(localStorage.getItem('authToken') && {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          })
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Cache the response
      this.setCachedData(cacheKey, data);
      
      console.log(`[SportsCalendar] API request successful for ${endpoint}`);
      return data;

    } catch (error) {
      console.error(`[SportsCalendar] Request failed for ${endpoint}:`, error);
      // Return fallback data structure
      return this.getFallbackData(endpoint);
    }
  }

  /**
   * Get fallback data when API fails
   */
  getFallbackData(endpoint) {
    const fallbackStructure = {
      games: [],
      count: 0,
      cached: false,
      error: true
    };

    if (endpoint.includes('/sports')) {
      return [];
    }
    if (endpoint.includes('/leagues')) {
      return [];
    }
    
    return fallbackStructure;
  }

  /**
   * Get games for a specific date
   */
  async getGamesByDate(date, sport = null, leagueId = null) {
    const params = { date };
    if (sport) params.sport = sport;
    if (leagueId) params.leagueId = leagueId;

    console.log('[SportsCalendar] Getting games for date:', date, 'sport:', sport, 'league:', leagueId);
    return await this.makeRequest('/games', params);
  }

  /**
   * Get games for date range
   */
  async getGamesByDateRange(startDate, endDate, sport = null, leagueIds = null) {
    const params = { startDate, endDate };
    if (sport) params.sport = sport;
    if (leagueIds && leagueIds.length > 0) {
      params.leagueIds = leagueIds.join(',');
    }

    console.log('[SportsCalendar] Getting games for range:', startDate, 'to', endDate);
    return await this.makeRequest('/games/range', params);
  }

  /**
   * Get live games
   */
  async getLiveGames(sport = null) {
    const params = {};
    if (sport) params.sport = sport;

    console.log('[SportsCalendar] Getting live games for sport:', sport);
    return await this.makeRequest('/games/live', params);
  }

  /**
   * Get upcoming games
   */
  async getUpcomingGames(sport = null, days = 7) {
    const params = { days };
    if (sport) params.sport = sport;

    console.log('[SportsCalendar] Getting upcoming games for', days, 'days');
    return await this.makeRequest('/games/upcoming', params);
  }

  /**
   * Get recent games
   */
  async getRecentGames(sport = null, days = 7) {
    const params = { days };
    if (sport) params.sport = sport;

    console.log('[SportsCalendar] Getting recent games for past', days, 'days');
    return await this.makeRequest('/games/recent', params);
  }

  /**
   * Get today's games
   */
  async getTodaysGames() {
    console.log('[SportsCalendar] Getting today\'s games');
    return await this.makeRequest('/games/today');
  }

  /**
   * Get available sports
   */
  async getAvailableSports() {
    console.log('[SportsCalendar] Getting available sports');
    return await this.makeRequest('/sports');
  }

  /**
   * Get leagues for a sport
   */
  async getLeagues(sport = null, topLeaguesOnly = true) {
    const params = { topLeaguesOnly };
    if (sport) params.sport = sport;

    console.log('[SportsCalendar] Getting leagues for sport:', sport);
    return await this.makeRequest('/leagues', params);
  }

  /**
   * Get games by team
   */
  async getGamesByTeam(teamId, days = 30) {
    const params = { days };

    console.log('[SportsCalendar] Getting games for team:', teamId);
    return await this.makeRequest(`/games/team/${teamId}`, params);
  }

  /**
   * Get playoff games
   */
  async getPlayoffGames(sport = null, days = 30) {
    const params = { days };
    if (sport) params.sport = sport;

    console.log('[SportsCalendar] Getting playoff games');
    return await this.makeRequest('/games/playoffs', params);
  }

  /**
   * Search games
   */
  async searchGames(query, sport = null, days = 30) {
    const params = { query, days };
    if (sport) params.sport = sport;

    console.log('[SportsCalendar] Searching games with query:', query);
    return await this.makeRequest('/games/search', params);
  }

  /**
   * Get games summary
   */
  async getGamesSummary(startDate, endDate) {
    const params = { startDate, endDate };

    console.log('[SportsCalendar] Getting games summary');
    return await this.makeRequest('/games/summary', params);
  }

  /**
   * Get monthly calendar
   */
  async getMonthlyCalendar(year, month, sport = null) {
    const params = { year, month };
    if (sport) params.sport = sport;

    console.log('[SportsCalendar] Getting monthly calendar for', year, month);
    return await this.makeRequest('/calendar/month', params);
  }

  /**
   * Trigger data sync (admin only)
   */
  async syncGamesForDate(date, sport = null) {
    const params = { date };
    if (sport) params.sport = sport;

    try {
      const response = await fetch(`${this.baseUrl}/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('authToken') && {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          })
        },
        body: JSON.stringify(params)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('[SportsCalendar] Sync triggered successfully');
      
      // Clear relevant cache entries
      this.clearCacheForDate(date);
      
      return data;

    } catch (error) {
      console.error('[SportsCalendar] Sync failed:', error);
      throw error;
    }
  }

  /**
   * Get API usage statistics
   */
  async getApiUsage() {
    console.log('[SportsCalendar] Getting API usage');
    return await this.makeRequest('/api-usage');
  }

  /**
   * Clear cache for a specific date
   */
  clearCacheForDate(date) {
    const keysToDelete = [];
    for (const [key] of this.cache) {
      if (key.includes(date)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.cache.delete(key));
    console.log(`[SportsCalendar] Cleared ${keysToDelete.length} cache entries for date ${date}`);
  }

  /**
   * Clear all cache
   */
  clearCache() {
    this.cache.clear();
    console.log('[SportsCalendar] Cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      entries: this.cache.size,
      timeout: this.cacheTimeout,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * Transform backend game data to frontend format
   */
  transformGameData(backendGame) {
    return {
      id: backendGame.id,
      externalId: backendGame.externalId,
      title: `${backendGame.awayTeamName} vs ${backendGame.homeTeamName}`,
      sport: backendGame.sport,
      date: backendGame.gameDate,
      time: backendGame.gameTime || '00:00',
      venue: backendGame.venueName || 'TBD',
      venueCity: backendGame.venueCity,
      teams: [backendGame.awayTeamName, backendGame.homeTeamName],
      teamIds: [backendGame.awayTeamId, backendGame.homeTeamId],
      logos: [backendGame.awayTeamLogo, backendGame.homeTeamLogo],
      scores: {
        away: backendGame.awayTeamScore,
        home: backendGame.homeTeamScore
      },
      status: backendGame.status,
      statusLong: backendGame.statusLong,
      leagueId: backendGame.leagueId,
      leagueName: backendGame.leagueName,
      leagueCountry: backendGame.leagueCountry,
      season: backendGame.season,
      round: backendGame.round,
      week: backendGame.week,
      importance: backendGame.importance || 'medium',
      isPlayoff: backendGame.isPlayoff || false,
      isLive: ['Q1', 'Q2', 'Q3', 'Q4', 'OT', 'HT', 'BT'].includes(backendGame.status),
      isFinished: ['FT', 'AOT'].includes(backendGame.status),
      isUpcoming: backendGame.status === 'NS',
      gameDetails: backendGame.gameDetails ? JSON.parse(backendGame.gameDetails) : null,
      lastSyncAt: backendGame.lastSyncAt
    };
  }

  /**
   * Get formatted date string for API calls
   */
  formatDateForApi(date) {
    if (typeof date === 'string') return date;
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
  }

  /**
   * Get games for calendar display with proper transformation
   */
  async getCalendarGames(date, sport = null, leagueId = null) {
    const response = await this.getGamesByDate(this.formatDateForApi(date), sport, leagueId);
    
    if (response.games && Array.isArray(response.games)) {
      return {
        ...response,
        games: response.games.map(game => this.transformGameData(game))
      };
    }
    
    return response;
  }
}

// Create singleton instance
const sportsCalendarService = new SportsCalendarService();

export default sportsCalendarService;
