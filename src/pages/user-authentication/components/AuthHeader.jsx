import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const AuthHeader = ({ showBackButton = true }) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/home-dashboard');
    }
  };

  return (
    <header className="flex items-center justify-between p-4 lg:p-6">
      {/* Logo */}
      <Link to="/home-dashboard" className="flex items-center space-x-2">
        <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-lg">
          <Icon name="Trophy" size={20} color="white" />
        </div>
        <span className="text-xl font-bold text-primary hidden sm:block">
          TopPlayersofAllSports
        </span>
        <span className="text-xl font-bold text-primary sm:hidden">
          TPAS
        </span>
      </Link>

      {/* Back Button */}
      {showBackButton && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBack}
          className="hover:bg-muted"
        >
          <Icon name="X" size={20} />
        </Button>
      )}
    </header>
  );
};

export default AuthHeader;