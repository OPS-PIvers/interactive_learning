import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../lib/authContext';
import { Z_INDEX_TAILWIND } from '../utils/zIndexLevels';
import { AuthModal } from './AuthModal';
import { SignOutIcon } from './icons/SignOutIcon';
import { SwitchAccountsIcon } from './icons/SwitchAccountsIcon';

interface AuthButtonProps {
  variant?: 'toolbar' | 'compact' | 'full';
  className?: string;
  showUserName?: boolean;
  onSignIn?: () => void;
  onSignOut?: () => void;
  size?: 'small' | 'medium' | 'large';
}

const AuthButton: React.FC<AuthButtonProps> = ({
  variant = 'toolbar',
  className = '',
  showUserName = false,
  onSignIn,
  onSignOut,
  size = 'large'
}) => {
  const { user, logout, loading, switchAccount } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
      setDropdownOpen(false);
    }
  };

  const handleSwitchAccount = () => {
    switchAccount();
    setDropdownOpen(false);
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'compact': return 'px-3 py-1.5 text-xs font-medium';
      case 'full': return 'px-4 py-2 text-sm font-medium';
      case 'toolbar':
      default: return 'px-3 py-2 text-sm font-medium';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'small': return 'w-6 h-6';
      case 'medium': return 'w-7 h-7';
      case 'large':
      default: return 'w-8 h-8';
    }
  };

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
    return (
      <>
        <button
          onClick={handleSignIn}
          className={`${baseButtonStyles} ${getVariantStyles()} ${className} bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white shadow-sm hover:shadow-md`}
          disabled={loading}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
          </svg>
          Sign In
        </button>
        {showAuthModal && <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />}
      </>
    );
  }

  const displayName = user.displayName || user.email || 'User';
  const userInitials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className={`relative flex items-center gap-3 ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setDropdownOpen(prev => !prev)}
        className={`${getSizeClasses()} bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-purple-500`}
        aria-haspopup="true"
        aria-expanded={dropdownOpen}
      >
        {user.photoURL ? (
          <img src={user.photoURL} alt="Profile" className="w-full h-full rounded-full object-cover" />
        ) : (
          userInitials
        )}
      </button>

      {dropdownOpen && (
        <div className={`absolute top-full right-0 mt-2 w-56 bg-slate-700 border border-slate-600 rounded-md shadow-lg ${Z_INDEX_TAILWIND.DROPDOWNS} py-1`}>
          <div className="px-3 py-2 border-b border-slate-600">
            <p className="text-sm font-medium text-slate-200 truncate">{displayName}</p>
            {user.email && <p className="text-xs text-slate-400 truncate">{user.email}</p>}
          </div>
          <div className="py-1">
            <button
              onClick={handleSwitchAccount}
              className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-600 hover:text-white flex items-center gap-3"
            >
              <SwitchAccountsIcon className="w-5 h-5" />
              <span>Switch Account</span>
            </button>
            <button
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-600 hover:text-white flex items-center gap-3"
            >
              {isSigningOut ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span>Signing out...</span>
                </>
              ) : (
                <>
                  <SignOutIcon className="w-5 h-5" />
                  <span>Sign Out</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthButton;