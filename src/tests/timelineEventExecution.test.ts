// src/tests/timelineEventExecution.test.ts
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { InteractionType, TimelineEventData, HotspotData, ImageTransformState } from '../shared/types'

describe('Timeline Event Execution', () => {
  let mockHotspots: HotspotData[]
  let mockTimelineEvents: TimelineEventData[]

  beforeEach(() => {
    mockHotspots = [
      {
        id: 'hotspot-1',
        x: 25,
        y: 25,
        title: 'First Hotspot',
        description: 'Description of first hotspot'
      },
      {
        id: 'hotspot-2', 
        x: 75,
        y: 75,
        title: 'Second Hotspot',
        description: 'Description of second hotspot'
      }
    ]

    mockTimelineEvents = [
      {
        id: 'event-2',
        step: 2,
        name: 'Show Message',
        type: InteractionType.SHOW_TEXT,
        message: 'Welcome to the interactive learning module'
      },
      {
        id: 'event-3',
        step: 3,
        name: 'Zoom to Second Hotspot',
        type: InteractionType.PAN_ZOOM,
        targetId: 'hotspot-2',
        zoomFactor: 3
      }
    ]

    // Mock Audio for PLAY_AUDIO tests
    global.Audio = vi.fn().mockImplementation(() => ({
      play: vi.fn().mockResolvedValue(undefined),
      volume: 1
    }))
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Event Filtering by Step', () => {
    test('should filter events for specific step', () => {
      const step2Events = mockTimelineEvents.filter(event => event.step === 2)
      const step3Events = mockTimelineEvents.filter(event => event.step === 3)

      expect(step2Events).toHaveLength(1)
      expect(step2Events[0].type).toBe(InteractionType.SHOW_TEXT)

      expect(step3Events).toHaveLength(1)
      expect(step3Events[0].type).toBe(InteractionType.PAN_ZOOM)
    })

    test('should handle steps with multiple events', () => {
      const multiEventTimeline: TimelineEventData[] = [
        {
          id: 'event-2',
          step: 1,
          name: 'Pulse Hotspot',
          type: InteractionType.PULSE_HOTSPOT,
          targetId: 'hotspot-1',
          duration: 2000
        },
        {
          id: 'event-3',
          step: 1,
          name: 'Show Message',
          type: InteractionType.SHOW_TEXT,
          message: 'Multiple actions happening simultaneously'
        }
      ]

      const step1Events = multiEventTimeline.filter(event => event.step === 1)
      expect(step1Events).toHaveLength(2)
    })
  })

  describe('Event Target Resolution', () => {
    test('should handle invalid hotspot targets', () => {
      const invalidEvent: TimelineEventData = {
        id: 'invalid-event',
        step: 1,
        name: 'Invalid Target',
        type: InteractionType.PULSE_HOTSPOT,
        targetId: 'non-existent-hotspot'
      }

      const targetHotspot = mockHotspots.find(h => h.id === invalidEvent.targetId)
      expect(targetHotspot).toBeUndefined()
    })
  })

  describe('Pan Zoom Event Processing', () => {
    // Mock functions that would be available in the component
    const mockGetSafeImageBounds = () => ({
      width: 800,
      height: 600,
      left: 50,
      top: 25
    })

    const mockGetSafeViewportCenter = () => ({
      centerX: 400,
      centerY: 300
    })

    const mockGetScaledImageDivDimensions = () => ({
      width: 900,
      height: 700
    })

    test('should calculate pan zoom transform correctly', () => {
      const panZoomEvent = mockTimelineEvents.find(e => e.type === InteractionType.PAN_ZOOM)
      const targetHotspot = mockHotspots.find(h => h.id === panZoomEvent?.targetId)

      expect(panZoomEvent).toBeDefined()
      expect(targetHotspot).toBeDefined()

      if (panZoomEvent && targetHotspot) {
        const imageBounds = mockGetSafeImageBounds()
        const viewportCenter = mockGetSafeViewportCenter()
        const divDimensions = mockGetScaledImageDivDimensions()

        const scale = panZoomEvent.zoomLevel || 2
        const hotspotX = (targetHotspot.x / 100) * imageBounds.width
        const hotspotY = (targetHotspot.y / 100) * imageBounds.height

        // Calculate expected transform values
        const divCenterX = divDimensions.width / 2
        const divCenterY = divDimensions.height / 2
        
        const hotspotOriginalX = imageBounds.left + hotspotX
        const hotspotOriginalY = imageBounds.top + hotspotY
        
        const expectedTranslateX = viewportCenter.centerX - (hotspotOriginalX - divCenterX) * scale - divCenterX
        const expectedTranslateY = viewportCenter.centerY - (hotspotOriginalY - divCenterY) * scale - divCenterY

        const transform: ImageTransformState = {
          scale,
          translateX: expectedTranslateX,
          translateY: expectedTranslateY,
          targetHotspotId: panZoomEvent.targetId
        }

        expect(transform.scale).toBe(3) // zoomFactor from event
        expect(transform.targetHotspotId).toBe('hotspot-2')
        expect(typeof transform.translateX).toBe('number')
        expect(typeof transform.translateY).toBe('number')
      }
    })

    test('should handle zoom event with default zoom factor', () => {
      const eventWithoutZoom: TimelineEventData = {
        id: 'default-zoom',
        step: 1,
        name: 'Default Zoom',
        type: InteractionType.PAN_ZOOM,
        targetId: 'hotspot-1'
        // No zoomFactor specified
      }

      const defaultZoom = eventWithoutZoom.zoomLevel || 2
      expect(defaultZoom).toBe(2)
    })
  })

  describe('Message Event Processing', () => {
    test('should handle SHOW_TEXT events', () => {
      const messageEvent = mockTimelineEvents.find(e => e.type === InteractionType.SHOW_TEXT)
      expect(messageEvent?.textContent).toBe('Welcome to the interactive learning module')

      // Simulate message display state
      let currentMessage: string | null = null
      if (messageEvent?.textContent) {
        currentMessage = messageEvent.textContent
      }

      expect(currentMessage).toBe('Welcome to the interactive learning module')
    })

    test('should handle SHOW_TEXT events', () => {
      const showTextEvent: TimelineEventData = {
        id: 'text-event',
        step: 1,
        name: 'Show Rich Text',
        type: InteractionType.SHOW_TEXT,
        textContent: 'This is rich text content with formatting',
        textPosition: 'center'
      }

      expect(showTextEvent.textContent).toBe('This is rich text content with formatting')
      expect(showTextEvent.textPosition).toBe('center')
    })
  })

  describe('Pulse Event Processing', () => {
    test('should handle PULSE_HOTSPOT with duration', () => {
      const pulseEvent: TimelineEventData = {
        id: 'pulse-event',
        step: 1,
        name: 'Pulse Important Area',
        type: InteractionType.PULSE_HOTSPOT,
        targetId: 'hotspot-1',
        duration: 3000
      }

      expect(pulseEvent.duration).toBe(3000)
      expect(pulseEvent.targetId).toBe('hotspot-1')

      // Test pulse state management
      let pulsingHotspotId: string | null = null
      if (pulseEvent.targetId) {
        pulsingHotspotId = pulseEvent.targetId
      }

      expect(pulsingHotspotId).toBe('hotspot-1')
    })

    test('should handle PULSE_HOTSPOT events', () => {
      const pulseHighlightEvent: TimelineEventData = {
        id: 'pulse-highlight-event',
        step: 1,
        name: 'Pulse with Highlight',
        type: InteractionType.PULSE_HOTSPOT,
        targetId: 'hotspot-2',
        duration: 2500,
        intensity: 80
      }

      expect(pulseHighlightEvent.type).toBe(InteractionType.PULSE_HOTSPOT)
      expect(pulseHighlightEvent.intensity).toBe(80)
    })
  })

  describe('Audio Event Processing', () => {
    test('should handle PLAY_AUDIO events', () => {
      const audioEvent: TimelineEventData = {
        id: 'audio-event',
        step: 1,
        name: 'Play Narration',
        type: InteractionType.PLAY_AUDIO,
        audioUrl: 'https://example.com/narration.mp3',
        volume: 75
      }

      // Simulate audio playback
      if (audioEvent.audioUrl) {
        const mockAudio = new Audio(audioEvent.audioUrl)
        if (audioEvent.volume !== undefined) {
          const normalizedVolume = Math.max(0, Math.min(1, audioEvent.volume / 100))
          mockAudio.volume = normalizedVolume
        }

        expect(mockAudio.volume).toBe(0.75) // 75/100
        expect(global.Audio).toHaveBeenCalledWith('https://example.com/narration.mp3')
      }
    })

    test('should handle audio events with volume bounds checking', () => {
      const testCases = [
        { volume: -10, expected: 0 },
        { volume: 0, expected: 0 },
        { volume: 50, expected: 0.5 },
        { volume: 100, expected: 1 },
        { volume: 150, expected: 1 }
      ]

      testCases.forEach(({ volume, expected }) => {
        const normalizedVolume = Math.max(0, Math.min(1, volume / 100))
        expect(normalizedVolume).toBe(expected)
      })
    })
  })

  describe('New Interaction Type Processing', () => {
    test('should handle SHOW_IMAGE events', () => {
      const imageEvent: TimelineEventData = {
        id: 'image-event',
        step: 1,
        name: 'Display Diagram',
        type: InteractionType.SHOW_IMAGE,
        imageUrl: 'https://example.com/diagram.jpg',
        caption: 'Important system diagram'
      }

      const messageDisplay = `Image: ${imageEvent.imageUrl}${imageEvent.caption ? ` - ${imageEvent.caption}` : ''}`
      expect(messageDisplay).toBe('Image: https://example.com/diagram.jpg - Important system diagram')
    })

    test('should handle QUIZ events', () => {
      const quizEvent: TimelineEventData = {
        id: 'quiz-event',
        step: 1,
        name: 'Knowledge Check',
        type: InteractionType.QUIZ,
        quizQuestion: 'What is the main purpose of this component?',
        quizOptions: ['Display data', 'Process input', 'Handle events', 'All of the above'],
        quizCorrectAnswer: 3
      }

      expect(quizEvent.quizQuestion).toBeTruthy()
      expect(quizEvent.quizOptions).toHaveLength(4)
      expect(quizEvent.quizCorrectAnswer).toBe(3)

      const messageDisplay = `Quiz: ${quizEvent.quizQuestion}`
      expect(messageDisplay).toBe('Quiz: What is the main purpose of this component?')
    })

    test('should handle SPOTLIGHT events', () => {
      const spotlightEvent: TimelineEventData = {
        id: 'spotlight-event',
        step: 1,
        name: 'Focus Attention',
        type: InteractionType.SPOTLIGHT,
        targetId: 'hotspot-1',
        radius: 100,
        intensity: 90
      }

      expect(spotlightEvent.type).toBe(InteractionType.SPOTLIGHT)
      expect(spotlightEvent.radius).toBe(100)
      expect(spotlightEvent.intensity).toBe(90)
    })
  })

  describe('Event State Management', () => {
    test('should handle HIDE_HOTSPOT events', () => {
      const activeDisplayIds = new Set(['hotspot-1', 'hotspot-2'])

      const hideEvent: TimelineEventData = {
        id: 'hide-event',
        step: 1,
        name: 'Hide Hotspot',
        type: InteractionType.HIDE_HOTSPOT,
        targetId: 'hotspot-1'
      }

      if (hideEvent.type === InteractionType.HIDE_HOTSPOT && hideEvent.targetId) {
        activeDisplayIds.delete(hideEvent.targetId)
      }

      expect(activeDisplayIds.has('hotspot-1')).toBe(false)
      expect(activeDisplayIds.has('hotspot-2')).toBe(true)
    })

    test('should manage highlight state', () => {
      let highlightedHotspotId: string | null = null

      const highlightEvent: TimelineEventData = {
        id: 'highlight-event',
        step: 1,
        name: 'Highlight Important Area',
        type: InteractionType.SPOTLIGHT,
        targetId: 'hotspot-2'
      }

      if (highlightEvent.type === InteractionType.SPOTLIGHT && highlightEvent.targetId) {
        highlightedHotspotId = highlightEvent.targetId
      }

      expect(highlightedHotspotId).toBe('hotspot-2')
    })
  })
})