import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import Icon from '../AppIcon';

const TabNavigation = () => {
  const location = useLocation();

  const navigationItems = [
    { 
      label: 'Home', 
      path: '/home-dashboard', 
      icon: 'Home',
      badge: null
    },
    { 
      label: 'Players', 
      path: '/players', 
      icon: 'Users',
      badge: null
    },
    { 
      label: 'Videos', 
      path: '/video-highlights-hub', 
      icon: 'Play',
      badge: 3
    },
    { 
      label: 'News', 
      path: '/breaking-news-feed', 
      icon: 'Newspaper',
      badge: 5
    },
    { 
      label: 'Profile', 
      path: '/user-authentication', 
      icon: 'User',
      badge: null
    },
  ];

  const isActiveRoute = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-100 lg:hidden">
      <div className="flex items-center justify-around px-2 py-2">
        {navigationItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`relative flex flex-col items-center justify-center min-w-0 flex-1 px-2 py-2 rounded-lg transition-colors duration-150 ${
              isActiveRoute(item.path)
                ? 'text-accent' :'text-text-secondary hover:text-text-primary'
            }`}
          >
            <div className="relative">
              <Icon 
                name={item.icon} 
                size={20} 
                strokeWidth={isActiveRoute(item.path) ? 2.5 : 2}
              />
              {item.badge && (
                <span className="absolute -top-2 -right-2 bg-error text-error-foreground text-xs font-medium rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              )}
            </div>
            <span className={`text-xs font-medium mt-1 truncate max-w-full ${
              isActiveRoute(item.path) ? 'text-accent' : 'text-text-secondary'
            }`}>
              {item.label}
            </span>
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default TabNavigation;