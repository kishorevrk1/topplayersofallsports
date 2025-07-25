import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const RefreshIndicator = ({ onRefresh, lastUpdated, newArticlesCount = 0 }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timeAgo, setTimeAgo] = useState('');
  const [showNewArticlesBanner, setShowNewArticlesBanner] = useState(false);

  useEffect(() => {
    const updateTimeAgo = () => {
      if (lastUpdated) {
        const now = new Date();
        const diffInMinutes = Math.floor((now - lastUpdated) / (1000 * 60));
        
        if (diffInMinutes < 1) {
          setTimeAgo('Just now');
        } else if (diffInMinutes < 60) {
          setTimeAgo(`${diffInMinutes}m ago`);
        } else if (diffInMinutes < 1440) {
          setTimeAgo(`${Math.floor(diffInMinutes / 60)}h ago`);
        } else {
          setTimeAgo(`${Math.floor(diffInMinutes / 1440)}d ago`);
        }
      }
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [lastUpdated]);

  useEffect(() => {
    if (newArticlesCount > 0) {
      setShowNewArticlesBanner(true);
    }
  }, [newArticlesCount]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
      setShowNewArticlesBanner(false);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleViewNewArticles = () => {
    setShowNewArticlesBanner(false);
    onRefresh();
  };

  return (
    <div className="space-y-2">
      {/* New Articles Banner */}
      {showNewArticlesBanner && newArticlesCount > 0 && (
        <div className="bg-accent text-accent-foreground rounded-lg p-3 mx-4 lg:mx-6 animate-slide-down">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Icon name="Bell" size={16} />
              <span className="font-medium">
                {newArticlesCount} new article{newArticlesCount !== 1 ? 's' : ''} available
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleViewNewArticles}
                className="text-accent-foreground hover:bg-accent-foreground hover:bg-opacity-20 h-8"
              >
                View Now
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowNewArticlesBanner(false)}
                className="text-accent-foreground hover:bg-accent-foreground hover:bg-opacity-20 h-8 w-8"
              >
                <Icon name="X" size={14} />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Refresh Controls */}
      <div className="flex items-center justify-between px-4 lg:px-6 py-3 bg-muted border-b border-border">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center space-x-2"
          >
            <Icon 
              name="RefreshCw" 
              size={16} 
              className={isRefreshing ? 'animate-spin' : ''} 
            />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </Button>

          <div className="flex items-center space-x-2 text-sm text-text-secondary">
            <Icon name="Clock" size={14} />
            <span>Last updated: {timeAgo}</span>
          </div>

          {/* Auto-refresh indicator */}
          <div className="hidden lg:flex items-center space-x-2 text-sm text-text-secondary">
            <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
            <span>Auto-refresh: 5min</span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Live indicator */}
          <div className="flex items-center space-x-2 text-sm">
            <div className="w-2 h-2 bg-error rounded-full animate-pulse"></div>
            <span className="text-error font-medium">LIVE</span>
          </div>

          {/* Settings */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
          >
            <Icon name="Settings" size={16} />
          </Button>
        </div>
      </div>

      {/* Pull-to-refresh hint for mobile */}
      <div className="lg:hidden px-4 py-2 text-center">
        <p className="text-xs text-text-secondary flex items-center justify-center space-x-1">
          <Icon name="ArrowDown" size={12} />
          <span>Pull down to refresh</span>
        </p>
      </div>
    </div>
  );
};

export default RefreshIndicator;