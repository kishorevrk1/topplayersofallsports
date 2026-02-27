/**
 * FixtureCard Component
 * 
 * Modern, responsive card for displaying fixture information
 * with live updates, scores, and team logos
 */

import React from 'react';
import { Calendar, MapPin, Clock, Trophy, Users } from 'lucide-react';

const FixtureCard = ({ fixture, onClick }) => {
  const {
    homeTeam,
    awayTeam,
    homeScore,
    awayScore,
    homeTeamLogo,
    awayTeamLogo,
    status,
    statusLong,
    isLive,
    dateTime,
    venue,
    venueCity,
    league,
    round,
    elapsedTime
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

  // Format date
  const formatDate = (dateTimeStr) => {
    try {
      const date = new Date(dateTimeStr);
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      if (date.toDateString() === today.toDateString()) {
        return 'Today';
      } else if (date.toDateString() === tomorrow.toDateString()) {
        return 'Tomorrow';
      } else {
        return date.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric'
        });
      }
    } catch {
      return '';
    }
  };

  // Get status badge style
  const getStatusBadge = () => {
    if (isLive) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 animate-pulse">
          <span className="w-2 h-2 bg-red-500 rounded-full mr-1.5"></span>
          LIVE {elapsedTime && `• ${elapsedTime}'`}
        </span>
      );
    }

    if (status === 'FT' || status === 'AOT' || status === 'Finished') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          Final
        </span>
      );
    }

    if (status === 'NS' || status === 'Not Started') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <Clock className="w-3 h-3 mr-1" />
          {formatTime(dateTime)}
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        {statusLong || status}
      </span>
    );
  };

  return (
    <div
      onClick={onClick}
      className={`
        bg-white rounded-lg shadow-sm border border-gray-200 
        hover:shadow-md hover:border-gray-300 
        transition-all duration-200 cursor-pointer
        ${isLive ? 'ring-2 ring-red-500 ring-opacity-50' : ''}
      `}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Trophy className="w-4 h-4" />
          <span className="font-medium">{league}</span>
          {round && <span className="text-gray-400">• {round}</span>}
        </div>
        {getStatusBadge()}
      </div>

      {/* Teams and Scores */}
      <div className="px-4 py-4">
        {/* Home Team */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3 flex-1">
            {homeTeamLogo ? (
              <img
                src={homeTeamLogo}
                alt={homeTeam}
                className="w-8 h-8 object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                <Users className="w-4 h-4 text-gray-400" />
              </div>
            )}
            <span className="font-semibold text-gray-900">{homeTeam}</span>
          </div>
          {homeScore !== null && homeScore !== undefined && (
            <span className="text-2xl font-bold text-gray-900 ml-4">
              {homeScore}
            </span>
          )}
        </div>

        {/* VS Divider */}
        <div className="flex items-center justify-center my-2">
          <div className="h-px bg-gray-200 flex-1"></div>
          <span className="px-3 text-xs font-medium text-gray-400">VS</span>
          <div className="h-px bg-gray-200 flex-1"></div>
        </div>

        {/* Away Team */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center space-x-3 flex-1">
            {awayTeamLogo ? (
              <img
                src={awayTeamLogo}
                alt={awayTeam}
                className="w-8 h-8 object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                <Users className="w-4 h-4 text-gray-400" />
              </div>
            )}
            <span className="font-semibold text-gray-900">{awayTeam}</span>
          </div>
          {awayScore !== null && awayScore !== undefined && (
            <span className="text-2xl font-bold text-gray-900 ml-4">
              {awayScore}
            </span>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 bg-gray-50 rounded-b-lg border-t border-gray-100">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <div className="flex items-center space-x-4">
            {venue && venue !== 'TBD' && (
              <div className="flex items-center space-x-1">
                <MapPin className="w-3 h-3" />
                <span>{venue}{venueCity && `, ${venueCity}`}</span>
              </div>
            )}
            {!isLive && status === 'NS' && (
              <div className="flex items-center space-x-1">
                <Calendar className="w-3 h-3" />
                <span>{formatDate(dateTime)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FixtureCard;
