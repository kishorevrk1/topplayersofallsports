import React, { useState, useEffect } from 'react';
import VideoCard from './VideoCard';
import Icon from '../../../components/AppIcon';

const VideoGrid = ({ 
  videos, 
  onVideoPlay, 
  onVideoSave, 
  savedVideos = [], 
  isLoading = false,
  hasMore = true,
  onLoadMore,
  className = '' 
}) => {
  const [visibleVideos, setVisibleVideos] = useState([]);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    setVisibleVideos(videos);
  }, [videos]);

  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop
        >= document.documentElement.offsetHeight - 1000 &&
        hasMore &&
        !loadingMore &&
        !isLoading
      ) {
        handleLoadMore();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasMore, loadingMore, isLoading]);

  const handleLoadMore = async () => {
    if (onLoadMore && hasMore && !loadingMore) {
      setLoadingMore(true);
      await onLoadMore();
      setLoadingMore(false);
    }
  };

  const isVideoSaved = (videoId) => {
    return savedVideos.some(saved => saved.id === videoId);
  };

  // Skeleton loader component
  const SkeletonCard = () => (
    <div className="bg-card rounded-lg overflow-hidden shadow-sm animate-pulse">
      <div className="aspect-video bg-muted"></div>
      <div className="p-4 space-y-3">
        <div className="h-4 bg-muted rounded w-3/4"></div>
        <div className="h-3 bg-muted rounded w-1/2"></div>
        <div className="flex justify-between">
          <div className="h-3 bg-muted rounded w-1/4"></div>
          <div className="h-3 bg-muted rounded w-1/4"></div>
        </div>
      </div>
    </div>
  );

  if (isLoading && visibleVideos.length === 0) {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 ${className}`}>
        {Array.from({ length: 12 }).map((_, index) => (
          <SkeletonCard key={index} />
        ))}
      </div>
    );
  }

  if (visibleVideos.length === 0 && !isLoading) {
    return (
      <div className={`flex flex-col items-center justify-center py-12 text-center ${className}`}>
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
          <Icon name="Play" size={24} className="text-text-secondary" />
        </div>
        <h3 className="text-lg font-semibold text-text-primary mb-2">
          No videos found
        </h3>
        <p className="text-text-secondary max-w-md">
          Try adjusting your filters or search terms to find more video highlights.
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Video Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
        {visibleVideos.map((video) => (
          <VideoCard
            key={video.id}
            video={video}
            onPlay={onVideoPlay}
            onSave={onVideoSave}
            isSaved={isVideoSaved(video.id)}
          />
        ))}
      </div>

      {/* Loading More Indicator */}
      {loadingMore && (
        <div className="flex justify-center py-8">
          <div className="flex items-center space-x-2 text-text-secondary">
            <Icon name="Loader2" size={20} className="animate-spin" />
            <span>Loading more videos...</span>
          </div>
        </div>
      )}

      {/* Load More Button (fallback for infinite scroll) */}
      {hasMore && !loadingMore && !isLoading && visibleVideos.length > 0 && (
        <div className="flex justify-center py-8">
          <button
            onClick={handleLoadMore}
            className="px-6 py-3 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors duration-200 flex items-center space-x-2"
          >
            <Icon name="Plus" size={16} />
            <span>Load More Videos</span>
          </button>
        </div>
      )}

      {/* End of Results */}
      {!hasMore && visibleVideos.length > 0 && (
        <div className="flex justify-center py-8">
          <p className="text-text-secondary text-sm">
            You've reached the end of the highlights
          </p>
        </div>
      )}
    </div>
  );
};

export default VideoGrid;