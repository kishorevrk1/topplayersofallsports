/**
 * LiveCalendar Component
 * 
 * Main component for Live-First sports calendar experience:
 * - Auto-refreshing live matches (every 15 seconds)
 * - Smooth transitions and animations
 * - Empty states with helpful messages
 * - Mobile-responsive grid layout
 * - Loading skeletons
 */

import React, { useState, useEffect } from 'react';
import { Activity, RefreshCw, Zap, Clock, Calendar as CalendarIcon } from 'lucide-react';
import LiveMatchCard from './LiveMatchCard';
import calendarApiService from '../../services/calendarApiService';

const LiveCalendar = () => {
  const [liveMatches, setLiveMatches] = useState([]);
  const [recentMatches, setRecentMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedSport, setSelectedSport] = useState('all'); // 'all', 'football', 'basketball'
  const [selectedTab, setSelectedTab] = useState('live'); // 'live' or 'recent'

  /**
   * Fetch live matches
   */
  const fetchLiveMatches = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      } else {
        setIsRefreshing(true);
      }

      // Use environment variable for API URL
      const API_URL = import.meta.env.VITE_CALENDAR_API_URL || 'http://localhost:8083/api/calendar';
      const url = `${API_URL}/fixtures/live`;
      
      console.log('[LiveCalendar] Fetching from:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('[LiveCalendar] Received data:', data);
      
      // Handle both array and object with value property
      const matches = Array.isArray(data) ? data : (data.value || []);
      setLiveMatches(matches);
      setLastUpdated(new Date());
      
      console.log('[LiveCalendar] Live matches:', matches.length);
    } catch (error) {
      console.error('[LiveCalendar] Error fetching live matches:', error);
      // Set empty array on error to show empty state
      setLiveMatches([]);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  /**
   * Fetch recent finished matches
   */
  const fetchRecentMatches = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }

      const API_URL = import.meta.env.VITE_CALENDAR_API_URL || 'http://localhost:8083/api/calendar';
      const url = `${API_URL}/fixtures/recent?days=7`;
      
      console.log('[LiveCalendar] Fetching recent matches from:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('[LiveCalendar] Recent matches:', data);
      
      setRecentMatches(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('[LiveCalendar] Error fetching recent matches:', error);
      setRecentMatches([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Auto-refresh every 15 seconds (only for live tab)
   */
  useEffect(() => {
    if (selectedTab === 'live') {
      fetchLiveMatches();

      const interval = setInterval(() => {
        fetchLiveMatches(false);
      }, 15000); // 15 seconds

      return () => clearInterval(interval);
    } else if (selectedTab === 'recent') {
      fetchRecentMatches();
    }
  }, [selectedTab]);

  /**
   * Manual refresh
   */
  const handleRefresh = () => {
    if (selectedTab === 'live') {
      fetchLiveMatches(false);
    } else {
      fetchRecentMatches(false);
    }
  };

  /**
   * Format last updated time
   */
  const getTimeSince = () => {
    if (!lastUpdated) return '';
    
    const seconds = Math.floor((new Date() - lastUpdated) / 1000);
    
    if (seconds < 5) return 'Just now';
    if (seconds < 60) return `${seconds}s ago`;
    
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ago`;
  };

  /**
   * Loading Skeleton
   */
  const LoadingSkeleton = () => (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 animate-pulse"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32" />
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-16" />
          </div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full mb-2" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20" />
            </div>
            <div className="flex flex-col items-center">
              <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2" />
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full mb-2" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  /**
   * Empty State
   */
  const EmptyState = () => (
    <div className="text-center py-16 px-4">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full 
                      bg-gray-100 dark:bg-gray-800 mb-4">
        <Clock className="w-10 h-10 text-gray-400" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        No Live Matches Right Now
      </h3>
      <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-6">
        Live matches typically happen during evenings and weekends. Check back later or explore upcoming fixtures!
      </p>
      <div className="flex items-center justify-center gap-3 text-sm text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-1">
          <CalendarIcon className="w-4 h-4" />
          <span>Peak hours: 6 PM - 11 PM</span>
        </div>
        <span>•</span>
        <div className="flex items-center gap-1">
          <Activity className="w-4 h-4" />
          <span>Auto-updates every 15s</span>
        </div>
      </div>
    </div>
  );

  // Get matches based on selected tab
  const currentMatches = selectedTab === 'live' ? liveMatches : recentMatches;
  
  // Filter matches by selected sport
  const filteredMatches = selectedSport === 'all' 
    ? currentMatches 
    : currentMatches.filter(match => match.sport === selectedSport);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Main Tabs: Live vs Recent */}
      <div className="mb-6">
        <div className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-xl p-2 shadow-md border-b-2 border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setSelectedTab('live')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
              selectedTab === 'live'
                ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <Activity className="w-5 h-5" />
            <span>Live Now</span>
            {selectedTab === 'live' && liveMatches.length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                {liveMatches.length}
              </span>
            )}
          </button>
          
          <button
            onClick={() => setSelectedTab('recent')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
              selectedTab === 'recent'
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <Clock className="w-5 h-5" />
            <span>Recent (7 days)</span>
            {selectedTab === 'recent' && recentMatches.length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                {recentMatches.length}
              </span>
            )}
          </button>
        </div>
      </div>
      
      {/* Sport Filter Tabs */}
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 bg-white dark:bg-gray-800 rounded-xl p-2 shadow-md">
          <button
            onClick={() => setSelectedSport('all')}
            className={`flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-all duration-200 ${
              selectedSport === 'all'
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg scale-105'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <span className="text-lg">🏆</span>
            <span className="text-sm sm:text-base">All Sports</span>
            {selectedSport === 'all' && (
              <span className="ml-1 sm:ml-2 px-1.5 sm:px-2 py-0.5 bg-white/20 rounded-full text-xs">
                {currentMatches.length}
              </span>
            )}
          </button>
          
          <button
            onClick={() => setSelectedSport('football')}
            className={`flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-all duration-200 ${
              selectedSport === 'football'
                ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg scale-105'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <span className="text-lg">⚽</span>
            <span className="text-sm sm:text-base">Football</span>
            {selectedSport === 'football' && (
              <span className="ml-1 sm:ml-2 px-1.5 sm:px-2 py-0.5 bg-white/20 rounded-full text-xs">
                {currentMatches.filter(m => m.sport === 'football').length}
              </span>
            )}
          </button>
          
          <button
            onClick={() => setSelectedSport('basketball')}
            className={`flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-all duration-200 ${
              selectedSport === 'basketball'
                ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-lg scale-105'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <span className="text-lg">🏀</span>
            <span className="text-sm sm:text-base">Basketball</span>
            {selectedSport === 'basketball' && (
              <span className="ml-1 sm:ml-2 px-1.5 sm:px-2 py-0.5 bg-white/20 rounded-full text-xs">
                {currentMatches.filter(m => m.sport === 'basketball').length}
              </span>
            )}
          </button>
        </div>
      </div>
      
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          
          {/* Title */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              {selectedTab === 'live' ? (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500 rounded-full
                                animate-pulse">
                  <div className="w-2 h-2 bg-white rounded-full" />
                  <span className="text-sm font-bold text-white uppercase tracking-wide">
                    Live Now
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500 rounded-full">
                  <Clock className="w-4 h-4 text-white" />
                  <span className="text-sm font-bold text-white uppercase tracking-wide">
                    Recent Results
                  </span>
                </div>
              )}
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {filteredMatches.length}
              </span>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {selectedTab === 'live' && 'Currently playing'}
              {selectedTab === 'recent' && 'Finished matches from last 7 days'}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            
            {/* Last Updated */}
            {lastUpdated && (
              <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${
                  isRefreshing ? 'bg-blue-500 animate-pulse' : 'bg-green-500'
                }`} />
                <span>{getTimeSince()}</span>
              </div>
            )}

            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600
                         text-white rounded-lg transition-colors duration-200
                         disabled:opacity-50 disabled:cursor-not-allowed
                         shadow-md hover:shadow-lg"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="text-sm font-medium">Refresh</span>
            </button>
          </div>
        </div>

        {/* Auto-refresh Indicator (only for live tab) */}
        {selectedTab === 'live' && (
          <div className="mt-4 flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20
                          rounded-lg border border-blue-200 dark:border-blue-800">
            <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-xs text-blue-700 dark:text-blue-300">
              Real-time scores from Football and Basketball • Auto-updates every 15 seconds
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <LoadingSkeleton />
      ) : filteredMatches.length === 0 ? (
        currentMatches.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="text-center py-16 px-4">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full 
                            bg-gray-100 dark:bg-gray-800 mb-4">
              <span className="text-4xl">
                {selectedSport === 'football' ? '⚽' : '🏀'}
              </span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No Live {selectedSport === 'football' ? 'Football' : 'Basketball'} Matches
            </h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-4">
              There are no live {selectedSport === 'football' ? 'football' : 'basketball'} matches right now.
            </p>
            <button
              onClick={() => setSelectedSport('all')}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg
                         transition-colors duration-200"
            >
              View All Sports
            </button>
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredMatches.map((match) => (
            <LiveMatchCard
              key={match.id}
              fixture={match}
              onClick={() => console.log('Match clicked:', match)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default LiveCalendar;
