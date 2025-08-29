import { SlideDeck, InteractiveSlide } from '../../shared/slideTypes';

export function createDefaultSlideDeck(id: string, title: string): SlideDeck {
  // Create a default first slide so the canvas has something to render
  const defaultSlide: InteractiveSlide = {
    id: `${id}-slide-1`,
    title: 'Slide 1',
    elements: [], // Start with no elements
  };

  return {
    id,
    title,
    slides: [defaultSlide], // Include one default slide instead of empty array
    settings: {
      allowNavigation: true,
      showControls: true,
    },
    metadata: {
      created: Date.now(),
      modified: Date.now(),
      version: '1.0',
      isPublic: false,
    },
  };
}
