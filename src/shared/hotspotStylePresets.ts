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

// Size presets with responsive classes
export const hotspotSizePresets: HotspotSizePreset[] = [
  {
    name: 'Extra Small',
    value: 'x-small',
    description: 'For dense layouts or subtle markers',
    mobileClasses: 'h-10 w-10',
    desktopClasses: 'h-2 w-2'
  },
  {
    name: 'Small',
    value: 'small',
    description: 'Compact size for detailed content',
    mobileClasses: 'h-11 w-11',
    desktopClasses: 'h-3 w-3'
  },
  {
    name: 'Medium',
    value: 'medium',
    description: 'Standard size for most content',
    mobileClasses: 'h-12 w-12',
    desktopClasses: 'h-5 w-5'
  },
  {
    name: 'Large',
    value: 'large',
    description: 'Prominent size for important content',
    mobileClasses: 'h-14 w-14',
    desktopClasses: 'h-6 w-6'
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
    return isMobile ? fallback?.mobileClasses || 'h-11 w-11' : fallback?.desktopClasses || 'h-3 w-3';
  }
  return isMobile ? preset.mobileClasses : preset.desktopClasses;
};

// Helper function to apply style preset to hotspot
export const applyStylePreset = (currentHotspot: any, preset: HotspotStylePreset) => {
  return {
    ...currentHotspot,
    color: preset.style.color,
    opacity: preset.style.opacity,
    borderWidth: preset.style.borderWidth,
    borderColor: preset.style.borderColor,
    backgroundColor: preset.style.backgroundColor,
    textColor: preset.style.textColor
  };
};