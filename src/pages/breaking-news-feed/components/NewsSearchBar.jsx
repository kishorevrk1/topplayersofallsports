import React, { useState, useRef, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';

const NewsSearchBar = ({ onSearch, searchQuery, setSearchQuery }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const searchInputRef = useRef(null);

  const mockSuggestions = [
    { id: 1, text: 'NBA trade deadline', type: 'trending', count: 234 },
    { id: 2, text: 'Super Bowl predictions', type: 'trending', count: 189 },
    { id: 3, text: 'LeBron James injury update', type: 'player', count: 156 },
    { id: 4, text: 'Champions League results', type: 'match', count: 143 },
    { id: 5, text: 'NFL draft prospects', type: 'trending', count: 98 },
    { id: 6, text: 'March Madness bracket', type: 'tournament', count: 87 },
    { id: 7, text: 'MLB spring training', type: 'season', count: 76 },
    { id: 8, text: 'Olympic preparations', type: 'event', count: 65 }
  ];

  const recentSearches = [
    'Lakers vs Warriors',
    'Tom Brady retirement',
    'World Cup 2024',
    'NBA MVP race'
  ];

  useEffect(() => {
    if (searchQuery.length > 2) {
      setIsLoading(true);
      const timer = setTimeout(() => {
        const filtered = mockSuggestions.filter(suggestion =>
          suggestion.text.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setSuggestions(filtered);
        setIsLoading(false);
      }, 300);

      return () => clearTimeout(timer);
    } else {
      setSuggestions([]);
      setIsLoading(false);
    }
  }, [searchQuery]);

  const handleSearch = (query = searchQuery) => {
    if (query.trim()) {
      onSearch(query);
      setIsExpanded(false);
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion.text);
    handleSearch(suggestion.text);
  };

  const handleRecentSearchClick = (search) => {
    setSearchQuery(search);
    handleSearch(search);
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 150);
    }
  };

  const getTypeIcon = (type) => {
    const icons = {
      trending: 'TrendingUp',
      player: 'User',
      match: 'Trophy',
      tournament: 'Award',
      season: 'Calendar',
      event: 'Star'
    };
    return icons[type] || 'Search';
  };

  return (
    <div className="relative">
      {/* Mobile Search Toggle */}
      <div className="lg:hidden">
        {!isExpanded ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleExpanded}
            className="hover:bg-muted"
          >
            <Icon name="Search" size={20} />
          </Button>
        ) : (
          <div className="fixed inset-0 bg-background z-50">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-semibold">Search News</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleExpanded}
              >
                <Icon name="X" size={20} />
              </Button>
            </div>
            
            <div className="p-4">
              <div className="relative">
                <Input
                  ref={searchInputRef}
                  type="search"
                  placeholder="Search breaking news, players, teams..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pr-10"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleSearch()}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8"
                >
                  <Icon name="Search" size={16} />
                </Button>
              </div>

              {/* Mobile Search Content */}
              <div className="mt-4 space-y-4">
                {/* Recent Searches */}
                {searchQuery.length === 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-text-primary mb-2 flex items-center">
                      <Icon name="Clock" size={14} className="mr-2" />
                      Recent Searches
                    </h3>
                    <div className="space-y-2">
                      {recentSearches.map((search, index) => (
                        <button
                          key={index}
                          onClick={() => handleRecentSearchClick(search)}
                          className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors text-left"
                        >
                          <span className="text-text-secondary">{search}</span>
                          <Icon name="ArrowUpLeft" size={14} className="text-text-secondary" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Search Suggestions */}
                {suggestions.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-text-primary mb-2">
                      Suggestions
                    </h3>
                    <div className="space-y-2">
                      {suggestions.map((suggestion) => (
                        <button
                          key={suggestion.id}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors text-left"
                        >
                          <div className="flex items-center space-x-3">
                            <Icon 
                              name={getTypeIcon(suggestion.type)} 
                              size={14} 
                              className="text-text-secondary"
                            />
                            <span className="text-text-primary">{suggestion.text}</span>
                          </div>
                          <span className="text-xs text-text-secondary">
                            {suggestion.count} articles
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {isLoading && (
                  <div className="flex items-center justify-center py-4">
                    <Icon name="Loader2" size={20} className="animate-spin text-text-secondary" />
                    <span className="ml-2 text-text-secondary">Searching...</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Desktop Search */}
      <div className="hidden lg:block">
        <div className="relative">
          <Input
            ref={searchInputRef}
            type="search"
            placeholder="Search breaking news, players, teams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            onFocus={() => setIsExpanded(true)}
            onBlur={() => setTimeout(() => setIsExpanded(false), 200)}
            className="w-80 pr-10"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleSearch()}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8"
          >
            <Icon name="Search" size={16} />
          </Button>

          {/* Desktop Search Dropdown */}
          {isExpanded && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
              {searchQuery.length === 0 ? (
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center">
                    <Icon name="Clock" size={14} className="mr-2" />
                    Recent Searches
                  </h3>
                  <div className="space-y-1">
                    {recentSearches.map((search, index) => (
                      <button
                        key={index}
                        onClick={() => handleRecentSearchClick(search)}
                        className="w-full flex items-center justify-between px-3 py-2 rounded hover:bg-muted transition-colors text-left"
                      >
                        <span className="text-text-secondary">{search}</span>
                        <Icon name="ArrowUpLeft" size={12} className="text-text-secondary" />
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-2">
                  {isLoading ? (
                    <div className="p-4 text-center">
                      <Icon name="Loader2" size={20} className="animate-spin mx-auto mb-2" />
                      <span className="text-text-secondary">Searching...</span>
                    </div>
                  ) : (
                    suggestions.map((suggestion) => (
                      <button
                        key={suggestion.id}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted transition-colors text-left"
                      >
                        <div className="flex items-center space-x-3">
                          <Icon 
                            name={getTypeIcon(suggestion.type)} 
                            size={14} 
                            className="text-text-secondary"
                          />
                          <span className="text-text-primary">{suggestion.text}</span>
                        </div>
                        <span className="text-xs text-text-secondary">
                          {suggestion.count} articles
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewsSearchBar;