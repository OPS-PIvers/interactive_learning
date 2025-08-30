/**
 * Project Theme Context and Hook
 * 
 * Provides theme management for slide-based projects with support for:
 * - Theme selection and switching
 * - Color palette application to hotspots and modals
 * - Theme persistence and synchronization
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { ProjectTheme, ThemePreset } from '../../shared/baseTypes';
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
          ...currentTheme?.colors,
          ...(customThemeUpdates.colors || {})
        }
      };
      
      setCurrentTheme(updatedTheme);
      
      if (onThemeChange) {
        onThemeChange(updatedTheme, currentThemeId);
      }
    }
  }, [currentTheme, currentThemeId, onThemeChange]);

  const applyThemeToElement = useCallback((elementType: 'hotspot' | 'modal' | 'text') => {
    const { colors } = currentTheme || {};
    
    switch (elementType) {
      case 'hotspot':
        return {
          backgroundColor: colors?.primary,
          borderColor: colors?.primary,
          color: colors?.text,
        } as Record<string, string>;
      
      case 'modal':
        return {
          backgroundColor: colors?.background,
          borderColor: colors?.secondary,
          color: colors?.text,
        } as Record<string, string>;
      
      case 'text':
        return {
          color: colors?.text,
          '--primary-color': colors?.primary,
          '--accent-color': colors?.accent
        } as Record<string, string>;
      
      default:
        return {} as Record<string, string>;
    }
  }, [currentTheme]);

  const getCSSVariables = useCallback(() => {
    const { colors } = currentTheme || {};
    
    return {
      '--color-primary': colors?.primary,
      '--color-secondary': colors?.secondary,
      '--color-accent': colors?.accent,
      '--color-background': colors?.background,
      '--color-text': colors?.text,
    };
  }, [currentTheme]);

  // Apply CSS variables to document root when theme changes
  useEffect(() => {
    const cssVariables = getCSSVariables();
    const root = document.documentElement;
    
    Object.entries(cssVariables).forEach(([property, value]) => {
      if (value) {
        root.style.setProperty(property, value);
      }
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