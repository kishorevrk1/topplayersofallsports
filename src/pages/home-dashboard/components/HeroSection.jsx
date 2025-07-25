import React from 'react';
import { Link } from 'react-router-dom';
import Image from '../../../components/AppImage';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const HeroSection = () => {
  const heroStory = {
    id: 1,
    title: "LeBron James Breaks All-Time Scoring Record in Lakers Victory",
    summary: `In a historic night at Crypto.com Arena, LeBron James surpassed Kareem Abdul-Jabbar's long-standing NBA scoring record with a fadeaway jumper in the third quarter. The Lakers defeated the Thunder 133-130 in overtime, with James finishing with 38 points, 7 rebounds, and 6 assists. The crowd erupted as the game was stopped to acknowledge the milestone achievement.`,
    image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&h=400&fit=crop",
    category: "NBA",
    timestamp: new Date(Date.now() - 1800000), // 30 minutes ago
    author: "ESPN Sports",
    readTime: "3 min read",
    views: "2.4M",
    isBreaking: true
  };

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

  return (
    <div className="relative bg-gradient-to-br from-primary to-secondary rounded-xl overflow-hidden mb-6">
      <div className="absolute inset-0 bg-black/40 z-10"></div>
      
      <Image
        src={heroStory.image}
        alt={heroStory.title}
        className="absolute inset-0 w-full h-full object-cover"
      />
      
      <div className="relative z-20 p-6 lg:p-8 text-white min-h-[300px] lg:min-h-[400px] flex flex-col justify-end">
        {/* Breaking News Badge */}
        {heroStory.isBreaking && (
          <div className="flex items-center space-x-2 mb-4">
            <div className="flex items-center space-x-1 bg-error px-3 py-1 rounded-full">
              <Icon name="Zap" size={14} color="white" />
              <span className="text-xs font-bold uppercase tracking-wide">Breaking</span>
            </div>
            <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
              <span className="text-xs font-medium">{heroStory.category}</span>
            </div>
          </div>
        )}

        {/* Title */}
        <h1 className="text-2xl lg:text-4xl font-bold mb-4 leading-tight">
          {heroStory.title}
        </h1>

        {/* Summary */}
        <p className="text-white/90 text-sm lg:text-base mb-6 line-clamp-3 lg:line-clamp-none max-w-4xl">
          {heroStory.summary}
        </p>

        {/* Meta Information */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-4 text-sm text-white/80">
            <span className="flex items-center space-x-1">
              <Icon name="User" size={14} />
              <span>{heroStory.author}</span>
            </span>
            <span className="flex items-center space-x-1">
              <Icon name="Clock" size={14} />
              <span>{formatTimeAgo(heroStory.timestamp)}</span>
            </span>
            <span className="flex items-center space-x-1">
              <Icon name="Eye" size={14} />
              <span>{heroStory.views} views</span>
            </span>
            <span className="hidden sm:flex items-center space-x-1">
              <Icon name="BookOpen" size={14} />
              <span>{heroStory.readTime}</span>
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 border-white/30"
            >
              <Icon name="Share2" size={18} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 border-white/30"
            >
              <Icon name="Bookmark" size={18} />
            </Button>
            <Link to="/breaking-news-feed">
              <Button
                variant="outline"
                className="bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20"
              >
                Read Full Story
                <Icon name="ArrowRight" size={16} className="ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;