import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import SocialLogins from './SocialLogins';

const PLAYER_API = import.meta.env.VITE_PLAYER_API_URL || 'http://localhost:8084';

const LoginPage = () => {
  const { login } = useAuth();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]       = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const res = await fetch(`${PLAYER_API}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const msg = await res.text().catch(() => 'Login failed');
        throw new Error(msg);
      }
      const authResponse = await res.json();
      login(authResponse);
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-text-primary mb-2">Welcome Back</h2>
      <p className="text-text-secondary mb-6">Sign in to continue your journey.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLoading}
        />
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isLoading}
        />
        <div className="flex items-center justify-between">
          <div />
          <Link
            to="/forgot-password"
            className="text-sm font-medium text-primary hover:underline"
          >
            Forgot Password?
          </Link>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Signing In...' : 'Sign In'}
        </Button>
      </form>

      <SocialLogins />

      <p className="mt-6 text-center text-sm text-text-secondary">
        Don't have an account?{' '}
        <Link to="/register" className="font-medium text-primary hover:underline">
          Sign Up
        </Link>
      </p>
    </div>
  );
};

export default LoginPage;
