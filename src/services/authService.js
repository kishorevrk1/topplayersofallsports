const PLAYER_API = import.meta.env.VITE_PLAYER_API_URL || 'http://localhost:8084';

let isRefreshing = false;
let refreshPromise = null;

const authService = {
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
    return res.json();
  },

  async refreshAccessToken() {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) throw new Error('No refresh token');

    const res = await fetch(`${PLAYER_API}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) throw new Error('Token refresh failed — please sign in again');
    const data = await res.json();

    localStorage.setItem('access_token', data.accessToken);
    localStorage.setItem('refresh_token', data.refreshToken);
    const userInfo = { id: data.userId, email: data.email, name: data.name, role: data.role };
    localStorage.setItem('auth_user', JSON.stringify(userInfo));
    return data;
  },

  async logout(refreshToken) {
    const token = refreshToken ?? localStorage.getItem('refresh_token');
    await fetch(`${PLAYER_API}/api/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: token }),
    }).catch(() => {});
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('auth_user');
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

  /**
   * Drop-in replacement for fetch() on authenticated endpoints.
   * Automatically retries with a fresh access token on 401.
   * On second 401 (refresh also failed), clears session and redirects to sign-in.
   */
  async fetchWithAuth(url, options = {}) {
    const makeRequest = () => {
      const token = localStorage.getItem('access_token');
      return fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
    };

    let response = await makeRequest();

    if (response.status === 401) {
      if (!isRefreshing) {
        isRefreshing = true;
        refreshPromise = authService.refreshAccessToken()
          .finally(() => {
            isRefreshing = false;
            refreshPromise = null;
          });
      }

      try {
        await refreshPromise;
        response = await makeRequest();
      } catch {
        await authService.logout();
        window.location.href = '/user-authentication?error=auth_failed';
        throw new Error('Session expired — redirecting to sign-in');
      }
    }

    return response;
  },
};

export default authService;
