import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../AppIcon';
import Button from './Button';
import Input from './Input';

const SearchInterface = ({ isExpanded, onToggle, className = '' }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const searchInputRef = useRef(null);
  const navigate = useNavigate();

  const categories = [
    { value: 'all', label: 'All', icon: 'Search' },
    { value: 'players', label: 'Players', icon: 'Users' },
    { value: 'teams', label: 'Teams', icon: 'Shield' },
    { value: 'news', label: 'News', icon: 'Newspaper' },
    { value: 'videos', label: 'Videos', icon: 'Play' },
  ];

  const mockSuggestions = [
    { id: 1, text: 'LeBron James', category: 'players', type: 'Player' },
    { id: 2, text: 'Lakers vs Warriors', category: 'news', type: 'News' },
    { id: 3, text: 'Tom Brady highlights', category: 'videos', type: 'Video' },
    { id: 4, text: 'Manchester United', category: 'teams', type: 'Team' },
    { id: 5, text: 'NBA Finals 2024', category: 'news', type: 'News' },
  ];

  useEffect(() => {
    if (isExpanded && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isExpanded]);

  useEffect(() => {
    if (searchQuery.length > 2) {
      setIsLoading(true);
      // Simulate API call delay
      const timer = setTimeout(() => {
        const filtered = mockSuggestions.filter(suggestion =>
          suggestion.text.toLowerCase().includes(searchQuery.toLowerCase()) &&
          (selectedCategory === 'all' || suggestion.category === selectedCategory)
        );
        setSuggestions(filtered);
        setIsLoading(false);
      }, 300);

      return () => clearTimeout(timer);
    } else {
      setSuggestions([]);
      setIsLoading(false);
    }
  }, [searchQuery, selectedCategory]);

  const handleSearch = (query = searchQuery) => {
    if (query.trim()) {
      navigate(`/search-results?q=${encodeURIComponent(query)}&category=${selectedCategory}`);
      setSearchQuery('');
      setSuggestions([]);
      onToggle();
    }
  };

  const handleSuggestionClick = (suggestion) => {
    handleSearch(suggestion.text);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    } else if (e.key === 'Escape') {
      onToggle();
    }
  };

  if (!isExpanded) {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggle}
        className={`hover:bg-muted ${className}`}
      >
        <Icon name="Search" size={20} />
      </Button>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Desktop Search */}
      <div className="hidden md:flex items-center space-x-2">
        <div className="relative">
          <Input
            ref={searchInputRef}
            type="search"
            placeholder="Search players, teams, news..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-80 pr-10"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => handleSearch()}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8"
          >
            <Icon name="Search" size={16} />
          </Button>
        </div>

        {/* Category Filter */}
        <div className="flex items-center space-x-1 bg-muted rounded-lg p-1">
          {categories.slice(0, 3).map((category) => (
            <Button
              key={category.value}
              variant={selectedCategory === category.value ? "default" : "ghost"}
              size="sm"
              onClick={() => setSelectedCategory(category.value)}
              className="h-8 px-3"
            >
              <Icon name={category.icon} size={14} className="mr-1" />
              {category.label}
            </Button>
          ))}
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="hover:bg-muted"
        >
          <Icon name="X" size={20} />
        </Button>
      </div>

      {/* Mobile Search Overlay */}
      <div className="md:hidden fixed inset-0 bg-background z-200">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Search</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
          >
            <Icon name="X" size={20} />
          </Button>
        </div>

        <div className="p-4 space-y-4">
          <Input
            ref={searchInputRef}
            type="search"
            placeholder="Search players, teams, news..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full"
          />

          {/* Mobile Category Filter */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category.value}
                variant={selectedCategory === category.value ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.value)}
                className="flex items-center space-x-1"
              >
                <Icon name={category.icon} size={14} />
                <span>{category.label}</span>
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Search Suggestions Dropdown */}
      {suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-interactive z-200 max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-text-secondary">
              <Icon name="Loader2" size={20} className="animate-spin mx-auto mb-2" />
              Searching...
            </div>
          ) : (
            <div className="py-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted transition-colors duration-150 text-left"
                >
                  <div className="flex items-center space-x-3">
                    <Icon 
                      name={categories.find(cat => cat.value === suggestion.category)?.icon || 'Search'} 
                      size={16} 
                      className="text-text-secondary"
                    />
                    <div>
                      <div className="font-medium text-text-primary">{suggestion.text}</div>
                      <div className="text-sm text-text-secondary">{suggestion.type}</div>
                    </div>
                  </div>
                  <Icon name="ArrowUpRight" size={14} className="text-text-secondary" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchInterface;