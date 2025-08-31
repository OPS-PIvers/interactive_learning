import React, { useState } from 'react';
import { Icon } from '../Icon';

interface AuthenticationPageProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onSignup: (email: string, password: string, displayName: string) => Promise<void>;
  onGoogleSignIn: () => Promise<void>;
  onDevBypass: () => void;
  loading: boolean;
  error: string | null;
}

const AuthenticationPage: React.FC<AuthenticationPageProps> = ({
  onLogin,
  onSignup,
  onGoogleSignIn,
  onDevBypass,
  loading,
  error
}) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: '',
    confirmPassword: ''
  });
  const [showDevBypass, setShowDevBypass] = useState(false);

  console.log('=== AUTHENTICATION PAGE RENDERING ===');
  console.log('AuthPage: Mode:', mode, 'Loading:', loading, 'Error:', error);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    try {
      if (mode === 'login') {
        await onLogin(formData.email, formData.password);
      } else {
        if (formData.password !== formData.confirmPassword) {
          throw new Error('Passwords do not match');
        }
        await onSignup(formData.email, formData.password, formData.displayName);
      }
    } catch (err) {
      console.error('Auth form submission error:', err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const isDevMode = import.meta.env.DEV;

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#0f172a',
      color: '#f1f5f9',
      fontFamily: 'Inter, sans-serif',
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        backgroundColor: '#1e293b',
        padding: '2rem',
        borderRadius: '12px',
        border: '1px solid #334155',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ 
            color: '#f1f5f9', 
            margin: '0 0 0.5rem 0', 
            fontSize: '28px',
            fontWeight: '700'
          }}>
            Interactive Learning
          </h1>
          <p style={{ 
            color: '#94a3b8', 
            margin: 0,
            fontSize: '16px'
          }}>
            {mode === 'login' ? 'Sign in to your account' : 'Create a new account'}
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div style={{
            backgroundColor: '#dc2626',
            color: '#fef2f2',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '1rem',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit}>
          {/* Display Name for Signup */}
          {mode === 'signup' && (
            <div style={{ marginBottom: '1rem' }}>
              <label style={{
                display: 'block',
                color: '#f1f5f9',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '6px'
              }}>
                Display Name
              </label>
              <input
                type="text"
                name="displayName"
                value={formData.displayName}
                onChange={handleInputChange}
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  backgroundColor: '#374151',
                  border: '1px solid #4b5563',
                  borderRadius: '8px',
                  color: '#f1f5f9',
                  fontSize: '16px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                placeholder="Enter your full name"
              />
            </div>
          )}

          {/* Email */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              color: '#f1f5f9',
              fontSize: '14px',
              fontWeight: '500',
              marginBottom: '6px'
            }}>
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: '#374151',
                border: '1px solid #4b5563',
                borderRadius: '8px',
                color: '#f1f5f9',
                fontSize: '16px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              placeholder="Enter your email"
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              color: '#f1f5f9',
              fontSize: '14px',
              fontWeight: '500',
              marginBottom: '6px'
            }}>
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: '#374151',
                border: '1px solid #4b5563',
                borderRadius: '8px',
                color: '#f1f5f9',
                fontSize: '16px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              placeholder="Enter your password"
              minLength={6}
            />
          </div>

          {/* Confirm Password for Signup */}
          {mode === 'signup' && (
            <div style={{ marginBottom: '1rem' }}>
              <label style={{
                display: 'block',
                color: '#f1f5f9',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '6px'
              }}>
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  backgroundColor: '#374151',
                  border: '1px solid #4b5563',
                  borderRadius: '8px',
                  color: '#f1f5f9',
                  fontSize: '16px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                placeholder="Confirm your password"
                minLength={6}
              />
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px 16px',
              backgroundColor: loading ? '#6b7280' : '#3b82f6',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            {loading && <Icon name="LoadingSpinner" className="w-4 h-4 animate-spin" />}
            {loading 
              ? (mode === 'login' ? 'Signing In...' : 'Creating Account...') 
              : (mode === 'login' ? 'Sign In' : 'Create Account')
            }
          </button>
        </form>

        {/* Google Sign In */}
        <button
          onClick={onGoogleSignIn}
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px 16px',
            backgroundColor: '#ffffff',
            color: '#374151',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '500',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        {/* Mode Toggle */}
        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <span style={{ color: '#94a3b8', fontSize: '14px' }}>
            {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
          </span>
          <button
            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
            style={{
              background: 'none',
              border: 'none',
              color: '#3b82f6',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </div>

        {/* Development Bypass */}
        {isDevMode && (
          <div style={{ 
            borderTop: '1px solid #334155', 
            paddingTop: '1rem',
            textAlign: 'center' 
          }}>
            <button
              onClick={() => setShowDevBypass(!showDevBypass)}
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                fontSize: '12px',
                cursor: 'pointer',
                marginBottom: '8px'
              }}
            >
              {showDevBypass ? '▼' : '▶'} Developer Options
            </button>
            
            {showDevBypass && (
              <div>
                <button
                  onClick={onDevBypass}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    backgroundColor: '#374151',
                    color: '#f1f5f9',
                    border: '1px solid #4b5563',
                    borderRadius: '6px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    marginBottom: '8px'
                  }}
                >
                  🔧 Skip Auth (Dev Mode)
                </button>
                <p style={{ 
                  color: '#6b7280', 
                  fontSize: '11px', 
                  margin: 0,
                  fontStyle: 'italic' 
                }}>
                  Development bypass - for testing only
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthenticationPage;