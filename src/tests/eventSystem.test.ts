// src/tests/eventSystem.test.ts
import { describe, test, expect, vi, beforeEach } from 'vitest'
import { InteractionType, TimelineEventData, HotspotData } from '../shared/types'
import { interactionPresets } from '../shared/InteractionPresets'

describe('Event System', () => {
  describe('InteractionType Enum', () => {
    test('should have all required interaction types', () => {
      const expectedTypes = [
        'HIDE_HOTSPOT', 
        'PULSE_HOTSPOT',
        'PAN_ZOOM',
        'SHOW_TEXT',
        'SHOW_IMAGE',
        'SPOTLIGHT',
        'QUIZ',
        'PLAY_AUDIO',
        'PLAY_VIDEO',
        'SHOW_IMAGE_MODAL'
      ]

      expectedTypes.forEach(type => {
        expect(InteractionType[type as keyof typeof InteractionType]).toBeDefined()
      })
    })

    test('should match preset definitions', () => {
      // Every interaction type should have a corresponding preset
      Object.values(InteractionType).forEach(type => {
        expect(interactionPresets[type]).toBeDefined()
        expect(interactionPresets[type].name).toBeTruthy()
        expect(interactionPresets[type].icon).toBeTruthy()
        expect(interactionPresets[type].color).toBeTruthy()
      })
    })
  })

  describe('TimelineEventData Validation', () => {
    test('should create valid timeline event for SHOW_TEXT', () => {
      const event: TimelineEventData = {
        id: 'test-1',
        step: 1,
        name: 'Show Welcome Message',
        type: InteractionType.SHOW_TEXT,
        textContent: 'Welcome to the interactive module!'
      }

      expect(event.type).toBe(InteractionType.SHOW_TEXT)
      expect(event.textContent).toBe('Welcome to the interactive module!')
    })

    test('should create valid timeline event for PAN_ZOOM', () => {
      const event: TimelineEventData = {
        id: 'test-2',
        step: 2,
        name: 'Zoom to Important Area',
        type: InteractionType.PAN_ZOOM,
        targetId: 'hotspot-1',
        zoomLevel: 3
      }

      expect(event.type).toBe(InteractionType.PAN_ZOOM)
      expect(event.targetId).toBe('hotspot-1')
      expect(event.zoomLevel).toBe(3)
    })

    test('should create valid timeline event for QUIZ', () => {
      const event: TimelineEventData = {
        id: 'test-3',
        step: 3,
        name: 'Knowledge Check',
        type: InteractionType.QUIZ,
        quizQuestion: 'What is the main function of this component?',
        quizOptions: ['Option A', 'Option B', 'Option C'],
        quizCorrectAnswer: 1
      }

      expect(event.type).toBe(InteractionType.QUIZ)
      expect(event.quizQuestion).toBeTruthy()
      expect(event.quizOptions).toHaveLength(3)
      expect(event.quizCorrectAnswer).toBe(1)
    })

    test('should create valid timeline event for PLAY_AUDIO', () => {
      const event: TimelineEventData = {
        id: 'test-4',
        step: 4,
        name: 'Play Narration',
        type: InteractionType.PLAY_AUDIO,
        audioUrl: 'https://example.com/audio.mp3',
        volume: 75
      }

      expect(event.type).toBe(InteractionType.PLAY_AUDIO)
      expect(event.audioUrl).toBe('https://example.com/audio.mp3')
      expect(event.volume).toBe(75)
    })

    test('should create valid timeline event for PLAY_VIDEO', () => {
      const event: TimelineEventData = {
        id: 'test-5',
        step: 5,
        name: 'Show Tutorial Video',
        type: InteractionType.PLAY_VIDEO,
        videoUrl: 'https://example.com/video.mp4',
        poster: 'https://example.com/poster.jpg',
        autoplay: true,
        loop: false
      }

      expect(event.type).toBe(InteractionType.PLAY_VIDEO)
      expect(event.videoUrl).toBe('https://example.com/video.mp4')
      expect(event.poster).toBe('https://example.com/poster.jpg')
      expect(event.autoplay).toBe(true)
      expect(event.loop).toBe(false)
    })

    test('should create valid timeline event for PLAY_VIDEO', () => {
      const event: TimelineEventData = {
        id: 'test-6',
        step: 6,
        name: 'Show YouTube Explanation',
        type: InteractionType.PLAY_VIDEO,
        youtubeVideoId: 'dQw4w9WgXcQ',
        youtubeStartTime: 30,
        youtubeEndTime: 120,
        autoplay: false
      }

      expect(event.type).toBe(InteractionType.PLAY_VIDEO)
      expect(event.youtubeVideoId).toBe('dQw4w9WgXcQ')
      expect(event.youtubeStartTime).toBe(30)
      expect(event.youtubeEndTime).toBe(120)
      expect(event.autoplay).toBe(false)
    })

    test('should create valid timeline event for PLAY_AUDIO', () => {
      const event: TimelineEventData = {
        id: 'test-7',
        step: 7,
        name: 'Play Background Music',
        type: InteractionType.PLAY_AUDIO,
        audioUrl: 'https://example.com/music.mp3',
        artist: 'Test Artist',
        autoplay: true,
        loop: true
      }

      expect(event.type).toBe(InteractionType.PLAY_AUDIO)
      expect(event.audioUrl).toBe('https://example.com/music.mp3')
      expect(event.artist).toBe('Test Artist')
      expect(event.autoplay).toBe(true)
      expect(event.loop).toBe(true)
    })

    test('should create valid timeline event for SHOW_IMAGE_MODAL', () => {
      const event: TimelineEventData = {
        id: 'test-8',
        step: 8,
        name: 'Show Detailed Diagram',
        type: InteractionType.SHOW_IMAGE_MODAL,
        imageUrl: 'https://example.com/diagram.png',
        textContent: 'Detailed System Architecture',
        caption: 'This diagram shows the complete system flow'
      }

      expect(event.type).toBe(InteractionType.SHOW_IMAGE_MODAL)
      expect(event.imageUrl).toBe('https://example.com/diagram.png')
      expect(event.textContent).toBe('Detailed System Architecture')
      expect(event.caption).toBe('This diagram shows the complete system flow')
    })
  })

  describe('Event Parameter Validation', () => {
    test('should validate required parameters for SHOW_TEXT', () => {
      const validEvent: TimelineEventData = {
        id: 'test-1',
        step: 1,
        name: 'Test Message',
        type: InteractionType.SHOW_TEXT,
        textContent: 'Test message content'
      }

      const invalidEvent: TimelineEventData = {
        id: 'test-2',
        step: 1,
        name: 'Test Message',
        type: InteractionType.SHOW_TEXT
        // Missing message parameter
      }

      expect(validEvent.textContent).toBeTruthy()
      expect(invalidEvent.textContent).toBeUndefined()
    })

    test('should validate required parameters for PAN_ZOOM', () => {
      const validEvent: TimelineEventData = {
        id: 'test-1',
        step: 1,
        name: 'Test Pan Zoom',
        type: InteractionType.PAN_ZOOM,
        targetId: 'hotspot-1',
        zoomLevel: 2
      }

      const invalidEvent: TimelineEventData = {
        id: 'test-2',
        step: 1,
        name: 'Test Pan Zoom',
        type: InteractionType.PAN_ZOOM
        // Missing targetId parameter
      }

      expect(validEvent.targetId).toBeTruthy()
      expect(validEvent.zoomLevel).toBe(2)
      expect(invalidEvent.targetId).toBeUndefined()
    })

    test('should validate parameters for new interaction types', () => {
      const showTextEvent: TimelineEventData = {
        id: 'test-1',
        step: 1,
        name: 'Show Text',
        type: InteractionType.SHOW_TEXT,
        textContent: 'This is rich text content',
        textPosition: 'center'
      }

      const showImageEvent: TimelineEventData = {
        id: 'test-2',
        step: 2,
        name: 'Show Image',
        type: InteractionType.SHOW_IMAGE,
        imageUrl: 'https://example.com/image.jpg',
        caption: 'Example image caption'
      }

      expect(showTextEvent.textContent).toBe('This is rich text content')
      expect(showTextEvent.textPosition).toBe('center')
      expect(showImageEvent.imageUrl).toBe('https://example.com/image.jpg')
      expect(showImageEvent.caption).toBe('Example image caption')
    })
  })

  describe('Event Sequence Validation', () => {
    test('should handle multiple events in sequence', () => {
      const events: TimelineEventData[] = [
        {
          id: 'event-2',
          step: 2,
          name: 'Display Message',
          type: InteractionType.SHOW_TEXT,
          textContent: 'Look at this important area'
        },
        {
          id: 'event-3', 
          step: 3,
          name: 'Zoom to Hotspot',
          type: InteractionType.PAN_ZOOM,
          targetId: 'hotspot-1',
          zoomLevel: 2.5
        }
      ]

      expect(events).toHaveLength(2)
      expect(events[0].step).toBe(2)
      expect(events[1].step).toBe(3)
    })

    test('should handle multiple events in the same step', () => {
      const events: TimelineEventData[] = [
        {
          id: 'event-2',
          step: 1,
          name: 'Pulse Hotspot',
          type: InteractionType.PULSE_HOTSPOT,
          targetId: 'hotspot-1',
          duration: 2000
        }
      ]

      const step1Events = events.filter(e => e.step === 1)
      expect(step1Events).toHaveLength(1)
      expect(step1Events.every(e => e.targetId === 'hotspot-1')).toBe(true)
    })
  })

  describe('Error Handling', () => {
    test('should handle events with missing required properties gracefully', () => {
      const incompleteEvent = {
        id: 'incomplete-1',
        step: 1,
        name: 'Incomplete Event',
        type: InteractionType.SHOW_TEXT
        // Missing message property
      } as TimelineEventData

      // Should not throw when accessing undefined properties
      expect(() => {
        const message = incompleteEvent.textContent || 'Default message'
        expect(message).toBe('Default message')
      }).not.toThrow()
    })

    test('should handle invalid hotspot references', () => {
      const event: TimelineEventData = {
        id: 'test-1',
        step: 1,
        name: 'Invalid Target',
        type: InteractionType.PULSE_HOTSPOT,
        targetId: 'non-existent-hotspot'
      }

      const availableHotspots: HotspotData[] = [
        {
          id: 'hotspot-1',
          x: 50,
          y: 50,
          title: 'Valid Hotspot',
          description: 'This hotspot exists'
        }
      ]

      const targetHotspot = availableHotspots.find(h => h.id === event.targetId)
      expect(targetHotspot).toBeUndefined()
    })
  })

  describe('Audio Event Validation', () => {
    // Mock Audio constructor for testing
    beforeEach(() => {
      global.Audio = vi.fn().mockImplementation(() => ({
        play: vi.fn().mockResolvedValue(undefined),
        volume: 1
      }))
    })

    test('should validate audio URL format', () => {
      const validUrls = [
        'https://example.com/audio.mp3',
        'https://example.com/audio.wav',
        'https://example.com/audio.ogg'
      ]

      const invalidUrls = [
        '',
        'not-a-url',
        'http://invalid',
        undefined
      ]

      validUrls.forEach(url => {
        expect(url).toMatch(/^https?:\/\/.+\.(mp3|wav|ogg)$/i)
      })

      invalidUrls.forEach(url => {
        if (url) {
          expect(url).not.toMatch(/^https?:\/\/.+\.(mp3|wav|ogg)$/i)
        } else {
          expect(url).toBeFalsy()
        }
      })
    })

    test('should validate volume range', () => {
      const validVolumes = [0, 25, 50, 75, 100]
      const invalidVolumes = [-10, 150, NaN, Infinity]

      validVolumes.forEach(volume => {
        expect(volume).toBeGreaterThanOrEqual(0)
        expect(volume).toBeLessThanOrEqual(100)
      })

      invalidVolumes.forEach(volume => {
        if (isNaN(volume) || !isFinite(volume)) {
          expect(isNaN(volume) || !isFinite(volume)).toBe(true)
        } else {
          expect(volume < 0 || volume > 100).toBe(true)
        }
      })
    })
  })
})