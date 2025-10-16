/**
 * Sports Calendar Feature - Main Export File
 * Best Practice: Clean feature exports for easy consumption
 */

// Main Components (excluding SportsCalendar to avoid circular imports)
export { SportSelector } from './components/SportSelector';
export { LeagueSelector } from './components/LeagueSelector';
export { TeamSelector } from './components/TeamSelector';
export { CalendarView } from './components/CalendarView';

// Hooks
export { useCalendarApi } from './hooks/useCalendarApi';

// Services
export { default as calendarService } from './services/calendarService';

// Constants
export * from './constants/calendar.constants';

// Types
export * from './types/calendar.types';

// Feature Configuration
export const SPORTS_CALENDAR_FEATURE = {
  name: 'sports-calendar',
  version: '1.0.0',
  description: 'Comprehensive sports calendar with user preferences and intelligent filtering',
  dependencies: [
    'react',
    'tailwindcss'
  ],
  apiEndpoints: [
    '/api/v1/calendar/preferences',
    '/api/v1/calendar/sports',
    '/api/v1/calendar/leagues', 
    '/api/v1/calendar/teams',
    '/api/v1/calendar/view',
    '/api/v1/calendar/quick-access'
  ],
  permissions: [
    'calendar:read',
    'calendar:write',
    'preferences:read',
    'preferences:write'
  ]
};
