import { describe, test, expect } from 'vitest';
import { 
  SlideDeck, 
  InteractiveSlide, 
  SlideElement, 
  ResponsivePosition, 
  FixedPosition, 
  DeviceType,
  SlideEffect,
  ElementInteraction,
  SlideTransition
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
          autoAdvance: false,
          allowNavigation: true,
          showProgress: true,
          showControls: true,
          keyboardShortcuts: true,
          touchGestures: true,
          fullscreenMode: false,
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
        backgroundImage: 'test-background.jpg',
        elements: [],
        transitions: [],
        layout: {
          aspectRatio: '16:9',
          backgroundSize: 'contain',
          containerWidth: 1920,
          containerHeight: 1080,
          scaling: 'fit',
          backgroundPosition: 'center center'
        }
      };

      expect(testSlide.id).toBe('test-slide-id');
      expect(testSlide.title).toBe('Test Slide');
      expect(testSlide.elements).toEqual([]);
      expect(testSlide.layout.aspectRatio).toBe('16:9');
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
          fontSize: 16,
          color: '#000000',
          fontWeight: 'bold'
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

    test('DeviceType enum is properly defined', () => {
      const desktopDevice: DeviceType = 'desktop';
      const tabletDevice: DeviceType = 'tablet';
      const mobileDevice: DeviceType = 'mobile';

      expect(desktopDevice).toBe('desktop');
      expect(tabletDevice).toBe('tablet');
      expect(mobileDevice).toBe('mobile');

      // Test that only valid device types are allowed
      const validDeviceTypes = ['desktop', 'tablet', 'mobile'];
      expect(validDeviceTypes).toContain(desktopDevice);
      expect(validDeviceTypes).toContain(tabletDevice);
      expect(validDeviceTypes).toContain(mobileDevice);
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
            intensity: 80,
            fadeEdges: true
          },
          duration: 1000
        }
      };

      expect(interaction.id).toBe('interaction-1');
      expect(interaction.trigger).toBe('click');
      expect(interaction.effect.type).toBe('spotlight');
      expect(interaction.effect.duration).toBe(1000);
    });

    test('SlideEffect supports different effect types', () => {
      const spotlightEffect: SlideEffect = {
        id: 'spotlight-effect',
        type: 'spotlight',
        parameters: {
          position: { x: 0, y: 0, width: 100, height: 100 },
          shape: 'circle',
          intensity: 75,
          fadeEdges: true
        },
        duration: 500
      };

      const panZoomEffect: SlideEffect = {
        id: 'pan-zoom-effect',
        type: 'pan_zoom',
        parameters: {
          targetPosition: { x: 200, y: 200, width: 300, height: 200 },
          zoomLevel: 2.0,
          duration: 1500
        },
        duration: 1500
      };

      expect(spotlightEffect.type).toBe('spotlight');
      expect(panZoomEffect.type).toBe('pan_zoom');
      expect(spotlightEffect.parameters).toBeDefined();
      expect(panZoomEffect.parameters).toBeDefined();
    });

    test('SlideTransition type supports navigation transitions', () => {
      const transition: SlideTransition = {
        id: 'transition-1',
        fromSlideId: 'current-slide',
        toSlideId: 'next-slide',
        trigger: 'timer',
        effect: {
          type: 'slide',
          direction: 'left',
          duration: 500
        },
        conditions: [{
          type: 'timeout',
          value: 3000
        }]
      };

      expect(transition.id).toBe('transition-1');
      expect(transition.trigger).toBe('timer');
      expect(transition.toSlideId).toBe('next-slide');
      expect(transition.effect.type).toBe('slide');
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
            backgroundImage: 'background.jpg',
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
                      type: 'show_text',
                      parameters: {
                        text: 'You clicked the hotspot!',
                        position: { x: 150, y: 150, width: 200, height: 100 },
                        style: { fontSize: 14, color: '#000000' }
                      },
                      duration: 2000
                    }
                  }
                ],
                isVisible: true
              }
            ],
            transitions: [
              {
                id: 'auto-transition',
                fromSlideId: 'slide-1',
                toSlideId: 'slide-2',
                trigger: 'timer',
                effect: {
                  type: 'fade',
                  duration: 1000
                },
                conditions: [{
                  type: 'timeout',
                  value: 5000
                }]
              }
            ],
            layout: {
              aspectRatio: '16:9',
              backgroundSize: 'cover',
              containerWidth: 1920,
              containerHeight: 1080,
              scaling: 'fit',
              backgroundPosition: 'center center'
            }
          }
        ],
        metadata: {
          version: '2.0',
          created: Date.now(),
          modified: Date.now(),
          isPublic: false
        },
        settings: {
          autoAdvance: false,
          allowNavigation: true,
          showProgress: true,
          showControls: true,
          keyboardShortcuts: true,
          touchGestures: true,
          fullscreenMode: false,
        }
      };

      // Verify that the complex structure compiles and has expected properties
      expect(complexSlideDeck.slides).toHaveLength(1);
      expect(complexSlideDeck.slides[0]!.elements).toHaveLength(1);
      expect(complexSlideDeck.slides[0]!.elements[0]!.interactions).toHaveLength(1);
      expect(complexSlideDeck.slides[0]!.transitions).toHaveLength(1);
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
        transitions: [],
        layout: {
          aspectRatio: '16:9',
          backgroundSize: 'contain',
          containerWidth: 1920,
          containerHeight: 1080,
          scaling: 'fit',
          backgroundPosition: 'center center'
        }
      };

      // backgroundImage is optional
      expect(minimalSlide.backgroundImage).toBeUndefined();
      expect(minimalSlide.elements).toEqual([]);
    });

    test('union types work correctly for effect parameters', () => {
      // Test that different effect types accept their specific parameters
      const spotlightParameters = {
        position: { x: 0, y: 0, width: 100, height: 100 },
        shape: 'circle' as const,
        intensity: 80,
        fadeEdges: true
      };

      const textParameters = {
        text: 'Display text',
        position: { x: 50, y: 50, width: 200, height: 100 },
        style: { fontSize: 16, color: '#000000' }
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
          intensity: 80,
          fadeEdges: true
        },
        duration: 1000
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

      const slideKeys: SlideKeys[] = ['id', 'title', 'elements', 'transitions', 'layout'];
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