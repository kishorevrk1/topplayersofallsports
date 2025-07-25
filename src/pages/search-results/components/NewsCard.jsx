import React from 'react';
import { Link } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';

const NewsCard = ({ article, isCompact = false }) => {
  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const articleTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - articleTime) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  if (isCompact) {
    return (
      <Link to="/breaking-news-feed" className="block">
        <div className="flex space-x-3 p-3 bg-card rounded-lg border border-border hover:shadow-md transition-all duration-200">
          <Image
            src={article.thumbnail}
            alt={article.title}
            className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
          />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-xs font-medium text-accent bg-accent/10 px-2 py-1 rounded-full">
                {article.category}
              </span>
              {article.isBreaking && (
                <span className="text-xs font-medium text-error bg-error/10 px-2 py-1 rounded-full flex items-center space-x-1">
                  <Icon name="Zap" size={10} />
                  <span>BREAKING</span>
                </span>
              )}
            </div>
            
            <h3 className="font-semibold text-text-primary line-clamp-2 mb-1">{article.title}</h3>
            
            <div className="flex items-center space-x-2 text-xs text-text-secondary">
              <span>{article.source}</span>
              <span>•</span>
              <span>{formatTimeAgo(article.publishedAt)}</span>
              <span>•</span>
              <div className="flex items-center space-x-1">
                <Icon name="Eye" size={10} />
                <span>{article.views}</span>
              </div>
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
    <Link to="/breaking-news-feed" className="block">
      <div className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg transition-all duration-300 group">
        <div className="relative">
          <Image
            src={article.thumbnail}
            alt={article.title}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          
          <div className="absolute top-3 left-3 flex items-center space-x-2">
            <span className="bg-accent text-accent-foreground px-2 py-1 rounded-full text-xs font-medium">
              {article.category}
            </span>
            {article.isBreaking && (
              <span className="bg-error text-error-foreground px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
                <Icon name="Zap" size={10} />
                <span>BREAKING</span>
              </span>
            )}
          </div>

          <div className="absolute bottom-3 left-3 right-3">
            <h3 className="font-bold text-white text-lg line-clamp-2 mb-2">{article.title}</h3>
            <div className="flex items-center space-x-2 text-white/80 text-sm">
              <span>{article.source}</span>
              <span>•</span>
              <span>{formatTimeAgo(article.publishedAt)}</span>
            </div>
          </div>
        </div>

        <div className="p-4">
          <p className="text-text-secondary text-sm line-clamp-3 mb-4">{article.summary}</p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm text-text-secondary">
              <div className="flex items-center space-x-1">
                <Icon name="Eye" size={14} />
                <span>{article.views}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Icon name="MessageCircle" size={14} />
                <span>{article.comments}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Icon name="Share2" size={14} />
                <span>{article.shares}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm">
                <Icon name="Bookmark" size={14} />
              </Button>
              <Button variant="ghost" size="sm">
                <Icon name="Share2" size={14} />
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
            <div className="flex items-center space-x-2">
              <Image
                src={article.authorAvatar}
                alt={article.author}
                className="w-6 h-6 rounded-full object-cover"
              />
              <span className="text-sm font-medium text-text-primary">{article.author}</span>
            </div>
            
            <Button variant="ghost" size="sm">
              <Icon name="ExternalLink" size={14} className="mr-1" />
              Read More
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default NewsCard;