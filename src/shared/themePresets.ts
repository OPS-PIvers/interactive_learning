/**
 * Predefined Theme Presets for Interactive Learning Hub
 * 
 * This file contains predefined color palettes and themes that users can select
 * to provide consistent styling across hotspots, modals, and other interactive elements.
 */

import { ProjectTheme, ThemePresetDefinition, ThemePreset } from './slideTypes';

// Base typography and effects used across all themes
const baseTypography = {
  fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
  fontSize: {
    small: 12,
    medium: 14,
    large: 16,
    xlarge: 20
  },
  fontWeight: {
    light: 300,
    normal: 400,
    bold: 600
  },
  lineHeight: {
    small: 1.4,
    medium: 1.5,
    large: 1.6
  }
};

const baseEffects = {
  borderRadius: {
    small: 4,
    medium: 8,
    large: 16
  },
  shadow: {
    small: '0 1px 3px rgba(0, 0, 0, 0.1)',
    medium: '0 4px 6px rgba(0, 0, 0, 0.1)',
    large: '0 10px 15px rgba(0, 0, 0, 0.1)'
  },
  animation: {
    duration: {
      fast: 150,
      medium: 300,
      slow: 500
    },
    easing: {
      ease: 'ease',
      easeIn: 'ease-in',
      easeOut: 'ease-out',
      easeInOut: 'ease-in-out'
    }
  }
};

// Professional Theme - Blues and grays
const professionalTheme: ProjectTheme = {
  id: 'professional',
  name: 'Professional',
  description: 'Clean, corporate look with blues and grays',
  colors: {
    primary: '#3b82f6',      // Blue-500
    secondary: '#64748b',     // Slate-500
    accent: '#06b6d4',       // Cyan-500
    background: '#f8fafc',   // Slate-50
    surface: '#ffffff',      // White
    text: '#1e293b',         // Slate-800
    textSecondary: '#64748b', // Slate-500
    success: '#10b981',      // Emerald-500
    warning: '#f59e0b',      // Amber-500
    error: '#ef4444',        // Red-500
    // Hotspot colors
    hotspotDefault: '#3b82f6',   // Blue-500
    hotspotHover: '#2563eb',     // Blue-600
    hotspotActive: '#1d4ed8',    // Blue-700
    hotspotPulse: '#60a5fa',     // Blue-400
    // Modal colors
    modalBackground: '#ffffff',   // White
    modalOverlay: 'rgba(0, 0, 0, 0.5)',
    modalBorder: '#e2e8f0'       // Slate-200
  },
  typography: baseTypography,
  effects: baseEffects
};

// Vibrant Theme - Bright colors with high contrast
const vibrantTheme: ProjectTheme = {
  id: 'vibrant',
  name: 'Vibrant',
  description: 'Bright, energetic colors with high contrast',
  colors: {
    primary: '#e11d48',      // Rose-600
    secondary: '#7c3aed',     // Violet-600
    accent: '#f59e0b',       // Amber-500
    background: '#fefefe',   // Near white
    surface: '#ffffff',      // White
    text: '#111827',         // Gray-900
    textSecondary: '#6b7280', // Gray-500
    success: '#059669',      // Emerald-600
    warning: '#d97706',      // Amber-600
    error: '#dc2626',        // Red-600
    // Hotspot colors
    hotspotDefault: '#e11d48',   // Rose-600
    hotspotHover: '#be185d',     // Rose-700
    hotspotActive: '#9f1239',    // Rose-800
    hotspotPulse: '#fb7185',     // Rose-400
    // Modal colors
    modalBackground: '#ffffff',   // White
    modalOverlay: 'rgba(124, 58, 237, 0.4)', // Violet overlay
    modalBorder: '#f3e8ff'       // Violet-50
  },
  typography: baseTypography,
  effects: baseEffects
};

