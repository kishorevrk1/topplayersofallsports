import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AppIcon from '../../../components/AppIcon';
import AppImage from '../../../components/AppImage';

const AuthHeader = ({ showBackButton = false }) => {
  const navigate = useNavigate();

  return (
    <header className="flex items-center justify-between">
      <Link to="/" className="flex items-center gap-2">
        <AppImage src="/logo.png" alt="Logo" className="h-8 w-auto" />
        <span className="text-lg font-bold text-text-primary">TopPlayers</span>
      </Link>
      {showBackButton && (
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-text-secondary hover:text-text-primary flex items-center gap-1"
        >
          <AppIcon name="ArrowLeft" size={16} />
          Back
        </button>
      )}
    </header>
  );
};

export default AuthHeader;