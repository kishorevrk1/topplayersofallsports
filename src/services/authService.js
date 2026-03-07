const PLAYER_API = import.meta.env.VITE_PLAYER_API_URL || 'http://localhost:8084';

const authService = {
  /**
   * Exchange Google auth code for JWT tokens via our backend.
   * Called after Google redirects to /oauth/callback with ?code=
   */
  async loginWithGoogle(code, redirectUri) {
    const res = await fetch(`${PLAYER_API}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, redirectUri }),
    });
    if (!res.ok) {
      const err = await res.text().catch(() => 'Unknown error');
      throw new Error(`Google authentication failed: ${err}`);
    }
    return res.json(); // { accessToken, refreshToken, userId, email, name, role }
  },

  async refreshAccessToken(refreshToken) {
    const res = await fetch(`${PLAYER_API}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) throw new Error('Token refresh failed — please sign in again');
    return res.json();
  },

  async logout(refreshToken) {
    await fetch(`${PLAYER_API}/api/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    }).catch(() => {}); // logout is best-effort
  },

  async getMe() {
    const token = localStorage.getItem('access_token');
    if (!token) throw new Error('No access token');
    const res = await fetch(`${PLAYER_API}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Not authenticated');
    return res.json();
  },

  getAccessToken() {
    return localStorage.getItem('access_token');
  },
};

export default authService;
