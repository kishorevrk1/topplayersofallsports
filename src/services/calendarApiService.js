/**
 * Calendar API Service - Integration with calendar-service backend
 * Backend: http://localhost:8083/api/calendar
 * 
 * Football Fixtures Service (Production-Grade)
 * - Top 4 Leagues: Premier League, La Liga, World Cup, Champions League
 * - Spring Boot + Temporal + PostgreSQL + Redis
 * - Automated syncing at 2 AM daily
 * - Live updates every 15 seconds
 * 
 * Best Practices:
 * - Centralized API calls
 * - Request/Response transformation
 * - Error handling with fallbacks
 * - Caching strategy
 * - Type safety through JSDoc
 */

const CALENDAR_API_URL = import.meta.env.VITE_CALENDAR_API_URL || 'http://localhost:8083/api/calendar';

/**
 * Sport mapping between frontend and backend
 */
const SPORT_MAPPING = {
  // Frontend -> Backend
  toBackend: {
    'nba': 'basketball',
    'nfl': 'nfl',
    'mlb': 'baseball',
    'nhl': 'hockey',
    'soccer': 'football',
    'all': null // Don't send sport filter for 'all'
  },
  // Backend -> Frontend
  toFrontend: {
    'basketball': 'nba',
    'nfl': 'nfl',
    'baseball': 'mlb',
    'hockey': 'nhl',
    'football': 'soccer'
  }
};

class CalendarApiService {
  constructor() {
    this.baseUrl = CALENDAR_API_URL;
    this.cache = new Map();
    this.cacheTimeout = 2 * 60 * 1000; // 2 minutes for live data
    this.requestQueue = new Map();
  }

  /**
   * Map frontend sport to backend sport
   */
  mapSportToBackend(frontendSport) {
    return SPORT_MAPPING.toBackend[frontendSport] || frontendSport;
  }

  /**
   * Map backend sport to frontend sport
   */
  mapSportToFrontend(backendSport) {
    return SPORT_MAPPING.toFrontend[backendSport] || backendSport;
  }

  /**
   * Generate cache key
   */
  getCacheKey(endpoint, params) {
    const sortedParams = Object.keys(params || {})
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');
    return `${endpoint}?${sortedParams}`;
  }

  /**
   * Get cached data if available and not expired
   */
  getCachedData(cacheKey) {
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      console.log(`[CalendarAPI] Cache hit: ${cacheKey}`);
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
   * Make HTTP request with deduplication and caching
   */
  async makeRequest(endpoint, params = {}, options = {}) {
    const { skipCache = false, method = 'GET' } = options;
    const cacheKey = this.getCacheKey(endpoint, params);

    // Check cache first (unless skipCache is true)
    if (!skipCache) {
      const cachedData = this.getCachedData(cacheKey);
      if (cachedData) return cachedData;
    }

    // Deduplicate concurrent requests
    if (this.requestQueue.has(cacheKey)) {
      console.log(`[CalendarAPI] Deduplicating request: ${cacheKey}`);
      return this.requestQueue.get(cacheKey);
    }

    // Create request promise
    const requestPromise = this._executeRequest(endpoint, params, method);
    this.requestQueue.set(cacheKey, requestPromise);

    try {
      const data = await requestPromise;
      
      // Cache successful response
      if (!skipCache) {
        this.setCachedData(cacheKey, data);
      }
      
      return data;
    } finally {
      // Clean up request queue
      this.requestQueue.delete(cacheKey);
    }
  }

  /**
   * Execute HTTP request
   */
  async _executeRequest(endpoint, params, method) {
    try {
      const url = new URL(`${this.baseUrl}${endpoint}`);
      
      // Add query parameters
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          url.searchParams.append(key, params[key]);
        }
      });

      console.log(`[CalendarAPI] ${method} ${url.toString()}`);

      const response = await fetch(url.toString(), {
        method,
        headers: {
          'Content-Type': 'application/json',
          // Add auth header if available
          ...(localStorage.getItem('authToken') && {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          })
        },
        signal: AbortSignal.timeout(15000) // 15 second timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`[CalendarAPI] Success: ${endpoint}`, data);
      
      return data;

    } catch (error) {
      console.error(`[CalendarAPI] Error: ${endpoint}`, error);
      throw error;
    }
  }

  /**
   * Check if fixture should be included (filter out youth/women's tournaments)
   */
  shouldIncludeFixture(leagueName) {
    if (!leagueName) return false;
    
    const name = leagueName.toLowerCase();
    
    // Exclude youth tournaments
    if (name.includes('u17') || name.includes('u-17') || name.includes('under 17')) return false;
    if (name.includes('u19') || name.includes('u-19') || name.includes('under 19')) return false;
    if (name.includes('u20') || name.includes('u-20') || name.includes('under 20')) return false;
    if (name.includes('u21') || name.includes('u-21') || name.includes('under 21')) return false;
    if (name.includes('u23') || name.includes('u-23') || name.includes('under 23')) return false;
    if (name.includes('youth')) return false;
    if (name.includes('junior')) return false;
    
    // Exclude women's tournaments for now
    if (name.includes('women')) return false;
    if (name.includes('wnba')) return false;
    if (name.includes('nwsl')) return false;
    
    // Exclude friendlies and club friendlies
    if (name.includes('friendly') || name.includes('friendlies')) return false;
    
    // Exclude reserve/second teams
    if (name.includes('reserve')) return false;
    if (name.includes('segunda')) return false; // Segunda División
    if (name.includes('championship') && name.includes('efl')) return false; // English Championship
    
    return true;
  }

  /**
   * Get priority for a league/competition
   */
  getLeaguePriority(leagueName, sport) {
    if (!leagueName) return 999;
    
    const name = leagueName.toLowerCase();
    
    // Top tier - Major international competitions (Men's only)
    if (name.includes('world cup') && !name.includes('women')) return 1;
    if (name.includes('champions league') || name.includes('uefa champions')) return 2;
    if (name.includes('olympics') || name.includes('olympic')) return 3;
    
    // Sport-specific top leagues
    switch(sport) {
      case 'nba':
      case 'basketball':
        if (name.includes('nba')) return 10;
        if (name.includes('euroleague')) return 20;
        break;
        
      case 'nfl':
        if (name.includes('nfl')) return 10;
        break;
        
      case 'football':
      case 'soccer':
        if (name.includes('premier league') || name.includes('epl')) return 11;
        if (name.includes('la liga')) return 12;
        if (name.includes('serie a')) return 13;
        if (name.includes('bundesliga')) return 14;
        if (name.includes('ligue 1')) return 15;
        if (name.includes('copa america')) return 16;
        if (name.includes('euro')) return 17;
        break;
        
      case 'hockey':
        if (name.includes('nhl')) return 10;
        if (name.includes('khl')) return 20;
        break;
        
      case 'baseball':
        if (name.includes('mlb') || name.includes('major league')) return 10;
        if (name.includes('world series')) return 5;
        break;
    }
    
    // Default priority
    return 100;
  }

  /**
   * Check if league is in top 3 for its sport
   */
  isTopLeague(leagueName, sport) {
    if (!leagueName) return false;
    
    const name = leagueName.toLowerCase();
    const priority = this.getLeaguePriority(leagueName, sport);
    
    // World Cup, Champions League, Olympics always included
    if (priority <= 3) return true;
    
    // Sport-specific top 3 leagues
    switch(sport) {
      case 'nba':
      case 'basketball':
        // NBA, EuroLeague only
        return priority <= 20;
        
      case 'nfl':
        // NFL only
        return priority <= 10;
        
      case 'football':
      case 'soccer':
        // Premier League, La Liga, Serie A only (top 3)
        return priority <= 13;
        
      case 'hockey':
        // NHL only
        return priority <= 10;
        
      case 'baseball':
        // MLB, World Series only
        return priority <= 10;
        
      default:
        return false;
    }
  }

  /**
   * Transform backend fixture to frontend event format
   */
  transformFixture(fixture) {
    if (!fixture) return null;

    const leagueName = fixture.league?.name || 'Unknown';
    const sport = this.mapSportToFrontend(fixture.sport);
    
    // Filter out unwanted fixtures
    if (!this.shouldIncludeFixture(leagueName)) {
      return null;
    }
    
    // Only include top 3 leagues per sport + World Cup
    if (!this.isTopLeague(leagueName, sport)) {
      return null;
    }
    
    const priority = this.getLeaguePriority(leagueName, sport);

    return {
      id: fixture.id,
      externalId: fixture.externalId,
      sport: sport,
      
      // Date and time
      date: fixture.fixtureDate,
      dateTime: fixture.fixtureDate,
      timezone: fixture.timezone,
      
      // Teams
      homeTeam: fixture.homeTeam?.name || 'TBD',
      awayTeam: fixture.awayTeam?.name || 'TBD',
      homeTeamId: fixture.homeTeam?.id,
      awayTeamId: fixture.awayTeam?.id,
      homeTeamLogo: fixture.homeTeam?.logoUrl,
      awayTeamLogo: fixture.awayTeam?.logoUrl,
      
      // Scores
      homeScore: fixture.homeScore,
      awayScore: fixture.awayScore,
      scoreDetails: fixture.scoreDetails,
      
      // League
      league: leagueName,
      leagueId: fixture.league?.id,
      leagueCountry: fixture.league?.country,
      season: fixture.season,
      round: fixture.round,
      priority: priority, // Add priority for sorting
      
      // Venue
      venue: fixture.venueName || 'TBD',
      venueCity: fixture.venueCity,
      
      // Status
      status: fixture.status,
      statusLong: fixture.statusLong,
      isLive: fixture.isLive,
      elapsedTime: fixture.elapsedTime,
      
      // Additional info
      referee: fixture.referee,
      
      // UI helpers
      title: `${fixture.awayTeam?.name || 'TBD'} vs ${fixture.homeTeam?.name || 'TBD'}`,
      importance: fixture.isLive ? 'high' : priority < 20 ? 'high' : 'medium',
      type: priority < 20 ? 'featured' : 'regular'
    };
  }

