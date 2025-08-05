import React from 'react';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import { AuthProvider } from '../lib/authContext';
import { ToastProvider } from '../client/hooks/useToast';
import '@testing-library/jest-dom';
import { vi, describe, test, expect, beforeEach, afterEach } from 'vitest';
import SlideBasedInteractiveModule from '../client/components/SlideBasedInteractiveModule';
import { SlideDeck, DeviceType } from '../shared/slideTypes';

// Mock child components to isolate testing
vi.mock('../client/components/slides/UnifiedSlideEditor', () => ({
  __esModule: true,
  default: () => <div data-testid="unified-slide-editor-mock">UnifiedSlideEditor</div>,
}));
vi.mock('../client/components/SlideBasedViewer', () => ({
  __esModule: true,
  default: () => <div data-testid="slide-based-viewer">SlideBasedViewer</div>,
}));
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

// Test utility to capture console errors
const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

describe('React Error Detection Tests', () => {
  const mockOnSave = vi.fn();
  const mockOnClose = vi.fn();

  const defaultSlideData: SlideDeck = {
    id: 'test-slide-deck',
    title: 'Test Slide Deck',
    slides: [{ id: 'slide1', elements: [], backgroundMedia: undefined }],
    metadata: { version: '2.0', created: Date.now(), modified: Date.now(), isPublic: false },
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

  const getViewerProps = () => ({
    slideDeck: defaultSlideData,
    isEditing: false,
    onSave: mockOnSave,
    onClose: mockOnClose,
    projectName: 'Test Project',
    deviceType: 'desktop' as DeviceType,
  });

  const getEditorProps = () => ({
    slideDeck: defaultSlideData,
    isEditing: true,
    onSave: mockOnSave,
    onClose: mockOnClose,
    projectName: 'Test Project',
    projectId: 'test-project-id',
    deviceType: 'desktop' as DeviceType,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy.mockClear();
    consoleWarnSpy.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  describe('React Hook Order Validation', () => {
    test('should not produce React Hook Errors in viewer mode', async () => {
      render(
        <AuthProvider>
          <ToastProvider>
            <SlideBasedInteractiveModule {...getViewerProps()} />
          </ToastProvider>
        </AuthProvider>
      );
      await waitFor(() => {
        expect(screen.getByTestId('slide-based-viewer')).toBeInTheDocument();
      });
      const hookErrors = consoleErrorSpy.mock.calls.filter(call =>
        call.some(arg => typeof arg === 'string' && arg.includes('Rules of Hooks'))
      );
      expect(hookErrors).toHaveLength(0);
    });

    test('should not produce React Hook Errors in editor mode', async () => {
      render(
        <AuthProvider>
          <ToastProvider>
            <SlideBasedInteractiveModule {...getEditorProps()} />
          </ToastProvider>
        </AuthProvider>
      );
      await waitFor(() => {
        expect(screen.getByTestId('unified-slide-editor-mock')).toBeInTheDocument();
      });
      const hookErrors = consoleErrorSpy.mock.calls.filter(call =>
        call.some(arg => typeof arg === 'string' && arg.includes('Rules of Hooks'))
      );
      expect(hookErrors).toHaveLength(0);
    });
  });
});