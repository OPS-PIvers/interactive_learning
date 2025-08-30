import type { BackgroundMedia, ResponsivePosition } from './baseTypes';

// Simple, focused hotspot data model
export interface HotspotWalkthrough {
  id: string;
  title: string;
  description: string;
  backgroundMedia: BackgroundMedia; // Reuse existing interface
  hotspots: WalkthroughHotspot[];
  sequence: string[]; // Array of hotspot IDs in order
  createdAt: number;
  updatedAt: number;
  isPublished: boolean;
  creatorId: string;
}

export interface WalkthroughHotspot {
  id: string;
  type: 'hotspot';
  position: ResponsivePosition; // Reuse existing positioning
  content: HotspotContent;
  interaction: HotspotInteraction;
  style: HotspotStyle;
  sequenceIndex: number;
}

export interface HotspotContent {
  title?: string;
  description?: string;
  mediaUrl?: string;
}

export interface HotspotInteraction {
  trigger: 'click' | 'hover';
  effect: HotspotEffect;
}

export interface HotspotEffect {
  type: 'spotlight' | 'text' | 'tooltip' | 'video' | 'quiz';
  duration: number;
  parameters: any; // Using any for now, as EffectParameters is not fully defined
}

export interface HotspotStyle {
  color: string;
  pulseAnimation: boolean;
  hideAfterTrigger: boolean;
  size: 'small' | 'medium' | 'large';
}