// Earth Tones Theme - Warm, natural colors
const earthTheme: ProjectTheme = {
  id: 'earth',
  name: 'Earth Tones',
  description: 'Warm, natural colors inspired by nature',
  colors: {
    primary: '#92400e',      // Amber-800
    secondary: '#78716c',     // Stone-500
    accent: '#ea580c',       // Orange-600
    background: '#fefdf8',   // Warm white
    surface: '#fffbeb',      // Amber-50
    text: '#44403c',         // Stone-700
    textSecondary: '#78716c', // Stone-500
    success: '#16a34a',      // Green-600
    warning: '#ca8a04',      // Yellow-600
    error: '#dc2626',        // Red-600
    // Hotspot colors
    hotspotDefault: '#92400e',   // Amber-800
    hotspotHover: '#78350f',     // Amber-900
    hotspotActive: '#451a03',    // Amber-950
    hotspotPulse: '#d97706',     // Amber-600
    // Modal colors
    modalBackground: '#fffbeb',  // Amber-50
    modalOverlay: 'rgba(146, 64, 14, 0.3)', // Amber overlay
    modalBorder: '#fed7aa'       // Orange-200
  },
  typography: baseTypography,
  effects: baseEffects
};

// Dark Theme - High contrast dark mode
const darkTheme: ProjectTheme = {
  id: 'dark',
  name: 'Dark Mode',
  description: 'High contrast dark theme for modern interfaces',
  colors: {
    primary: '#60a5fa',      // Blue-400
    secondary: '#94a3b8',     // Slate-400
    accent: '#34d399',       // Emerald-400
    background: '#0f172a',   // Slate-900
    surface: '#1e293b',      // Slate-800
    text: '#f1f5f9',         // Slate-100
    textSecondary: '#94a3b8', // Slate-400
    success: '#34d399',      // Emerald-400
    warning: '#fbbf24',      // Amber-400
    error: '#f87171',        // Red-400
    // Hotspot colors
    hotspotDefault: '#60a5fa',   // Blue-400
    hotspotHover: '#3b82f6',     // Blue-500
    hotspotActive: '#2563eb',    // Blue-600
    hotspotPulse: '#93c5fd',     // Blue-300
    // Modal colors
    modalBackground: '#1e293b',  // Slate-800
    modalOverlay: 'rgba(0, 0, 0, 0.7)',
    modalBorder: '#475569'       // Slate-600
  },
  typography: baseTypography,
  effects: baseEffects
};

// Custom theme template (empty for user customization)
const customTheme: ProjectTheme = {
  id: 'custom',
  name: 'Custom',
  description: 'Create your own custom color palette',
  colors: {
    primary: '#3b82f6',
    secondary: '#64748b',
    accent: '#06b6d4',
    background: '#ffffff',
    surface: '#f8fafc',
    text: '#1e293b',
    textSecondary: '#64748b',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    hotspotDefault: '#3b82f6',
    hotspotHover: '#2563eb',
    hotspotActive: '#1d4ed8',
    hotspotPulse: '#60a5fa',
    modalBackground: '#ffffff',
    modalOverlay: 'rgba(0, 0, 0, 0.5)',
    modalBorder: '#e2e8f0'
  },
  typography: baseTypography,
  effects: baseEffects
};

// Export all theme presets
export const themePresets: Record<ThemePreset, ThemePresetDefinition> = {
  professional: {
    id: 'professional',
    name: 'Professional',
    description: 'Clean, corporate look with blues and grays',
    theme: professionalTheme
  },
  vibrant: {
    id: 'vibrant',
    name: 'Vibrant',
    description: 'Bright, energetic colors with high contrast',
    theme: vibrantTheme
  },
  earth: {
    id: 'earth',
    name: 'Earth Tones',
    description: 'Warm, natural colors inspired by nature',
    theme: earthTheme
  },
  dark: {
    id: 'dark',
    name: 'Dark Mode',
    description: 'High contrast dark theme for modern interfaces',
    theme: darkTheme
  },
  custom: {
    id: 'custom',
    name: 'Custom',
    description: 'Create your own custom color palette',
    theme: customTheme
  }
};

// Helper function to get theme by ID
export function getThemeById(themeId: ThemePreset): ProjectTheme {
  return themePresets[themeId].theme;
}

// Helper function to get all available themes
export function getAllThemes(): ThemePresetDefinition[] {
  return Object.values(themePresets);
}

// Default theme
export const defaultTheme = professionalTheme;