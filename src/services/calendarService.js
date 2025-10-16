// Calendar Service - wraps backend /api/sports-calendar endpoints with consistent patterns
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const SPORT_UI_TO_API = {
  nba: 'basketball',
  nfl: 'americanFootball',
  mlb: 'baseball',
  nhl: 'hockey',
  soccer: 'football',
  tennis: 'tennis',
  golf: 'golf',
  all: 'all',
};

const SPORT_API_TO_UI = {
  basketball: 'nba',
  americanFootball: 'nfl',
  baseball: 'mlb',
  hockey: 'nhl',
  football: 'soccer',
  tennis: 'tennis',
  golf: 'golf',
};

class CalendarService {
  constructor() {
    this.authToken = null;
    this.base = `${API_BASE_URL}/sports-calendar`;
    this.timeoutMs = 15000;
  }

  setAuthToken(token) { this.authToken = token; }

  async _fetch(path, { method = 'GET', headers = {}, body } = {}) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), this.timeoutMs);

    const init = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      signal: controller.signal,
    };
    if (this.authToken) init.headers.Authorization = `Bearer ${this.authToken}`;
    if (body) init.body = JSON.stringify(body);

    try {
      const res = await fetch(path, init);
      clearTimeout(id);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text}`);
      }
      return await res.json();
    } catch (e) {
      clearTimeout(id);
      console.error('CalendarService error:', e);
      throw e;
    }
  }

  mapUiSportToApi(uiSport) {
    return SPORT_UI_TO_API[uiSport] || uiSport;
  }
  mapApiSportToUi(apiSport) {
    return SPORT_API_TO_UI[apiSport] || apiSport || 'soccer';
  }

  // Normalize a game payload from backend to UI event structure
  normalizeGame(g, fallbackUiSport, selectedLeague) {
    const uiSport = fallbackUiSport === 'all' ? this.mapApiSportToUi(g.sport) : fallbackUiSport;

    // Time and date
    const date = g.gameDate || g.date || g.startDate || g.utcDate || null;
    // Prefer explicit gameTime; else derive from ISO timestamp
    let time = g.gameTime || g.time || null;
    if (!time && (g.startTime || g.utcDate || g.kickoff)) {
      const t = new Date(g.startTime || g.utcDate || g.kickoff);
      if (!isNaN(t)) {
        const hh = String(t.getHours()).padStart(2, '0');
        const mm = String(t.getMinutes()).padStart(2, '0');
        time = `${hh}:${mm}`;
      }
    }
    if (!time) time = '19:00';

    // Team logos (various field names supported)
    const homeLogo = g.homeTeamLogo || g.homeLogo || g.homeTeam?.logo || g.teams?.home?.logo || '';
    const awayLogo = g.awayTeamLogo || g.awayLogo || g.awayTeam?.logo || g.teams?.away?.logo || '';

    // Broadcasters
    const broadcast = Array.isArray(g.broadcast)
      ? g.broadcast
      : (g.broadcasters || g.tvStations || g.channels || []).filter(Boolean);

    // Status and extra context
    const status = g.status || g.gameStatus || g.stage || '';
    const referee = g.referee || g.official || g.matchOfficial || undefined;
    const round = g.round || g.week || g.matchday || undefined;
    const standings = g.standingsContext || g.rankingContext || undefined;

    return {
      id: g.id ?? g.gameId ?? `${date}-${g.homeTeamName || g.homeTeam}-${g.awayTeamName || g.awayTeam}`,
      title: `${g.homeTeamName || g.homeTeam} vs ${g.awayTeamName || g.awayTeam}`,
      sport: uiSport,
      league: g.leagueName || selectedLeague,
      date,
      time,
      venue: g.venueName || g.venue || g.stadium || 'TBD',
      teams: [g.homeTeamName || g.homeTeam, g.awayTeamName || g.awayTeam].filter(Boolean),
      logos: [homeLogo, awayLogo],
      importance: g.isPlayoff ? 'high' : 'medium',
      type: g.isPlayoff ? 'playoff' : 'regular',
      description: status,
      broadcast,
      tickets: { available: Boolean(g.ticketsAvailable), price: g.ticketPrice || '—' },
      referee,
      round,
      standings,
    };
  }

  async getSports() {
    // Return backend sports if available; else fallback to fixed UI options
    try {
      const data = await this._fetch(`${this.base}/sports`);
      return Array.isArray(data) ? data : [];
    } catch {
      return [
        { id: 'nba', name: 'Basketball', color: 'bg-orange-500' },
        { id: 'nfl', name: 'Football', color: 'bg-amber-700' },
        { id: 'mlb', name: 'Baseball', color: 'bg-blue-500' },
        { id: 'nhl', name: 'Hockey', color: 'bg-cyan-600' },
        { id: 'soccer', name: 'Soccer', color: 'bg-green-600' },
        { id: 'tennis', name: 'Tennis', color: 'bg-lime-600' },
        { id: 'golf', name: 'Golf', color: 'bg-emerald-600' },
      ];
    }
  }

  async getLeagues(sport, topLeaguesOnly = true) {
    const params = new URLSearchParams();
    if (sport && sport !== 'all') params.set('sport', sport);
    params.set('topLeaguesOnly', String(topLeaguesOnly));
    return this._fetch(`${this.base}/leagues?${params.toString()}`);
  }

  async getGamesByDate({ sport, date, leagueId }) {
    const params = new URLSearchParams();
    if (sport && sport !== 'all') params.set('sport', sport);
    if (date) params.set('date', date);
    if (leagueId) params.set('leagueId', leagueId);
    return this._fetch(`${this.base}/games?${params.toString()}`);
  }

  async getGamesByRange({ sport, startDate, endDate, leagueIds }) {
    const params = new URLSearchParams();
    if (sport && sport !== 'all') params.set('sport', sport);
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    if (Array.isArray(leagueIds)) {
      leagueIds.forEach(id => params.append('leagueIds', id));
    }
    return this._fetch(`${this.base}/games/range?${params.toString()}`);
  }

  async getLiveGames(sport) {
    const params = new URLSearchParams();
    if (sport && sport !== 'all') params.set('sport', sport);
    return this._fetch(`${this.base}/games/live?${params.toString()}`);
  }

  async getUpcomingGames(sport, days = 7) {
    const params = new URLSearchParams();
    if (sport && sport !== 'all') params.set('sport', sport);
    params.set('days', String(days));
    return this._fetch(`${this.base}/games/upcoming?${params.toString()}`);
  }
}

const calendarService = new CalendarService();
export default calendarService;
