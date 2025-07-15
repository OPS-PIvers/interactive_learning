import React, { useState } from 'react';
import { useAuth } from '../../lib/authContext';
import { AuthModal } from './AuthModal';

interface AuthButtonProps {
  variant?: 'toolbar' | 'compact' | 'full';
  className?: string;
  showUserName?: boolean;
  onSignIn?: () => void;
  onSignOut?: () => void;
}

const AuthButton: React.FC<AuthButtonProps> = ({
  variant = 'toolbar',
  className = '',
  showUserName = false,
  onSignIn,
  onSignOut
}) => {
  const { user, logout, loading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignIn = () => {
    if (onSignIn) {
      onSignIn();
    } else {
      setShowAuthModal(true);
    }
  };

  const handleSignOut = async () => {
    if (isSigningOut) return;
    
    setIsSigningOut(true);
    try {
      if (onSignOut) {
        onSignOut();
      } else {
        await logout();
      }
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setIsSigningOut(false);
    }
  };

  // Base styles for different variants
  const getVariantStyles = () => {
    switch (variant) {
      case 'compact':
        return 'px-3 py-1.5 text-xs font-medium';
      case 'full':
        return 'px-4 py-2 text-sm font-medium';
      case 'toolbar':
      default:
        return 'px-3 py-2 text-sm font-medium';
    }
  };

  // Common button styles
  const baseButtonStyles = `
    inline-flex items-center gap-2 rounded-md transition-all duration-200 
    focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 
    focus:ring-offset-slate-800 disabled:opacity-50 disabled:cursor-not-allowed
  `;

  if (loading) {
    return (
      <div className={`${getVariantStyles()} ${className}`}>
        <div className="flex items-center gap-2 text-slate-400">
          <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    // Sign In Button
    return (
      <>
        <button
          onClick={handleSignIn}
          className={`
            ${baseButtonStyles} ${getVariantStyles()} ${className}
            bg-purple-600 hover:bg-purple-700 active:bg-purple-800 
            text-white shadow-sm hover:shadow-md
          `}
          disabled={loading}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
          </svg>
          Sign In
        </button>
        
        {showAuthModal && (
          <AuthModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
          />
        )}
      </>
    );
  }

  // User is signed in - show user info and sign out
  const displayName = user.displayName || user.email || 'User';
  const userInitials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {showUserName && (
        <div className="flex items-center gap-2 text-slate-300">
          {/* User Avatar */}
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
            {user.photoURL ? (
              <img 
                src={user.photoURL} 
                alt="Profile" 
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              userInitials
            )}
          </div>
          <span className="text-sm font-medium truncate max-w-32">
            {displayName}
          </span>
        </div>
      )}
      
      {/* Sign Out Button */}
      <button
        onClick={handleSignOut}
        disabled={isSigningOut}
        className={`
          ${baseButtonStyles} ${getVariantStyles()}
          text-slate-300 hover:text-white hover:bg-slate-700 
          active:bg-slate-600 border border-slate-600 hover:border-slate-500
        `}
        title={`Sign out ${displayName}`}
      >
        {isSigningOut ? (
          <>
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            Signing out...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </>
        )}
      </button>
    </div>
  );
};

export default AuthButton;