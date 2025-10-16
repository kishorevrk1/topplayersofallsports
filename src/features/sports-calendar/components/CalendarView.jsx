import React, { useState, useEffect } from 'react';
import { useCalendarApi } from '../hooks/useCalendarApi';
import Button from '../../../components/ui/Button';
import { VIEW_TYPES, MATCH_STATUS, DEFAULTS, DATE_FORMATS } from '../constants/calendar.constants';

/**
 * Calendar View Component
 * Best Practice: Intelligent loading and data display
 */
export const CalendarView = ({ 
  selectedSport, 
  selectedLeague, 
  selectedTeam,
  viewMode = 'upcoming' // upcoming, week, month
}) => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const { getCalendarView } = useCalendarApi();

  useEffect(() => {
    loadMatches(true); // Reset pagination on filter change
  }, [selectedSport, selectedLeague, selectedTeam, viewMode]);

  const loadMatches = async (reset = false) => {
    try {
      setLoading(true);
      const currentPage = reset ? 0 : page;
      
      const params = {
        sport: selectedSport,
        league: selectedLeague,
        team: selectedTeam,
        viewMode,
        page: currentPage,
        size: 20
      };

      const response = await getCalendarView(params);
      
      if (reset) {
        setMatches(response.matches || []);
        setPage(0);
      } else {
        setMatches(prev => [...prev, ...(response.matches || [])]);
      }
      
      setHasMore(response.hasMore || false);
      
    } catch (error) {
      console.error('Failed to load matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    setPage(prev => prev + 1);
    loadMatches(false);
  };

  const formatMatchDate = (dateTime) => {
    const date = new Date(dateTime);
    const isToday = new Date().toDateString() === date.toDateString();
    const isTomorrow = new Date(Date.now() + 86400000).toDateString() === date.toDateString();
    
    if (isToday) return 'Today';
    if (isTomorrow) return 'Tomorrow';
    
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getMatchStatus = (match) => {
    const now = new Date();
    const matchTime = new Date(match.dateTime);
    
    if (match.status === 'FINISHED') return 'finished';
    if (match.status === 'LIVE') return 'live';
    if (matchTime < now) return 'missed';
    
    const diffHours = (matchTime - now) / (1000 * 60 * 60);
    if (diffHours < 24) return 'today';
    if (diffHours < 168) return 'week';
    
    return 'upcoming';
  };

  const groupMatchesByDate = (matches) => {
    const grouped = {};
    matches.forEach(match => {
      const dateKey = formatMatchDate(match.dateTime);
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(match);
    });
    return grouped;
  };

  if (!selectedSport && !selectedLeague) {
    return (
      <div className="calendar-view-placeholder">
        <div className="placeholder-content">
          <h3>Welcome to Sports Calendar</h3>
          <p>Select a sport and league to view upcoming matches</p>
        </div>
      </div>
    );
  }

  const groupedMatches = groupMatchesByDate(matches);

  return (
    <div className="calendar-view">
      <div className="calendar-header">
        <div className="view-info">
          <h2>
            {selectedTeam ? `${selectedTeam} Matches` : 
             selectedLeague ? `${selectedLeague} Schedule` : 
             selectedSport ? `${selectedSport} Calendar` : 
             'Sports Calendar'}
          </h2>
          
          {matches.length > 0 && (
            <div className="match-count">
              {matches.length} matches found
            </div>
          )}
        </div>
        
        <div className="view-modes">
          <Button 
            variant={viewMode === 'upcoming' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setPage(0)}
          >
            Upcoming
          </Button>
          <Button 
            variant={viewMode === 'week' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setPage(0)}
          >
            This Week
          </Button>
          <Button 
            variant={viewMode === 'month' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setPage(0)}
          >
            This Month
          </Button>
        </div>
      </div>

      {loading && matches.length === 0 ? (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <span>Loading matches...</span>
        </div>
      ) : matches.length === 0 ? (
        <div className="empty-state">
          <h3>No matches found</h3>
          <p>
            {selectedTeam ? `No matches scheduled for ${selectedTeam}` :
             selectedLeague ? `No matches in ${selectedLeague}` :
             `No matches in ${selectedSport}`}
          </p>
        </div>
      ) : (
        <div className="matches-container">
          {Object.entries(groupedMatches).map(([date, dayMatches]) => (
            <div key={date} className="match-day-group">
              <h3 className="day-header">{date}</h3>
              
              <div className="day-matches">
                {dayMatches.map(match => (
                  <div 
                    key={match.id} 
                    className={`match-card ${getMatchStatus(match)}`}
                  >
                    <div className="match-time">
                      {new Date(match.dateTime).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit'
                      })}
                    </div>
                    
                    <div className="match-teams">
                      <div className="team home-team">
                        <span className="team-name">{match.homeTeam}</span>
                        {match.homeScore !== null && (
                          <span className="team-score">{match.homeScore}</span>
                        )}
                      </div>
                      
                      <div className="match-vs">vs</div>
                      
                      <div className="team away-team">
                        <span className="team-name">{match.awayTeam}</span>
                        {match.awayScore !== null && (
                          <span className="team-score">{match.awayScore}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="match-meta">
                      <span className="league-name">{match.leagueName}</span>
                      {match.venue && (
                        <span className="venue">📍 {match.venue}</span>
                      )}
                      <span className={`status ${match.status.toLowerCase()}`}>
                        {match.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          
          {hasMore && (
            <div className="load-more-section">
              <Button 
                variant="secondary" 
                onClick={loadMore}
                disabled={loading}
                className="load-more-btn"
              >
                {loading ? 'Loading...' : 'Load More Matches'}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
