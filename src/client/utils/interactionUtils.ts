import { ElementInteraction, SlideEffect, SlideElement } from '../../shared/slideTypes';
import { generateEventId } from './generateId';

/**
 * Interaction utilities for ensuring elements have proper interactions
 */

/**
 * Creates a default click interaction for elements that don't have any
 */
export function createDefaultClickInteraction(element: SlideElement): ElementInteraction {
  // Create a default effect based on element type
  let defaultEffect: SlideEffect;

  switch (element.type) {
    case 'hotspot':
      // Default spotlight effect for hotspots
      defaultEffect = {
        id: generateEventId(),
        type: 'spotlight',
        parameters: {
          position: {
            x: element.position?.desktop?.x ?? 0,
            y: element.position?.desktop?.y ?? 0,
            width: element.position?.desktop?.width ?? 100,
            height: element.position?.desktop?.height ?? 100,
          },
          shape: 'circle',
        },
      };
      break;

    case 'text':
      // Default show text effect for text elements
      defaultEffect = {
        id: generateEventId(),
        type: 'text',
        parameters: {
          text: element.content?.textContent || 'Text Element',
          position: element.position?.desktop,
        },
      };
      break;

    default:
      // Default spotlight effect for unknown types
      defaultEffect = {
        id: generateEventId(),
        type: 'spotlight',
        parameters: {
          position: {
            x: element.position?.desktop?.x ?? 0,
            y: element.position?.desktop?.y ?? 0,
            width: element.position?.desktop?.width ?? 100,
            height: element.position?.desktop?.height ?? 100,
          },
          shape: 'circle',
        },
      };
  }

  return {
    id: generateEventId(),
    trigger: 'click',
    effect: defaultEffect,
  };
}

/**
 * Ensures an element has at least one click interaction
 */
export function ensureElementInteractions(element: SlideElement): SlideElement {
  // If element already has a click interaction, return as-is
  const hasClickInteraction = element.interactions?.some(
    interaction => interaction.trigger === 'click'
  );
  
  if (hasClickInteraction) {
    return element;
  }
  
  // Ensure interactions array exists
  if (!element.interactions) {
    element.interactions = [];
  }
  
  // Add default click interaction
  const defaultInteraction = createDefaultClickInteraction(element);
  
  return {
    ...element,
    interactions: [...(element.interactions || []), defaultInteraction]
  };
}

/**
 * Ensures all elements in a slide have proper interactions
 */
export function ensureSlideElementInteractions(elements: SlideElement[]): SlideElement[] {
  return elements.map(ensureElementInteractions);
}