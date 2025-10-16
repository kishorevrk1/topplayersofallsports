import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import userProfileService from '../../services/userProfileService';

const ProfilePage = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [favorites, setFavorites] = useState({
    players: [],
    teams: []
  });
  const [activity, setActivity] = useState([]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/user-authentication');
      return;
    }

    loadProfileData();
  }, [isAuthenticated, navigate]);

  const loadProfileData = async () => {
    try {
      setIsLoading(true);
      
      // Load profile data
      const [favPlayers, favTeams, activityHistory] = await Promise.all([
        userProfileService.getFavoritePlayers().catch(() => []),
        userProfileService.getFavoriteTeams().catch(() => []),
        userProfileService.getActivityHistory(1, 10).catch(() => ({ data: [] }))
      ]);

      setFavorites({
        players: favPlayers,
        teams: favTeams
      });
      setActivity(activityHistory.data || []);
      setProfileData(user);
    } catch (error) {
      console.error('Failed to load profile data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'User' },
    { id: 'favorites', label: 'Favorites', icon: 'Heart' },
    { id: 'activity', label: 'Activity', icon: 'Activity' },
    { id: 'stats', label: 'Statistics', icon: 'BarChart' }
  ];

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-8">
          <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600"></div>
          <div className="px-6 py-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-6">
                {/* Avatar */}
                <div className="relative -mt-16">
                  {user?.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.fullName}
                      className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold border-4 border-white shadow-lg">
                      {getInitials(user?.firstName, user?.lastName)}
                    </div>
                  )}
                  
                  {/* Online Status */}
                  <div className="absolute bottom-1 right-1 w-6 h-6 bg-green-400 border-2 border-white rounded-full"></div>
                </div>

                {/* User Info */}
                <div className="pt-2">
                  <h1 className="text-2xl font-bold text-gray-900">{user?.fullName}</h1>
                  <p className="text-gray-600">{user?.email}</p>
                  {user?.bio && (
                    <p className="text-gray-700 mt-2 max-w-lg">{user.bio}</p>
                  )}
                  
                  <div className="flex items-center space-x-4 mt-3">
                    {user?.country && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Icon name="MapPin" size={16} className="mr-1" />
                        {user.country}
                      </div>
                    )}
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <Icon name="Calendar" size={16} className="mr-1" />
                      Joined {new Date(user?.createdAt).toLocaleDateString('en-US', { 
                        month: 'long', 
                        year: 'numeric' 
                      })}
                    </div>
                    
                    {user?.role && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {user.role}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => navigate('/settings')}
                  className="flex items-center space-x-2"
                >
                  <Icon name="Settings" size={16} />
                  <span>Settings</span>
                </Button>
                
                <Button
                  onClick={() => navigate('/profile/edit')}
                  className="flex items-center space-x-2"
                >
                  <Icon name="Edit" size={16} />
                  <span>Edit Profile</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Content Tabs */}
        <div className="bg-white rounded-lg shadow-sm">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon name={tab.icon} size={16} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Stats Cards */}
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100">Favorite Players</p>
                        <p className="text-2xl font-bold">{favorites.players.length}</p>
                      </div>
                      <Icon name="Users" size={32} className="text-blue-200" />
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-100">Favorite Teams</p>
                        <p className="text-2xl font-bold">{favorites.teams.length}</p>
                      </div>
                      <Icon name="Shield" size={32} className="text-green-200" />
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-100">Profile Views</p>
                        <p className="text-2xl font-bold">0</p>
                      </div>
                      <Icon name="Eye" size={32} className="text-purple-200" />
                    </div>
                  </div>
                </div>

                {/* Recent Activity Preview */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
                  {activity.length > 0 ? (
                    <div className="space-y-3">
                      {activity.slice(0, 5).map((item, index) => (
                        <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                          <Icon name="Activity" size={16} className="text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-900">{item.description}</p>
                            <p className="text-xs text-gray-500">{item.timestamp}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Icon name="Activity" size={48} className="mx-auto mb-4 text-gray-300" />
                      <p>No recent activity</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Favorites Tab */}
            {activeTab === 'favorites' && (
              <div className="space-y-8">
                {/* Favorite Players */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Favorite Players</h3>
                  {favorites.players.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {favorites.players.map((player) => (
                        <div key={player.id} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                              <Icon name="User" size={24} className="text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{player.name}</p>
                              <p className="text-sm text-gray-600">{player.team} • {player.sport}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Icon name="Users" size={48} className="mx-auto mb-4 text-gray-300" />
                      <p>No favorite players yet</p>
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => navigate('/players')}
                      >
                        Browse Players
                      </Button>
                    </div>
                  )}
                </div>

                {/* Favorite Teams */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Favorite Teams</h3>
                  {favorites.teams.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {favorites.teams.map((team) => (
                        <div key={team.id} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                              <Icon name="Shield" size={24} className="text-green-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{team.name}</p>
                              <p className="text-sm text-gray-600">{team.league} • {team.sport}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Icon name="Shield" size={48} className="mx-auto mb-4 text-gray-300" />
                      <p>No favorite teams yet</p>
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => navigate('/teams')}
                      >
                        Browse Teams
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Activity Tab */}
            {activeTab === 'activity' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Activity History</h3>
                {activity.length > 0 ? (
                  <div className="space-y-4">
                    {activity.map((item, index) => (
                      <div key={index} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <Icon name="Activity" size={16} className="text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-900">{item.description}</p>
                          <p className="text-sm text-gray-500 mt-1">{item.timestamp}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Icon name="Activity" size={48} className="mx-auto mb-4 text-gray-300" />
                    <p>No activity history available</p>
                  </div>
                )}
              </div>
            )}

            {/* Statistics Tab */}
            {activeTab === 'stats' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Statistics</h3>
                <div className="text-center py-12 text-gray-500">
                  <Icon name="BarChart" size={48} className="mx-auto mb-4 text-gray-300" />
                  <p>Statistics feature coming soon</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
