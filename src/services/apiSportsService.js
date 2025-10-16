/**
 * API-Sports.io Integration Service
 * Handles data fetching from multiple sports APIs with caching and rate limiting
 */

class ApiSportsService {
  constructor() {
    this.baseUrl = 'https://v1.basketball.api-sports.io'; // Default to basketball
    this.apiKey = import.meta.env.VITE_API_SPORTS_KEY || 'YOUR_API_KEY_HERE';
    this.headers = {
      'x-rapidapi-host': 'v1.basketball.api-sports.io',
      'x-rapidapi-key': this.apiKey
    };
    
    // API endpoints for different sports
    this.endpoints = {
      basketball: {
        baseUrl: 'https://v1.basketball.api-sports.io',
        host: 'v1.basketball.api-sports.io'
      },
      football: {
        baseUrl: 'https://v3.football.api-sports.io', 
        host: 'v3.football.api-sports.io'
      },
      americanFootball: {
        baseUrl: 'https://v1.american-football.api-sports.io',
        host: 'v1.american-football.api-sports.io'
      },
      baseball: {
        baseUrl: 'https://v1.baseball.api-sports.io',
        host: 'v1.baseball.api-sports.io'
      },
      hockey: {
        baseUrl: 'https://v1.hockey.api-sports.io',
        host: 'v1.hockey.api-sports.io'
      }
    };

    // Top leagues configuration for each sport
    this.topLeagues = {
      basketball: [
        { id: 12, name: 'NBA', country: 'USA', season: '2024-2025' },
        { id: 120, name: 'EuroLeague', country: 'Europe', season: '2024-2025' },
        { id: 1, name: 'NCAA', country: 'USA', season: '2024-2025' }
      ],
      football: [
        { id: 39, name: 'Premier League', country: 'England', season: '2024' },
        { id: 140, name: 'La Liga', country: 'Spain', season: '2024' },
        { id: 78, name: 'Bundesliga', country: 'Germany', season: '2024' },
        { id: 135, name: 'Serie A', country: 'Italy', season: '2024' },
        { id: 61, name: 'Ligue 1', country: 'France', season: '2024' },
        { id: 2, name: 'UEFA Champions League', country: 'Europe', season: '2024' }
      ],
      americanFootball: [
        { id: 1, name: 'NFL', country: 'USA', season: '2024' }
      ],
      baseball: [
        { id: 1, name: 'MLB', country: 'USA', season: '2024' }
      ],
      hockey: [
        { id: 57, name: 'NHL', country: 'USA', season: '2024-2025' }
      ]
    };

    // Rate limiting and caching
    this.requestCount = 0;
    this.dailyLimit = 100; // Free tier limit
    this.cache = new Map();
    this.cacheTimeout = 15 * 60 * 1000; // 15 minutes cache
    
    // Load request count from localStorage
    this.loadRequestCount();
  }

  /**
   * Load request count from localStorage to persist across sessions
   */
  loadRequestCount() {
    const today = new Date().toDateString();
    const stored = localStorage.getItem('apiSports_requests');
    
    if (stored) {
      const data = JSON.parse(stored);
      if (data.date === today) {
        this.requestCount = data.count;
      } else {
        // Reset count for new day
        this.requestCount = 0;
        this.saveRequestCount();
      }
    }
  }

  /**
   * Save request count to localStorage
   */
  saveRequestCount() {
    const today = new Date().toDateString();
    const data = { date: today, count: this.requestCount };
    localStorage.setItem('apiSports_requests', JSON.stringify(data));
  }

  /**
   * Check if we can make API request (rate limiting)
   */
  canMakeRequest() {
    return this.requestCount < this.dailyLimit;
  }

  /**
   * Generate cache key for request
   */
  getCacheKey(sport, endpoint, params) {
    const paramString = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');
    return `${sport}_${endpoint}_${paramString}`;
  }

  /**
   * Get cached data if available and not expired
   */
  getCachedData(cacheKey) {
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      console.log(`[ApiSports] Using cached data for ${cacheKey}`);
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
   * Make API request with rate limiting and caching
   */
  async makeRequest(sport, endpoint, params = {}) {
    const cacheKey = this.getCacheKey(sport, endpoint, params);
    
    // Check cache first
    const cachedData = this.getCachedData(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    // Check rate limit
    if (!this.canMakeRequest()) {
      console.warn('[ApiSports] Daily API limit reached. Using fallback data.');
      return this.getFallbackData(sport, endpoint);
    }

    try {
      const sportConfig = this.endpoints[sport];
      if (!sportConfig) {
        throw new Error(`Unsupported sport: ${sport}`);
      }

      const url = new URL(`${sportConfig.baseUrl}/${endpoint}`);
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          url.searchParams.append(key, params[key]);
        }
      });

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'x-rapidapi-host': sportConfig.host,
          'x-rapidapi-key': this.apiKey
        }
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Update request count
      this.requestCount++;
      this.saveRequestCount();
      
      // Cache the response
      this.setCachedData(cacheKey, data);
      
      console.log(`[ApiSports] API request successful for ${sport}/${endpoint}`);
      console.log(`[ApiSports] Requests used today: ${this.requestCount}/${this.dailyLimit}`);
      
