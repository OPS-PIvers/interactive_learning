import { HotspotData } from './types';

/**
 * Hotspot Style Presets for ExpliCoLearning
 * 
 * Predefined styles and sizes for hotspots that users can quickly apply
 */

export type HotspotSize = 'x-small' | 'small' | 'medium' | 'large';

export interface HotspotStylePreset {
  name: string;
  description: string;
  style: {
    color: string;
    opacity?: number;
    borderWidth?: number;
    borderColor?: string;
    backgroundColor?: string;
    textColor?: string;
  };
}

export interface HotspotSizePreset {
  name: string;
  value: HotspotSize;
  description: string;
  mobileClasses: string;
  desktopClasses: string;
}

// Style presets for different use cases
export const hotspotStylePresets: HotspotStylePreset[] = [
  {
    name: 'Primary',
    description: 'Default blue style for main content',
    style: {
      color: '#3B82F6',
      opacity: 0.9,
      borderWidth: 2,
      borderColor: '#1E40AF',
      backgroundColor: '#3B82F6',
      textColor: '#FFFFFF'
    }
  },
  {
    name: 'Success',
    description: 'Green style for positive actions',
    style: {
      color: '#10B981',
      opacity: 0.9,
      borderWidth: 2,
      borderColor: '#059669',
      backgroundColor: '#10B981',
      textColor: '#FFFFFF'
    }
  },
  {
    name: 'Warning',
    description: 'Orange style for attention-grabbing content',
    style: {
      color: '#F59E0B',
      opacity: 0.9,
      borderWidth: 2,
      borderColor: '#D97706',
      backgroundColor: '#F59E0B',
      textColor: '#FFFFFF'
    }
  },
  {
    name: 'Danger',
    description: 'Red style for critical or error content',
    style: {
      color: '#EF4444',
      opacity: 0.9,
      borderWidth: 2,
      borderColor: '#DC2626',
      backgroundColor: '#EF4444',
      textColor: '#FFFFFF'
    }
  },
  {
    name: 'Purple',
    description: 'Purple style for creative content',
    style: {
      color: '#8B5CF6',
      opacity: 0.9,
      borderWidth: 2,
      borderColor: '#7C3AED',
      backgroundColor: '#8B5CF6',
      textColor: '#FFFFFF'
    }
  },
  {
    name: 'Pink',
    description: 'Pink style for highlights',
    style: {
      color: '#EC4899',
      opacity: 0.9,
      borderWidth: 2,
      borderColor: '#DB2777',
      backgroundColor: '#EC4899',
      textColor: '#FFFFFF'
    }
  },
  {
    name: 'Subtle',
    description: 'Muted style for background elements',
    style: {
      color: '#6B7280',
      opacity: 0.7,
      borderWidth: 1,
      borderColor: '#4B5563',
      backgroundColor: '#6B7280',
      textColor: '#FFFFFF'
    }
  },
  {
    name: 'High Contrast',
    description: 'Black style for maximum visibility',
    style: {
      color: '#1F2937',
      opacity: 1.0,
      borderWidth: 3,
      borderColor: '#000000',
      backgroundColor: '#1F2937',
      textColor: '#FFFFFF'
    }
  }
];

// Size presets with responsive classes - shifted up for better visibility
export const hotspotSizePresets: HotspotSizePreset[] = [
  {
    name: 'Extra Small',
    value: 'x-small',
    description: 'For dense layouts or subtle markers',
    mobileClasses: 'h-11 w-11',
    desktopClasses: 'h-3 w-3'
  },
  {
    name: 'Small',
    value: 'small',
    description: 'Compact size for detailed content',
    mobileClasses: 'h-12 w-12',
    desktopClasses: 'h-5 w-5'
  },
  {
    name: 'Medium',
    value: 'medium',
    description: 'Standard size for most content',
    mobileClasses: 'h-14 w-14',
    desktopClasses: 'h-6 w-6'
  },
  {
    name: 'Large',
    value: 'large',
    description: 'Prominent size for important content',
    mobileClasses: 'h-16 w-16',
    desktopClasses: 'h-8 w-8'
  }
];

