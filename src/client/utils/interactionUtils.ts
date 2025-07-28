import { ElementInteraction, SlideEffect, SlideElement } from '../../shared/slideTypes';
import { generateId } from './generateId';

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
        id: generateId('effect'),
        type: 'spotlight',
        duration: 3000,
        parameters: {
          spotlightRadius: 100,
          spotlightX: element.position.desktop.x + element.position.desktop.width / 2,
          spotlightY: element.position.desktop.y + element.position.desktop.height / 2,
          dimOpacity: 0.7
        },
        easing: 'easeInOut'
      };
      break;
      
    case 'text':
      // Default show text effect for text elements
      defaultEffect = {
        id: generateId('effect'),
        type: 'show_text',
        duration: 5000,
        parameters: {
          text: element.content.title || element.content.description || 'Text Element',
          position: element.position.desktop,
          style: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: 16,
            borderRadius: 8,
            fontSize: '16px'
          }
        },
        easing: 'easeInOut'
      };
      break;
      
    case 'media':
      // Default play media effect for media elements
      if (element.content.mediaUrl) {
        defaultEffect = {
          id: generateId('effect'),
          type: 'play_media',
          duration: 0, // Duration depends on media
          parameters: {
            mediaType: element.content.mediaType || 'image',
            mediaUrl: element.content.mediaUrl,
            autoplay: true,
            controls: true
          },
          easing: 'easeInOut'
        };
      } else {
        // Fallback to spotlight if no media URL
        defaultEffect = {
          id: generateId('effect'),
          type: 'spotlight',
          duration: 3000,
          parameters: {
            spotlightRadius: 100,
            spotlightX: element.position.desktop.x + element.position.desktop.width / 2,
            spotlightY: element.position.desktop.y + element.position.desktop.height / 2,
            dimOpacity: 0.7
          },
          easing: 'easeInOut'
        };
      }
      break;
      
    default:
      // Default spotlight effect for unknown types
      defaultEffect = {
        id: generateId('effect'),
        type: 'spotlight',
        duration: 3000,
        parameters: {
          spotlightRadius: 100,
          spotlightX: element.position.desktop.x + element.position.desktop.width / 2,
          spotlightY: element.position.desktop.y + element.position.desktop.height / 2,
          dimOpacity: 0.7
        },
        easing: 'easeInOut'
      };
  }
  
  return {
    id: generateId('interaction'),
    trigger: 'click',
    effect: defaultEffect
  };
}

/**
 * Ensures an element has at least one click interaction
 */
export function ensureElementInteractions(element: SlideElement): SlideElement {
  // If element already has a click interaction, return as-is
  const hasClickInteraction = element.interactions.some(
    interaction => interaction.trigger === 'click'
  );
  
  if (hasClickInteraction) {
    return element;
  }
  
  // Add default click interaction
  const defaultInteraction = createDefaultClickInteraction(element);
  
  return {
    ...element,
    interactions: [...element.interactions, defaultInteraction]
  };
}

/**
 * Ensures all elements in a slide have proper interactions
 */
export function ensureSlideElementInteractions(elements: SlideElement[]): SlideElement[] {
  return elements.map(ensureElementInteractions);
}