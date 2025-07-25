import React from 'react';
import { Link } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';

const PlayerCard = ({ player, isCompact = false }) => {
  if (isCompact) {
    return (
      <Link to={`/player-profile/${player.id}`} className="block">
        <div className="flex items-center space-x-3 p-3 bg-card rounded-lg border border-border hover:shadow-md transition-all duration-200">
          <div className="relative flex-shrink-0">
            <Image
              src={player.avatar}
              alt={player.name}
              className="w-12 h-12 rounded-full object-cover"
            />
            {player.isVerified && (
              <div className="absolute -bottom-1 -right-1 bg-accent rounded-full p-1">
                <Icon name="Check" size={10} color="white" />
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-text-primary truncate">{player.name}</h3>
            <div className="flex items-center space-x-2 text-sm text-text-secondary">
              <span>{player.position}</span>
              <span>•</span>
              <span>{player.team}</span>
            </div>
            <div className="flex items-center space-x-1 mt-1">
              <Icon name="Trophy" size={12} className="text-warning" />
              <span className="text-xs text-text-secondary">{player.achievements} achievements</span>
            </div>
          </div>

          <div className="flex-shrink-0">
            <Icon name="ChevronRight" size={16} className="text-text-secondary" />
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link to={`/player-profile/${player.id}`} className="block">
      <div className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg transition-all duration-300 group">
        <div className="relative">
          <Image
            src={player.coverImage}
            alt={`${player.name} cover`}
            className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          
          {player.isLive && (
            <div className="absolute top-3 left-3 bg-error text-error-foreground px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <span>LIVE</span>
            </div>
          )}

          {player.isVerified && (
            <div className="absolute top-3 right-3 bg-accent rounded-full p-1.5">
              <Icon name="Check" size={12} color="white" />
            </div>
          )}

          <div className="absolute bottom-3 left-3 right-3">
            <div className="flex items-center space-x-2">
              <Image
                src={player.avatar}
                alt={player.name}
                className="w-10 h-10 rounded-full border-2 border-white object-cover"
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-white truncate">{player.name}</h3>
                <div className="flex items-center space-x-1 text-white/80 text-sm">
                  <span>{player.position}</span>
                  <span>•</span>
                  <span>{player.team}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-1">
                <Icon name="Trophy" size={14} className="text-warning" />
                <span className="text-text-secondary">{player.achievements}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Icon name="Star" size={14} className="text-warning" />
                <span className="text-text-secondary">{player.rating}</span>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <Icon name="TrendingUp" size={14} className="text-success" />
              <span className="text-sm font-medium text-success">+{player.trending}%</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            {player.stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="font-bold text-text-primary">{stat.value}</div>
                <div className="text-xs text-text-secondary">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Image
                src={player.teamLogo}
                alt={player.team}
                className="w-6 h-6 object-contain"
              />
              <span className="text-sm font-medium text-text-primary">{player.team}</span>
            </div>
            
            <Button variant="ghost" size="sm">
              <Icon name="ExternalLink" size={14} className="mr-1" />
              View Profile
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default PlayerCard;