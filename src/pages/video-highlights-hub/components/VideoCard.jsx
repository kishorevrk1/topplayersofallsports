import React, { useState } from 'react';
import Image from '../../../components/AppImage';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const VideoCard = ({ video, onPlay, onSave, isSaved = false }) => {
  const [isHovered, setIsHovered] = useState(false);

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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

  return (
    <div 
      className="bg-card rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Video Thumbnail */}
      <div className="relative aspect-video bg-muted">
        <Image
          src={video.thumbnail}
          alt={video.title}
          className="w-full h-full object-cover"
        />
        
        {/* Play Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onPlay(video)}
            className={`w-12 h-12 bg-black bg-opacity-70 text-white rounded-full transition-all duration-200 ${
              isHovered ? 'scale-110 opacity-100' : 'opacity-80'
            }`}
          >
            <Icon name="Play" size={20} />
          </Button>
        </div>

        {/* Duration Badge */}
        <div className="absolute bottom-2 right-2 bg-black bg-opacity-80 text-white text-xs px-2 py-1 rounded">
          {formatDuration(video.duration)}
        </div>

        {/* Live Badge */}
        {video.isLive && (
          <div className="absolute top-2 left-2 bg-error text-error-foreground text-xs px-2 py-1 rounded flex items-center space-x-1">
            <div className="w-2 h-2 bg-current rounded-full animate-pulse"></div>
            <span>LIVE</span>
          </div>
        )}
      </div>

      {/* Video Info */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-sm line-clamp-2 text-text-primary group-hover:text-accent transition-colors duration-150">
            {video.title}
          </h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onSave(video)}
            className="flex-shrink-0 ml-2 w-8 h-8"
          >
            <Icon 
              name={isSaved ? "Bookmark" : "BookmarkPlus"} 
              size={16} 
              className={isSaved ? "text-accent" : "text-text-secondary"}
            />
          </Button>
        </div>

        {/* Source and Stats */}
        <div className="flex items-center justify-between text-xs text-text-secondary mb-2">
          <div className="flex items-center space-x-2">
            <Image
              src={video.source.logo}
              alt={video.source.name}
              className="w-4 h-4 rounded"
            />
            <span>{video.source.name}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Icon name="Eye" size={12} />
            <span>{formatViews(video.views)}</span>
          </div>
        </div>

        {/* Upload Time and Sport */}
        <div className="flex items-center justify-between text-xs text-text-secondary">
          <span>{formatTimeAgo(video.uploadedAt)}</span>
          <span className="bg-muted px-2 py-1 rounded text-xs font-medium">
            {video.sport}
          </span>
        </div>
      </div>
    </div>
  );
};

export default VideoCard;