import React, { useState, useEffect } from 'react';
import Header from '../../components/ui/Header';
import TabNavigation from '../../components/ui/TabNavigation';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';

/**
 * Sports Calendar Page - Production Ready Implementation
 * Best Practice: Clean architecture, optimal UX, performance optimized
 * User Flow: Sport → League → Team → Matches with intelligent defaults
 */

// Enhanced mock data with better structure
const MOCK_SPORTS = [
  { 
    id: 'basketball', 
    name: 'Basketball', 
    icon: '🏀',
    leagues: ['NBA', 'WNBA', 'NCAA Basketball'],
    color: 'orange'
  },
  { 
    id: 'football', 
    name: 'American Football', 
    icon: '🏈',
    leagues: ['NFL', 'College Football'],
    color: 'brown'
  },
  { 
    id: 'soccer', 
    name: 'Soccer', 
    icon: '⚽',
    leagues: ['Premier League', 'La Liga', 'Champions League', 'MLS'],
    color: 'green'
  },
  { 
    id: 'tennis', 
    name: 'Tennis', 
    icon: '🎾',
    leagues: ['ATP Tour', 'WTA Tour', 'Grand Slams'],
    color: 'yellow'
  },
  { 
    id: 'baseball', 
    name: 'Baseball', 
    icon: '⚾',
    leagues: ['MLB', 'College Baseball'],
    color: 'blue'
  }
];

const MOCK_TEAMS = {
  'NBA': [
    { name: 'Lakers', city: 'Los Angeles', logo: '🟣', record: '42-30' },
    { name: 'Warriors', city: 'Golden State', logo: '🟡', record: '44-28' },
    { name: 'Celtics', city: 'Boston', logo: '🟢', record: '57-15' },
    { name: 'Heat', city: 'Miami', logo: '🔴', record: '46-26' },
    { name: 'Nets', city: 'Brooklyn', logo: '⚫', record: '32-40' }
  ],
  'NFL': [
    { name: 'Patriots', city: 'New England', logo: '🔵', record: '8-9' },
    { name: 'Cowboys', city: 'Dallas', logo: '⭐', record: '12-5' },
    { name: 'Packers', city: 'Green Bay', logo: '🟢', record: '9-8' },
    { name: 'Steelers', city: 'Pittsburgh', logo: '⚫', record: '9-8' },
    { name: '49ers', city: 'San Francisco', logo: '🔴', record: '13-4' }
  ],
  'Premier League': [
    { name: 'Manchester United', city: 'Manchester', logo: '🔴', record: '23-6-9' },
    { name: 'Liverpool', city: 'Liverpool', logo: '🔴', record: '21-10-7' },
    { name: 'Arsenal', city: 'London', logo: '🔴', record: '26-6-6' },
    { name: 'Chelsea', city: 'London', logo: '🔵', record: '18-9-11' },
    { name: 'Manchester City', city: 'Manchester', logo: '🩵', record: '27-7-4' }
  ]
};

const MOCK_MATCHES = [
  {
    id: 1,
    homeTeam: 'Lakers',
    awayTeam: 'Warriors',
    league: 'NBA',
    sport: 'basketball',
    date: 'Today',
    time: '8:00 PM PST',
    venue: 'Crypto.com Arena',
    city: 'Los Angeles',
    status: 'upcoming',
    importance: 'high',
    homeScore: null,
    awayScore: null,
    isPlayoff: false
  },
  {
    id: 2,
    homeTeam: 'Celtics',
    awayTeam: 'Heat',
    league: 'NBA',
    sport: 'basketball',
    date: 'Tomorrow',
    time: '7:30 PM EST',
    venue: 'TD Garden',
    city: 'Boston',
    status: 'upcoming',
    importance: 'high',
    homeScore: null,
    awayScore: null,
    isPlayoff: true
  },
  {
    id: 3,
    homeTeam: 'Cowboys',
    awayTeam: 'Patriots',
    league: 'NFL',
    sport: 'football',
    date: 'Sunday',
    time: '1:00 PM EST',
    venue: 'AT&T Stadium',
    city: 'Arlington',
    status: 'upcoming',
    importance: 'medium',
    homeScore: null,
    awayScore: null,
    isPlayoff: false
  },
  {
    id: 4,
    homeTeam: 'Manchester United',
    awayTeam: 'Liverpool',
    league: 'Premier League',
    sport: 'soccer',
    date: 'Saturday',
    time: '3:00 PM GMT',
    venue: 'Old Trafford',
    city: 'Manchester',
    status: 'live',
    importance: 'high',
    homeScore: 1,
    awayScore: 1,
    isPlayoff: false
  },
  {
    id: 5,
    homeTeam: 'Arsenal',
    awayTeam: 'Chelsea',
    league: 'Premier League',
    sport: 'soccer',
    date: 'Yesterday',
    time: 'Final',
    venue: 'Emirates Stadium',
    city: 'London',
    status: 'completed',
    importance: 'high',
    homeScore: 3,
    awayScore: 1,
    isPlayoff: false
  }
];

