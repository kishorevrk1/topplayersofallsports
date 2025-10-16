/**
 * Sports Calendar Feature Constants
 * Best Practice: Centralized constants for maintainability
 */

// API Endpoints
export const CALENDAR_API_ENDPOINTS = {
  BASE: '/api/v1/calendar',
  USER_PREFERENCES: '/api/v1/calendar/preferences',
  SPORTS: '/api/v1/calendar/sports',
  LEAGUES: '/api/v1/calendar/leagues',
  TEAMS: '/api/v1/calendar/teams',
  CALENDAR_VIEW: '/api/v1/calendar/view',
  QUICK_ACCESS: '/api/v1/calendar/quick-access'
};

// View Types
export const VIEW_TYPES = {
  UPCOMING: 'upcoming',
  LIVE: 'live',
  WEEK: 'week',
  MONTH: 'month',
  DAY: 'day'
};

// Match Status
export const MATCH_STATUS = {
  SCHEDULED: 'SCHEDULED',
  LIVE: 'LIVE',
  FINISHED: 'FINISHED',
  CANCELLED: 'CANCELLED',
  POSTPONED: 'POSTPONED'
};

// Time Ranges
export const TIME_RANGES = {
  TODAY: 'today',
  TOMORROW: 'tomorrow',
  THIS_WEEK: 'thisWeek',
  THIS_MONTH: 'thisMonth',
  NEXT_WEEK: 'nextWeek',
  NEXT_MONTH: 'nextMonth'
};

// Default Values
export const DEFAULTS = {
  PAGE_SIZE: 20,
  SPORT: null,
  LEAGUE: null,
  TEAM: null,
  VIEW_TYPE: VIEW_TYPES.UPCOMING,
  REFRESH_INTERVAL: 30000, // 30 seconds for live updates
  CACHE_TTL: 300000, // 5 minutes cache
  MAX_QUICK_ACCESS_ITEMS: 10
};

// User Preference Keys
export const PREFERENCE_KEYS = {
  DEFAULT_SPORT: 'defaultSport',
  FAVORITE_LEAGUES: 'favoriteLeagues',
  FAVORITE_TEAMS: 'favoriteTeams',
  DEFAULT_VIEW: 'defaultView',
  TIME_ZONE: 'timeZone',
  NOTIFICATION_PREFERENCES: 'notificationPreferences'
};

// Error Messages
export const ERROR_MESSAGES = {
  LOAD_PREFERENCES_FAILED: 'Failed to load user preferences',
  LOAD_SPORTS_FAILED: 'Failed to load available sports',
  LOAD_LEAGUES_FAILED: 'Failed to load leagues',
  LOAD_TEAMS_FAILED: 'Failed to load teams',
  LOAD_MATCHES_FAILED: 'Failed to load matches',
  UPDATE_PREFERENCES_FAILED: 'Failed to update preferences',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'Please login to access this feature'
};

// Success Messages
export const SUCCESS_MESSAGES = {
  PREFERENCES_UPDATED: 'Preferences updated successfully',
  FAVORITES_ADDED: 'Added to favorites',
  FAVORITES_REMOVED: 'Removed from favorites'
};

// Loading States
export const LOADING_STATES = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error'
};

// CSS Classes
export const CSS_CLASSES = {
  MATCH_CARD_BASE: 'match-card',
  MATCH_CARD_LIVE: 'match-card live',
  MATCH_CARD_FINISHED: 'match-card finished',
  MATCH_CARD_UPCOMING: 'match-card upcoming',
  SELECTOR_BASE: 'selector',
  SELECTOR_DISABLED: 'selector disabled',
  LOADING_SPINNER: 'loading-spinner',
  ERROR_STATE: 'error-state',
  EMPTY_STATE: 'empty-state'
};

// Animation Durations
export const ANIMATIONS = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
  LOADING_DEBOUNCE: 300
};

// Breakpoints (matching Tailwind CSS)
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536
};

// Sports Categories
export const SPORTS_CATEGORIES = {
  POPULAR: 'popular',
  FOOTBALL: 'football',
  BASKETBALL: 'basketball',
  BASEBALL: 'baseball',
  SOCCER: 'soccer',
  HOCKEY: 'hockey',
  TENNIS: 'tennis',
  GOLF: 'golf',
  OTHER: 'other'
};

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy',
  API: 'yyyy-MM-dd',
  TIME: 'HH:mm',
  DATETIME: 'yyyy-MM-dd HH:mm:ss',
  RELATIVE: 'relative' // for "Today", "Tomorrow", etc.
};
