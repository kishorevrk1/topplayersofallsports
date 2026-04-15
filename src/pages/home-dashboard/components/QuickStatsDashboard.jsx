import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const QuickStatsDashboard = ({ selectedCategory = 'all' }) => {
  const [statsData, setStatsData] = useState({});
  const [loading, setLoading] = useState(true);

  // Mock comprehensive quick stats data - 5 core sports only
  const mockStatsData = {
    all: {
      activeGames: { value: 12, trend: '+3', color: 'text-blue-600', bgColor: 'bg-blue-50' },
      breakingNews: { value: 3, trend: '+1', color: 'text-red-600', bgColor: 'bg-red-50' },
      newHighlights: { value: 28, trend: '+15', color: 'text-green-600', bgColor: 'bg-green-50' },
      playerUpdates: { value: 15, trend: '+7', color: 'text-purple-600', bgColor: 'bg-purple-50' },
      liveEvents: { value: 8, trend: '+2', color: 'text-orange-600', bgColor: 'bg-orange-50' },
      tradingAlerts: { value: 5, trend: '+2', color: 'text-yellow-600', bgColor: 'bg-yellow-50' }
    },
    basketball: {
      activeGames: { value: 4, trend: '+1', color: 'text-orange-600', bgColor: 'bg-orange-50' },
      breakingNews: { value: 1, trend: '0', color: 'text-red-600', bgColor: 'bg-red-50' },
      newHighlights: { value: 12, trend: '+8', color: 'text-green-600', bgColor: 'bg-green-50' },
      playerUpdates: { value: 6, trend: '+3', color: 'text-purple-600', bgColor: 'bg-purple-50' },
      liveEvents: { value: 2, trend: '+1', color: 'text-blue-600', bgColor: 'bg-blue-50' },
      tradingAlerts: { value: 3, trend: '+1', color: 'text-yellow-600', bgColor: 'bg-yellow-50' }
    },
    football: {
      activeGames: { value: 6, trend: '+2', color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
      breakingNews: { value: 1, trend: '+1', color: 'text-red-600', bgColor: 'bg-red-50' },
      newHighlights: { value: 8, trend: '+4', color: 'text-green-600', bgColor: 'bg-green-50' },
      playerUpdates: { value: 5, trend: '+2', color: 'text-purple-600', bgColor: 'bg-purple-50' },
      liveEvents: { value: 5, trend: '+1', color: 'text-blue-600', bgColor: 'bg-blue-50' },
      tradingAlerts: { value: 2, trend: '+1', color: 'text-yellow-600', bgColor: 'bg-yellow-50' }
    },
    cricket: {
      activeGames: { value: 3, trend: '+1', color: 'text-blue-600', bgColor: 'bg-blue-50' },
      breakingNews: { value: 2, trend: '+1', color: 'text-red-600', bgColor: 'bg-red-50' },
      newHighlights: { value: 10, trend: '+5', color: 'text-green-600', bgColor: 'bg-green-50' },
      playerUpdates: { value: 4, trend: '+2', color: 'text-purple-600', bgColor: 'bg-purple-50' },
      liveEvents: { value: 3, trend: '0', color: 'text-orange-600', bgColor: 'bg-orange-50' },
      tradingAlerts: { value: 2, trend: '+1', color: 'text-yellow-600', bgColor: 'bg-yellow-50' }
    },
    tennis: {
      activeGames: { value: 2, trend: '+1', color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
      breakingNews: { value: 1, trend: '0', color: 'text-red-600', bgColor: 'bg-red-50' },
      newHighlights: { value: 6, trend: '+3', color: 'text-green-600', bgColor: 'bg-green-50' },
      playerUpdates: { value: 3, trend: '+1', color: 'text-purple-600', bgColor: 'bg-purple-50' },
      liveEvents: { value: 2, trend: '0', color: 'text-blue-600', bgColor: 'bg-blue-50' },
      tradingAlerts: { value: 1, trend: '0', color: 'text-orange-600', bgColor: 'bg-orange-50' }
    },
    mma: {
      activeGames: { value: 1, trend: '0', color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
      breakingNews: { value: 2, trend: '+1', color: 'text-red-600', bgColor: 'bg-red-50' },
      newHighlights: { value: 5, trend: '+2', color: 'text-green-600', bgColor: 'bg-green-50' },
      playerUpdates: { value: 3, trend: '+2', color: 'text-purple-600', bgColor: 'bg-purple-50' },
      liveEvents: { value: 1, trend: '+1', color: 'text-orange-600', bgColor: 'bg-orange-50' },
      tradingAlerts: { value: 1, trend: '0', color: 'text-yellow-600', bgColor: 'bg-yellow-50' }
    }
  };

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setStatsData(mockStatsData[selectedCategory] || mockStatsData.all);
      setLoading(false);
    }, 300);
  }, [selectedCategory]);

  const stats = [
    {
      key: 'activeGames',
      label: 'Active Games Today',
      icon: 'Play',
      description: 'Games happening now'
    },
    {
      key: 'breakingNews',
      label: 'Breaking News',
      icon: 'Zap',
      description: 'Latest updates'
    },
    {
      key: 'newHighlights',
      label: 'New Highlights',
      icon: 'Video',
      description: 'Fresh video content'
    },
    {
      key: 'playerUpdates',
      label: 'Player Updates',
      icon: 'Users',
      description: 'Transfer & injury news'
    },
    {
      key: 'liveEvents',
      label: 'Live Events',
      icon: 'Calendar',
      description: 'Ongoing competitions'
    },
    {
      key: 'tradingAlerts',
      label: 'Trading Alerts',
      icon: 'TrendingUp',
      description: 'Market movements'
    }
  ];

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-border p-6">
        <div className="flex items-center space-x-2 mb-6">
          <div className="h-6 w-6 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-border p-6 mt-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Icon name="BarChart3" size={20} className="text-primary" />
          <h3 className="text-lg font-semibold text-text-primary">
            Quick Stats Dashboard
          </h3>
        </div>
        <div className="text-xs text-text-secondary">
          {selectedCategory !== 'all' ? selectedCategory.toUpperCase() : 'ALL SPORTS'}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat) => {
          const data = statsData[stat.key];
          if (!data) return null;

          return (
            <div
              key={stat.key}
              className={`${data.bgColor} rounded-lg p-4 hover:shadow-md transition-all duration-200 cursor-pointer group`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className={`${data.color} p-2 rounded-lg bg-white/70`}>
                  <Icon name={stat.icon} size={16} />
                </div>
                <div className="flex items-center space-x-1">
                  {data.trend !== '0' && (
                    <>
                      <Icon 
                        name={data.trend.startsWith('+') ? 'TrendingUp' : 'TrendingDown'} 
                        size={12} 
                        className={data.trend.startsWith('+') ? 'text-green-500' : 'text-red-500'} 
                      />
                      <span className={`text-xs font-medium ${
                        data.trend.startsWith('+') ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {data.trend}
                      </span>
                    </>
                  )}
                </div>
              </div>
              
              <div className="space-y-1">
                <div className={`text-2xl font-bold ${data.color}`}>
                  {data.value}
                </div>
                <div className="text-sm font-medium text-text-primary">
                  {stat.label}
                </div>
                <div className="text-xs text-text-secondary">
                  {stat.description}
                </div>
              </div>

              {/* Hover effect */}
              <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center space-x-1 text-xs text-text-secondary">
                  <Icon name="ArrowRight" size={12} />
                  <span>View details</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Footer */}
      <div className="mt-6 pt-4 border-t border-border">
        <div className="flex items-center justify-between text-sm">
          <div className="text-text-secondary">
            Last updated: {new Date().toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </div>
          <Button variant="ghost" size="sm" className="text-xs">
            <Icon name="RefreshCw" size={12} className="mr-1" />
            Refresh
          </Button>
        </div>
      </div>
    </div>
  );
};

export default QuickStatsDashboard;