  /**
   * Sort fixtures by priority
   */
  sortByPriority(fixtures) {
    // Filter out null values (filtered fixtures)
    const validFixtures = fixtures.filter(f => f !== null && f !== undefined);
    
    return validFixtures.sort((a, b) => {
      // First: Live games
      if (a.isLive && !b.isLive) return -1;
      if (!a.isLive && b.isLive) return 1;
      
      // Second: Priority (lower number = higher priority)
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      
      // Third: Date/time
      return new Date(a.dateTime) - new Date(b.dateTime);
    });
  }

  /**
   * Get fixtures for a specific sport and date
   * @param {string} sport - Frontend sport ID (nba, nfl, etc.) or null for all sports
   * @param {string} date - Date in YYYY-MM-DD format
   */
  async getFixturesByDate(sport, date) {
    // If sport is null or 'all', fetch fixtures for all sports
    if (!sport || sport === 'all') {
      return this.getFixturesForAllSports(date);
    }

    const backendSport = this.mapSportToBackend(sport);
    if (!backendSport) {
      return { fixtures: [], count: 0 };
    }

    const params = { 
      sport: backendSport,
      date 
    };

    try {
      const response = await this.makeRequest('/fixtures', params);
      
      // Backend returns array directly
      const fixturesArray = Array.isArray(response) ? response : [];
      const transformedFixtures = fixturesArray.map(f => this.transformFixture(f));
      
      // Sort by priority
      const sortedFixtures = this.sortByPriority(transformedFixtures);
      
      return {
        fixtures: sortedFixtures,
        count: sortedFixtures.length
      };
    } catch (error) {
      console.error(`[CalendarAPI] Error fetching fixtures for ${backendSport}:`, error);
      return { fixtures: [], count: 0 };
    }
  }

  /**
   * Get fixtures for all sports on a specific date
   * @param {string} date - Date in YYYY-MM-DD format
   */
  async getFixturesForAllSports(date) {
    const sports = ['football', 'basketball', 'hockey', 'baseball', 'nfl'];
    
    try {
      // Fetch fixtures for all sports in parallel
      const promises = sports.map(sport => 
        this.makeRequest('/fixtures', { sport, date })
          .then(response => (response || []).map(f => this.transformFixture(f)))
          .catch(error => {
            console.warn(`[CalendarAPI] Failed to fetch ${sport} fixtures:`, error);
            return [];
          })
      );

      const results = await Promise.all(promises);
      
      // Flatten and combine all fixtures
      const allFixtures = results.flat();
      
      // Sort by priority (includes live status, league importance, and date)
      const sortedFixtures = this.sortByPriority(allFixtures);
      
      return {
        fixtures: sortedFixtures,
        count: sortedFixtures.length
      };
    } catch (error) {
      console.error('[CalendarAPI] Error fetching fixtures for all sports:', error);
      return { fixtures: [], count: 0 };
    }
  }

  /**
   * Get fixtures for a date range
   * @param {string} sport - Frontend sport ID
   * @param {string} startDate - Start date YYYY-MM-DD
   * @param {string} endDate - End date YYYY-MM-DD
   */
  async getFixturesByDateRange(sport, startDate, endDate) {
    const backendSport = this.mapSportToBackend(sport);
    const params = { startDate, endDate };
    
    if (backendSport) {
      params.sport = backendSport;
    }

    const response = await this.makeRequest('/fixtures/range', params);
    
    const fixturesArray = Array.isArray(response) ? response : [];
    const transformedFixtures = fixturesArray.map(f => this.transformFixture(f));
    const sortedFixtures = this.sortByPriority(transformedFixtures);
    
    return {
      fixtures: sortedFixtures,
      count: sortedFixtures.length
    };
  }

  /**
   * Get live fixtures
   * @param {string} sport - Frontend sport ID (optional)
   */
  async getLiveFixtures(sport = null) {
    const params = {};
    
    if (sport && sport !== 'all') {
      const backendSport = this.mapSportToBackend(sport);
      if (backendSport) {
        params.sport = backendSport;
      }
    }

    const response = await this.makeRequest('/fixtures/live', params, { skipCache: true });
    
    const fixturesArray = Array.isArray(response) ? response : [];
    const transformedFixtures = fixturesArray.map(f => this.transformFixture(f));
    const sortedFixtures = this.sortByPriority(transformedFixtures);
    
    return {
      fixtures: sortedFixtures,
      count: sortedFixtures.length
    };
  }

  /**
   * Get fixtures by team
   * @param {string} sport - Frontend sport ID
   * @param {number} teamId - Team ID
   */
  async getFixturesByTeam(sport, teamId) {
    const backendSport = this.mapSportToBackend(sport);
    const params = { teamId };
    
    if (backendSport) {
      params.sport = backendSport;
    }

    const response = await this.makeRequest('/fixtures/team', params);
    
    const fixturesArray = Array.isArray(response) ? response : [];
    const transformedFixtures = fixturesArray.map(f => this.transformFixture(f));
    const sortedFixtures = this.sortByPriority(transformedFixtures);
    
    return {
      fixtures: sortedFixtures,
      count: sortedFixtures.length
    };
  }

  /**
   * Get fixtures by league
   * @param {string} sport - Frontend sport ID
   * @param {number} leagueId - League ID
   */
  async getFixturesByLeague(sport, leagueId) {
    const backendSport = this.mapSportToBackend(sport);
    const params = { leagueId };
    
    if (backendSport) {
      params.sport = backendSport;
    }

    const response = await this.makeRequest('/fixtures/league', params);
    
    const fixturesArray = Array.isArray(response) ? response : [];
    const transformedFixtures = fixturesArray.map(f => this.transformFixture(f));
    const sortedFixtures = this.sortByPriority(transformedFixtures);
    
    return {
      fixtures: sortedFixtures,
      count: sortedFixtures.length
    };
  }

  /**
   * Get upcoming fixtures (next 7 days)
   * @param {string} sport - Frontend sport ID (optional)
   * @param {number} days - Number of days to look ahead (default: 7)
   */
  async getUpcomingFixtures(sport = null, days = 7) {
    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + days);

    const startDateStr = today.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    return this.getFixturesByDateRange(sport, startDateStr, endDateStr);
  }

  /**
   * Get today's fixtures
   * @param {string} sport - Frontend sport ID (optional)
   */
  async getTodaysFixtures(sport = null) {
    const today = new Date().toISOString().split('T')[0];
    return this.getFixturesByDate(sport, today);
  }

  /**
   * Get top 3 matches for today
   * Returns the 3 most important matches based on league priority
   */
  async getTop3TodaysMatches() {
    try {
      const response = await this.makeRequest('/fixtures/top3', {});
      
      const fixturesArray = Array.isArray(response) ? response : [];
      const transformedFixtures = fixturesArray.map(f => this.transformFixture(f));
      const sortedFixtures = this.sortByPriority(transformedFixtures);
      
      return {
        fixtures: sortedFixtures.slice(0, 3),
        count: sortedFixtures.length
      };
    } catch (error) {
      console.error('[CalendarAPI] Error fetching top 3 matches:', error);
      return { fixtures: [], count: 0 };
    }
  }

  /**
   * Get top 3 matches for a specific date
   * @param {string} date - Date in YYYY-MM-DD format
   */
  async getTop3MatchesByDate(date) {
    try {
      const response = await this.makeRequest(`/fixtures/top3/${date}`, {});
      
      const fixturesArray = Array.isArray(response) ? response : [];
      const transformedFixtures = fixturesArray.map(f => this.transformFixture(f));
      const sortedFixtures = this.sortByPriority(transformedFixtures);
      
      return {
        fixtures: sortedFixtures.slice(0, 3),
        count: sortedFixtures.length
      };
    } catch (error) {
      console.error(`[CalendarAPI] Error fetching top 3 matches for ${date}:`, error);
      return { fixtures: [], count: 0 };
    }
  }

  /**
   * Format date for API (YYYY-MM-DD)
   */
  formatDate(date) {
    if (typeof date === 'string') return date;
    return date.toISOString().split('T')[0];
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    console.log('[CalendarAPI] Cache cleared');
  }

  /**
   * Clear cache for specific date
   */
  clearCacheForDate(date) {
    const dateStr = this.formatDate(date);
    const keysToDelete = [];
    
    for (const [key] of this.cache) {
      if (key.includes(dateStr)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.cache.delete(key));
    console.log(`[CalendarAPI] Cleared ${keysToDelete.length} cache entries for ${dateStr}`);
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
}

// Create singleton instance
const calendarApiService = new CalendarApiService();

export default calendarApiService;
