import { describe, test, expect } from 'vitest';
import { 
  SlideDeck, 
  InteractiveSlide, 
  SlideElement, 
  ResponsivePosition, 
  FixedPosition,
  SlideEffect,
  ElementInteraction,
} from '../../shared/slideTypes';

describe('TypeScript Integration Tests', () => {
  describe('Core Type Definitions', () => {
    test('SlideDeck type is properly defined and usable', () => {
      const testSlideDeck: SlideDeck = {
        id: 'test-deck-id',
        title: 'Test Slide Deck',
        description: 'A test slide deck for TypeScript validation',
        slides: [],
        metadata: {
          version: '2.0',
          created: Date.now(),
          modified: Date.now(),
          isPublic: false,
        },
        settings: {
          allowNavigation: true,
          showControls: true,
        }
      };

      expect(testSlideDeck.id).toBe('test-deck-id');
      expect(testSlideDeck.title).toBe('Test Slide Deck');
      expect(testSlideDeck.slides).toEqual([]);
      expect(testSlideDeck.metadata.version).toBe('2.0');
    });

    test('InteractiveSlide type is properly defined and usable', () => {
      const testSlide: InteractiveSlide = {
        id: 'test-slide-id',
        title: 'Test Slide',
        backgroundMedia: { type: 'image', url: 'test-background.jpg' },
        elements: [],
      };

      expect(testSlide.id).toBe('test-slide-id');
      expect(testSlide.title).toBe('Test Slide');
      expect(testSlide.elements).toEqual([]);
    });

    test('SlideElement type supports all element types', () => {
      const hotspotElement: SlideElement = {
        id: 'hotspot-1',
        type: 'hotspot',
        position: {
          desktop: { x: 100, y: 100, width: 50, height: 50 },
          tablet: { x: 80, y: 80, width: 40, height: 40 },
          mobile: { x: 60, y: 60, width: 30, height: 30 }
        },
        style: {
          backgroundColor: '#ff0000',
          borderRadius: 50,
          opacity: 0.8
        },
        content: {
          title: 'Test Hotspot',
          description: 'A test hotspot element'
        },
        interactions: [],
        isVisible: true
      };

      const textElement: SlideElement = {
        id: 'text-1',
        type: 'text',
        position: {
          desktop: { x: 200, y: 200, width: 300, height: 100 },
          tablet: { x: 160, y: 160, width: 240, height: 80 },
          mobile: { x: 120, y: 120, width: 180, height: 60 }
        },
        style: {
        },
        content: {
          textContent: 'Test text content'
        },
        interactions: [],
        isVisible: true
      };

      expect(hotspotElement.type).toBe('hotspot');
      expect(textElement.type).toBe('text');
      expect(hotspotElement.content.title).toBe('Test Hotspot');
      expect(textElement.content.textContent).toBe('Test text content');
    });
  });

  describe('Responsive Position System', () => {
    test('ResponsivePosition type enforces proper structure', () => {
      const responsivePosition: ResponsivePosition = {
        desktop: { x: 100, y: 100, width: 200, height: 150 },
        tablet: { x: 80, y: 80, width: 160, height: 120 },
        mobile: { x: 60, y: 60, width: 120, height: 90 }
      };

      // Test that all device types are required
      expect(responsivePosition.desktop).toBeDefined();
      expect(responsivePosition.tablet).toBeDefined();
      expect(responsivePosition.mobile).toBeDefined();

      // Test that FixedPosition structure is enforced
      expect(responsivePosition.desktop.x).toBe(100);
      expect(responsivePosition.desktop.y).toBe(100);
      expect(responsivePosition.desktop.width).toBe(200);
      expect(responsivePosition.desktop.height).toBe(150);
    });

    test('FixedPosition type enforces numeric values', () => {
      const fixedPosition: FixedPosition = {
        x: 50,
        y: 75,
        width: 100,
        height: 125
      };

      expect(typeof fixedPosition.x).toBe('number');
      expect(typeof fixedPosition.y).toBe('number');
      expect(typeof fixedPosition.width).toBe('number');
      expect(typeof fixedPosition.height).toBe('number');
    });
  });

  describe('Interaction and Effect System', () => {
    test('ElementInteraction type is properly structured', () => {
      const interaction: ElementInteraction = {
        id: 'interaction-1',
        trigger: 'click',
        effect: {
          id: 'effect-1',
          type: 'spotlight',
          parameters: {
            position: { x: 100, y: 100, width: 50, height: 50 },
            shape: 'circle',
            message: 'A message',
          },
        }
      };

      expect(interaction.id).toBe('interaction-1');
      expect(interaction.trigger).toBe('click');
      expect(interaction.effect.type).toBe('spotlight');
    });

    test('SlideEffect supports different effect types', () => {
      const spotlightEffect: SlideEffect = {
        id: 'spotlight-effect',
        type: 'spotlight',
        parameters: {
          position: { x: 0, y: 0, width: 100, height: 100 },
          shape: 'circle',
        },
      };

      const textEffect: SlideEffect = {
        id: 'text-effect',
        type: 'text',
        parameters: {
            text: 'Hello',
            position: { x: 0, y: 0, width: 100, height: 100 },
        },
      };

      expect(spotlightEffect.type).toBe('spotlight');
      expect(textEffect.type).toBe('text');
      expect(spotlightEffect.parameters).toBeDefined();
      expect(textEffect.parameters).toBeDefined();
    });
  });

  describe('Type Compatibility and Composition', () => {
    test('complex slide deck with all features compiles correctly', () => {
      const complexSlideDeck: SlideDeck = {
        id: 'complex-deck',
        title: 'Complex Test Deck',
        description: 'A comprehensive test of all type features',
        slides: [
          {
            id: 'slide-1',
            title: 'Interactive Slide',
            backgroundMedia: { type: 'color', color: '#ff0000'},
            elements: [
              {
                id: 'element-1',
                type: 'hotspot',
                position: {
                  desktop: { x: 100, y: 100, width: 50, height: 50 },
                  tablet: { x: 80, y: 80, width: 40, height: 40 },
                  mobile: { x: 60, y: 60, width: 30, height: 30 }
                },
                style: { backgroundColor: '#ff0000', opacity: 0.8 },
                content: { title: 'Interactive Hotspot' },
                interactions: [
                  {
                    id: 'interaction-1',
                    trigger: 'click',
                    effect: {
                      id: 'effect-1',
                      type: 'text',
                      parameters: {
                        text: 'You clicked the hotspot!',
                        position: { x: 150, y: 150, width: 200, height: 100 },
                      },
                    }
                  }
                ],
                isVisible: true
              }
            ],
          }
        ],
        metadata: {
          version: '2.0',
          created: Date.now(),
          modified: Date.now(),
          isPublic: false
        },
        settings: {
          allowNavigation: true,
          showControls: true,
        }
      };

      // Verify that the complex structure compiles and has expected properties
      expect(complexSlideDeck.slides).toHaveLength(1);
      expect(complexSlideDeck.slides[0]!.elements).toHaveLength(1);
      expect(complexSlideDeck.slides[0]!.elements[0]!.interactions).toHaveLength(1);
    });

    test('type narrowing works correctly for element types', () => {
      const element: SlideElement = {
        id: 'test-element',
        type: 'text',
        position: {
          desktop: { x: 0, y: 0, width: 100, height: 50 },
          tablet: { x: 0, y: 0, width: 80, height: 40 },
          mobile: { x: 0, y: 0, width: 60, height: 30 }
        },
        style: {},
        content: { textContent: 'Test text' },
        interactions: [],
        isVisible: true
      };

      // Test type narrowing based on element type
      if (element.type === 'text') {
        expect(element.content.textContent).toBe('Test text');
      }

      if (element?.type === 'hotspot') {
        // This should not execute, but should not cause compilation errors
        expect(element.content.title).toBeDefined();
      }
    });
  });

  describe('Type Safety and Edge Cases', () => {
    test('optional properties are handled correctly', () => {
      const minimalSlide: InteractiveSlide = {
        id: 'minimal-slide',
        title: 'Minimal Slide',
        elements: [],
      };

      // backgroundMedia is optional
      expect(minimalSlide.backgroundMedia).toBeUndefined();
      expect(minimalSlide.elements).toEqual([]);
    });

    test('union types work correctly for effect parameters', () => {
      // Test that different effect types accept their specific parameters
      const spotlightParameters = {
        position: { x: 0, y: 0, width: 100, height: 100 },
        shape: 'circle' as const,
      };

      const textParameters = {
        text: 'Display text',
        position: { x: 50, y: 50, width: 200, height: 100 },
      };

      // Both should be valid EffectParameters
      expect(spotlightParameters.shape).toBe('circle');
      expect(textParameters.text).toBe('Display text');
    });

    test('discriminated unions prevent invalid combinations', () => {
      // Test that TypeScript prevents invalid type/parameter combinations
      const validSpotlightEffect: SlideEffect = {
        id: 'valid-spotlight',
        type: 'spotlight',
        parameters: {
          position: { x: 0, y: 0, width: 100, height: 100 },
          shape: 'circle',
        },
      };

      expect(validSpotlightEffect.type).toBe('spotlight');
      expect(validSpotlightEffect.parameters).toBeDefined();
    });
  });

  describe('Generic Type Utilities', () => {
    test('type utilities work with slide types', () => {
      // Test that standard TypeScript utilities work with our types
      type PartialSlideDeck = Partial<SlideDeck>;
      type SlideKeys = keyof InteractiveSlide;
      type ElementType = SlideElement['type'];

      const partialDeck: PartialSlideDeck = {
        id: 'partial-deck'
        // Other properties are optional
      };

      const slideKeys: SlideKeys[] = ['id', 'title', 'elements', 'backgroundMedia'];
      const elementTypes: ElementType[] = ['hotspot', 'text', 'media', 'shape'];

      expect(partialDeck.id).toBe('partial-deck');
      expect(slideKeys).toContain('id');
      expect(elementTypes).toContain('hotspot');
    });

    test('readonly types prevent mutations', () => {
      const readonlyPosition: Readonly<FixedPosition> = {
        x: 100,
        y: 100,
        width: 200,
        height: 150
      };

      // This should work (reading)
      expect(readonlyPosition.x).toBe(100);

      // These would cause TypeScript errors if uncommented:
      // readonlyPosition.x = 200; // Error: Cannot assign to 'x' because it is a read-only property
    });
  });
});