import { SlideDeck } from '../../shared/slideTypes';

export function createDefaultSlideDeck(id: string, title: string): SlideDeck {
  return {
    id,
    title,
    slides: [],
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
