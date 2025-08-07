import React, { useState, useCallback } from 'react';
import styles from './LiquidColorSelector.module.css';

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

  const getSizeClass = (sizeType: string) => {
    switch (sizeType) {
      case 'small': return styles['small'];
      case 'medium': return styles['medium'];
      case 'large': return styles['large'];
      default: return styles['medium'];
    }
  };

  const handleColorSelect = useCallback((colorOption: ColorOption, event: React.MouseEvent | React.TouchEvent) => {
    console.log('🎨 LiquidColorSelector: handleColorSelect called with color:', colorOption.color);
    console.log('🎨 LiquidColorSelector: onColorChange callback exists:', !!onColorChange);

    // Create ripple effect
    if (showLiquidAnimation) {
      const rect = event.currentTarget.getBoundingClientRect();
      let clientX, clientY;

      if ('touches' in event) {
        // Use optional chaining and nullish coalescing to safely get a touch point.
        // This handles cases where `touches` is empty (like in touchend events),
        // falling back to `changedTouches`.
        const touch = event.touches?.[0] ?? event.changedTouches?.[0];
        if (touch) {
          clientX = touch.clientX;
          clientY = touch.clientY;
        }
      } else {
        // Fallback to mouse event coordinates.
        clientX = event.clientX;
        clientY = event.clientY;
      }
      
      // Only create ripple if we have valid coordinates to prevent errors.
      if (clientX !== undefined && clientY !== undefined) {
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        setRippleEffect({ id: colorOption.id, x, y });
        setTimeout(() => setRippleEffect(null), 600);
      }
    }

    console.log('🎨 LiquidColorSelector: Calling onColorChange with:', colorOption.color);
    onColorChange(colorOption.color);
  }, [onColorChange, showLiquidAnimation]);

  return (
    <div className={styles['liquidColorSelector']}>
      <div className={styles['colorGrid']}>
        {defaultColors.map((colorOption) => {
          const isSelected = selectedColor === colorOption.color;
          const isHovered = hoveredColor === colorOption.id;
          
          return (
            <div key={colorOption.id} className={styles['colorOption']}>
              {/* Main color button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleColorSelect(colorOption, e);
                }}
                onMouseEnter={() => setHoveredColor(colorOption.id)}
                onMouseLeave={() => setHoveredColor(null)}
                className={`
                  ${styles['colorButton']}
                  ${getSizeClass(size)}
                  ${isSelected ? styles['selected'] : ''}
                  ${isHovered ? styles['hovered'] : ''}
                `}
                style={{
                  backgroundColor: colorOption.color,
                  backgroundImage: colorOption.gradient 
                    ? `linear-gradient(135deg, ${colorOption.color}, ${colorOption.color}dd)`
                    : undefined
                }}
                title={colorOption.label}
                aria-label={`Select ${colorOption.label} color`}
              >
                {/* Liquid selection indicator */}
                {isSelected && showLiquidAnimation && (
                  <div 
                    className={styles['liquidSelection']}
                    style={{
                      background: `radial-gradient(circle, ${colorOption.color}40 0%, ${colorOption.color}20 50%, transparent 100%)`
                    }}
                  />
                )}

                {/* Inner glow */}
                <div className={styles['innerGlow']} />

                {/* Selection checkmark */}
                {isSelected && (
                  <div className={styles['selectionIndicator']}>
                    <svg 
                      className={styles['checkmark']}
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
                    className={styles['rippleContainer']}
                    style={{
                      left: rippleEffect.x,
                      top: rippleEffect.y,
                      transform: 'translate(-50%, -50%)'
                    }}
                  >
                    <div 
                      className={styles['ripple']}
                      style={{
                        backgroundColor: `${colorOption.color}60`,
                        boxShadow: `0 0 20px ${colorOption.color}40`
                      }}
                    />
                  </div>
                )}
              </button>


              {/* Hover glow effect */}
              {isHovered && showLiquidAnimation && (
                <div 
                  className={styles['hoverGlow']}
                  style={{
                    background: `radial-gradient(circle, ${colorOption.color}30 0%, transparent 70%)`
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LiquidColorSelector;