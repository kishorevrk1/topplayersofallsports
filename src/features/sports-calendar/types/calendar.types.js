/**
 * Sports Calendar Feature Type Definitions
 * Best Practice: Centralized type definitions for consistency
 */

// User Preferences Types
export const UserPreferencesType = {
  userId: 'string',
  defaultSport: 'string|null',
  favoriteLeagues: 'string[]',
  favoriteTeams: 'string[]',
  defaultView: 'string',
  timeZone: 'string',
  notificationPreferences: 'object'
};

// Sport Types
export const SportType = {
  id: 'number',
  name: 'string',
  displayName: 'string',
  leagueCount: 'number',
  isPopular: 'boolean',
  category: 'string'
};

// League Types
export const LeagueType = {
  id: 'number',
  name: 'string',
  displayName: 'string',
  sport: 'string',
  country: 'string',
  currentSeason: 'string',
  isTopLeague: 'boolean',
  priority: 'number',
  logo: 'string|null',
  teamCount: 'number',
  isFavorite: 'boolean'
};

// Team Types
export const TeamType = {
  id: 'number',
  name: 'string',
  displayName: 'string',
  shortName: 'string',
  logo: 'string|null',
  country: 'string',
  city: 'string|null',
  isActive: 'boolean',
  isFavorite: 'boolean',
  leagueId: 'number'
};

// Match/Game Types
export const MatchType = {
  id: 'number',
  homeTeam: 'string',
  awayTeam: 'string',
  homeTeamLogo: 'string|null',
  awayTeamLogo: 'string|null',
  homeScore: 'number|null',
  awayScore: 'number|null',
  dateTime: 'string',
  status: 'string',
  venue: 'string|null',
  leagueName: 'string',
  sportName: 'string',
  round: 'string|null',
  season: 'string',
  isLive: 'boolean',
  liveMinute: 'number|null'
};

// Calendar View Types
export const CalendarViewType = {
  viewType: 'string',
  date: 'string',
  filters: 'object',
  matches: 'MatchType[]',
  totalMatches: 'number',
  metadata: 'object',
  timestamp: 'string'
};

// API Response Types
export const ApiResponseType = {
  success: 'boolean',
  data: 'any',
  message: 'string|null',
  error: 'string|null',
  timestamp: 'string'
};

// Selector Option Types
export const SelectorOptionType = {
  value: 'string|number',
  label: 'string',
  subtitle: 'string|null',
  icon: 'string|null',
  isFavorite: 'boolean',
  isRecommended: 'boolean',
  disabled: 'boolean'
};

// Filter State Types
export const FilterStateType = {
  selectedSport: 'string|null',
  selectedLeague: 'string|null',
  selectedTeam: 'string|null',
  viewMode: 'string',
  dateRange: 'object|null',
  isLoading: 'boolean',
  error: 'string|null'
};

// Pagination Types
export const PaginationType = {
  page: 'number',
  size: 'number',
  totalElements: 'number',
  totalPages: 'number',
  hasMore: 'boolean',
  isLast: 'boolean'
};

// Calendar State Types
export const CalendarStateType = {
  userPreferences: 'UserPreferencesType|null',
  filters: 'FilterStateType',
  matches: 'MatchType[]',
  pagination: 'PaginationType',
  loading: 'object',
  errors: 'object',
  cache: 'object'
};

// Hook Return Types
export const UseCalendarApiReturnType = {
  getUserPreferences: 'function',
  getAvailableSports: 'function',
  getLeagues: 'function',
  getTeams: 'function',
  getCalendarView: 'function',
  updateUserPreferences: 'function',
  loading: 'object',
  error: 'object'
};

// Component Prop Types
export const SportSelectorPropsType = {
  selectedSport: 'string|null',
  onSportChange: 'function',
  userPreferences: 'UserPreferencesType|null',
  loading: 'boolean',
  error: 'string|null'
};

export const LeagueSelectorPropsType = {
  selectedSport: 'string|null',
  selectedLeague: 'string|null',
  onLeagueChange: 'function',
  userPreferences: 'UserPreferencesType|null',
  loading: 'boolean',
  error: 'string|null'
};

export const TeamSelectorPropsType = {
  selectedSport: 'string|null',
  selectedLeague: 'string|null',
  selectedTeam: 'string|null',
  onTeamChange: 'function',
  userPreferences: 'UserPreferencesType|null',
  loading: 'boolean',
  error: 'string|null'
};

export const CalendarViewPropsType = {
  selectedSport: 'string|null',
  selectedLeague: 'string|null',
  selectedTeam: 'string|null',
  viewMode: 'string',
  onViewModeChange: 'function',
  userPreferences: 'UserPreferencesType|null'
};

// Event Types
export const CalendarEventType = {
  type: 'string',
  payload: 'any',
  timestamp: 'string',
  source: 'string'
};

// Error Types
export const CalendarErrorType = {
  code: 'string',
  message: 'string',
  details: 'object|null',
  timestamp: 'string',
  recoverable: 'boolean'
};

// Cache Types
export const CacheEntryType = {
  key: 'string',
  data: 'any',
  timestamp: 'number',
  ttl: 'number',
  hits: 'number'
};

// Validation Schema Types
export const ValidationSchemaType = {
  field: 'string',
  rules: 'object[]',
  message: 'string',
  required: 'boolean'
};

// Quick Access Types
export const QuickAccessItemType = {
  id: 'string',
  title: 'string',
  subtitle: 'string|null',
  action: 'function',
  icon: 'string',
  badge: 'string|number|null',
  priority: 'number'
};

// Export all types for easy importing
export const CalendarTypes = {
  UserPreferencesType,
  SportType,
  LeagueType,
  TeamType,
  MatchType,
  CalendarViewType,
  ApiResponseType,
  SelectorOptionType,
  FilterStateType,
  PaginationType,
  CalendarStateType,
  UseCalendarApiReturnType,
  SportSelectorPropsType,
  LeagueSelectorPropsType,
  TeamSelectorPropsType,
  CalendarViewPropsType,
  CalendarEventType,
  CalendarErrorType,
  CacheEntryType,
  ValidationSchemaType,
  QuickAccessItemType
};
