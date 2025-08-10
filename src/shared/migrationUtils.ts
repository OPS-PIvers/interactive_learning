import { InteractionType } from './InteractionPresets';
import { SlideDeck, InteractiveSlide, SlideElement, ElementInteraction, SlideEffect, DeviceType, FixedPosition, ResponsivePosition } from './slideTypes';
import { InteractiveModuleState, HotspotData, TimelineEventData } from './types';

export interface ShowTextParameters {
    text: string;
    position: FixedPosition;
    displayMode: 'modal' | 'overlay';
    modalPosition?: 'center' | 'top' | 'bottom' | 'left' | 'right' | 'element';
    style: {
        backgroundColor: string;
        color: string;
        fontSize: number;
        fontWeight: string;
    };
}

/**
 * Migration utilities for converting existing hotspot-based projects to slide format
 * 
 * This ensures existing projects can be seamlessly converted to the new slide-based architecture
 * while preserving all functionality and positioning data.
 */

interface MigrationOptions {
  preserveHotspotIds?: boolean;
  defaultSlideTitle?: string;
  targetDeviceType?: DeviceType;
  canvasWidth?: number;  // Target canvas width for calculations
  canvasHeight?: number; // Target canvas height for calculations
}

export interface MigrationResult {
  slideDeck: SlideDeck;
  warnings: string[];
  elementsConverted: number;
  interactionsConverted: number;
}

/**
 * Convert percentage coordinates to fixed pixel positions
 */
function percentageToPixel(
  percentage: number, 
  containerSize: number, 
  elementSize: number = 40
): number {
  // Convert percentage (0-100) to pixel position
  // Subtract half element size to center the element at the percentage point
  return Math.max(0, (percentage / 100) * containerSize - (elementSize / 2));
}

/**
 * Create responsive position from hotspot percentage coordinates
 */
function createResponsivePosition(
  hotspot: HotspotData,
  options: MigrationOptions
): ResponsivePosition {
  const canvasWidth = options.canvasWidth || 1200;
  const canvasHeight = options.canvasHeight || 800;
  
  // Calculate element size based on hotspot size
  const sizeMap = {
    'x-small': { width: 24, height: 24 },
    small: { width: 32, height: 32 },
    medium: { width: 40, height: 40 },
    large: { width: 48, height: 48 }
  };
  
  const elementSize = sizeMap[hotspot.size || 'medium'];
  
  // Convert percentage to pixels for different device breakpoints
  const desktopPosition: FixedPosition = {
    x: percentageToPixel(hotspot.x, canvasWidth, elementSize.width),
    y: percentageToPixel(hotspot.y, canvasHeight, elementSize.height),
    width: elementSize.width,
    height: elementSize.height
  };
  
  // Scale down for tablet (75% of desktop canvas)
  const tabletCanvasWidth = canvasWidth * 0.75;
  const tabletCanvasHeight = canvasHeight * 0.75;
  const tabletSize = { width: elementSize.width * 0.9, height: elementSize.height * 0.9 };
  
  const tabletPosition: FixedPosition = {
    x: percentageToPixel(hotspot.x, tabletCanvasWidth, tabletSize.width),
    y: percentageToPixel(hotspot.y, tabletCanvasHeight, tabletSize.height),
    width: tabletSize.width,
    height: tabletSize.height
  };
  
  // Scale down for mobile (50% of desktop canvas)
  const mobileCanvasWidth = canvasWidth * 0.5;
  const mobileCanvasHeight = canvasHeight * 0.5;
  const mobileSize = { width: elementSize.width * 0.8, height: elementSize.height * 0.8 };
  
  const mobilePosition: FixedPosition = {
    x: percentageToPixel(hotspot.x, mobileCanvasWidth, mobileSize.width),
    y: percentageToPixel(hotspot.y, mobileCanvasHeight, mobileSize.height),
    width: mobileSize.width,
    height: mobileSize.height
  };
  
  return {
    desktop: desktopPosition,
    tablet: tabletPosition,
    mobile: mobilePosition
  };
}

/**
 * Convert timeline event to slide interaction and effect
 */
