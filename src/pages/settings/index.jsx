import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import userProfileService from '../../services/userProfileService';

const SettingsPage = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('account');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Account Settings
  const [accountSettings, setAccountSettings] = useState({
    loginAlerts: true,
    profileVisibility: 'public'
  });

  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    newsUpdates: true,
    playerUpdates: true,
    teamUpdates: true,
    breakingNews: true,
    weeklyDigest: true,
    marketingEmails: false
  });

  // Privacy Settings
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'public',
    showEmail: false,
    showPhone: false,
    allowMessaging: true,
    dataSharing: false,
    analytics: true
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/user-authentication');
      return;
    }

    loadSettings();
  }, [isAuthenticated, navigate]);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      
      // Load settings from backend
      const [accountData, notificationData, privacyData] = await Promise.all([
        userProfileService.getAccountSettings().catch(() => ({})),
        userProfileService.getNotificationSettings().catch(() => ({})),
        userProfileService.getPrivacySettings().catch(() => ({}))
      ]);

      setAccountSettings(prev => ({ ...prev, ...accountData }));
      setNotificationSettings(prev => ({ ...prev, ...notificationData }));
      setPrivacySettings(prev => ({ ...prev, ...privacyData }));
    } catch (error) {
      console.error('Failed to load settings:', error);
      setMessage({ type: 'error', text: 'Failed to load settings' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettingsSave = async (settingsType, settings) => {
    try {
      setIsSaving(true);
      
      switch (settingsType) {
        case 'account':
          await userProfileService.updateAccountSettings(settings);
          setAccountSettings(settings);
          break;
        case 'notifications':
          await userProfileService.updateNotificationSettings(settings);
          setNotificationSettings(settings);
          break;
        case 'privacy':
          await userProfileService.updatePrivacySettings(settings);
          setPrivacySettings(settings);
          break;
      }
      
      setMessage({ type: 'success', text: 'Settings saved successfully' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAccountDeactivation = async () => {
    if (window.confirm('Are you sure you want to deactivate your account? This action cannot be undone.')) {
      try {
        await userProfileService.deactivateAccount();
        await logout();
        navigate('/');
      } catch (error) {
        setMessage({ type: 'error', text: 'Failed to deactivate account' });
      }
    }
  };

  const tabs = [
    { id: 'account', label: 'Account', icon: 'User' },
    { id: 'notifications', label: 'Notifications', icon: 'Bell' },
    { id: 'privacy', label: 'Privacy', icon: 'Shield' },
    { id: 'security', label: 'Security', icon: 'Lock' },
    { id: 'danger', label: 'Danger Zone', icon: 'AlertTriangle' }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Button
              variant="outline"
              onClick={() => navigate('/profile')}
              className="flex items-center space-x-2"
            >
              <Icon name="ArrowLeft" size={16} />
              <span>Back to Profile</span>
            </Button>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Manage your account preferences and security settings</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-64">
            <nav className="bg-white rounded-lg shadow-sm p-4">
              <ul className="space-y-2">
                {tabs.map((tab) => (
                  <li key={tab.id}>
                    <button
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        activeTab === tab.id
                          ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <Icon name={tab.icon} size={18} />
                      <span>{tab.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6">
                {/* Message */}
                {message.text && (
                  <div className={`mb-6 p-4 rounded-md ${
                    message.type === 'success' 
                      ? 'bg-green-50 text-green-800 border border-green-200' 
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}>
                    <div className="flex items-center">
                      <Icon 
                        name={message.type === 'success' ? 'CheckCircle' : 'AlertCircle'} 
                        size={16} 
                        className="mr-2" 
                      />
                      <span>{message.text}</span>
                    </div>
                  </div>
                )}

                {/* Account Tab */}
                {activeTab === 'account' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Account Settings</h3>
                      
                      <div className="space-y-4">
                        <div className="flex items-center justify-between py-3 border-b border-gray-200">
                          <div>
                            <p className="font-medium text-gray-900">Profile Visibility</p>
                            <p className="text-sm text-gray-600">Control who can see your profile</p>
                          </div>
                          <select
                            value={accountSettings.profileVisibility}
                            onChange={(e) => setAccountSettings(prev => ({ ...prev, profileVisibility: e.target.value }))}
                            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                          >
                            <option value="public">Public</option>
                            <option value="private">Private</option>
                            <option value="friends">Friends Only</option>
                          </select>
                        </div>

                        <div className="flex items-center justify-between py-3 border-b border-gray-200">
                          <div>
                            <p className="font-medium text-gray-900">Login Alerts</p>
                            <p className="text-sm text-gray-600">Get notified of new logins</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={accountSettings.loginAlerts}
                              onChange={(e) => setAccountSettings(prev => ({ ...prev, loginAlerts: e.target.checked }))}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                      </div>

                      <div className="mt-6">
                        <Button
                          onClick={() => handleSettingsSave('account', accountSettings)}
                          disabled={isSaving}
                          className="flex items-center space-x-2"
                        >
                          <Icon name="Save" size={16} />
                          <span>Save Account Settings</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Notifications Tab */}
                {activeTab === 'notifications' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Preferences</h3>
                      
                      <div className="space-y-4">
                        {Object.entries({
                          emailNotifications: 'Email Notifications',
                          pushNotifications: 'Push Notifications',
                          newsUpdates: 'Sports News Updates',
                          playerUpdates: 'Player Updates',
                          teamUpdates: 'Team Updates',
                          breakingNews: 'Breaking News',
                          weeklyDigest: 'Weekly Digest',
                          marketingEmails: 'Marketing Emails'
                        }).map(([key, label]) => (
                          <div key={key} className="flex items-center justify-between py-3 border-b border-gray-200">
                            <div>
                              <p className="font-medium text-gray-900">{label}</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={notificationSettings[key]}
                                onChange={(e) => setNotificationSettings(prev => ({ ...prev, [key]: e.target.checked }))}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                          </div>
                        ))}
                      </div>

                      <div className="mt-6">
                        <Button
                          onClick={() => handleSettingsSave('notifications', notificationSettings)}
                          disabled={isSaving}
                          className="flex items-center space-x-2"
                        >
                          <Icon name="Save" size={16} />
                          <span>Save Notification Settings</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Privacy Tab */}
                {activeTab === 'privacy' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Privacy Settings</h3>
                      
                      <div className="space-y-4">
                        {Object.entries({
                          showEmail: 'Show Email Address',
                          showPhone: 'Show Phone Number',
                          allowMessaging: 'Allow Direct Messages',
                          dataSharing: 'Share Data for Analytics',
                          analytics: 'Usage Analytics'
                        }).map(([key, label]) => (
                          <div key={key} className="flex items-center justify-between py-3 border-b border-gray-200">
                            <div>
                              <p className="font-medium text-gray-900">{label}</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={privacySettings[key]}
                                onChange={(e) => setPrivacySettings(prev => ({ ...prev, [key]: e.target.checked }))}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                          </div>
                        ))}
                      </div>

                      <div className="mt-6">
                        <Button
                          onClick={() => handleSettingsSave('privacy', privacySettings)}
                          disabled={isSaving}
                          className="flex items-center space-x-2"
                        >
                          <Icon name="Save" size={16} />
                          <span>Save Privacy Settings</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Security Tab */}
                {activeTab === 'security' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Security Settings</h3>

                    <div className="flex items-start space-x-4 p-4 border border-gray-200 rounded-lg">
                      <div className="flex-shrink-0 w-10 h-10 bg-red-50 rounded-full flex items-center justify-center">
                        <Icon name="Chrome" size={20} className="text-red-500" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Connected via Google</p>
                        <p className="text-sm text-gray-600 mt-1">
                          Your account is secured by Google Sign-In. Manage your Google account
                          security at{' '}
                          <a
                            href="https://myaccount.google.com/security"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            myaccount.google.com
                          </a>
                          .
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">Two-Factor Authentication</h4>
                          <p className="text-sm text-gray-600">
                            2FA is managed through your Google account.
                          </p>
                        </div>
                        <a
                          href="https://myaccount.google.com/two-step-verification"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button variant="outline" type="button">Manage via Google</Button>
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {/* Danger Zone Tab */}
                {activeTab === 'danger' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-red-600 mb-4">Danger Zone</h3>
                      
                      <div className="border border-red-200 rounded-lg p-6 bg-red-50">
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium text-red-900">Deactivate Account</h4>
                            <p className="text-sm text-red-700 mt-1">
                              Once you deactivate your account, there is no going back. Please be certain.
                            </p>
                          </div>
                          
                          <Button
                            variant="danger"
                            onClick={handleAccountDeactivation}
                            className="flex items-center space-x-2"
                          >
                            <Icon name="AlertTriangle" size={16} />
                            <span>Deactivate Account</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
