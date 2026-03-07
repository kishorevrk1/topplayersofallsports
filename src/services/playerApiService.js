/**
 * Player API Service
 * Connects frontend to the player-service backend
 */

const PLAYER_API_BASE_URL = import.meta.env.VITE_PLAYER_API_URL || 'http://localhost:8084';

class PlayerApiService {
    constructor() {
        this.baseUrl = PLAYER_API_BASE_URL;
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }

    /**
     * Check if cache is valid
     */
    isCacheValid(key) {
        const cached = this.cache.get(key);
        if (!cached) return false;
        return (Date.now() - cached.timestamp) < this.cacheTimeout;
    }

    /**
     * Make API request to backend
     */
    async makeRequest(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const cacheKey = url;

        // Check cache first (for GET requests)
        if (!options.method || options.method === 'GET') {
            if (this.isCacheValid(cacheKey)) {
                console.log(`[PlayerAPI] Using cached data for: ${endpoint}`);
                return this.cache.get(cacheKey).data;
            }
        }

        try {
            console.log(`[PlayerAPI] Fetching: ${url}`);

            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    ...options.headers
                },
                ...options
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            // Cache GET responses
            if (!options.method || options.method === 'GET') {
                this.cache.set(cacheKey, {
                    data,
                    timestamp: Date.now()
                });
            }

            console.log(`[PlayerAPI] ✅ Success: ${endpoint}`);
            return data;

        } catch (error) {
            console.error(`[PlayerAPI] ❌ Error: ${endpoint}`, error.message);
            throw error;
        }
    }

    /**
     * Get all players by sport
     */
    async getPlayersBySport(sport = 'FOOTBALL') {
        return this.makeRequest(`/api/players?sport=${sport.toUpperCase()}`);
    }

    /**
     * Get top-rated players by sport (with AI analysis)
     */
    async getTopPlayersBySport(sport = 'FOOTBALL') {
        return this.makeRequest(`/api/players/top?sport=${sport.toUpperCase()}`);
    }

    /**
     * Get player by ID
     */
    async getPlayerById(playerId) {
        return this.makeRequest(`/api/players/${playerId}`);
    }

    /**
     * Get AI analysis for a player
     */
    async getPlayerAnalysis(playerId) {
        return this.makeRequest(`/api/players/${playerId}/analysis`);
    }

    /**
     * Search players across name, team, nationality via the dedicated search endpoint.
     * Returns SearchResultsResponse: { players, total, page, pageSize, query }
     */
    async searchPlayers(q, sport = '', page = 0, size = 20) {
        const params = new URLSearchParams({ q, page, size });
        if (sport && sport !== 'all') params.set('sport', sport.toUpperCase());
        return this.makeRequest(`/api/search?${params}`);
    }

    /**
     * Register a new player (user-driven with AI)
     */
    async registerPlayer(playerName) {
        return this.makeRequest('/api/players/register', {
            method: 'POST',
            body: JSON.stringify({ playerName })
        });
    }

    /**
     * Get top 50 ranked players for a sport
     */
    async getTop50(sport = 'FOOTBALL') {
        return this.makeRequest(`/api/admin/players/rankings/top50/${sport.toUpperCase()}`);
    }

    /**
     * Get Top 100 All-Time Greatest Players for a sport.
     * Returns { sport, title, subtitle, count, players: [{id, rank, name, displayName, team,
     *   position, nationality, age, photoUrl, isActive, rating, aiRating, biography,
     *   strengths, careerHighlights}] }
     */
    async getTop100BySport(sport = 'FOOTBALL') {
        return this.makeRequest(`/api/players/top100/${sport.toUpperCase()}`);
    }

    /**
     * Get available Top 100 sports metadata (which sports have been seeded)
     */
    async getTop100Sports() {
        return this.makeRequest('/api/players/top100');
    }

    /**
     * Get ACR rating breakdown for a player (criteria scores, both model scores, confidence, evidence)
     */
    async getRatingBreakdown(playerId) {
        return this.makeRequest(`/api/players/${playerId}/rating/breakdown`);
    }

    /**
     * Get chronological rating history for a player (last 20 entries)
     */
    async getRatingHistory(playerId) {
        return this.makeRequest(`/api/players/${playerId}/rating/history`);
    }

    /**
     * Trigger a manual ACR re-evaluation for a player (admin)
     */
    async refreshRating(playerId) {
        return this.makeRequest(`/api/players/${playerId}/rating/refresh`, { method: 'POST' });
    }

    /**
     * Get confidence statistics for all rated players in a sport
     */
    async getConfidenceStats(sport = 'FOOTBALL') {
        return this.makeRequest(`/api/players/sport/${sport.toUpperCase()}/confidence-stats`);
    }

    /**
     * Check if backend is available
     */
    async checkHealth() {
        try {
            const response = await fetch(`${this.baseUrl}/actuator/health`, {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            });
            return response.ok;
        } catch (error) {
            console.warn('[PlayerAPI] Backend health check failed:', error.message);
            return false;
        }
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
        console.log('[PlayerAPI] Cache cleared');
    }

    /**
     * Transform backend player data to frontend format
     */
    transformPlayerForUI(player, analysis = null) {
        return {
            id: player.id,
            name: player.displayName || player.name,
            fullName: player.name,
            position: player.position || 'N/A',
            team: player.team || 'Unknown',
            sport: player.sport?.toLowerCase() || 'football',
            avatar: player.photoUrl || 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop&crop=face',
            nationality: player.nationality || 'Unknown',
            age: player.age || 'N/A',
            height: player.height || 'N/A',
            weight: player.weight || 'N/A',
            attributes: {
                overall: analysis?.aiRating || player.rankingScore || 80,
                offense: analysis?.aiRating ? Math.min(99, analysis.aiRating + 2) : 80,
                defense: analysis?.aiRating ? Math.max(60, analysis.aiRating - 5) : 75,
                athleticism: analysis?.aiRating ? Math.min(99, analysis.aiRating - 2) : 78
            },
            stats: {
                ppg: player.ppg || 0,
                rpg: player.rpg || 0,
                apg: player.apg || 0
            },
            trending: player.previousRank
                ? (player.previousRank > player.currentRank ? `+${player.previousRank - player.currentRank}` : `${player.previousRank - player.currentRank}`)
                : '+0%',
            experience: player.college ? `${player.college}` : 'Professional',
            rank: player.currentRank,
            biography: analysis?.biography || player.performanceSummary,
            strengths: analysis?.strengths || [],
            careerHighlights: analysis?.careerHighlights || [],
            isActive: player.isActive !== false
        };
    }
}

// Create singleton instance
const playerApiService = new PlayerApiService();

export default playerApiService;
