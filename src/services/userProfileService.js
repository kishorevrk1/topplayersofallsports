/**
 * User Profile Service
 * Handles user profile operations, settings, and preferences
 * Production-ready implementation with proper error handling
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

class UserProfileService {
  constructor() {
    this.authToken = null;
  }

  setAuthToken(token) {
    this.authToken = token;
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    if (this.authToken) {
      config.headers.Authorization = `Bearer ${this.authToken}`;
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: `HTTP error! status: ${response.status}`
        }));
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('User Profile Service API Request failed:', error);
      throw error;
    }
  }

  /**
   * Get user profile
   */
  async getProfile(userId) {
    try {
      return await this.makeRequest(`/users/${userId}`);
    } catch (error) {
      console.error('Failed to get user profile:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(updates) {
    try {
      return await this.makeRequest('/users/profile', {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
    } catch (error) {
      console.error('Failed to update profile:', error);
      throw error;
    }
  }

  /**
   * Upload profile avatar
   */
  async uploadAvatar(file) {
    try {
      const formData = new FormData();
      formData.append('file', file);

      return await this.makeRequest('/users/profile/avatar', {
        method: 'POST',
        body: formData,
        headers: {
          // Don't set Content-Type for FormData, let browser set it
          // Authorization will be set by makeRequest method
        }
      });
    } catch (error) {
      console.error('Failed to upload avatar:', error);
      throw error;
    }
  }

  /**
   * Delete profile avatar
   */
  async deleteAvatar() {
    try {
      return await this.makeRequest('/users/avatar', {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Failed to delete avatar:', error);
      throw error;
    }
  }

  /**
   * Get user preferences
   */
  async getPreferences() {
    try {
      return await this.makeRequest('/users/preferences');
    } catch (error) {
      console.error('Failed to get preferences:', error);
      throw error;
    }
  }

  /**
   * Update user preferences
   */
  async updatePreferences(preferences) {
    try {
      return await this.makeRequest('/users/preferences', {
        method: 'PUT',
        body: JSON.stringify(preferences),
      });
    } catch (error) {
      console.error('Failed to update preferences:', error);
      throw error;
    }
  }

  /**
   * Get notification settings
   */
  async getNotificationSettings() {
    try {
      return await this.makeRequest('/users/notifications/settings');
    } catch (error) {
      console.error('Failed to get notification settings:', error);
      throw error;
    }
  }

  /**
   * Update notification settings
   */
  async updateNotificationSettings(settings) {
    try {
      return await this.makeRequest('/users/notifications/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });
    } catch (error) {
      console.error('Failed to update notification settings:', error);
      throw error;
    }
  }

  /**
   * Get privacy settings
   */
  async getPrivacySettings() {
    try {
      return await this.makeRequest('/users/privacy/settings');
    } catch (error) {
      console.error('Failed to get privacy settings:', error);
      throw error;
    }
  }

  /**
   * Update privacy settings
   */
  async updatePrivacySettings(settings) {
    try {
      return await this.makeRequest('/users/privacy/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });
    } catch (error) {
      console.error('Failed to update privacy settings:', error);
      throw error;
    }
  }

  /**
   * Change password
   */
  async changePassword(currentPassword, newPassword) {
    try {
      return await this.makeRequest('/users/password/change', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
    } catch (error) {
      console.error('Failed to change password:', error);
      throw error;
    }
  }

  /**
   * Enable two-factor authentication
   */
  async enableTwoFactor() {
    try {
      return await this.makeRequest('/users/2fa/enable', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Failed to enable 2FA:', error);
      throw error;
    }
  }

  /**
   * Disable two-factor authentication
   */
  async disableTwoFactor(code) {
    try {
      return await this.makeRequest('/users/2fa/disable', {
        method: 'POST',
        body: JSON.stringify({ code }),
      });
    } catch (error) {
      console.error('Failed to disable 2FA:', error);
      throw error;
    }
  }

  /**
   * Get user's favorite players
   */
  async getFavoritePlayers() {
    try {
      return await this.makeRequest('/users/favorites/players');
    } catch (error) {
      console.error('Failed to get favorite players:', error);
      throw error;
    }
  }

  /**
   * Add player to favorites
   */
  async addFavoritePlayer(playerId) {
    try {
      return await this.makeRequest('/users/favorites/players', {
        method: 'POST',
        body: JSON.stringify({ playerId }),
      });
    } catch (error) {
      console.error('Failed to add favorite player:', error);
      throw error;
    }
  }

  /**
   * Remove player from favorites
   */
  async removeFavoritePlayer(playerId) {
    try {
      return await this.makeRequest(`/users/favorites/players/${playerId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Failed to remove favorite player:', error);
      throw error;
    }
  }

  /**
   * Get user's favorite teams
   */
  async getFavoriteTeams() {
    try {
      return await this.makeRequest('/users/favorites/teams');
    } catch (error) {
      console.error('Failed to get favorite teams:', error);
      throw error;
    }
  }

  /**
   * Add team to favorites
   */
  async addFavoriteTeam(teamId) {
    try {
      return await this.makeRequest('/users/favorites/teams', {
        method: 'POST',
        body: JSON.stringify({ teamId }),
      });
    } catch (error) {
      console.error('Failed to add favorite team:', error);
      throw error;
    }
  }

  /**
   * Remove team from favorites
   */
  async removeFavoriteTeam(teamId) {
    try {
      return await this.makeRequest(`/users/favorites/teams/${teamId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Failed to remove favorite team:', error);
      throw error;
    }
  }

  /**
   * Get user activity history
   */
  async getActivityHistory(page = 1, limit = 20) {
    try {
      return await this.makeRequest(`/users/activity?page=${page}&limit=${limit}`);
    } catch (error) {
      console.error('Failed to get activity history:', error);
      throw error;
    }
  }

  /**
   * Get user's following list
   */
  async getFollowing() {
    try {
      return await this.makeRequest('/users/following');
    } catch (error) {
      console.error('Failed to get following list:', error);
      throw error;
    }
  }

  /**
   * Get user's followers
   */
  async getFollowers() {
    try {
      return await this.makeRequest('/users/followers');
    } catch (error) {
      console.error('Failed to get followers:', error);
      throw error;
    }
  }

  /**
   * Follow a user
   */
  async followUser(userId) {
    try {
      return await this.makeRequest('/users/follow', {
        method: 'POST',
        body: JSON.stringify({ userId }),
      });
    } catch (error) {
      console.error('Failed to follow user:', error);
      throw error;
    }
  }

  /**
   * Unfollow a user
   */
  async unfollowUser(userId) {
    try {
      return await this.makeRequest(`/users/follow/${userId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Failed to unfollow user:', error);
      throw error;
    }
  }

  /**
   * Delete user account
   */
  async deleteAccount(password) {
    try {
      return await this.makeRequest('/users/account/delete', {
        method: 'DELETE',
        body: JSON.stringify({ password }),
      });
    } catch (error) {
      console.error('Failed to delete account:', error);
      throw error;
    }
  }

  /**
   * Export user data
   */
  async exportUserData() {
    try {
      return await this.makeRequest('/users/data/export', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Failed to export user data:', error);
      throw error;
    }
  }
}

// Create singleton instance
const userProfileService = new UserProfileService();

export default userProfileService;