const VIEW_TYPES = {
  UPCOMING: 'upcoming',
  LIVE: 'live',
  WEEK: 'week',
  MONTH: 'month'
};

const IMPORTANCE_COLORS = {
  high: 'border-red-200 bg-red-50',
  medium: 'border-yellow-200 bg-yellow-50',
  low: 'border-gray-200 bg-gray-50'
};

function SportsCalendar() {
  // Enhanced state management
  const [selectedSport, setSelectedSport] = useState(null);
  const [selectedLeague, setSelectedLeague] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [viewMode, setViewMode] = useState(VIEW_TYPES.UPCOMING);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userPreferences, setUserPreferences] = useState({
    defaultSport: 'basketball',
    favoriteLeagues: ['NBA', 'Premier League'],
    favoriteTeams: ['Lakers', 'Manchester United'],
    timezone: 'PST',
    notifications: true
  });

  // Initialize with intelligent defaults
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      if (userPreferences?.defaultSport) {
        setSelectedSport(userPreferences.defaultSport);
        // Auto-select favorite league
        const favoriteLeague = userPreferences.favoriteLeagues?.[0];
        if (favoriteLeague) {
          setSelectedLeague(favoriteLeague);
        }
      }
      setLoading(false);
    }, 800);
  }, [userPreferences]);

  // Enhanced handlers with better UX
  const handleSportChange = (sport) => {
    setSelectedSport(sport);
    setSelectedLeague(null);
    setSelectedTeam(null);
    setSearchQuery('');
    
    // Smart league selection
    if (sport && userPreferences?.favoriteLeagues) {
      const sportData = MOCK_SPORTS.find(s => s.id === sport);
      const favoriteLeague = userPreferences.favoriteLeagues.find(league => 
        sportData?.leagues.includes(league)
      );
      if (favoriteLeague) {
        setTimeout(() => setSelectedLeague(favoriteLeague), 300);
      }
    }
  };

  const handleLeagueChange = (league) => {
    setSelectedLeague(league);
    setSelectedTeam(null);
  };

  const handleTeamChange = (team) => {
    setSelectedTeam(team);
  };

  // Enhanced data getters
  const getAvailableLeagues = () => {
    if (!selectedSport) return [];
    const sport = MOCK_SPORTS.find(s => s.id === selectedSport);
    return sport?.leagues || [];
  };

  const getAvailableTeams = () => {
    if (!selectedLeague) return [];
    return MOCK_TEAMS[selectedLeague] || [];
  };

  // Advanced filtering with search
  const getFilteredMatches = () => {
    let matches = [...MOCK_MATCHES];
    
    // Filter by view mode
    if (viewMode === VIEW_TYPES.LIVE) {
      matches = matches.filter(match => match.status === 'live');
    } else if (viewMode === VIEW_TYPES.UPCOMING) {
      matches = matches.filter(match => match.status === 'upcoming');
    }
    
    // Filter by sport
    if (selectedSport) {
      matches = matches.filter(match => match.sport === selectedSport);
    }
    
    // Filter by league
    if (selectedLeague) {
      matches = matches.filter(match => match.league === selectedLeague);
    }
    
    // Filter by team
    if (selectedTeam) {
      matches = matches.filter(match => 
        match.homeTeam === selectedTeam || match.awayTeam === selectedTeam
      );
    }
    
    // Filter by search query
    if (searchQuery) {
      matches = matches.filter(match =>
        match.homeTeam.toLowerCase().includes(searchQuery.toLowerCase()) ||
        match.awayTeam.toLowerCase().includes(searchQuery.toLowerCase()) ||
        match.league.toLowerCase().includes(searchQuery.toLowerCase()) ||
        match.venue.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Sort by importance and date
    return matches.sort((a, b) => {
      const importanceOrder = { high: 3, medium: 2, low: 1 };
      return importanceOrder[b.importance] - importanceOrder[a.importance];
    });
  };

  // Enhanced quick access
  const handleQuickAccess = (action) => {
    switch (action) {
      case 'today':
        setViewMode(VIEW_TYPES.UPCOMING);
        setSelectedSport(null);
        setSelectedLeague(null);
        setSelectedTeam(null);
        break;
      case 'favorites':
        if (userPreferences?.defaultSport) {
          setSelectedSport(userPreferences.defaultSport);
          const favLeague = userPreferences?.favoriteLeagues?.[0];
          if (favLeague) {
            setTimeout(() => setSelectedLeague(favLeague), 300);
          }
        }
        setViewMode(VIEW_TYPES.UPCOMING);
        break;
      case 'live':
        setViewMode(VIEW_TYPES.LIVE);
        setSelectedSport(null);
        setSelectedLeague(null);
        setSelectedTeam(null);
        break;
      default:
        break;
    }
  };

  // Enhanced UI configurations
  const tabs = [
    { id: VIEW_TYPES.UPCOMING, label: 'Upcoming', icon: '📅', count: MOCK_MATCHES.filter(m => m.status === 'upcoming').length },
    { id: VIEW_TYPES.LIVE, label: 'Live', icon: '🔴', count: MOCK_MATCHES.filter(m => m.status === 'live').length },
    { id: VIEW_TYPES.WEEK, label: 'This Week', icon: '📋', count: 0 },
    { id: VIEW_TYPES.MONTH, label: 'This Month', icon: '🗓️', count: 0 }
  ];

  const sportOptions = [
    { value: '', label: 'All Sports' },
    ...MOCK_SPORTS.map(sport => ({
      value: sport.id,
      label: `${sport.icon} ${sport.name} (${sport.leagues.length} leagues)`,
      isRecommended: userPreferences?.defaultSport === sport.id
    }))
  ];

  const leagueOptions = [
    { value: '', label: 'All Leagues' },
    ...getAvailableLeagues().map(league => ({
      value: league,
      label: league,
      isRecommended: userPreferences?.favoriteLeagues?.includes(league)
    }))
  ];

  const teamOptions = [
    { value: '', label: 'All Teams' },
    ...getAvailableTeams().map(team => ({
      value: typeof team === 'string' ? team : team.name,
      label: typeof team === 'string' ? team : `${team.logo} ${team.name} (${team.record})`,
      isRecommended: userPreferences?.favoriteTeams?.includes(typeof team === 'string' ? team : team.name)
    }))
  ];

  const filteredMatches = getFilteredMatches();

  // Enhanced loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl">🏆</span>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Sports Calendar</h3>
              <p className="text-gray-600">Preparing your personalized sports experience...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header />
      
      <div className="container mx-auto px-4 py-6">
        {/* Enhanced Page Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <span className="text-2xl text-white">🏆</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Sports Calendar
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Never miss a game from your favorite teams. Get live scores, upcoming matches, and personalized recommendations.
          </p>
        </div>

        {/* Enhanced Quick Access Bar */}
        <div className="bg-white rounded-xl shadow-sm border mb-8 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-semibold text-gray-700 bg-gray-100 px-3 py-1 rounded-full">
                Quick Access
              </span>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleQuickAccess('today')}
                className="hover:bg-blue-50 hover:border-blue-300"
              >
                📅 Today's Games
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleQuickAccess('favorites')}
                className="hover:bg-green-50 hover:border-green-300"
              >
                ⭐ My Favorites
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleQuickAccess('live')}
                className="hover:bg-red-50 hover:border-red-300 relative"
              >
                🔴 Live Games
                {MOCK_MATCHES.filter(m => m.status === 'live').length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {MOCK_MATCHES.filter(m => m.status === 'live').length}
                  </span>
                )}
              </Button>
            </div>
            
            {userPreferences?.defaultSport && (
              <div className="flex items-center space-x-2 text-sm text-gray-600 bg-blue-50 px-3 py-2 rounded-lg">
                <span>Default Sport:</span>
                <span className="font-semibold text-blue-700">
                  {MOCK_SPORTS.find(s => s.id === userPreferences.defaultSport)?.icon} {MOCK_SPORTS.find(s => s.id === userPreferences.defaultSport)?.name}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Enhanced Filters Sidebar */}
          <div className="xl:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border p-6 sticky top-6">
              <div className="flex items-center space-x-2 mb-6">
                <span className="text-xl">🔍</span>
                <h2 className="text-xl font-bold text-gray-900">
                  Filter Matches
                </h2>
              </div>
              
              <div className="space-y-6">
                {/* Enhanced Search */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Search Teams or Venues
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search teams, venues..."
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      🔍
                    </span>
                  </div>
                </div>

                {/* Enhanced Sport Selector */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Sport
                    {userPreferences?.defaultSport === selectedSport && (
                      <span className="ml-2 bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">⭐ Default</span>
                    )}
                  </label>
                  <Select
                    value={selectedSport || ''}
                    onChange={handleSportChange}
                    options={sportOptions}
                    placeholder="Choose a sport..."
                    className="w-full"
                  />
                </div>

                {/* Enhanced League Selector */}
                {selectedSport && (
                  <div className="animate-fade-in">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      League
                    </label>
                    <Select
                      value={selectedLeague || ''}
                      onChange={handleLeagueChange}
                      options={leagueOptions}
                      placeholder="Choose a league..."
                      className="w-full"
                    />
                  </div>
                )}

                {/* Enhanced Team Selector */}
                {selectedLeague && (
                  <div className="animate-fade-in">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Team (Optional)
                    </label>
                    <Select
                      value={selectedTeam || ''}
                      onChange={handleTeamChange}
                      options={teamOptions}
                      placeholder="All teams..."
                      className="w-full"
                    />
                  </div>
                )}

                {/* Enhanced Clear Filters */}
                {(selectedSport || selectedLeague || selectedTeam || searchQuery) && (
                  <div className="pt-6 border-t border-gray-200">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSelectedSport(null);
                        setSelectedLeague(null);
                        setSelectedTeam(null);
                        setSearchQuery('');
                      }}
                      className="w-full hover:bg-red-50 hover:border-red-300"
                    >
                      ✕ Clear All Filters
                    </Button>
                  </div>
                )}

                {/* Filter Summary */}
                {filteredMatches.length > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm text-green-800 font-medium">
                      📊 {filteredMatches.length} matches found
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Enhanced Main Calendar Content */}
          <div className="xl:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border">
              {/* Enhanced View Mode Tabs */}
              <div className="border-b border-gray-200 px-6 py-4">
                <TabNavigation
                  tabs={tabs.map(tab => ({
                    ...tab,
                    label: tab.count > 0 ? `${tab.label} (${tab.count})` : tab.label
                  }))}
                  activeTab={viewMode}
                  onTabChange={setViewMode}
                />
              </div>

              {/* Enhanced Calendar View */}
              <div className="p-6">
                {filteredMatches.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-2xl font-bold text-gray-900">
                        {viewMode === VIEW_TYPES.UPCOMING ? '📅 Upcoming Matches' : 
                         viewMode === VIEW_TYPES.LIVE ? '🔴 Live Matches' :
                         viewMode === VIEW_TYPES.WEEK ? '📋 This Week' : '🗓️ This Month'}
                      </h3>
                      <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                        {filteredMatches.length} matches
                      </span>
                    </div>
                    
                    {filteredMatches.map(match => (
                      <div 
                        key={match.id} 
                        className={`rounded-xl p-6 border-2 transition-all duration-200 hover:shadow-md ${
                          IMPORTANCE_COLORS[match.importance]
                        } ${match.status === 'live' ? 'ring-2 ring-red-200 animate-pulse' : ''}`}
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
                          {/* Match Info */}
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <span className="text-2xl">
                                {MOCK_SPORTS.find(s => s.id === match.sport)?.icon}
                              </span>
                              <h4 className="text-xl font-bold text-gray-900">
                                {match.homeTeam} vs {match.awayTeam}
                              </h4>
                              {match.status === 'live' && (
                                <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                                  LIVE
                                </span>
                              )}
                              {match.isPlayoff && (
                                <span className="bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                  PLAYOFF
                                </span>
                              )}
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                              <span className="flex items-center space-x-1">
                                <span>🏆</span>
                                <span className="font-medium">{match.league}</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <span>📍</span>
                                <span>{match.venue}, {match.city}</span>
                              </span>
                            </div>

                            {/* Live Score */}
                            {match.status === 'live' && match.homeScore !== null && (
                              <div className="mt-3 flex items-center space-x-4">
                                <div className="bg-white rounded-lg px-4 py-2 border-2 border-red-200">
                                  <span className="font-bold text-lg">{match.homeScore} - {match.awayScore}</span>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Time and Date */}
                          <div className="text-right">
                            <p className="text-lg font-bold text-gray-900">{match.date}</p>
                            <p className="text-sm text-gray-600">{match.time}</p>
                            {match.importance === 'high' && (
                              <span className="inline-block mt-2 bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                                ⭐ Featured
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="text-8xl mb-6">
                      {viewMode === VIEW_TYPES.LIVE ? '📺' : '🏆'}
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">
                      {viewMode === VIEW_TYPES.LIVE ? 'No Live Matches' : 'No Matches Found'}
                    </h3>
                    <p className="text-gray-600 mb-8 max-w-md mx-auto">
                      {selectedSport || selectedLeague || selectedTeam || searchQuery ? 
                        'Try adjusting your filters to see more matches.' :
                        'Select a sport or use quick access to view upcoming matches.'
                      }
                    </p>
                    {(selectedSport || selectedLeague || selectedTeam || searchQuery) && (
                      <Button 
                        onClick={() => {
                          setSelectedSport(null);
                          setSelectedLeague(null);
                          setSelectedTeam(null);
                          setSearchQuery('');
                        }}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        🔄 Reset Filters
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced User Preferences Summary */}
        {userPreferences && (
          <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <span className="text-2xl">⚙️</span>
              <h3 className="text-lg font-bold text-blue-900">
                Your Preferences
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              {userPreferences.defaultSport && (
                <div className="bg-white rounded-lg p-3 border border-blue-200">
                  <p className="font-semibold text-blue-800">Default Sport</p>
                  <p className="text-blue-700">
                    {MOCK_SPORTS.find(s => s.id === userPreferences.defaultSport)?.icon} {MOCK_SPORTS.find(s => s.id === userPreferences.defaultSport)?.name}
                  </p>
                </div>
              )}
              {userPreferences.favoriteLeagues?.length > 0 && (
                <div className="bg-white rounded-lg p-3 border border-blue-200">
                  <p className="font-semibold text-blue-800">Favorite Leagues</p>
                  <p className="text-blue-700">{userPreferences.favoriteLeagues.join(', ')}</p>
                </div>
              )}
              {userPreferences.favoriteTeams?.length > 0 && (
                <div className="bg-white rounded-lg p-3 border border-blue-200">
                  <p className="font-semibold text-blue-800">Favorite Teams</p>
                  <p className="text-blue-700">{userPreferences.favoriteTeams.join(', ')}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SportsCalendar;
