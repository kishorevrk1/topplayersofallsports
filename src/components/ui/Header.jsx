import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Icon from '../AppIcon';
import Button from './Button';
import Input from './Input';
import UserProfile from '../UserProfile';

const Header = () => {
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();

  const navigationItems = [
    { label: 'Home', path: '/home-dashboard', icon: 'Home' },
    { label: 'Players', path: '/players', icon: 'Users' },
    { label: 'Calendar', path: '/sports-calendar', icon: 'Calendar' },
    { label: 'Videos', path: '/video-highlights-hub', icon: 'Play' },
    { label: 'News', path: '/breaking-news-feed', icon: 'Newspaper' },
  ];

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search-results?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  const toggleSearch = () => {
    setIsSearchExpanded(!isSearchExpanded);
    if (!isSearchExpanded) {
      setTimeout(() => {
        document.getElementById('search-input')?.focus();
      }, 150);
    }
  };

  const isActiveRoute = (path) => {
    return location.pathname === path;
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-background border-b border-border z-100">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        {/* Logo */}
        <Link to="/home-dashboard" className="flex items-center space-x-2">
          <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-lg">
            <Icon name="Trophy" size={20} color="white" />
          </div>
          <span className="text-xl font-bold text-primary hidden sm:block">
            TopPlayersofAllSports
          </span>
          <span className="text-xl font-bold text-primary sm:hidden">
            TPAS
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center space-x-8">
          {navigationItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${
                isActiveRoute(item.path)
                  ? 'bg-accent text-accent-foreground'
                  : 'text-text-secondary hover:text-text-primary hover:bg-muted'
              }`}
            >
              <Icon name={item.icon} size={18} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Search and Actions */}
        <div className="flex items-center space-x-3">
          {/* Desktop Search */}
          <div className="hidden md:block">
            {isSearchExpanded ? (
              <form onSubmit={handleSearchSubmit} className="flex items-center">
                <Input
                  id="search-input"
                  type="search"
                  placeholder="Search players, teams, news..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={toggleSearch}
                  className="ml-2"
                >
                  <Icon name="X" size={20} />
                </Button>
              </form>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSearch}
                className="hover:bg-muted"
              >
                <Icon name="Search" size={20} />
              </Button>
            )}
          </div>

          {/* Mobile Search */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSearch}
            className="md:hidden hover:bg-muted"
          >
            <Icon name="Search" size={20} />
          </Button>

          {/* User Profile */}
          <UserProfile />

          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden hover:bg-muted"
          >
            <Icon name={isMobileMenuOpen ? "X" : "Menu"} size={20} />
          </Button>
        </div>
      </div>

      {/* Mobile Search Overlay */}
      {isSearchExpanded && (
        <div className="md:hidden bg-background border-b border-border p-4">
          <form onSubmit={handleSearchSubmit}>
            <Input
              id="mobile-search-input"
              type="search"
              placeholder="Search players, teams, news..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </form>
        </div>
      )}

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-background border-b border-border">
          <nav className="px-4 py-2 space-y-1">
            {navigationItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center space-x-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors duration-150 ${
                  isActiveRoute(item.path)
                    ? 'bg-accent text-accent-foreground'
                    : 'text-text-secondary hover:text-text-primary hover:bg-muted'
                }`}
              >
                <Icon name={item.icon} size={20} />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;