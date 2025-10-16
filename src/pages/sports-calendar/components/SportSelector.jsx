import React, { useState, useEffect } from 'react';
import { useCalendarApi } from '../../../hooks/useCalendarApi';
import Select from '../../../components/ui/Select';

/**
 * Sport Selector Component
 * Best Practice: Intelligent defaults with user context
 */
export const SportSelector = ({ 
  selectedSport, 
  onSportChange, 
  userPreferences 
}) => {
  const [sports, setSports] = useState([]);
  const [loading, setLoading] = useState(false);
  const { getAvailableSports } = useCalendarApi();

  useEffect(() => {
    loadSports();
  }, []);

  const loadSports = async () => {
    try {
      setLoading(true);
      const sportsData = await getAvailableSports();
      setSports(sportsData.sports || []);
    } catch (error) {
      console.error('Failed to load sports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSportChange = (value) => {
    onSportChange(value === 'all' ? null : value);
  };

  // Build sport options with league counts
  const sportOptions = [
    { value: 'all', label: 'All Sports' },
    ...sports.map(sport => ({
      value: sport.name,
      label: `${sport.displayName} (${sport.leagueCount} leagues)`,
      isRecommended: userPreferences?.defaultSport === sport.name
    }))
  ];

  return (
    <div className="sport-selector">
      <label htmlFor="sport-select" className="selector-label">
        <span>Select Sport</span>
        {userPreferences?.defaultSport && (
          <span className="default-indicator">⭐ Default</span>
        )}
      </label>
      
      <Select
        id="sport-select"
        value={selectedSport || 'all'}
        onChange={handleSportChange}
        options={sportOptions}
        loading={loading}
        placeholder="Choose a sport..."
        className="sport-select"
      />
      
      {sports.length > 0 && (
        <div className="selector-meta">
          {sports.length} sports available
        </div>
      )}
    </div>
  );
};
