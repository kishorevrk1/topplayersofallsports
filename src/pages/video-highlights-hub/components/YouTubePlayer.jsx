import React, { useState, useEffect, useRef } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Image from '../../../components/AppImage';

/**
 * YouTube Player Component using YouTube IFrame API
 * Best practice implementation for playing YouTube videos
 */
const YouTubePlayer = ({ video, onClose, relatedVideos = [], onVideoSelect }) => {
  const [player, setPlayer] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const playerRef = useRef(null);
  const controlsTimeoutRef = useRef(null);

  // Extract YouTube video ID from URL
  const getYouTubeVideoId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const videoId = getYouTubeVideoId(video?.videoUrl);

  // Load YouTube IFrame API
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }
  }, []);

  // Initialize YouTube Player
  useEffect(() => {
    if (!videoId) return;

    // Destroy existing player before creating new one
    if (player) {
      player.destroy();
      setPlayer(null);
    }

    const initPlayer = () => {
      if (window.YT && window.YT.Player) {
        // Small delay to ensure DOM is ready
        setTimeout(() => {
          const newPlayer = new window.YT.Player('youtube-player', {
            height: '100%',
            width: '100%',
            videoId: videoId,
            playerVars: {
              autoplay: 1,
              controls: 1,
              modestbranding: 1,
              rel: 0,
              showinfo: 0,
              fs: 1,
              playsinline: 1,
            },
            events: {
              onReady: (event) => {
                event.target.playVideo();
                setIsPlaying(true);
              },
              onStateChange: (event) => {
                setIsPlaying(event.data === window.YT.PlayerState.PLAYING);
              },
            },
          });
          setPlayer(newPlayer);
        }, 100);
      }
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
    }

    return () => {
      if (player) {
        player.destroy();
      }
    };
  }, [videoId]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case ' ':
          e.preventDefault();
          if (player) {
            if (isPlaying) {
              player.pauseVideo();
            } else {
              player.playVideo();
            }
          }
          break;
        case 'f':
          // YouTube player handles fullscreen
          break;
        case 'm':
          if (player) {
            if (player.isMuted()) {
              player.unMute();
            } else {
              player.mute();
            }
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [player, isPlaying, onClose]);

  const showControlsTemporarily = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  const formatViews = (views) => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    }
    return views?.toString() || '0';
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!video) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6">
      <div 
        ref={playerRef}
        className="relative w-full max-w-[1600px] h-full max-h-[90vh] flex flex-col lg:flex-row bg-background rounded-lg overflow-hidden shadow-2xl"
        onMouseMove={showControlsTemporarily}
      >
        {/* Close Button - Always Visible */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 sm:top-3 sm:right-3 z-50 bg-red-600 hover:bg-red-700 text-white rounded-full p-1.5 sm:p-2 transition-all duration-200 hover:scale-110 shadow-lg"
          aria-label="Close player"
        >
          <Icon name="X" size={20} className="sm:w-6 sm:h-6" />
        </button>

        {/* Main Video Area */}
        <div className="relative flex-1 bg-black flex flex-col lg:min-w-0">
          {/* YouTube Player Container - Perfect 16:9 */}
          <div className="relative w-full bg-black" style={{ paddingBottom: '56.25%' }}>
            <div className="absolute inset-0">
              <div id="youtube-player" className="w-full h-full"></div>
            </div>
          </div>

          {/* Video Info - Compact */}
          <div className="bg-black p-3 sm:p-4 text-white border-t border-gray-800">
            <h2 className="text-lg sm:text-xl font-bold mb-2 line-clamp-1">{video.title}</h2>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-300">
              <div className="flex items-center space-x-2">
                {video.source?.logo && (
                  <Image
                    src={video.source.logo}
                    alt={video.source.name}
                    className="w-5 h-5 rounded-full"
                  />
                )}
                <span className="font-medium">{video.source?.name || 'Unknown'}</span>
              </div>
              <span className="hidden sm:inline">•</span>
              <div className="flex items-center space-x-1">
                <Icon name="Eye" size={12} />
                <span>{formatViews(video.views)}</span>
              </div>
              <span className="hidden sm:inline">•</span>
              <div className="flex items-center space-x-1">
                <Icon name="ThumbsUp" size={12} />
                <span>{formatViews(video.likes)}</span>
              </div>
              {video.sport && (
                <span className="bg-accent bg-opacity-20 px-2 py-0.5 rounded text-xs font-medium">
                  {video.sport}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Related Videos Sidebar */}
        {relatedVideos && relatedVideos.length > 0 && (
          <div className="w-full lg:w-80 xl:w-96 bg-background border-t lg:border-t-0 lg:border-l border-border overflow-y-auto max-h-[40vh] lg:max-h-full">
            <div className="p-3 sm:p-4">
              <h3 className="text-sm sm:text-base font-semibold text-text-primary mb-3 flex items-center space-x-2 sticky top-0 bg-background pb-2 border-b border-border z-10">
                <Icon name="List" size={16} className="sm:w-5 sm:h-5" />
                <span>Up Next ({relatedVideos.length})</span>
              </h3>
              <div className="space-y-2">
                {relatedVideos.map((relatedVideo) => (
                  <div
                    key={relatedVideo.id}
                    onClick={() => onVideoSelect && onVideoSelect(relatedVideo)}
                    className="flex space-x-2 sm:space-x-3 p-2 rounded-lg hover:bg-muted cursor-pointer transition-all duration-200 group"
                  >
                    <div className="relative w-28 sm:w-32 h-16 sm:h-20 bg-muted rounded overflow-hidden flex-shrink-0">
                      <Image
                        src={relatedVideo.thumbnail}
                        alt={relatedVideo.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      <div className="absolute bottom-1 right-1 bg-black bg-opacity-80 text-white text-xs px-1.5 py-0.5 rounded">
                        {formatDuration(relatedVideo.duration)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs sm:text-sm font-medium text-text-primary line-clamp-2 mb-1 group-hover:text-accent transition-colors">
                        {relatedVideo.title}
                      </h4>
                      <div className="flex items-center space-x-1.5 text-xs text-text-secondary mb-0.5">
                        {relatedVideo.source?.logo && (
                          <Image
                            src={relatedVideo.source.logo}
                            alt={relatedVideo.source.name}
                            className="w-3 h-3 sm:w-4 sm:h-4 rounded"
                          />
                        )}
                        <span className="truncate">{relatedVideo.source?.name || 'Unknown'}</span>
                      </div>
                      <div className="flex items-center space-x-1.5 text-xs text-text-secondary">
                        <div className="flex items-center space-x-0.5">
                          <Icon name="Eye" size={10} />
                          <span>{formatViews(relatedVideo.views)}</span>
                        </div>
                        {relatedVideo.sport && (
                          <>
                            <span>•</span>
                            <span className="truncate">{relatedVideo.sport}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default YouTubePlayer;
