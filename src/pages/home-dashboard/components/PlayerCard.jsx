import React from 'react';
import { Link } from 'react-router-dom';
import Image from '../../../components/AppImage';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
const PlayerCard = ({ player }) => {
  const getPositionColor = (position) => {
    const colors = {
      'QB': 'bg-purple-100 text-purple-800',
      'RB': 'bg-green-100 text-green-800',
      'WR': 'bg-blue-100 text-blue-800',
      'PG': 'bg-orange-100 text-orange-800',
      'SG': 'bg-red-100 text-red-800',
      'SF': 'bg-yellow-100 text-yellow-800',
      'PF': 'bg-indigo-100 text-indigo-800',
      'C': 'bg-gray-100 text-gray-800',
      'P': 'bg-teal-100 text-teal-800',
      'CB': 'bg-pink-100 text-pink-800',
      'SS': 'bg-cyan-100 text-cyan-800',
      'default': 'bg-muted text-text-secondary'
    };
    return colors[position] || colors.default;
  };

  const getTrendIcon = (trend) => {
    if (trend === 'up') return { icon: 'TrendingUp', color: 'text-success' };
    if (trend === 'down') return { icon: 'TrendingDown', color: 'text-error' };
    return { icon: 'Minus', color: 'text-text-secondary' };
  };

  const trendInfo = getTrendIcon(player.trend);

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-200">
      {/* Header with Team Colors */}
      <div className={`h-2 ${player.teamColor || 'bg-primary'}`}></div>
      
      <div className="p-4">
        {/* Player Info */}
        <div className="flex items-start space-x-4 mb-4">
          <div className="relative">
            <Image
              src={player.avatar}
              alt={player.name}
              className="w-16 h-16 rounded-full object-cover border-2 border-border"
            />
            {player.isActive && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-success rounded-full border-2 border-white flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <Link to={`/player-profile/${player.id}`} className="block">
              <h3 className="text-lg font-semibold text-text-primary hover:text-accent transition-colors duration-150 truncate">
                {player.name}
              </h3>
            </Link>
            <div className="flex items-center space-x-2 mt-1">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPositionColor(player.position)}`}>
                {player.position}
              </span>
            </div>
          </div>

          {/* Trending Indicator */}
          <div className={`flex items-center space-x-1 ${trendInfo.color}`}>
            <Icon name={trendInfo.icon} size={16} />
            <span className="text-sm font-medium">{player.trendValue}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {player.stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-lg font-bold text-text-primary">{stat.value}</div>
              <div className="text-xs text-text-secondary uppercase tracking-wide">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Recent Update */}
        <div className="bg-muted rounded-lg p-3 mb-4">
          <div className="flex items-start space-x-2">
            <Icon name="Info" size={14} className="text-accent mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-text-primary font-medium mb-1">{player.recentUpdate.title}</p>
              <p className="text-xs text-text-secondary line-clamp-2">{player.recentUpdate.description}</p>
              <span className="text-xs text-text-secondary mt-1 block">{player.recentUpdate.timeAgo}</span>
            </div>
          </div>
        </div>

        {/* Performance Indicator */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-text-secondary">Performance</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  player.performance >= 80 ? 'bg-success' :
                  player.performance >= 60 ? 'bg-warning' : 'bg-error'
                }`}
                style={{ width: `${player.performance}%` }}
              />
            </div>
            <span className="text-sm font-medium text-text-primary">{player.performance}%</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Link to={`/player-profile/${player.id}`}>
            <Button variant="outline" size="sm">
              View Profile
              <Icon name="ArrowRight" size={14} className="ml-1" />
            </Button>
          </Link>
          
          <div className="flex items-center space-x-1">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Icon name="Star" size={14} />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Icon name="Share2" size={14} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerCard;