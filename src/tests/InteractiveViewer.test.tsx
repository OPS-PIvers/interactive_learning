import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { expect, describe, it, vi } from 'vitest';
import InteractiveViewer from '../client/components/InteractiveViewer';
import { HotspotData, TimelineEventData, InteractionType } from '../shared/types';

// Mock the hooks
vi.mock('../client/hooks/useIsMobile', () => ({
  useIsMobile: () => false, // Test desktop first
}));

vi.mock('../client/hooks/useTouchGestures', () => ({
  useTouchGestures: () => ({
    isGestureActive: () => false,
    setEventActive: vi.fn(),
    isEventActive: () => false,
    handleTouchStart: vi.fn(),
    handleTouchMove: vi.fn(),
    handleTouchEnd: vi.fn(),
  }),
}));

describe('InteractiveViewer - Start Guided Learning', () => {
  const mockHotspots: HotspotData[] = [
    {
      id: 'hotspot1',
      x: 25,
      y: 25,
      title: 'Test Hotspot 1',
      content: 'First hotspot',
      interactionType: InteractionType.SHOW_TEXT,
      size: 'medium',
      color: 'bg-blue-500'
    },
    {
      id: 'hotspot2',
      x: 75,
      y: 75,
      title: 'Test Hotspot 2',
      content: 'Second hotspot',
      interactionType: InteractionType.SHOW_TEXT,
      size: 'medium',
      color: 'bg-red-500'
    }
  ];

  const mockTimelineEvents: TimelineEventData[] = [
    {
      id: 'event1',
      step: 1,
      type: InteractionType.PULSE_HOTSPOT,
      name: 'First Event',
      message: 'This is the first event',
      targetId: 'hotspot1',
      hotspotId: 'hotspot1'
    },
    {
      id: 'event2',
      step: 2,
      type: InteractionType.SHOW_TEXT,
      name: 'Second Event',
      message: 'This is the second event',
      targetId: 'hotspot2',
      hotspotId: 'hotspot2'
    }
  ];

  const defaultProps = {
    projectName: 'Test Project',
    backgroundImage: 'test-image.jpg',
    hotspots: mockHotspots,
    timelineEvents: mockTimelineEvents,
    viewerModes: { explore: true, selfPaced: true, timed: true },
    onClose: vi.fn(),
  };

  it('shows "Start Guided Tour" button when viewer modes include guided learning', () => {
    render(<InteractiveViewer {...defaultProps} />);
    
    expect(screen.getByText('Start Guided Tour')).toBeInTheDocument();
  });

  it('starts with first timeline step when "Start Guided Tour" is clicked', async () => {
    render(<InteractiveViewer {...defaultProps} />);
    
    // Initially should be in idle state with mode selection buttons
    expect(screen.getByText('Start Guided Tour')).toBeInTheDocument();
    
    // Click the Start Guided Tour button
    fireEvent.click(screen.getByText('Start Guided Tour'));
    
    // The modal should disappear (hasUserChosenMode becomes true)
    await waitFor(() => {
      expect(screen.queryByText('Start Guided Tour')).not.toBeInTheDocument();
    });
    
    // Check if we're in learning mode by looking for timeline elements
    // The timeline should show the current step (step 1)
    await waitFor(() => {
      const timelineElements = screen.getAllByRole('button');
      expect(timelineElements.length).toBeGreaterThan(0);
    });
  });

  it('activates hotspots for the first step when starting guided learning', async () => {
    const { container } = render(<InteractiveViewer {...defaultProps} />);
    
    // Click Start Guided Tour
    fireEvent.click(screen.getByText('Start Guided Tour'));
    
    await waitFor(() => {
      // Check that hotspots are rendered (they should be visible for step 1)
      const hotspotElements = container.querySelectorAll('[data-hotspot-id]');
      expect(hotspotElements.length).toBeGreaterThan(0);
      
      // Check that we can find the first hotspot specifically
      const firstHotspot = container.querySelector('[data-hotspot-id="hotspot1"]');
      expect(firstHotspot).toBeInTheDocument();
    });
  });
});