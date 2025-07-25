import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';

const VideoCard = ({ video, isCompact = false }) => {
  const [isHovered, setIsHovered] = useState(false);

  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
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
    const videoTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - videoTime) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  if (isCompact) {
    return (
      <Link to="/video-highlights-hub" className="block">
        <div className="flex space-x-3 p-3 bg-card rounded-lg border border-border hover:shadow-md transition-all duration-200">
          <div className="relative flex-shrink-0">
            <Image
              src={video.thumbnail}
              alt={video.title}
              className="w-20 h-14 rounded-lg object-cover"
            />
            <div className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200">
              <Icon name="Play" size={16} color="white" />
            </div>
            <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 rounded">
              {formatDuration(video.duration)}
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-xs font-medium text-accent bg-accent/10 px-2 py-1 rounded-full">
                {video.category}
              </span>
              {video.isLive && (
                <span className="text-xs font-medium text-error bg-error/10 px-2 py-1 rounded-full flex items-center space-x-1">
                  <div className="w-2 h-2 bg-error rounded-full animate-pulse" />
                  <span>LIVE</span>
                </span>
              )}
            </div>
            
            <h3 className="font-semibold text-text-primary line-clamp-2 mb-1">{video.title}</h3>
            
            <div className="flex items-center space-x-2 text-xs text-text-secondary">
              <span>{video.channel}</span>
              <span>•</span>
              <span>{formatViews(video.views)} views</span>
              <span>•</span>
              <span>{formatTimeAgo(video.publishedAt)}</span>
            </div>
          </div>

          <div className="flex-shrink-0">
            <Icon name="ChevronRight" size={16} className="text-text-secondary" />
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link to="/video-highlights-hub" className="block">
      <div 
        className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg transition-all duration-300 group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative">
          <Image
            src={video.thumbnail}
            alt={video.title}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          />
          
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="bg-white/90 rounded-full p-3">
              <Icon name="Play" size={24} className="text-text-primary ml-1" />
            </div>
          </div>

          <div className="absolute top-3 left-3 flex items-center space-x-2">
            <span className="bg-accent text-accent-foreground px-2 py-1 rounded-full text-xs font-medium">
              {video.category}
            </span>
            {video.isLive && (
              <span className="bg-error text-error-foreground px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                <span>LIVE</span>
              </span>
            )}
          </div>

          <div className="absolute bottom-3 right-3 bg-black/80 text-white text-sm px-2 py-1 rounded">
            {formatDuration(video.duration)}
          </div>

          {video.quality && (
            <div className="absolute top-3 right-3 bg-black/80 text-white text-xs px-2 py-1 rounded">
              {video.quality}
            </div>
          )}
        </div>

        <div className="p-4">
          <h3 className="font-bold text-text-primary text-lg line-clamp-2 mb-2">{video.title}</h3>
          
          <div className="flex items-center space-x-2 mb-3">
            <Image
              src={video.channelAvatar}
              alt={video.channel}
              className="w-8 h-8 rounded-full object-cover"
            />
            <div className="flex-1 min-w-0">
              <div className="font-medium text-text-primary">{video.channel}</div>
              <div className="text-sm text-text-secondary">
                {formatViews(video.views)} views • {formatTimeAgo(video.publishedAt)}
              </div>
            </div>
          </div>

          <p className="text-text-secondary text-sm line-clamp-2 mb-4">{video.description}</p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm text-text-secondary">
              <div className="flex items-center space-x-1">
                <Icon name="ThumbsUp" size={14} />
                <span>{formatViews(video.likes)}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Icon name="MessageCircle" size={14} />
                <span>{formatViews(video.comments)}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Icon name="Share2" size={14} />
                <span>{formatViews(video.shares)}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm">
                <Icon name="Bookmark" size={14} />
              </Button>
              <Button variant="ghost" size="sm">
                <Icon name="Share2" size={14} />
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
            <div className="flex items-center space-x-2">
              <Icon name="Clock" size={14} className="text-text-secondary" />
              <span className="text-sm text-text-secondary">Added to playlist</span>
            </div>
            
            <Button variant="ghost" size="sm">
              <Icon name="ExternalLink" size={14} className="mr-1" />
              Watch Now
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default VideoCard;