import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import Header from '../../components/ui/Header';
import TabNavigation from '../../components/ui/TabNavigation';
import ContentFilterBar from '../../components/ui/ContentFilterBar';
import FeaturedHighlights from './components/FeaturedHighlights';
import SportFilterTabs from './components/SportFilterTabs';
import VideoFilters from './components/VideoFilters';
import VideoGrid from './components/VideoGrid';
import YouTubePlayer from './components/YouTubePlayer';
import TrendingSidebar from './components/TrendingSidebar';
import TimeFilter from './components/TimeFilter';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import {
  useHighlights,
  useFeaturedHighlights,
  useTrendingHighlights,
} from '../../hooks/useHighlights';

const VideoHighlightsHub = () => {
  const [selectedSport, setSelectedSport] = useState('all');
  const [selectedTime, setSelectedTime] = useState('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [savedVideos, setSavedVideos] = useState([]);
  const [sortBy, setSortBy] = useState('publishedAt');
  
  const observerTarget = useRef(null);

  // Calculate date range based on selected time filter
  const getDateRange = useCallback(() => {
    const now = new Date();
    switch (selectedTime) {
      case 'today':
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        return today.toISOString();
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return weekAgo.toISOString();
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return monthAgo.toISOString();
      default:
        return null;
    }
  }, [selectedTime]);

  // Fetch highlights with filters
  const {
    highlights,
    isLoading,
    error,
    hasMore,
    totalElements,
    loadMore,
    updateFilters,
    refresh,
  } = useHighlights({
    sport: selectedSport === 'all' ? null : selectedSport,
    sort: sortBy,
    direction: 'desc',
    startDate: getDateRange(),
  });

  // Fetch featured highlights
  const {
    featured: featuredVideos,
    isLoading: isFeaturedLoading,
  } = useFeaturedHighlights({
    sport: selectedSport === 'all' ? null : selectedSport,
    limit: 3,
  });

  // Fetch trending highlights
  const {
    trending: trendingVideos,
    isLoading: isTrendingLoading,
  } = useTrendingHighlights({
    sport: selectedSport === 'all' ? null : selectedSport,
    limit: 10,
  });

  // Update filters when time, sport, or sort changes
  useEffect(() => {
    updateFilters({
      sport: selectedSport === 'all' ? null : selectedSport,
      sort: sortBy,
      direction: 'desc',
      startDate: getDateRange(),
    });
  }, [selectedTime, selectedSport, sortBy, updateFilters, getDateRange]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, isLoading, loadMore]);

  const handlePlayVideo = (video) => {
    setSelectedVideo(video);
    setIsPlayerOpen(true);
  };

  const handleClosePlayer = () => {
    setIsPlayerOpen(false);
    setSelectedVideo(null);
  };

  const handleSaveVideo = (video) => {
    setSavedVideos(prev => {
      const isSaved = prev.some(v => v.id === video.id);
      if (isSaved) {
        return prev.filter(v => v.id !== video.id);
      }
      return [...prev, video];
    });
  };

  const isVideoSaved = (videoId) => {
    return savedVideos.some(v => v.id === videoId);
  };

  const handleSportChange = (sport) => {
    setSelectedSport(sport);
  };

  const handleSortChange = (newSortBy) => {
    setSortBy(newSortBy);
  };

  const handleFilterChange = (newFilters) => {
    // Map frontend filter format to backend format
    const backendSort = {
      'newest': 'publishedAt',
      'mostViewed': 'viewCount',
      'mostLiked': 'likeCount',
      'trending': 'trending',
      'relevance': 'publishedAt',
    }[newFilters.sortBy] || 'publishedAt';

    setSortBy(backendSort);
  };

  return (
    <>
      <Helmet>
        <title>Video Highlights Hub - Top Players of All Sports</title>
        <meta name="description" content="Watch the best sports highlights from basketball, football, soccer, MMA, tennis, and more. Catch up on the latest games and top plays." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        <TabNavigation />
        <ContentFilterBar />

        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-text-primary mb-2">
                Video Highlights Hub
              </h1>
              <p className="text-text-secondary">
                Watch the best sports highlights from around the world
                {totalElements > 0 && (
                  <span className="ml-2 text-accent font-medium">
                    ({totalElements.toLocaleString()} videos)
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="flex items-center space-x-2"
              >
                <Icon name="SlidersHorizontal" size={16} />
                <span>Filters</span>
              </Button>
              <Button
                variant="outline"
                onClick={refresh}
                className="flex items-center space-x-2"
              >
                <Icon name="RefreshCw" size={16} />
                <span>Refresh</span>
              </Button>
            </div>
          </div>

          {/* Featured Highlights */}
          {!isFeaturedLoading && featuredVideos.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-text-primary mb-6">
                Featured Highlights
              </h2>
              <FeaturedHighlights
                videos={featuredVideos}
                onPlay={handlePlayVideo}
              />
            </div>
          )}

          {/* Sport Filter Tabs */}
          <div className="mb-6">
            <SportFilterTabs
              selectedSport={selectedSport}
              onSportChange={handleSportChange}
            />
          </div>

          {/* Time Filter */}
          <div className="mb-8 flex justify-between items-center">
            <TimeFilter
              selectedTime={selectedTime}
              onTimeChange={setSelectedTime}
            />
            <div className="text-sm text-text-secondary">
              {totalElements} videos
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Column - Filters (Collapsible) */}
            {isFilterOpen && (
              <div className="lg:w-64 flex-shrink-0">
                <VideoFilters
                  filters={{
                    sortBy: sortBy === 'publishedAt' ? 'newest' : 
                            sortBy === 'viewCount' ? 'mostViewed' :
                            sortBy === 'likeCount' ? 'mostLiked' :
                            sortBy === 'trending' ? 'trending' : 'newest',
                  }}
                  onFilterChange={handleFilterChange}
                />
              </div>
            )}

            {/* Center Column - Video Grid */}
            <div className="flex-1 min-w-0">
              {error && (
                <div className="bg-error/10 border border-error text-error px-4 py-3 rounded-lg mb-6">
                  <div className="flex items-center space-x-2">
                    <Icon name="AlertCircle" size={20} />
                    <span>Error loading videos: {error}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={refresh}
                    className="mt-2"
                  >
                    Try Again
                  </Button>
                </div>
              )}

              <VideoGrid
                videos={highlights}
                onPlay={handlePlayVideo}
                onSave={handleSaveVideo}
                savedVideos={savedVideos}
                isLoading={isLoading}
              />

              {/* Loading More Indicator */}
              {isLoading && highlights.length > 0 && (
                <div className="flex justify-center py-8">
                  <div className="flex items-center space-x-2 text-text-secondary">
                    <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
                    <span>Loading more videos...</span>
                  </div>
                </div>
              )}

              {/* Infinite Scroll Trigger */}
              {hasMore && !isLoading && (
                <div ref={observerTarget} className="h-20" />
              )}

              {/* No More Videos */}
              {!hasMore && highlights.length > 0 && (
                <div className="text-center py-8 text-text-secondary">
                  <Icon name="CheckCircle" size={24} className="mx-auto mb-2" />
                  <p>You've reached the end of the highlights</p>
                </div>
              )}

              {/* No Results */}
              {!isLoading && highlights.length === 0 && !error && (
                <div className="text-center py-16">
                  <Icon name="Video" size={48} className="mx-auto mb-4 text-text-secondary" />
                  <h3 className="text-xl font-semibold text-text-primary mb-2">
                    No highlights found
                  </h3>
                  <p className="text-text-secondary mb-4">
                    Try adjusting your filters or check back later for new content
                  </p>
                  <Button onClick={() => setSelectedSport('all')}>
                    View All Sports
                  </Button>
                </div>
              )}
            </div>

            {/* Right Column - Trending Sidebar */}
            <div className="lg:w-80 flex-shrink-0">
              <TrendingSidebar
                videos={trendingVideos}
                onPlay={handlePlayVideo}
                isLoading={isTrendingLoading}
              />
            </div>
          </div>
        </div>

        {/* Video Player Modal */}
        {isPlayerOpen && selectedVideo && (
          <YouTubePlayer
            video={selectedVideo}
            onClose={handleClosePlayer}
            relatedVideos={highlights.slice(0, 10)}
            onVideoSelect={handlePlayVideo}
          />
        )}
      </div>
    </>
  );
};

export default VideoHighlightsHub;
