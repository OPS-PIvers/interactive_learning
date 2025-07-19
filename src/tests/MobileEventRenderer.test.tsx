import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import MobileEventRenderer from '../client/components/viewer/mobile/MobileEventRenderer';
import { TimelineEventData, InteractionType } from '../shared/types';

// Mock the modal components
vi.mock('../client/components/viewer/mobile/MobileTextModal', () => ({
  default: ({ event, onComplete, showNavigation, currentIndex, totalCount }: any) => (
    <div data-testid="text-modal">
      <h3>{event.name}</h3>
      <p>{event.textContent}</p>
      {showNavigation && (
        <div data-testid="navigation-info">
          {currentIndex + 1} of {totalCount}
        </div>
      )}
      <button onClick={onComplete}>Complete</button>
    </div>
  )
}));

vi.mock('../client/components/viewer/mobile/MobileImageModal', () => ({
  default: ({ event, onComplete, showNavigation, currentIndex, totalCount }: any) => (
    <div data-testid="image-modal">
      <h3>{event.name}</h3>
      {showNavigation && (
        <div data-testid="navigation-info">
          {currentIndex + 1} of {totalCount}
        </div>
      )}
      <button onClick={onComplete}>Complete</button>
    </div>
  )
}));

describe('MobileEventRenderer', () => {
  const mockImageRef = { current: null };
  const mockOnEventComplete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display only the first modal event when multiple modal events exist', async () => {
    const events: TimelineEventData[] = [
      {
        id: 'event-1',
        step: 1,
        name: 'First Text',
        type: InteractionType.SHOW_TEXT,
        textContent: 'First message'
      },
      {
        id: 'event-2',
        step: 1,
        name: 'Second Text',
        type: InteractionType.SHOW_TEXT,
        textContent: 'Second message'
      }
    ];

    render(
      <MobileEventRenderer
        events={events}
        onEventComplete={mockOnEventComplete}
        imageContainerRef={mockImageRef}
        isActive={true}
      />
    );

    // Should display the first modal
    expect(screen.getByText('First Text')).toBeInTheDocument();
    expect(screen.getByText('First message')).toBeInTheDocument();
    
    // Should not display the second modal yet
    expect(screen.queryByText('Second Text')).not.toBeInTheDocument();
    expect(screen.queryByText('Second message')).not.toBeInTheDocument();
  });

  it('should advance to the next modal when current modal is completed', async () => {
    const events: TimelineEventData[] = [
      {
        id: 'event-1',
        step: 1,
        name: 'First Text',
        type: InteractionType.SHOW_TEXT,
        textContent: 'First message'
      },
      {
        id: 'event-2',
        step: 1,
        name: 'Second Text',
        type: InteractionType.SHOW_TEXT,
        textContent: 'Second message'
      }
    ];

    render(
      <MobileEventRenderer
        events={events}
        onEventComplete={mockOnEventComplete}
        imageContainerRef={mockImageRef}
        isActive={true}
      />
    );

    // Complete the first modal
    fireEvent.click(screen.getByText('Complete'));

    // Should advance to the second modal
    await waitFor(() => {
      expect(screen.getByText('Second Text')).toBeInTheDocument();
      expect(screen.getByText('Second message')).toBeInTheDocument();
    });

    // First modal should no longer be visible
    expect(screen.queryByText('First Text')).not.toBeInTheDocument();
    expect(screen.queryByText('First message')).not.toBeInTheDocument();
  });

  it('should show navigation info when multiple modal events exist', async () => {
    const events: TimelineEventData[] = [
      {
        id: 'event-1',
        step: 1,
        name: 'First Text',
        type: InteractionType.SHOW_TEXT,
        textContent: 'First message'
      },
      {
        id: 'event-2',
        step: 1,
        name: 'Second Text',
        type: InteractionType.SHOW_TEXT,
        textContent: 'Second message'
      }
    ];

    render(
      <MobileEventRenderer
        events={events}
        onEventComplete={mockOnEventComplete}
        imageContainerRef={mockImageRef}
        isActive={true}
      />
    );

    // Should show navigation info for the first modal
    expect(screen.getByTestId('navigation-info')).toHaveTextContent('1 of 2');
  });

  it('should handle mixed modal event types in sequence', async () => {
    const events: TimelineEventData[] = [
      {
        id: 'event-1',
        step: 1,
        name: 'Text Event',
        type: InteractionType.SHOW_TEXT,
        textContent: 'Text message'
      },
      {
        id: 'event-2',
        step: 1,
        name: 'Image Event',
        type: InteractionType.SHOW_IMAGE,
        imageUrl: 'test-image.jpg'
      }
    ];

    render(
      <MobileEventRenderer
        events={events}
        onEventComplete={mockOnEventComplete}
        imageContainerRef={mockImageRef}
        isActive={true}
      />
    );

    // Should show text modal first
    expect(screen.getByTestId('text-modal')).toBeInTheDocument();
    expect(screen.queryByTestId('image-modal')).not.toBeInTheDocument();

    // Complete the text modal
    fireEvent.click(screen.getByText('Complete'));

    // Should advance to image modal
    await waitFor(() => {
      expect(screen.getByTestId('image-modal')).toBeInTheDocument();
    });

    expect(screen.queryByTestId('text-modal')).not.toBeInTheDocument();
  });

  it('should call onEventComplete for each modal event', async () => {
    const events: TimelineEventData[] = [
      {
        id: 'event-1',
        step: 1,
        name: 'First Text',
        type: InteractionType.SHOW_TEXT,
        textContent: 'First message'
      },
      {
        id: 'event-2',
        step: 1,
        name: 'Second Text',
        type: InteractionType.SHOW_TEXT,
        textContent: 'Second message'
      }
    ];

    render(
      <MobileEventRenderer
        events={events}
        onEventComplete={mockOnEventComplete}
        imageContainerRef={mockImageRef}
        isActive={true}
      />
    );

    // Complete the first modal
    fireEvent.click(screen.getByText('Complete'));
    expect(mockOnEventComplete).toHaveBeenCalledWith('event-1');

    // Complete the second modal
    await waitFor(() => {
      expect(screen.getByText('Second Text')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Complete'));
    expect(mockOnEventComplete).toHaveBeenCalledWith('event-2');
  });
});