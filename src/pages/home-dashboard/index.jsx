import React, { useState, useEffect } from 'react';
import Header from '../../components/ui/Header';
import TabNavigation from '../../components/ui/TabNavigation';
import HeroSection from './components/HeroSection';
import SportCategoryFilter from './components/SportCategoryFilter';
import ContentFeed from './components/ContentFeed';
import TrendingSidebar from './components/TrendingSidebar';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';

const HomeDashboard = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Handle pull-to-refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    setRefreshTrigger(prev => prev + 1);
    setLastRefresh(new Date());
    
    // Simulate refresh delay
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1500);
  };

  // Auto-refresh every 15 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshTrigger(prev => prev + 1);
      setLastRefresh(new Date());
    }, 15 * 60 * 1000); // 15 minutes

    return () => clearInterval(interval);
  }, []);

  // Handle scroll to top visibility
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatLastRefresh = (date) => {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-16 pb-20 lg:pb-8">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          {/* Refresh Indicator */}
          {isRefreshing && (
            <div className="fixed top-16 left-0 right-0 bg-accent text-white py-2 px-4 z-50">
              <div className="flex items-center justify-center space-x-2">
                <Icon name="RefreshCw" size={16} className="animate-spin" />
                <span className="text-sm font-medium">Refreshing content...</span>
              </div>
            </div>
          )}

          {/* Desktop Layout */}
          <div className="hidden lg:grid lg:grid-cols-12 lg:gap-8">
            {/* Main Content Area */}
            <div className="lg:col-span-9">
              {/* Hero Section */}
              <HeroSection />
              
              {/* Category Filter */}
              <SportCategoryFilter 
                onCategoryChange={setSelectedCategory}
                activeCategory={selectedCategory}
              />
              
              {/* Last Updated Info */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2 text-sm text-text-secondary">
                  <Icon name="Clock" size={14} />
                  <span>Last updated: {formatLastRefresh(lastRefresh)}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="flex items-center space-x-1"
                >
                  <Icon 
                    name="RefreshCw" 
                    size={14} 
                    className={isRefreshing ? 'animate-spin' : ''} 
                  />
                  <span>Refresh</span>
                </Button>
              </div>
              
              {/* Content Feed */}
              <ContentFeed 
                selectedCategory={selectedCategory}
                refreshTrigger={refreshTrigger}
              />
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-3">
              <div className="sticky top-24">
                <TrendingSidebar />
              </div>
            </div>
          </div>

          {/* Mobile Layout */}
          <div className="lg:hidden">
            {/* Hero Section */}
            <HeroSection />
            
            {/* Category Filter */}
            <SportCategoryFilter 
              onCategoryChange={setSelectedCategory}
              activeCategory={selectedCategory}
            />
            
            {/* Pull to Refresh Indicator */}
            <div className="flex items-center justify-between mb-4 px-1">
              <div className="flex items-center space-x-2 text-xs text-text-secondary">
                <Icon name="Clock" size={12} />
                <span>Updated {formatLastRefresh(lastRefresh)}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center space-x-1 text-xs"
              >
                <Icon 
                  name="RefreshCw" 
                  size={12} 
                  className={isRefreshing ? 'animate-spin' : ''} 
                />
                <span>Refresh</span>
              </Button>
            </div>
            
            {/* Content Feed */}
            <ContentFeed 
              selectedCategory={selectedCategory}
              refreshTrigger={refreshTrigger}
            />
          </div>
        </div>
      </main>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-24 right-4 lg:bottom-8 lg:right-8 flex flex-col space-y-3 z-40">
        {/* Scroll to Top */}
        {showScrollTop && (
          <Button
            variant="default"
            size="icon"
            onClick={scrollToTop}
            className="w-12 h-12 rounded-full shadow-lg hover:shadow-xl transition-shadow duration-200"
          >
            <Icon name="ArrowUp" size={20} />
          </Button>
        )}
        
        {/* Quick Search - Mobile Only */}
        <div className="lg:hidden">
          <Button
            variant="default"
            size="icon"
            onClick={() => window.location.href = '/search-results'}
            className="w-12 h-12 rounded-full shadow-lg hover:shadow-xl transition-shadow duration-200 bg-accent hover:bg-accent/90"
          >
            <Icon name="Search" size={20} />
          </Button>
        </div>
      </div>

      <TabNavigation />
    </div>
  );
};

export default HomeDashboard;