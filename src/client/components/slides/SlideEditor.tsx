import React, { useState, useCallback, useRef, useEffect } from 'react';
import { SlideDeck, InteractiveSlide, SlideElement, DeviceType, FixedPosition, ResponsivePosition } from '../../../shared/slideTypes';
import { useDeviceDetection } from '../../hooks/useDeviceDetection';
import { useIsMobile } from '../../hooks/useIsMobile';
import MobilePropertiesPanel from './MobilePropertiesPanel';

interface SlideEditorProps {
  slideDeck: SlideDeck;
  onSlideDeckChange: (slideDeck: SlideDeck) => void;
  onClose: () => void;
  className?: string;
  deviceTypeOverride?: DeviceType;
}

interface DragState {
  isDragging: boolean;
  elementId: string | null;
  startPosition: { x: number; y: number };
  startElementPosition: FixedPosition;
}

/**
 * SlideEditor - Visual drag-and-drop editor for creating slides
 * 
 * Maintains consistency with Interactive Learning Hub design system
 */
export const SlideEditor: React.FC<SlideEditorProps> = ({
  slideDeck,
  onSlideDeckChange,
  onClose,
  className = '',
  deviceTypeOverride
}) => {
  const { deviceType: detectedDeviceType, viewportInfo } = useDeviceDetection();
  const deviceType = deviceTypeOverride || detectedDeviceType;
  const isMobile = useIsMobile();
  const canvasRef = useRef<HTMLDivElement>(null);
  
  // Editor state
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    elementId: null,
    startPosition: { x: 0, y: 0 },
    startElementPosition: { x: 0, y: 0, width: 0, height: 0 }
  });
  
  const currentSlide = slideDeck.slides[currentSlideIndex];

  // Handle element drag start
  const handleElementDragStart = useCallback((elementId: string, event: React.MouseEvent | React.TouchEvent) => {
    event.stopPropagation();
    
    const element = currentSlide.elements.find(el => el.id === elementId);
    if (!element) return;

    const startPosition = 'touches' in event ? { x: event.touches[0].clientX, y: event.touches[0].clientY } : { x: event.clientX, y: event.clientY };
    
    const position = element.position[deviceType];
    setDragState({
      isDragging: true,
      elementId,
      startPosition: startPosition,
      startElementPosition: position
    });
    
    setSelectedElementId(elementId);
  }, [currentSlide.elements, deviceType]);

  // Handle mouse move during drag
  const handleMove = useCallback((event: MouseEvent | TouchEvent) => {
    if (!dragState.isDragging || !dragState.elementId) return;

    const currentPosition = 'touches' in event ? { x: event.touches[0].clientX, y: event.touches[0].clientY } : { x: event.clientX, y: event.clientY };
    
    const deltaX = currentPosition.x - dragState.startPosition.x;
    const deltaY = currentPosition.y - dragState.startPosition.y;
    
    const newPosition: FixedPosition = {
      x: Math.max(0, dragState.startElementPosition.x + deltaX),
      y: Math.max(0, dragState.startElementPosition.y + deltaY),
      width: dragState.startElementPosition.width,
      height: dragState.startElementPosition.height
    };
    
    // Update element position
    const updatedSlides = slideDeck.slides.map((slide, index) => {
      if (index !== currentSlideIndex) return slide;
      
      return {
        ...slide,
        elements: slide.elements.map(element => {
          if (element.id !== dragState.elementId) return element;
          
          return {
            ...element,
            position: {
              ...element.position,
              [deviceType]: newPosition
            }
          };
        })
      };
    });
    
    onSlideDeckChange({
      ...slideDeck,
      slides: updatedSlides
    });
  }, [dragState, slideDeck, currentSlideIndex, deviceType, onSlideDeckChange]);

  // Handle mouse up (end drag)
  const handleDragEnd = useCallback(() => {
    setDragState({
      isDragging: false,
      elementId: null,
      startPosition: { x: 0, y: 0 },
      startElementPosition: { x: 0, y: 0, width: 0, height: 0 }
    });
  }, []);

  // Attach global mouse event listeners
  useEffect(() => {
    if (dragState.isDragging) {
      document.addEventListener('mousemove', handleMove);
      document.addEventListener('mouseup', handleDragEnd);
      document.addEventListener('touchmove', handleMove);
      document.addEventListener('touchend', handleDragEnd);
      
      return () => {
        document.removeEventListener('mousemove', handleMove);
        document.removeEventListener('mouseup', handleDragEnd);
        document.removeEventListener('touchmove', handleMove);
        document.removeEventListener('touchend', handleDragEnd);
      };
    }
  }, [dragState.isDragging, handleMove, handleDragEnd]);

  // Add new element
  const handleAddElement = useCallback((elementType: 'hotspot' | 'text' | 'shape') => {
    const newElement: SlideElement = {
      id: `element_${Date.now()}`,
      type: elementType,
      position: {
        desktop: { x: 100, y: 100, width: 40, height: 40 },
        tablet: { x: 80, y: 80, width: 36, height: 36 },
        mobile: { x: 60, y: 60, width: 32, height: 32 }
      },
      content: elementType === 'hotspot' ? {
        title: 'New Hotspot',
        description: 'Click to interact',
        style: { backgroundColor: '#3b82f6', borderRadius: '50%' }
      } : elementType === 'text' ? {
        title: 'New Text Element',
        description: 'Edit this text',
        style: { backgroundColor: 'rgba(30, 41, 59, 0.9)', color: '#ffffff' }
      } : {
        shapeType: 'rectangle',
        style: { backgroundColor: '#8b5cf6', borderRadius: '8px' }
      },
      interactions: [],
      isVisible: true,
      zIndex: currentSlide.elements.length + 1
    };

    const updatedSlides = slideDeck.slides.map((slide, index) => {
      if (index !== currentSlideIndex) return slide;
      
      return {
        ...slide,
        elements: [...slide.elements, newElement]
      };
    });
    
    onSlideDeckChange({
      ...slideDeck,
      slides: updatedSlides
    });
    
    setSelectedElementId(newElement.id);
  }, [slideDeck, currentSlideIndex, onSlideDeckChange, currentSlide.elements.length]);

  // Delete selected element
  const handleDeleteElement = useCallback(() => {
    if (!selectedElementId) return;
    
    const updatedSlides = slideDeck.slides.map((slide, index) => {
      if (index !== currentSlideIndex) return slide;
      
      return {
        ...slide,
        elements: slide.elements.filter(element => element.id !== selectedElementId)
      };
    });
    
    onSlideDeckChange({
      ...slideDeck,
      slides: updatedSlides
    });
    
    setSelectedElementId(null);
  }, [slideDeck, currentSlideIndex, selectedElementId, onSlideDeckChange]);

  const selectedElement = selectedElementId 
    ? currentSlide.elements.find(el => el.id === selectedElementId)
    : null;

  const [isMobilePanelOpen, setIsMobilePanelOpen] = useState(false);

  useEffect(() => {
    if (isMobile && selectedElementId) {
      setIsMobilePanelOpen(true);
    } else {
      setIsMobilePanelOpen(false);
    }
  }, [isMobile, selectedElementId]);

  return (
    <div className={`slide-editor w-full h-full flex flex-col bg-gradient-to-br from-slate-900 to-slate-800 ${className}`}>
      {isMobile && isMobilePanelOpen && (
        <MobilePropertiesPanel
          selectedElement={selectedElement}
          deviceType={deviceType}
          onDelete={handleDeleteElement}
          onClose={() => {
            setSelectedElementId(null);
            setIsMobilePanelOpen(false);
          }}
        />
      )}
      {/* Editor Header - Matches app header styling */}
      <div className="editor-header bg-slate-800 border-b border-slate-700 p-4 flex items-center justify-between shadow-2xl">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
            Slide Editor
          </h1>
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-3 py-1 rounded-lg text-xs font-semibold text-white shadow-lg">
            {slideDeck.slides.length} SLIDES
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Add Element Buttons */}
          <div className="flex space-x-2">
            <button
              className={`slide-nav-button slide-nav-button-secondary text-sm px-3 py-2 ${isMobile ? 'mobile-add-button' : ''}`}
              onClick={() => handleAddElement('hotspot')}
            >
              + Hotspot
            </button>
            <button
              className={`slide-nav-button slide-nav-button-secondary text-sm px-3 py-2 ${isMobile ? 'mobile-add-button' : ''}`}
              onClick={() => handleAddElement('text')}
            >
              + Text
            </button>
            <button
              className={`slide-nav-button slide-nav-button-secondary text-sm px-3 py-2 ${isMobile ? 'mobile-add-button' : ''}`}
              onClick={() => handleAddElement('shape')}
            >
              + Shape
            </button>
          </div>
          
          <div className="h-6 w-px bg-slate-600" />
          
          <button
            className="slide-nav-button slide-nav-button-primary"
            onClick={onClose}
          >
            Done
          </button>
        </div>
      </div>

      {/* Main Editor Content */}
      <div className="editor-content flex-1 flex">
        {/* Canvas Area */}
        <div className="canvas-area flex-1 p-6 relative">
          <div
            ref={canvasRef}
            className="slide-canvas relative w-full h-full bg-slate-900 rounded-xl border border-slate-700 overflow-hidden shadow-2xl"
            style={{
              backgroundImage: currentSlide.backgroundImage ? `url(${currentSlide.backgroundImage})` : undefined,
              backgroundSize: currentSlide.layout?.backgroundSize || 'cover',
              backgroundPosition: currentSlide.layout?.backgroundPosition || 'center',
              backgroundRepeat: 'no-repeat'
            }}
          >
            {/* Render Elements */}
            {currentSlide.elements
              .filter(element => element.isVisible)
              .map(element => {
                const position = element.position[deviceType];
                const isSelected = element.id === selectedElementId;
                
                return (
                  <div
                    key={element.id}
                    className={`absolute cursor-move transition-all duration-200 ${
                      isSelected ? 'ring-2 ring-purple-500 ring-opacity-75' : ''
                    }`}
                    style={{
                      left: position.x,
                      top: position.y,
                      width: position.width,
                      height: position.height,
                      zIndex: element.zIndex
                    }}
                    onMouseDown={(e) => handleElementDragStart(element.id, e)}
                    onTouchStart={(e) => handleElementDragStart(element.id, e)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedElementId(element.id);
                    }}
                  >
                    {/* Element Content Based on Type */}
                    {element.type === 'hotspot' && (
                      <div
                        className="w-full h-full rounded-full shadow-2xl border-2 border-white border-opacity-30"
                        style={{
                          backgroundColor: element.content?.style?.backgroundColor || '#3b82f6'
                        }}
                      />
                    )}
                    
                    {element.type === 'text' && (
                      <div
                        className="w-full h-full p-2 rounded-xl shadow-2xl text-xs flex items-center justify-center text-center"
                        style={{
                          backgroundColor: element.content?.style?.backgroundColor || 'rgba(30, 41, 59, 0.9)',
                          color: element.content?.style?.color || '#ffffff'
                        }}
                      >
                        <div>
                          <div className="font-semibold">{element.content?.title || 'Text'}</div>
                          {element.content?.description && (
                            <div className="text-xs opacity-75">{element.content.description}</div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {element.type === 'shape' && (
                      <div
                        className="w-full h-full shadow-2xl"
                        style={{
                          backgroundColor: element.content?.style?.backgroundColor || '#8b5cf6',
                          borderRadius: element.content?.style?.borderRadius || '8px'
                        }}
                      />
                    )}
                  </div>
                );
              })}
            
            {/* Selection Guidelines */}
            {selectedElement && (
              <div
                className="absolute pointer-events-none"
                style={{
                  left: selectedElement.position[deviceType].x - 2,
                  top: selectedElement.position[deviceType].y - 2,
                  width: selectedElement.position[deviceType].width + 4,
                  height: selectedElement.position[deviceType].height + 4,
                  border: '2px dashed #a855f7',
                  borderRadius: '4px'
                }}
              />
            )}
          </div>
          
          {/* Canvas Info */}
          <div className="absolute bottom-4 left-4 bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-slate-300 shadow-lg">
            <div>Canvas: {deviceType} view</div>
            <div>Elements: {currentSlide.elements.length}</div>
            {selectedElement && (
              <div className="text-purple-400 font-semibold">
                Selected: {selectedElement.type}
              </div>
            )}
          </div>
        </div>

        {/* Properties Panel */}
        {!isMobile && (
          <div className="properties-panel w-80 bg-slate-800 border-l border-slate-700 p-4 shadow-2xl">
            <h3 className="text-white font-semibold mb-4">Properties</h3>
            
            {selectedElement ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Element Type
                  </label>
                  <div className="bg-slate-700 px-3 py-2 rounded-lg text-white capitalize">
                    {selectedElement.type}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Position ({deviceType})
                  </label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400">X:</span>
                      <span className="text-white ml-1">{selectedElement.position[deviceType].x}px</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Y:</span>
                      <span className="text-white ml-1">{selectedElement.position[deviceType].y}px</span>
                    </div>
                    <div>
                      <span className="text-slate-400">W:</span>
                      <span className="text-white ml-1">{selectedElement.position[deviceType].width}px</span>
                    </div>
                    <div>
                      <span className="text-slate-400">H:</span>
                      <span className="text-white ml-1">{selectedElement.position[deviceType].height}px</span>
                    </div>
                  </div>
                </div>
                
                <button
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg transition-colors font-semibold"
                  onClick={handleDeleteElement}
                >
                  Delete Element
                </button>
              </div>
            ) : (
              <div className="text-slate-400 text-sm">
                Select an element to edit its properties
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
};

export default SlideEditor;