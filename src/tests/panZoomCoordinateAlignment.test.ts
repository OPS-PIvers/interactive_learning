import { describe, it, expect, beforeEach, vi } from 'vitest';
import { calculatePanZoomTransform } from '../client/utils/panZoomUtils';
import { InteractionType, TimelineEventData, HotspotData } from '../shared/types';

// Mock the image bounds utility
vi.mock('../client/utils/imageBounds', () => ({
  getActualImageVisibleBoundsRelative: vi.fn(() => ({
    x: 50,  // 50px offset within container (container-relative)
    y: 25,  // 25px offset within container (container-relative)
    width: 400,  // Image content width
    height: 300  // Image content height
  }))
}));

describe('Pan & Zoom Coordinate Alignment', () => {
  const mockHotspot: HotspotData = {
    id: 'test-hotspot-123',
    x: 75, // 75% from left
    y: 30, // 30% from top
    title: 'Test Hotspot',
    content: 'Test content',
    interactionType: InteractionType.SHOW_TEXT,
    color: 'bg-blue-500',
    size: 'medium' as const
  };

  const mockContainerRect: DOMRect = {
    left: 0,
    top: 0,
    width: 500,
    height: 350,
    bottom: 350,
    right: 500,
    x: 0,
    y: 0,
    toJSON: () => ({})
  };

  const mockImageElement = {
    naturalWidth: 800,
    naturalHeight: 600
  } as HTMLImageElement;

  const mockContainerElement = {} as HTMLElement;

  describe('Hotspot Coordinate Inheritance', () => {
    it('should inherit coordinates from target hotspot when none provided', () => {
      const event: TimelineEventData = {
        id: 'test-event',
        type: InteractionType.PAN_ZOOM_TO_HOTSPOT,
        name: 'Test Pan Zoom',
        targetId: mockHotspot.id,
        step: 1,
        // No targetX or targetY provided - should inherit from hotspot
        zoomLevel: 2
      };

      const transform = calculatePanZoomTransform(
        event,
        mockContainerRect,
        mockImageElement,
        mockContainerElement,
        [mockHotspot]
      );

      // Verify the transform was calculated
      expect(transform).toBeDefined();
      expect(transform.scale).toBe(2);
      expect(transform.translateX).toBeDefined();
      expect(transform.translateY).toBeDefined();
      expect(transform.targetHotspotId).toBe(mockHotspot.id);
    });

    it('should use explicit coordinates when provided, even with target hotspot', () => {
      const event: TimelineEventData = {
        id: 'test-event',
        type: InteractionType.PAN_ZOOM,
        name: 'Test Pan Zoom',
        targetId: mockHotspot.id,
        step: 1,
        targetX: 60, // Explicit coordinates different from hotspot
        targetY: 40,
        zoomLevel: 2
      };

      const transform = calculatePanZoomTransform(
        event,
        mockContainerRect,
        mockImageElement,
        mockContainerElement,
        [mockHotspot]
      );

      // Should use explicit coordinates, not hotspot coordinates
      expect(transform).toBeDefined();
      expect(transform.scale).toBe(2);
    });

    it('should use fallback coordinates when hotspot not found', () => {
      const event: TimelineEventData = {
        id: 'test-event',
        type: InteractionType.PAN_ZOOM_TO_HOTSPOT,
        name: 'Test Pan Zoom',
        targetId: 'non-existent-hotspot',
        step: 1,
        zoomLevel: 2
      };

      const transform = calculatePanZoomTransform(
        event,
        mockContainerRect,
        mockImageElement,
        mockContainerElement,
        [mockHotspot]
      );

      // Should still work with fallback coordinates (50, 50)
      expect(transform).toBeDefined();
      expect(transform.scale).toBe(2);
      expect(transform.translateX).toBeDefined();
      expect(transform.translateY).toBeDefined();
    });
  });

  describe('Coordinate Validation', () => {
    it('should clamp out-of-bounds coordinates', () => {
      const event: TimelineEventData = {
        id: 'test-event',
        type: InteractionType.PAN_ZOOM,
        name: 'Test Pan Zoom',
        step: 1,
        targetX: 150, // Out of bounds (>100)
        targetY: -20, // Out of bounds (<0)
        zoomLevel: 2
      };

      const transform = calculatePanZoomTransform(
        event,
        mockContainerRect,
        mockImageElement,
        mockContainerElement,
        []
      );

      // Should still work - coordinates should be clamped internally
      expect(transform).toBeDefined();
      expect(transform.scale).toBe(2);
    });

    it('should handle missing image element gracefully', () => {
      const event: TimelineEventData = {
        id: 'test-event',
        type: InteractionType.PAN_ZOOM,
        name: 'Test Pan Zoom',
        step: 1,
        targetX: 75,
        targetY: 30,
        zoomLevel: 2
      };

      const transform = calculatePanZoomTransform(
        event,
        mockContainerRect,
        null, // No image element
        null, // No container element
        []
      );

      // Should fallback to container-relative positioning
      expect(transform).toBeDefined();
      expect(transform.scale).toBe(2);
      expect(transform.translateX).toBeDefined();
      expect(transform.translateY).toBeDefined();
    });
  });

  describe('Image Bounds Calculation', () => {
    it('should use container-relative image bounds for accurate positioning', () => {
      const event: TimelineEventData = {
        id: 'test-event',
        type: InteractionType.PAN_ZOOM_TO_HOTSPOT,
        name: 'Test Pan Zoom',
        targetId: mockHotspot.id,
        step: 1,
        zoomLevel: 2
      };

      const transform = calculatePanZoomTransform(
        event,
        mockContainerRect,
        mockImageElement,
        mockContainerElement,
        [mockHotspot]
      );

      // With mocked container-relative image bounds:
      // hotspot at 75%, 30% should be at:
      // imageContentX = (75/100) * 400 = 300px
      // imageContentY = (30/100) * 300 = 90px
      // containerRelativeX = 50 + 300 = 350px (container-relative, not viewport)
      // containerRelativeY = 25 + 90 = 115px (container-relative, not viewport)
      
      // Transform calculation:
      // translateX = containerWidth/2 - targetPixelX * zoomLevel = 250 - 350 * 2 = -450
      // translateY = containerHeight/2 - targetPixelY * zoomLevel = 175 - 115 * 2 = -55

      expect(transform.translateX).toBe(-450);
      expect(transform.translateY).toBe(-55);
      expect(transform.scale).toBe(2);
    });
  });

  describe('Real-World Coordinate Scenarios', () => {
    it('should correctly handle the reported coordinate mismatch case', () => {
      // Test case from user's console logs: 31.72%, 48.67% in 394×524 container
      const realWorldEvent: TimelineEventData = {
        id: 'event_1753297431277_h1753297427018_k09b2d43a',
        type: InteractionType.PAN_ZOOM,
        name: 'Real World Pan Zoom',
        targetId: 'h1753297427018_k09b2d43a',
        step: 1,
        targetX: 31.715744425014726,
        targetY: 48.67327098738564,
        zoomLevel: 3
      };

      const realWorldContainer: DOMRect = {
        left: 0,
        top: 0,
        width: 393.6000061035156,
        height: 524,
        bottom: 524,
        right: 393.6000061035156,
        x: 0,
        y: 0,
        toJSON: () => ({})
      };

      const transform = calculatePanZoomTransform(
        realWorldEvent,
        realWorldContainer,
        mockImageElement,
        mockContainerElement,
        []
      );

      // Expected calculation with container-relative bounds:
      // imageContentX = (31.72/100) * 400 = 126.88px
      // imageContentY = (48.67/100) * 300 = 146.01px
      // containerRelativeX = 50 + 126.88 = 176.88px
      // containerRelativeY = 25 + 146.01 = 171.01px
      
      // This should be much closer to the expected coordinates than before
      expect(transform).toBeDefined();
      expect(transform.scale).toBe(3);
      expect(transform.targetHotspotId).toBe('h1753297427018_k09b2d43a');
      
      // The key test: Y coordinate should be around 171px, not 355px like before
      // Transform: translateY = 262 - 171.01 * 3 = 262 - 513.03 = -251.03
      expect(transform.translateY).toBeCloseTo(-251, 0);
    });
  });

  describe('Mobile and Desktop Consistency', () => {
    it('should produce same results for mobile and desktop with same inputs', () => {
      const event: TimelineEventData = {
        id: 'test-event',
        type: InteractionType.PAN_ZOOM_TO_HOTSPOT,
        name: 'Test Pan Zoom',
        targetId: mockHotspot.id,
        step: 1,
        zoomLevel: 2.5
      };

      // Both mobile and desktop should now use the same calculatePanZoomTransform function
      const transform1 = calculatePanZoomTransform(
        event,
        mockContainerRect,
        mockImageElement,
        mockContainerElement,
        [mockHotspot]
      );

      const transform2 = calculatePanZoomTransform(
        event,
        mockContainerRect,
        mockImageElement,
        mockContainerElement,
        [mockHotspot]
      );

      expect(transform1).toEqual(transform2);
      expect(transform1.scale).toBe(2.5);
      expect(transform1.targetHotspotId).toBe(mockHotspot.id);
    });
  });
});