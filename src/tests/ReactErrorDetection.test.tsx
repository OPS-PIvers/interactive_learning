import React from 'react';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider } from '../lib/authContext';
import { ToastProvider } from '../client/hooks/useToast';
import '@testing-library/jest-dom';
import { vi, describe, test, expect, beforeEach, afterEach } from 'vitest';
import SlideBasedInteractiveModule from '../client/components/SlideBasedInteractiveModule';
import { SlideDeck, InteractiveSlide, SlideElement, DeviceType } from '../shared/slideTypes';

// Mock child components to isolate testing
vi.mock('../client/components/slides/SlideBasedEditor', () => ({
  SlideBasedEditor: () => <div data-testid="slide-based-editor">SlideBasedEditor</div>
}));
vi.mock('../client/components/slides/SlideBasedViewer', () => ({
  SlideBasedViewer: () => <div data-testid="slide-based-viewer">SlideBasedViewer</div>
}));
vi.mock('../client/components/slides/SlideEditor', () => ({
  SlideEditor: () => <div data-testid="slide-editor">SlideEditor</div>
}));
vi.mock('../client/components/mobile/MobilePropertiesPanel', () => ({
  MobilePropertiesPanel: () => <div data-testid="mobile-properties-panel">MobilePropertiesPanel</div>
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

  const defaultSlideData: SlideDeck = {
    id: 'test-slide-deck',
    title: 'Test Slide Deck',
    description: 'Test slide deck for React error detection',
    slides: [
      {
        id: 'test-slide-1',
        title: 'Test Slide',
        backgroundImage: 'test-image.jpg',
        elements: [
          {
            id: 'test-element-1',
            type: 'hotspot',
            position: {
              desktop: { x: 100, y: 100, width: 50, height: 50 },
              tablet: { x: 80, y: 80, width: 40, height: 40 },
              mobile: { x: 60, y: 60, width: 30, height: 30 }
            },
            style: {
              backgroundColor: '#ff0000',
              borderRadius: '50%',
              opacity: 0.8
            },
            content: {
              title: 'Test Hotspot',
              description: 'Test hotspot description'
            },
            interactions: []
          }
        ],
        transitions: [],
        layout: {
          aspectRatio: '16:9',
          backgroundFit: 'contain'
        }
      } as InteractiveSlide
    ],
    metadata: {
      version: '2.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
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
      const updatedSlideData = {
        ...defaultSlideData,
        title: 'Updated Project Name',
        slides: [
          {
            ...defaultSlideData.slides[0],
            backgroundImage: 'updated-image.jpg'
          }
        ]
      };
      
      const newProps = {
        ...getViewerProps(),
        projectName: 'Updated Project Name',
        slideDeck: updatedSlideData
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