import { describe, it, expect } from 'vitest';
import { createDefaultSlideDeck } from '../client/utils/slideDeckUtils';

describe('slideDeckUtils', () => {
  describe('createDefaultSlideDeck', () => {
    it('should create a slide deck with one default slide', () => {
      // Create a new slide deck
      const slideDeck = createDefaultSlideDeck('test-id', 'Test Project');
      
      // Verify basic structure
      expect(slideDeck.id).toBe('test-id');
      expect(slideDeck.title).toBe('Test Project');
      expect(slideDeck.slides).toBeDefined();
      expect(Array.isArray(slideDeck.slides)).toBe(true);
      
      // Critical: Should have exactly one slide (not empty array)
      expect(slideDeck.slides).toHaveLength(1);
      
      // Verify the default slide structure
      const defaultSlide = slideDeck.slides[0]!;
      expect(defaultSlide.id).toBe('test-id-slide-1');
      expect(defaultSlide.title).toBe('Slide 1');
      expect(defaultSlide.elements).toEqual([]);
      expect(defaultSlide.transitions).toEqual([]);
      expect(defaultSlide.layout).toEqual({
        aspectRatio: '16:9',
        backgroundSize: 'cover',
        containerWidth: 1920,
        containerHeight: 1080,
        scaling: 'fit',
        backgroundPosition: 'center center'
      });
      expect(defaultSlide.metadata).toBeDefined();
      expect(defaultSlide.metadata?.version).toBe('1.0');
    });

    it('should create unique slide IDs for different projects', () => {
      const slideDeck1 = createDefaultSlideDeck('project-1', 'Project 1');
      const slideDeck2 = createDefaultSlideDeck('project-2', 'Project 2');
      
      expect(slideDeck1.slides[0]!.id).toBe('project-1-slide-1');
      expect(slideDeck2.slides[0]!.id).toBe('project-2-slide-1');
      expect(slideDeck1.slides[0]!.id).not.toBe(slideDeck2.slides[0]!.id);
    });

    it('should have proper default settings and metadata', () => {
      const slideDeck = createDefaultSlideDeck('test', 'Test');
      
      // Verify settings
      expect(slideDeck.settings).toEqual({
        autoAdvance: false,
        allowNavigation: true,
        showProgress: true,
        showControls: true,
        keyboardShortcuts: true,
        touchGestures: true,
        fullscreenMode: false,
      });
      
      // Verify metadata
      expect(slideDeck.metadata!.version).toBe('1.0');
      expect(slideDeck.metadata!.isPublic).toBe(false);
      expect(typeof slideDeck.metadata!.created).toBe('number');
      expect(typeof slideDeck.metadata!.modified).toBe('number');
    });
  });
});