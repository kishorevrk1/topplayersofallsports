import React, { useState, useEffect } from 'react';
import { useCalendarApi } from '../hooks/useCalendarApi';
import Select from '../../../components/ui/Select';
import { LOADING_STATES, ERROR_MESSAGES } from '../constants/calendar.constants';

/**
 * Team Selector Component
 * Best Practice: Shows user's favorite teams prominently
 */
export const TeamSelector = ({ 
  selectedSport, 
  selectedLeague, 
  selectedTeam, 
  onTeamChange, 
  userPreferences 
}) => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const { getTeams } = useCalendarApi();

  useEffect(() => {
    if (selectedSport && selectedLeague) {
      loadTeams();
    } else {
      setTeams([]);
    }
  }, [selectedSport, selectedLeague]);

  const loadTeams = async () => {
    try {
      setLoading(true);
      const teamsData = await getTeams(selectedSport, selectedLeague);
      setTeams(teamsData.teams || []);
    } catch (error) {
      console.error('Failed to load teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTeamChange = (value) => {
    onTeamChange(value === 'all' ? null : value);
  };

  // Sort teams: favorites first, then alphabetically
  const sortedTeams = teams.sort((a, b) => {
    const aIsFavorite = userPreferences?.favoriteTeams?.includes(a.name);
    const bIsFavorite = userPreferences?.favoriteTeams?.includes(b.name);
    
    if (aIsFavorite && !bIsFavorite) return -1;
    if (!aIsFavorite && bIsFavorite) return 1;
    
    // If both are favorites or both are not, sort alphabetically
    return a.displayName.localeCompare(b.displayName);
  });

  const teamOptions = [
    { 
      value: 'all', 
      label: selectedLeague 
        ? `All ${selectedLeague} Teams` 
        : `All ${selectedSport || 'Sport'} Teams`
    },
    ...sortedTeams.map(team => ({
      value: team.name,
      label: team.displayName,
      isFavorite: userPreferences?.favoriteTeams?.includes(team.name),
      subtitle: team.city || team.country,
      icon: team.logoUrl
    }))
  ];

  const isDisabled = !selectedSport || !selectedLeague;

  if (isDisabled) {
    return (
      <div className="team-selector disabled">
        <label className="selector-label disabled">
          Select Team (Optional)
        </label>
        <div className="selector-placeholder">
          {!selectedSport 
            ? "Please select a sport first" 
            : "Please select a league first"
          }
        </div>
      </div>
    );
  }

  return (
    <div className="team-selector">
      <label htmlFor="team-select" className="selector-label">
        <span>Select Team (Optional)</span>
        {userPreferences?.favoriteTeams?.length > 0 && (
          <span className="favorites-indicator">⭐ Favorites first</span>
        )}
      </label>
      
      <Select
        id="team-select"
        value={selectedTeam || 'all'}
        onChange={handleTeamChange}
        options={teamOptions}
        loading={loading}
        placeholder={
          selectedLeague 
            ? `Choose ${selectedLeague} team or view all...` 
            : "Select league first"
        }
        className="team-select"
        disabled={isDisabled}
      />
      
      {teams.length > 0 && (
        <div className="selector-meta">
          {teams.length} teams in {selectedLeague}
          {userPreferences?.favoriteTeams?.length > 0 && (
            <span className="favorites-count">
              • {userPreferences.favoriteTeams.length} favorites
            </span>
          )}
        </div>
      )}
      
      {selectedTeam && (
        <div className="selected-team-info">
          <span className="info-label">Viewing matches for:</span>
          <span className="team-name">{selectedTeam}</span>
        </div>
      )}
    </div>
  );
};
