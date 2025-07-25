import React, { useState } from 'react';
import Image from '../../../components/AppImage';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const FeaturedHighlights = ({ featuredVideos, onPlay }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % featuredVideos.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + featuredVideos.length) % featuredVideos.length);
  };

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

  if (!featuredVideos || featuredVideos.length === 0) {
    return null;
  }

  const currentVideo = featuredVideos[currentSlide];

  return (
    <div className="relative bg-card rounded-lg overflow-hidden shadow-sm mb-6">
      {/* Featured Video Display */}
      <div className="relative aspect-video lg:aspect-[21/9] bg-muted">
        <Image
          src={currentVideo.thumbnail}
          alt={currentVideo.title}
          className="w-full h-full object-cover"
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>

        {/* Navigation Arrows */}
        {featuredVideos.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={prevSlide}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-black bg-opacity-50 text-white hover:bg-opacity-70 transition-all duration-200"
            >
              <Icon name="ChevronLeft" size={20} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={nextSlide}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-black bg-opacity-50 text-white hover:bg-opacity-70 transition-all duration-200"
            >
              <Icon name="ChevronRight" size={20} />
            </Button>
          </>
        )}

        {/* Play Button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onPlay(currentVideo)}
            className="w-16 h-16 bg-black bg-opacity-70 text-white rounded-full hover:scale-110 transition-all duration-200"
          >
            <Icon name="Play" size={24} />
          </Button>
        </div>

        {/* Video Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <div className="flex items-center space-x-2 mb-2">
            <span className="bg-accent text-accent-foreground px-2 py-1 rounded text-xs font-medium">
              FEATURED
            </span>
            {currentVideo.isLive && (
              <span className="bg-error text-error-foreground px-2 py-1 rounded text-xs font-medium flex items-center space-x-1">
                <div className="w-2 h-2 bg-current rounded-full animate-pulse"></div>
                <span>LIVE</span>
              </span>
            )}
          </div>
          
          <h2 className="text-xl lg:text-2xl font-bold mb-2 line-clamp-2">
            {currentVideo.title}
          </h2>
          
          <div className="flex items-center space-x-4 text-sm opacity-90">
            <div className="flex items-center space-x-2">
              <Image
                src={currentVideo.source.logo}
                alt={currentVideo.source.name}
                className="w-5 h-5 rounded"
              />
              <span>{currentVideo.source.name}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Icon name="Eye" size={14} />
              <span>{formatViews(currentVideo.views)} views</span>
            </div>
            <span>{formatDuration(currentVideo.duration)}</span>
          </div>
        </div>

        {/* Duration Badge */}
        <div className="absolute top-4 right-4 bg-black bg-opacity-80 text-white text-sm px-3 py-1 rounded">
          {formatDuration(currentVideo.duration)}
        </div>
      </div>

      {/* Slide Indicators */}
      {featuredVideos.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {featuredVideos.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-2 h-2 rounded-full transition-all duration-200 ${
                index === currentSlide ? 'bg-white' : 'bg-white bg-opacity-50'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FeaturedHighlights;