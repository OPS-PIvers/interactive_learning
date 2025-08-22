import { render, screen, cleanup, waitFor } from '@testing-library/react';
import React from 'react';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import SlideBasedInteractiveModule from '../client/components/SlideBasedInteractiveModule';
import { ToastProvider } from '../client/hooks/useToast';
import { InteractiveSlide } from '../shared/slideTypes';

// Mock child components
vi.mock('../client/components/SlideBasedViewer', () => ({
  __esModule: true,
  default: () => <div data-testid="slide-viewer" />,
}));
vi.mock('../client/components/editors/ModernSlideEditor', () => ({
  __esModule: true,
  default: (props: any) => <div data-testid="modern-slide-editor" {...props} />,
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
    expect(screen.queryByTestId('modern-slide-editor')).not.toBeInTheDocument();
  });

  test('renders editor when in editing mode', async () => {
    render(
      <ToastProvider>
        <SlideBasedInteractiveModule {...getProps(true)} />
      </ToastProvider>
    );
    expect(await screen.findByTestId('modern-slide-editor')).toBeInTheDocument();
    expect(screen.queryByTestId('slide-viewer')).not.toBeInTheDocument();
  });
});
