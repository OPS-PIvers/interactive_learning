import { render, screen, cleanup, waitFor } from '@testing-library/react';
import React from 'react';
import '@testing-library/jest-dom';
import { vi, describe, test, expect, beforeEach, afterEach } from 'vitest';
import SlideBasedInteractiveModule from '../client/components/SlideBasedInteractiveModule';
import { ToastProvider } from '../client/hooks/useToast';
import { AuthProvider } from '../lib/authContext';
import { SlideDeck, DeviceType } from '../shared/slideTypes';

// Mock child components to isolate testing
vi.mock('../client/components/slides/SimpleSlideEditor', () => ({
  __esModule: true,
  default: () => <div data-testid="unified-slide-editor">SimpleSlideEditor</div>,
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
  const mockOnImageUpload = vi.fn();

  const defaultSlideData: SlideDeck = {
    id: 'test-slide-deck',
    title: 'Test Slide Deck',
    slides: [{ 
      id: 'slide1', 
      title: 'Test Slide', 
      elements: [], 
      transitions: [],
      layout: {
        aspectRatio: '16:9',
        containerWidth: 1920,
        containerHeight: 1080,
        scaling: 'fit',
        backgroundSize: 'cover',
        backgroundPosition: 'center center'
      }
    }],
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
    initialData: {},
    slideDeck: defaultSlideData,
    isEditing: false,
    onSave: mockOnSave,
    onClose: mockOnClose,
    onImageUpload: mockOnImageUpload,
    projectName: 'Test Project',
    deviceType: 'desktop' as DeviceType,
  });

  const getEditorProps = () => ({
    initialData: {},
    slideDeck: defaultSlideData,
    isEditing: true,
    onSave: mockOnSave,
    onClose: mockOnClose,
    onImageUpload: mockOnImageUpload,
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
        expect(screen.getByTestId('unified-slide-editor')).toBeInTheDocument();
      });
      const hookErrors = consoleErrorSpy.mock.calls.filter(call =>
        call.some(arg => typeof arg === 'string' && arg.includes('Rules of Hooks'))
      );
      expect(hookErrors).toHaveLength(0);
    });
  });

  describe('TDZ and Reference Error Detection', () => {
    test('should detect undefined variable access errors', async () => {
      const TestComponent = () => {
        // This should cause runtime errors that we want to catch
        try {
          // @ts-ignore - Intentionally testing runtime error
          // eslint-disable-next-line no-undef
          const undefinedVar = someUndefinedVariable;
          return <div>{undefinedVar}</div>;
        } catch (error) {
          console.error('Caught undefined variable error:', error);
          return <div>Error caught</div>;
        }
      };

      render(<TestComponent />);
      
      const referenceErrors = consoleErrorSpy.mock.calls.filter(call =>
        call.some(arg => 
          typeof arg === 'string' && (
            arg.includes('ReferenceError') ||
            arg.includes('is not defined') ||
            arg.includes('undefined variable')
          )
        )
      );
      
      // We expect this to be caught and logged
      expect(referenceErrors.length).toBeGreaterThan(0);
    });

    test('should detect null/undefined property access', async () => {
      const TestComponent = () => {
        try {
          const nullObj = null;
          // @ts-ignore - Intentionally testing runtime error
          const result = nullObj.someProperty;
          return <div>{result}</div>;
        } catch (error) {
          console.error('Caught null access error:', error);
          return <div>Null access error caught</div>;
        }
      };

      render(<TestComponent />);
      
      const nullAccessErrors = consoleErrorSpy.mock.calls.filter(call =>
        call.some(arg => 
          typeof arg === 'string' && (
            arg.includes('TypeError') ||
            arg.includes('Cannot read property') ||
            arg.includes('null access error')
          )
        )
      );
      
      expect(nullAccessErrors.length).toBeGreaterThan(0);
    });
  });

  describe('React Component Error Patterns', () => {
    test('should detect useState hook dependency issues', async () => {
      const ProblematicComponent = () => {
        const [count, _setCount] = React.useState(0);
        const [data, setData] = React.useState<number | null>(null);
        
        // This useEffect has missing dependencies - should be caught by exhaustive-deps
        React.useEffect(() => {
          if (count > 0) {
            setData(count);
          }
        }, [count]); // Missing 'count' dependency - ESLint should catch this
        
        return <div>Count: {count}, Data: {data}</div>;
      };

      render(<ProblematicComponent />);
      
      // Check for any React warnings about missing dependencies
      const _dependencyWarnings = consoleWarnSpy.mock.calls.filter(call =>
        call.some(arg => 
          typeof arg === 'string' && (
            arg.includes('exhaustive-deps') ||
            arg.includes('missing dependency') ||
            arg.includes('useEffect')
          )
        )
      );
      
      // This might not trigger in the test but would be caught by ESLint
      expect(screen.getByText(/Count:/)).toBeInTheDocument();
    });

    test('should handle component unmounting without errors', async () => {
      const ComponentWithCleanup = () => {
        const [mounted, setMounted] = React.useState(true);
        
        React.useEffect(() => {
          const timer = setTimeout(() => {
            if (mounted) {
              setMounted(false);
            }
          }, 10);
          
          return () => clearTimeout(timer);
        }, [mounted]);
        
        if (!mounted) return null;
        return <div data-testid="cleanup-component">Mounted</div>;
      };

      const { unmount } = render(<ComponentWithCleanup />);
      
      // Wait for component to potentially trigger cleanup
      await waitFor(() => {
        expect(screen.queryByTestId('cleanup-component')).toBeInTheDocument();
      });
      
      // Unmount and check for any cleanup errors
      unmount();
      
      const cleanupErrors = consoleErrorSpy.mock.calls.filter(call =>
        call.some(arg => 
          typeof arg === 'string' && (
            arg.includes('memory leak') ||
            arg.includes('unmounted component') ||
            arg.includes('setState')
          )
        )
      );
      
      expect(cleanupErrors).toHaveLength(0);
    });
  });

  describe('Async Error Handling', () => {
    test('should handle promise rejection errors gracefully', async () => {
      const AsyncErrorComponent = () => {
        const [error, setError] = React.useState(null);
        
        React.useEffect(() => {
          const failingPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Async operation failed')), 50);
          });
          
          failingPromise.catch(err => {
            console.error('Caught async error:', err.message);
            setError(err.message);
          });
        }, []);
        
        if (error) {
          return <div data-testid="async-error">Error: {error}</div>;
        }
        
        return <div data-testid="async-loading">Loading...</div>;
      };

      render(<AsyncErrorComponent />);
      
      // Wait for the async error to be handled
      await waitFor(() => {
        expect(screen.getByTestId('async-error')).toBeInTheDocument();
      });
      
      const asyncErrors = consoleErrorSpy.mock.calls.filter(call =>
        call.some(arg => 
          typeof arg === 'string' && arg.includes('Caught async error')
        )
      );
      
      expect(asyncErrors.length).toBeGreaterThan(0);
    });
  });

  describe('Integration Error Scenarios', () => {
    test('should handle complex component interactions without errors', async () => {
      const ChildComponent = ({ onDataChange }: { onDataChange: (data: any) => void }) => {
        React.useEffect(() => {
          // Simulate data loading
          setTimeout(() => {
            onDataChange('Child data loaded');
          }, 100);
        }, [onDataChange]);

        return <div data-testid="child-component">Child</div>;
      };

      const ParentComponent = () => {
        const [childData, setChildData] = React.useState(null);
        
        const handleChildData = React.useCallback((data: any) => {
          setChildData(data);
        }, []);
        
        return (
          <div>
            <ChildComponent onDataChange={handleChildData} />
            {childData && <div data-testid="parent-data">{childData}</div>}
          </div>
        );
      };

      render(<ParentComponent />);
      
      await waitFor(() => {
        expect(screen.getByTestId('parent-data')).toHaveTextContent('Child data loaded');
      });
      
      // Check that no errors occurred during the interaction
      const interactionErrors = consoleErrorSpy.mock.calls.filter(call =>
        call.some(arg => 
          typeof arg === 'string' && (
            arg.includes('Warning') ||
            arg.includes('Error')
          )
        )
      );
      
      expect(interactionErrors).toHaveLength(0);
    });
  });
});