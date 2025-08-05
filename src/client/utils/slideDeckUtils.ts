import { SlideDeck, InteractiveSlide } from '../../shared/slideTypes';

export function createDefaultSlideDeck(id: string, title: string): SlideDeck {
  // Create a default first slide so the canvas has something to render
  const defaultSlide: InteractiveSlide = {
    id: `${id}-slide-1`,
    title: 'Slide 1',
    elements: [], // Start with no elements
    transitions: [],
    layout: {
      aspectRatio: '16:9',
      backgroundSize: 'cover',
      containerWidth: 1920,
      containerHeight: 1080,
      scaling: 'fit',
      backgroundPosition: 'center center'
    },
    metadata: {
      created: Date.now(),
      modified: Date.now(),
      version: '1.0'
    }
  };

  return {
    id,
    title,
    slides: [defaultSlide], // Include one default slide instead of empty array
    settings: {
      autoAdvance: false,
      allowNavigation: true,
      showProgress: true,
      showControls: true,
      keyboardShortcuts: true,
      touchGestures: true,
      fullscreenMode: false,
    },
    metadata: {
      created: Date.now(),
      modified: Date.now(),
      version: '1.0',
      isPublic: false,
    },
  };
}
