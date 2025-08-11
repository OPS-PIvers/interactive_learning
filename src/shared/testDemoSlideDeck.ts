import { SlideDeck } from './slideTypes';

/**
 * Enhanced test/demo slide deck with highly visible interactions
 * Specifically designed for Playwright testing and debugging
 */
export const createTestDemoSlideDeck = (): SlideDeck => {
  return {
    id: 'test-demo-slide-deck',
    title: 'Interactive Test Demo - Playwright Ready',
    description: 'Enhanced demo with highly visible interactions for testing and screenshots',
    slides: [
      {
        id: 'test-slide-1',
        title: 'Interactive Elements Test',
        backgroundColor: '#0f172a', // Dark blue background for contrast
        elements: [
          // Large, clearly visible hotspot for click testing
          {
            id: 'large-click-hotspot',
            type: 'hotspot',
            position: {
              desktop: { x: 200, y: 200, width: 60, height: 60 },
              tablet: { x: 150, y: 150, width: 50, height: 50 },
              mobile: { x: 80, y: 120, width: 40, height: 40 }
            },
            content: {
              title: 'Click Me!',
              description: 'Large hotspot that triggers spotlight effect'
            },
            interactions: [
              {
                id: 'large-spotlight',
                trigger: 'click',
                effect: {
                  id: 'spotlight-effect-large',
                  type: 'spotlight',
                  duration: 4000,
                  easing: 'ease-in-out',
                  parameters: {
                    position: { x: 170, y: 170, width: 120, height: 120 },
                    shape: 'circle',
                    intensity: 90,
                    fadeEdges: true,
                    message: 'SPOTLIGHT ACTIVATED! Click effect is working!'
                  }
                }
              }
            ],
            style: {
              backgroundColor: '#ef4444', // Bright red
              borderColor: '#ffffff',
              borderWidth: 3,
              borderRadius: 30,
              opacity: 1,
              animation: {
                type: 'pulse',
                duration: 1500,
                iterationCount: 'infinite'
              }
            },
            isVisible: true
          },
          
          // Pan/Zoom hotspot
          {
            id: 'pan-zoom-hotspot',
            type: 'hotspot',
            position: {
              desktop: { x: 400, y: 300, width: 50, height: 50 },
              tablet: { x: 300, y: 220, width: 45, height: 45 },
              mobile: { x: 150, y: 180, width: 35, height: 35 }
            },
            content: {
              title: 'Pan & Zoom',
              description: 'Click to test pan/zoom functionality'
            },
            interactions: [
              {
                id: 'pan-zoom-effect',
                trigger: 'click',
                effect: {
                  id: 'zoom-effect-test',
                  type: 'pan_zoom',
                  duration: 2500,
                  easing: 'ease-in-out',
                  parameters: {
                    targetPosition: { x: 375, y: 275, width: 100, height: 100 },
                    zoomLevel: 2.0,
                    centerOnTarget: true
                  }
                }
              }
            ],
            style: {
              backgroundColor: '#22c55e', // Bright green
              borderColor: '#ffffff',
              borderWidth: 2,
              borderRadius: 25,
              opacity: 1,
              animation: {
                type: 'bounce',
                duration: 2000,
                iterationCount: 'infinite'
              }
            },
            isVisible: true
          },

          // Text overlay hotspot
          {
            id: 'text-overlay-hotspot',
            type: 'hotspot',
            position: {
              desktop: { x: 600, y: 150, width: 45, height: 45 },
              tablet: { x: 450, y: 120, width: 40, height: 40 },
              mobile: { x: 220, y: 80, width: 35, height: 35 }
            },
            content: {
              title: 'Text Overlay',
              description: 'Shows text overlay effect'
            },
            interactions: [
              {
                id: 'text-overlay-effect',
                trigger: 'click',
                effect: {
                  id: 'text-effect-test',
                  type: 'text',
                  duration: 3500,
                  easing: 'ease-out',
                  parameters: {
                    text: 'TEXT OVERLAY WORKING! This interaction is functioning correctly.',
                    position: { x: 300, y: 400, width: 300, height: 100 },
                    style: {
                      fontSize: 24,
                      color: '#fbbf24',
                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                      padding: 20,
                      borderRadius: 8
                    }
                  }
                }
              }
            ],
            style: {
              backgroundColor: '#3b82f6', // Blue
              borderColor: '#ffffff',
              borderWidth: 2,
              borderRadius: 22,
              opacity: 1,
              animation: {
                type: 'pulse',
                duration: 1800,
                iterationCount: 'infinite'
              }
            },
            isVisible: true
          },

          // Navigation hotspot (goes to slide 2)
          {
            id: 'navigation-hotspot',
            type: 'hotspot',
            position: {
              desktop: { x: 750, y: 500, width: 80, height: 40 },
              tablet: { x: 550, y: 380, width: 70, height: 35 },
              mobile: { x: 240, y: 280, width: 60, height: 30 }
            },
            content: {
              title: 'Next Slide →',
              description: 'Navigate to second slide'
            },
            interactions: [],
            style: {
              backgroundColor: '#8b5cf6', // Purple
              borderColor: '#ffffff',
              borderWidth: 2,
              borderRadius: 8,
              opacity: 1
            },
            isVisible: true
          },

          // Instructional text element
          {
            id: 'instructions-text',
            type: 'text',
            position: {
              desktop: { x: 100, y: 50, width: 600, height: 100 },
              tablet: { x: 50, y: 40, width: 450, height: 80 },
              mobile: { x: 20, y: 30, width: 280, height: 60 }
            },
            content: {
              title: 'Test Instructions',
              description: 'Click the colored hotspots to test different interactions. All effects should be clearly visible.'
            },
            interactions: [],
            style: {
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderColor: '#64748b',
              borderWidth: 1,
              borderRadius: 8,
              opacity: 1
            },
            isVisible: true
          }
        ],
        transitions: [],
        layout: {
          containerWidth: 1000,
          containerHeight: 600,
          aspectRatio: '5:3',
          scaling: 'fit',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }
      },

      // Second slide for navigation testing
      {
        id: 'test-slide-2',
        title: 'Second Test Slide',
        backgroundColor: '#1e293b', // Darker slate
        elements: [
          {
            id: 'success-message',
            type: 'text',
            position: {
              desktop: { x: 200, y: 200, width: 600, height: 150 },
              tablet: { x: 100, y: 150, width: 450, height: 120 },
              mobile: { x: 30, y: 100, width: 260, height: 100 }
            },
            content: {
              title: '✅ Navigation Success!',
              description: 'The slide navigation is working correctly. All interactions are functional.'
            },
            interactions: [],
            style: {
              backgroundColor: 'rgba(34, 197, 94, 0.2)',
              borderColor: '#22c55e',
              borderWidth: 2,
              borderRadius: 12,
              opacity: 1
            },
            isVisible: true
          },

          // Back button
          {
            id: 'back-button',
            type: 'hotspot',
            position: {
              desktop: { x: 100, y: 450, width: 120, height: 40 },
              tablet: { x: 80, y: 350, width: 100, height: 35 },
              mobile: { x: 30, y: 250, width: 80, height: 30 }
            },
            content: {
              title: '← Back to Tests',
              description: 'Return to first slide'
            },
            interactions: [],
            style: {
              backgroundColor: '#10b981',
              borderColor: '#ffffff',
              borderWidth: 2,
              borderRadius: 8,
              opacity: 1
            },
            isVisible: true
          },

          // Visual feedback hotspot
          {
            id: 'feedback-hotspot',
            type: 'hotspot',
            position: {
              desktop: { x: 400, y: 400, width: 200, height: 60 },
              tablet: { x: 300, y: 300, width: 150, height: 50 },
              mobile: { x: 150, y: 200, width: 120, height: 40 }
            },
            content: {
              title: 'Visual Feedback Test',
              description: 'Large visual confirmation'
            },
            interactions: [
              {
                id: 'large-feedback',
                trigger: 'click',
                effect: {
                  id: 'feedback-effect',
                  type: 'spotlight',
                  duration: 2000,
                  parameters: {
                    position: { x: 300, y: 340, width: 300, height: 120 },
                    shape: 'rectangle',
                    intensity: 85,
                    fadeEdges: true
                  }
                }
              }
            ],
            style: {
              backgroundColor: '#f59e0b',
              borderColor: '#ffffff',
              borderWidth: 3,
              borderRadius: 12,
              opacity: 1,
              animation: {
                type: 'pulse',
                duration: 2000,
                iterationCount: 'infinite'
              }
            },
            isVisible: true
          }
        ],
        transitions: [],
        layout: {
          containerWidth: 1000,
          containerHeight: 600,
          aspectRatio: '5:3',
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
      author: 'Test Demo System',
      version: '1.0.0',
      tags: ['test', 'demo', 'playwright', 'interactions'],
      isPublic: false
    }
  };
};