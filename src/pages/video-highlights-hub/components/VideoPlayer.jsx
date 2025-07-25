import React, { useState, useRef, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const VideoPlayer = ({ video, isOpen, onClose, relatedVideos = [], onVideoSelect }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const controlsTimeoutRef = useRef(null);

  useEffect(() => {
    if (isOpen && videoRef.current) {
      videoRef.current.play();
      setIsPlaying(true);
    }
  }, [isOpen, video]);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!isOpen) return;
      
      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'Escape':
          onClose();
          break;
        case 'f':
          toggleFullscreen();
          break;
        case 'm':
          toggleMute();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isOpen]);

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      playerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const time = pos * duration;
    
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setIsMuted(newVolume === 0);
    }
  };

  const formatTime = (time) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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

  if (!isOpen || !video) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 z-200 flex items-center justify-center">
      <div 
        ref={playerRef}
        className="relative w-full h-full max-w-6xl max-h-full flex flex-col lg:flex-row"
        onMouseMove={showControlsTemporarily}
        onMouseLeave={() => isPlaying && setShowControls(false)}
      >
        {/* Video Player */}
        <div className="relative flex-1 bg-black flex items-center justify-center">
          <video
            ref={videoRef}
            src={video.videoUrl}
            className="w-full h-full object-contain"
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onClick={togglePlayPause}
          />

          {/* Video Controls Overlay */}
          <div className={`absolute inset-0 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
            {/* Top Bar */}
            <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black to-transparent p-4">
              <div className="flex items-center justify-between text-white">
                <h3 className="text-lg font-semibold truncate">{video.title}</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="text-white hover:bg-white hover:bg-opacity-20"
                >
                  <Icon name="X" size={24} />
                </Button>
              </div>
            </div>

            {/* Center Play Button */}
            {!isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={togglePlayPause}
                  className="w-20 h-20 bg-black bg-opacity-50 text-white rounded-full hover:scale-110 transition-all duration-200"
                >
                  <Icon name="Play" size={32} />
                </Button>
              </div>
            )}

            {/* Bottom Controls */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
              {/* Progress Bar */}
              <div 
                className="w-full h-2 bg-white bg-opacity-30 rounded-full mb-4 cursor-pointer"
                onClick={handleSeek}
              >
                <div 
                  className="h-full bg-accent rounded-full transition-all duration-150"
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                />
              </div>

              {/* Control Buttons */}
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center space-x-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={togglePlayPause}
                    className="text-white hover:bg-white hover:bg-opacity-20"
                  >
                    <Icon name={isPlaying ? "Pause" : "Play"} size={20} />
                  </Button>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleMute}
                      className="text-white hover:bg-white hover:bg-opacity-20"
                    >
                      <Icon name={isMuted ? "VolumeX" : "Volume2"} size={20} />
                    </Button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={isMuted ? 0 : volume}
                      onChange={handleVolumeChange}
                      className="w-20 h-1 bg-white bg-opacity-30 rounded-full appearance-none slider"
                    />
                  </div>

                  <span className="text-sm">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleFullscreen}
                  className="text-white hover:bg-white hover:bg-opacity-20"
                >
                  <Icon name={isFullscreen ? "Minimize" : "Maximize"} size={20} />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Related Videos Sidebar */}
        <div className="w-full lg:w-80 bg-background border-l border-border overflow-y-auto">
          <div className="p-4">
            <h4 className="font-semibold text-text-primary mb-4">Related Videos</h4>
            <div className="space-y-3">
              {relatedVideos.map((relatedVideo) => (
                <div
                  key={relatedVideo.id}
                  onClick={() => onVideoSelect(relatedVideo)}
                  className="flex space-x-3 p-2 rounded-lg hover:bg-muted cursor-pointer transition-colors duration-150"
                >
                  <div className="relative w-24 h-16 bg-muted rounded overflow-hidden flex-shrink-0">
                    <img
                      src={relatedVideo.thumbnail}
                      alt={relatedVideo.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-1 right-1 bg-black bg-opacity-80 text-white text-xs px-1 rounded">
                      {formatTime(relatedVideo.duration)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="text-sm font-medium text-text-primary line-clamp-2 mb-1">
                      {relatedVideo.title}
                    </h5>
                    <p className="text-xs text-text-secondary">
                      {relatedVideo.source.name}
                    </p>
                    <p className="text-xs text-text-secondary">
                      {relatedVideo.views.toLocaleString()} views
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;