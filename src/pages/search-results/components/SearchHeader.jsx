import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const SearchHeader = ({ onSearchChange, searchQuery, setSearchQuery }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const mockSuggestions = [
    { id: 1, text: "LeBron James", type: "Player", category: "players" },
    { id: 2, text: "Lakers vs Warriors", type: "News", category: "news" },
    { id: 3, text: "Tom Brady highlights", type: "Video", category: "videos" },
    { id: 4, text: "Manchester United", type: "Team", category: "teams" },
    { id: 5, text: "NBA Finals 2024", type: "News", category: "news" },
    { id: 6, text: "Cristiano Ronaldo", type: "Player", category: "players" },
    { id: 7, text: "Super Bowl highlights", type: "Video", category: "videos" }
  ];

  const recentSearches = [
    "Stephen Curry stats",
    "NFL trade news",
    "Champions League highlights"
  ];

  useEffect(() => {
    if (searchQuery.length > 1) {
      const filtered = mockSuggestions.filter(suggestion =>
        suggestion.text.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5);
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchQuery]);

  const handleSearch = (query = searchQuery) => {
    if (query.trim()) {
      const params = new URLSearchParams(searchParams);
      params.set('q', query);
      navigate(`/search-results?${params.toString()}`);
      onSearchChange(query);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion.text);
    handleSearch(suggestion.text);
  };

  const handleClear = () => {
    setSearchQuery('');
    setShowSuggestions(false);
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="sticky top-16 bg-background border-b border-border z-50">
      {/* Mobile Search Header */}
      <div className="lg:hidden">
        <div className="flex items-center p-4 space-x-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="flex-shrink-0"
          >
            <Icon name="ArrowLeft" size={20} />
          </Button>
          
          <div className="flex-1 relative">
            <Input
              type="search"
              placeholder="Search players, teams, news..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pr-10"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClear}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8"
              >
                <Icon name="X" size={16} />
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Suggestions Dropdown */}
        {showSuggestions && (
          <div className="absolute top-full left-0 right-0 bg-popover border-b border-border shadow-lg max-h-80 overflow-y-auto">
            <div className="p-2">
              {suggestions.length > 0 ? (
                <div className="space-y-1">
                  <div className="px-3 py-2 text-xs font-medium text-text-secondary uppercase tracking-wide">
                    Suggestions
                  </div>
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion.id}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-muted rounded-lg transition-colors duration-150 text-left"
                    >
                      <Icon 
                        name={suggestion.category === 'players' ? 'User' : 
                              suggestion.category === 'teams' ? 'Shield' :
                              suggestion.category === 'videos' ? 'Play' : 'Newspaper'} 
                        size={16} 
                        className="text-text-secondary flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-text-primary truncate">{suggestion.text}</div>
                        <div className="text-sm text-text-secondary">{suggestion.type}</div>
                      </div>
                      <Icon name="ArrowUpRight" size={14} className="text-text-secondary flex-shrink-0" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="px-3 py-2 text-xs font-medium text-text-secondary uppercase tracking-wide">
                    Recent Searches
                  </div>
                  {recentSearches.map((search, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick({ text: search })}
                      className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-muted rounded-lg transition-colors duration-150 text-left"
                    >
                      <Icon name="Clock" size={16} className="text-text-secondary flex-shrink-0" />
                      <span className="font-medium text-text-primary">{search}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Desktop Search Header */}
      <div className="hidden lg:block">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
            >
              <Icon name="ArrowLeft" size={20} />
            </Button>
            
            <div className="relative">
              <Input
                type="search"
                placeholder="Search players, teams, news, videos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-96 pr-10"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClear}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8"
                >
                  <Icon name="X" size={16} />
                </Button>
              )}

              {/* Desktop Suggestions Dropdown */}
              {showSuggestions && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-80 overflow-y-auto z-100">
                  <div className="py-2">
                    {suggestions.length > 0 ? (
                      <div className="space-y-1">
                        <div className="px-4 py-2 text-xs font-medium text-text-secondary uppercase tracking-wide">
                          Suggestions
                        </div>
                        {suggestions.map((suggestion) => (
                          <button
                            key={suggestion.id}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted transition-colors duration-150 text-left"
                          >
                            <div className="flex items-center space-x-3">
                              <Icon 
                                name={suggestion.category === 'players' ? 'User' : 
                                      suggestion.category === 'teams' ? 'Shield' :
                                      suggestion.category === 'videos' ? 'Play' : 'Newspaper'} 
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
                    ) : (
                      <div className="space-y-1">
                        <div className="px-4 py-2 text-xs font-medium text-text-secondary uppercase tracking-wide">
                          Recent Searches
                        </div>
                        {recentSearches.map((search, index) => (
                          <button
                            key={index}
                            onClick={() => handleSuggestionClick({ text: search })}
                            className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-muted transition-colors duration-150 text-left"
                          >
                            <Icon name="Clock" size={16} className="text-text-secondary" />
                            <span className="font-medium text-text-primary">{search}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Icon name="Filter" size={16} className="mr-2" />
              Filters
            </Button>
            <Button variant="ghost" size="sm">
              <Icon name="SlidersHorizontal" size={16} className="mr-2" />
              Sort
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchHeader;