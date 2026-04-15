import React from 'react';
import { Link } from 'react-router-dom';
import Image from '../../../components/AppImage';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const NewsCard = ({ article }) => {
  const formatTimeAgo = (timestamp) => {
    if (!timestamp || isNaN(new Date(timestamp).getTime())) return '';
    const now = new Date();
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) {
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else if (days < 7) {
      return `${days}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-200">
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <Image
          src={article.image}
          alt={article.title}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
        />
        
        {/* Category Badge */}
        <div className="absolute top-3 left-3">
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            article.category === 'NBA' ? 'bg-orange-600 text-white' :
            article.category === 'NFL' ? 'bg-green-600 text-white' :
            article.category === 'MLB' ? 'bg-blue-600 text-white' :
            article.category === 'NHL'? 'bg-red-600 text-white' : 'bg-primary text-white'
          }`}>
            {article.category}
          </div>
        </div>

        {/* Breaking Badge */}
        {article.isBreaking && (
          <div className="absolute top-3 right-3">
            <div className="flex items-center space-x-1 bg-error px-2 py-1 rounded-full">
              <Icon name="Zap" size={12} color="white" />
              <span className="text-xs font-bold text-white uppercase">Live</span>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <Link to="/breaking-news-feed" className="block mb-2">
          <h3 className="text-lg font-semibold text-text-primary hover:text-accent transition-colors duration-150 line-clamp-2">
            {article.title}
          </h3>
        </Link>

        {/* Summary */}
        <p className="text-text-secondary text-sm mb-4 line-clamp-3">
          {article.summary}
        </p>

        {/* Meta Information */}
        <div className="flex items-center justify-between text-xs text-text-secondary mb-4">
          <div className="flex items-center space-x-3">
            <span className="flex items-center space-x-1">
              <Icon name="User" size={12} />
              <span>{article.author}</span>
            </span>
            <span className="flex items-center space-x-1">
              <Icon name="Clock" size={12} />
              <span>{formatTimeAgo(article.timestamp)}</span>
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <span className="flex items-center space-x-1">
              <Icon name="Eye" size={12} />
              <span>{article.views}</span>
            </span>
            <span className="flex items-center space-x-1">
              <Icon name="MessageCircle" size={12} />
              <span>{article.comments}</span>
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Link to="/breaking-news-feed">
            <Button variant="outline" size="sm">
              Read More
              <Icon name="ArrowRight" size={14} className="ml-1" />
            </Button>
          </Link>
          
          <div className="flex items-center space-x-1">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Icon name="Share2" size={14} />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Icon name="Bookmark" size={14} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsCard;