import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const FilterChips = ({ onFilterChange }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const sports = [
    { value: 'all', label: 'All Sports', icon: 'Trophy' },
    { value: 'basketball', label: 'Basketball', icon: 'Circle' },
    { value: 'football', label: 'Football', icon: 'Circle' },
    { value: 'soccer', label: 'Soccer', icon: 'Circle' },
    { value: 'baseball', label: 'Baseball', icon: 'Circle' },
    { value: 'hockey', label: 'Hockey', icon: 'Circle' },
    { value: 'tennis', label: 'Tennis', icon: 'Circle' }
  ];

  const contentTypes = [
    { value: 'all', label: 'All Content', icon: 'Grid3X3' },
    { value: 'players', label: 'Players', icon: 'Users' },
    { value: 'news', label: 'News', icon: 'Newspaper' },
    { value: 'videos', label: 'Videos', icon: 'Play' },
    { value: 'teams', label: 'Teams', icon: 'Shield' }
  ];

  const timeRanges = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'year', label: 'This Year' }
  ];

  const sortOptions = [
    { value: 'relevance', label: 'Most Relevant' },
    { value: 'recent', label: 'Most Recent' },
    { value: 'popular', label: 'Most Popular' },
    { value: 'trending', label: 'Trending' }
  ];

  const currentSport = searchParams.get('sport') || 'all';
  const currentType = searchParams.get('type') || 'all';
  const currentTime = searchParams.get('time') || 'all';
  const currentSort = searchParams.get('sort') || 'relevance';

  const updateFilter = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (value === 'all') {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    navigate(`/search-results?${params.toString()}`);
    onFilterChange({ [key]: value });
  };

  const clearAllFilters = () => {
    const params = new URLSearchParams(searchParams);
    params.delete('sport');
    params.delete('type');
    params.delete('time');
    params.delete('sort');
    navigate(`/search-results?${params.toString()}`);
    onFilterChange({});
  };

  const activeFiltersCount = [currentSport, currentType, currentTime, currentSort].filter(
    (filter, index) => filter !== ['all', 'all', 'all', 'relevance'][index]
  ).length;

  return (
    <div className="bg-background border-b border-border">
      {/* Desktop Filter Chips */}
      <div className="hidden lg:block px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 overflow-x-auto">
            {/* Sport Filter */}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-text-secondary whitespace-nowrap">Sport:</span>
              <div className="flex space-x-1">
                {sports.slice(0, 6).map((sport) => (
                  <Button
                    key={sport.value}
                    variant={currentSport === sport.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateFilter('sport', sport.value)}
                    className="whitespace-nowrap"
                  >
                    <Icon name={sport.icon} size={14} className="mr-1" />
                    {sport.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Content Type Filter */}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-text-secondary whitespace-nowrap">Type:</span>
              <div className="flex space-x-1">
                {contentTypes.map((type) => (
                  <Button
                    key={type.value}
                    variant={currentType === type.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateFilter('type', type.value)}
                    className="whitespace-nowrap"
                  >
                    <Icon name={type.icon} size={14} className="mr-1" />
                    {type.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="text-text-secondary hover:text-text-primary"
              >
                <Icon name="X" size={14} className="mr-1" />
                Clear ({activeFiltersCount})
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Chips */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-2 overflow-x-auto flex-1">
            {/* Quick Filter Chips */}
            <Button
              variant={currentType === 'all' ? "default" : "outline"}
              size="sm"
              onClick={() => updateFilter('type', 'all')}
              className="whitespace-nowrap flex-shrink-0"
            >
              <Icon name="Grid3X3" size={14} className="mr-1" />
              All
            </Button>
            <Button
              variant={currentType === 'players' ? "default" : "outline"}
              size="sm"
              onClick={() => updateFilter('type', 'players')}
              className="whitespace-nowrap flex-shrink-0"
            >
              <Icon name="Users" size={14} className="mr-1" />
              Players
            </Button>
            <Button
              variant={currentType === 'news' ? "default" : "outline"}
              size="sm"
              onClick={() => updateFilter('type', 'news')}
              className="whitespace-nowrap flex-shrink-0"
            >
              <Icon name="Newspaper" size={14} className="mr-1" />
              News
            </Button>
            <Button
              variant={currentType === 'videos' ? "default" : "outline"}
              size="sm"
              onClick={() => updateFilter('type', 'videos')}
              className="whitespace-nowrap flex-shrink-0"
            >
              <Icon name="Play" size={14} className="mr-1" />
              Videos
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowMobileFilters(true)}
            className="ml-2 flex-shrink-0"
          >
            <Icon name="SlidersHorizontal" size={14} className="mr-1" />
            Filters
            {activeFiltersCount > 0 && (
              <span className="ml-1 bg-accent text-accent-foreground text-xs rounded-full px-1.5 py-0.5">
                {activeFiltersCount}
              </span>
            )}
          </Button>
        </div>

        {/* Mobile Filter Modal */}
        {showMobileFilters && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-200">
            <div className="absolute bottom-0 left-0 right-0 bg-background rounded-t-xl max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h3 className="text-lg font-semibold">Filters</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowMobileFilters(false)}
                >
                  <Icon name="X" size={20} />
                </Button>
              </div>

              <div className="p-4 space-y-6">
                {/* Sport Filter */}
                <div>
                  <h4 className="font-medium mb-3">Sport</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {sports.map((sport) => (
                      <Button
                        key={sport.value}
                        variant={currentSport === sport.value ? "default" : "outline"}
                        size="sm"
                        onClick={() => updateFilter('sport', sport.value)}
                        className="justify-start"
                      >
                        <Icon name={sport.icon} size={14} className="mr-2" />
                        {sport.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Time Range Filter */}
                <div>
                  <h4 className="font-medium mb-3">Time Range</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {timeRanges.map((time) => (
                      <Button
                        key={time.value}
                        variant={currentTime === time.value ? "default" : "outline"}
                        size="sm"
                        onClick={() => updateFilter('time', time.value)}
                        className="justify-start"
                      >
                        {time.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Sort Options */}
                <div>
                  <h4 className="font-medium mb-3">Sort By</h4>
                  <div className="space-y-2">
                    {sortOptions.map((sort) => (
                      <Button
                        key={sort.value}
                        variant={currentSort === sort.value ? "default" : "outline"}
                        size="sm"
                        onClick={() => updateFilter('sort', sort.value)}
                        className="w-full justify-start"
                      >
                        {sort.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-4 border-t border-border">
                <Button
                  variant="outline"
                  onClick={clearAllFilters}
                  className="flex-1"
                >
                  Clear All
                </Button>
                <Button
                  onClick={() => setShowMobileFilters(false)}
                  className="flex-1"
                >
                  Apply Filters
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FilterChips;