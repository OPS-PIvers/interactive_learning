import React, { useState } from 'react';
import { Z_INDEX_TAILWIND } from '../../utils/zIndexLevels';

interface GradientCreateButtonProps {
  onClick: () => void;
  size?: 'small' | 'medium' | 'large';
  variant?: 'compact' | 'toolbar';
  className?: string;
  disabled?: boolean;
  children?: React.ReactNode;
}

/**
 * GradientCreateButton - Modern animated create button with gradient effects
 * 
 * Replaces the basic plus circle button with an enhanced gradient version
 * featuring smooth animations and mobile-optimized touch interactions.
 */
export const GradientCreateButton: React.FC<GradientCreateButtonProps> = ({
  onClick,
  size = 'medium',
  variant = 'toolbar',
  className = '',
  disabled = false,
  children
}) => {
  const [isPressed, setIsPressed] = useState(false);

  const sizeClasses = {
    small: 'h-8 px-3 text-sm',
    medium: 'h-12 px-4 text-base',
    large: 'h-16 px-6 text-lg'
  };

  const variantClasses = {
    compact: 'p-2',
    toolbar: 'p-3'
  };

  const handleMouseDown = () => setIsPressed(true);
  const handleMouseUp = () => setIsPressed(false);
  const handleMouseLeave = () => setIsPressed(false);

  const handleClick = () => {
    if (!disabled) {
      onClick();
    }
  };

  return (
    <button
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleMouseDown}
      onTouchEnd={handleMouseUp}
      disabled={disabled}
      className={`
        relative overflow-hidden
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        bg-gradient-to-r from-purple-500 to-pink-500
        hover:from-purple-400 hover:to-pink-400
        active:from-purple-600 active:to-pink-600
        disabled:from-slate-500 disabled:to-slate-600
        disabled:cursor-not-allowed
        rounded-full 
        text-white font-semibold
        shadow-lg hover:shadow-xl
        transition-all duration-300 ease-out
        transform hover:scale-105 hover:-translate-y-0.5
        active:scale-95 active:translate-y-0
        focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2
        group
        ${isPressed ? 'scale-95 translate-y-0' : ''}
        ${className}
      `}
      aria-label="Create new project"
      style={{
        background: disabled ? undefined : 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 50%, #f97316 100%)',
        backgroundSize: '200% 200%',
        backgroundPosition: isPressed ? '100% 100%' : '0% 0%',
        transition: 'all 0.3s ease-out, background-position 0.3s ease-out',
        willChange: 'transform, box-shadow, background-position'
      }}
    >
      {/* Gradient overlay for hover effect */}
      <div 
        className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ mixBlendMode: 'overlay' }}
      />
      
      {/* Ripple effect container */}
      <div className="absolute inset-0 overflow-hidden rounded-full">
        <div 
          className={`
            absolute inset-0 bg-white/20 rounded-full
            transform scale-0 group-active:scale-100
            transition-transform duration-200 ease-out
          `}
        />
      </div>

      {/* Content */}
      <div className={`relative ${Z_INDEX_TAILWIND.SLIDE_CONTENT} flex items-center justify-center`}>
        {children || (
          <div className="relative overflow-hidden">
            {/* Animated Create text */}
            <div 
              className={`
                transition-transform duration-300 ease-cubic-bezier(0.19,1,0.22,1)
                ${isPressed ? '-translate-y-7' : 'translate-y-0'}
                flex items-center gap-2
              `}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Create</span>
            </div>
            
            {/* Secondary animation layer */}
            <div 
              className={`
                absolute top-7 left-0 flex items-center justify-center w-full
                transition-transform duration-300 ease-cubic-bezier(0.19,1,0.22,1)
                ${isPressed ? '-translate-y-7' : 'translate-y-0'}
                flex items-center gap-2
              `}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Create</span>
            </div>
          </div>
        )}
      </div>

      {/* Shine effect */}
      <div 
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out"
        style={{ animation: 'none' }}
      />
    </button>
  );
};

export default GradientCreateButton;