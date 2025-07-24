import { SlideDeck } from '../../../shared/slideTypes';

/**
 * Demo slide deck to test the new slide-based architecture
 * 
 * This demonstrates how the fixed positioning eliminates coordinate alignment issues
 */
export const createDemoSlideDeck = (): SlideDeck => {
  return {
    id: 'demo-slide-deck',
    title: 'AI Studio Demo - Slide Based',
    description: 'Testing the new slide-based architecture for precise positioning',
    slides: [
      {
        id: 'slide-1',
        title: 'Welcome to AI Studio',
        backgroundImage: '', // We'll use the same AI Studio image
        backgroundColor: '#f8fafc',
        elements: [
          {
            id: 'welcome-hotspot',
            type: 'hotspot',
            position: {
              // Fixed positions for each device type - no more percentage calculations
              desktop: { x: 720, y: 350, width: 40, height: 40 },
              tablet: { x: 540, y: 280, width: 36, height: 36 },
              mobile: { x: 160, y: 200, width: 32, height: 32 }
            },
            content: {
              title: 'Welcome Hotspot',
              description: 'This hotspot is precisely positioned using fixed coordinates'
            },
            interactions: [
              {
                id: 'welcome-spotlight',
                trigger: 'click',
                effect: {
                  id: 'spotlight-effect-1',
                  type: 'spotlight',
                  duration: 3000,
                  easing: 'ease-in-out',
                  parameters: {
                    // Exact spotlight position - no coordinate calculation needed
                    position: {
                      x: 680, y: 310, width: 120, height: 120
                    },
                    shape: 'circle',
                    intensity: 80,
                    fadeEdges: true,
                    message: 'Perfect alignment! The spotlight is exactly centered on the hotspot.'
                  }
                }
              }
            ],
            style: {
              backgroundColor: '#3b82f6',
              borderRadius: 20,
              opacity: 0.9,
              animation: {
                type: 'pulse',
                duration: 2000,
                iterationCount: 'infinite'
              }
            },
            isVisible: true
          },
          {
            id: 'bottom-left-hotspot',
            type: 'hotspot',
            position: {
              desktop: { x: 100, y: 600, width: 40, height: 40 },
              tablet: { x: 80, y: 480, width: 36, height: 36 },
              mobile: { x: 30, y: 300, width: 32, height: 32 }
            },
            content: {
              title: 'Pan & Zoom Hotspot',
              description: 'Click to test pan/zoom centering'
            },
            interactions: [
              {
                id: 'pan-zoom-interaction',
                trigger: 'click',
                effect: {
                  id: 'zoom-effect-1',
                  type: 'zoom',
                  duration: 2000,
                  easing: 'ease-in-out',
                  parameters: {
                    targetPosition: {
                      x: 80, y: 580, width: 80, height: 80
                    },
                    zoomLevel: 2.5,
                    centerOnTarget: true
                  }
                }
              }
            ],
            style: {
              backgroundColor: '#8b5cf6',
              borderRadius: 20,
              opacity: 0.9,
              animation: {
                type: 'pulse',
                duration: 2500,
                iterationCount: 'infinite'
              }
            },
            isVisible: true
          }
        ],
        transitions: [],
        layout: {
          containerWidth: 1200,
          containerHeight: 800,
          aspectRatio: '3:2',
          scaling: 'fit',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }
      },
      {
        id: 'slide-2',
        title: 'Comparison Results',
        backgroundColor: '#1e293b',
        elements: [
          {
            id: 'results-text',
            type: 'text',
            position: {
              desktop: { x: 200, y: 150, width: 800, height: 200 },
              tablet: { x: 100, y: 120, width: 600, height: 180 },
              mobile: { x: 20, y: 80, width: 280, height: 160 }
            },
            content: {
              title: 'Slide-Based Architecture Results',
              description: '✅ Perfect positioning alignment\n✅ No coordinate calculation errors\n✅ Predictable behavior across devices\n✅ Easier debugging and maintenance'
            },
            interactions: [],
            style: {
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: 12,
              opacity: 1
            },
            isVisible: true
          },
          {
            id: 'back-button',
            type: 'hotspot',
            position: {
              desktop: { x: 100, y: 700, width: 120, height: 40 },
              tablet: { x: 80, y: 520, width: 100, height: 36 },
              mobile: { x: 20, y: 350, width: 80, height: 32 }
            },
            content: {
              title: 'Back to Demo',
              description: 'Return to first slide'
            },
            interactions: [
              {
                id: 'back-transition',
                trigger: 'click',
                effect: {
                  id: 'transition-back',
                  type: 'transition',
                  duration: 500,
                  parameters: {
                    targetSlideId: 'slide-1',
                    direction: 'previous',
                    transitionType: 'slide'
                  }
                }
              }
            ],
            style: {
              backgroundColor: '#10b981',
              borderRadius: 8,
              opacity: 0.9
            },
            isVisible: true
          }
        ],
        transitions: [],
        layout: {
          containerWidth: 1200,
          containerHeight: 800,
          aspectRatio: '3:2',
          scaling: 'fit',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }
      }
    ],
    settings: {
      autoAdvance: false,
      allowNavigation: true,
      showProgress: true,
      showControls: true,
      keyboardShortcuts: true,
      touchGestures: true,
      fullscreenMode: false
    },
    metadata: {
      created: Date.now(),
      modified: Date.now(),
      author: 'Slide Architecture Demo',
      version: '1.0.0',
      tags: ['demo', 'architecture', 'positioning'],
      isPublic: false
    }
  };
};

/**
 * Convert the current AI Studio demo to slide format
 */
export const convertAIStudioToSlides = (aiStudioImageUrl: string): SlideDeck => {
  const deck = createDemoSlideDeck();
  
  // Update the background image
  deck.slides[0].backgroundImage = aiStudioImageUrl;
  
  // Adjust hotspot positions to match the actual AI Studio interface
  // These positions are based on the screenshots provided
  const welcomeHotspot = deck.slides[0].elements.find(el => el.id === 'welcome-hotspot');
  const bottomLeftHotspot = deck.slides[0].elements.find(el => el.id === 'bottom-left-hotspot');
  
  if (welcomeHotspot) {
    // Position the blue hotspot exactly under "Welcome to AI Studio" text
    welcomeHotspot.position = {
      desktop: { x: 720, y: 360, width: 30, height: 30 },
      tablet: { x: 540, y: 290, width: 26, height: 26 },
      mobile: { x: 160, y: 220, width: 22, height: 22 }
    };
    
    // Update spotlight to center exactly on this position
    const spotlightEffect = welcomeHotspot.interactions[0].effect;
    if (spotlightEffect.type === 'spotlight') {
      (spotlightEffect.parameters as any).position = {
        x: 705, y: 345, width: 60, height: 60  // Centered on hotspot
      };
    }
  }
  
  if (bottomLeftHotspot) {
    // Position the purple hotspot in bottom-left area
    bottomLeftHotspot.position = {
      desktop: { x: 50, y: 650, width: 30, height: 30 },
      tablet: { x: 40, y: 500, width: 26, height: 26 },
      mobile: { x: 25, y: 320, width: 22, height: 22 }
    };
    
    // Update zoom to center exactly on this position
    const zoomEffect = bottomLeftHotspot.interactions[0].effect;
    if (zoomEffect.type === 'zoom') {
      (zoomEffect.parameters as any).targetPosition = {
        x: 35, y: 635, width: 60, height: 60  // Centered on hotspot
      };
    }
  }
  
  return deck;
};