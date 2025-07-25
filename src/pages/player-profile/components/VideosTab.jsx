import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';

const VideosTab = ({ player }) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);

  const categories = [
    { value: 'all', label: 'All Videos', count: 45 },
    { value: 'highlights', label: 'Highlights', count: 28 },
    { value: 'interviews', label: 'Interviews', count: 8 },
    { value: 'training', label: 'Training', count: 6 },
    { value: 'behind-scenes', label: 'Behind the Scenes', count: 3 },
  ];

  const filteredVideos = player.videos.filter(video => 
    selectedCategory === 'all' || video.category === selectedCategory
  );

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

  const openVideoPlayer = (video) => {
    setSelectedVideo(video);
    setIsPlayerOpen(true);
  };

  const closeVideoPlayer = () => {
    setIsPlayerOpen(false);
    setSelectedVideo(null);
  };

  return (
    <div className="space-y-6">
      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <Button
            key={category.value}
            variant={selectedCategory === category.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(category.value)}
            className="flex items-center space-x-1"
          >
            <span>{category.label}</span>
            <span className="bg-muted text-text-secondary text-xs px-1.5 py-0.5 rounded-full">
              {category.count}
            </span>
          </Button>
        ))}
      </div>

      {/* Video Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredVideos.map((video) => (
          <div key={video.id} className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-200">
            {/* Video Thumbnail */}
            <div className="relative aspect-video bg-muted cursor-pointer" onClick={() => openVideoPlayer(video)}>
              <Image
                src={video.thumbnail}
                alt={video.title}
                className="w-full h-full object-cover"
              />
              
              {/* Play Button Overlay */}
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200">
                <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center">
                  <Icon name="Play" size={20} className="text-black ml-1" />
                </div>
              </div>

              {/* Duration Badge */}
              <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                {formatDuration(video.duration)}
              </div>

              {/* Category Badge */}
              <div className="absolute top-2 left-2">
                <span className={`px-2 py-1 text-xs font-medium rounded ${
                  video.category === 'highlights' ? 'bg-red-500 text-white' :
                  video.category === 'interviews' ? 'bg-blue-500 text-white' :
                  video.category === 'training'? 'bg-green-500 text-white' : 'bg-purple-500 text-white'
                }`}>
                  {video.category.charAt(0).toUpperCase() + video.category.slice(1)}
                </span>
              </div>
            </div>

            {/* Video Info */}
            <div className="p-4">
              <h3 className="font-semibold text-text-primary mb-2 line-clamp-2">
                {video.title}
              </h3>
              
              <div className="flex items-center justify-between text-sm text-text-secondary mb-3">
                <span className="flex items-center space-x-1">
                  <Icon name="Eye" size={12} />
                  <span>{formatViews(video.views)} views</span>
                </span>
                <span>{video.uploadedAt}</span>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openVideoPlayer(video)}
                  className="flex-1"
                  iconName="Play"
                >
                  Watch
                </Button>
                <Button variant="ghost" size="sm" iconName="Share2" />
                <Button variant="ghost" size="sm" iconName="Download" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Load More */}
      <div className="text-center">
        <Button variant="outline" iconName="ChevronDown">
          Load More Videos
        </Button>
      </div>

      {/* Video Player Modal */}
      {isPlayerOpen && selectedVideo && (
        <div className="fixed inset-0 bg-black/80 z-200 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-lg font-semibold truncate">{selectedVideo.title}</h3>
              <Button variant="ghost" size="icon" onClick={closeVideoPlayer}>
                <Icon name="X" size={20} />
              </Button>
            </div>

            {/* Video Player */}
            <div className="aspect-video bg-black">
              <div className="w-full h-full flex items-center justify-center text-white">
                <div className="text-center">
                  <Icon name="Play" size={64} className="mx-auto mb-4" />
                  <p className="text-lg">Video Player Integration Required</p>
                  <p className="text-sm opacity-75 mt-2">
                    Embed: {selectedVideo.embedUrl}
                  </p>
                </div>
              </div>
            </div>

            {/* Video Details */}
            <div className="p-4 border-t border-border">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4 text-sm text-text-secondary">
                  <span className="flex items-center space-x-1">
                    <Icon name="Eye" size={14} />
                    <span>{formatViews(selectedVideo.views)} views</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Icon name="Clock" size={14} />
                    <span>{formatDuration(selectedVideo.duration)}</span>
                  </span>
                  <span>{selectedVideo.uploadedAt}</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm" iconName="ThumbsUp">
                    Like
                  </Button>
                  <Button variant="ghost" size="sm" iconName="Share2">
                    Share
                  </Button>
                </div>
              </div>

              <p className="text-text-secondary text-sm">
                {selectedVideo.description}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideosTab;