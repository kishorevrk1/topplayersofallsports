import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const SportFilterChips = ({ selectedSport, onSportChange }) => {
  const [showAll, setShowAll] = useState(false);

  const sports = [
    { id: 'all', name: 'All Sports', icon: 'Globe', count: 1247 },
    { id: 'basketball', name: 'Basketball', icon: 'Circle', count: 342 },
    { id: 'football', name: 'Football', icon: 'Zap', count: 289 },
    { id: 'soccer', name: 'Soccer', icon: 'Circle', count: 234 },
    { id: 'baseball', name: 'Baseball', icon: 'Circle', count: 156 },
    { id: 'hockey', name: 'Hockey', icon: 'Circle', count: 98 },
    { id: 'tennis', name: 'Tennis', icon: 'Circle', count: 87 },
    { id: 'golf', name: 'Golf', icon: 'Circle', count: 65 },
    { id: 'boxing', name: 'Boxing', icon: 'Square', count: 43 },
    { id: 'mma', name: 'MMA', icon: 'Square', count: 38 },
    { id: 'racing', name: 'Racing', icon: 'Zap', count: 29 },
    { id: 'olympics', name: 'Olympics', icon: 'Award', count: 21 }
  ];

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