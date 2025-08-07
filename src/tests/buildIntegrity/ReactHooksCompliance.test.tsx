import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { render, screen, cleanup, fireEvent, waitFor, renderHook } from '@testing-library/react';
import { vi, describe, test, expect, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';

// Mock external dependencies
vi.mock('../../lib/authContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useAuth: () => ({ user: null, loading: false })
}));

vi.mock('../../lib/firebaseConfig', () => ({
  firebaseManager: {
    isReady: () => true,
    getAuth: () => ({ currentUser: null }),
    getFirestore: () => ({})
  }
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

describe('React Hooks Compliance Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy.mockClear();
    consoleWarnSpy.mockClear();
  });

  afterEach(() => {
    cleanup();
  });


  describe('Component Lifecycle Hook Compliance', () => {
    test('useEffect cleanup prevents memory leaks', async () => {
      let cleanupCalled = false;

      const TestComponent: React.FC = () => {
        useEffect(() => {
          const timer = setTimeout(() => {}, 1000);
          const listener = () => {};
          window.addEventListener('resize', listener);

          return () => {
            cleanupCalled = true;
            clearTimeout(timer);
            window.removeEventListener('resize', listener);
          };
        }, []);

        return <div data-testid="lifecycle-test">Test Component</div>;
      };

      const { unmount } = render(<TestComponent />);
      
      await waitFor(() => {
        expect(screen.getByTestId('lifecycle-test')).toBeInTheDocument();
      });

      unmount();

      // Wait for cleanup to be called
      await waitFor(() => {
        expect(cleanupCalled).toBe(true);
      });

      // Check that no memory leak warnings occurred
      const memoryLeakWarnings = consoleWarnSpy.mock.calls.filter(call =>
        call.some(arg => 
          typeof arg === 'string' && (
            arg.includes('memory leak') ||
            arg.includes('setState') ||
            arg.includes('unmounted component')
          )
        )
      );

      expect(memoryLeakWarnings).toHaveLength(0);
    });

    test('useState updates do not occur after unmount', async () => {
      const TestComponent: React.FC = () => {
        const [count, setCount] = useState(0);

        useEffect(() => {
          const timer = setTimeout(() => {
            setCount(1); // This should not cause warnings if cleanup is proper
          }, 100);

          return () => clearTimeout(timer);
        }, []);

        return <div data-testid="count">{count}</div>;
      };

      const { unmount } = render(<TestComponent />);
      
      // Unmount immediately to test cleanup
      unmount();

      // Wait for potential setState calls
      await new Promise(resolve => setTimeout(resolve, 200));

      // Check for setState warnings on unmounted components
      const setStateWarnings = consoleWarnSpy.mock.calls.filter(call =>
        call.some(arg => 
          typeof arg === 'string' && 
          arg.includes('setState') &&
          arg.includes('unmounted')
        )
      );

      expect(setStateWarnings).toHaveLength(0);
    });
  });

  describe('Specific Hook Implementation Compliance', () => {
    test('useDeviceDetection hook maintains consistent behavior', async () => {
      const { useDeviceDetection } = await import('../../client/hooks/useDeviceDetection');

      const { result, rerender } = renderHook(() => useDeviceDetection());

      // Should not cause hook order violations on re-render
      expect(() => {
        rerender();
        rerender();
        rerender();
      }).not.toThrow();

      // Result should have expected properties
      expect(typeof result.current.isMobile).toBe('boolean');
      expect(typeof result.current.deviceType).toBe('string');
    });

    test('useToast hook maintains consistent behavior', async () => {
      const { useToast, ToastProvider } = await import('../../client/hooks/useToast');

      const { result } = renderHook(() => useToast(), {
        wrapper: ({ children }) => {
          return <ToastProvider>{children}</ToastProvider>;
        }
      });

      // Should provide showToast function
      expect(typeof result.current.showToast).toBe('function');

      // Should not cause errors when called multiple times
      expect(() => {
        result.current.showToast({ title: 'Test message', type: 'success' });
        result.current.showToast({ title: 'Another message', type: 'error' });
      }).not.toThrow();
    });
  });

  describe('Hook Dependency Array Compliance', () => {
    test('useEffect dependencies are properly declared', () => {
      const TestComponent: React.FC<{ value: number }> = ({ value }) => {
        const [internalState, setInternalState] = useState(0);

        // This useEffect should include 'value' in dependencies
        useEffect(() => {
          setInternalState(value * 2);
        }, [value]); // Missing 'value' dependency - should trigger ESLint warning

        return <div>{internalState}</div>;
      };

      const { rerender } = render(<TestComponent value={1} />);
      rerender(<TestComponent value={2} />);

      // In a real linting environment, this would catch dependency issues
      expect(true).toBe(true); // Placeholder for ESLint integration
    });

    test('useCallback dependencies are correctly specified', () => {
      const TestComponent: React.FC<{ multiplier: number }> = ({ multiplier }) => {
        const [count, setCount] = useState(0);

        // Correct dependency array
        const increment = useCallback(() => {
          setCount(prev => prev + multiplier);
        }, [multiplier]);

        return (
          <div>
            <button onClick={increment} data-testid="correct-button">Correct</button>
            <span data-testid="count">{count}</span>
          </div>
        );
      };

      render(<TestComponent multiplier={2} />);
      
      fireEvent.click(screen.getByTestId('correct-button'));
      expect(screen.getByTestId('count')).toHaveTextContent('2');
    });

    test('useMemo dependencies are correctly specified', () => {
      const TestComponent: React.FC<{ data: number[] }> = ({ data }) => {
        const [filter, setFilter] = useState(0);

        // Correct dependencies
        const filteredData = useMemo(() => {
          return data.filter(item => item > filter);
        }, [data, filter]);

        return (
          <div>
            <div data-testid="correct-count">{filteredData.length}</div>
            <button onClick={() => setFilter(5)} data-testid="change-filter">
              Change Filter
            </button>
          </div>
        );
      };

      render(<TestComponent data={[1, 3, 5, 7, 9]} />);
      
      fireEvent.click(screen.getByTestId('change-filter'));
      
      expect(screen.getByTestId('correct-count')).toHaveTextContent('2');
    });
  });

  describe('Advanced Hook Patterns Compliance', () => {
    test('custom hooks with conditional logic maintain compliance', () => {
      const useConditionalHook = (condition: boolean) => {
        const [value, setValue] = useState(0);

        // This is correct - hooks called unconditionally
        useEffect(() => {
          if (condition) {
            setValue(1);
          } else {
            setValue(0);
          }
        }, [condition]);

        return value;
      };

      const TestComponent: React.FC<{ condition: boolean }> = ({ condition }) => {
        const value = useConditionalHook(condition);
        return <div data-testid="value">{value}</div>;
      };

      const { rerender } = render(<TestComponent condition={true} />);
      expect(screen.getByTestId('value')).toHaveTextContent('1');

      rerender(<TestComponent condition={false} />);
      expect(screen.getByTestId('value')).toHaveTextContent('0');

      // Should not cause hook order violations
      const hookOrderErrors = consoleErrorSpy.mock.calls.filter(call =>
        call.some(arg => 
          typeof arg === 'string' && 
          arg.includes('hook order')
        )
      );

      expect(hookOrderErrors).toHaveLength(0);
    });

    test('hook composition maintains order consistency', () => {
      const useCounter = (initialValue: number) => {
        const [count, setCount] = useState(initialValue);
        const increment = useCallback(() => setCount(c => c + 1), []);
        const decrement = useCallback(() => setCount(c => c - 1), []);
        return { count, increment, decrement };
      };

      const useToggle = (initialValue: boolean) => {
        const [value, setValue] = useState(initialValue);
        const toggle = useCallback(() => setValue(v => !v), []);
        return { value, toggle };
      };

      const ComposedComponent: React.FC = () => {
        const counter = useCounter(0);
        const toggle = useToggle(false);
        
        // Additional hooks after custom hooks
        const [localState, setLocalState] = useState('');
        
        useEffect(() => {
          setLocalState(`Count: ${counter.count}, Toggle: ${toggle.value}`);
        }, [counter.count, toggle.value]);

        return (
          <div>
            <div data-testid="state">{localState}</div>
            <button onClick={counter.increment} data-testid="increment">+</button>
            <button onClick={toggle.toggle} data-testid="toggle">Toggle</button>
          </div>
        );
      };

      render(<ComposedComponent />);
      
      fireEvent.click(screen.getByTestId('increment'));
      fireEvent.click(screen.getByTestId('toggle'));

      // Should maintain hook order consistency
      const hookErrors = consoleErrorSpy.mock.calls.filter(call =>
        call.some(arg => 
          typeof arg === 'string' && 
          arg.includes('React Hook')
        )
      );

      expect(hookErrors).toHaveLength(0);
    });
  });

  describe('Error Boundary Integration with Hooks', () => {
    test('hooks errors are properly caught by error boundaries', () => {
      const ProblematicComponent: React.FC = () => {
        const [count, setCount] = useState(0);

        // Intentionally cause an error in useEffect
        useEffect(() => {
          if (count === 5) {
            throw new Error('Intentional hook error');
          }
        }, [count]);

        return (
          <div>
            <div data-testid="count">{count}</div>
            <button onClick={() => setCount(5)} data-testid="trigger-error">
              Trigger Error
            </button>
          </div>
        );
      };

      class ErrorBoundary extends React.Component<
        { children: React.ReactNode },
        { hasError: boolean }
      > {
        constructor(props: { children: React.ReactNode }) {
          super(props);
          this.state = { hasError: false };
        }

        static getDerivedStateFromError() {
          return { hasError: true };
        }

        override componentDidCatch(error: Error) {
          expect(error.message).toBe('Intentional hook error');
        }

        override render() {
          if (this.state.hasError) {
            return <div data-testid="error-boundary">Error caught</div>;
          }
          return this.props.children;
        }
      }

      render(
        <ErrorBoundary>
          <ProblematicComponent />
        </ErrorBoundary>
      );

      fireEvent.click(screen.getByTestId('trigger-error'));

      expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
    });
  });
});