import React from 'react';
import { Link } from 'react-router-dom';
import Icon from '../../../components/AppIcon';

const Breadcrumb = ({ player }) => {
  const breadcrumbItems = [
    { label: 'Home', path: '/home-dashboard' },
    { label: player.sport, path: `/sport/${player.sport.toLowerCase()}` },
    { label: player.nationality, path: null },
    { label: player.name, path: null, current: true },
  ];

  return (
    <nav className="bg-muted/50 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-3">
        <ol className="flex items-center space-x-2 text-sm">
          {breadcrumbItems.map((item, index) => (
            <li key={index} className="flex items-center">
              {index > 0 && (
                <Icon name="ChevronRight" size={14} className="text-text-secondary mx-2" />
              )}
              
              {item.current ? (
                <span className="font-medium text-text-primary truncate max-w-[200px]">
                  {item.label}
                </span>
              ) : item.path ? (
                <Link
                  to={item.path}
                  className="text-text-secondary hover:text-text-primary transition-colors duration-150 truncate max-w-[150px]"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="text-text-secondary truncate max-w-[150px]">
                  {item.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </div>
    </nav>
  );
};

export default Breadcrumb;