function convertTimelineEventToInteraction(
  event: TimelineEventData,
  hotspot: HotspotData,
  options: MigrationOptions
): { interaction: ElementInteraction; effect: SlideEffect } {
  const baseInteraction = {
    id: event.id,
    trigger: 'click' as const,
  };

  let effect: SlideEffect;

  switch (event.type) {
    case InteractionType.SPOTLIGHT:
      effect = {
        id: `effect_${event.id}`,
        type: 'spotlight',
        duration: event.duration || 3000,
        parameters: {
          shape: event.spotlightShape || 'circle',
          position: {
            x: percentageToPixel(event.spotlightX ?? hotspot.x, options.canvasWidth || 1200),
            y: percentageToPixel(event.spotlightY ?? hotspot.y, options.canvasHeight || 800),
            width: event.spotlightWidth || 100,
            height: event.spotlightHeight || 100
          },
          intensity: event.intensity || 80,
          fadeEdges: true,
        }
      };
      break;

    case InteractionType.PAN_ZOOM:
        const targetX = event.targetX ?? hotspot.x;
        const targetY = event.targetY ?? hotspot.y;
        effect = {
            id: `effect_${event.id}`,
            type: 'zoom',
            duration: event.duration || 2000,
            parameters: {
                zoomLevel: event.zoomLevel || 2.0,
                centerOnTarget: true,
                targetPosition: {
                    x: percentageToPixel(targetX, options.canvasWidth || 1200),
                    y: percentageToPixel(targetY, options.canvasHeight || 800),
                    width: 1, // Zoom target is a point
                    height: 1,
                }
            }
        };
        break;

    case InteractionType.SHOW_TEXT:
        const isCentered = event.modalPosition === 'center';
        const position: FixedPosition = isCentered
            ? { x: (options.canvasWidth || 1200) / 2 - 150, y: (options.canvasHeight || 800) / 2 - 50, width: 300, height: 100 }
            : {
                x: event.textX !== undefined ? percentageToPixel(event.textX, options.canvasWidth || 1200) : (options.canvasWidth || 1200) / 2 - 150,
                y: event.textY !== undefined ? percentageToPixel(event.textY, options.canvasHeight || 800) : (options.canvasHeight || 800) / 2 - 50,
                width: event.textWidth || 300,
                height: event.textHeight || 100
            };

        effect = {
            id: `effect_${event.id}`,
            type: 'show_text',
            duration: event.duration || 5000,
            parameters: {
                text: event.message || 'Text content',
                position: position,
                displayMode: isCentered ? 'modal' : 'overlay',
                ...(isCentered && { modalPosition: 'center' as const }),
                style: {
                    backgroundColor: 'rgba(30, 41, 59, 0.95)',
                    color: '#ffffff',
                    fontSize: 16,
                    fontWeight: '500'
                }
            }
        };
        break;

    case InteractionType.PLAY_VIDEO:
    case InteractionType.PLAY_AUDIO:
      effect = {
        id: `effect_${event.id}`,
        type: 'play_media',
        duration: event.duration || 0, // 0 means play until complete
        parameters: {
          mediaUrl: event.videoUrl || event.audioUrl || '',
          mediaType: event.type === InteractionType.PLAY_VIDEO ? 'video' : 'audio',
          autoplay: event.autoplay !== false,
          controls: true,
          loop: false,
          volume: 1.0
        }
      };
      break;

    default:
      // Fallback for unsupported event types
      effect = {
        id: `effect_${event.id}`,
        type: 'show_text',
        duration: 3000,
        parameters: {
          text: `Legacy event: ${event.type}`,
          position: { x: (options.canvasWidth || 1200) / 2 - 150, y: (options.canvasHeight || 800) / 2 - 50, width: 300, height: 100 },
          displayMode: 'modal',
          modalPosition: 'center',
          style: {
            backgroundColor: 'rgba(239, 68, 68, 0.9)',
            color: '#ffffff',
            fontSize: 14,
          }
        }
      };
  }

  return {
    interaction: { ...baseInteraction, effect },
    effect
  };
}

/**
 * Convert hotspot to slide element
 */
function convertHotspotToSlideElement(
  hotspot: HotspotData,
  timelineEvents: TimelineEventData[],
  options: MigrationOptions
): SlideElement {
  // Find timeline events associated with this hotspot
  const relatedEvents = timelineEvents.filter(event => event.targetId === hotspot.id);
  
  // Convert events to interactions
  const interactions: ElementInteraction[] = [];
  const effects: SlideEffect[] = [];
  
  relatedEvents.forEach(event => {
    const { interaction, effect } = convertTimelineEventToInteraction(event, hotspot, options);
    interactions.push(interaction);
    effects.push(effect);
  });
  
  const element: SlideElement = {
    id: options.preserveHotspotIds ? hotspot.id : `element_${hotspot.id}`,
    type: 'hotspot',
    position: createResponsivePosition(hotspot, options),
    style: {
      backgroundColor: hotspot.color || hotspot.backgroundColor || '#3b82f6',
      borderRadius: 9999, // A large number to ensure it's a circle
      zIndex: 10, // SLIDE_CONTENT level from Z_INDEX hierarchy
    },
    content: {
      title: hotspot?.title ?? '',
      description: hotspot?.description ?? '',
    },
    interactions,
    isVisible: true
  };

  return element;
}

/**
 * Main migration function: Convert InteractiveModuleState to SlideDeck
 */
