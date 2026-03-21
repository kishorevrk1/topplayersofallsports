import React, { useState } from 'react';
import Image from '../../../components/AppImage';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const PlayerHero = ({ player, onFollow, isFollowing }) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <div className="bg-gradient-to-br from-blue-600 to-purple-700 text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-black/20"></div>
      
      <div className="relative z-10 px-4 lg:px-6 py-8 lg:py-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center lg:items-start space-y-6 lg:space-y-0 lg:space-x-8">
            {/* Player Image */}
            <div className="relative">
              <div className="w-32 h-32 lg:w-48 lg:h-48 rounded-full overflow-hidden border-4 border-white/20 bg-white/10">
                <Image
                  src={player.image}
                  alt={player.name}
                  className={`w-full h-full object-cover transition-opacity duration-300 ${
                    imageLoaded ? 'opacity-100' : 'opacity-0'
                  }`}
                  onLoad={() => setImageLoaded(true)}
                />
                {!imageLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Icon name="User" size={48} className="text-white/50" />
                  </div>
                )}
              </div>
              
              {/* Status Badge */}
              {player.status && (
                <div className={`absolute -bottom-2 -right-2 px-3 py-1 rounded-full text-xs font-medium ${
                  player.status === 'Active' ?'bg-green-500 text-white' 
                    : player.status === 'Injured' ?'bg-red-500 text-white' :'bg-yellow-500 text-black'
                }`}>
                  {player.status}
                </div>
              )}
            </div>

            {/* Player Info */}
            <div className="flex-1 text-center lg:text-left">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4">
                <div>
                  <h1 className="text-3xl lg:text-4xl font-bold mb-2">{player.name}</h1>
                  <div className="flex items-center justify-center lg:justify-start space-x-4 text-lg">
                    <span className="text-white/80">{player.sport}</span>
                    {player.position && player.position !== 'N/A' && (
                      <span className="text-white/80">· {player.position}</span>
                    )}
                  </div>
                </div>

                {/* Follow Button */}
                <div className="mt-4 lg:mt-0">
                  <Button
                    variant={isFollowing ? "secondary" : "default"}
                    onClick={onFollow}
                    iconName={isFollowing ? "UserCheck" : "UserPlus"}
                    iconPosition="left"
                    className="bg-white text-blue-600 hover:bg-white/90"
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </Button>
                </div>
              </div>

              {/* Player Details */}
              <div className="flex flex-wrap gap-6 mb-6">
                {player.position && player.position !== 'N/A' && (
                  <div className="text-center lg:text-left">
                    <div className="text-2xl font-bold">{player.position}</div>
                    <div className="text-white/80 text-sm">Position</div>
                  </div>
                )}
                {player.age && (
                  <div className="text-center lg:text-left">
                    <div className="text-2xl font-bold">{player.age}</div>
                    <div className="text-white/80 text-sm">Age</div>
                  </div>
                )}
                {player.height && player.height !== 'N/A' && (
                  <div className="text-center lg:text-left">
                    <div className="text-2xl font-bold">{player.height}</div>
                    <div className="text-white/80 text-sm">Height</div>
                  </div>
                )}
                {player.weight && player.weight !== 'N/A' && (
                  <div className="text-center lg:text-left">
                    <div className="text-2xl font-bold">{player.weight}</div>
                    <div className="text-white/80 text-sm">Weight</div>
                  </div>
                )}
                {player.eloScore && (
                  <div className="text-center lg:text-left">
                    <div className="text-2xl font-bold">{Math.round(player.eloScore)}</div>
                    <div className="text-white/80 text-sm">ELO Rating</div>
                  </div>
                )}
              </div>

              {/* Key Stats */}
              <div className="grid grid-cols-3 gap-4">
                {player.keyStats.map((stat, index) => (
                  <div key={index} className="text-center lg:text-left">
                    <div className="text-xl lg:text-2xl font-bold">{stat.value}</div>
                    <div className="text-white/80 text-sm">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerHero;