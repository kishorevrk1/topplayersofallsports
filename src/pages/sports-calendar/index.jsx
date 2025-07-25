import React, { useState, useEffect } from 'react';
import Header from '../../components/ui/Header';
import TabNavigation from '../../components/ui/TabNavigation';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import Image from '../../components/AppImage';

const SportsCalendar = () => {
  const [selectedSport, setSelectedSport] = useState('all');
  const [viewMode, setViewMode] = useState('month'); // month, week, day, list
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState([]);

  // Sports categories
  const sports = [
    { id: 'all', name: 'All Sports', icon: 'Trophy', color: 'bg-gray-600' },
    { id: 'nba', name: 'NBA', icon: 'Circle', color: 'bg-orange-600' },
    { id: 'nfl', name: 'NFL', icon: 'Shield', color: 'bg-green-600' },
    { id: 'mlb', name: 'MLB', icon: 'Target', color: 'bg-blue-600' },
    { id: 'soccer', name: 'Soccer', icon: 'CircleDot', color: 'bg-emerald-600' },
    { id: 'nhl', name: 'NHL', icon: 'Disc', color: 'bg-red-600' },
    { id: 'tennis', name: 'Tennis', icon: 'Zap', color: 'bg-yellow-600' },
    { id: 'golf', name: 'Golf', icon: 'Target', color: 'bg-teal-600' }
  ];

  // Mock events data
  const mockEvents = {
    all: [
      {
        id: 1,
        title: 'Lakers vs Warriors',
        sport: 'nba',
        date: '2025-07-28',
        time: '20:00',
        venue: 'Crypto.com Arena',
        teams: ['Los Angeles Lakers', 'Golden State Warriors'],
        logos: ['https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=50&h=50&fit=crop', 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=50&h=50&fit=crop'],
        importance: 'high',
        type: 'regular',
        description: 'Western Conference showdown',
        broadcast: ['ESPN', 'ABC'],
        tickets: { available: true, price: '$89-$450' }
      },
      {
        id: 2,
        title: 'Chiefs vs Bills',
        sport: 'nfl',
        date: '2025-08-02',
        time: '16:00',
        venue: 'Arrowhead Stadium',
        teams: ['Kansas City Chiefs', 'Buffalo Bills'],
        logos: ['https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=50&h=50&fit=crop', 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=50&h=50&fit=crop'],
        importance: 'high',
        type: 'playoff',
        description: 'AFC Championship Game',
        broadcast: ['CBS', 'Paramount+'],
        tickets: { available: false, price: 'Sold Out' }
      },
      {
        id: 3,
        title: 'Manchester United vs Arsenal',
        sport: 'soccer',
        date: '2025-07-30',
        time: '17:30',
        venue: 'Old Trafford',
        teams: ['Manchester United', 'Arsenal FC'],
        logos: ['https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=50&h=50&fit=crop', 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=50&h=50&fit=crop'],
        importance: 'high',
        type: 'premier-league',
        description: 'Premier League Derby',
        broadcast: ['Sky Sports', 'NBC'],
        tickets: { available: true, price: '£45-£180' }
      },
      {
        id: 4,
        title: 'Angels vs Astros',
        sport: 'mlb',
        date: '2025-07-31',
        time: '19:10',
        venue: 'Angel Stadium',
        teams: ['Los Angeles Angels', 'Houston Astros'],
        logos: ['https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=50&h=50&fit=crop', 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=50&h=50&fit=crop'],
        importance: 'medium',
        type: 'regular',
        description: 'AL West Division game',
        broadcast: ['Fox Sports'],
        tickets: { available: true, price: '$25-$120' }
      },
      {
        id: 5,
        title: 'Wimbledon Final',
        sport: 'tennis',
        date: '2025-08-01',
        time: '14:00',
        venue: 'All England Club',
        teams: ['Novak Djokovic', 'Carlos Alcaraz'],
        logos: ['https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=50&h=50&fit=crop', 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=50&h=50&fit=crop'],
        importance: 'high',
        type: 'grand-slam',
        description: 'Men\'s Singles Final',
        broadcast: ['BBC', 'ESPN'],
        tickets: { available: false, price: 'Sold Out' }
      },
      {
        id: 6,
        title: 'Rangers vs Bruins',
        sport: 'nhl',
        date: '2025-07-29',
        time: '19:00',
        venue: 'Madison Square Garden',
        teams: ['New York Rangers', 'Boston Bruins'],
        logos: ['https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=50&h=50&fit=crop', 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=50&h=50&fit=crop'],
        importance: 'medium',
        type: 'regular',
        description: 'Original Six matchup',
        broadcast: ['MSG Network'],
        tickets: { available: true, price: '$75-$300' }
      }
    ]
  };

  useEffect(() => {
    // Filter events based on selected sport
    const allEvents = mockEvents.all;
    if (selectedSport === 'all') {
      setEvents(allEvents);
    } else {
      setEvents(allEvents.filter(event => event.sport === selectedSport));
    }
  }, [selectedSport]);

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
                  <Icon name="Calendar" size={16} className="mr-1" />
                  Month
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <Icon name="List" size={16} className="mr-1" />
                  List
                </Button>
              </div>
            </div>
          </div>

          {/* Sport Filter */}
          <div className="mb-8">
            <div className="flex items-center space-x-2 mb-4">
              <Icon name="Filter" size={20} className="text-primary" />
              <h3 className="text-lg font-semibold text-text-primary">Filter by Sport</h3>
            </div>
            <div className="flex flex-wrap gap-3">
              {sports.map((sport) => (
                <Button
                  key={sport.id}
                  variant={selectedSport === sport.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedSport(sport.id)}
                  className={`flex items-center space-x-2 ${
                    selectedSport === sport.id 
                      ? `${sport.color} text-white border-transparent` 
                      : 'hover:bg-muted'
                  }`}
                >
                  <Icon name={sport.icon} size={16} />
                  <span>{sport.name}</span>
                </Button>
              ))}
            </div>
          </div>

          {viewMode === 'month' ? (
            /* Calendar View */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Calendar */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-lg border border-border p-6">
                  {/* Calendar Header */}
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-text-primary">
                      {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                    </h2>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigateMonth(-1)}
                      >
                        <Icon name="ChevronLeft" size={16} />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentDate(new Date())}
                      >
                        Today
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigateMonth(1)}
                      >
                        <Icon name="ChevronRight" size={16} />
                      </Button>
                    </div>
                  </div>

                  {/* Day Names */}
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {dayNames.map((day) => (
                      <div key={day} className="p-2 text-center text-sm font-medium text-text-secondary">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {getMonthCalendar().map((date, index) => {
                      const dayEvents = date ? getEventsForDate(date) : [];
                      const isToday = date && date.toDateString() === new Date().toDateString();
                      const isSelected = date && date.toDateString() === selectedDate.toDateString();
                      
                      return (
                        <div
                          key={index}
                          className={`min-h-[80px] p-1 border border-gray-100 ${
                            date ? 'cursor-pointer hover:bg-gray-50' : ''
                          } ${isToday ? 'bg-blue-50 border-blue-200' : ''} ${
                            isSelected ? 'bg-primary/10 border-primary' : ''
                          }`}
                          onClick={() => date && setSelectedDate(date)}
                        >
                          {date && (
                            <>
                              <div className={`text-sm font-medium mb-1 ${
                                isToday ? 'text-blue-600' : 'text-text-primary'
                              }`}>
                                {date.getDate()}
                              </div>
                              <div className="space-y-1">
                                {dayEvents.slice(0, 2).map((event, i) => (
                                  <div
                                    key={i}
                                    className={`text-xs p-1 rounded text-white ${getSportColor(event.sport)}`}
                                  >
                                    {event.title.length > 12 
                                      ? event.title.substring(0, 12) + '...'
                                      : event.title
                                    }
                                  </div>
                                ))}
                                {dayEvents.length > 2 && (
                                  <div className="text-xs text-text-secondary">
                                    +{dayEvents.length - 2} more
                                  </div>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Events for Selected Date */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg border border-border p-6">
                  <h3 className="text-lg font-semibold text-text-primary mb-4">
                    Events for {selectedDate.toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </h3>
                  
                  {getEventsForDate(selectedDate).length > 0 ? (
                    <div className="space-y-4">
                      {getEventsForDate(selectedDate).map((event) => (
                        <div
                          key={event.id}
                          className={`border-l-4 pl-4 py-3 rounded-r-lg ${getImportanceColor(event.importance)}`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium text-text-primary text-sm">
                              {event.title}
                            </h4>
                            <span className={`px-2 py-1 rounded-full text-xs text-white ${getSportColor(event.sport)}`}>
                              {event.sport.toUpperCase()}
                            </span>
                          </div>
                          <div className="space-y-1 text-xs text-text-secondary">
                            <div className="flex items-center space-x-1">
                              <Icon name="Clock" size={12} />
                              <span>{formatTime(event.time)}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Icon name="MapPin" size={12} />
                              <span>{event.venue}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Icon name="Calendar" size={48} className="mx-auto text-gray-400 mb-4" />
                      <p className="text-text-secondary">No events scheduled for this date</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* List View */
            <div className="space-y-6">
              {events.length > 0 ? (
                events.map((event) => (
                  <div key={event.id} className="bg-white rounded-lg border border-border p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <Image
                            src={event.logos[0]}
                            alt={event.teams[0]}
                            className="w-8 h-8 rounded-full"
                          />
                          <span className="text-sm font-medium">vs</span>
                          <Image
                            src={event.logos[1]}
                            alt={event.teams[1]}
                            className="w-8 h-8 rounded-full"
                          />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-text-primary">
                            {event.title}
                          </h3>
                          <p className="text-text-secondary text-sm">
                            {event.description}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className={`px-3 py-1 rounded-full text-xs text-white ${getSportColor(event.sport)}`}>
                          {event.sport.toUpperCase()}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs ${
                          event.importance === 'high' ? 'bg-red-100 text-red-800' :
                          event.importance === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {event.importance.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="flex items-center space-x-2">
                        <Icon name="Calendar" size={16} className="text-primary" />
                        <span className="text-sm text-text-primary">
                          {new Date(event.date).toLocaleDateString('en-US', { 
                            weekday: 'short', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Icon name="Clock" size={16} className="text-primary" />
                        <span className="text-sm text-text-primary">
                          {formatTime(event.time)}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Icon name="MapPin" size={16} className="text-primary" />
                        <span className="text-sm text-text-primary">
                          {event.venue}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Icon name="Tv" size={16} className="text-primary" />
                        <span className="text-sm text-text-primary">
                          {event.broadcast.join(', ')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                      <div className="flex items-center space-x-4">
                        <div className="text-sm">
                          <span className="text-text-secondary">Tickets: </span>
                          <span className={`font-medium ${
                            event.tickets.available ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {event.tickets.price}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <Icon name="Bell" size={14} className="mr-1" />
                          Remind Me
                        </Button>
                        <Button variant="outline" size="sm">
                          <Icon name="Share2" size={14} className="mr-1" />
                          Share
                        </Button>
                        {event.tickets.available && (
                          <Button size="sm">
                            <Icon name="Ticket" size={14} className="mr-1" />
                            Get Tickets
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <Icon name="Calendar" size={64} className="mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Events Found</h3>
                  <p className="text-gray-500">
                    No events available for the selected sport category.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default SportsCalendar;
