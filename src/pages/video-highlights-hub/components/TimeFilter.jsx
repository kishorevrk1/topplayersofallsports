import React from 'react';
import Icon from '../../../components/AppIcon';

/**
 * Time filter component for filtering videos by date range
 */
const TimeFilter = ({ selectedTime, onTimeChange, className = '' }) => {
  const timeFilters = [
    { value: 'all', label: 'All Time', icon: 'Calendar' },
    { value: 'today', label: 'Today', icon: 'Clock' },
    { value: 'week', label: 'This Week', icon: 'CalendarDays' },
    { value: 'month', label: 'This Month', icon: 'CalendarRange' },
  ];

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <span className="text-sm font-medium text-text-secondary hidden sm:inline">
        Time:
      </span>
      <div className="flex items-center space-x-1 bg-muted rounded-lg p-1">
        {timeFilters.map((filter) => (
          <button
            key={filter.value}
            onClick={() => onTimeChange(filter.value)}
            className={`
              flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-sm font-medium
              transition-all duration-200
              ${
                selectedTime === filter.value
                  ? 'bg-accent text-accent-foreground shadow-sm'
                  : 'text-text-secondary hover:text-text-primary hover:bg-background'
              }
            `}
          >
            <Icon 
              name={filter.icon} 
              size={14} 
              className={selectedTime === filter.value ? '' : 'opacity-70'}
            />
            <span className="hidden sm:inline">{filter.label}</span>
            <span className="sm:hidden">
              {filter.value === 'all' ? 'All' : 
               filter.value === 'today' ? '1D' :
               filter.value === 'week' ? '1W' : '1M'}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default TimeFilter;
