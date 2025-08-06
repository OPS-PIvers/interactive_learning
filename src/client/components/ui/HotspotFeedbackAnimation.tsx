import React, { useEffect, useState, useCallback } from 'react';
import { Z_INDEX_TAILWIND } from '../../utils/zIndexLevels';

interface HotspotFeedbackAnimationProps {
  x: number;
  y: number;
  color?: string;
  size?: number;
  onComplete?: () => void;
  variant?: 'ripple' | 'pulse' | 'liquid';
  intensity?: 'subtle' | 'normal' | 'strong';
}

interface AnimationState {
  id: string;
  x: number;
  y: number;
  timestamp: number;
  color: string;
  size: number;
  variant: 'ripple' | 'pulse' | 'liquid';
  intensity: 'subtle' | 'normal' | 'strong';
}

/**
 * HotspotFeedbackAnimation - Visual feedback for hotspot interactions
 * 
 * Provides immediate visual feedback when users click or touch hotspots.
 * Supports multiple animation variants optimized for mobile performance.
 */
export const HotspotFeedbackAnimation: React.FC<HotspotFeedbackAnimationProps> = ({
  x,
  y,
  color = '#3b82f6',
  size = 40,
  onComplete,
  variant = 'ripple',
  intensity = 'normal'
}) => {
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    const duration = variant === 'pulse' ? 600 : variant === 'liquid' ? 800 : 500;
    const timer = setTimeout(() => {
      setIsAnimating(false);
      onComplete?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [variant, onComplete]);

  const getIntensityMultiplier = () => {
    switch (intensity) {
      case 'subtle': return 0.7;
      case 'strong': return 1.3;
      default: return 1.0;
    }
  };

  const intensityMultiplier = getIntensityMultiplier();
  const finalSize = size * intensityMultiplier;

  if (!isAnimating) return null;

  return (
    <div
      className={`fixed pointer-events-none ${Z_INDEX_TAILWIND.DRAG_PREVIEW}`}
      style={{
        left: x,
        top: y,
        transform: 'translate(-50%, -50%)'
      }}
    >
      {/* Ripple Variant */}
      {variant === 'ripple' && (
        <>
          {/* Main ripple */}
          <div
            className="absolute rounded-full animate-ripple-expand"
            style={{
              width: finalSize,
              height: finalSize,
              backgroundColor: `${color}30`,
              border: `2px solid ${color}60`,
              transform: 'translate(-50%, -50%)',
              willChange: 'transform, opacity'
            }}
          />
          
          {/* Secondary ripple */}
          <div
            className="absolute rounded-full animate-ripple-expand-delayed"
            style={{
              width: finalSize * 0.6,
              height: finalSize * 0.6,
              backgroundColor: `${color}50`,
              transform: 'translate(-50%, -50%)',
              willChange: 'transform, opacity'
            }}
          />
          
          {/* Center pulse */}
          <div
            className="absolute rounded-full animate-center-pulse"
            style={{
              width: finalSize * 0.2,
              height: finalSize * 0.2,
              backgroundColor: color,
              transform: 'translate(-50%, -50%)',
              boxShadow: `0 0 20px ${color}80`,
              willChange: 'transform, opacity'
            }}
          />
        </>
      )}

      {/* Pulse Variant */}
      {variant === 'pulse' && (
        <>
          {/* Outer pulse */}
          <div
            className="absolute rounded-full animate-pulse-expand"
            style={{
              width: finalSize,
              height: finalSize,
              background: `radial-gradient(circle, ${color}40 0%, ${color}20 50%, transparent 100%)`,
              transform: 'translate(-50%, -50%)',
              willChange: 'transform, opacity'
            }}
          />
          
          {/* Inner glow */}
          <div
            className="absolute rounded-full animate-glow-pulse"
            style={{
              width: finalSize * 0.4,
              height: finalSize * 0.4,
              backgroundColor: color,
              transform: 'translate(-50%, -50%)',
              filter: 'blur(4px)',
              willChange: 'transform, opacity'
            }}
          />
        </>
      )}

      {/* Liquid Variant */}
      {variant === 'liquid' && (
        <>
          {/* Liquid splash */}
          <div
            className="absolute animate-liquid-splash"
            style={{
              width: finalSize,
              height: finalSize,
              transform: 'translate(-50%, -50%)',
              willChange: 'transform, opacity'
            }}
          >
            <div
              className="w-full h-full rounded-full relative"
              style={{
                background: `conic-gradient(from 0deg, ${color}, ${color}80, transparent, ${color})`
              }}
            >
              {/* Liquid droplets */}
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="absolute rounded-full animate-droplet"
                  style={{
                    width: finalSize * 0.1,
                    height: finalSize * 0.1,
                    backgroundColor: color,
                    left: '50%',
                    top: '50%',
                    transform: `translate(-50%, -50%) rotate(${i * 60}deg) translateY(-${finalSize * 0.3}px)`,
                    animationDelay: `${i * 100}ms`,
                    willChange: 'transform, opacity'
                  }}
                />
              ))}
            </div>
          </div>
          
          {/* Central liquid core */}
          <div
            className="absolute rounded-full animate-liquid-core"
            style={{
              width: finalSize * 0.3,
              height: finalSize * 0.3,
              background: `radial-gradient(circle, ${color} 0%, ${color}80 100%)`,
              transform: 'translate(-50%, -50%)',
              filter: 'blur(1px)',
              willChange: 'transform, opacity'
            }}
          />
        </>
      )}
    </div>
  );
};

/**
 * HotspotFeedbackManager - Manages multiple feedback animations
 * 
 * Handles creation and cleanup of multiple simultaneous feedback animations.
 */
interface FeedbackManagerProps {
  animations: AnimationState[];
  onAnimationComplete: (id: string) => void;
}

export const HotspotFeedbackManager: React.FC<FeedbackManagerProps> = ({
  animations,
  onAnimationComplete
}) => {
  return (
    <>
      {animations.map((animation) => (
        <HotspotFeedbackAnimation
          key={animation.id}
          x={animation.x}
          y={animation.y}
          color={animation.color}
          size={animation.size}
          variant={animation.variant}
          intensity={animation.intensity}
          onComplete={() => onAnimationComplete(animation.id)}
        />
      ))}
    </>
  );
};

export default HotspotFeedbackAnimation;