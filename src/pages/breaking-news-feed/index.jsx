import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from '../../components/ui/Header';
import TabNavigation from '../../components/ui/TabNavigation';
import NewsCard from './components/NewsCard';
import TrendingSidebar from './components/TrendingSidebar';
import SportFilterChips from './components/SportFilterChips';
import NewsSearchBar from './components/NewsSearchBar';
import RefreshIndicator from './components/RefreshIndicator';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import { useNews } from '../../hooks/useNews';

const BreakingNewsFeed = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedSport, setSelectedSport] = useState(searchParams.get('sport') || 'all');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [newArticlesCount, setNewArticlesCount] = useState(0);

  // Use real backend data
  const {
    articles,
    loading,
    hasMore,
    totalArticles,
    loadMore: loadMoreArticles,
    refresh,
    updateFilters
  } = useNews({
    sport: selectedSport,
    searchQuery: searchQuery,
    pageSize: 20
  });

  useEffect(() => {
    // Update URL params when filters change
    const params = new URLSearchParams();
    if (selectedSport !== 'all') params.set('sport', selectedSport);
    if (searchQuery) params.set('q', searchQuery);
    setSearchParams(params);
  }, [selectedSport, searchQuery, setSearchParams]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      setNewArticlesCount(prev => prev + Math.floor(Math.random() * 3) + 1);
    }, 300000); // 5 minutes

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = useCallback(async () => {
    setLastUpdated(new Date());
    setNewArticlesCount(0);
    refresh();
  }, [refresh]);

  const handleSearch = (query) => {
    setSearchQuery(query);
    updateFilters({ searchQuery: query });
  };

  const handleSportChange = (sport) => {
    setSelectedSport(sport);
    updateFilters({ sport });
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      loadMoreArticles();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-16 pb-20 lg:pb-0">
        {/* Page Header */}
        <div className="bg-background border-b border-border">
          <div className="px-4 lg:px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-text-primary flex items-center">
                  <Icon name="Zap" size={28} className="mr-3 text-error" />
                  Breaking News Feed
                </h1>
                <p className="text-text-secondary mt-1">
                  Stay updated with the latest sports news and breaking stories
                </p>
              </div>
              
              <div className="flex items-center space-x-3">
                <NewsSearchBar 
                  onSearch={handleSearch}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                />
                
                <Button
                  variant="outline"
                  size="sm"
                  className="hidden lg:flex items-center space-x-2"
                >
                  <Icon name="Bell" size={16} />
                  <span>Notifications</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Sport Filter Chips */}
        <SportFilterChips 
          selectedSport={selectedSport}
          onSportChange={handleSportChange}
        />

        {/* Refresh Indicator */}
        <RefreshIndicator 
          onRefresh={handleRefresh}
          lastUpdated={lastUpdated}
          newArticlesCount={newArticlesCount}
        />

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            {/* News Feed */}
            <div className="lg:col-span-8">
              {loading ? (
                <div className="space-y-6">
                  {[...Array(3)].map((_, index) => (
                    <div key={index} className="bg-card border border-border rounded-lg p-6 animate-pulse">
                      <div className="flex items-center space-x-2 mb-3">
                        <div className="h-4 bg-muted rounded w-20"></div>
                        <div className="h-4 bg-muted rounded w-16"></div>
                      </div>
                      <div className="h-6 bg-muted rounded mb-3"></div>
                      <div className="h-48 bg-muted rounded mb-3"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-muted rounded"></div>
                        <div className="h-4 bg-muted rounded w-3/4"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : articles.length === 0 ? (
                <div className="text-center py-12">
                  <Icon name="Search" size={48} className="mx-auto text-text-secondary mb-4" />
                  <h3 className="text-lg font-semibold text-text-primary mb-2">No articles found</h3>
                  <p className="text-text-secondary mb-4">
                    Try adjusting your filters or search terms
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedSport('all');
                      setSearchQuery('');
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {articles.map((article) => (
                    <NewsCard 
                      key={article.id} 
                      article={article} 
                      isBreaking={article.isBreaking}
                    />
                  ))}
                  
                  {hasMore && (
                    <div className="text-center py-6">
                      <Button
                        variant="outline"
                        onClick={loadMore}
                        disabled={loading}
                        className="flex items-center space-x-2"
                      >
                        {loading ? (
                          <>
                            <Icon name="Loader2" size={16} className="animate-spin" />
                            <span>Loading...</span>
                          </>
                        ) : (
                          <>
                            <Icon name="ChevronDown" size={16} />
                            <span>Load More Articles</span>
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Trending Sidebar - Desktop Only */}
            <div className="hidden lg:block lg:col-span-4">
              <div className="sticky top-24">
                <TrendingSidebar />
              </div>
            </div>
          </div>
        </div>
      </main>

      <TabNavigation />
    </div>
  );
};

export default BreakingNewsFeed;