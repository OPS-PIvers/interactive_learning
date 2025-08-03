import React from 'react';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import { AuthProvider } from '../lib/authContext';
import { ToastProvider } from '../client/hooks/useToast';
import '@testing-library/jest-dom';
import { vi, describe, test, expect, beforeEach, afterEach } from 'vitest';
import SlideBasedInteractiveModule from '../client/components/SlideBasedInteractiveModule';
import { SlideDeck, DeviceType } from '../shared/slideTypes';

// Mock firebaseProxy as it is not relevant for rendering tests
vi.mock('../lib/firebaseProxy', () => ({
  appScriptProxy: {
    uploadImage: vi.fn().mockResolvedValue('mockImageUrl'),
  },
}));

// Mock ResizeObserver for tests
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

describe('Comprehensive Render Testing', () => {
  const mockOnSave = vi.fn();
  const mockOnClose = vi.fn();

  const defaultSlideData: SlideDeck = {
    id: 'test-slide-deck',
    title: 'Test Slide Deck',
    slides: [{ id: 'slide1', elements: [], backgroundMedia: null }],
    metadata: { version: '2.0', createdAt: '', updatedAt: '' },
  };

  const getProps = (isEditing: boolean, deviceType: DeviceType) => ({
    slideDeck: defaultSlideData,
    isEditing,
    onSave: mockOnSave,
    onClose: mockOnClose,
    projectName: 'Test Project',
    projectId: 'test-project-id',
    deviceType,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  const renderComponent = (props: React.ComponentProps<typeof SlideBasedInteractiveModule>) => {
    return render(
      <AuthProvider>
        <ToastProvider>
          <SlideBasedInteractiveModule {...props} />
        </ToastProvider>
      </AuthProvider>
    );
  };

  describe('Desktop Rendering', () => {
    beforeEach(() => {
      window.matchMedia = vi.fn().mockImplementation(query => ({
        matches: false, // Simulate desktop
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));
    });

    test('should render viewer on desktop without errors', async () => {
      const props = getProps(false, 'desktop');
      renderComponent(props);
      // The main assertion is that the global error handler in setup.ts doesn't throw.
      // We can add a basic check to ensure the component rendered something.
      const button = await screen.findByRole('button', { name: /explore freely/i });
      expect(button).toBeInTheDocument();
    });

    test('should render editor on desktop without errors', async () => {
      const props = getProps(true, 'desktop');
      renderComponent(props);
      const projectTitles = await screen.findAllByText('Test Project');
      expect(projectTitles.length).toBeGreaterThan(0);
    });
  });

  describe('Mobile Rendering', () => {
    beforeEach(() => {
      // Simulate mobile environment
      window.matchMedia = vi.fn().mockImplementation(query => ({
        matches: true, // Simulate mobile
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));
    });

    test('should render viewer on mobile without errors', async () => {
      const props = getProps(false, 'mobile');
      renderComponent(props);
      const button = await screen.findByRole('button', { name: /explore freely/i });
      expect(button).toBeInTheDocument();
    });

    test('should render editor on mobile without errors', async () => {
      const props = getProps(true, 'mobile');
      renderComponent(props);
      const projectTitles = await screen.findAllByText('Test Project');
      expect(projectTitles.length).toBeGreaterThan(0);
    });
  });
});