import { render, screen, cleanup, waitFor } from '@testing-library/react';
import React from 'react';
import { ToastProvider } from '../client/hooks/useToast';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import SlideBasedInteractiveModule from '../client/components/SlideBasedInteractiveModule';
import { InteractiveSlide } from '../shared/slideTypes';

// Mock child components
vi.mock('../client/components/SlideBasedViewer', () => ({
  __esModule: true,
  default: () => <div data-testid="slide-viewer" />,
}));
vi.mock('../client/components/slides/UnifiedSlideEditor', () => ({
  __esModule: true,
  default: () => <div data-testid="unified-slide-editor" />,
}));
vi.mock('../client/components/shared/LoadingScreen', () => ({
  __esModule: true,
  default: () => <div data-testid="loading-screen" />,
}));
vi.mock('../client/components/shared/ErrorScreen', () => ({
  __esModule: true,
  default: () => <div data-testid="error-screen" />,
}));
vi.mock('../lib/firebaseProxy', () => ({
  appScriptProxy: {
    uploadImage: vi.fn().mockResolvedValue('mockImageUrl'),
  },
}));

describe('SlideBasedInteractiveModule', () => {
  const mockOnSave = vi.fn();
  const mockOnClose = vi.fn();
  const mockOnImageUpload = vi.fn();

  const slideDeck = {
    id: 'deck1',
    title: 'Test Deck',
    slides: [
      {
        id: 'slide1',
        title: 'Test Slide',
        elements: [],
        backgroundMedia: { type: 'image', url: 'test-image.jpg' },
        transitions: [],
        layout: {
          aspectRatio: '16:9',
          backgroundSize: 'contain',
          containerWidth: 1920,
          containerHeight: 1080,
          scaling: 'fit',
          backgroundPosition: 'center center'
        }
      } as InteractiveSlide,
    ],
    metadata: {
      version: '2.0',
      created: Date.now(),
      modified: Date.now(),
      isPublic: false,
    },
    settings: {
      autoAdvance: false,
      allowNavigation: true,
      showProgress: true,
      showControls: true,
      keyboardShortcuts: true,
      touchGestures: true,
      fullscreenMode: false,
    }
  };

  const getProps = (isEditing = false) => ({
    initialData: {},
    slideDeck,
    isEditing,
    onSave: mockOnSave,
    onClose: mockOnClose,
    onImageUpload: mockOnImageUpload,
    projectName: 'Test Project',
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  test('renders viewer when not in editing mode', async () => {
    render(
      <ToastProvider>
        <SlideBasedInteractiveModule {...getProps(false)} />
      </ToastProvider>
    );
    await waitFor(() => {
      expect(screen.getByTestId('slide-viewer')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('unified-slide-editor')).not.toBeInTheDocument();
  });

  test('renders editor when in editing mode', async () => {
    render(
      <ToastProvider>
        <SlideBasedInteractiveModule {...getProps(true)} />
      </ToastProvider>
    );
    await waitFor(() => {
      expect(screen.getByTestId('unified-slide-editor')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('slide-viewer')).not.toBeInTheDocument();
  });
});
