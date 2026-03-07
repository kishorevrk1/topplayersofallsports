import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import playerApiService from '../../../services/playerApiService';
import RatingBreakdownCard from '../../../components/RatingBreakdownCard';
import RatingHistoryChart from '../../../components/RatingHistoryChart';

const OverviewTab = ({ player }) => {
  const [ratingBreakdown, setRatingBreakdown] = useState(null);
  const [ratingHistory, setRatingHistory] = useState([]);
  const [loadingRating, setLoadingRating] = useState(false);

  // Fetch ACR rating breakdown and history from player-service
  useEffect(() => {
    const fetchRatingData = async () => {
      if (!player?.id) return;
      setLoadingRating(true);
      try {
        const [breakdown, history] = await Promise.allSettled([
          playerApiService.getRatingBreakdown(player.id),
          playerApiService.getRatingHistory(player.id),
        ]);
        if (breakdown.status === 'fulfilled') setRatingBreakdown(breakdown.value);
        if (history.status === 'fulfilled') setRatingHistory(history.value?.history || []);
      } catch (error) {
        console.error('Error fetching rating data:', error);
      } finally {
        setLoadingRating(false);
      }
    };

    fetchRatingData();
  }, [player?.id]);

  return (
    <div className="space-y-6">
      {/* ACR Rating Breakdown */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Icon name="BarChart2" size={20} className="text-accent" />
          <h3 className="text-lg font-semibold text-text-primary">ACR Rating Breakdown</h3>
          <span className="bg-blue-500/10 text-blue-400 text-xs font-medium px-2 py-1 rounded-full border border-blue-500/20">
            2 AI Models · Transparent
          </span>
        </div>
        <RatingBreakdownCard breakdown={ratingBreakdown} loading={loadingRating} />

        {ratingHistory.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm text-text-secondary mb-2">Rating History</h4>
            <RatingHistoryChart history={ratingHistory} />
          </div>
        )}
      </div>

      {/* AI-Generated Bio */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Icon name="User" size={20} className="text-accent" />
          <h3 className="text-lg font-semibold">Player Biography</h3>
          <span className="bg-accent/10 text-accent text-xs font-medium px-2 py-1 rounded-full">
            AI Generated
          </span>
        </div>
        <p className="text-text-secondary leading-relaxed">
          {player.biography}
        </p>
      </div>

      {/* Career Highlights */}
      {player.careerHighlights?.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-6">
            <Icon name="Trophy" size={20} className="text-accent" />
            <h3 className="text-lg font-semibold">Career Highlights</h3>
          </div>

          <div className="space-y-3">
            {player.careerHighlights.map((highlight, index) => {
              // Handle both string highlights (from backend) and object highlights (legacy mock)
              const isString = typeof highlight === 'string';
              const title       = isString ? highlight : (highlight.title || highlight);
              const description = isString ? '' : (highlight.description || '');
              const date        = isString ? '' : (highlight.date || '');
              const location    = isString ? '' : (highlight.location || '');
              const icon        = isString ? 'Trophy' : (highlight.icon || 'Trophy');

              return (
                <div key={index} className="flex items-start space-x-4 p-4 bg-muted rounded-lg">
                  <div className="flex-shrink-0 w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                    <Icon name={icon} size={18} className="text-accent" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-text-primary text-sm">{title}</h4>
                    {description && (
                      <p className="text-sm text-text-secondary mt-1">{description}</p>
                    )}
                    {(date || location) && (
                      <div className="flex items-center space-x-4 text-xs text-text-secondary mt-1">
                        {date && (
                          <span className="flex items-center space-x-1">
                            <Icon name="Calendar" size={11} />
                            <span>{date}</span>
                          </span>
                        )}
                        {location && (
                          <span className="flex items-center space-x-1">
                            <Icon name="MapPin" size={11} />
                            <span>{location}</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Personal Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Icon name="Info" size={20} className="text-accent" />
            <h3 className="text-lg font-semibold">Personal Information</h3>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-text-secondary">Full Name</span>
              <span className="font-medium">{player.fullName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Date of Birth</span>
              <span className="font-medium">{player.dateOfBirth}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Birthplace</span>
              <span className="font-medium">{player.birthplace}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Nationality</span>
              <span className="font-medium">{player.nationality}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">College</span>
              <span className="font-medium">{player.college}</span>
            </div>
          </div>
        </div>

        {player.achievements?.length > 0 && (
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Icon name="Award" size={20} className="text-accent" />
              <h3 className="text-lg font-semibold">Achievements</h3>
            </div>

            <div className="space-y-3">
              {player.achievements.map((achievement, index) => {
                const title = typeof achievement === 'string' ? achievement : (achievement.title || achievement);
                const year  = typeof achievement === 'string' ? '' : (achievement.year || '');
                return (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center shrink-0">
                      <Icon name="Medal" size={14} className="text-accent" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm text-text-primary">{title}</div>
                      {year && <div className="text-xs text-text-secondary">{year}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OverviewTab;