/**
 * LiveMatchCard Component
 * 
 * Beautiful card for displaying live match information with:
 * - Live indicator with pulse animation
 * - Team logos and scores
 * - Match time and status
 * - Smooth hover effects
 * - Mobile-responsive design
 */

import React from 'react';
import { Clock, MapPin, User } from 'lucide-react';

const LiveMatchCard = ({ fixture, onClick }) => {
  const {
    homeTeam,
    awayTeam,
    homeScore,
    awayScore,
    status,
    statusLong,
    elapsedTime,
    isLive,
    league,
    venue,
    referee
  } = fixture;

  return (
    <div
      onClick={onClick}
      className="group relative bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl 
                 transition-all duration-300 cursor-pointer overflow-hidden border-2 border-transparent
                 hover:border-blue-500 dark:hover:border-blue-400"
    >
      {/* Live Indicator */}
      {isLive && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-red-600 to-red-500 
                        animate-pulse" />
      )}

      {/* Card Content */}
      <div className="p-4 sm:p-6">
        
        {/* League Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {/* Sport Icon */}
            <span className="text-base">
              {fixture.sport === 'basketball' ? '🏀' : '⚽'}
            </span>
            {league.logo && (
              <img
                src={league.logo}
                alt={league.name}
                className="w-5 h-5 sm:w-6 sm:h-6 object-contain"
              />
            )}
            <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
              {league.name}
            </span>
          </div>

          {/* Live Badge */}
          {isLive && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-500 rounded-full
                            animate-pulse">
              <div className="w-2 h-2 bg-white rounded-full animate-ping" />
              <span className="text-xs font-bold text-white">LIVE</span>
            </div>
          )}
        </div>

        {/* Match Score */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 mb-4">
          
          {/* Home Team */}
          <div className="flex flex-col items-center text-center">
            {homeTeam.logo && (
              <img
                src={homeTeam.logo}
                alt={homeTeam.name}
                className="w-12 h-12 sm:w-16 sm:h-16 object-contain mb-2
                           group-hover:scale-110 transition-transform duration-300"
              />
            )}
            <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white
                           line-clamp-2">
              {homeTeam.name}
            </h3>
          </div>

          {/* Score */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2 sm:gap-3">
              <span className={`text-3xl sm:text-4xl font-bold ${
                isLive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-800 dark:text-gray-200'
              }`}>
                {homeScore ?? '-'}
              </span>
              <span className="text-xl sm:text-2xl text-gray-400 font-medium">:</span>
              <span className={`text-3xl sm:text-4xl font-bold ${
                isLive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-800 dark:text-gray-200'
              }`}>
                {awayScore ?? '-'}
              </span>
            </div>

            {/* Match Time */}
            {isLive && elapsedTime && (
              <div className="mt-2 flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-700
                              rounded-full">
                <Clock className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  {elapsedTime}'
                </span>
              </div>
            )}
          </div>

          {/* Away Team */}
          <div className="flex flex-col items-center text-center">
            {awayTeam.logo && (
              <img
                src={awayTeam.logo}
                alt={awayTeam.name}
                className="w-12 h-12 sm:w-16 sm:h-16 object-contain mb-2
                           group-hover:scale-110 transition-transform duration-300"
              />
            )}
            <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white
                           line-clamp-2">
              {awayTeam.name}
            </h3>
          </div>
        </div>

        {/* Match Status */}
        <div className="text-center mb-3">
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
            isLive
              ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
              : status === 'FT'
              ? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
              : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
          }`}>
            {statusLong || status}
          </span>
        </div>

        {/* Match Details */}
        <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-gray-500 dark:text-gray-400">
          {venue?.name && (
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              <span className="truncate max-w-[150px]">{venue.name}</span>
            </div>
          )}
          {referee && (
            <div className="flex items-center gap-1">
              <User className="w-3 h-3" />
              <span className="truncate max-w-[120px]">{referee.split(',')[0]}</span>
            </div>
          )}
        </div>
      </div>

      {/* Hover Effect Gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 to-purple-500/0 
                      group-hover:from-blue-500/5 group-hover:to-purple-500/5 
                      transition-all duration-300 pointer-events-none rounded-xl" />
    </div>
  );
};

export default LiveMatchCard;
