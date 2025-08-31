import { HotspotWalkthrough, WalkthroughHotspot } from '../../shared/hotspotTypes';
import { ResponsivePosition } from '../../shared/baseTypes';
import { EffectExecutor, SimpleEffect } from './EffectExecutor';

/**
 * Hotspot utilities for creating and managing walkthrough hotspots
 */

/**
 * Create a default hotspot at the specified position
 */
export function createDefaultHotspot(
  position: ResponsivePosition,
  sequenceIndex: number
): WalkthroughHotspot {
  return {
    id: generateHotspotId(),
    type: 'hotspot',
    position,
    content: {
      title: `Step ${sequenceIndex + 1}`,
      description: 'Click to continue'
    },
    interaction: {
      trigger: 'click',
      effect: {
        type: 'spotlight',
        duration: 3000,
        parameters: { shape: 'circle', intensity: 70 }
      }
    },
    style: {
      color: '#2d3f89', // OPS Primary Blue
      pulseAnimation: true,
      hideAfterTrigger: false,
      size: 'medium'
    },
    sequenceIndex
  };
}

/**
 * Reorder hotspots in a walkthrough
 */
export function reorderHotspots(
  walkthrough: HotspotWalkthrough,
  newSequence: string[]
): HotspotWalkthrough {
  return {
    ...walkthrough,
    sequence: newSequence,
    hotspots: walkthrough.hotspots.map((hotspot, index) => ({
      ...hotspot,
      sequenceIndex: newSequence.indexOf(hotspot.id)
    })),
    updatedAt: Date.now()
  };
}

/**
 * Validate hotspot position within container bounds
 */
export function validateHotspotPosition(
  position: ResponsivePosition,
  containerWidth: number,
  containerHeight: number
): boolean {
  const desktop = position.desktop;
  return (
    desktop.x >= 0 && 
    desktop.y >= 0 && 
    desktop.x + desktop.width <= containerWidth && 
    desktop.y + desktop.height <= containerHeight
  );
}

/**
 * Execute hotspot effect using EffectExecutor
 */
export function executeHotspotEffect(
  hotspot: WalkthroughHotspot,
  effectExecutor: EffectExecutor
): Promise<void> {
  const effect: SimpleEffect = {
    id: `effect_${hotspot.id}`,
    type: hotspot.interaction.effect.type as 'spotlight' | 'text' | 'tooltip',
    duration: hotspot.interaction.effect.duration,
    parameters: hotspot.interaction.effect.parameters
  };
  
  return effectExecutor.executeEffect(effect);
}

/**
 * Create responsive position from click coordinates
 */
export function createResponsivePosition(
  x: number,
  y: number,
  size: 'small' | 'medium' | 'large' = 'medium'
): ResponsivePosition {
  const sizeMap = {
    small: { width: 32, height: 32 },
    medium: { width: 48, height: 48 },
    large: { width: 64, height: 64 }
  };

  const dimensions = sizeMap[size];

  return {
    desktop: { x, y, ...dimensions },
    tablet: { 
      x: x * 0.8, 
      y: y * 0.8, 
      width: dimensions.width * 0.8, 
      height: dimensions.height * 0.8 
    },
    mobile: { 
      x: x * 0.6, 
      y: y * 0.6, 
      width: dimensions.width * 0.6, 
      height: dimensions.height * 0.6 
    }
  };
}

/**
 * Generate unique hotspot ID
 */
export function generateHotspotId(): string {
  return `hotspot_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * Create new empty walkthrough
 */
export function createEmptyWalkthrough(title: string = 'New Walkthrough'): HotspotWalkthrough {
  return {
    id: `walkthrough_${Date.now()}`,
    title,
    description: '',
    backgroundMedia: { type: 'none' },
    hotspots: [],
    sequence: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isPublished: false,
    creatorId: 'anonymous' // User ID will be set when saving
  };
}