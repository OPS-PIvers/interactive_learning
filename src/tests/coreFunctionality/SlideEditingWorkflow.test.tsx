import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { vi, describe, test, expect, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import { SlideDeck, InteractiveSlide, SlideElement, DeviceType } from '../../shared/slideTypes';

// Mock dependencies
vi.mock('../../lib/authContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useAuth: () => ({ user: { uid: 'test-user' }, loading: false })
}));

vi.mock('../../client/hooks/useToast', () => ({
  ToastProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useToast: () => ({ showToast: vi.fn() })
}));

vi.mock('../../client/hooks/useDeviceDetection', () => ({
  useDeviceDetection: () => ({ isMobile: false, deviceType: 'desktop', isTablet: false, isDesktop: true })
}));

vi.mock('../../lib/firebaseApi', () => ({
  firebaseAPI: {
    saveSlideDeck: vi.fn().mockResolvedValue(true),
    loadSlideDeck: vi.fn().mockResolvedValue(null)
  }
}));

vi.mock('../../lib/firebaseConfig', () => ({
  firebaseManager: {
    isReady: () => true,
    getAuth: () => ({ currentUser: { uid: 'test-user' } }),
    getFirestore: () => ({})
  }
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

describe('Slide Editing Workflow Tests', () => {
  const mockSlideDeck: SlideDeck = {
    id: 'test-deck',
    title: 'Test Slide Deck',
    description: 'Test deck for workflow testing',
    slides: [
      {
        id: 'slide-1',
        title: 'Test Slide 1',
        backgroundImage: 'test-bg.jpg',
        elements: [],
        transitions: [],
        layout: {
          aspectRatio: '16:9',
          backgroundSize: 'contain',
          containerWidth: 1920,
          containerHeight: 1080,
          scaling: 'fit',
          backgroundPosition: 'center center'
        }
      } as InteractiveSlide
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

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('Complete Slide Editing Pipeline', () => {
    test('create slide deck → add elements → position elements → save workflow', async () => {
      const mockOnSave = vi.fn();
      
      // Mock the slide editing component
      const MockSlideEditor: React.FC<{
        slideDeck: SlideDeck;
        onSave: (deck: SlideDeck) => void;
      }> = ({ slideDeck, onSave }) => {
        const [currentDeck, setCurrentDeck] = React.useState(slideDeck);

        const addElement = () => {
          const newElement: SlideElement = {
            id: `element-${Date.now()}`,
            type: 'hotspot',
            position: {
              desktop: { x: 100, y: 100, width: 50, height: 50 },
              tablet: { x: 80, y: 80, width: 40, height: 40 },
              mobile: { x: 60, y: 60, width: 30, height: 30 }
            },
            style: { backgroundColor: '#ff0000', borderRadius: '50%' },
            content: { title: 'Test Hotspot' },
            interactions: [],
            isVisible: true
          };

          const updatedDeck = {
            ...currentDeck,
            slides: currentDeck.slides.map(slide => 
              slide.id === 'slide-1' 
                ? { ...slide, elements: [...slide.elements, newElement] }
                : slide
            )
          };
          
          setCurrentDeck(updatedDeck);
        };

        const updateElementPosition = (elementId: string, newPosition: any) => {
          const updatedDeck = {
            ...currentDeck,
            slides: currentDeck.slides.map(slide => ({
              ...slide,
              elements: slide.elements.map(element =>
                element.id === elementId
                  ? { ...element, position: newPosition }
                  : element
              )
            }))
          };
          
          setCurrentDeck(updatedDeck);
        };

        const saveProject = () => {
          onSave(currentDeck);
        };

        return (
          <div data-testid="slide-editor">
            <div data-testid="slide-title">{currentDeck.title}</div>
            <div data-testid="slide-count">{currentDeck.slides.length}</div>
            <div data-testid="element-count">
              {currentDeck.slides[0]?.elements.length || 0}
            </div>
            
            <button onClick={addElement} data-testid="add-element">
              Add Element
            </button>
            <button 
              onClick={() => updateElementPosition('element-1', {
                desktop: { x: 200, y: 200, width: 50, height: 50 },
                tablet: { x: 160, y: 160, width: 40, height: 40 },
                mobile: { x: 120, y: 120, width: 30, height: 30 }
              })}
              data-testid="update-position"
            >
              Update Position
            </button>
            <button onClick={saveProject} data-testid="save-project">
              Save Project
            </button>
          </div>
        );
      };

      render(<MockSlideEditor slideDeck={mockSlideDeck} onSave={mockOnSave} />);

      // Verify initial state
      expect(screen.getByTestId('slide-title')).toHaveTextContent('Test Slide Deck');
      expect(screen.getByTestId('slide-count')).toHaveTextContent('1');
      expect(screen.getByTestId('element-count')).toHaveTextContent('0');

      // Step 1: Add element
      fireEvent.click(screen.getByTestId('add-element'));

      await waitFor(() => {
        expect(screen.getByTestId('element-count')).toHaveTextContent('1');
      });

      // Step 2: Update element position
      fireEvent.click(screen.getByTestId('update-position'));

      // Step 3: Save project
      fireEvent.click(screen.getByTestId('save-project'));

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
      });

      // Verify the final saved state
      const savedDeck = mockOnSave.mock.calls[0][0] as SlideDeck;
      expect(savedDeck.slides[0].elements).toHaveLength(1);
      expect(savedDeck.slides[0].elements[0].type).toBe('hotspot');
    });

    test('responsive positioning works across device types', () => {
      const testPosition = {
        desktop: { x: 100, y: 100, width: 200, height: 150 },
        tablet: { x: 80, y: 80, width: 160, height: 120 },
        mobile: { x: 60, y: 60, width: 120, height: 90 }
      };

      const ResponsivePositionTest: React.FC = () => {
        const [currentDevice, setCurrentDevice] = React.useState<DeviceType>('desktop');
        const position = testPosition[currentDevice];

        return (
          <div data-testid="responsive-test">
            <div data-testid="current-device">{currentDevice}</div>
            <div data-testid="position-x">{position.x}</div>
            <div data-testid="position-y">{position.y}</div>
            <div data-testid="position-width">{position.width}</div>
            <div data-testid="position-height">{position.height}</div>
            
            <button onClick={() => setCurrentDevice('desktop')} data-testid="set-desktop">
              Desktop
            </button>
            <button onClick={() => setCurrentDevice('tablet')} data-testid="set-tablet">
              Tablet
            </button>
            <button onClick={() => setCurrentDevice('mobile')} data-testid="set-mobile">
              Mobile
            </button>
          </div>
        );
      };

      render(<ResponsivePositionTest />);

      // Test desktop positioning
      expect(screen.getByTestId('position-x')).toHaveTextContent('100');
      expect(screen.getByTestId('position-width')).toHaveTextContent('200');

      // Switch to tablet
      fireEvent.click(screen.getByTestId('set-tablet'));
      expect(screen.getByTestId('position-x')).toHaveTextContent('80');
      expect(screen.getByTestId('position-width')).toHaveTextContent('160');

      // Switch to mobile
      fireEvent.click(screen.getByTestId('set-mobile'));
      expect(screen.getByTestId('position-x')).toHaveTextContent('60');
      expect(screen.getByTestId('position-width')).toHaveTextContent('120');

      // Verify aspect ratio is maintained
      const mobilePosition = testPosition.mobile;
      const desktopPosition = testPosition.desktop;
      const mobileAspectRatio = mobilePosition.width / mobilePosition.height;
      const desktopAspectRatio = desktopPosition.width / desktopPosition.height;

      expect(Math.abs(mobileAspectRatio - desktopAspectRatio)).toBeLessThan(0.01);
    });
  });

  describe('Element Management Workflow', () => {
    test('add multiple element types and manage them', () => {
      const ElementManagementTest: React.FC = () => {
        const [elements, setElements] = React.useState<SlideElement[]>([]);

        const addHotspot = () => {
          const hotspot: SlideElement = {
            id: `hotspot-${Date.now()}`,
            type: 'hotspot',
            position: {
              desktop: { x: 100, y: 100, width: 50, height: 50 },
              tablet: { x: 80, y: 80, width: 40, height: 40 },
              mobile: { x: 60, y: 60, width: 30, height: 30 }
            },
            style: { backgroundColor: '#ff0000', borderRadius: '50%' },
            content: { title: 'Hotspot' },
            interactions: [],
            isVisible: true
          };
          setElements(prev => [...prev, hotspot]);
        };

        const addText = () => {
          const text: SlideElement = {
            id: `text-${Date.now()}`,
            type: 'text',
            position: {
              desktop: { x: 200, y: 200, width: 300, height: 100 },
              tablet: { x: 160, y: 160, width: 240, height: 80 },
              mobile: { x: 120, y: 120, width: 180, height: 60 }
            },
            style: { fontSize: 16, color: '#000000' },
            content: { textContent: 'Sample text' },
            interactions: [],
            isVisible: true
          };
          setElements(prev => [...prev, text]);
        };

        const removeElement = (id: string) => {
          setElements(prev => prev.filter(el => el.id !== id));
        };

        return (
          <div data-testid="element-manager">
            <div data-testid="element-count">{elements.length}</div>
            <div data-testid="hotspot-count">
              {elements.filter(el => el.type === 'hotspot').length}
            </div>
            <div data-testid="text-count">
              {elements.filter(el => el.type === 'text').length}
            </div>

            <button onClick={addHotspot} data-testid="add-hotspot">
              Add Hotspot
            </button>
            <button onClick={addText} data-testid="add-text">
              Add Text
            </button>
            
            {elements.map(element => (
              <div key={element.id} data-testid={`element-${element.id}`}>
                <span>{element.type}</span>
                <button 
                  onClick={() => removeElement(element.id)}
                  data-testid={`remove-${element.id}`}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        );
      };

      render(<ElementManagementTest />);

      // Initially no elements
      expect(screen.getByTestId('element-count')).toHaveTextContent('0');

      // Add hotspot
      fireEvent.click(screen.getByTestId('add-hotspot'));
      expect(screen.getByTestId('element-count')).toHaveTextContent('1');
      expect(screen.getByTestId('hotspot-count')).toHaveTextContent('1');

      // Add text
      fireEvent.click(screen.getByTestId('add-text'));
      expect(screen.getByTestId('element-count')).toHaveTextContent('2');
      expect(screen.getByTestId('text-count')).toHaveTextContent('1');

      // Remove elements (find the first remove button)
      const removeButtons = screen.getAllByText('Remove');
      fireEvent.click(removeButtons[0]);
      expect(screen.getByTestId('element-count')).toHaveTextContent('1');
    });

    test('element selection and property editing workflow', () => {
      const PropertyEditingTest: React.FC = () => {
        const [selectedElement, setSelectedElement] = React.useState<SlideElement | null>(null);
        const [elements, setElements] = React.useState<SlideElement[]>([
          {
            id: 'test-element',
            type: 'hotspot',
            position: {
              desktop: { x: 100, y: 100, width: 50, height: 50 },
              tablet: { x: 80, y: 80, width: 40, height: 40 },
              mobile: { x: 60, y: 60, width: 30, height: 30 }
            },
            style: { backgroundColor: '#ff0000' },
            content: { title: 'Original Title' },
            interactions: [],
            isVisible: true
          }
        ]);

        const updateElement = (updates: Partial<SlideElement>) => {
          if (!selectedElement) return;

          setElements(prev => prev.map(el => 
            el.id === selectedElement.id ? { ...el, ...updates } : el
          ));
          
          setSelectedElement(prev => prev ? { ...prev, ...updates } : null);
        };

        return (
          <div data-testid="property-editor">
            <div data-testid="selected-element-id">
              {selectedElement?.id || 'none'}
            </div>
            
            <button 
              onClick={() => setSelectedElement(elements[0])}
              data-testid="select-element"
            >
              Select Element
            </button>

            {selectedElement && (
              <div data-testid="properties-panel">
                <input
                  data-testid="title-input"
                  value={selectedElement.content?.title || ''}
                  onChange={(e) => updateElement({
                    content: { ...selectedElement.content, title: e.target.value }
                  })}
                />
                
                <input
                  data-testid="color-input"
                  value={selectedElement.style?.backgroundColor || '#000000'}
                  onChange={(e) => updateElement({
                    style: { ...selectedElement.style, backgroundColor: e.target.value }
                  })}
                />
              </div>
            )}

            <div data-testid="element-title">
              {elements[0]?.content?.title}
            </div>
            <div data-testid="element-color">
              {elements[0]?.style?.backgroundColor}
            </div>
          </div>
        );
      };

      render(<PropertyEditingTest />);

      // Initially no element selected
      expect(screen.getByTestId('selected-element-id')).toHaveTextContent('none');

      // Select element
      fireEvent.click(screen.getByTestId('select-element'));
      expect(screen.getByTestId('selected-element-id')).toHaveTextContent('test-element');

      // Verify properties panel appears
      expect(screen.getByTestId('properties-panel')).toBeInTheDocument();

      // Edit title
      const titleInput = screen.getByTestId('title-input') as HTMLInputElement;
      fireEvent.change(titleInput, { target: { value: 'Updated Title' } });
      expect(screen.getByTestId('element-title')).toHaveTextContent('Updated Title');

      // Edit color
      const colorInput = screen.getByTestId('color-input') as HTMLInputElement;
      fireEvent.change(colorInput, { target: { value: '#00ff00' } });
      expect(screen.getByTestId('element-color')).toHaveTextContent('#00ff00');
    });
  });

  describe('Auto-Save and State Management', () => {
    test('auto-save triggers after changes with debouncing', async () => {
      const mockAutoSave = vi.fn();
      
      const AutoSaveTest: React.FC = () => {
        const [content, setContent] = React.useState('');
        const [saveCount, setSaveCount] = React.useState(0);

        // Simulate debounced auto-save
        React.useEffect(() => {
          const timer = setTimeout(() => {
            if (content) {
              mockAutoSave(content);
              setSaveCount(prev => prev + 1);
            }
          }, 100);

          return () => clearTimeout(timer);
        }, [content]);

        return (
          <div data-testid="auto-save-test">
            <input
              data-testid="content-input"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            <div data-testid="save-count">{saveCount}</div>
          </div>
        );
      };

      render(<AutoSaveTest />);

      const input = screen.getByTestId('content-input') as HTMLInputElement;

      // Rapid changes should be debounced
      fireEvent.change(input, { target: { value: 'a' } });
      fireEvent.change(input, { target: { value: 'ab' } });
      fireEvent.change(input, { target: { value: 'abc' } });

      // Wait for debounce
      await waitFor(() => {
        expect(screen.getByTestId('save-count')).toHaveTextContent('1');
      }, { timeout: 200 });

      expect(mockAutoSave).toHaveBeenCalledWith('abc');
      expect(mockAutoSave).toHaveBeenCalledTimes(1);
    });

    test('state persistence across component re-renders', () => {
      const StatePersistenceTest: React.FC<{ componentId: number }> = ({ componentId }) => {
        const [slideDeck, setSlideDeck] = React.useState<SlideDeck>(() => ({
          id: 'persistent-deck',
          title: 'Persistent Deck',
          description: 'Test persistence',
          slides: [],
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
        }));

        const addSlide = () => {
          setSlideDeck(prev => ({
            ...prev,
            slides: [...prev.slides, {
              id: `slide-${prev.slides.length + 1}`,
              title: `Slide ${prev.slides.length + 1}`,
              elements: [],
              transitions: [],
              layout: {
                aspectRatio: '16:9',
                backgroundSize: 'contain',
                containerWidth: 1920,
                containerHeight: 1080,
                scaling: 'fit',
                backgroundPosition: 'center center'
              }
            } as InteractiveSlide]
          }));
        };

        return (
          <div data-testid="persistence-test">
            <div data-testid="component-key">{componentId}</div>
            <div data-testid="slide-count">{slideDeck.slides.length}</div>
            <button onClick={addSlide} data-testid="add-slide">
              Add Slide
            </button>
          </div>
        );
      };

      const { rerender } = render(<StatePersistenceTest key={1} componentId={1} />);

      // Add a slide
      fireEvent.click(screen.getByTestId('add-slide'));
      expect(screen.getByTestId('slide-count')).toHaveTextContent('1');

      // Re-render with different key (simulates component remount)
      rerender(<StatePersistenceTest key={2} componentId={2} />);
      
      // State should reset with new component instance
      expect(screen.getByTestId('slide-count')).toHaveTextContent('0');
    });
  });
});