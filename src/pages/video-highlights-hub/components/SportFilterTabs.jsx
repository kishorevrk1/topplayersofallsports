import React, { useRef, useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const SportFilterTabs = ({ selectedSport, onSportChange, className = '' }) => {
  const scrollContainerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const sports = [
    { value: 'all', label: 'All Sports', icon: 'Trophy' },
    { value: 'basketball', label: 'Basketball', icon: 'Circle' },
    { value: 'football', label: 'Football', icon: 'Zap' },
    { value: 'soccer', label: 'Soccer', icon: 'Circle' },
    { value: 'baseball', label: 'Baseball', icon: 'Circle' },
    { value: 'hockey', label: 'Hockey', icon: 'Circle' },
    { value: 'tennis', label: 'Tennis', icon: 'Circle' },
    { value: 'golf', label: 'Golf', icon: 'Circle' },
    { value: 'boxing', label: 'Boxing', icon: 'Square' },
    { value: 'mma', label: 'MMA', icon: 'Square' },
  ];

  const checkScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  useEffect(() => {
    checkScrollButtons();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollButtons);
      return () => container.removeEventListener('scroll', checkScrollButtons);
    }
  }, []);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  return (
    <div className={`relative bg-background border-b border-border ${className}`}>
      <div className="flex items-center">
        {/* Left Scroll Button */}
        {canScrollLeft && (
          <Button
            variant="ghost"
            size="icon"
            onClick={scrollLeft}
            className="absolute left-0 z-10 bg-background shadow-md rounded-full w-8 h-8 ml-2"
          >
            <Icon name="ChevronLeft" size={16} />
          </Button>
        )}

        {/* Scrollable Tabs Container */}
        <div
          ref={scrollContainerRef}
          className="flex items-center space-x-1 overflow-x-auto scrollbar-hide px-4 py-3"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {sports.map((sport) => (
            <Button
              key={sport.value}
              variant={selectedSport === sport.value ? "default" : "ghost"}
              size="sm"
              onClick={() => onSportChange(sport.value)}
              className={`flex items-center space-x-2 whitespace-nowrap flex-shrink-0 transition-all duration-200 ${
                selectedSport === sport.value
                  ? 'bg-accent text-accent-foreground shadow-sm'
                  : 'text-text-secondary hover:text-text-primary hover:bg-muted'
              }`}
            >
              <Icon name={sport.icon} size={16} />
              <span className="hidden sm:inline">{sport.label}</span>
              <span className="sm:hidden">{sport.label.split(' ')[0]}</span>
            </Button>
          ))}
        </div>

        {/* Right Scroll Button */}
        {canScrollRight && (
          <Button
            variant="ghost"
            size="icon"
            onClick={scrollRight}
            className="absolute right-0 z-10 bg-background shadow-md rounded-full w-8 h-8 mr-2"
          >
            <Icon name="ChevronRight" size={16} />
          </Button>
        )}
      </div>
    </div>
  );
};

export default SportFilterTabs;