import React, { useState, useCallback } from 'react';

interface ColorOption {
  id: string;
  color: string;
  label: string;
  gradient?: string;
}

interface LiquidColorSelectorProps {
  selectedColor: string;
  onColorChange: (color: string) => void;
  colors?: ColorOption[];
  isMobile?: boolean;
  size?: 'small' | 'medium' | 'large';
  showLiquidAnimation?: boolean;
}

/**
 * LiquidColorSelector - Animated color picker with liquid selection effects
 * 
 * Features liquid morphing animations and gradient support for hotspot color selection.
 * Optimized for both mobile touch and desktop interactions.
 */
export const LiquidColorSelector: React.FC<LiquidColorSelectorProps> = ({
  selectedColor,
  onColorChange,
  colors,
  isMobile = false,
  size = 'medium',
  showLiquidAnimation = true
}) => {
  const [hoveredColor, setHoveredColor] = useState<string | null>(null);
  const [rippleEffect, setRippleEffect] = useState<{ id: string; x: number; y: number } | null>(null);

  // Default color palette matching the project's theme
  const defaultColors: ColorOption[] = colors || [
    { id: 'purple', color: '#8b5cf6', label: 'Purple', gradient: 'from-purple-500 to-purple-600' },
    { id: 'blue', color: '#3b82f6', label: 'Blue', gradient: 'from-blue-500 to-blue-600' },
    { id: 'emerald', color: '#10b981', label: 'Emerald', gradient: 'from-emerald-500 to-emerald-600' },
    { id: 'amber', color: '#f59e0b', label: 'Amber', gradient: 'from-amber-500 to-amber-600' },
    { id: 'red', color: '#ef4444', label: 'Red', gradient: 'from-red-500 to-red-600' },
    { id: 'pink', color: '#ec4899', label: 'Pink', gradient: 'from-pink-500 to-pink-600' },
    { id: 'indigo', color: '#6366f1', label: 'Indigo', gradient: 'from-indigo-500 to-indigo-600' },
    { id: 'teal', color: '#14b8a6', label: 'Teal', gradient: 'from-teal-500 to-teal-600' }
  ];

  const sizeClasses = {
    small: 'w-8 h-8',
    medium: 'w-10 h-10',
    large: 'w-12 h-12'
  };

  const handleColorSelect = useCallback((colorOption: ColorOption, event: React.MouseEvent | React.TouchEvent) => {
    // Create ripple effect
    if (showLiquidAnimation) {
      const rect = event.currentTarget.getBoundingClientRect();
      const x = 'touches' in event 
        ? event.touches[0].clientX - rect.left
        : (event as React.MouseEvent).clientX - rect.left;
      const y = 'touches' in event
        ? event.touches[0].clientY - rect.top
        : (event as React.MouseEvent).clientY - rect.top;
      
      setRippleEffect({ id: colorOption.id, x, y });
      setTimeout(() => setRippleEffect(null), 600);
    }

    onColorChange(colorOption.color);
  }, [onColorChange, showLiquidAnimation]);

  return (
    <div className="liquid-color-selector">
      <div className="grid grid-cols-4 gap-3 p-1">
        {defaultColors.map((colorOption) => {
          const isSelected = selectedColor === colorOption.color;
          const isHovered = hoveredColor === colorOption.id;
          
          return (
            <div key={colorOption.id} className="relative">
              {/* Main color button */}
              <button
                onClick={(e) => handleColorSelect(colorOption, e)}
                onMouseEnter={() => setHoveredColor(colorOption.id)}
                onMouseLeave={() => setHoveredColor(null)}
                className={`
                  relative
                  ${sizeClasses[size]}
                  rounded-full
                  border-2 border-white/20
                  shadow-lg hover:shadow-xl
                  transition-all duration-300 ease-out
                  transform hover:scale-110
                  focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-slate-800
                  group
                  ${isSelected ? 'scale-110 ring-2 ring-white/80 ring-offset-2 ring-offset-slate-800' : ''}
                  ${isHovered ? 'shadow-2xl' : ''}
                `}
                style={{
                  backgroundColor: colorOption.color,
                  backgroundImage: colorOption.gradient 
                    ? `linear-gradient(135deg, ${colorOption.color}, ${colorOption.color}dd)`
                    : undefined,
                  willChange: 'transform, box-shadow'
                }}
                title={colorOption.label}
                aria-label={`Select ${colorOption.label} color`}
              >
                {/* Liquid selection indicator */}
                {isSelected && showLiquidAnimation && (
                  <div 
                    className="absolute inset-0 rounded-full animate-pulse"
                    style={{
                      background: `radial-gradient(circle, ${colorOption.color}40 0%, ${colorOption.color}20 50%, transparent 100%)`,
                      transform: 'scale(1.2)'
                    }}
                  />
                )}

                {/* Inner glow */}
                <div 
                  className={`
                    absolute inset-1 rounded-full
                    bg-gradient-to-br from-white/30 to-transparent
                    opacity-0 group-hover:opacity-100
                    transition-opacity duration-300
                  `}
                />

                {/* Selection checkmark */}
                {isSelected && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg 
                      className="w-4 h-4 text-white drop-shadow-lg animate-scale-in" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={3} 
                        d="M5 13l4 4L19 7" 
                      />
                    </svg>
                  </div>
                )}

                {/* Ripple effect */}
                {rippleEffect && rippleEffect.id === colorOption.id && (
                  <div 
                    className="absolute pointer-events-none"
                    style={{
                      left: rippleEffect.x,
                      top: rippleEffect.y,
                      transform: 'translate(-50%, -50%)'
                    }}
                  >
                    <div 
                      className="w-2 h-2 rounded-full animate-ripple"
                      style={{
                        backgroundColor: `${colorOption.color}60`,
                        boxShadow: `0 0 20px ${colorOption.color}40`
                      }}
                    />
                  </div>
                )}
              </button>

              {/* Liquid border animation */}
              {isSelected && showLiquidAnimation && (
                <div 
                  className="absolute inset-0 rounded-full pointer-events-none liquid-border"
                  style={{
                    background: `conic-gradient(from 0deg, ${colorOption.color}, transparent, ${colorOption.color})`,
                    padding: '2px',
                    animation: 'liquid-flow 2s ease-in-out infinite'
                  }}
                >
                  <div 
                    className="w-full h-full rounded-full"
                    style={{ backgroundColor: 'var(--bg-primary, #0f172a)' }}
                  />
                </div>
              )}

              {/* Hover glow effect */}
              {isHovered && showLiquidAnimation && (
                <div 
                  className="absolute inset-0 rounded-full pointer-events-none animate-glow"
                  style={{
                    background: `radial-gradient(circle, ${colorOption.color}30 0%, transparent 70%)`,
                    transform: 'scale(1.5)',
                    filter: 'blur(8px)'
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      <style jsx>{`
        @keyframes liquid-flow {
          0%, 100% { 
            transform: rotate(0deg) scale(1); 
            opacity: 0.8;
          }
          50% { 
            transform: rotate(180deg) scale(1.05); 
            opacity: 1;
          }
        }

        @keyframes ripple {
          0% {
            transform: translate(-50%, -50%) scale(0);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(8);
            opacity: 0;
          }
        }

        @keyframes glow {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1.5);
          }
          50% {
            opacity: 0.6;
            transform: scale(1.7);
          }
        }

        @keyframes scale-in {
          0% {
            transform: scale(0);
          }
          50% {
            transform: scale(1.2);
          }
          100% {
            transform: scale(1);
          }
        }

        .animate-ripple {
          animation: ripple 0.6s ease-out forwards;
        }

        .animate-glow {
          animation: glow 2s ease-in-out infinite;
        }

        .animate-scale-in {
          animation: scale-in 0.3s ease-out forwards;
        }

        .liquid-border {
          mask: radial-gradient(circle, transparent 60%, black 62%);
          -webkit-mask: radial-gradient(circle, transparent 60%, black 62%);
        }
      `}</style>
    </div>
  );
};

export default LiquidColorSelector;