import React from 'react';
import Icon from '../../../components/AppIcon';

const OverviewTab = ({ player }) => {
  const rating = player.aiRating ?? player.rankingScore;

  return (
    <div className="space-y-6">
      {/* All-Time Rating */}
      {rating != null && (
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Icon name="Star" size={20} className="text-accent" />
            <h3 className="text-lg font-semibold text-text-primary">All-Time Rating</h3>
            <span className="bg-accent/10 text-accent text-xs font-medium px-2 py-1 rounded-full">
              AI-powered
            </span>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-5xl font-bold text-accent">{Math.round(rating)}</div>
            <div className="flex-1">
              <div className="h-2.5 rounded-full bg-muted overflow-hidden mb-2">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-accent to-accent/70 transition-all duration-700"
                  style={{ width: `${Math.min(rating, 100)}%` }}
                />
              </div>
              <p className="text-sm text-text-secondary leading-relaxed">
                Scored on peak performance, longevity, awards, and era-adjusted impact.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Strengths */}
      {player.strengths?.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Icon name="Zap" size={20} className="text-accent" />
            <h3 className="text-lg font-semibold">Key Strengths</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {player.strengths.map((strength, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-medium border border-accent/20"
              >
                <Icon name="CheckCircle" size={14} />
                {strength}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Biography */}
      {player.biography && (
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Icon name="User" size={20} className="text-accent" />
            <h3 className="text-lg font-semibold">Biography</h3>
          </div>
          <p className="text-text-secondary leading-relaxed">
            {player.biography}
          </p>
        </div>
      )}

      {/* Career Highlights */}
      {player.careerHighlights?.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-6">
            <Icon name="Trophy" size={20} className="text-accent" />
            <h3 className="text-lg font-semibold">Career Highlights</h3>
          </div>

          <div className="space-y-3">
            {player.careerHighlights.map((highlight, index) => {
              const isString = typeof highlight === 'string';
              const title       = isString ? highlight : (highlight.title || highlight);
              const description = isString ? '' : (highlight.description || '');
              const date        = isString ? '' : (highlight.date || '');
              const location    = isString ? '' : (highlight.location || '');
              const icon        = isString ? 'Trophy' : (highlight.icon || 'Trophy');

              return (
                <div key={`${title}-${index}`} className="flex items-start space-x-4 p-4 bg-muted rounded-lg">
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

      {/* Personal Information + Achievements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Icon name="Info" size={20} className="text-accent" />
            <h3 className="text-lg font-semibold">Personal Information</h3>
          </div>

          <div className="space-y-3">
            {[
              { label: 'Full Name',    value: player.fullName },
              { label: 'Date of Birth', value: player.dateOfBirth },
              { label: 'Birthplace',   value: player.birthplace },
              { label: 'Nationality',  value: player.nationality },
              { label: 'College',      value: player.college },
            ].filter(({ value }) => value && value !== '—' && value !== 'N/A').map(({ label, value }) => (
              <div key={label} className="flex justify-between">
                <span className="text-text-secondary">{label}</span>
                <span className="font-medium">{value}</span>
              </div>
            ))}
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
                  <div key={`${title}-${index}`} className="flex items-center space-x-3">
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