      return data;

    } catch (error) {
      console.error(`[ApiSports] Request failed for ${sport}/${endpoint}:`, error);
      return this.getFallbackData(sport, endpoint);
    }
  }

  /**
   * Get fallback data when API fails or rate limit reached
   */
  getFallbackData(sport, endpoint) {
    console.log(`[ApiSports] Using fallback data for ${sport}/${endpoint}`);
    
    if (endpoint === 'games') {
      return {
        get: 'games',
        results: 0,
        response: [],
        cached: true,
        fallback: true
      };
    }
    
    if (endpoint === 'leagues') {
      return {
        get: 'leagues',
        results: this.topLeagues[sport]?.length || 0,
        response: this.topLeagues[sport] || [],
        cached: true,
        fallback: true
      };
    }
    
    return {
      get: endpoint,
      results: 0,
      response: [],
      cached: true,
      fallback: true
    };
  }

  /**
   * Get games for a specific sport and date
   */
  async getGames(sport, options = {}) {
    const { 
      date = new Date().toISOString().split('T')[0], // YYYY-MM-DD
      league = null,
      season = null,
      team = null,
      timezone = 'America/New_York'
    } = options;

    const params = {
      date,
      timezone
    };

    if (league) params.league = league;
    if (season) params.season = season;
    if (team) params.team = team;

    return await this.makeRequest(sport, 'games', params);
  }

  /**
   * Get games for all top leagues of a sport
   */
  async getGamesForTopLeagues(sport, date = null) {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const leagues = this.topLeagues[sport] || [];
    
    console.log(`[ApiSports] Fetching games for ${sport} top leagues on ${targetDate}`);
    
    // If we have many leagues and limited requests, just get general games
    if (leagues.length > 3 && this.requestCount > this.dailyLimit * 0.8) {
      return await this.getGames(sport, { date: targetDate });
    }

    // Get games for each top league
    const allGames = [];
    
    for (const league of leagues.slice(0, 3)) { // Limit to top 3 leagues
      if (!this.canMakeRequest()) break;
      
      try {
        const gamesData = await this.getGames(sport, {
          date: targetDate,
          league: league.id,
          season: league.season
        });
        
        if (gamesData.response && gamesData.response.length > 0) {
          allGames.push(...gamesData.response.map(game => ({
            ...game,
            sport,
            leagueName: league.name,
            leagueCountry: league.country
          })));
        }
      } catch (error) {
        console.error(`[ApiSports] Failed to fetch games for ${league.name}:`, error);
      }
    }

    return {
      get: 'games',
      results: allGames.length,
      response: allGames,
      sport,
      date: targetDate
    };
  }

  /**
   * Get leagues for a sport
   */
  async getLeagues(sport) {
    return await this.makeRequest(sport, 'leagues');
  }

  /**
   * Get teams for a league
   */
  async getTeams(sport, leagueId, season = null) {
    const params = { league: leagueId };
    if (season) params.season = season;
    
    return await this.makeRequest(sport, 'teams', params);
  }

  /**
   * Get standings for a league
   */
  async getStandings(sport, leagueId, season = null) {
    const params = { league: leagueId };
    if (season) params.season = season;
    
    return await this.makeRequest(sport, 'standings', params);
  }

  /**
   * Get games for calendar view (multiple days)
   */
  async getGamesForDateRange(sport, startDate, endDate) {
    const games = [];
    const currentDate = new Date(startDate);
    const end = new Date(endDate);
    
    while (currentDate <= end && this.canMakeRequest()) {
      const dateStr = currentDate.toISOString().split('T')[0];
      
      try {
        const dayGames = await this.getGamesForTopLeagues(sport, dateStr);
        if (dayGames.response && dayGames.response.length > 0) {
          games.push(...dayGames.response);
        }
      } catch (error) {
        console.error(`[ApiSports] Failed to fetch games for ${dateStr}:`, error);
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
      
      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return {
      get: 'games',
      results: games.length,
      response: games,
      sport,
      dateRange: { startDate, endDate }
    };
  }

  /**
   * Get all available sports
   */
  getAvailableSports() {
    return Object.keys(this.endpoints).map(sport => ({
      id: sport,
      name: this.getSportDisplayName(sport),
      leagues: this.topLeagues[sport] || []
    }));
  }

  /**
   * Get display name for sport
   */
  getSportDisplayName(sport) {
    const names = {
      basketball: 'Basketball',
      football: 'Soccer',
      americanFootball: 'American Football',
      baseball: 'Baseball',
      hockey: 'Hockey'
    };
    return names[sport] || sport;
  }

  /**
   * Get top leagues for a sport
   */
  getTopLeagues(sport) {
    return this.topLeagues[sport] || [];
  }

  /**
   * Get current usage statistics
   */
  getUsageStats() {
    return {
      requestsUsed: this.requestCount,
      dailyLimit: this.dailyLimit,
      remainingRequests: this.dailyLimit - this.requestCount,
      percentageUsed: (this.requestCount / this.dailyLimit) * 100
    };
  }
}

// Create singleton instance
const apiSportsService = new ApiSportsService();

export default apiSportsService;
