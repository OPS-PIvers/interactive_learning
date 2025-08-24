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