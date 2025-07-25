import React from 'react';
import Button from '../../../components/ui/Button';

const AuthTabs = ({ activeTab, onTabChange, isLoading }) => {
  const tabs = [
    { id: 'login', label: 'Sign In' },
    { id: 'register', label: 'Sign Up' }
  ];

  return (
    <div className="flex bg-muted rounded-lg p-1 mb-8">
      {tabs.map((tab) => (
        <Button
          key={tab.id}
          variant={activeTab === tab.id ? "default" : "ghost"}
          onClick={() => onTabChange(tab.id)}
          disabled={isLoading}
          className="flex-1 h-10"
        >
          {tab.label}
        </Button>
      ))}
    </div>
  );
};

export default AuthTabs;