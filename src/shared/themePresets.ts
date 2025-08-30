/**
 * Predefined Theme Presets for ExpliCoLearning
 * 
 * This file contains predefined color palettes and themes that users can select
 * to provide consistent styling across hotspots, modals, and other interactive elements.
 */

import { ProjectTheme, ThemePreset } from './baseTypes';

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
  }
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
  }
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
  }
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
  }
};

// Export all theme presets
export const themePresets: Record<ThemePreset, ProjectTheme> = {
  professional: professionalTheme,
  vibrant: vibrantTheme,
  dark: darkTheme,
  custom: customTheme,
};

// Helper function to get theme by ID
export function getThemeById(themeId: ThemePreset): ProjectTheme {
  return themePresets[themeId];
}

// Helper function to get all available themes
export function getAllThemes(): ProjectTheme[] {
  return Object.values(themePresets);
}

// Default theme
export const defaultTheme = professionalTheme;