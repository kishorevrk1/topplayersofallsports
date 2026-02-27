/**
 * FixtureRow Component
 * 
 * Calendar-style row for displaying fixtures in a table format
 * Clean, minimal design without logos
 */

import React from 'react';
import { Clock, MapPin } from 'lucide-react';

const FixtureRow = ({ fixture, onClick }) => {
  const {
    homeTeam,
    awayTeam,
    homeScore,
    awayScore,
    status,
    isLive,
    dateTime,
    venue,
    league,
    sport,
    priority
  } = fixture;

  // Format time
  const formatTime = (dateTimeStr) => {
    try {
      const date = new Date(dateTimeStr);
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return 'TBD';
    }
  };

  // Get sport emoji
  const getSportEmoji = (sportName) => {
    const emojis = {
      'nba': '🏀',
      'nfl': '🏈',
      'football': '⚽',
      'soccer': '⚽',
      'hockey': '🏒',
      'baseball': '⚾'
    };
    return emojis[sportName?.toLowerCase()] || '🏆';
  };

  // Get status display
  const getStatusDisplay = () => {
    if (isLive) {
      return (
        <span className="inline-flex items-center text-red-600 font-semibold">
          <span className="relative flex h-2 w-2 mr-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
          LIVE
        </span>
      );
    }

    if (status === 'FT' || status === 'AOT' || status === 'Finished') {
      return <span className="text-gray-500 text-sm">FT</span>;
    }

    if (status === 'NS' || status === 'Not Started' || !homeScore) {
      return <span className="text-gray-600 text-sm">{formatTime(dateTime)}</span>;
    }

    return <span className="text-gray-600 text-sm">{status}</span>;
  };

  // Check if game has started
  const hasStarted = homeScore !== null && homeScore !== undefined;

  // Get priority badge
  const isPriority = priority && priority < 20;

  return (
    <div
      onClick={onClick}
      className={`
        flex items-center justify-between px-4 py-3 
        hover:bg-gray-50 transition-colors cursor-pointer
        border-b border-gray-100 last:border-b-0
        ${isLive ? 'bg-red-50 hover:bg-red-100' : ''}
        ${isPriority ? 'bg-blue-50/30' : ''}
      `}
    >
      {/* Time/Status Column */}
      <div className="flex items-center space-x-3 min-w-[100px]">
        <div className="text-center">
          {getStatusDisplay()}
        </div>
      </div>

      {/* Sport Icon */}
      <div className="text-xl min-w-[40px] text-center">
        {getSportEmoji(sport)}
      </div>

      {/* Teams Column */}
      <div className="flex-1 min-w-0 px-4">
        <div className="flex items-center justify-between space-x-4">
          {/* Away Team */}
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            <span className={`
              font-medium truncate
              ${hasStarted && awayScore > homeScore ? 'text-gray-900 font-semibold' : 'text-gray-700'}
            `}>
              {awayTeam}
            </span>
            {hasStarted && (
              <span className={`
                text-lg font-bold min-w-[24px] text-center
                ${awayScore > homeScore ? 'text-gray-900' : 'text-gray-500'}
              `}>
                {awayScore}
              </span>
            )}
          </div>

          {/* VS Separator */}
          <span className="text-gray-400 text-sm font-medium px-2">vs</span>

          {/* Home Team */}
          <div className="flex items-center space-x-2 flex-1 min-w-0 justify-end">
            {hasStarted && (
              <span className={`
                text-lg font-bold min-w-[24px] text-center
                ${homeScore > awayScore ? 'text-gray-900' : 'text-gray-500'}
              `}>
                {homeScore}
              </span>
            )}
            <span className={`
              font-medium truncate
              ${hasStarted && homeScore > awayScore ? 'text-gray-900 font-semibold' : 'text-gray-700'}
            `}>
              {homeTeam}
            </span>
          </div>
        </div>

        {/* League & Venue Info */}
        <div className="flex items-center space-x-3 mt-1 text-xs text-gray-500">
          <span className="truncate">{league}</span>
          {venue && venue !== 'TBD' && (
            <>
              <span>•</span>
              <span className="flex items-center truncate">
                <MapPin className="w-3 h-3 mr-1" />
                {venue}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Priority Badge */}
      {isPriority && (
        <div className="ml-2">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            ⭐
          </span>
        </div>
      )}
    </div>
  );
};

export default FixtureRow;
