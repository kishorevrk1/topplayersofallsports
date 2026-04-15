import React, { useState, useEffect } from 'react';
import NewsCard from './NewsCard';
import VideoCard from './VideoCard';
import PlayerCard from './PlayerCard';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import newsService from '../../../services/newsService';
import highlightsService from '../../../services/highlightsService';

const SPORT_MAP = {
  all: null,
  basketball: 'BASKETBALL',
  football: 'FOOTBALL',
  soccer: 'SOCCER',
  hockey: 'HOCKEY',
  tennis: 'TENNIS',
  mma: 'MMA',
  baseball: 'BASEBALL',
  golf: 'GOLF',
};

const toNewsCard = (article) => ({
  id: article.id,
  type: 'news',
  title: article.headline || article.title,
  summary: article.summary,
  image: article.image || article.imageUrl || '/assets/images/no_image.png',
  category: article.sport || 'Sports',
  author: article.author || article.source || 'Sports Desk',
  timestamp: article.publishedAt instanceof Date ? article.publishedAt : new Date(article.publishedAt),
  views: article.views ?? '—',
  comments: '0',
  isBreaking: article.isBreaking || false,
});

const toVideoCard = (highlight) => ({
  id: highlight.id,
  type: 'video',
  title: highlight.title,
  description: highlight.description || '',
  thumbnail: highlight.thumbnail || '/assets/images/no_image.png',
  duration: highlight.duration || 0,
  views: highlight.views || 0,
  likes: highlight.likes || 0,
  comments: 0,
  uploadedAt: highlight.uploadedAt instanceof Date ? highlight.uploadedAt : new Date(highlight.uploadedAt),
  category: highlight.league || highlight.sport || 'Sports',
  isHighlight: true,
  isLive: highlight.isLive || false,
});

const ContentFeed = ({ selectedCategory, refreshTrigger }) => {
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [error, setError] = useState(null);

  const sport = SPORT_MAP[selectedCategory?.toLowerCase()] || null;

  const loadContent = async (pageNum = 0) => {
    setLoading(true);
    setError(null);

    try {
      const [newsResult, highlightsResult] = await Promise.allSettled([
        sport
          ? newsService.getNewsBySport(sport, pageNum, 4)
          : newsService.getAllNews(pageNum, 4),
        highlightsService.getHighlights({ sport: sport?.toLowerCase(), page: pageNum, size: 2 }),
      ]);

      const newsItems = newsResult.status === 'fulfilled'
        ? (newsResult.value?.content || newsResult.value || [])
            .map(a => toNewsCard(newsService.transformArticle ? newsService.transformArticle(a) : a))
        : [];

      const videoItems = highlightsResult.status === 'fulfilled'
        ? (highlightsResult.value?.content || [])
            .map(h => toVideoCard(highlightsService.transformHighlight ? highlightsService.transformHighlight(h) : h))
        : [];

      // Interleave: 2 news, 1 video, 2 news, 1 video…
      const mixed = [];
      let ni = 0, vi = 0;
      while (ni < newsItems.length || vi < videoItems.length) {
        for (let i = 0; i < 2 && ni < newsItems.length; i++) mixed.push(newsItems[ni++]);
        if (vi < videoItems.length) mixed.push(videoItems[vi++]);
      }

      if (pageNum === 0) {
        setContent(mixed);
      } else {
        setContent(prev => [...prev, ...mixed]);
      }

      const newsHasMore = newsResult.status === 'fulfilled' && !(newsResult.value?.last ?? true);
      setHasMore(newsHasMore && pageNum < 2);
    } catch (err) {
      console.error('Error loading content:', err);
      setError('Failed to load content. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(0);
    setContent([]);
    loadContent(0);
  }, [selectedCategory, refreshTrigger]);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    loadContent(next);
  };

  const renderContentItem = (item) => {
    switch (item.type) {
      case 'news':   return <NewsCard key={`news-${item.id}`} article={item} />;
      case 'video':  return <VideoCard key={`video-${item.id}`} video={item} />;
      case 'player': return <PlayerCard key={`player-${item.id}`} player={item} />;
      default:       return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 text-red-600">
            <Icon name="AlertCircle" size={16} />
            <span className="text-sm font-medium">Content Loading Error</span>
          </div>
          <p className="text-xs text-red-600 mt-1">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadContent(page)}
            className="mt-2 text-red-600 border-red-200 hover:bg-red-50"
          >
            <Icon name="RefreshCw" size={14} className="mr-1" />
            Retry
          </Button>
        </div>
      )}

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-6">
        {content.map(renderContentItem)}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center space-x-3 text-text-secondary">
            <Icon name="Loader2" size={20} className="animate-spin" />
            <span>Loading content...</span>
          </div>
        </div>
      )}

      {/* Load More Button */}
      {!loading && hasMore && content.length > 0 && (
        <div className="flex justify-center py-6">
          <Button
            variant="outline"
            onClick={loadMore}
            className="flex items-center space-x-2"
          >
            <Icon name="Plus" size={16} />
            <span>Load More</span>
          </Button>
        </div>
      )}

      {/* End of Content */}
      {!loading && !hasMore && content.length > 0 && (
        <div className="text-center py-8">
          <div className="flex items-center justify-center space-x-2 text-text-secondary">
            <Icon name="CheckCircle" size={20} />
            <span>You're all caught up</span>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && content.length === 0 && !error && (
        <div className="text-center py-12">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
              <Icon name="Newspaper" size={24} className="text-text-secondary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">No content yet</h3>
              <p className="text-text-secondary">
                Check back soon for the latest sports news and highlights.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentFeed;
