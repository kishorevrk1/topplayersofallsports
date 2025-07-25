import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Image from '../../../components/AppImage';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const HeroSection = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const scrollContainerRef = useRef(null);
  const autoPlayRef = useRef(null);

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  // Multiple breaking news stories with high-quality sports images
  const heroStories = [
    {
      id: 1,
      title: "LeBron James Breaks All-Time Scoring Record in Lakers Victory",
      summary: `In a historic night at Crypto.com Arena, LeBron James surpassed Kareem Abdul-Jabbar's long-standing NBA scoring record with a fadeaway jumper in the third quarter. The Lakers defeated the Thunder 133-130 in overtime, with James finishing with 38 points, 7 rebounds, and 6 assists. The crowd erupted as the game was stopped to acknowledge the milestone achievement.`,
      image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1200&h=600&fit=crop&crop=center",
      mobileImage: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&h=500&fit=crop&crop=center",
      category: "NBA",
      timestamp: new Date(Date.now() - 1800000), // 30 minutes ago
      author: "ESPN Sports",
      readTime: "3 min read",
      views: "2.4M",
      isBreaking: true
    },
    {
      id: 2,
      title: "Tom Brady Announces Comeback: Signs One-Year Deal with Miami Dolphins",
      summary: `In a shocking turn of events, Tom Brady has announced his return to the NFL after a brief retirement, signing a one-year deal with the Miami Dolphins. The 46-year-old quarterback cited unfinished business and the opportunity to play in his home state as key factors in his decision. The Dolphins view Brady as the missing piece for a championship run.`,
      image: "https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=1200&h=600&fit=crop&crop=center",
      mobileImage: "https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=800&h=500&fit=crop&crop=center",
      category: "NFL",
      timestamp: new Date(Date.now() - 900000), // 15 minutes ago
      author: "NFL Network",
      readTime: "4 min read",
      views: "1.8M",
      isBreaking: true
    },
    {
      id: 3,
      title: "Manchester United Completes Record-Breaking Mbappé Transfer",
      summary: `Manchester United has completed the signing of Kylian Mbappé from Paris Saint-Germain in a deal worth €200 million, making it the most expensive transfer in football history. The French superstar has signed a five-year contract with the Red Devils and expressed his excitement about joining the Premier League.`,
      image: "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=1200&h=600&fit=crop&crop=center",
      mobileImage: "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&h=500&fit=crop&crop=center",
      category: "Soccer",
      timestamp: new Date(Date.now() - 2700000), // 45 minutes ago
      author: "Sky Sports",
      readTime: "5 min read",
      views: "3.1M",
      isBreaking: true
    },
    {
      id: 4,
      title: "Shohei Ohtani Sets New MLB Record with 60th Home Run of the Season",
      summary: `Los Angeles Angels' Shohei Ohtani made history tonight by hitting his 60th home run of the season, becoming the first player since Babe Ruth to achieve this milestone while also pitching. The two-way superstar's incredible feat has reignited discussions about the greatest single-season performance in baseball history.`,
      image: "https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=1200&h=600&fit=crop&crop=center",
      mobileImage: "https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=800&h=500&fit=crop&crop=center",
      category: "MLB",
      timestamp: new Date(Date.now() - 3600000), // 1 hour ago
      author: "MLB Network",
      readTime: "4 min read",
      views: "1.5M",
      isBreaking: true
    }
  ];

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (minutes < 60) {
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else {
      return timestamp.toLocaleDateString();
    }
  };

  // Auto-play functionality
  useEffect(() => {
    if (isAutoPlaying) {
      autoPlayRef.current = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % heroStories.length);
      }, 5000); // Change slide every 5 seconds
    }

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [isAutoPlaying, heroStories.length]);

  // Scroll to current slide
  useEffect(() => {
    if (scrollContainerRef.current) {
      const scrollContainer = scrollContainerRef.current;
      const slideWidth = scrollContainer.offsetWidth;
      scrollContainer.scrollTo({
        left: currentSlide * slideWidth,
        behavior: 'smooth'
      });
    }
  }, [currentSlide]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroStories.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroStories.length) % heroStories.length);
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  const handleMouseEnter = () => {
    setIsAutoPlaying(false);
  };

  const handleMouseLeave = () => {
    setIsAutoPlaying(true);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'ArrowLeft') {
        prevSlide();
      } else if (event.key === 'ArrowRight') {
        nextSlide();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Touch/Swipe handlers
  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      nextSlide();
    }
    if (isRightSwipe) {
      prevSlide();
    }
    
    setTouchStart(null);
    setTouchEnd(null);
  };

  const currentStory = heroStories[currentSlide];

  return (
    <div 
      className="relative mb-6"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Main Carousel Container */}
      <div 
        ref={scrollContainerRef}
        className="relative overflow-hidden rounded-xl touch-pan-y"
        style={{ 
          height: 'clamp(280px, 50vh, 450px)', // Responsive height
          minHeight: '280px',
          maxHeight: '450px'
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Slides Container */}
        <div 
          className="flex transition-transform duration-500 ease-in-out h-full"
          style={{ 
            transform: `translateX(-${currentSlide * 100}%)`,
            width: `${heroStories.length * 100}%`
          }}
        >
          {heroStories.map((story, index) => (
            <div 
              key={story.id}
              className="relative w-full h-full flex-shrink-0"
              style={{ width: `${100 / heroStories.length}%` }}
            >
              {/* Background Gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary z-10"></div>
              
              {/* Responsive Background Image */}
              <picture>
                <source 
                  media="(max-width: 768px)" 
                  srcSet={story.mobileImage}
                />
                <Image
                  src={story.image}
                  alt={story.title}
                  className="absolute inset-0 w-full h-full object-cover object-center"
                  style={{
                    objectPosition: 'center',
                    imageRendering: 'high-quality'
                  }}
                />
              </picture>
              
              {/* Dark Overlay with responsive opacity */}
              <div className="absolute inset-0 bg-black/50 sm:bg-black/40 z-20"></div>
              
              {/* Content with responsive spacing */}
              <div className="relative z-30 p-4 sm:p-6 lg:p-8 text-white h-full flex flex-col justify-end">
                {/* Breaking News Badge */}
                {story.isBreaking && (
                  <div className="flex items-center space-x-2 mb-3 sm:mb-4">
                    <div className="flex items-center space-x-1 bg-error px-2 sm:px-3 py-1 rounded-full">
                      <Icon name="Zap" size={12} color="white" className="sm:w-3.5 sm:h-3.5" />
                      <span className="text-xs font-bold uppercase tracking-wide">Breaking</span>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm px-2 sm:px-3 py-1 rounded-full">
                      <span className="text-xs font-medium">{story.category}</span>
                    </div>
                  </div>
                )}

                {/* Title with responsive text sizes */}
                <h1 className="text-lg sm:text-xl md:text-2xl lg:text-4xl font-bold mb-2 sm:mb-4 leading-tight line-clamp-3 sm:line-clamp-none">
                  {story.title}
                </h1>

                {/* Summary with responsive visibility */}
                <p className="text-white/90 text-xs sm:text-sm lg:text-base mb-4 sm:mb-6 line-clamp-2 sm:line-clamp-3 lg:line-clamp-none max-w-4xl">
                  {story.summary}
                </p>

                {/* Meta Information with responsive layout */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                  <div className="flex items-center space-x-3 sm:space-x-4 text-xs sm:text-sm text-white/80 overflow-x-auto">
                    <span className="flex items-center space-x-1 flex-shrink-0">
                      <Icon name="User" size={12} className="sm:w-3.5 sm:h-3.5" />
                      <span>{story.author}</span>
                    </span>
                    <span className="flex items-center space-x-1 flex-shrink-0">
                      <Icon name="Clock" size={12} className="sm:w-3.5 sm:h-3.5" />
                      <span>{formatTimeAgo(story.timestamp)}</span>
                    </span>
                    <span className="flex items-center space-x-1 flex-shrink-0">
                      <Icon name="Eye" size={12} className="sm:w-3.5 sm:h-3.5" />
                      <span>{story.views}</span>
                    </span>
                    <span className="hidden md:flex items-center space-x-1 flex-shrink-0">
                      <Icon name="BookOpen" size={12} className="sm:w-3.5 sm:h-3.5" />
                      <span>{story.readTime}</span>
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/20 border-white/30 w-8 h-8 sm:w-10 sm:h-10"
                    >
                      <Icon name="Share2" size={14} className="sm:w-4 sm:h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/20 border-white/30 w-8 h-8 sm:w-10 sm:h-10"
                    >
                      <Icon name="Bookmark" size={14} className="sm:w-4 sm:h-4" />
                    </Button>
                    <Link to="/breaking-news-feed">
                      <Button
                        variant="outline"
                        className="bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2"
                      >
                        <span className="hidden sm:inline">Read Full Story</span>
                        <span className="sm:hidden">Read</span>
                        <Icon name="ArrowRight" size={14} className="ml-1 sm:ml-2 w-3 h-3 sm:w-4 sm:h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Arrows with responsive sizing */}
      <Button
        variant="ghost"
        size="icon"
        onClick={prevSlide}
        className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-40 bg-black/60 hover:bg-black/80 text-white border-0 w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full backdrop-blur-sm"
        aria-label="Previous slide"
      >
        <Icon name="ChevronLeft" size={18} className="sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
      </Button>
      
      <Button
        variant="ghost"
        size="icon"
        onClick={nextSlide}
        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-40 bg-black/60 hover:bg-black/80 text-white border-0 w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full backdrop-blur-sm"
        aria-label="Next slide"
      >
        <Icon name="ChevronRight" size={18} className="sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
      </Button>

      {/* Slide Indicators with responsive spacing */}
      <div className="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 z-40 flex space-x-1.5 sm:space-x-2">
        {heroStories.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-300 backdrop-blur-sm ${
              index === currentSlide 
                ? 'bg-white scale-110 sm:scale-125' 
                : 'bg-white/50 hover:bg-white/70'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Auto-play control with responsive positioning */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsAutoPlaying(!isAutoPlaying)}
        className="absolute top-2 sm:top-4 right-2 sm:right-4 z-40 bg-black/60 hover:bg-black/80 text-white border-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full backdrop-blur-sm"
        aria-label={isAutoPlaying ? "Pause auto-play" : "Resume auto-play"}
      >
        <Icon name={isAutoPlaying ? "Pause" : "Play"} size={12} className="sm:w-4 sm:h-4" />
      </Button>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 sm:h-1 bg-black/20 z-40">
        <div 
          className="h-full bg-white transition-all duration-500"
          style={{ width: `${((currentSlide + 1) / heroStories.length) * 100}%` }}
        />
      </div>
    </div>
  );
};

export default HeroSection;