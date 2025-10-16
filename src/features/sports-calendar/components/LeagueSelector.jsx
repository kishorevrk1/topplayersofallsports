import React, { useState, useEffect } from 'react';
import { useCalendarApi } from '../hooks/useCalendarApi';
import Select from '../../../components/ui/Select';
import { LOADING_STATES, ERROR_MESSAGES } from '../constants/calendar.constants';

/**
 * League Selector Component 
 * Best Practice: Prioritizes user's favorite leagues
 */
export const LeagueSelector = ({ 
  selectedSport, 
  selectedLeague, 
  onLeagueChange, 
  userPreferences 
}) => {
  const [leagues, setLeagues] = useState([]);
  const [loading, setLoading] = useState(false);
  const { getLeagues } = useCalendarApi();

  useEffect(() => {
    if (selectedSport) {
      loadLeagues();
    } else {
      setLeagues([]);
    }
  }, [selectedSport]);

  const loadLeagues = async () => {
    try {
      setLoading(true);
      const leaguesData = await getLeagues(selectedSport);
      setLeagues(leaguesData.leagues || []);
    } catch (error) {
      console.error('Failed to load leagues:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLeagueChange = (value) => {
    onLeagueChange(value === 'all' ? null : value);
  };

  // Sort leagues: favorites first, then by popularity
  const sortedLeagues = leagues.sort((a, b) => {
    const aIsFavorite = userPreferences?.favoriteLeagues?.includes(a.name);
    const bIsFavorite = userPreferences?.favoriteLeagues?.includes(b.name);
    
    if (aIsFavorite && !bIsFavorite) return -1;
    if (!aIsFavorite && bIsFavorite) return 1;
    
    // If both are favorites or both are not, sort by popularity
    return (b.popularity || 0) - (a.popularity || 0);
  });

  const leagueOptions = [
    { value: 'all', label: `All ${selectedSport || 'Sport'} Leagues` },
    ...sortedLeagues.map(league => ({
      value: league.name,
      label: `${league.displayName} (${league.teamCount} teams)`,
      isFavorite: userPreferences?.favoriteLeagues?.includes(league.name),
      subtitle: league.country
    }))
  ];

  if (!selectedSport) {
    return (
      <div className="league-selector disabled">
        <label className="selector-label disabled">
          Select League
        </label>
        <div className="selector-placeholder">
          Please select a sport first
        </div>
      </div>
    );
  }

  return (
    <div className="league-selector">
      <label htmlFor="league-select" className="selector-label">
        <span>Select League</span>
        {userPreferences?.favoriteLeagues?.length > 0 && (
          <span className="favorites-indicator">⭐ Favorites first</span>
        )}
      </label>
      
      <Select
        id="league-select"
        value={selectedLeague || 'all'}
        onChange={handleLeagueChange}
        options={leagueOptions}
        loading={loading}
        placeholder={selectedSport ? `Choose ${selectedSport} league...` : "Select sport first"}
        className="league-select"
        disabled={!selectedSport}
      />
      
      {leagues.length > 0 && (
        <div className="selector-meta">
          {leagues.length} leagues in {selectedSport}
          {userPreferences?.favoriteLeagues?.length > 0 && (
            <span className="favorites-count">
              • {userPreferences.favoriteLeagues.length} favorites
            </span>
          )}
        </div>
      )}
    </div>
  );
};
