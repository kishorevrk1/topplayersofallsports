import React from 'react';
import Icon from '../../../components/AppIcon';

const PlayerTabs = ({ activeTab, onTabChange, tabs }) => {
  return (
    <div className="bg-background border-b border-border sticky top-16 z-40">
      <div className="max-w-7xl mx-auto">
        {/* Mobile Tab Navigation */}
        <div className="lg:hidden overflow-x-auto scrollbar-hide">
          <div className="flex space-x-1 px-4 py-2 min-w-max">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center space-x-2 px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-150 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-accent text-accent-foreground'
                    : 'text-text-secondary hover:text-text-primary hover:bg-muted'
                }`}
              >
                <Icon name={tab.icon} size={16} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="bg-error text-error-foreground text-xs font-medium rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Desktop Tab Navigation */}
        <div className="hidden lg:flex items-center justify-center px-6">
          <div className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center space-x-2 px-4 py-4 border-b-2 text-sm font-medium transition-colors duration-150 ${
                  activeTab === tab.id
                    ? 'border-accent text-accent' :'border-transparent text-text-secondary hover:text-text-primary hover:border-border'
                }`}
              >
                <Icon name={tab.icon} size={18} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="bg-error text-error-foreground text-xs font-medium rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 ml-1">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerTabs;