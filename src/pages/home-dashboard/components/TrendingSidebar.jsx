import React from 'react';
import { Link } from 'react-router-dom';
import Image from '../../../components/AppImage';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const TrendingSidebar = () => {
  const trendingTopics = [
    {
      id: 1,
      title: "NBA Trade Deadline Approaching",
      category: "NBA",
      mentions: "15.2K",
      trend: "up",
      trendValue: "+24%",
      image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=300&h=200&fit=crop"
    },
    {
      id: 2,
      title: "Super Bowl Predictions",
      category: "NFL",
      mentions: "12.8K",
      trend: "up",
      trendValue: "+18%",
      image: "https://images.unsplash.com/photo-1577223625816-7546f13df25d?w=300&h=200&fit=crop"
    },
    {
      id: 3,
      title: "March Madness Brackets",
      category: "NCAA",
      mentions: "9.4K",
      trend: "up",
      trendValue: "+45%",
      image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=300&h=200&fit=crop"
    },
    {
      id: 4,
      title: "MLB Spring Training",
      category: "MLB",
      mentions: "7.1K",
      trend: "stable",
      trendValue: "0%",
      image: "https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=300&h=200&fit=crop"
    },
    {
      id: 5,
      title: "Olympic Preparations",
      category: "Olympics",
      mentions: "5.9K",
      trend: "down",
      trendValue: "-8%",
      image: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=300&h=200&fit=crop"
    }
  ];

  const popularPlayers = [
    {
      id: 1,
      name: "LeBron James",
      team: "Lakers",
      avatar: "https://randomuser.me/api/portraits/men/32.jpg",
      mentions: "8.2K",
      change: "+12%"
    },
    {
      id: 2,
      name: "Patrick Mahomes",
      team: "Chiefs",
      avatar: "https://randomuser.me/api/portraits/men/45.jpg",
      mentions: "6.7K",
      change: "+8%"
    },
    {
      id: 3,
      name: "Connor McDavid",
      team: "Oilers",
      avatar: "https://randomuser.me/api/portraits/men/28.jpg",
      mentions: "4.1K",
      change: "+15%"
    },
    {
      id: 4,
      name: "Shohei Ohtani",
      team: "Angels",
      avatar: "https://randomuser.me/api/portraits/men/33.jpg",
      mentions: "3.8K",
      change: "+22%"
    }
  ];

  const getTrendIcon = (trend) => {
    if (trend === 'up') return { icon: 'TrendingUp', color: 'text-success' };
    if (trend === 'down') return { icon: 'TrendingDown', color: 'text-error' };
    return { icon: 'Minus', color: 'text-text-secondary' };
  };

  return (
    <div className="space-y-6">
      {/* Trending Topics */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text-primary flex items-center space-x-2">
            <Icon name="TrendingUp" size={20} className="text-accent" />
            <span>Trending Now</span>
          </h2>
          <Link to="/breaking-news-feed">
            <Button variant="ghost" size="sm">
              View All
              <Icon name="ArrowRight" size={14} className="ml-1" />
            </Button>
          </Link>
        </div>

        <div className="space-y-3">
          {trendingTopics.slice(0, 3).map((topic, index) => {
            const trendInfo = getTrendIcon(topic.trend);
            return (
              <div key={topic.id} className="flex items-start space-x-3 p-2 hover:bg-muted rounded-lg transition-colors duration-150 cursor-pointer">
                <div className="flex-shrink-0 w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-accent">#{index + 1}</span>
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-text-primary line-clamp-2 mb-1">
                    {topic.title}
                  </h3>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-xs text-text-secondary">
                      <span className="px-2 py-1 bg-muted rounded-full">{topic.category}</span>
                      <span>{topic.mentions} mentions</span>
                    </div>
                    <div className={`flex items-center space-x-1 ${trendInfo.color}`}>
                      <Icon name={trendInfo.icon} size={12} />
                      <span className="text-xs font-medium">{topic.trendValue}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Popular Players */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text-primary flex items-center space-x-2">
            <Icon name="Users" size={20} className="text-accent" />
            <span>Popular Players</span>
          </h2>
          <Link to="/player-profile">
            <Button variant="ghost" size="sm">
              View All
              <Icon name="ArrowRight" size={14} className="ml-1" />
            </Button>
          </Link>
        </div>

        <div className="space-y-3">
          {popularPlayers.map((player, index) => (
            <Link key={player.id} to="/player-profile" className="block">
              <div className="flex items-center space-x-3 p-2 hover:bg-muted rounded-lg transition-colors duration-150">
                <div className="flex-shrink-0 w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-accent">#{index + 1}</span>
                </div>
                
                <Image
                  src={player.avatar}
                  alt={player.name}
                  className="w-10 h-10 rounded-full object-cover border border-border"
                />
                
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-text-primary truncate">
                    {player.name}
                  </h3>
                  <p className="text-xs text-text-secondary">{player.team}</p>
                </div>
                
                <div className="text-right">
                  <div className="text-xs text-text-secondary">{player.mentions}</div>
                  <div className="text-xs text-success font-medium">{player.change}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h2 className="text-lg font-semibold text-text-primary flex items-center space-x-2 mb-4">
          <Icon name="BarChart3" size={20} className="text-accent" />
          <span>Quick Stats</span>
        </h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">Active Games Today</span>
            <span className="text-lg font-bold text-text-primary">12</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">Breaking News</span>
            <span className="text-lg font-bold text-error">3</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">New Highlights</span>
            <span className="text-lg font-bold text-accent">28</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">Player Updates</span>
            <span className="text-lg font-bold text-success">15</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrendingSidebar;