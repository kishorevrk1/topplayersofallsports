/**
 * Sports Calendar Page - Simple & Clean
 * 
 * Features:
 * - Live matches with auto-refresh (15s)
 * - Sport filtering (Football, Basketball, All)
 * - Clean, minimal design
 */

import React from 'react';
import Header from '../../components/ui/Header';
import LiveCalendar from '../../components/calendar/LiveCalendar';

const SportsCalendarPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      {/* Simple Page Title */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Live Sports Calendar
          </h1>
        </div>
      </div>

      {/* Main Content */}
      <LiveCalendar />
    </div>
  );
};

export default SportsCalendarPage;
