import React from 'react';
import { Link } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';

const TrendingSidebar = () => {
  const trendingTopics = [
    {
      id: 1,
      title: "NBA Trade Deadline",
      mentions: 2847,
      trend: "up",
      change: "+15%"
    },
    {
      id: 2,
      title: "Super Bowl LVIII",
      mentions: 1923,
      trend: "up",
      change: "+8%"
    },
    {
      id: 3,
      title: "March Madness",
      mentions: 1456,
      trend: "down",
      change: "-3%"
    },
    {
      id: 4,
      title: "Champions League",
      mentions: 1234,
      trend: "up",
      change: "+12%"
    },
    {
      id: 5,
      title: "MLB Spring Training",
      mentions: 987,
      trend: "up",
      change: "+5%"
    }
  ];

  const trendingPlayers = [
    {
      id: 1,
      name: "LeBron James",
      team: "Lakers",
      sport: "Basketball",
      image: "https://images.unsplash.com/photo-1546525848-3ce03ca516f6?w=100&h=100&fit=crop&crop=face",
      mentions: 1543,
      reason: "Triple-double record"
    },
    {
      id: 2,
      name: "Patrick Mahomes",
      team: "Chiefs",
      sport: "Football",
      image: "https://images.pexels.com/photos/1618200/pexels-photo-1618200.jpeg?w=100&h=100&fit=crop&crop=face",
      mentions: 1287,
      reason: "MVP discussion"
    },
    {
      id: 3,
      name: "Connor McDavid",
      team: "Oilers",
      sport: "Hockey",
      image: "https://images.pixabay.com/photo/2016/11/21/12/42/beard-1845166_1280.jpg?w=100&h=100&fit=crop&crop=face",
      mentions: 892,
      reason: "Hat trick performance"
    },
    {
      id: 4,
      name: "Shohei Ohtani",
      team: "Dodgers",
      sport: "Baseball",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
      mentions: 756,
      reason: "Contract signing"
    }
  ];

  const relatedHighlights = [
    {
      id: 1,
      title: "LeBron\'s Historic Triple-Double",
      thumbnail: "https://images.unsplash.com/photo-1574623452334-1e0ac2b3ccb4?w=300&h=200&fit=crop",
      duration: "2:34",
      views: "1.2M",
      sport: "Basketball"
    },
    {
      id: 2,
      title: "Mahomes 50-Yard TD Pass",
      thumbnail: "https://images.pexels.com/photos/1618200/pexels-photo-1618200.jpeg?w=300&h=200&fit=crop",
      duration: "1:45",
      views: "890K",
      sport: "Football"
    },
    {
      id: 3,
      title: "McDavid\'s Lightning Goal",
      thumbnail: "https://images.pixabay.com/photo/2014/10/14/20/24/soccer-488700_1280.jpg?w=300&h=200&fit=crop",
      duration: "0:58",
      views: "654K",
      sport: "Hockey"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Trending Topics */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-text-primary flex items-center">
            <Icon name="TrendingUp" size={20} className="mr-2 text-accent" />
            Trending Topics
          </h3>
          <Link to="/search-results?category=trending">
            <Button variant="ghost" size="sm">
              View All
              <Icon name="ArrowRight" size={14} className="ml-1" />
            </Button>
          </Link>
        </div>
        
        <div className="space-y-3">
          {trendingTopics.map((topic, index) => (
            <Link
              key={topic.id}
              to={`/search-results?q=${encodeURIComponent(topic.title)}`}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors group"
            >
              <div className="flex items-center space-x-3">
                <span className="text-sm font-bold text-text-secondary w-6">
                  #{index + 1}
                </span>
                <div>
                  <h4 className="font-medium text-text-primary group-hover:text-accent transition-colors">
                    {topic.title}
                  </h4>
                  <p className="text-xs text-text-secondary">
                    {topic.mentions.toLocaleString()} mentions
                  </p>
                </div>
              </div>
              <div className={`flex items-center space-x-1 text-xs ${
                topic.trend === 'up' ? 'text-success' : 'text-error'
              }`}>
                <Icon 
                  name={topic.trend === 'up' ? 'TrendingUp' : 'TrendingDown'} 
                  size={12} 
                />
                <span>{topic.change}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Trending Players */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-text-primary flex items-center">
            <Icon name="Users" size={20} className="mr-2 text-accent" />
            Trending Players
          </h3>
          <Link to="/player-profile">
            <Button variant="ghost" size="sm">
              View All
              <Icon name="ArrowRight" size={14} className="ml-1" />
            </Button>
          </Link>
        </div>
        
        <div className="space-y-3">
          {trendingPlayers.map((player) => (
            <Link
              key={player.id}
              to={`/player-profile?id=${player.id}`}
              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted transition-colors group"
            >
              <div className="relative">
                <Image
                  src={player.image}
                  alt={player.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-success rounded-full border-2 border-background flex items-center justify-center">
                  <Icon name="TrendingUp" size={8} color="white" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-text-primary group-hover:text-accent transition-colors truncate">
                  {player.name}
                </h4>
                <p className="text-xs text-text-secondary">
                  {player.team} • {player.sport}
                </p>
                <p className="text-xs text-accent">
                  {player.reason}
                </p>
              </div>
              <div className="text-xs text-text-secondary">
                {player.mentions}
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Related Highlights */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-text-primary flex items-center">
            <Icon name="Play" size={20} className="mr-2 text-accent" />
            Related Highlights
          </h3>
          <Link to="/video-highlights-hub">
            <Button variant="ghost" size="sm">
              View All
              <Icon name="ArrowRight" size={14} className="ml-1" />
            </Button>
          </Link>
        </div>
        
        <div className="space-y-3">
          {relatedHighlights.map((highlight) => (
            <Link
              key={highlight.id}
              to={`/video-highlights-hub?id=${highlight.id}`}
              className="flex space-x-3 p-2 rounded-lg hover:bg-muted transition-colors group"
            >
              <div className="relative flex-shrink-0">
                <Image
                  src={highlight.thumbnail}
                  alt={highlight.title}
                  className="w-16 h-12 rounded object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-40 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Icon name="Play" size={16} color="white" />
                </div>
                <span className="absolute bottom-1 right-1 bg-black bg-opacity-75 text-white text-xs px-1 rounded">
                  {highlight.duration}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-text-primary group-hover:text-accent transition-colors text-sm line-clamp-2">
                  {highlight.title}
                </h4>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-xs text-text-secondary">
                    {highlight.views} views
                  </span>
                  <span className="text-xs text-accent">
                    {highlight.sport}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TrendingSidebar;