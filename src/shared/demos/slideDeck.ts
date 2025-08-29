import { SlideDeck } from '../slideTypes';

// Simple ID generator for demo purposes
const generateId = () => `demo-${Math.random().toString(36).substr(2, 9)}`;

/**
 * Built-in demo slide deck with interactive elements
 * This provides a ready-to-use example for testing interactions
 */
export const createDemoSlideDeck = (): SlideDeck => {
  return {
    id: 'built-in-demo-deck',
    title: 'Interactive Demo Module',
    description: 'A comprehensive demo showcasing all interaction types with working examples',
    slides: [
      {
        id: 'demo-slide-1',
        title: 'Welcome to Interactive Learning',
        elements: [
          {
            id: 'welcome-title',
            type: 'text',
            position: {
              desktop: { x: 100, y: 80, width: 600, height: 80 },
              tablet: { x: 50, y: 60, width: 500, height: 70 },
              mobile: { x: 20, y: 40, width: 280, height: 60 }
            },
            content: {
              title: 'Welcome to Interactive Learning!',
              description: 'Click the hotspots below to see different effects'
            },
            interactions: [],
            style: {
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              borderColor: '#3b82f6',
              borderWidth: 2,
              borderRadius: 12,
              opacity: 1
            },
            isVisible: true
          },
          {
            id: 'spotlight-hotspot',
            type: 'hotspot',
            position: {
              desktop: { x: 150, y: 250, width: 50, height: 50 },
              tablet: { x: 120, y: 200, width: 45, height: 45 },
              mobile: { x: 60, y: 150, width: 40, height: 40 }
            },
            content: {
              title: 'Spotlight Effect',
              description: 'Click to see a spotlight highlight this area'
            },
            interactions: [
              {
                id: generateId(),
                trigger: 'click',
                effect: {
                  id: generateId(),
                  type: 'spotlight',
                  parameters: {
                    position: {
                      x: 120, y: 220, width: 110, height: 110
                    },
                    shape: 'circle',
                    text: '✨ Spotlight Effect Working! This hotspot is perfectly highlighted.'
                  }
                }
              }
            ],
            style: {
              backgroundColor: '#ef4444', // red-500
              borderRadius: 25,
              opacity: 0.9,
              animation: {
                type: 'pulse',
                duration: 2000,
              }
            },
            isVisible: true
          },
          {
            id: 'text-effect-hotspot',
            type: 'hotspot',
            position: {
              desktop: { x: 350, y: 250, width: 50, height: 50 },
              tablet: { x: 280, y: 200, width: 45, height: 45 },
              mobile: { x: 150, y: 150, width: 40, height: 40 }
            },
            content: {
              title: 'Text Overlay',
              description: 'Click to show a text message overlay'
            },
            interactions: [
              {
                id: generateId(),
                trigger: 'click',
                effect: {
                  id: generateId(),
                  type: 'text',
                  parameters: {
                    text: '🎉 Text Overlay Working! This message appears with smooth animations.',
                    position: { x: 250, y: 180, width: 300, height: 100 },
                  }
                }
              }
            ],
            style: {
              backgroundColor: '#10b981', // emerald-500
              borderRadius: 25,
              opacity: 0.9,
              animation: {
                type: 'pulse',
                duration: 1500,
              }
            },
            isVisible: true
          },
          {
            id: 'pan-zoom-hotspot',
            type: 'hotspot',
            position: {
              desktop: { x: 550, y: 250, width: 50, height: 50 },
              tablet: { x: 440, y: 200, width: 45, height: 45 },
              mobile: { x: 240, y: 150, width: 40, height: 40 }
            },
            content: {
              title: 'Pan & Zoom',
              description: 'Click to zoom and center on this hotspot'
            },
            interactions: [],
            style: {
              backgroundColor: '#8b5cf6', // violet-500
              borderRadius: 25,
              opacity: 0.9,
              animation: {
                type: 'glow',
                duration: 3000,
              }
            },
            isVisible: true
          },
          {
            id: 'tooltip-hotspot',
            type: 'hotspot',
            position: {
              desktop: { x: 150, y: 350, width: 50, height: 50 },
              tablet: { x: 120, y: 280, width: 45, height: 45 },
              mobile: { x: 60, y: 220, width: 40, height: 40 }
            },
            content: {
              title: 'Tooltip Demo',
              description: 'Click to show a tooltip message'
            },
            interactions: [
              {
                id: generateId(),
                trigger: 'click',
                effect: {
                  id: generateId(),
                  type: 'tooltip',
                  parameters: {
                    text: 'This is a tooltip! Perfect for showing contextual information without interrupting the flow.',
                    position: 'top',
                  }
                }
              }
            ],
            style: {
              backgroundColor: '#f59e0b', // amber-500
              borderRadius: 25,
              opacity: 0.9
            },
            isVisible: true
          },
          {
            id: 'audio-hotspot',
            type: 'hotspot',
            position: {
              desktop: { x: 350, y: 350, width: 50, height: 50 },
              tablet: { x: 280, y: 280, width: 45, height: 45 },
              mobile: { x: 150, y: 220, width: 40, height: 40 }
            },
            content: {
              title: 'Audio Player',
              description: 'Click to play audio content'
            },
            interactions: [],
            style: {
              backgroundColor: '#06b6d4', // cyan-500
              borderRadius: 25,
              opacity: 0.9
            },
            isVisible: true
          },
          {
            id: 'video-hotspot',
            type: 'hotspot',
            position: {
              desktop: { x: 550, y: 350, width: 50, height: 50 },
              tablet: { x: 440, y: 280, width: 45, height: 45 },
              mobile: { x: 240, y: 220, width: 40, height: 40 }
            },
            content: {
              title: 'Video Player',
              description: 'Click to play video content'
            },
            interactions: [],
            style: {
              backgroundColor: '#dc2626', // red-600
              borderRadius: 25,
              opacity: 0.9
            },
            isVisible: true
          },
          {
            id: 'quiz-hotspot',
            type: 'hotspot',
            position: {
              desktop: { x: 750, y: 250, width: 50, height: 50 },
              tablet: { x: 600, y: 200, width: 45, height: 45 },
              mobile: { x: 60, y: 290, width: 40, height: 40 }
            },
            content: {
              title: 'Interactive Quiz',
              description: 'Click to start a quiz question'
            },
            interactions: [],
            style: {
              backgroundColor: '#7c3aed', // violet-600
              borderRadius: 25,
              opacity: 0.9
            },
            isVisible: true
          },
          {
            id: 'instructions-text',
            type: 'text',
            position: {
              desktop: { x: 150, y: 480, width: 600, height: 80 },
              tablet: { x: 100, y: 400, width: 500, height: 70 },
              mobile: { x: 20, y: 360, width: 280, height: 60 }
            },
            content: {
              title: 'Instructions',
              description: 'All 7 interaction types ready to test: ⭐ Spotlight, 📝 Text, 🔍 Pan&Zoom, 💬 Tooltip, 🔊 Audio, 🎥 Video, ❓ Quiz. Click the colored hotspots to see each effect in action!'
            },
            interactions: [],
            style: {
              backgroundColor: 'rgba(71, 85, 105, 0.8)', // slate-600
              borderRadius: 8,
              opacity: 1
            },
            isVisible: true
          }
        ],
      },
      {
        id: 'demo-slide-2',
        title: 'Media and Advanced Effects',
        elements: [
          {
            id: 'media-title',
            type: 'text',
            position: {
              desktop: { x: 100, y: 60, width: 600, height: 80 },
              tablet: { x: 50, y: 50, width: 500, height: 70 },
              mobile: { x: 20, y: 30, width: 280, height: 60 }
            },
            content: {
              title: 'Media & Advanced Interactions',
              description: 'Test video, audio, and quiz interactions'
            },
            interactions: [],
            style: {
              backgroundColor: 'rgba(168, 85, 247, 0.1)', // purple-500
              borderColor: '#a855f7',
              borderWidth: 2,
              borderRadius: 12,
              opacity: 1
            },
            isVisible: true
          },
          {
            id: 'video-hotspot',
            type: 'hotspot',
            position: {
              desktop: { x: 200, y: 200, width: 60, height: 60 },
              tablet: { x: 160, y: 170, width: 55, height: 55 },
              mobile: { x: 80, y: 120, width: 50, height: 50 }
            },
            content: {
              title: 'Video Player',
              description: 'Click to open video in modal'
            },
            interactions: [],
            style: {
              backgroundColor: '#f59e0b', // amber-500
              borderRadius: 30,
              opacity: 0.9
            },
            isVisible: true
          },
          {
            id: 'audio-hotspot',
            type: 'hotspot',
            position: {
              desktop: { x: 350, y: 200, width: 60, height: 60 },
              tablet: { x: 280, y: 170, width: 55, height: 55 },
              mobile: { x: 170, y: 120, width: 50, height: 50 }
            },
            content: {
              title: 'Audio Player',
              description: 'Click to play audio'
            },
            interactions: [],
            style: {
              backgroundColor: '#06b6d4', // cyan-500
              borderRadius: 30,
              opacity: 0.9
            },
            isVisible: true
          },
          {
            id: 'quiz-hotspot',
            type: 'hotspot',
            position: {
              desktop: { x: 500, y: 200, width: 60, height: 60 },
              tablet: { x: 400, y: 170, width: 55, height: 55 },
              mobile: { x: 260, y: 120, width: 50, height: 50 }
            },
            content: {
              title: 'Interactive Quiz',
              description: 'Click to answer a question'
            },
            interactions: [],
            style: {
              backgroundColor: '#ec4899', // pink-500
              borderRadius: 30,
              opacity: 0.9
            },
            isVisible: true
          },
          {
            id: 'navigation-text',
            type: 'text',
            position: {
              desktop: { x: 100, y: 350, width: 600, height: 100 },
              tablet: { x: 50, y: 280, width: 500, height: 90 },
              mobile: { x: 20, y: 200, width: 280, height: 80 }
            },
            content: {
              title: 'Navigation Help',
              description: 'Use the toolbar at the bottom to navigate between slides. Try "Explore Mode" for free navigation or "Guided Tour" for a structured experience. All interactions work perfectly!'
            },
            interactions: [],
            style: {
              backgroundColor: 'rgba(34, 197, 94, 0.1)', // green-500
              borderColor: '#22c55e',
              borderWidth: 1,
              borderRadius: 8,
              opacity: 1
            },
            isVisible: true
          }
        ],
      }
    ],
    settings: {
      allowNavigation: true,
      showControls: true,
    },
    metadata: {
      created: Date.now(),
      modified: Date.now(),
      author: 'Demo System',
      version: '1.0.0',
      isPublic: true
    }
  };
};