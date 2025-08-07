/**
 * Theme Utility Functions
 * 
 * Provides helper functions for applying themes to components,
 * converting colors, and managing theme-related calculations.
 */

import { ProjectTheme, ThemeColors } from '../../shared/slideTypes';

/**
 * Convert hex color to RGB values
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1]!, 16),
    g: parseInt(result[2]!, 16),
    b: parseInt(result[3]!, 16)
  } : null;
}

/**
 * Convert RGB to hex color
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

/**
 * Create color variant by adjusting lightness
 */
export function createColorVariant(color: string, lightnessDelta: number): string {
  const rgb = hexToRgb(color);
  if (!rgb) return color;
  
  const { r, g, b } = rgb;
  const newR = Math.max(0, Math.min(255, r + lightnessDelta));
  const newG = Math.max(0, Math.min(255, g + lightnessDelta));
  const newB = Math.max(0, Math.min(255, b + lightnessDelta));
  
  return rgbToHex(newR, newG, newB);
}

/**
 * Create rgba color string with opacity
 */
export function addOpacityToColor(color: string, opacity: number): string {
  const rgb = hexToRgb(color);
  if (!rgb) return color;
  
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
}

/**
 * Generate hover and active states for a base color
 */
export function generateColorStates(baseColor: string) {
  return {
    default: baseColor,
    hover: createColorVariant(baseColor, -20), // Slightly darker
    active: createColorVariant(baseColor, -40), // Much darker
    light: createColorVariant(baseColor, 30),   // Lighter for backgrounds
    pulse: addOpacityToColor(baseColor, 0.7)   // Semi-transparent for pulse effect
  };
}

/**
 * Apply theme colors to hotspot styling
 */
export function getHotspotThemeStyles(theme: ProjectTheme, size: 'small' | 'medium' | 'large' = 'medium') {
  const colors = theme.colors;
  const effects = theme.effects;
  
  const sizeMap = {
    small: { width: 24, height: 24, fontSize: theme.typography.fontSize.small },
    medium: { width: 32, height: 32, fontSize: theme.typography.fontSize.medium },
    large: { width: 40, height: 40, fontSize: theme.typography.fontSize.large }
  };
  
  const dimensions = sizeMap[size];
  
  return {
    // Base styles
    width: `${dimensions.width}px`,
    height: `${dimensions.height}px`,
    backgroundColor: colors.hotspotDefault,
    borderColor: colors.hotspotDefault,
    borderWidth: '2px',
    borderStyle: 'solid',
    borderRadius: `${effects.borderRadius.large}px`,
    color: colors.surface,
    fontSize: `${dimensions.fontSize}px`,
    fontWeight: theme.typography.fontWeight.normal,
    boxShadow: effects.shadow.medium,
    cursor: 'pointer',
    transition: `all ${effects.animation.duration.medium}ms ${effects.animation.easing.easeInOut}`,
    
    // Hover styles (applied via CSS classes)
    '&:hover': {
      backgroundColor: colors.hotspotHover,
      borderColor: colors.hotspotHover,
      transform: 'scale(1.1)',
      boxShadow: effects.shadow.large
    },
    
    // Active styles
    '&:active': {
      backgroundColor: colors.hotspotActive,
      borderColor: colors.hotspotActive,
      transform: 'scale(0.95)'
    },
    
    // Pulse animation styles
    '&.pulse': {
      animation: `pulse ${effects.animation.duration.slow * 2}ms infinite`
    }
  };
}

/**
 * Apply theme colors to modal styling
 */
export function getModalThemeStyles(theme: ProjectTheme) {
  const colors = theme.colors;
  const effects = theme.effects;
  const typography = theme.typography;
  
  return {
    // Modal backdrop
    backdrop: {
      backgroundColor: colors.modalOverlay,
      backdropFilter: 'blur(4px)'
    },
    
    // Modal container
    modal: {
      backgroundColor: colors.modalBackground,
      borderColor: colors.modalBorder,
      borderWidth: '1px',
      borderStyle: 'solid',
      borderRadius: `${effects.borderRadius.medium}px`,
      boxShadow: effects.shadow.large,
      color: colors.text,
      fontFamily: typography.fontFamily,
      fontSize: `${typography.fontSize.medium}px`,
      lineHeight: typography.lineHeight.medium
    },
    
    // Modal header
    header: {
      borderBottom: `1px solid ${colors.modalBorder}`,
      color: colors.text,
      fontSize: `${typography.fontSize.large}px`,
      fontWeight: typography.fontWeight.bold
    },
    
    // Modal buttons
    primaryButton: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
      color: colors.surface,
      borderRadius: `${effects.borderRadius.small}px`,
      transition: `all ${effects.animation.duration.medium}ms ${effects.animation.easing.easeInOut}`,
      '&:hover': {
        backgroundColor: createColorVariant(colors.primary, -20)
      }
    },
    
    secondaryButton: {
      backgroundColor: 'transparent',
      borderColor: colors.secondary,
      color: colors.secondary,
      borderRadius: `${effects.borderRadius.small}px`,
      transition: `all ${effects.animation.duration.medium}ms ${effects.animation.easing.easeInOut}`,
      '&:hover': {
        backgroundColor: addOpacityToColor(colors.secondary, 0.1)
      }
    }
  };
}

/**
 * Generate CSS custom properties object from theme
 */
export function generateCSSCustomProperties(theme: ProjectTheme): Record<string, string> {
  const { colors, typography, effects } = theme;
  
  return {
    // Color properties
    '--theme-primary': colors.primary,
    '--theme-secondary': colors.secondary,
    '--theme-accent': colors.accent,
    '--theme-background': colors.background,
    '--theme-surface': colors.surface,
    '--theme-text': colors.text,
    '--theme-text-secondary': colors.textSecondary,
    
    // Hotspot properties
    '--theme-hotspot-default': colors.hotspotDefault,
    '--theme-hotspot-hover': colors.hotspotHover,
    '--theme-hotspot-active': colors.hotspotActive,
    '--theme-hotspot-pulse': colors.hotspotPulse,
    
    // Modal properties
    '--theme-modal-bg': colors.modalBackground,
    '--theme-modal-overlay': colors.modalOverlay,
    '--theme-modal-border': colors.modalBorder,
    
    // Typography properties
    '--theme-font-family': typography.fontFamily,
    '--theme-font-size-sm': `${typography.fontSize.small}px`,
    '--theme-font-size-md': `${typography.fontSize.medium}px`,
    '--theme-font-size-lg': `${typography.fontSize.large}px`,
    '--theme-font-size-xl': `${typography.fontSize.xlarge}px`,
    
    // Effect properties
    '--theme-border-radius-sm': `${effects.borderRadius.small}px`,
    '--theme-border-radius-md': `${effects.borderRadius.medium}px`,
    '--theme-border-radius-lg': `${effects.borderRadius.large}px`,
    '--theme-shadow-sm': effects.shadow.small,
    '--theme-shadow-md': effects.shadow.medium,
    '--theme-shadow-lg': effects.shadow.large,
    '--theme-transition-fast': `${effects.animation.duration.fast}ms`,
    '--theme-transition-medium': `${effects.animation.duration.medium}ms`,
    '--theme-transition-slow': `${effects.animation.duration.slow}ms`
  };
}

/**
 * Get contrasting text color (black or white) for a background color
 */
export function getContrastingTextColor(backgroundColor: string): string {
  const rgb = hexToRgb(backgroundColor);
  if (!rgb) return '#000000';
  
  // Calculate luminance
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  
  // Return black for light backgrounds, white for dark backgrounds
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

/**
 * Validate if a color string is valid
 */
export function isValidColor(color: string): boolean {
  // Check hex color format
  const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  if (hexRegex.test(color)) return true;
  
  // Check rgb/rgba format
  const rgbRegex = /^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(?:,\s*[\d.]+)?\s*\)$/;
  if (rgbRegex.test(color)) return true;
  
  // Check named colors (basic check)
  const namedColors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'brown', 'black', 'white', 'gray', 'transparent'];
  if (namedColors.includes(color.toLowerCase())) return true;
  
  return false;
}

/**
 * Create a theme-aware class name generator
 */
export function createThemeClassNames(theme: ProjectTheme, baseClass: string) {
  return {
    base: baseClass,
    primary: `${baseClass}--primary`,
    secondary: `${baseClass}--secondary`,
    accent: `${baseClass}--accent`,
    small: `${baseClass}--small`,
    medium: `${baseClass}--medium`,
    large: `${baseClass}--large`,
    pulse: `${baseClass}--pulse`,
    hover: `${baseClass}--hover`,
    active: `${baseClass}--active`
  };
}