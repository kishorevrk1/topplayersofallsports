import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Icon from './AppIcon';
import Button from './ui/Button';

const UserProfile = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Don't render if user is not authenticated
  if (!isAuthenticated || !user) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => navigate('/user-authentication')}
        className="flex items-center space-x-2"
      >
        <Icon name="User" size={16} />
        <span className="hidden sm:inline">Sign In</span>
      </Button>
    );
  }

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/home-dashboard');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const menuItems = [
    {
      id: 'profile',
      label: 'View Profile',
      icon: 'User',
      action: () => navigate('/profile')
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: 'Settings',
      action: () => setIsSettingsOpen(true)
    },
    {
      id: 'favorites',
      label: 'My Favorites',
      icon: 'Heart',
      action: () => navigate('/favorites')
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: 'Bell',
      action: () => navigate('/notifications')
    },
    {
      id: 'help',
      label: 'Help & Support',
      icon: 'HelpCircle',
      action: () => navigate('/help')
    },
    {
      id: 'divider',
      type: 'divider'
    },
    {
      id: 'logout',
      label: 'Sign Out',
      icon: 'LogOut',
      action: handleLogout,
      className: 'text-red-600 hover:text-red-700 hover:bg-red-50'
    }
  ];

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        {/* Profile Button */}
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-label="User menu"
          aria-expanded={isDropdownOpen}
          aria-haspopup="true"
        >
          {/* Avatar */}
          <div className="relative">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.fullName}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-gray-200"
              />
            ) : (
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium ring-2 ring-gray-200">
                {getInitials(user.firstName, user.lastName)}
              </div>
            )}
            
            {/* Online Status Indicator */}
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
          </div>

          {/* User Info (Hidden on mobile) */}
          <div className="hidden md:block text-left">
            <p className="text-sm font-medium text-gray-900 truncate max-w-32">
              {user.fullName}
            </p>
            <p className="text-xs text-gray-500 truncate max-w-32">
              {user.email}
            </p>
          </div>

          {/* Dropdown Arrow */}
          <Icon 
            name="ChevronDown" 
            size={16} 
            className={`text-gray-400 transition-transform duration-200 ${
              isDropdownOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {/* Dropdown Menu */}
        {isDropdownOpen && (
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 z-50 py-1">
            {/* User Info Header */}
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.fullName}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                    {getInitials(user.firstName, user.lastName)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.fullName}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user.email}
                  </p>
                  {user.role && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                      {user.role}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-1">
              {menuItems.map((item) => {
                if (item.type === 'divider') {
                  return <div key={item.id} className="border-t border-gray-100 my-1" />;
                }

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      item.action();
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full flex items-center px-4 py-2 text-sm transition-colors duration-150 ${
                      item.className || 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon name={item.icon} size={16} className="mr-3" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}
    </>
  );
};

// Settings Modal Component
const SettingsModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('account');
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
    country: user?.country || '',
    dateOfBirth: user?.dateOfBirth || '',
    favoriteSports: user?.favoriteSports || [],
    favoriteTeams: user?.favoriteTeams || [],
    notifications: {
      email: true,
      push: true,
      sms: false,
      marketing: false
    },
    privacy: {
      profileVisibility: 'public',
      showEmail: false,
      showPhone: false
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const tabs = [
    { id: 'account', label: 'Account', icon: 'User' },
    { id: 'preferences', label: 'Preferences', icon: 'Settings' },
    { id: 'notifications', label: 'Notifications', icon: 'Bell' },
    { id: 'privacy', label: 'Privacy', icon: 'Shield' },
    { id: 'security', label: 'Security', icon: 'Lock' }
  ];

  const sports = ['Football', 'Basketball', 'Baseball', 'Soccer', 'Tennis', 'Golf', 'Hockey', 'Cricket'];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    setErrors({});

    try {
      // Profile updates are handled via userProfileService directly
      // Navigate to /profile/edit for full profile editing
      onClose();
    } catch (error) {
      setErrors({ general: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background Overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="inline-block w-full max-w-4xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Settings</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Icon name="X" size={24} />
            </button>
          </div>

          <div className="flex mt-6">
            {/* Sidebar */}
            <div className="w-1/4 pr-6 border-r border-gray-200">
              <nav className="space-y-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon name={tab.icon} size={16} className="mr-3" />
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Content */}
            <div className="flex-1 pl-6">
              {/* Account Tab */}
              {activeTab === 'account' && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-base font-medium text-gray-900 mb-4">Account Information</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          First Name
                        </label>
                        <input
                          type="text"
                          value={formData.firstName}
                          onChange={(e) => handleInputChange('firstName', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Last Name
                        </label>
                        <input
                          type="text"
                          value={formData.lastName}
                          onChange={(e) => handleInputChange('lastName', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Phone
                        </label>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Country
                        </label>
                        <input
                          type="text"
                          value={formData.country}
                          onChange={(e) => handleInputChange('country', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Bio
                        </label>
                        <textarea
                          value={formData.bio}
                          onChange={(e) => handleInputChange('bio', e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Tell us about yourself..."
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Preferences Tab */}
              {activeTab === 'preferences' && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-base font-medium text-gray-900 mb-4">Sports Preferences</h4>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Favorite Sports
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {sports.map((sport) => (
                          <label key={sport} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={formData.favoriteSports.includes(sport)}
                              onChange={(e) => {
                                const newSports = e.target.checked
                                  ? [...formData.favoriteSports, sport]
                                  : formData.favoriteSports.filter(s => s !== sport);
                                handleInputChange('favoriteSports', newSports);
                              }}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm text-gray-700">{sport}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Display */}
              {errors.general && (
                <div className="mt-4 p-3 rounded-md bg-red-50 border border-red-200">
                  <p className="text-sm text-red-600">{errors.general}</p>
                </div>
              )}

              {/* Footer */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 mt-8">
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  isLoading={isLoading}
                  disabled={isLoading}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
