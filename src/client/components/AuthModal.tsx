import React, { useState } from 'react';
import { useAuth } from '../../lib/authContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [showReset, setShowReset] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const { signIn, signUp, signInWithGoogle, resetPassword } = useAuth();

  // CSS class constants to avoid duplication
  const INPUT_CLASSES = "w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-100";
  const PRIMARY_BUTTON_CLASSES = "w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:opacity-50 transition-colors";
  const LINK_BUTTON_CLASSES = "text-purple-400 hover:text-purple-300 text-sm transition-colors";
  const LINK_BUTTON_SEMIBOLD_CLASSES = "text-purple-400 hover:text-purple-300 text-sm font-semibold";

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        await signUp(email, password, displayName);
      }
      onClose?.();
      resetForm();
    } catch (error: any) {
      setError(getErrorMessage(error.code));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithGoogle();
      onClose?.();
      resetForm();
    } catch (error: any) {
      setError(getErrorMessage(error.code));
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await resetPassword(resetEmail);
      setMessage('Password reset email sent! Check your inbox.');
      setShowReset(false);
      setResetEmail('');
    } catch (error: any) {
      setError(getErrorMessage(error.code));
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setDisplayName('');
    setResetEmail('');
    setError('');
    setMessage('');
    setShowReset(false);
  };

  const getErrorMessage = (errorCode: string): string => {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'No account found with this email address.';
      case 'auth/wrong-password':
        return 'Incorrect password.';
      case 'auth/email-already-in-use':
        return 'An account already exists with this email address.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/popup-closed-by-user':
        return 'Sign-in was cancelled.';
      default:
        return 'An error occurred. Please try again.';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
      <div 
        className="bg-slate-800 border border-slate-700 rounded-lg p-8 max-w-md w-full mx-4 text-slate-100"
        role="dialog"
        aria-labelledby="auth-modal-title"
        aria-modal="true"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 id="auth-modal-title" className="text-2xl font-bold text-slate-100">
            {showReset ? 'Reset Password' : (isLogin ? 'Sign In' : 'Create Account')}
          </h2>
          {onClose && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 text-3xl"
              aria-label="Close modal"
            >
              &times;
            </button>
          )}
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {message && (
          <div className="bg-green-900/50 border border-green-700 text-green-300 px-4 py-3 rounded mb-4">
            {message}
          </div>
        )}

        {showReset ? (
          <form onSubmit={handlePasswordReset} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                className={INPUT_CLASSES}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className={PRIMARY_BUTTON_CLASSES}
            >
              {loading ? 'Sending...' : 'Send Reset Email'}
            </button>
            <button
              type="button"
              onClick={() => setShowReset(false)}
              className="w-full text-slate-400 hover:text-slate-200 transition-colors"
            >
              Back to Sign In
            </button>
          </form>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className={INPUT_CLASSES}
                    required
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={INPUT_CLASSES}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={INPUT_CLASSES}
                  required
                  minLength={6}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={PRIMARY_BUTTON_CLASSES}
              >
                {loading ? 'Loading...' : (isLogin ? 'Sign In' : 'Create Account')}
              </button>
            </form>

            <div className="mt-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-slate-800 text-slate-400">Or continue with</span>
                </div>
              </div>

              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="mt-3 w-full bg-slate-700 border border-slate-600 text-slate-200 py-2 px-4 rounded-md hover:bg-slate-600 disabled:opacity-50 flex items-center justify-center transition-colors"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Sign in with Google
              </button>
            </div>

            <div className="mt-6 text-center">
              {isLogin ? (
                <>
                  <button
                    onClick={() => setShowReset(true)}
                    className={LINK_BUTTON_CLASSES}
                  >
                    Forgot your password?
                  </button>
                  <div className="mt-2">
                    <span className="text-slate-400 text-sm">Don't have an account? </span>
                    <button
                      onClick={() => setIsLogin(false)}
                      className={LINK_BUTTON_SEMIBOLD_CLASSES}
                    >
                      Sign up
                    </button>
                  </div>
                </>
              ) : (
                <div>
                  <span className="text-slate-400 text-sm">Already have an account? </span>
                  <button
                    onClick={() => setIsLogin(true)}
                    className={LINK_BUTTON_SEMIBOLD_CLASSES}
                  >
                    Sign in
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};