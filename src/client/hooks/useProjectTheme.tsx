/**
 * Project Theme Context and Hook
 * 
 * Provides theme management for slide-based projects with support for:
 * - Theme selection and switching
 * - Color palette application to hotspots and modals
 * - Theme persistence and synchronization
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { ProjectTheme, ThemePreset } from '../../shared/slideTypes';
import { themePresets, defaultTheme, getThemeById } from '../../shared/themePresets';

interface ThemeContextValue {
  currentTheme: ProjectTheme;
  currentThemeId: ThemePreset;
  availableThemes: typeof themePresets;
  setTheme: (themeId: ThemePreset) => void;
  updateCustomTheme: (customTheme: Partial<ProjectTheme>) => void;
  applyThemeToElement: (elementType: 'hotspot' | 'modal' | 'text') => Record<string, string>;
  getCSSVariables: () => Record<string, string>;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export interface ProjectThemeProviderProps {
  children: React.ReactNode;
  initialTheme?: ProjectTheme;
  initialThemeId?: ThemePreset;
  onThemeChange?: (theme: ProjectTheme, themeId: ThemePreset) => void;
}

export const ProjectThemeProvider: React.FC<ProjectThemeProviderProps> = ({
  children,
  initialTheme,
  initialThemeId = 'professional',
  onThemeChange
}) => {
  const [currentThemeId, setCurrentThemeId] = useState<ThemePreset>(initialThemeId);
  const [currentTheme, setCurrentTheme] = useState<ProjectTheme>(
    initialTheme || getThemeById(initialThemeId)
  );

  // Update theme when ID changes
  const setTheme = useCallback((themeId: ThemePreset) => {
    const newTheme = getThemeById(themeId);
    setCurrentThemeId(themeId);
    setCurrentTheme(newTheme);
    
    if (onThemeChange) {
      onThemeChange(newTheme, themeId);
    }
  }, [onThemeChange]);

  // Update custom theme properties
  const updateCustomTheme = useCallback((customThemeUpdates: Partial<ProjectTheme>) => {
    if (currentThemeId === 'custom') {
      const updatedTheme = {
        ...currentTheme,
        ...customThemeUpdates,
        colors: {
          ...currentTheme.colors,
          ...(customThemeUpdates.colors || {})
        },
        typography: {
          ...currentTheme.typography,
          ...(customThemeUpdates.typography || {})
        },
        effects: {
          ...currentTheme.effects,
          ...(customThemeUpdates.effects || {})
        }
      };
      
      setCurrentTheme(updatedTheme);
      
      if (onThemeChange) {
        onThemeChange(updatedTheme, currentThemeId);
      }
    }
  }, [currentTheme, currentThemeId, onThemeChange]);

  // Get CSS styles for specific element types
  const applyThemeToElement = useCallback((elementType: 'hotspot' | 'modal' | 'text') => {
    const { colors, effects } = currentTheme;
    
    switch (elementType) {
      case 'hotspot':
        return {
          backgroundColor: colors.hotspotDefault,
          borderColor: colors.hotspotDefault,
          color: colors.surface,
          borderRadius: `${effects.borderRadius.large}px`,
          boxShadow: effects.shadow.medium,
          '--hover-bg': colors.hotspotHover,
          '--active-bg': colors.hotspotActive,
          '--pulse-bg': colors.hotspotPulse,
          '--transition-duration': `${effects.animation.duration.medium}ms`,
          '--transition-easing': effects.animation.easing.easeInOut
        };
      
      case 'modal':
        return {
          backgroundColor: colors.modalBackground,
          borderColor: colors.modalBorder,
          color: colors.text,
          borderRadius: `${effects.borderRadius.medium}px`,
          boxShadow: effects.shadow.large,
          '--overlay-bg': colors.modalOverlay,
          '--text-secondary': colors.textSecondary,
          '--border-radius-small': `${effects.borderRadius.small}px`
        };
      
      case 'text':
        return {
          color: colors.text,
          fontFamily: currentTheme.typography.fontFamily,
          fontSize: `${currentTheme.typography.fontSize.medium}px`,
          fontWeight: currentTheme.typography.fontWeight.normal.toString(),
          lineHeight: currentTheme.typography.lineHeight.medium.toString(),
          '--text-secondary': colors.textSecondary,
          '--primary-color': colors.primary,
          '--accent-color': colors.accent
        };
      
      default:
        return {};
    }
  }, [currentTheme]);

  // Generate CSS custom properties for the current theme
  const getCSSVariables = useCallback(() => {
    const { colors, typography, effects } = currentTheme;
    
    return {
      // Colors
      '--color-primary': colors.primary,
      '--color-secondary': colors.secondary,
      '--color-accent': colors.accent,
      '--color-background': colors.background,
      '--color-surface': colors.surface,
      '--color-text': colors.text,
      '--color-text-secondary': colors.textSecondary,
      '--color-success': colors.success,
      '--color-warning': colors.warning,
      '--color-error': colors.error,
      
      // Hotspot colors
      '--color-hotspot-default': colors.hotspotDefault,
      '--color-hotspot-hover': colors.hotspotHover,
      '--color-hotspot-active': colors.hotspotActive,
      '--color-hotspot-pulse': colors.hotspotPulse,
      
      // Modal colors
      '--color-modal-background': colors.modalBackground,
      '--color-modal-overlay': colors.modalOverlay,
      '--color-modal-border': colors.modalBorder,
      
      // Typography
      '--font-family': typography.fontFamily,
      '--font-size-small': `${typography.fontSize.small}px`,
      '--font-size-medium': `${typography.fontSize.medium}px`,
      '--font-size-large': `${typography.fontSize.large}px`,
      '--font-size-xlarge': `${typography.fontSize.xlarge}px`,
      '--font-weight-light': typography.fontWeight.light.toString(),
      '--font-weight-normal': typography.fontWeight.normal.toString(),
      '--font-weight-bold': typography.fontWeight.bold.toString(),
      
      // Effects
      '--border-radius-small': `${effects.borderRadius.small}px`,
      '--border-radius-medium': `${effects.borderRadius.medium}px`,
      '--border-radius-large': `${effects.borderRadius.large}px`,
      '--shadow-small': effects.shadow.small,
      '--shadow-medium': effects.shadow.medium,
      '--shadow-large': effects.shadow.large,
      '--animation-duration-fast': `${effects.animation.duration.fast}ms`,
      '--animation-duration-medium': `${effects.animation.duration.medium}ms`,
      '--animation-duration-slow': `${effects.animation.duration.slow}ms`,
      '--animation-easing': effects.animation.easing.ease
    };
  }, [currentTheme]);

  // Apply CSS variables to document root when theme changes
  useEffect(() => {
    const cssVariables = getCSSVariables();
    const root = document.documentElement;
    
    Object.entries(cssVariables).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });
    
    // Cleanup function to remove custom properties
    return () => {
      Object.keys(cssVariables).forEach(property => {
        root.style.removeProperty(property);
      });
    };
  }, [getCSSVariables]);

  const contextValue: ThemeContextValue = {
    currentTheme,
    currentThemeId,
    availableThemes: themePresets,
    setTheme,
    updateCustomTheme,
    applyThemeToElement,
    getCSSVariables
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// Hook to use theme context
export const useProjectTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  
  if (!context) {
    throw new Error('useProjectTheme must be used within a ProjectThemeProvider');
  }
  
  return context;
};

// Utility hook for applying theme styles to components
export const useThemeStyles = (elementType: 'hotspot' | 'modal' | 'text') => {
  const { applyThemeToElement } = useProjectTheme();
  return applyThemeToElement(elementType);
};

// Utility hook for getting theme colors
export const useThemeColors = () => {
  const { currentTheme } = useProjectTheme();
  return currentTheme.colors;
};

export default ProjectThemeProvider;