export function migrateProjectToSlides(
  moduleState: InteractiveModuleState,
  projectTitle: string = 'Migrated Project',
  options: MigrationOptions = {}
): MigrationResult {
  const warnings: string[] = [];
  let elementsConverted = 0;
  let interactionsConverted = 0;

  // Set default options
  const migrationOptions: MigrationOptions = {
    preserveHotspotIds: true,
    defaultSlideTitle: `${projectTitle} - Slide 1`,
    targetDeviceType: 'desktop',
    canvasWidth: 1200,
    canvasHeight: 800,
    ...options
  };

  // Validate input data
  if (!moduleState.hotspots || moduleState.hotspots.length === 0) {
    warnings.push('No hotspots found in the project. Creating empty slide.');
  }

  if (!moduleState.timelineEvents || moduleState.timelineEvents.length === 0) {
    warnings.push('No timeline events found. Hotspots will have no interactions.');
  }

  // Convert hotspots to slide elements
  const elements: SlideElement[] = [];
  if (moduleState.hotspots) {
    moduleState.hotspots.forEach(hotspot => {
      const element = convertHotspotToSlideElement(
        hotspot,
        moduleState.timelineEvents || [],
        migrationOptions
      );
      elements.push(element);
      elementsConverted++;
      interactionsConverted += element.interactions.length;
    });
  }

  // Create the main slide
  const slide: InteractiveSlide = {
    id: 'slide_main',
    title: migrationOptions.defaultSlideTitle!,
    elements,
    ...(moduleState.backgroundImage && { backgroundImage: moduleState.backgroundImage }),
    backgroundColor: '#0f172a', // slate-900 to match app theme
    transitions: [],
    layout: {
      containerWidth: migrationOptions.canvasWidth || 1200,
      containerHeight: migrationOptions.canvasHeight || 800,
      aspectRatio: `${migrationOptions.canvasWidth || 1200}/${migrationOptions.canvasHeight || 800}`,
      scaling: 'fit',
      backgroundSize: moduleState.imageFitMode === 'fill' ? 'cover' : (moduleState.imageFitMode || 'cover'),
      backgroundPosition: 'center',
    }
  };

  // Create the slide deck
  const slideDeck: SlideDeck = {
    id: `migrated_${Date.now()}`,
    title: projectTitle,
    description: `Migrated from hotspot-based project: ${projectTitle}`,
    slides: [slide],
    settings: {
      autoAdvance: false,
      autoAdvanceDelay: 5000,
      keyboardShortcuts: true,
      showProgress: true,
      allowNavigation: true, // Replaces allowRestart
      showControls: true,
      touchGestures: true,
      fullscreenMode: false,
    },
    metadata: {
      version: '1.0',
      created: Date.now(),
      modified: Date.now(),
      author: 'Migration Tool',
      isPublic: false,
    }
  };

  return {
    slideDeck,
    warnings,
    elementsConverted,
    interactionsConverted
  };
}

/**
 * Batch migrate multiple projects
 */
export function batchMigrateProjects(
  projects: Array<{ id: string; title: string; moduleState: InteractiveModuleState }>,
  options: MigrationOptions = {}
): Array<{ projectId: string; result: MigrationResult }> {
  return projects.map(project => ({
    projectId: project.id,
    result: migrateProjectToSlides(project.moduleState, project.title, options)
  }));
}

/**
 * Validate migration result
 */
export function validateMigration(result: MigrationResult): {
  isValid: boolean;
  errors: string[];
  recommendations: string[];
} {
  const errors: string[] = [];
  const recommendations: string[] = [];

  // Check if slide deck is valid
  if (!result.slideDeck.slides || result.slideDeck.slides.length === 0) {
    errors.push('Migration resulted in no slides');
  }

  // Check if elements were converted
  if (result.elementsConverted === 0) {
    errors.push('No elements were converted from the original project');
  }

  // Provide recommendations based on warnings
  if (result.warnings.length > 0) {
    recommendations.push('Review migration warnings to ensure all features were preserved');
  }

  if (result.interactionsConverted === 0) {
    recommendations.push('Consider adding interactions to make the slide more engaging');
  }

  return {
    isValid: errors.length === 0,
    errors,
    recommendations
  };
}

/**
 * Export migration summary for logging/debugging
 */
export function getMigrationSummary(result: MigrationResult): string {
  const { slideDeck, warnings, elementsConverted, interactionsConverted } = result;
  
  return `
Migration Summary:
==================
Project: ${slideDeck?.title}
Slides Created: ${slideDeck?.slides?.length}
Elements Converted: ${elementsConverted}
Interactions Converted: ${interactionsConverted}
Warnings: ${warnings?.length}

${warnings?.length > 0 ? `
Warnings:
${warnings.map(w => `- ${w}`).join('\n')}
` : ''}

Slide Details:
${slideDeck?.slides?.map(slide => `
- Slide: ${slide?.title}
  Elements: ${slide?.elements?.length || 0}
  Background: ${slide?.backgroundMedia ? 'Yes' : 'No'}
`).join('')}
`.trim();
}