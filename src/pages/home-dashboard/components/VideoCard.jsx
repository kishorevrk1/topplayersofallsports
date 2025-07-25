import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Image from '../../../components/AppImage';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const VideoCard = ({ video }) => {
  const [isPlaying, setIsPlaying] = useState(false);

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
    const diff = now - timestamp;
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (hours < 24) {
      return `${hours}h ago`;
    } else if (days < 7) {
      return `${days}d ago`;
    } else {
      return timestamp.toLocaleDateString();
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-200">
      {/* Video Thumbnail */}
      <div className="relative h-48 overflow-hidden group cursor-pointer">
        <Image
          src={video.thumbnail}
          alt={video.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Play Button Overlay */}
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="bg-white/90 backdrop-blur-sm rounded-full p-4 hover:bg-white transition-colors duration-150">
            <Icon name="Play" size={24} className="text-primary ml-1" />
          </div>
        </div>

        {/* Duration Badge */}
        <div className="absolute bottom-3 right-3 bg-black/80 text-white px-2 py-1 rounded text-xs font-medium">
          {formatDuration(video.duration)}
        </div>

        {/* Quality Badge */}
        {video.quality && (
          <div className="absolute top-3 right-3 bg-accent text-white px-2 py-1 rounded text-xs font-medium">
            {video.quality}
          </div>
        )}

        {/* Live Badge */}
        {video.isLive && (
          <div className="absolute top-3 left-3">
            <div className="flex items-center space-x-1 bg-error px-2 py-1 rounded-full">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <span className="text-xs font-bold text-white uppercase">Live</span>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Category */}
        <div className="flex items-center justify-between mb-2">
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            video.category === 'NBA' ? 'bg-orange-100 text-orange-800' :
            video.category === 'NFL' ? 'bg-green-100 text-green-800' :
            video.category === 'MLB' ? 'bg-blue-100 text-blue-800' :
            video.category === 'NHL'? 'bg-red-100 text-red-800' : 'bg-muted text-text-secondary'
          }`}>
            {video.category}
          </div>
          
          {video.isHighlight && (
            <div className="flex items-center space-x-1 text-accent">
              <Icon name="Star" size={12} />
              <span className="text-xs font-medium">Highlight</span>
            </div>
          )}
        </div>

        {/* Title */}
        <Link to="/video-highlights-hub" className="block mb-2">
          <h3 className="text-lg font-semibold text-text-primary hover:text-accent transition-colors duration-150 line-clamp-2">
            {video.title}
          </h3>
        </Link>

        {/* Description */}
        <p className="text-text-secondary text-sm mb-4 line-clamp-2">
          {video.description}
        </p>

        {/* Meta Information */}
        <div className="flex items-center justify-between text-xs text-text-secondary mb-4">
          <div className="flex items-center space-x-3">
            <span className="flex items-center space-x-1">
              <Icon name="Play" size={12} />
              <span>{formatViews(video.views)} views</span>
            </span>
            <span className="flex items-center space-x-1">
              <Icon name="Clock" size={12} />
              <span>{formatTimeAgo(video.uploadedAt)}</span>
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <span className="flex items-center space-x-1">
              <Icon name="ThumbsUp" size={12} />
              <span>{video.likes}</span>
            </span>
            <span className="flex items-center space-x-1">
              <Icon name="MessageCircle" size={12} />
              <span>{video.comments}</span>
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Link to="/video-highlights-hub">
            <Button variant="outline" size="sm">
              <Icon name="Play" size={14} className="mr-1" />
              Watch Now
            </Button>
          </Link>
          
          <div className="flex items-center space-x-1">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Icon name="Share2" size={14} />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Icon name="Download" size={14} />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Icon name="Bookmark" size={14} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoCard;