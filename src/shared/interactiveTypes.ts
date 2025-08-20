import React from 'react';
import { TimelineEventData } from './type-defs';
import { HotspotData } from './types';

// Pan/Zoom Event Interface
export interface PanZoomEvent {
  x: number;
  y: number;
  scale: number;
}

// Common props shared between viewer and editor
export interface InteractiveModuleBaseProps {
  projectName: string;
  backgroundImage: string | null;
  hotspots: HotspotData[];
  timelineEvents: TimelineEventData[];
  onClose: () => void;
}

// Viewer-specific props
export interface ViewerModes {
  explore: boolean;
  selfPaced: boolean;
  timed: boolean;
}

// Editor-specific props
export interface EditorCallbacks {
  onSave: () => Promise<void>;
  onHotspotsChange: (hotspots: HotspotData[]) => void;
  onTimelineEventsChange: (events: TimelineEventData[]) => void;
  onBackgroundImageChange: (image: string | null) => void;
  onBackgroundTypeChange: (type: 'image' | 'video') => void;
  onBackgroundVideoTypeChange: (type: 'upload' | 'youtube') => void;
  onImageUpload: (file: File) => Promise<void>;
}

// Common hotspot position calculation result
export interface HotspotWithPosition extends HotspotData {
  pixelPosition: {
    left: string;
    top: string;
  };
}

// Image dimensions interface
export interface ImageDimensions {
  width: number;
  height: number;
}

// Transform state for viewer
export interface ViewerTransform {
  scale: number;
  translateX: number;
  translateY: number;
  targetHotspotId?: string;
}

// Touch handler interface
export interface TouchHandlers {
  onTouchStart?: (event: React.TouchEvent) => void;
  onTouchMove?: (event: React.TouchEvent) => void;
  onTouchEnd?: (event: React.TouchEvent) => void;
}

// Shared constants
export const EDITOR_ZOOM_LIMITS = {
  MIN: 0.25,
  MAX: 5,
  INCREMENT: 0.05
} as const;

export const VIEWER_SCALE_LIMITS = {
  MIN: 0.5,
  MAX: 3,
  INCREMENT: 0.1
} as const;