import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useDeviceDetection } from '../../hooks/useDeviceDetection';

interface TextTipInteractionProps {
  text: string;
  position: { x: number; y: number };
  isVisible: boolean;
  onClose?: () => void;
  variant?: 'tooltip' | 'overlay';
  autoHideDelay?: number;
  maxWidth?: number;
  theme?: 'dark' | 'light';
}

/**
 * TextTipInteraction - Animated text tip overlay system
 * 
 * Provides elegant text tip overlays with liquid animations and smart positioning.
 * Optimized for both mobile and desktop interactions.
 */
export const TextTipInteraction: React.FC<TextTipInteractionProps> = ({
  text,
  position,
  isVisible,
  onClose,
  variant = 'tooltip',
  autoHideDelay = 3000,
  maxWidth = 300,
  theme = 'dark'
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [actualPosition, setActualPosition] = useState(position);
  const tipRef = useRef<HTMLDivElement>(null);
  const { isMobile } = useDeviceDetection();

  // Calculate smart positioning to avoid viewport edges
  const calculatePosition = useCallback(() => {
    if (!tipRef.current) return position;

    const tipRect = tipRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let newX = position.x;
    let newY = position.y;

    // Adjust horizontal position
    if (position.x + maxWidth > viewportWidth - 20) {
      newX = viewportWidth - maxWidth - 20;
    }
    if (newX < 20) {
      newX = 20;
    }

    // Adjust vertical position
    if (position.y + tipRect.height > viewportHeight - 20) {
      newY = position.y - tipRect.height - 20;
    }
    if (newY < 20) {
      newY = 20;
    }

    return { x: newX, y: newY };
  }, [position, maxWidth]);

  // Handle visibility changes
  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      setActualPosition(calculatePosition());
    } else {
      setIsAnimating(false);
    }
  }, [isVisible, calculatePosition]);

  // Auto-hide timer
  useEffect(() => {
    if (isVisible && autoHideDelay > 0) {
      const timer = setTimeout(() => {
        onClose?.();
      }, autoHideDelay);

      return () => clearTimeout(timer);
    }
    return undefined; // Explicit return for else case
  }, [isVisible, autoHideDelay, onClose]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isVisible) {
        onClose?.();
      }
    };

    if (isVisible) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
    return undefined; // Explicit return for else case
  }, [isVisible, onClose]);

  // Handle click outside (mobile)
  useEffect(() => {
    const handleClickOutside = (event: TouchEvent | MouseEvent) => {
      if (tipRef.current && !tipRef.current.contains(event.target as Node)) {
        onClose?.();
      }
    };

    if (isVisible && isMobile) {
      document.addEventListener('touchstart', handleClickOutside);
      document.addEventListener('click', handleClickOutside);
      return () => {
        document.removeEventListener('touchstart', handleClickOutside);
        document.removeEventListener('click', handleClickOutside);
      };
    }
    return undefined; // Explicit return for else case
  }, [isVisible, isMobile, onClose]);

  if (!isVisible && !isAnimating) return null;

  const themeClasses = {
    dark: {
      container: 'bg-slate-800/95 text-white border-slate-600',
      arrow: 'border-slate-800'
    },
    light: {
      container: 'bg-white/95 text-slate-800 border-slate-200',
      arrow: 'border-white'
    }
  };

  const currentTheme = themeClasses[theme];

  return (
    <>
      {/* Backdrop for overlay variant */}
      {variant === 'overlay' && isVisible && (
        <div 
          className={`
            fixed inset-0 z-40
            bg-black/60 backdrop-blur-sm
            transition-opacity duration-300 ease-out
            ${isAnimating ? 'opacity-100' : 'opacity-0'}
          `}
          onClick={onClose}
        />
      )}

      {/* Main tip container */}
      <div
        ref={tipRef}
        className={`
          fixed z-50 pointer-events-auto
          transition-all duration-300 ease-out
          ${isAnimating ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
        `}
        style={{
          left: isMobile && variant === 'overlay' ? '50%' : actualPosition.x,
          top: isMobile && variant === 'overlay' ? '50%' : actualPosition.y,
          transform: isMobile && variant === 'overlay' 
            ? 'translate(-50%, -50%)' 
            : 'translateY(-100%)',
          maxWidth: isMobile ? '90vw' : maxWidth,
          willChange: 'opacity, transform'
        }}
      >
        {/* Tip content */}
        <div 
          className={`
            relative
            ${currentTheme.container}
            backdrop-filter backdrop-blur-sm
            border-2 rounded-xl
            px-6 py-4
            shadow-2xl
            ${isMobile ? 'max-w-sm' : ''}
          `}
        >
          {/* Liquid border animation */}
          <div 
            className="absolute inset-0 rounded-xl pointer-events-none overflow-hidden"
            style={{
              background: `conic-gradient(from 0deg, transparent, ${theme === 'dark' ? '#8b5cf6' : '#3b82f6'}40, transparent)`,
              animation: isAnimating ? 'textTipLiquidBorder 3s ease-in-out infinite' : 'none',
              mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              maskComposite: 'xor',
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
              padding: '1px'
            }}
          />

          {/* Close button for mobile */}
          {isMobile && onClose && (
            <button
              onClick={onClose}
              className="absolute top-2 right-2 p-1 rounded-full hover:bg-slate-700/50 transition-colors"
              aria-label="Close tip"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}

          {/* Tip content with typing animation */}
          <div className="relative z-10">
            <p className="text-sm leading-relaxed">
              {text.split('').map((char, index) => (
                <span
                  key={index}
                  className={`
                    inline-block
                    transition-all duration-75 ease-out
                    ${isAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
                  `}
                  style={{
                    transitionDelay: isAnimating ? `${index * 30}ms` : '0ms',
                    willChange: 'opacity, transform'
                  }}
                >
                  {char === ' ' ? '\u00A0' : char}
                </span>
              ))}
            </p>
          </div>

          {/* Pointer arrow for tooltip variant */}
          {variant === 'tooltip' && !isMobile && (
            <div 
              className="absolute top-full left-1/2 transform -translate-x-1/2"
              style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
            >
              <div 
                className={`
                  w-0 h-0 
                  border-l-8 border-r-8 border-t-8
                  border-l-transparent border-r-transparent
                  ${currentTheme.arrow}
                `}
              />
            </div>
          )}

          {/* Animated underline */}
          <div 
            className={`
              absolute bottom-3 left-6 h-px
              bg-gradient-to-r from-transparent via-current to-transparent
              transition-all duration-500 ease-out
              ${isAnimating ? 'w-1/2 opacity-60' : 'w-0 opacity-0'}
            `}
          />

          {/* Shimmer effect */}
          {isAnimating && (
            <div 
              className="absolute inset-0 rounded-xl pointer-events-none"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
                animation: 'shimmer 2s ease-in-out infinite',
                animationDelay: '0.5s'
              }}
            />
          )}
        </div>
      </div>

    </>
  );
};

/**
 * TextTipManager - Manages multiple text tip interactions
 */
interface TipState {
  id: string;
  text: string;
  position: { x: number; y: number };
  isVisible: boolean;
  variant?: 'tooltip' | 'overlay';
  autoHideDelay?: number;
}

interface TextTipManagerProps {
  tips: TipState[];
  onCloseTip: (id: string) => void;
  theme?: 'dark' | 'light';
}

export const TextTipManager: React.FC<TextTipManagerProps> = ({
  tips,
  onCloseTip,
  theme = 'dark'
}) => {
  return (
    <>
      {tips.map((tip) => (
        <TextTipInteraction
          key={tip.id}
          text={tip.text}
          position={tip.position}
          isVisible={tip.isVisible}
          variant={tip.variant}
          autoHideDelay={tip.autoHideDelay}
          onClose={() => onCloseTip(tip.id)}
          theme={theme}
        />
      ))}
    </>
  );
};

export default TextTipInteraction;