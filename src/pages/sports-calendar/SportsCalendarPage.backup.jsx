/**
 * Sports Calendar Page - Live-First Experience
 * 
 * Features:
 * - Real-time live matches with auto-refresh (15s)
 * - Beautiful modern UI with animations
 * - Responsive design (mobile-first)
 * - Live indicators and smooth transitions
 * - Loading states and error handling
 * - Empty states with helpful messages
 */

import React, { useState } from 'react';
import { Activity, TrendingUp } from 'lucide-react';
import Header from '../../components/ui/Header';
import LiveCalendar from '../../components/calendar/LiveCalendar';

// Top Football Leagues (Live-First Strategy)
const FEATURED_LEAGUES = [
  { id: 39, name: 'Premier League', country: 'England', icon: '⚽' },
  { id: 140, name: 'La Liga', country: 'Spain', icon: '⚽' },
  { id: 2, name: 'Champions League', country: 'Europe', icon: '🏆' },
  { id: 1, name: 'World Cup', country: 'World', icon: '🌍' },
];

const SportsCalendarPage = () => {
  const [activeTab, setActiveTab] = useState('live'); // 'live' or 'upcoming'

  // Format date for API
  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  // Fetch fixtures for selected date and sport
  const {
    fixtures,
    loading,
    error,
    lastUpdated,
    liveFixtures,
    upcomingFixtures,
    finishedFixtures,
    refresh,
    hasLiveGames
  } = useCalendarFixtures({
    sport: selectedSport === 'all' ? null : selectedSport,
    date: formatDate(selectedDate),
    autoRefresh: false, // Will be enabled after first render
    refreshInterval: 30000, // 30 seconds
    enabled: true
  });

  // Enable auto-refresh when live games are detected
  useEffect(() => {
    if (hasLiveGames) {
      // Auto-refresh is handled by the hook
    }
  }, [hasLiveGames]);

  // Fetch live games separately for live indicator
  // Pass null to get all sports for the indicator count
  const { fixtures: allLiveGames } = useLiveFixtures(null, 15000);
  
  // Filter live games by selected sport if not 'all'
  const filteredLiveGames = selectedSport === 'all' 
    ? allLiveGames 
    : allLiveGames.filter(game => game.sport === selectedSport);

  // Fetch fixtures for entire month for calendar grid
  const { fixtures: monthlyFixtures } = useMonthlyFixtures({
    sport: selectedSport === 'all' ? null : selectedSport,
    month: selectedDate.getMonth(),
    year: selectedDate.getFullYear(),
    enabled: true
  });

  // Navigate to previous day
  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  // Navigate to next day
  const goToNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  // Go to today
  const goToToday = () => {
    setSelectedDate(new Date());
  };

  // Format date for display
  const formatDisplayDate = (date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    }
  };

  // Get fixtures to display
  const displayFixtures = showLiveOnly ? liveFixtures : fixtures;

  // Group fixtures by status
  const groupedFixtures = {
    live: liveFixtures,
    upcoming: upcomingFixtures,
    finished: finishedFixtures
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <CalendarIcon className="w-8 h-8 mr-3 text-blue-600" />
                Sports Calendar
              </h1>
              <p className="text-gray-600 mt-1">
                View live scores and upcoming games across all sports
              </p>
            </div>

            {/* Live Indicator */}
            {allLiveGames.length > 0 && (
              <div className="flex items-center space-x-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
                <span className="text-sm font-medium text-red-800">
                  {allLiveGames.length} Live {allLiveGames.length === 1 ? 'Game' : 'Games'}
                </span>
              </div>
            )}
          </div>

          {/* Sport Filters */}
          <div className="flex flex-wrap gap-2 mb-4">
            {SPORTS.map((sport) => (
              <button
                key={sport.id}
                onClick={() => setSelectedSport(sport.id)}
                className={`
                  px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200
                  flex items-center space-x-2
                  ${
                    selectedSport === sport.id
                      ? `${sport.color} text-white shadow-md`
                      : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-400'
                  }
                `}
              >
                <span>{sport.icon}</span>
                <span>{sport.name}</span>
              </button>
            ))}
          </div>

          {/* Date Navigation */}
          <div className="flex items-center justify-between bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <button
              onClick={goToPreviousDay}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ← Previous
            </button>

            <div className="flex items-center space-x-4">
              <span className="text-lg font-semibold text-gray-900">
                {formatDisplayDate(selectedDate)}
              </span>
              {selectedDate.toDateString() !== new Date().toDateString() && (
                <button
                  onClick={goToToday}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Today
                </button>
              )}
            </div>

            <button
              onClick={goToNextDay}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Next →
            </button>
          </div>

          {/* Filter Controls */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center space-x-4">
              {hasLiveGames && (
                <button
                  onClick={() => setShowLiveOnly(!showLiveOnly)}
                  className={`
                    px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200
                    flex items-center space-x-2
                    ${
                      showLiveOnly
                        ? 'bg-red-600 text-white'
                        : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-400'
                    }
                  `}
                >
                  <Filter className="w-4 h-4" />
                  <span>{showLiveOnly ? 'Show All' : 'Live Only'}</span>
                </button>
              )}
            </div>

            <button
              onClick={refresh}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {lastUpdated && (
            <p className="text-xs text-gray-500 mt-2">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - Monthly Calendar + Selected Date Fixtures */}
          <div className="lg:col-span-8 space-y-6">
            {/* Monthly Calendar Grid */}
            <MonthlyCalendar
              fixtures={monthlyFixtures}
              selectedDate={selectedDate}
              onDateSelect={(date) => setSelectedDate(date)}
              onMonthChange={(newMonth) => {
                // Update selected date to first day of new month to trigger refetch
                setSelectedDate(new Date(newMonth.getFullYear(), newMonth.getMonth(), 1));
              }}
            />

            {/* Selected Date Fixtures */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {formatDisplayDate(selectedDate)}
              </h2>

              {loading && fixtures.length === 0 ? (
                <div className="flex items-center justify-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="text-center">
                    <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Loading fixtures...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                  <div className="flex items-center space-x-3">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                    <div>
                      <h3 className="text-red-900 font-semibold">Error Loading Fixtures</h3>
                      <p className="text-red-700 text-sm mt-1">{error}</p>
                    </div>
                  </div>
                </div>
              ) : displayFixtures.length === 0 && filteredLiveGames.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <CalendarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No {showLiveOnly ? 'Live ' : ''}Games Found
            </h3>
            <p className="text-gray-600 mb-4">
              {showLiveOnly
                ? 'There are no live games at the moment.'
                : `No games scheduled for ${formatDisplayDate(selectedDate)}.`}
            </p>
            <p className="text-sm text-gray-500">
              Try selecting a different date or check back later.
            </p>
          </div>
        ) : displayFixtures.length === 0 && filteredLiveGames.length > 0 ? (
          <div className="space-y-8">
            {/* Show live games even if no fixtures for selected date */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <p className="text-blue-800 text-sm">
                  No fixtures scheduled for {formatDisplayDate(selectedDate)}, but there are {filteredLiveGames.length} live {selectedSport === 'all' ? '' : selectedSport} games happening now!
                </p>
                <button
                  onClick={() => setSelectedDate(new Date('2025-11-06'))}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap ml-4"
                >
                  View Nov 6 Fixtures
                </button>
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="relative flex h-3 w-3 mr-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
                Live Now ({filteredLiveGames.length})
              </h2>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {filteredLiveGames.map((fixture) => (
                  <FixtureRow key={fixture.id} fixture={fixture} />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Live Games */}
            {!showLiveOnly && groupedFixtures.live.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <span className="relative flex h-3 w-3 mr-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                  Live Now ({groupedFixtures.live.length})
                </h2>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  {groupedFixtures.live.map((fixture) => (
                    <FixtureRow key={fixture.id} fixture={fixture} />
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming Games */}
            {!showLiveOnly && groupedFixtures.upcoming.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Upcoming ({groupedFixtures.upcoming.length})
                </h2>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  {groupedFixtures.upcoming.map((fixture) => (
                    <FixtureRow key={fixture.id} fixture={fixture} />
                  ))}
                </div>
              </div>
            )}

            {/* Finished Games */}
            {!showLiveOnly && groupedFixtures.finished.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Finished ({groupedFixtures.finished.length})
                </h2>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  {groupedFixtures.finished.map((fixture) => (
                    <FixtureRow key={fixture.id} fixture={fixture} />
                  ))}
                </div>
              </div>
            )}

            {/* Show Live Only */}
            {showLiveOnly && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {displayFixtures.map((fixture) => (
                  <FixtureRow key={fixture.id} fixture={fixture} />
                ))}
              </div>
            )}
              </div>
            )}
            </div>
          </div>
          {/* End Left Column */}

          {/* Right Column - Live Scores & Quick Info */}
          <div className="lg:col-span-4">
            <div className="sticky top-4 space-y-4">
              {/* Live Games Widget */}
              {allLiveGames.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <div className="px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 border-b border-red-700">
                    <h3 className="text-white font-bold flex items-center">
                      <span className="relative flex h-3 w-3 mr-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                      </span>
                      Live Now
                      <span className="ml-auto bg-white/20 px-2 py-0.5 rounded-full text-sm">
                        {allLiveGames.length}
                      </span>
                    </h3>
                  </div>
                  <div className="max-h-[500px] overflow-y-auto">
                    {allLiveGames.slice(0, 10).map((fixture) => (
                      <div key={fixture.id} className="px-4 py-3 border-b border-gray-100 last:border-b-0 hover:bg-red-50 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-red-600">LIVE</span>
                          <span className="text-xs text-gray-500">{fixture.league}</span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-900 truncate">{fixture.awayTeam}</span>
                            <span className="text-lg font-bold text-gray-900 ml-2">{fixture.awayScore}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-900 truncate">{fixture.homeTeam}</span>
                            <span className="text-lg font-bold text-gray-900 ml-2">{fixture.homeScore}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {allLiveGames.length > 10 && (
                    <div className="px-4 py-2 bg-gray-50 text-center text-xs text-gray-600">
                      +{allLiveGames.length - 10} more live games
                    </div>
                  )}
                </div>
              )}

              {/* Quick Stats */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h3 className="font-bold text-gray-900 mb-3">Today's Summary</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Live Games</span>
                    <span className="font-semibold text-red-600">{liveFixtures.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Upcoming</span>
                    <span className="font-semibold text-blue-600">{upcomingFixtures.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Finished</span>
                    <span className="font-semibold text-gray-600">{finishedFixtures.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-200">
                    <span className="text-gray-600 font-medium">Total</span>
                    <span className="font-bold text-gray-900">{fixtures.length}</span>
                  </div>
                </div>
              </div>

              {/* Upcoming Highlights */}
              {upcomingFixtures.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <div className="px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 border-b border-blue-700">
                    <h3 className="text-white font-bold">Next Up</h3>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    {upcomingFixtures.slice(0, 5).map((fixture) => (
                      <div key={fixture.id} className="px-4 py-3 border-b border-gray-100 last:border-b-0 hover:bg-blue-50 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-blue-600">
                            {new Date(fixture.dateTime).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit'
                            })}
                          </span>
                          <span className="text-xs text-gray-500">{fixture.league}</span>
                        </div>
                        <div className="space-y-1">
                          <div className="text-sm font-medium text-gray-900 truncate">{fixture.awayTeam}</div>
                          <div className="text-xs text-gray-500">vs</div>
                          <div className="text-sm font-medium text-gray-900 truncate">{fixture.homeTeam}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          {/* End Right Column */}
        </div>
        {/* End Two Column Layout */}
      </div>
    </div>
  );
};

export default SportsCalendarPage;
