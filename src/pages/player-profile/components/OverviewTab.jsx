import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import aiSportsService from '../../../services/aiSportsService';

const OverviewTab = ({ player }) => {
  const [aiInsights, setAiInsights] = useState(null);
  const [loadingInsights, setLoadingInsights] = useState(false);

  // Generate AI-powered player insights
  useEffect(() => {
    const generateInsights = async () => {
      if (!player?.name) return;
      
      setLoadingInsights(true);
      try {
        const insights = await aiSportsService.generatePlayerProfile(
          player.name, 
          player.category || 'NBA'
        );
        setAiInsights(insights);
      } catch (error) {
        console.error('Error generating AI insights:', error);
      } finally {
        setLoadingInsights(false);
      }
    };

    generateInsights();
  }, [player]);

  return (
    <div className="space-y-6">
      {/* AI-Generated Insights Section */}
      <div className="bg-accent/5 border border-accent/20 rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Icon name="Sparkles" size={20} className="text-accent" />
          <h3 className="text-lg font-semibold text-text-primary">AI Player Analysis</h3>
        </div>
        
        {loadingInsights ? (
          <div className="flex items-center space-x-3 text-text-secondary">
            <Icon name="Loader2" size={16} className="animate-spin" />
            <span>Generating AI insights...</span>
          </div>
        ) : aiInsights ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {aiInsights.stats?.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-2xl font-bold text-accent">{stat.value}</div>
                  <div className="text-sm text-text-secondary">{stat.label}</div>
                </div>
              ))}
            </div>
            {aiInsights.recentUpdate && (
              <div className="bg-white rounded-lg p-4 border">
                <h4 className="font-semibold text-text-primary mb-2">
                  {aiInsights.recentUpdate.title}
                </h4>
                <p className="text-text-secondary text-sm">
                  {aiInsights.recentUpdate.description}
                </p>
                <span className="text-xs text-text-secondary mt-2 block">
                  {aiInsights.recentUpdate.timeAgo}
                </span>
              </div>
            )}
          </div>
        ) : (
          <p className="text-text-secondary">AI insights will appear here.</p>
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
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Icon name="Trophy" size={20} className="text-accent" />
          <h3 className="text-lg font-semibold">Career Highlights</h3>
        </div>
        
        <div className="space-y-4">
          {player.careerHighlights.map((highlight, index) => (
            <div key={index} className="flex items-start space-x-4 p-4 bg-muted rounded-lg">
              <div className="flex-shrink-0 w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                <Icon name={highlight.icon} size={20} className="text-accent" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-text-primary mb-1">{highlight.title}</h4>
                <p className="text-sm text-text-secondary mb-2">{highlight.description}</p>
                <div className="flex items-center space-x-4 text-xs text-text-secondary">
                  <span className="flex items-center space-x-1">
                    <Icon name="Calendar" size={12} />
                    <span>{highlight.date}</span>
                  </span>
                  {highlight.location && (
                    <span className="flex items-center space-x-1">
                      <Icon name="MapPin" size={12} />
                      <span>{highlight.location}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

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

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Icon name="Award" size={20} className="text-accent" />
            <h3 className="text-lg font-semibold">Achievements</h3>
          </div>
          
          <div className="space-y-3">
            {player.achievements.map((achievement, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center">
                  <Icon name="Medal" size={14} className="text-accent" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm">{achievement.title}</div>
                  <div className="text-xs text-text-secondary">{achievement.year}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;