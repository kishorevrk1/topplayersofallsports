import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import PlayerCard from './PlayerCard';
import NewsCard from './NewsCard';
import VideoCard from './VideoCard';
import TeamCard from './TeamCard';

const SearchResults = ({ searchQuery, filters, results, isLoading }) => {
  const [expandedSections, setExpandedSections] = useState({
    players: false,
    news: false,
    videos: false,
    teams: false
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getSectionIcon = (section) => {
    const icons = {
      players: 'Users',
      news: 'Newspaper',
      videos: 'Play',
      teams: 'Shield'
    };
    return icons[section];
  };

  const getSectionTitle = (section) => {
    const titles = {
      players: 'Players',
      news: 'News Articles',
      videos: 'Videos',
      teams: 'Teams'
    };
    return titles[section];
  };

  const renderSectionHeader = (section, count) => (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center space-x-2">
        <Icon name={getSectionIcon(section)} size={20} className="text-accent" />
        <h2 className="text-xl font-bold text-text-primary">{getSectionTitle(section)}</h2>
        <span className="bg-muted text-text-secondary px-2 py-1 rounded-full text-sm">
          {count}
        </span>
      </div>
      
      {count > 3 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => toggleSection(section)}
          className="text-accent hover:text-accent"
        >
          {expandedSections[section] ? 'Show Less' : 'View All'}
          <Icon 
            name={expandedSections[section] ? 'ChevronUp' : 'ChevronDown'} 
            size={16} 
            className="ml-1" 
          />
        </Button>
      )}
    </div>
  );

  const renderSection = (section, items, CardComponent) => {
    if (!items || items.length === 0) return null;

    const displayItems = expandedSections[section] ? items : items.slice(0, 3);
    const isCompactView = !expandedSections[section] && items.length > 3;

    return (
      <div className="mb-8">
        {renderSectionHeader(section, items.length)}
        
        <div className={`grid gap-4 ${
          isCompactView 
            ? 'grid-cols-1' :'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
        }`}>
          {displayItems.map((item, index) => (
            <CardComponent 
              key={item.id || index} 
              {...{[section.slice(0, -1)]: item}} 
              isCompact={isCompactView}
            />
          ))}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Icon name="Loader2" size={32} className="animate-spin text-accent mb-4" />
        <h3 className="text-lg font-semibold text-text-primary mb-2">Searching...</h3>
        <p className="text-text-secondary text-center max-w-md">
          Finding the best results for "{searchQuery}"
        </p>
      </div>
    );
  }

  if (!results || Object.values(results).every(arr => !arr || arr.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="bg-muted rounded-full p-6 mb-6">
          <Icon name="Search" size={32} className="text-text-secondary" />
        </div>
        <h3 className="text-xl font-bold text-text-primary mb-2">No results found</h3>
        <p className="text-text-secondary text-center max-w-md mb-6">
          We couldn't find anything matching "{searchQuery}". Try adjusting your search terms or filters.
        </p>
        
        <div className="space-y-4 w-full max-w-md">
          <div className="text-sm font-medium text-text-primary">Suggestions:</div>
          <div className="space-y-2">
            <Button variant="outline" className="w-full justify-start">
              <Icon name="TrendingUp" size={16} className="mr-2" />
              Try "LeBron James"
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Icon name="Newspaper" size={16} className="mr-2" />
              Search "NBA Finals"
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Icon name="Play" size={16} className="mr-2" />
              Look for "highlights"
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const totalResults = Object.values(results).reduce((sum, arr) => sum + (arr?.length || 0), 0);

  return (
    <div className="space-y-6">
      {/* Results Summary */}
      <div className="bg-muted rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">
              Search Results for "{searchQuery}"
            </h2>
            <p className="text-text-secondary">
              Found {totalResults} results
              {Object.keys(filters).length > 0 && (
                <span> with {Object.keys(filters).length} active filter{Object.keys(filters).length > 1 ? 's' : ''}</span>
              )}
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Icon name="Download" size={14} className="mr-1" />
              Export
            </Button>
            <Button variant="outline" size="sm">
              <Icon name="Share2" size={14} className="mr-1" />
              Share
            </Button>
          </div>
        </div>
      </div>

      {/* Results Sections */}
      {renderSection('players', results.players, PlayerCard)}
      {renderSection('news', results.news, NewsCard)}
      {renderSection('videos', results.videos, VideoCard)}
      {renderSection('teams', results.teams, TeamCard)}

      {/* Load More */}
      {totalResults > 0 && (
        <div className="flex justify-center pt-8">
          <Button variant="outline" size="lg">
            <Icon name="RotateCcw" size={16} className="mr-2" />
            Load More Results
          </Button>
        </div>
      )}
    </div>
  );
};

export default SearchResults;