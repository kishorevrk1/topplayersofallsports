import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';

const NewsCard = ({ article, isBreaking = false }) => {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [shareMenuOpen, setShareMenuOpen] = useState(false);

  const handleShare = (platform) => {
    const url = encodeURIComponent(window.location.origin + `/news/${article.id}`);
    const text = encodeURIComponent(article.headline);
    
    const shareUrls = {
      twitter: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      copy: () => {
        navigator.clipboard.writeText(`${article.headline} - ${window.location.origin}/news/${article.id}`);
        setShareMenuOpen(false);
      }
    };

    if (platform === 'copy') {
      shareUrls.copy();
    } else {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400');
      setShareMenuOpen(false);
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const articleTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - articleTime) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <article className={`bg-card border rounded-lg overflow-hidden transition-all duration-200 hover:shadow-lg cursor-pointer ${
      isBreaking ? 'border-error border-2' : 'border-border'
    }`}
    onClick={() => window.open(article.originalUrl, '_blank', 'noopener,noreferrer')}
    >
      {/* Breaking News Badge */}
      {isBreaking && (
        <div className="bg-error text-error-foreground px-3 py-1 text-xs font-bold uppercase tracking-wide flex items-center">
          <Icon name="Zap" size={12} className="mr-1" />
          Breaking News
        </div>
      )}

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2 text-sm text-text-secondary">
            <span className="font-medium text-accent">{article.source}</span>
            <span>•</span>
            <time>{formatTimeAgo(article.publishedAt)}</time>
            {article.isLive && (
              <>
                <span>•</span>
                <div className="flex items-center text-error">
                  <div className="w-2 h-2 bg-error rounded-full mr-1 animate-pulse"></div>
                  Live
                </div>
              </>
            )}
          </div>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                setIsBookmarked(!isBookmarked);
              }}
              className="h-8 w-8"
            >
              <Icon 
                name={isBookmarked ? "Bookmark" : "BookmarkPlus"} 
                size={16} 
                className={isBookmarked ? "fill-current text-accent" : ""}
              />
            </Button>
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  setShareMenuOpen(!shareMenuOpen);
                }}
                className="h-8 w-8"
              >
                <Icon name="Share" size={16} />
              </Button>
              
              {shareMenuOpen && (
                <div className="absolute right-0 top-full mt-1 bg-popover border border-border rounded-lg shadow-lg z-10 min-w-[160px]" onClick={(e) => e.stopPropagation()}>
                  <div className="py-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShare('twitter');
                      }}
                      className="w-full flex items-center px-3 py-2 text-sm hover:bg-muted transition-colors"
                    >
                      <Icon name="Twitter" size={14} className="mr-2" />
                      Twitter
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShare('facebook');
                      }}
                      className="w-full flex items-center px-3 py-2 text-sm hover:bg-muted transition-colors"
                    >
                      <Icon name="Facebook" size={14} className="mr-2" />
                      Facebook
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShare('linkedin');
                      }}
                      className="w-full flex items-center px-3 py-2 text-sm hover:bg-muted transition-colors"
                    >
                      <Icon name="Linkedin" size={14} className="mr-2" />
                      LinkedIn
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShare('copy');
                      }}
                      className="w-full flex items-center px-3 py-2 text-sm hover:bg-muted transition-colors"
                    >
                      <Icon name="Copy" size={14} className="mr-2" />
                      Copy Link
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-text-primary leading-tight line-clamp-2 hover:text-accent transition-colors cursor-pointer">
            <Link to={`/news/${article.id}`}>
              {article.headline}
            </Link>
          </h2>

          {article.image && (
            <div className="relative overflow-hidden rounded-lg bg-muted">
              <Image
                src={article.image}
                alt={article.headline}
                className="w-full h-64 object-contain transition-transform duration-200 hover:scale-105"
              />
            </div>
          )}

          <p className="text-text-secondary text-sm leading-relaxed line-clamp-3">
            {article.summary}
          </p>

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {article.tags.slice(0, 3).map((tag, index) => (
                <Link
                  key={index}
                  to={`/search-results?q=${encodeURIComponent(tag)}`}
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center px-2 py-1 bg-muted text-text-secondary text-xs rounded-full hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  {tag}
                </Link>
              ))}
              {article.tags.length > 3 && (
                <span className="text-xs text-text-secondary px-2 py-1">
                  +{article.tags.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
          <div className="flex items-center space-x-4 text-sm text-text-secondary">
            <div className="flex items-center space-x-1">
              <Icon name="Eye" size={14} />
              <span>{article.views?.toLocaleString() || '0'}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Icon name="MessageCircle" size={14} />
              <span>{article.comments || 0}</span>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs"
            onClick={(e) => {
              e.stopPropagation();
              window.open(article.originalUrl, '_blank', 'noopener,noreferrer');
            }}
          >
            Read Full Article
            <Icon name="ExternalLink" size={12} className="ml-1" />
          </Button>
        </div>
      </div>
    </article>
  );
};

export default NewsCard;