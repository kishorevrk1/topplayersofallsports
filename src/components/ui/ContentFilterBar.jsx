import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Icon from '../AppIcon';
import Button from './Button';
import Select from './Select';

const ContentFilterBar = ({ className = '' }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedSport, setSelectedSport] = useState('all');
  const [selectedTimeframe, setSelectedTimeframe] = useState('today');
  const [selectedSource, setSelectedSource] = useState('all');

  const sports = [
    { value: 'all', label: 'All Sports' },
    { value: 'basketball', label: 'Basketball' },
    { value: 'football', label: 'Football' },
    { value: 'soccer', label: 'Soccer' },
    { value: 'baseball', label: 'Baseball' },
    { value: 'hockey', label: 'Hockey' },
    { value: 'tennis', label: 'Tennis' },
    { value: 'golf', label: 'Golf' },
  ];

  const timeframes = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'year', label: 'This Year' },
    { value: 'all', label: 'All Time' },
  ];

  const sources = [
    { value: 'all', label: 'All Sources' },
    { value: 'espn', label: 'ESPN' },
    { value: 'nfl', label: 'NFL.com' },
    { value: 'nba', label: 'NBA.com' },
    { value: 'bleacher', label: 'Bleacher Report' },
    { value: 'athletic', label: 'The Athletic' },
  ];

  const quickFilters = [
    { label: 'Breaking News', icon: 'Zap', active: false },
    { label: 'Live Games', icon: 'Radio', active: true },
    { label: 'Highlights', icon: 'Play', active: false },
    { label: 'Trending', icon: 'TrendingUp', active: false },
  ];

  const handleFilterChange = (filterType, value) => {
    const searchParams = new URLSearchParams(location.search);
    searchParams.set(filterType, value);
    navigate(`${location.pathname}?${searchParams.toString()}`);
  };

  const clearAllFilters = () => {
    setSelectedSport('all');
    setSelectedTimeframe('today');
    setSelectedSource('all');
    navigate(location.pathname);
  };

  const isVideoPage = location.pathname === '/video-highlights-hub';
  const isNewsPage = location.pathname === '/breaking-news-feed';

  if (!isVideoPage && !isNewsPage) {
    return null;
  }

  return (
    <div className={`bg-background border-b border-border ${className}`}>
      {/* Desktop Filter Bar */}
      <div className="hidden lg:flex items-center justify-between px-6 py-4">
        <div className="flex items-center space-x-4">
          <Select
            options={sports}
            value={selectedSport}
            onChange={(value) => {
              setSelectedSport(value);
              handleFilterChange('sport', value);
            }}
            placeholder="Select sport"
            className="w-40"
          />
          
          <Select
            options={timeframes}
            value={selectedTimeframe}
            onChange={(value) => {
              setSelectedTimeframe(value);
              handleFilterChange('timeframe', value);
            }}
            placeholder="Select timeframe"
            className="w-36"
          />

          {isNewsPage && (
            <Select
              options={sources}
              value={selectedSource}
              onChange={(value) => {
                setSelectedSource(value);
                handleFilterChange('source', value);
              }}
              placeholder="Select source"
              className="w-40"
            />
          )}
        </div>

        <div className="flex items-center space-x-2">
          {quickFilters.map((filter) => (
            <Button
              key={filter.label}
              variant={filter.active ? "default" : "outline"}
              size="sm"
              className="flex items-center space-x-1"
            >
              <Icon name={filter.icon} size={14} />
              <span>{filter.label}</span>
            </Button>
          ))}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="ml-4 text-text-secondary hover:text-text-primary"
          >
            <Icon name="X" size={14} className="mr-1" />
            Clear All
          </Button>
        </div>
      </div>

      {/* Mobile Filter Bar */}
      <div className="lg:hidden">
        {/* Quick Filters - Horizontal Scroll */}
        <div className="flex items-center space-x-2 px-4 py-3 overflow-x-auto scrollbar-hide">
          {quickFilters.map((filter) => (
            <Button
              key={filter.label}
              variant={filter.active ? "default" : "outline"}
              size="sm"
              className="flex items-center space-x-1 whitespace-nowrap flex-shrink-0"
            >
              <Icon name={filter.icon} size={14} />
              <span>{filter.label}</span>
            </Button>
          ))}
        </div>

        {/* Dropdown Filters */}
        <div className="flex items-center justify-between px-4 pb-3 space-x-2">
          <Select
            options={sports}
            value={selectedSport}
            onChange={(value) => {
              setSelectedSport(value);
              handleFilterChange('sport', value);
            }}
            placeholder="Sport"
            className="flex-1"
          />
          
          <Select
            options={timeframes}
            value={selectedTimeframe}
            onChange={(value) => {
              setSelectedTimeframe(value);
              handleFilterChange('timeframe', value);
            }}
            placeholder="Time"
            className="flex-1"
          />

          <Button
            variant="ghost"
            size="icon"
            onClick={clearAllFilters}
            className="flex-shrink-0"
          >
            <Icon name="RotateCcw" size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ContentFilterBar;