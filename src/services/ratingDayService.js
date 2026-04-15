/**
 * Rating Day API Service
 * Handles all Rating Day voting, matchups, nominations, and results.
 */
import authService from './authService';

const API = import.meta.env.VITE_PLAYER_API_URL || 'http://localhost:8084';

const ratingDayService = {
  // ── Public endpoints (no auth) ─────────────────────────

  async getCurrentRatingDay(sport) {
    const res = await fetch(`${API}/api/rating-day/current/${sport.toUpperCase()}`);
    if (res.status === 204) return null;
    if (!res.ok) throw new Error(`Failed to fetch Rating Day: ${res.status}`);
    return res.json();
  },

  async getResults(ratingDayId) {
    const res = await fetch(`${API}/api/rating-day/${ratingDayId}/results`);
    if (!res.ok) throw new Error(`Failed to fetch results: ${res.status}`);
    return res.json();
  },

  async getHistory(sport) {
    const res = await fetch(`${API}/api/rating-day/${sport.toUpperCase()}/history`);
    if (!res.ok) throw new Error(`Failed to fetch history: ${res.status}`);
    return res.json();
  },

  async getNominations(sport) {
    const res = await fetch(`${API}/api/nominations/${sport.toUpperCase()}/current`);
    if (!res.ok) throw new Error(`Failed to fetch nominations: ${res.status}`);
    return res.json();
  },

  // ── Authenticated endpoints ────────────────────────────

  async getNextMatchup(ratingDayId) {
    const res = await authService.fetchWithAuth(
      `${API}/api/rating-day/${ratingDayId}/matchup`
    );
    if (res.status === 204) return null;
    if (!res.ok) throw new Error(`Failed to fetch matchup: ${res.status}`);
    return res.json();
  },

  async submitVote(ratingDayId, player1Id, player2Id, winnerId) {
    const res = await authService.fetchWithAuth(
      `${API}/api/rating-day/${ratingDayId}/vote`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player1Id, player2Id, winnerId }),
      }
    );
    if (!res.ok) {
      const err = await res.text().catch(() => '');
      throw new Error(err || `Vote failed: ${res.status}`);
    }
    return res.json();
  },

  async skipMatchup(ratingDayId, player1Id, player2Id) {
    const res = await authService.fetchWithAuth(
      `${API}/api/rating-day/${ratingDayId}/skip`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player1Id, player2Id, winnerId: player1Id }),
      }
    );
    if (res.status === 204) return null;
    if (!res.ok) throw new Error(`Skip failed: ${res.status}`);
    return res.json();
  },

  async getMyVotes(ratingDayId) {
    const res = await authService.fetchWithAuth(
      `${API}/api/rating-day/${ratingDayId}/my-votes`
    );
    if (!res.ok) throw new Error(`Failed to fetch votes: ${res.status}`);
    return res.json();
  },

  async submitNomination(sport, playerName, reason) {
    const res = await authService.fetchWithAuth(
      `${API}/api/nominations`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sport: sport.toUpperCase(), playerName, reason }),
      }
    );
    if (!res.ok) {
      const err = await res.text().catch(() => '');
      throw new Error(err || `Nomination failed: ${res.status}`);
    }
    return res.json();
  },

  async supportNomination(nominationId) {
    const res = await authService.fetchWithAuth(
      `${API}/api/nominations/${nominationId}/support`,
      { method: 'POST' }
    );
    if (!res.ok) {
      const err = await res.text().catch(() => '');
      throw new Error(err || `Support failed: ${res.status}`);
    }
    return res.json();
  },
};

export default ratingDayService;
