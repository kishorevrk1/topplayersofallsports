import React, { useState, useEffect } from 'react';
import Header from '../../components/ui/Header';
import TabNavigation from '../../components/ui/TabNavigation';
import AppIcon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import AppImage from '../../components/AppImage';
import calendarService from '../../services/calendarService';

const DEFAULT_SPORTS = [
  { id: 'all', name: 'All Sports', color: 'bg-gray-600' },
  { id: 'nba', name: 'Basketball', color: 'bg-orange-500' },
  { id: 'nfl', name: 'Football', color: 'bg-amber-700' },
  { id: 'mlb', name: 'Baseball', color: 'bg-blue-500' },
  { id: 'nhl', name: 'Hockey', color: 'bg-cyan-600' },
  { id: 'soccer', name: 'Soccer', color: 'bg-green-600' },
  { id: 'tennis', name: 'Tennis', color: 'bg-lime-600' },
  { id: 'golf', name: 'Golf', color: 'bg-emerald-600' },
];

const SportsCalendar = () => {
  const [selectedSport, setSelectedSport] = useState('all');
  const [viewMode, setViewMode] = useState('month'); // month, week, day, list
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [sports, setSports] = useState(DEFAULT_SPORTS);
  // League selection state
  const [selectedLeague, setSelectedLeague] = useState('all');
  const [leaguesBySport, setLeaguesBySport] = useState({});
  const [leaguesLoading, setLeaguesLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Small delay before showing skeletons to avoid flash of loading on quick fetches
  const [showSkeleton, setShowSkeleton] = useState(false);
  useEffect(() => {
    let t;
    if (loading) {
      t = setTimeout(() => setShowSkeleton(true), 200);
    } else {
      setShowSkeleton(false);
    }
    return () => t && clearTimeout(t);
  }, [loading]);

  // Load sports dynamically from backend on mount
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await calendarService.getSports();
        const uiSports = Array.isArray(data) ? data : [];
        // Ensure 'all' exists and colors present
        const withAll = [{ id: 'all', name: 'All Sports', color: 'bg-gray-600' }, ...uiSports];
        const withColors = withAll.map(s => ({
          ...s,
          color: s.color || DEFAULT_SPORTS.find(d => d.id === s.id)?.color || 'bg-gray-600'
        }));
        if (!cancelled) setSports(withColors);
      } catch (e) {
        console.warn('Falling back to default sports list', e);
        if (!cancelled) setSports(DEFAULT_SPORTS);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  // Fetch leagues for a sport from backend
  const loadLeaguesForSport = async (uiSportId) => {
    try {
      const apiSport = calendarService.mapUiSportToApi(uiSportId);
      if (uiSportId === 'all') return;
      setLeaguesLoading(true);
      const leagues = await calendarService.getLeagues(apiSport, true);
      const mapped = (leagues || []).map(l => {
        const id = String(l?.externalId ?? l?.id ?? l?.code ?? l?.leagueId ?? '');
        const name = l?.name ?? l?.leagueName ?? l?.shortName ?? id;
        return { id, name };
      });
      setLeaguesBySport(prev => ({
        ...prev,
        [uiSportId]: mapped,
      }));
      if (mapped.length === 1) setSelectedLeague(mapped[0].id);
    } catch (e) {
      console.error('Failed to load leagues', e);
    } finally {
      setLeaguesLoading(false);
    }
  };

  // Initial sports/league bootstrap (optional sports call skipped since UI sports are fixed)
  useEffect(() => {
    if (selectedSport && selectedSport !== 'all' && !leaguesBySport[selectedSport]) {
      loadLeaguesForSport(selectedSport);
    }
  }, [selectedSport]);

  // Load events from backend based on filters and current month range
  useEffect(() => {
    const fetchRange = async () => {
      setLoading(true); setError(null);
      try {
        const yyyy = currentDate.getFullYear();
        const mm = currentDate.getMonth();
        const start = new Date(yyyy, mm, 1);
        const end = new Date(yyyy, mm + 1, 0);
        const fmt = (d) => d.toISOString().slice(0, 10);
        const apiSport = selectedSport === 'all' ? 'all' : calendarService.mapUiSportToApi(selectedSport);
        const leagueIds = selectedLeague !== 'all' ? [selectedLeague] : undefined;

        const data = await calendarService.getGamesByRange({
          sport: apiSport,
          startDate: fmt(start),
          endDate: fmt(end),
          leagueIds
        });

        const mapped = (data.games || []).map((g, idx) =>
          calendarService.normalizeGame(g, selectedSport, selectedLeague)
        );

        setEvents(mapped);
      } catch (e) {
        console.error('Failed to load calendar range', e);
        setError('Failed to load events');
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRange();
  }, [selectedSport, selectedLeague, currentDate]);

  // Persist filters in localStorage and restore on load
  useEffect(() => {
    const savedSport = localStorage.getItem('calendarSport');
    const savedLeague = localStorage.getItem('calendarLeague');
    if (savedSport) setSelectedSport(savedSport);
    if (savedLeague) setSelectedLeague(savedLeague);
  }, []);

  useEffect(() => {
    localStorage.setItem('calendarSport', selectedSport);
    localStorage.setItem('calendarLeague', selectedLeague);
  }, [selectedSport, selectedLeague]);

  // Restore view mode from localStorage
  useEffect(() => {
    const savedViewMode = localStorage.getItem('calendarViewMode');
    if (savedViewMode === 'month' || savedViewMode === 'list') {
      setViewMode(savedViewMode);
    }
  }, []);

  // Persist view mode
  useEffect(() => {
    localStorage.setItem('calendarViewMode', viewMode);
  }, [viewMode]);

  const getMonthCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const calendar = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      calendar.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      calendar.push(new Date(year, month, day));
    }
    
    return calendar;
  };

  const getEventsForDate = (date) => {
    if (!date) return [];
    const dateString = date.toISOString().split('T')[0];
    return events.filter(event => event.date === dateString);
  };

  const formatTime = (time) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getImportanceColor = (importance) => {
    switch (importance) {
      case 'high': return 'border-l-red-500 bg-red-50';
      case 'medium': return 'border-l-yellow-500 bg-yellow-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  const getSportColor = (sport) => {
    const sportData = sports.find(s => s.id === sport);
    return sportData?.color || 'bg-gray-600';
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-text-primary mb-2">
                  Sports Calendar & Events
                </h1>
                <p className="text-text-secondary">
                  Never miss a game - track all your favorite sports events
                </p>
              </div>
              
              {/* View Mode Toggle */}
              <div className="flex items-center space-x-2">
                <Button
                  variant={viewMode === 'month' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('month')}
                >
                  Month
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  List
                </Button>
              </div>
            </div>
          </div>

          {/* Sport & League Filters */}
          <div className="mb-8 sticky top-16 z-10 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 rounded-md">
            <div className="p-1"></div>
            <div className="flex items-center justify-between mb-4 px-0">
              <h3 className="text-lg font-semibold text-text-primary">Filter by Sport</h3>
              <div className="flex items-center gap-2">
                <div className="text-sm text-text-secondary hidden sm:block">
                  {selectedSport === 'all' ? 'All Sports' : sports.find(s => s.id === selectedSport)?.name}
                  {/* show league name if selected */}
                  {selectedSport !== 'all' && selectedLeague !== 'all' ? (
                    <> • {(leaguesBySport[selectedSport] || []).find(l => l.id === selectedLeague)?.name || ''}</>
                  ) : null}
                  {` (${events.length} events)`}
                </div>
                <Button variant="outline" size="xs" onClick={() => { setSelectedSport('all'); setSelectedLeague('all'); }}>
                  Reset Filters
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              {sports.map((sport) => (
                <Button
                  key={sport.id}
                  variant={selectedSport === sport.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setSelectedSport(sport.id);
                    setSelectedLeague('all');
                  }}
                  className={`transition-all duration-200 ${
                    selectedSport === sport.id 
                      ? `${sport.color} text-white border-transparent shadow-md hover:shadow-lg` 
                      : 'hover:bg-gray-50 hover:border-gray-300'
                  }`}
                >
                  <span className="font-medium">{sport.name}</span>
                </Button>
              ))}
            </div>

            {/* League filter appears when a specific sport is selected */}
            {selectedSport !== 'all' && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-base font-semibold text-text-primary">Filter by League</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    key="all-leagues"
                    variant={selectedLeague === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedLeague('all')}
                    className={`transition-all duration-200 ${selectedLeague === 'all' ? 'bg-accent text-white border-transparent' : ''}`}
                  >
                    All Leagues
                  </Button>

                  {(leaguesLoading || showSkeleton) && (
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-24 rounded-md bg-gray-100 animate-pulse" />
                      <div className="h-8 w-28 rounded-md bg-gray-100 animate-pulse" />
                      <div className="h-8 w-20 rounded-md bg-gray-100 animate-pulse" />
                    </div>
                  )}

                  {!leaguesLoading && !showSkeleton && (leaguesBySport[selectedSport] || []).map((league) => (
                    <Button
                      key={league.id}
                      variant={selectedLeague === league.id ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedLeague(league.id)}
                      className={`transition-all duration-200 ${selectedLeague === league.id ? 'bg-accent text-white border-transparent shadow-md hover:shadow-lg' : 'hover:bg-gray-50 hover:border-gray-300'}`}
                    >
                      {league.name}
                    </Button>
                  ))}

                  {!leaguesLoading && !showSkeleton && (leaguesBySport[selectedSport] && leaguesBySport[selectedSport].length === 0) && (
                    <div className="text-sm text-text-secondary">No leagues available</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {viewMode === 'month' ? (
            /* Calendar View */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Calendar */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-lg border border-border p-6">
                  {/* Calendar Header */}
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="text-2xl font-bold text-text-primary">
                        {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                      </h2>
                      <p className="text-text-secondary text-sm mt-1">
                        {events.length} events this month
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigateMonth(-1)}
                        className="hover:bg-gray-50"
                      >
                        <AppIcon name="ChevronLeft" size={16} />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentDate(new Date())}
                        className="px-4 hover:bg-blue-50 hover:text-blue-600"
                      >
                        Today
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigateMonth(1)}
                        className="hover:bg-gray-50"
                      >
                        <AppIcon name="ChevronRight" size={16} />
                      </Button>
                    </div>
                  </div>

                  {/* Day Names */}
                  <div className="grid grid-cols-7 gap-2 mb-4">
                    {dayNames.map((day) => (
                      <div key={day} className="p-3 text-center text-sm font-semibold text-text-secondary bg-gray-50 rounded-lg">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-2">
                    {loading ? (
                      Array.from({ length: 35 }).map((_, i) => (
                        <div key={i} className="min-h-[100px] p-3 border rounded-lg bg-gray-50 animate-pulse" />
                      ))
                    ) : (
                      getMonthCalendar().map((date, index) => {
                        const dayEvents = date ? getEventsForDate(date) : [];
                        const isToday = date && date.toDateString() === new Date().toDateString();
                        const isSelected = date && date.toDateString() === selectedDate.toDateString();
                        
                        return (
                          <div
                            key={index}
                            className={`min-h-[100px] p-3 border rounded-lg transition-all duration-200 ${
                              date ? 'cursor-pointer hover:shadow-md hover:border-blue-300' : ''
                            } ${isToday ? 'bg-blue-50 border-blue-300 shadow-sm' : 'border-gray-200'} ${
                              isSelected ? 'bg-blue-100 border-blue-400' : ''
                            } ${dayEvents.length > 0 ? 'bg-green-50' : 'bg-white'}`}
                            onClick={() => date && setSelectedDate(date)}
                          >
                            {date && (
                              <>
                                <div className={`text-sm font-semibold mb-2 ${
                                  isToday ? 'text-blue-600' : 'text-text-primary'
                                }`}>
                                  {date.getDate()}
                                </div>
                                <div className="space-y-1">
                                  {dayEvents.slice(0, 2).map((event, i) => (
                                    <div
                                      key={i}
                                      title={event.title}
                                      className={`text-xs p-1.5 rounded text-white ${getSportColor(event.sport)} truncate`}
                                    >
                                      {event.title.length > 20 
                                        ? event.title.substring(0, 20) + '...'
                                        : event.title
                                      }
                                    </div>
                                  ))}
                                  {dayEvents.length > 2 && (
                                    <div className="text-xs text-text-secondary font-medium">
                                      +{dayEvents.length - 2} more
                                    </div>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Events for Selected Date */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg border border-border p-6 sticky top-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-text-primary">
                      Events
                    </h3>
                    <span className="text-sm text-text-secondary">
                      {selectedDate.toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </span>
                  </div>
                  
                  {getEventsForDate(selectedDate).length > 0 ? (
                    <div className="space-y-4">
                      {getEventsForDate(selectedDate).map((event) => (
                        <div
                          key={event.id}
                          className={`border-l-4 pl-4 py-4 rounded-r-lg transition-all duration-200 hover:shadow-sm ${getImportanceColor(event.importance)}`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <h4 className="font-semibold text-text-primary text-sm leading-tight">
                              {event.title}
                            </h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getSportColor(event.sport)}`}>
                              {event.sport.toUpperCase()}
                            </span>
                          </div>
                          <div className="space-y-2 text-xs text-text-secondary">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{formatTime(event.time)}</span>
                              <span className={`px-2 py-1 rounded text-xs ${
                                event.importance === 'high' ? 'bg-red-100 text-red-700' :
                                event.importance === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {event.importance}
                              </span>
                            </div>
                            <div className="text-text-secondary">
                              {event.venue}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                        <AppIcon name="Calendar" size={24} className="text-gray-400" />
                      </div>
                      <p className="text-text-secondary text-sm">No events scheduled</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* List View */
            <div className="bg-white rounded-lg border border-border overflow-hidden">
              <div className="p-6 border-b border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-text-primary">
                      Upcoming Events
                    </h2>
                    <p className="text-text-secondary text-sm mt-1">
                      {events.length} events scheduled
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" className="text-xs">
                      Export Calendar
                    </Button>
                  </div>
                </div>
              </div>

              <div className="divide-y divide-border">
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="p-6">
                      <div className="h-5 w-40 bg-gray-100 rounded mb-4 animate-pulse" />
                      <div className="h-4 w-2/3 bg-gray-100 rounded mb-3 animate-pulse" />
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="h-4 bg-gray-100 rounded animate-pulse" />
                        <div className="h-4 bg-gray-100 rounded animate-pulse" />
                        <div className="h-4 bg-gray-100 rounded animate-pulse" />
                        <div className="h-4 bg-gray-100 rounded animate-pulse" />
                      </div>
                    </div>
                  ))
                ) : events.length > 0 ? (
                  events.map((event) => (
                    <div key={event.id} className="p-6 hover:bg-gray-50 transition-all duration-200">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-4 flex-1 min-w-0">
                          <div className="flex items-center space-x-3 flex-shrink-0">
                            <AppImage
                              src={event.logos[0]}
                              alt={event.teams[0]}
                              className="w-10 h-10 rounded-full border border-gray-200"
                            />
                            <span className="text-sm font-medium text-gray-400">vs</span>
                            <AppImage
                              src={event.logos[1]}
                              alt={event.teams[1]}
                              className="w-10 h-10 rounded-full border border-gray-200"
                            />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${getSportColor(event.sport)}`}>
                                {event.sport.toUpperCase()}
                              </span>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                event.importance === 'high' ? 'bg-red-100 text-red-700' :
                                event.importance === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {event.importance.toUpperCase()}
                              </span>
                            </div>
                            
                            <h3 className="text-lg font-semibold text-text-primary mb-1 truncate" title={event.title}>
                              {event.title}
                            </h3>
                            <p className="text-text-secondary text-sm truncate">
                              {event.description}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="flex items-center gap-2">
                          <AppIcon name="Calendar" size={16} className="text-blue-500 flex-shrink-0" />
                          <div className="text-sm">
                            <div className="font-medium text-text-primary">
                              {new Date(event.date).toLocaleDateString('en-US', { 
                                weekday: 'short', 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <AppIcon name="Clock" size={16} className="text-green-500 flex-shrink-0" />
                          <div className="text-sm">
                            <div className="font-medium text-text-primary">
                              {formatTime(event.time)}
                            </div>
                            {event.description && (
                              <div className="text-xs text-text-secondary truncate" title={event.description}>
                                {event.description}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <AppIcon name="MapPin" size={16} className="text-red-500 flex-shrink-0" />
                          <div className="text-sm">
                            <div className="font-medium text-text-primary truncate" title={event.venue}>
                              {event.venue}
                            </div>
                            {event.round && (
                              <div className="text-xs text-text-secondary truncate" title={`Round: ${event.round}`}>
                                Round: {event.round}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <AppIcon name="Tv" size={16} className="text-purple-500 flex-shrink-0" />
                          <div className="text-sm">
                            <div className="font-medium text-text-primary truncate" title={event.broadcast.join(', ')}>
                              {event.broadcast.join(', ')}
                            </div>
                            {event.referee && (
                              <div className="text-xs text-text-secondary truncate" title={`Referee: ${event.referee}`}>
                                Referee: {event.referee}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-border">
                        <div className="flex items-center space-x-4">
                          <div className="text-sm">
                            <span className="text-text-secondary">Tickets: </span>
                            <span className={`font-semibold ${
                              event.tickets.available ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {event.tickets.price}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm" className="text-xs px-3">
                            Remind Me
                          </Button>
                          <Button variant="outline" size="sm" className="text-xs px-3">
                            Share
                          </Button>
                          {event.tickets.available && (
                            <Button size="sm" className="text-xs px-4 bg-blue-600 hover:bg-blue-700">
                              Get Tickets
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                      <AppIcon name="Calendar" size={32} className="text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-text-primary mb-2">No Events Found</h3>
                    <p className="text-text-secondary">
                      No events available for the selected sport category.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default SportsCalendar;
