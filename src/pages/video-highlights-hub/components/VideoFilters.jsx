import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';

const VideoFilters = ({ 
  filters, 
  onFiltersChange, 
  isOpen, 
  onToggle,
  className = '' 
}) => {
  const [localFilters, setLocalFilters] = useState(filters);

  const durationOptions = [
    { value: 'all', label: 'Any Duration' },
    { value: 'short', label: 'Under 4 minutes' },
    { value: 'medium', label: '4-20 minutes' },
    { value: 'long', label: 'Over 20 minutes' },
  ];

  const dateOptions = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'year', label: 'This Year' },
    { value: 'all', label: 'All Time' },
  ];

  const sourceOptions = [
    { value: 'all', label: 'All Sources' },
    { value: 'espn', label: 'ESPN' },
    { value: 'nfl', label: 'NFL.com' },
    { value: 'nba', label: 'NBA.com' },
    { value: 'youtube', label: 'YouTube' },
    { value: 'bleacher', label: 'Bleacher Report' },
    { value: 'fox', label: 'Fox Sports' },
  ];

  const sortOptions = [
    { value: 'relevance', label: 'Relevance' },
    { value: 'newest', label: 'Upload Date' },
    { value: 'views', label: 'View Count' },
    { value: 'trending', label: 'Trending' },
    { value: 'duration', label: 'Duration' },
  ];

  const qualityOptions = [
    { value: 'all', label: 'Any Quality' },
    { value: 'hd', label: 'HD (720p+)' },
    { value: 'fullhd', label: 'Full HD (1080p+)' },
    { value: '4k', label: '4K (2160p)' },
  ];

  const handleFilterChange = (key, value) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearAllFilters = () => {
    const clearedFilters = {
      duration: 'all',
      uploadDate: 'all',
      source: 'all',
      sortBy: 'relevance',
      quality: 'all',
    };
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const hasActiveFilters = Object.values(localFilters).some(value => value !== 'all' && value !== 'relevance');

  // Desktop Sidebar
  const DesktopFilters = () => (
    <div className={`hidden lg:block w-64 bg-card border-r border-border p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-text-primary">Filters</h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-text-secondary hover:text-text-primary"
          >
            <Icon name="X" size={14} className="mr-1" />
            Clear
          </Button>
        )}
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Sort By
          </label>
          <Select
            options={sortOptions}
            value={localFilters.sortBy}
            onChange={(value) => handleFilterChange('sortBy', value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Upload Date
          </label>
          <Select
            options={dateOptions}
            value={localFilters.uploadDate}
            onChange={(value) => handleFilterChange('uploadDate', value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Duration
          </label>
          <Select
            options={durationOptions}
            value={localFilters.duration}
            onChange={(value) => handleFilterChange('duration', value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Source
          </label>
          <Select
            options={sourceOptions}
            value={localFilters.source}
            onChange={(value) => handleFilterChange('source', value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Quality
          </label>
          <Select
            options={qualityOptions}
            value={localFilters.quality}
            onChange={(value) => handleFilterChange('quality', value)}
          />
        </div>
      </div>
    </div>
  );

  // Mobile Filter Button and Drawer
  const MobileFilters = () => (
    <>
      {/* Filter Toggle Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={onToggle}
        className="lg:hidden flex items-center space-x-2"
      >
        <Icon name="Filter" size={16} />
        <span>Filters</span>
        {hasActiveFilters && (
          <div className="w-2 h-2 bg-accent rounded-full"></div>
        )}
      </Button>

      {/* Mobile Filter Drawer */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-200">
          <div className="absolute bottom-0 left-0 right-0 bg-background rounded-t-lg max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-lg font-semibold text-text-primary">Filters</h3>
              <div className="flex items-center space-x-2">
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFilters}
                    className="text-text-secondary"
                  >
                    Clear All
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onToggle}
                >
                  <Icon name="X" size={20} />
                </Button>
              </div>
            </div>

            <div className="p-4 space-y-4">
              <Select
                label="Sort By"
                options={sortOptions}
                value={localFilters.sortBy}
                onChange={(value) => handleFilterChange('sortBy', value)}
              />

              <Select
                label="Upload Date"
                options={dateOptions}
                value={localFilters.uploadDate}
                onChange={(value) => handleFilterChange('uploadDate', value)}
              />

              <Select
                label="Duration"
                options={durationOptions}
                value={localFilters.duration}
                onChange={(value) => handleFilterChange('duration', value)}
              />

              <Select
                label="Source"
                options={sourceOptions}
                value={localFilters.source}
                onChange={(value) => handleFilterChange('source', value)}
              />

              <Select
                label="Quality"
                options={qualityOptions}
                value={localFilters.quality}
                onChange={(value) => handleFilterChange('quality', value)}
              />
            </div>

            <div className="p-4 border-t border-border">
              <Button
                variant="default"
                fullWidth
                onClick={onToggle}
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  return (
    <>
      <DesktopFilters />
      <MobileFilters />
    </>
  );
};

export default VideoFilters;