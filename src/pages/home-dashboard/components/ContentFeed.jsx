import React, { useState, useEffect } from 'react';
import NewsCard from './NewsCard';
import VideoCard from './VideoCard';
import PlayerCard from './PlayerCard';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import aiSportsService from '../../../services/aiSportsService';

const ContentFeed = ({ selectedCategory, refreshTrigger }) => {
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [error, setError] = useState(null);

  const loadContent = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Generate AI-powered content
      const aiContent = await aiSportsService.generateMixedContent(selectedCategory, 6);
      
      if (page === 1) {
        setContent(aiContent);
      } else {
        // Generate additional content for pagination
        const moreContent = await aiSportsService.generateMixedContent(selectedCategory, 3);
        setContent(prev => [...prev, ...moreContent]);
      }
      
      setHasMore(page < 3); // Limit to 3 pages to manage API costs
    } catch (error) {
      console.error('Error loading AI content:', error);
      setError('Failed to load content. Please try again.');
      
      // Fallback to mock data if AI service fails
      const mockContent = [
        {
          id: Date.now() + 1,
          type: 'news',
          title: "Breaking: Major Sports Update",
          summary: "Stay tuned for the latest sports developments. Our AI-powered system is currently updating with fresh content.",
          image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&h=250&fit=crop",
          category: selectedCategory === 'all' ? 'NBA' : selectedCategory,
          author: "Sports AI",
          timestamp: new Date(),
          views: "Loading...",
          comments: "0",
          isBreaking: true
        }
      ];
      
      if (page === 1) {
        setContent(mockContent);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    setContent([]);
    loadContent();
  }, [selectedCategory, refreshTrigger]);

  const loadMore = () => {
    setPage(prev => prev + 1);
  };

  useEffect(() => {
    if (page > 1) {
      loadContent();
    }
  }, [page]);

  const renderContentItem = (item) => {
    switch (item.type) {
      case 'news':
        return <NewsCard key={`news-${item.id}`} article={item} />;
      case 'video':
        return <VideoCard key={`video-${item.id}`} video={item} />;
      case 'player':
        return <PlayerCard key={`player-${item.id}`} player={item} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* AI Content Notice */}
      <div className="bg-accent/5 border border-accent/20 rounded-lg p-4 mb-6">
        <div className="flex items-center space-x-2 text-accent">
          <Icon name="Sparkles" size={16} />
          <span className="text-sm font-medium">AI-Powered Content</span>
        </div>
        <p className="text-xs text-text-secondary mt-1">
          This content is generated using OpenAI to provide the latest sports insights and analysis.
        </p>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2 text-red-600">
            <Icon name="AlertCircle" size={16} />
            <span className="text-sm font-medium">Content Loading Error</span>
          </div>
          <p className="text-xs text-red-600 mt-1">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadContent()}
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
            <span>Generating AI-powered content...</span>
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
            <span>Generate More Content</span>
          </Button>
        </div>
      )}

      {/* End of Content */}
      {!loading && !hasMore && content.length > 0 && (
        <div className="text-center py-8">
          <div className="flex items-center justify-center space-x-2 text-text-secondary">
            <Icon name="CheckCircle" size={20} />
            <span>You've reached the end of the AI-generated feed</span>
          </div>
          <p className="text-sm text-text-secondary mt-2">
            Refresh the page for more AI-powered content!
          </p>
        </div>
      )}

      {/* Empty State */}
      {!loading && content.length === 0 && !error && (
        <div className="text-center py-12">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
              <Icon name="Sparkles" size={24} className="text-text-secondary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                Generating AI Content
              </h3>
              <p className="text-text-secondary">
                Our AI is preparing personalized sports content for you.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentFeed;