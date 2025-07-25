import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const SocialShare = ({ player, content = 'profile' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = `${window.location.origin}/player-profile?id=${player.id}`;
  const shareText = `Check out ${player.name}'s profile on TopPlayersofAllSports! ${player.team.name} #${player.jerseyNumber}`;

  const socialPlatforms = [
    {
      name: 'Twitter',
      icon: 'Twitter',
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
      color: 'bg-blue-500 hover:bg-blue-600',
    },
    {
      name: 'Facebook',
      icon: 'Facebook',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      color: 'bg-blue-600 hover:bg-blue-700',
    },
    {
      name: 'LinkedIn',
      icon: 'Linkedin',
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
      color: 'bg-blue-700 hover:bg-blue-800',
    },
    {
      name: 'WhatsApp',
      icon: 'MessageCircle',
      url: `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`,
      color: 'bg-green-500 hover:bg-green-600',
    },
  ];

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShare = (platform) => {
    window.open(platform.url, '_blank', 'width=600,height=400');
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        iconName="Share2"
        iconPosition="left"
      >
        Share
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-100"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Share Menu */}
          <div className="absolute top-full right-0 mt-2 w-64 bg-popover border border-border rounded-lg shadow-lg z-200 p-4">
            <div className="mb-4">
              <h3 className="font-semibold text-text-primary mb-2">Share {player.name}'s Profile</h3>
              <p className="text-sm text-text-secondary">
                Share this player profile with your friends and followers
              </p>
            </div>

            {/* Social Platforms */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {socialPlatforms.map((platform) => (
                <button
                  key={platform.name}
                  onClick={() => handleShare(platform)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-white text-sm font-medium transition-colors duration-150 ${platform.color}`}
                >
                  <Icon name={platform.icon} size={16} />
                  <span>{platform.name}</span>
                </button>
              ))}
            </div>

            {/* Copy Link */}
            <div className="border-t border-border pt-4">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 bg-muted border border-border rounded px-3 py-2 text-sm text-text-secondary"
                />
                <Button
                  variant={copied ? "success" : "outline"}
                  size="sm"
                  onClick={copyToClipboard}
                  iconName={copied ? "Check" : "Copy"}
                >
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SocialShare;