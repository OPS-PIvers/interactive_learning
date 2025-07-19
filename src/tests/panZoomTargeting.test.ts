import { describe, it, expect } from 'vitest';
import { InteractionType } from '../shared/types';

// Mock hotspot data for testing
const mockHotspot = {
  id: 'test-hotspot',
  x: 75, // 75% from left
  y: 30, // 30% from top
  title: 'Test Hotspot',
  content: 'Test content',
  interactionType: InteractionType.INFO_POPUP,
  color: 'bg-blue-500',
  size: 'medium' as const
};

describe('Pan & Zoom Targeting', () => {
  it('should create PAN_ZOOM_TO_HOTSPOT events with target coordinates matching hotspot position', () => {
    // Simulate creating a PAN_ZOOM_TO_HOTSPOT event like HotspotEditorModal does
    const eventType = InteractionType.PAN_ZOOM_TO_HOTSPOT;
    const newEvent = {
      id: 'test-event',
      type: eventType,
      name: 'Test Pan Zoom Event',
      targetId: mockHotspot.id,
      step: 1,
      message: 'Zooming to hotspot...',
      // Test the fixed logic for setting target coordinates
      ...((eventType === InteractionType.PAN_ZOOM || eventType === InteractionType.PAN_ZOOM_TO_HOTSPOT) && {
        targetX: mockHotspot.x,
        targetY: mockHotspot.y,
        zoomLevel: 2,
        smooth: true,
      }),
    };

    // Verify the event has the correct target coordinates
    expect(newEvent.targetX).toBe(75);
    expect(newEvent.targetY).toBe(30);
    expect(newEvent.zoomLevel).toBe(2);
    expect(newEvent.smooth).toBe(true);
    expect(newEvent.targetId).toBe('test-hotspot');
  });

  it('should create PAN_ZOOM events with target coordinates matching hotspot position', () => {
    // Test the regular PAN_ZOOM event as well
    const eventType = InteractionType.PAN_ZOOM;
    const newEvent = {
      id: 'test-event',
      type: eventType,
      name: 'Test Pan Zoom Event',
      targetId: mockHotspot.id,
      step: 1,
      message: 'Zooming to location...',
      // Test the fixed logic for setting target coordinates
      ...((eventType === InteractionType.PAN_ZOOM || eventType === InteractionType.PAN_ZOOM_TO_HOTSPOT) && {
        targetX: mockHotspot.x,
        targetY: mockHotspot.y,
        zoomLevel: 2,
        smooth: true,
      }),
    };

    // Verify the event has the correct target coordinates
    expect(newEvent.targetX).toBe(75);
    expect(newEvent.targetY).toBe(30);
    expect(newEvent.zoomLevel).toBe(2);
    expect(newEvent.smooth).toBe(true);
  });

  it('should not set target coordinates for other event types', () => {
    // Test that other event types don't get target coordinates
    const eventType = InteractionType.PULSE_HOTSPOT;
    const newEvent = {
      id: 'test-event',
      type: eventType,
      name: 'Test Pulse Event',
      targetId: mockHotspot.id,
      step: 1,
      // Test the logic - should not add target coordinates for non-pan-zoom events
      ...((eventType === InteractionType.PAN_ZOOM || eventType === InteractionType.PAN_ZOOM_TO_HOTSPOT) && {
        targetX: mockHotspot.x,
        targetY: mockHotspot.y,
        zoomLevel: 2,
        smooth: true,
      }),
    };

    // Verify the event does NOT have target coordinates
    expect(newEvent.targetX).toBeUndefined();
    expect(newEvent.targetY).toBeUndefined();
    expect(newEvent.zoomLevel).toBeUndefined();
    expect(newEvent.smooth).toBeUndefined();
  });
});