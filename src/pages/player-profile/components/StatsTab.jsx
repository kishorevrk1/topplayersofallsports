import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const StatsTab = ({ player }) => {
  const [selectedSeason, setSelectedSeason] = useState('2024');
  const [viewMode, setViewMode] = useState('season'); // 'season' or 'career'

  const seasons = ['2024', '2023', '2022', '2021', '2020'];

  const currentStats = viewMode === 'career' ? player.careerStats : player.seasonStats[selectedSeason];

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === 'season' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('season')}
          >
            Season Stats
          </Button>
          <Button
            variant={viewMode === 'career' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('career')}
          >
            Career Stats
          </Button>
        </div>

        {viewMode === 'season' && (
          <div className="flex items-center space-x-2">
            <Icon name="Calendar" size={16} className="text-text-secondary" />
            <select
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
              className="bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            >
              {seasons.map((season) => (
                <option key={season} value={season}>
                  {season} Season
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Stats Cards - Mobile */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:hidden gap-4">
        {Object.entries(currentStats).map(([key, value]) => (
          <div key={key} className="bg-card border border-border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-accent mb-1">{value}</div>
            <div className="text-xs text-text-secondary capitalize">
              {key.replace(/([A-Z])/g, ' $1').trim()}
            </div>
          </div>
        ))}
      </div>

      {/* Stats Table - Desktop */}
      <div className="hidden lg:block bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-lg font-semibold flex items-center space-x-2">
            <Icon name="BarChart3" size={20} className="text-accent" />
            <span>{viewMode === 'career' ? 'Career Statistics' : `${selectedSeason} Season Statistics`}</span>
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-text-secondary">Statistic</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-text-secondary">Value</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-text-secondary">Rank</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {Object.entries(currentStats).map(([key, value], index) => (
                <tr key={key} className="hover:bg-muted/50">
                  <td className="px-6 py-4 text-sm font-medium text-text-primary capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </td>
                  <td className="px-6 py-4 text-sm text-text-primary text-right font-semibold">
                    {value}
                  </td>
                  <td className="px-6 py-4 text-sm text-text-secondary text-right">
                    #{Math.floor(Math.random() * 50) + 1}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Performance Chart Placeholder */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center space-x-2">
            <Icon name="TrendingUp" size={20} className="text-accent" />
            <span>Performance Trend</span>
          </h3>
          <Button variant="outline" size="sm" iconName="Download">
            Export
          </Button>
        </div>
        
        <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
          <div className="text-center">
            <Icon name="BarChart3" size={48} className="text-text-secondary mx-auto mb-2" />
            <p className="text-text-secondary">Performance chart would be displayed here</p>
            <p className="text-sm text-text-secondary mt-1">Integration with charting library required</p>
          </div>
        </div>
      </div>

      {/* Comparison Section */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Icon name="Users" size={20} className="text-accent" />
          <h3 className="text-lg font-semibold">League Comparison</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-green-600 mb-1">Top 10%</div>
            <div className="text-sm text-text-secondary">Scoring Average</div>
          </div>
          <div className="text-center p-4 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-blue-600 mb-1">Top 25%</div>
            <div className="text-sm text-text-secondary">Assists</div>
          </div>
          <div className="text-center p-4 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-orange-600 mb-1">Top 15%</div>
            <div className="text-sm text-text-secondary">Rebounds</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsTab;