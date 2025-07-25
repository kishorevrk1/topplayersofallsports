import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';

const NewsTab = ({ player }) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('latest');

  const categories = [
    { value: 'all', label: 'All News', count: 24 },
    { value: 'performance', label: 'Performance', count: 8 },
    { value: 'trades', label: 'Trades & Transfers', count: 3 },
    { value: 'injuries', label: 'Injury Updates', count: 2 },
    { value: 'personal', label: 'Personal', count: 5 },
    { value: 'awards', label: 'Awards & Recognition', count: 6 },
  ];

  const sortOptions = [
    { value: 'latest', label: 'Latest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'relevance', label: 'Most Relevant' },
  ];

  const filteredNews = player.news.filter(article => 
    selectedCategory === 'all' || article.category === selectedCategory
  );

  const formatTimeAgo = (date) => {
    const now = new Date();
    const articleDate = new Date(date);
    const diffInHours = Math.floor((now - articleDate) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return articleDate.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Button
              key={category.value}
              variant={selectedCategory === category.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category.value)}
              className="flex items-center space-x-1"
            >
              <span>{category.label}</span>
              <span className="bg-muted text-text-secondary text-xs px-1.5 py-0.5 rounded-full">
                {category.count}
              </span>
            </Button>
          ))}
        </div>

        {/* Sort Options */}
        <div className="flex items-center space-x-2">
          <Icon name="ArrowUpDown" size={16} className="text-text-secondary" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* News Feed */}
      <div className="space-y-4">
        {filteredNews.map((article) => (
          <article key={article.id} className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex flex-col lg:flex-row lg:space-x-6">
              {/* Article Image */}
              {article.image && (
                <div className="w-full lg:w-48 h-48 lg:h-32 mb-4 lg:mb-0 flex-shrink-0">
                  <Image
                    src={article.image}
                    alt={article.title}
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
              )}

              {/* Article Content */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      article.category === 'performance' ? 'bg-green-100 text-green-800' :
                      article.category === 'trades' ? 'bg-blue-100 text-blue-800' :
                      article.category === 'injuries' ? 'bg-red-100 text-red-800' :
                      article.category === 'awards'? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {article.category.charAt(0).toUpperCase() + article.category.slice(1)}
                    </span>
                    {article.isBreaking && (
                      <span className="bg-red-500 text-white px-2 py-1 text-xs font-medium rounded-full animate-pulse">
                        BREAKING
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-text-primary mb-2 line-clamp-2">
                  {article.title}
                </h3>

                <p className="text-text-secondary text-sm mb-4 line-clamp-3">
                  {article.summary}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-text-secondary">
                    <div className="flex items-center space-x-1">
                      <Image
                        src={article.source.logo}
                        alt={article.source.name}
                        className="w-4 h-4 rounded"
                      />
                      <span>{article.source.name}</span>
                    </div>
                    <span className="flex items-center space-x-1">
                      <Icon name="Clock" size={12} />
                      <span>{formatTimeAgo(article.publishedAt)}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Icon name="Eye" size={12} />
                      <span>{article.views.toLocaleString()}</span>
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" iconName="Share2">
                      Share
                    </Button>
                    <Link to={`/news/${article.id}`}>
                      <Button variant="outline" size="sm">
                        Read More
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Load More */}
      <div className="text-center">
        <Button variant="outline" iconName="ChevronDown">
          Load More Articles
        </Button>
      </div>
    </div>
  );
};

export default NewsTab;