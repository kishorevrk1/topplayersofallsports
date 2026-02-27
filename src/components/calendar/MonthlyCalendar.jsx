/**
 * MonthlyCalendar Component
 * 
 * Traditional monthly calendar grid view with fixture indicators
 */

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const MonthlyCalendar = ({ fixtures = [], onDateSelect, selectedDate, onMonthChange }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Get days in month
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  // Get fixtures for a specific date
  const getFixturesForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return fixtures.filter(fixture => {
      const fixtureDate = new Date(fixture.dateTime).toISOString().split('T')[0];
      return fixtureDate === dateStr;
    });
  };

  // Count fixtures by status for a date
  const getFixtureStats = (date) => {
    const dayFixtures = getFixturesForDate(date);
    return {
      total: dayFixtures.length,
      live: dayFixtures.filter(f => f.isLive).length,
      upcoming: dayFixtures.filter(f => !f.isLive && f.status !== 'FT' && f.status !== 'Finished').length,
      finished: dayFixtures.filter(f => f.status === 'FT' || f.status === 'Finished').length
    };
  };

  // Navigate months
  const previousMonth = () => {
    const newMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    setCurrentMonth(newMonth);
    onMonthChange?.(newMonth);
  };

  const nextMonth = () => {
    const newMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    setCurrentMonth(newMonth);
    onMonthChange?.(newMonth);
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    onDateSelect?.(today);
  };

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentMonth);

  // Generate calendar days
  const calendarDays = [];
  
  // Previous month's trailing days
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }
  
  // Current month's days
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(new Date(year, month, day));
  }

  // Check if date is today
  const isToday = (date) => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Check if date is selected
  const isSelected = (date) => {
    if (!date || !selectedDate) return false;
    return date.toDateString() === selectedDate.toDateString();
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Calendar Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 border-b border-blue-800">
        <div className="flex items-center justify-between">
          <button
            onClick={previousMonth}
            className="p-1 hover:bg-white/10 rounded transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          
          <div className="text-center">
            <h2 className="text-lg font-bold text-white">
              {monthNames[month]} {year}
            </h2>
          </div>
          
          <button
            onClick={nextMonth}
            className="p-1 hover:bg-white/10 rounded transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        </div>
        
        <div className="mt-2 text-center">
          <button
            onClick={goToToday}
            className="text-xs text-white/90 hover:text-white hover:underline"
          >
            Go to Today
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        {/* Day Names */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map(day => (
            <div
              key={day}
              className="text-center text-xs font-semibold text-gray-600 py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((date, index) => {
            if (!date) {
              return <div key={`empty-${index}`} className="aspect-square" />;
            }

            const stats = getFixtureStats(date);
            const hasFixtures = stats.total > 0;
            const today = isToday(date);
            const selected = isSelected(date);

            const dayFixtures = getFixturesForDate(date);
            const topMatches = dayFixtures
              .sort((a, b) => (a.priority || 100) - (b.priority || 100))
              .slice(0, 2);

            return (
              <button
                key={date.toISOString()}
                onClick={() => onDateSelect?.(date)}
                className={`
                  relative p-1 rounded-lg border transition-all overflow-hidden
                  ${selected 
                    ? 'bg-blue-600 border-blue-700 text-white shadow-md' 
                    : today
                    ? 'bg-blue-50 border-blue-300 text-blue-900 font-bold'
                    : hasFixtures
                    ? 'bg-gray-50 border-gray-300 hover:bg-gray-100'
                    : 'border-gray-200 hover:bg-gray-50'
                  }
                  ${!hasFixtures && !today && !selected ? 'text-gray-400' : ''}
                  ${hasFixtures ? 'min-h-[100px]' : 'aspect-square'}
                `}
              >
                <div className="flex flex-col h-full">
                  {/* Day Number & Indicators */}
                  <div className="flex items-center justify-between mb-1">
                    <div className={`text-sm font-medium ${selected ? 'text-white' : ''}`}>
                      {date.getDate()}
                    </div>
                    
                    {/* Fixture Indicators */}
                    {hasFixtures && (
                      <div className="flex items-center space-x-0.5">
                        {stats.live > 0 && (
                          <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" title={`${stats.live} live`} />
                        )}
                        {stats.upcoming > 0 && (
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500" title={`${stats.upcoming} upcoming`} />
                        )}
                        {stats.finished > 0 && (
                          <div className="w-1.5 h-1.5 rounded-full bg-gray-400" title={`${stats.finished} finished`} />
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Top 2 Matches */}
                  {hasFixtures && topMatches.length > 0 && (
                    <div className="flex-1 space-y-1 text-left">
                      {topMatches.map((match, idx) => (
                        <div 
                          key={match.id || idx}
                          className={`
                            text-[9px] leading-tight p-0.5 rounded
                            ${selected 
                              ? 'bg-white/10 text-white' 
                              : 'bg-white text-gray-700'
                            }
                            ${match.isLive ? 'border-l-2 border-red-500' : ''}
                          `}
                        >
                          <div className="flex items-center justify-between">
                            <span className="truncate flex-1 font-medium">
                              {match.awayTeam?.substring(0, 10) || 'TBD'}
                            </span>
                            {match.isLive && (
                              <span className="text-[8px] text-red-500 font-bold ml-0.5">
                                {match.awayScore}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="truncate flex-1 font-medium">
                              {match.homeTeam?.substring(0, 10) || 'TBD'}
                            </span>
                            {match.isLive && (
                              <span className="text-[8px] text-red-500 font-bold ml-0.5">
                                {match.homeScore}
                              </span>
                            )}
                          </div>
                          {!match.isLive && (
                            <div className={`text-[8px] ${selected ? 'text-white/70' : 'text-gray-500'}`}>
                              {new Date(match.dateTime).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit'
                              })}
                            </div>
                          )}
                        </div>
                      ))}
                      
                      {/* More indicator */}
                      {stats.total > 2 && (
                        <div className={`text-[8px] text-center ${selected ? 'text-white/70' : 'text-gray-500'}`}>
                          +{stats.total - 2} more
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-center space-x-4 text-xs text-gray-600">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span>Live</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span>Upcoming</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 rounded-full bg-gray-400" />
              <span>Finished</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthlyCalendar;
