import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import { useTrendingTopics, useTrendingPlayers } from '../../../hooks/useNews';
import highlightsService from '../../../services/highlightsService';

const TrendingSidebar = ({ sport = null }) => {
  const { topics, loading: topicsLoading } = useTrendingTopics(sport, 5, 24);
  const { players, loading: playersLoading } = useTrendingPlayers(sport, 5, 24);
  const [trendingHighlights, setTrendingHighlights] = useState([]);
  const [highlightsLoading, setHighlightsLoading] = useState(true);

  // Fetch trending highlights
  useEffect(() => {
    const fetchTrendingHighlights = async () => {
      try {
        setHighlightsLoading(true);
        const response = await highlightsService.getTrendingHighlights({ sport, limit: 5 });
        setTrendingHighlights(response);
      } catch (error) {
        console.error('Error fetching trending highlights:', error);
      } finally {
        setHighlightsLoading(false);
      }
    };

    fetchTrendingHighlights();
  }, [sport]);

  return (
    <div className="space-y-6">
      {/* Trending Topics */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="text-lg font-bold text-text-primary flex items-center mb-4">
          <Icon name="TrendingUp" size={20} className="mr-2 text-success" />
          Trending Topics
        </h3>

        {topicsLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : topics.length === 0 ? (
          <p className="text-sm text-text-secondary">No trending topics yet</p>
        ) : (
          <div className="space-y-3">
            {topics.map((topic, index) => (
              <Link
                key={topic.tag}
                to={`/breaking-news-feed?q=${encodeURIComponent(topic.tag)}`}
                className="block group hover:bg-muted rounded-lg p-2 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <span className="text-xl font-bold text-accent">#{index + 1}</span>
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm text-text-primary group-hover:text-accent transition-colors line-clamp-1">
                        {topic.tag}
                      </h4>
                      <p className="text-xs text-text-secondary mt-1">
                        {topic.mentionCount} {topic.mentionCount === 1 ? 'mention' : 'mentions'} • 
                        {topic.totalViews > 0 && ` ${topic.totalViews.toLocaleString()} views`}
                      </p>
                    </div>
                  </div>
                  <Icon name="TrendingUp" size={14} className="text-success flex-shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Trending Players */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="text-lg font-bold text-text-primary flex items-center mb-4">
          <Icon name="Flame" size={20} className="mr-2 text-error" />
          Trending Players
        </h3>

        {playersLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-full mb-1"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : players.length === 0 ? (
          <p className="text-sm text-text-secondary">No trending players yet</p>
        ) : (
          <div className="space-y-3">
            {players.map((player, index) => (
              <Link
                key={player.playerName}
                to={`/breaking-news-feed?q=${encodeURIComponent(player.playerName)}`}
                className="block group hover:bg-muted rounded-lg p-2 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <span className="text-xl">🔥</span>
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm text-text-primary group-hover:text-accent transition-colors">
                        {player.playerName}
                      </h4>
                      <p className="text-xs text-text-secondary">
                        {player.sport}
                      </p>
                      <p className="text-xs text-text-secondary mt-1">
                        {player.articleCount} {player.articleCount === 1 ? 'article' : 'articles'} • 
                        {player.totalViews > 0 && ` ${player.totalViews.toLocaleString()} views`}
                      </p>
                      {player.recentHeadline && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {player.recentHeadline}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-xs font-bold text-success">#{index + 1}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Trending Highlights */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="text-lg font-bold text-text-primary flex items-center mb-4">
          <Icon name="Video" size={20} className="mr-2 text-accent" />
          Trending Highlights
        </h3>

        {highlightsLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-20 bg-muted rounded mb-2"></div>
              </div>
            ))}
          </div>
        ) : trendingHighlights.length === 0 ? (
          <p className="text-sm text-text-secondary">No trending highlights yet</p>
        ) : (
          <div className="space-y-3">
            {trendingHighlights.map((highlight) => (
              <Link
                key={highlight.id}
                to={`/video-highlights-hub?videoId=${highlight.videoUrl?.split('v=')[1] || highlight.id}`}
                className="block group hover:bg-muted rounded-lg p-2 transition-colors"
              >
                <div className="flex space-x-3">
                  <div className="relative flex-shrink-0">
                    <img
                      src={highlight.thumbnail}
                      alt={highlight.title}
                      className="w-24 h-16 object-cover rounded"
                      loading="lazy"
                    />
                    <div className="absolute bottom-1 right-1 bg-black bg-opacity-75 text-white text-xs px-1 rounded">
                      {Math.floor(highlight.duration / 60)}:{(highlight.duration % 60).toString().padStart(2, '0')}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm text-text-primary group-hover:text-accent transition-colors line-clamp-2">
                      {highlight.title}
                    </h4>
                    <p className="text-xs text-text-secondary mt-1">
                      {highlight.views?.toLocaleString() || 0} views
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {highlight.source?.name || 'Unknown'}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TrendingSidebar;
