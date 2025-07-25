import React from 'react';
import { Link } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';

const TeamCard = ({ team, isCompact = false }) => {
  if (isCompact) {
    return (
      <Link to="/home-dashboard" className="block">
        <div className="flex items-center space-x-3 p-3 bg-card rounded-lg border border-border hover:shadow-md transition-all duration-200">
          <div className="relative flex-shrink-0">
            <Image
              src={team.logo}
              alt={team.name}
              className="w-12 h-12 rounded-lg object-contain bg-muted p-1"
            />
            {team.isVerified && (
              <div className="absolute -bottom-1 -right-1 bg-accent rounded-full p-1">
                <Icon name="Check" size={10} color="white" />
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-text-primary truncate">{team.name}</h3>
            <div className="flex items-center space-x-2 text-sm text-text-secondary">
              <span>{team.sport}</span>
              <span>•</span>
              <span>{team.league}</span>
            </div>
            <div className="flex items-center space-x-1 mt-1">
              <Icon name="Newspaper" size={12} className="text-accent" />
              <span className="text-xs text-text-secondary">{team.newsCount} recent news</span>
            </div>
          </div>

          <div className="flex-shrink-0 text-right">
            <div className="text-sm font-medium text-text-primary">{team.record}</div>
            <div className="text-xs text-text-secondary">W-L</div>
          </div>

          <div className="flex-shrink-0">
            <Icon name="ChevronRight" size={16} className="text-text-secondary" />
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link to="/home-dashboard" className="block">
      <div className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg transition-all duration-300 group">
        <div className="relative">
          <Image
            src={team.coverImage}
            alt={`${team.name} cover`}
            className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          
          {team.isLive && (
            <div className="absolute top-3 left-3 bg-error text-error-foreground px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <span>LIVE</span>
            </div>
          )}

          {team.isVerified && (
            <div className="absolute top-3 right-3 bg-accent rounded-full p-1.5">
              <Icon name="Check" size={12} color="white" />
            </div>
          )}

          <div className="absolute bottom-3 left-3 right-3">
            <div className="flex items-center space-x-3">
              <Image
                src={team.logo}
                alt={team.name}
                className="w-12 h-12 rounded-lg bg-white/90 p-2 object-contain"
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-white text-lg truncate">{team.name}</h3>
                <div className="flex items-center space-x-1 text-white/80 text-sm">
                  <span>{team.sport}</span>
                  <span>•</span>
                  <span>{team.league}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className="font-bold text-text-primary text-lg">{team.wins}</div>
                <div className="text-xs text-text-secondary">Wins</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-text-primary text-lg">{team.losses}</div>
                <div className="text-xs text-text-secondary">Losses</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-text-primary text-lg">#{team.ranking}</div>
                <div className="text-xs text-text-secondary">Rank</div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="flex items-center space-x-1">
                <Icon name="TrendingUp" size={14} className="text-success" />
                <span className="text-sm font-medium text-success">+{team.trending}%</span>
              </div>
              <div className="text-xs text-text-secondary">This week</div>
            </div>
          </div>

          <div className="space-y-3 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-secondary">Next Game:</span>
              <span className="font-medium text-text-primary">{team.nextGame}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-secondary">Stadium:</span>
              <span className="font-medium text-text-primary">{team.stadium}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-secondary">Founded:</span>
              <span className="font-medium text-text-primary">{team.founded}</span>
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4 text-sm text-text-secondary">
              <div className="flex items-center space-x-1">
                <Icon name="Users" size={14} />
                <span>{team.fans}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Icon name="Newspaper" size={14} />
                <span>{team.newsCount}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Icon name="Play" size={14} />
                <span>{team.videos}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="flex -space-x-2">
                {team.topPlayers.slice(0, 3).map((player, index) => (
                  <Image
                    key={index}
                    src={player.avatar}
                    alt={player.name}
                    className="w-6 h-6 rounded-full border-2 border-background object-cover"
                  />
                ))}
              </div>
              <span className="text-sm text-text-secondary">Top Players</span>
            </div>
            
            <Button variant="ghost" size="sm">
              <Icon name="ExternalLink" size={14} className="mr-1" />
              View Team
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default TeamCard;