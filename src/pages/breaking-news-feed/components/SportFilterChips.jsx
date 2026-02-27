import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { useNewsStats } from '../../../hooks/useNews';

const SportFilterChips = ({ selectedSport, onSportChange }) => {
  const [showAll, setShowAll] = useState(false);
  const { stats, loading } = useNewsStats();

  // Map backend stats to frontend sports
  const getSportCount = (sportId) => {
    if (!stats) return 0;
    
    const sportMap = {
      'all': stats.totalArticles,
      'basketball': stats.basketballCount,
      'football': stats.footballCount,
      'soccer': stats.soccerCount,
      'baseball': stats.baseballCount,
      'hockey': stats.hockeyCount,
      'tennis': stats.tennisCount,
      'golf': stats.golfCount,
      'mma': stats.mmaCount
    };
    
    return sportMap[sportId] || 0;
  };

  // Only show sports that match highlights (same as video-highlights-hub)
  const sports = [
    { id: 'all', name: 'All Sports', icon: 'Globe', count: getSportCount('all') },
    { id: 'basketball', name: 'Basketball', icon: 'Circle', count: getSportCount('basketball') },
    { id: 'football', name: 'Football', icon: 'Zap', count: getSportCount('football') },
    { id: 'soccer', name: 'Soccer', icon: 'Circle', count: getSportCount('soccer') },
    { id: 'baseball', name: 'Baseball', icon: 'Circle', count: getSportCount('baseball') },
    { id: 'hockey', name: 'Hockey', icon: 'Circle', count: getSportCount('hockey') }
  ].filter(sport => sport.count > 0 || sport.id === 'all'); // Only show sports with articles

  const visibleSports = showAll ? sports : sports.slice(0, 6);

  return (
    <div className="bg-background border-b border-border sticky top-16 z-40">
      <div className="px-4 lg:px-6 py-3">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-text-primary flex items-center">
            <Icon name="Filter" size={16} className="mr-2" />
            Filter by Sport
          </h3>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-text-secondary">
              {sports.find(s => s.id === selectedSport)?.count || 0} articles
            </span>
            {sports.length > 6 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAll(!showAll)}
                className="text-xs h-6 px-2"
              >
                {showAll ? 'Show Less' : 'Show More'}
                <Icon 
                  name={showAll ? 'ChevronUp' : 'ChevronDown'} 
                  size={12} 
                  className="ml-1" 
                />
              </Button>
            )}
          </div>
        </div>

        {/* Desktop Filter Chips */}
        <div className="hidden lg:flex flex-wrap gap-2">
          {visibleSports.map((sport) => (
            <Button
              key={sport.id}
              variant={selectedSport === sport.id ? "default" : "outline"}
              size="sm"
              onClick={() => onSportChange(sport.id)}
              className="flex items-center space-x-2 h-8"
            >
              <Icon name={sport.icon} size={14} />
              <span>{sport.name}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                selectedSport === sport.id 
                  ? 'bg-primary-foreground text-primary' 
                  : 'bg-muted text-text-secondary'
              }`}>
                {sport.count}
              </span>
            </Button>
          ))}
        </div>

        {/* Mobile Filter Chips - Horizontal Scroll */}
        <div className="lg:hidden">
          <div className="flex space-x-2 overflow-x-auto scrollbar-hide pb-2">
            {visibleSports.map((sport) => (
              <Button
                key={sport.id}
                variant={selectedSport === sport.id ? "default" : "outline"}
                size="sm"
                onClick={() => onSportChange(sport.id)}
                className="flex items-center space-x-2 whitespace-nowrap flex-shrink-0 h-8"
              >
                <Icon name={sport.icon} size={14} />
                <span>{sport.name}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  selectedSport === sport.id 
                    ? 'bg-primary-foreground text-primary' 
                    : 'bg-muted text-text-secondary'
                }`}>
                  {sport.count}
                </span>
              </Button>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-6 px-2 text-text-secondary hover:text-text-primary"
            >
              <Icon name="Clock" size={12} className="mr-1" />
              Last 24h
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-6 px-2 text-text-secondary hover:text-text-primary"
            >
              <Icon name="Zap" size={12} className="mr-1" />
              Breaking Only
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-6 px-2 text-text-secondary hover:text-text-primary"
            >
              <Icon name="Radio" size={12} className="mr-1" />
              Live Updates
            </Button>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSportChange('all')}
            className="text-xs h-6 px-2 text-text-secondary hover:text-text-primary"
          >
            <Icon name="RotateCcw" size={12} className="mr-1" />
            Clear Filters
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SportFilterChips;