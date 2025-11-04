import React from 'react';
import Image from '../../../components/AppImage';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const TrendingSidebar = ({ 
  trendingVideos,
  videos,  
  onVideoSelect,
  onPlay,
  isLoading = false,
  className = '' 
}) => {
  // Support both prop names for backward compatibility
  const displayVideos = trendingVideos || videos || [];
  const handleVideoClick = onVideoSelect || onPlay;

  const formatViews = (views) => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    }
    return views.toString();
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const videoDate = new Date(timestamp);
    const diffInHours = Math.floor((now - videoDate) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    const diffInWeeks = Math.floor(diffInDays / 7);
    return `${diffInWeeks}w ago`;
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`hidden lg:block w-80 bg-card border-l border-border ${className}`}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-text-primary flex items-center space-x-2">
            <Icon name="TrendingUp" size={20} className="text-accent" />
            <span>Trending Now</span>
          </h3>
          <Button
            variant="ghost"
            size="sm"
            className="text-text-secondary hover:text-text-primary"
          >
            <Icon name="RefreshCw" size={16} />
          </Button>
        </div>

        {/* Trending Videos List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8 text-text-secondary">
              <Icon name="Loader" size={24} className="animate-spin mx-auto mb-2" />
              <p className="text-sm">Loading trending videos...</p>
            </div>
          ) : displayVideos.length === 0 ? (
            <div className="text-center py-8 text-text-secondary">
              <Icon name="TrendingUp" size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">No trending videos yet</p>
            </div>
          ) : (
            displayVideos.map((video, index) => (
            <div
              key={video.id}
              onClick={() => handleVideoClick && handleVideoClick(video)}
              className="flex space-x-3 p-3 rounded-lg hover:bg-muted cursor-pointer transition-colors duration-150 group"
            >
              {/* Rank Number */}
              <div className="flex-shrink-0 w-6 text-center">
                <span className={`text-sm font-bold ${
                  index < 3 ? 'text-accent' : 'text-text-secondary'
                }`}>
                  {index + 1}
                </span>
              </div>

              {/* Video Thumbnail */}
              <div className="relative w-20 h-14 bg-muted rounded overflow-hidden flex-shrink-0">
                <Image
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
                
                {/* Play Overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                  <Icon 
                    name="Play" 
                    size={14} 
                    className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" 
                  />
                </div>

                {/* Duration */}
                <div className="absolute bottom-1 right-1 bg-black bg-opacity-80 text-white text-xs px-1 rounded">
                  {formatDuration(video.duration)}
                </div>

                {/* Live Badge */}
                {video.isLive && (
                  <div className="absolute top-1 left-1 bg-error text-error-foreground text-xs px-1 rounded flex items-center space-x-1">
                    <div className="w-1 h-1 bg-current rounded-full animate-pulse"></div>
                    <span>LIVE</span>
                  </div>
                )}
              </div>

              {/* Video Info */}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-text-primary line-clamp-2 mb-1 group-hover:text-accent transition-colors duration-150">
                  {video.title}
                </h4>
                
                <div className="flex items-center space-x-2 text-xs text-text-secondary mb-1">
                  <Image
                    src={video.source.logo}
                    alt={video.source.name}
                    className="w-3 h-3 rounded"
                  />
                  <span>{video.source.name}</span>
                </div>

                <div className="flex items-center justify-between text-xs text-text-secondary">
                  <div className="flex items-center space-x-1">
                    <Icon name="Eye" size={10} />
                    <span>{formatViews(video.views)}</span>
                  </div>
                  <span>{formatTimeAgo(video.uploadedAt)}</span>
                </div>

                {/* Trending Indicator */}
                {video.trendingScore && (
                  <div className="flex items-center space-x-1 mt-1">
                    <Icon name="TrendingUp" size={10} className="text-accent" />
                    <span className="text-xs text-accent font-medium">
                      +{video.trendingScore}% views
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))
          )}
        </div>

        {/* View All Trending */}
        <div className="mt-6 pt-4 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            fullWidth
            className="flex items-center justify-center space-x-2"
          >
            <Icon name="TrendingUp" size={16} />
            <span>View All Trending</span>
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h4 className="text-sm font-semibold text-text-primary mb-3">
            Today's Stats
          </h4>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-text-secondary">New Videos</span>
              <span className="font-medium text-text-primary">1,247</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Total Views</span>
              <span className="font-medium text-text-primary">12.4M</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Live Streams</span>
              <span className="font-medium text-accent">23</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrendingSidebar;