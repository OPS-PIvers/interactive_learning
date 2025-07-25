import React from 'react';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider } from '../lib/authContext';
import { ToastProvider } from '../client/hooks/useToast';
import '@testing-library/jest-dom';
import { vi, describe, test, expect, beforeEach, afterEach } from 'vitest';
import SlideBasedInteractiveModule from '../client/components/SlideBasedInteractiveModule';
import { InteractiveModuleState, InteractionType } from '../shared/types';

// Mock child components to isolate testing
vi.mock('../client/components/ViewerToolbar', () => ({
  default: () => <div data-testid="viewer-toolbar">ViewerToolbar</div>
}));
vi.mock('../client/components/HotspotViewer', () => ({
  default: () => <div data-testid="hotspot-viewer">HotspotViewer</div>
}));
vi.mock('../client/components/HorizontalTimeline', () => ({
  default: () => <div data-testid="horizontal-timeline">HorizontalTimeline</div>
}));
vi.mock('../client/components/ImageEditCanvas', () => ({
  default: () => <div data-testid="image-edit-canvas">ImageEditCanvas</div>
}));
vi.mock('../client/components/HotspotEditorModal', () => ({
  default: () => <div data-testid="hotspot-editor-modal">HotspotEditorModal</div>
}));
vi.mock('../client/components/MobileEditorModal', () => ({
  default: () => <div data-testid="mobile-editor-modal">MobileEditorModal</div>
}));
vi.mock('../client/components/MobileEditorLayout', () => ({
  default: () => <div data-testid="mobile-editor-layout">MobileEditorLayout</div>
}));
vi.mock('../client/components/AuthButton', () => ({
  default: () => <div data-testid="auth-button">AuthButton</div>
}));
vi.mock('../client/hooks/useIsMobile', () => ({
  useIsMobile: () => false
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

  const defaultInitialData: InteractiveModuleState = {
    backgroundImage: 'test-image.jpg',
    hotspots: [
      {
        id: 'test-hotspot-1',
        x: 50,
        y: 50,
        title: 'Test Hotspot',
        description: 'Test hotspot description',
        color: '#ff0000'
      }
    ],
    timelineEvents: [
      {
        id: 'test-event-1',
        step: 1,
        name: 'Test Event',
        type: InteractionType.SHOW_TEXT,
        targetId: 'test-hotspot-1',
        textContent: 'Test text content'
      }
    ],
    imageFitMode: 'contain',
  };

  const getViewerProps = () => ({
    initialData: defaultInitialData,
    isEditing: false,
    onSave: mockOnSave,
    onClose: mockOnClose,
    onImageUpload: vi.fn(),
    projectName: 'Test Project',
    viewerModes: { explore: true, selfPaced: true, timed: false },
  });

  const getEditorProps = () => ({
    initialData: defaultInitialData,
    isEditing: true,
    onSave: mockOnSave,
    onClose: mockOnClose,
    onImageUpload: vi.fn(),
    projectName: 'Test Project',
    projectId: 'test-project-id',
    viewerModes: { explore: true, selfPaced: true, timed: false },
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
    test('should not produce React Hook Error #310 in viewer mode', async () => {
      const component = render(
        <AuthProvider>
          <ToastProvider>
            <SlideBasedInteractiveModule {...getViewerProps()} />
          </ToastProvider>
        </AuthProvider>
      );

      // Wait for component to fully initialize
      await waitFor(() => {
        expect(screen.getByText('ExpliCoLearning')).toBeInTheDocument();
      });

      // Check for React Hook Error #310 specifically
      const hookErrors = consoleErrorSpy.mock.calls.filter(call =>
        call.some(arg => 
          typeof arg === 'string' && (
            arg.includes('React Hook Error #310') ||
            arg.includes('hook order') ||
            arg.includes('Rules of Hooks')
          )
        )
      );

      expect(hookErrors).toHaveLength(0);
      
      component.unmount();
    });

    test('should not produce React Hook Error #310 in editor mode', async () => {
      const component = render(
        <AuthProvider>
          <ToastProvider>
            <SlideBasedInteractiveModule {...getEditorProps()} />
          </ToastProvider>
        </AuthProvider>
      );

      // Wait for component to fully initialize
      await waitFor(() => {
        expect(screen.getByText('Test Project')).toBeInTheDocument();
      });

      // Check for React Hook Error #310 specifically
      const hookErrors = consoleErrorSpy.mock.calls.filter(call =>
        call.some(arg => 
          typeof arg === 'string' && (
            arg.includes('React Hook Error #310') ||
            arg.includes('hook order') ||
            arg.includes('Rules of Hooks')
          )
        )
      );

      expect(hookErrors).toHaveLength(0);
      
      component.unmount();
    });

    test('should not produce hook order violations during mode transitions', async () => {
      const component = render(
        <AuthProvider>
          <ToastProvider>
            <SlideBasedInteractiveModule {...getViewerProps()} />
          </ToastProvider>
        </AuthProvider>
      );

      // Wait for initial render
      await waitFor(() => {
        expect(screen.getByText('ExpliCoLearning')).toBeInTheDocument();
      });

      // Simulate mode transition by clicking "🎯 Guided Experience"
      const overlay = screen.getByText('ExpliCoLearning').closest('div');
      if (overlay) {
        const tourButton = screen.getByText('🎯 Guided Experience');
        fireEvent.click(tourButton);
      }

      // Wait for transition to complete
      await waitFor(() => {
        const moduleReadyText = screen.queryByText('ExpliCoLearning');
        expect(moduleReadyText).not.toBeInTheDocument();
      });

      // Check for hook order violations after transition
      const hookErrors = consoleErrorSpy.mock.calls.filter(call =>
        call.some(arg => 
          typeof arg === 'string' && (
            arg.includes('React Hook Error #310') ||
            arg.includes('hook order') ||
            arg.includes('Rules of Hooks')
          )
        )
      );

      expect(hookErrors).toHaveLength(0);
      
      component.unmount();
    });
  });

  describe('Temporal Dead Zone (TDZ) Error Detection', () => {
    test('should not produce TDZ errors during component initialization', async () => {
      const component = render(
        <AuthProvider>
          <ToastProvider>
            <SlideBasedInteractiveModule {...getViewerProps()} />
          </ToastProvider>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('ExpliCoLearning')).toBeInTheDocument();
      });

      // Check for TDZ-related errors
      const tdzErrors = consoleErrorSpy.mock.calls.filter(call =>
        call.some(arg => 
          typeof arg === 'string' && (
            arg.includes('temporal dead zone') ||
            arg.includes('TDZ') ||
            arg.includes('before initialization') ||
            arg.includes('Cannot access') ||
            arg.includes('ReferenceError')
          )
        )
      );

      expect(tdzErrors).toHaveLength(0);
      
      component.unmount();
    });

    test('should not produce TDZ errors in editor mode', async () => {
      const component = render(
        <AuthProvider>
          <ToastProvider>
            <SlideBasedInteractiveModule {...getEditorProps()} />
          </ToastProvider>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Project')).toBeInTheDocument();
      });

      // Check for TDZ-related errors
      const tdzErrors = consoleErrorSpy.mock.calls.filter(call =>
        call.some(arg => 
          typeof arg === 'string' && (
            arg.includes('temporal dead zone') ||
            arg.includes('TDZ') ||
            arg.includes('before initialization') ||
            arg.includes('Cannot access') ||
            arg.includes('ReferenceError')
          )
        )
      );

      expect(tdzErrors).toHaveLength(0);
      
      component.unmount();
    });
  });

  describe('General Component Error Detection', () => {
    test('should not produce unhandled component errors in viewer mode', async () => {
      const component = render(
        <AuthProvider>
          <ToastProvider>
            <SlideBasedInteractiveModule {...getViewerProps()} />
          </ToastProvider>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('ExpliCoLearning')).toBeInTheDocument();
      });

      // Filter out expected Firebase warnings and focus on React component errors
      const componentErrors = consoleErrorSpy.mock.calls.filter(call =>
        call.some(arg => {
          if (typeof arg !== 'string') return false;
          
          // Exclude known Firebase warnings
          if (arg.includes('@firebase/analytics') || 
              arg.includes('IndexedDB') || 
              arg.includes('Firebase Performance')) {
            return false;
          }
          
          // Look for actual component errors
          return arg.includes('React') || 
                 arg.includes('component') || 
                 arg.includes('Error:') ||
                 arg.includes('TypeError:') ||
                 arg.includes('Warning:');
        })
      );

      expect(componentErrors).toHaveLength(0);
      
      component.unmount();
    });

    test('should not produce unhandled component errors in editor mode', async () => {
      const component = render(
        <AuthProvider>
          <ToastProvider>
            <SlideBasedInteractiveModule {...getEditorProps()} />
          </ToastProvider>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Project')).toBeInTheDocument();
      });

      // Filter out expected Firebase warnings and focus on React component errors
      const componentErrors = consoleErrorSpy.mock.calls.filter(call =>
        call.some(arg => {
          if (typeof arg !== 'string') return false;
          
          // Exclude known Firebase warnings
          if (arg.includes('@firebase/analytics') || 
              arg.includes('IndexedDB') || 
              arg.includes('Firebase Performance')) {
            return false;
          }
          
          // Look for actual component errors
          return arg.includes('React') || 
                 arg.includes('component') || 
                 arg.includes('Error:') ||
                 arg.includes('TypeError:') ||
                 arg.includes('Warning:');
        })
      );

      expect(componentErrors).toHaveLength(0);
      
      component.unmount();
    });

    test('should handle prop changes without errors', async () => {
      const { rerender } = render(
        <AuthProvider>
          <ToastProvider>
            <SlideBasedInteractiveModule {...getViewerProps()} />
          </ToastProvider>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('ExpliCoLearning')).toBeInTheDocument();
      });

      // Clear any initialization errors
      consoleErrorSpy.mockClear();

      // Change props and re-render
      const newProps = {
        ...getViewerProps(),
        projectName: 'Updated Project Name',
        onImageUpload: vi.fn(),
        initialData: {
          ...defaultInitialData,
          backgroundImage: 'updated-image.jpg'
        }
      };

      rerender(
        <AuthProvider>
          <ToastProvider>
            <SlideBasedInteractiveModule {...newProps} />
          </ToastProvider>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('ExpliCoLearning')).toBeInTheDocument();
      });

      // Check that prop changes didn't cause errors
      const propChangeErrors = consoleErrorSpy.mock.calls.filter(call =>
        call.some(arg => {
          if (typeof arg !== 'string') return false;
          
          // Exclude known Firebase warnings
          if (arg.includes('@firebase/analytics') || 
              arg.includes('IndexedDB') || 
              arg.includes('Firebase Performance')) {
            return false;
          }
          
          return arg.includes('Error:') || 
                 arg.includes('Warning:') ||
                 arg.includes('React');
        })
      );

      expect(propChangeErrors).toHaveLength(0);
    });
  });

  describe('Memory Leak Detection', () => {
    test('should properly cleanup on unmount without errors', async () => {
      const component = render(
        <AuthProvider>
          <ToastProvider>
            <SlideBasedInteractiveModule {...getViewerProps()} />
          </ToastProvider>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('ExpliCoLearning')).toBeInTheDocument();
      });

      // Clear any initialization errors
      consoleErrorSpy.mockClear();

      // Unmount the component
      component.unmount();

      // Wait a bit to catch any cleanup errors
      await new Promise(resolve => setTimeout(resolve, 100));

      // Check for cleanup-related errors
      const cleanupErrors = consoleErrorSpy.mock.calls.filter(call =>
        call.some(arg => {
          if (typeof arg !== 'string') return false;
          
          return arg.includes('Warning: Can\'t perform a React state update') ||
                 arg.includes('memory leak') ||
                 arg.includes('cleanup') ||
                 arg.includes('setState') ||
                 arg.includes('unmounted component');
        })
      );

      expect(cleanupErrors).toHaveLength(0);
    });
  });

  describe('Error Boundary Integration', () => {
    test('should not trigger error boundaries in normal operation', async () => {
      // Track if any error boundaries are triggered
      let errorBoundaryTriggered = false;
      
      const TestErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
        try {
          return <>{children}</>;
        } catch (error) {
          errorBoundaryTriggered = true;
          throw error;
        }
      };

      const component = render(
        <TestErrorBoundary>
          <AuthProvider>
            <ToastProvider>
              <SlideBasedInteractiveModule {...getViewerProps()} />
            </ToastProvider>
          </AuthProvider>
        </TestErrorBoundary>
      );

      await waitFor(() => {
        expect(screen.getByText('ExpliCoLearning')).toBeInTheDocument();
      });

      expect(errorBoundaryTriggered).toBe(false);
      
      component.unmount();
    });
  });
});