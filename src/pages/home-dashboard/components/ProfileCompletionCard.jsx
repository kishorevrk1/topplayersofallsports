import React from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const ProfileCompletionCard = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated || !user) {
    return null;
  }

  // Calculate profile completion percentage
  const calculateCompletion = () => {
    const fields = [
      user.firstName,
      user.lastName,
      user.email,
      user.bio,
      user.avatarUrl,
      user.country,
      user.phone,
    ];
    
    const completedFields = fields.filter(field => field && field.trim() !== '').length;
    return Math.round((completedFields / fields.length) * 100);
  };

  const completionPercentage = calculateCompletion();

  // If profile is mostly complete, don't show the card
  if (completionPercentage >= 85) {
    return null;
  }

  const getMissingFields = () => {
    const missing = [];
    if (!user.bio || user.bio.trim() === '') missing.push('Bio');
    if (!user.avatarUrl) missing.push('Profile Picture');
    if (!user.country) missing.push('Country');
    if (!user.phone) missing.push('Phone Number');
    
    return missing;
  };

  const missingFields = getMissingFields();

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-3">
            <Icon name="User" size={20} className="text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Complete Your Profile</h3>
          </div>
          
          <p className="text-gray-600 mb-4">
            Your profile is {completionPercentage}% complete. Add more information to get better recommendations and connect with other sports fans.
          </p>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Profile Completion</span>
              <span>{completionPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
          </div>

          {/* Missing Fields */}
          {missingFields.length > 0 && (
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Missing information:</p>
              <div className="flex flex-wrap gap-2">
                {missingFields.map((field, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {field}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-3">
            <Button
              onClick={() => navigate('/profile/edit')}
              className="flex items-center space-x-2"
              size="sm"
            >
              <Icon name="Edit" size={16} />
              <span>Complete Profile</span>
            </Button>
            
            <Button
              variant="outline"
              onClick={() => navigate('/profile')}
              size="sm"
              className="flex items-center space-x-2"
            >
              <Icon name="Eye" size={16} />
              <span>View Profile</span>
            </Button>
          </div>
        </div>

        {/* Profile Avatar */}
        <div className="ml-6">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.fullName}
              className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md"
            />
          ) : (
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-lg font-bold border-2 border-white shadow-md">
              {`${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileCompletionCard;
