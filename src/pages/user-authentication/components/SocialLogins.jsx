import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

function handleGoogleSignIn() {
  const clientId    = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const redirectUri = `${window.location.origin}/oauth/callback`;

  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'email profile');
  url.searchParams.set('access_type', 'offline');
  url.searchParams.set('prompt', 'select_account');

  window.location.href = url.toString();
}

const SocialLogins = () => {
  return (
    <>
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-background text-text-secondary">Or continue with</span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={handleGoogleSignIn}
        className="w-full flex items-center justify-center space-x-2 h-12"
      >
        <Icon name="Chrome" size={20} />
        <span>Continue with Google</span>
      </Button>
    </>
  );
};

export default SocialLogins;
