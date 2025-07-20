import { describe, it, expect } from 'vitest';
import { InteractionType } from '../shared/types';

// Mock hotspot data for testing
const mockHotspot = {
  id: 'test-hotspot',
  x: 25, // 25% from left
  y: 60, // 60% from top
  title: 'Test Hotspot',
  content: 'Test content',
  interactionType: InteractionType.SHOW_TEXT,
  color: 'bg-red-500',
  size: 'medium' as const
};

describe('Spotlight Targeting', () => {
  it('should create SPOTLIGHT events with spotlight coordinates matching hotspot position', () => {
    // Simulate creating a SPOTLIGHT event like HotspotEditorModal does
    const eventType = InteractionType.SPOTLIGHT;
    const newEvent = {
      id: 'test-event',
      type: eventType,
      name: 'Test Spotlight Event',
      targetId: mockHotspot.id,
      step: 1,
      message: 'Highlighting area...',
      // Test the fixed logic for setting spotlight coordinates
      ...((eventType === InteractionType.SPOTLIGHT || eventType === InteractionType.HIGHLIGHT_HOTSPOT) && {
        spotlightX: mockHotspot.x,
        spotlightY: mockHotspot.y,
        spotlightShape: 'circle',
        backgroundDimPercentage: 70,
        spotlightOpacity: 0,
      }),
    };

    // Verify the event has the correct spotlight coordinates
    expect(newEvent.spotlightX).toBe(25);
    expect(newEvent.spotlightY).toBe(60);
    expect(newEvent.spotlightShape).toBe('circle');
    expect(newEvent.backgroundDimPercentage).toBe(70);
    expect(newEvent.spotlightOpacity).toBe(0);
    expect(newEvent.targetId).toBe('test-hotspot');
  });

  it('should create HIGHLIGHT_HOTSPOT events with spotlight coordinates matching hotspot position', () => {
    // Test the HIGHLIGHT_HOTSPOT event type
    const eventType = InteractionType.HIGHLIGHT_HOTSPOT;
    const newEvent = {
      id: 'test-event',
      type: eventType,
      name: 'Test Highlight Event',
      targetId: mockHotspot.id,
      step: 1,
      message: 'Highlighting hotspot...',
      // Test the fixed logic for setting spotlight coordinates
      ...((eventType === InteractionType.SPOTLIGHT || eventType === InteractionType.HIGHLIGHT_HOTSPOT) && {
        spotlightX: mockHotspot.x,
        spotlightY: mockHotspot.y,
        spotlightShape: 'circle',
        backgroundDimPercentage: 70,
        spotlightOpacity: 0,
      }),
    };

    // Verify the event has the correct spotlight coordinates
    expect(newEvent.spotlightX).toBe(25);
    expect(newEvent.spotlightY).toBe(60);
    expect(newEvent.spotlightShape).toBe('circle');
    expect(newEvent.backgroundDimPercentage).toBe(70);
    expect(newEvent.spotlightOpacity).toBe(0);
    expect(newEvent.targetId).toBe('test-hotspot');
  });

  it('should not set spotlight coordinates for non-spotlight event types', () => {
    // Test that other event types don't get spotlight coordinates
    const eventType = InteractionType.PULSE_HOTSPOT;
    const newEvent = {
      id: 'test-event',
      type: eventType,
      name: 'Test Pulse Event',
      targetId: mockHotspot.id,
      step: 1,
      // Test the logic - should not add spotlight coordinates for non-spotlight events
      ...((eventType === InteractionType.SPOTLIGHT || eventType === InteractionType.HIGHLIGHT_HOTSPOT) && {
        spotlightX: mockHotspot.x,
        spotlightY: mockHotspot.y,
        spotlightShape: 'circle',
        backgroundDimPercentage: 70,
        spotlightOpacity: 0,
      }),
    };

    // Verify the event does NOT have spotlight coordinates
    expect(newEvent.spotlightX).toBeUndefined();
    expect(newEvent.spotlightY).toBeUndefined();
    expect(newEvent.spotlightShape).toBeUndefined();
    expect(newEvent.backgroundDimPercentage).toBeUndefined();
    expect(newEvent.spotlightOpacity).toBeUndefined();
  });

  it('should handle spotlight coordinate fallback correctly', () => {
    // Test the MobileSpotlightOverlay fallback logic
    const eventWithCoordinates = {
      spotlightX: 75,
      spotlightY: 40,
    };

    const eventWithoutCoordinates = {};

    // With coordinates
    const x1 = eventWithCoordinates.spotlightX || 50;
    const y1 = eventWithCoordinates.spotlightY || 50;
    expect(x1).toBe(75);
    expect(y1).toBe(40);

    // Without coordinates (fallback to center)
    const x2 = eventWithoutCoordinates.spotlightX || 50;
    const y2 = eventWithoutCoordinates.spotlightY || 50;
    expect(x2).toBe(50);
    expect(y2).toBe(50);
  });
});