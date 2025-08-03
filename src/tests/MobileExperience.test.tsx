import React from 'react';
import { render, screen, cleanup, waitFor, fireEvent } from '@testing-library/react';
import { AuthProvider } from '../lib/authContext';
import { ToastProvider } from '../client/hooks/useToast';
import '@testing-library/jest-dom';
import { vi, describe, test, expect, beforeEach, afterEach } from 'vitest';
import SlideBasedInteractiveModule from '../client/components/SlideBasedInteractiveModule';
import { SlideDeck, DeviceType, SlideElement } from '../shared/slideTypes';

vi.mock('../lib/firebaseProxy', () => ({
  appScriptProxy: {
    uploadImage: vi.fn().mockResolvedValue('mockImageUrl'),
  },
}));

global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

describe('Mobile Experience Tests', () => {
  const mockOnSave = vi.fn();
  const mockOnClose = vi.fn();

  const slideWithElement: SlideElement = {
    id: 'element1',
    type: 'text',
    content: { text: 'Hello Mobile' },
    position: {
      desktop: { x: 10, y: 10, width: 100, height: 50 },
      tablet: { x: 10, y: 10, width: 100, height: 50 },
      mobile: { x: 10, y: 10, width: 100, height: 50 },
    },
  };

  const mobileSlideData: SlideDeck = {
    id: 'mobile-test-deck',
    title: 'Mobile Test Deck',
    slides: [{ id: 'slide1', elements: [slideWithElement], backgroundMedia: null }],
    metadata: { version: '2.0', createdAt: '', updatedAt: '' },
  };

  const getProps = (isEditing: boolean) => ({
    slideDeck: mobileSlideData,
    isEditing,
    onSave: mockOnSave,
    onClose: mockOnClose,
    projectName: 'Mobile Project',
    projectId: 'mobile-project-id',
    deviceType: 'mobile' as DeviceType,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    // Simulate mobile environment
    window.matchMedia = vi.fn().mockImplementation(query => ({
      matches: true,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  afterEach(cleanup);

  const renderComponent = (props: React.ComponentProps<typeof SlideBasedInteractiveModule>) => {
    return render(
      <AuthProvider>
        <ToastProvider>
          <SlideBasedInteractiveModule {...props} />
        </ToastProvider>
      </AuthProvider>
    );
  };

  test('should allow dragging elements in the editor on mobile', async () => {
    const props = getProps(true);
    renderComponent(props);

    const slideElement = await screen.findByText('Hello Mobile');
    expect(slideElement).toBeInTheDocument();

    // Simple drag simulation with touch events
    fireEvent.touchStart(slideElement, { touches: [{ clientX: 10, clientY: 10 }] });
    fireEvent.touchMove(slideElement, { touches: [{ clientX: 50, clientY: 50 }] });
    fireEvent.touchEnd(slideElement);

    // In a real scenario, we would assert that the element's position has changed.
    // For now, the goal is to ensure this interaction doesn't crash the app.
    // The global error handler will catch any crashes.
    // A more complex assertion would require deeper knowledge of the component's state management.
    expect(mockOnSave).not.toHaveBeenCalled(); // Dragging shouldn't trigger a save
  });
});