// Default size
export const defaultHotspotSize: HotspotSize = 'small';

// Helper function to get size classes
export const getHotspotSizeClasses = (size: HotspotSize = defaultHotspotSize, isMobile: boolean = false): string => {
  const preset = hotspotSizePresets.find(p => p.value === size);
  if (!preset) {
    // Fallback to small if size not found
    const fallback = hotspotSizePresets.find(p => p.value === 'small');
    return isMobile ? fallback?.mobileClasses || 'h-12 w-12' : fallback?.desktopClasses || 'h-5 w-5';
  }
  return isMobile ? preset.mobileClasses : preset.desktopClasses;
};

// New helper for responsive classes
export const getResponsiveHotspotSizeClasses = (size: HotspotSize = defaultHotspotSize): string => {
  const preset = hotspotSizePresets.find(p => p.value === size);
  if (!preset) {
    const fallback = hotspotSizePresets.find(p => p.value === 'small');
    if (fallback) {
      return `${fallback.mobileClasses} md:${fallback.desktopClasses}`;
    }
    return 'h-12 w-12 md:h-5 md:w-5';
  }
  return `${preset.mobileClasses} md:${preset.desktopClasses}`;
};

// Utility to convert Tailwind size classes to pixel dimensions
const tailwindSizeMap: Record<string, number> = {
  'h-3': 12, 'w-3': 12,
  'h-5': 20, 'w-5': 20, 
  'h-6': 24, 'w-6': 24,
  'h-8': 32, 'w-8': 32,
  'h-11': 44, 'w-11': 44,
  'h-12': 48, 'w-12': 48,
  'h-14': 56, 'w-14': 56,
  'h-16': 64, 'w-16': 64
};

// Helper function to get hotspot pixel dimensions
export const getHotspotPixelDimensions = (size: HotspotSize = defaultHotspotSize, isMobile: boolean = false): { width: number; height: number } => {
  const preset = hotspotSizePresets.find(p => p.value === size);
  if (!preset) {
    // Fallback to small if size not found
    const fallback = hotspotSizePresets.find(p => p.value === 'small');
    const classes = isMobile ? fallback?.mobileClasses || 'h-12 w-12' : fallback?.desktopClasses || 'h-5 w-5';
    return parseClassesToDimensions(classes);
  }
  
  const classes = isMobile ? preset.mobileClasses : preset.desktopClasses;
  return parseClassesToDimensions(classes);
};

// Parse Tailwind classes to pixel dimensions
function parseClassesToDimensions(classes: string): { width: number; height: number } {
  const classArray = classes.split(' ');
  let width = 20; // default fallback
  let height = 20; // default fallback
  
  for (const cls of classArray) {
    if (cls.startsWith('w-') && tailwindSizeMap[cls]) {
      width = tailwindSizeMap[cls];
    }
    if (cls.startsWith('h-') && tailwindSizeMap[cls]) {
      height = tailwindSizeMap[cls];
    }
  }
  
  return { width, height };
}

// Helper function to apply style preset to hotspot
export const applyStylePreset = (currentHotspot: HotspotData, preset: HotspotStylePreset): HotspotData => {
  const updatedHotspot: HotspotData = {
    ...currentHotspot,
    color: preset.style.color, // Always defined in presets
  };

  // Only set optional properties if they are defined in the preset
  if (preset.style.opacity !== undefined) {
    updatedHotspot.opacity = preset.style.opacity;
  }
  if (preset.style.borderWidth !== undefined) {
    updatedHotspot.borderWidth = preset.style.borderWidth;
  }
  if (preset.style.borderColor !== undefined) {
    updatedHotspot.borderColor = preset.style.borderColor;
  }
  if (preset.style.backgroundColor !== undefined) {
    updatedHotspot.backgroundColor = preset.style.backgroundColor;
  }
  if (preset.style.textColor !== undefined) {
    updatedHotspot.textColor = preset.style.textColor;
  }

  return updatedHotspot;
};