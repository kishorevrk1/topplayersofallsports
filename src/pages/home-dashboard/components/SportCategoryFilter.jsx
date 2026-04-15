import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const SportCategoryFilter = ({ onCategoryChange, activeCategory = 'all' }) => {
  const [selectedCategory, setSelectedCategory] = useState(activeCategory);

  // 5 core sports aligned with player-service backend
  const categories = [
    { id: 'all', name: 'All Sports', icon: 'Trophy', color: 'bg-primary' },
    { id: 'football', name: 'Football', icon: 'CircleDot', color: 'bg-emerald-600' },
    { id: 'basketball', name: 'Basketball', icon: 'Circle', color: 'bg-orange-600' },
    { id: 'cricket', name: 'Cricket', icon: 'Target', color: 'bg-blue-600' },
    { id: 'tennis', name: 'Tennis', icon: 'Zap', color: 'bg-yellow-600' },
    { id: 'mma', name: 'MMA', icon: 'Shield', color: 'bg-indigo-600' }
  ];

  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
    onCategoryChange(categoryId);
  };

  return (
    <div className="mb-6">
      {/* Desktop View */}
      <div className="hidden lg:flex flex-wrap gap-3">
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? "default" : "outline"}
            size="sm"
            onClick={() => handleCategorySelect(category.id)}
            className={`flex items-center space-x-2 ${
              selectedCategory === category.id 
                ? `${category.color} text-white border-transparent` 
                : 'hover:bg-muted'
            }`}
          >
            <Icon name={category.icon} size={16} />
            <span>{category.name}</span>
          </Button>
        ))}
      </div>

      {/* Mobile View - Horizontal Scroll */}
      <div className="lg:hidden">
        <div className="flex space-x-3 overflow-x-auto scrollbar-hide pb-2">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              size="sm"
              onClick={() => handleCategorySelect(category.id)}
              className={`flex items-center space-x-2 whitespace-nowrap flex-shrink-0 ${
                selectedCategory === category.id 
                  ? `${category.color} text-white border-transparent` 
                  : 'hover:bg-muted'
              }`}
            >
              <Icon name={category.icon} size={16} />
              <span>{category.name}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Active Category Info */}
      {selectedCategory !== 'all' && (
        <div className="mt-4 flex items-center justify-between bg-muted rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <Icon 
              name={categories.find(cat => cat.id === selectedCategory)?.icon || 'Trophy'} 
              size={18} 
              className="text-accent"
            />
            <span className="text-sm font-medium text-text-primary">
              Showing {categories.find(cat => cat.id === selectedCategory)?.name} content
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleCategorySelect('all')}
            className="text-text-secondary hover:text-text-primary"
          >
            <Icon name="X" size={14} className="mr-1" />
            Clear Filter
          </Button>
        </div>
      )}
    </div>
  );
};

export default SportCategoryFilter;