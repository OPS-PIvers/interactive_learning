import React, { useState, useCallback, useRef, useEffect } from 'react';
import { SlideDeck, InteractiveSlide, SlideElement, DeviceType, FixedPosition, ResponsivePosition } from '../../../shared/slideTypes';
import { useDeviceDetection } from '../../hooks/useDeviceDetection';
import { useIsMobile } from '../../hooks/useIsMobile';
import MobilePropertiesPanel from './MobilePropertiesPanel';
import { calculateCanvasDimensions } from '../../utils/aspectRatioUtils';

interface SlideEditorProps {
  slideDeck: SlideDeck;
  onSlideDeckChange: (slideDeck: SlideDeck) => void;
  onClose: () => void;
  className?: string;
  deviceTypeOverride?: DeviceType;
  onAspectRatioChange?: (slideIndex: number, aspectRatio: string) => void;
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
  deviceTypeOverride,
  onAspectRatioChange
}) => {
  const { deviceType: detectedDeviceType, viewportInfo } = useDeviceDetection();
  const deviceType = deviceTypeOverride || detectedDeviceType;
  const isMobile = useIsMobile();
  const canvasRef = useRef<HTMLDivElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  
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
  
  // Calculate canvas dimensions based on aspect ratio
  const canvasDimensions = React.useMemo(() => {
    if (!canvasContainerRef.current || !currentSlide?.layout?.aspectRatio) {
      return { width: 800, height: 600, scale: 1 };
    }
    
    const containerRect = canvasContainerRef.current.getBoundingClientRect();
    return calculateCanvasDimensions(
      currentSlide.layout.aspectRatio,
      containerRect.width || 800,
      containerRect.height || 600
    );
  }, [currentSlide?.layout?.aspectRatio, viewportInfo.width, viewportInfo.height]);

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
      

      {/* Main Editor Content */}
      <div className="editor-content flex-1 flex">
        {/* Canvas Area */}
        <div ref={canvasContainerRef} className="canvas-area flex-1 p-6 relative flex items-center justify-center">
          <div
            ref={canvasRef}
            className="slide-canvas relative bg-slate-900 rounded-xl border border-slate-700 overflow-hidden shadow-2xl"
            style={{
              width: canvasDimensions.width,
              height: canvasDimensions.height,
              // Legacy background image support
              backgroundImage: (!currentSlide.backgroundMedia && currentSlide.backgroundImage) 
                ? `url(${currentSlide.backgroundImage})` 
                : undefined,
              backgroundSize: currentSlide.layout?.backgroundSize || 'cover',
              backgroundPosition: currentSlide.layout?.backgroundPosition || 'center',
              backgroundRepeat: 'no-repeat'
            }}
          >
            {/* Background Media Renderer */}
            {currentSlide.backgroundMedia && currentSlide.backgroundMedia.type !== 'none' && (
              <div className="absolute inset-0 w-full h-full">
                {/* Background Overlay */}
                {currentSlide.backgroundMedia.overlay?.enabled && (
                  <div 
                    className="absolute inset-0 w-full h-full z-10"
                    style={{
                      backgroundColor: currentSlide.backgroundMedia.overlay.color || '#000000',
                      opacity: currentSlide.backgroundMedia.overlay.opacity || 0.3
                    }}
                  />
                )}

                {/* Image Background */}
                {currentSlide.backgroundMedia.type === 'image' && currentSlide.backgroundMedia.url && (
                  <img
                    src={currentSlide.backgroundMedia.url}
                    alt="Slide background"
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{
                      objectFit: currentSlide.backgroundMedia.settings?.size === 'contain' 
                        ? 'contain' 
                        : currentSlide.backgroundMedia.settings?.size === 'stretch' 
                          ? 'fill' 
                          : 'cover',
                      objectPosition: currentSlide.backgroundMedia.settings?.position || 'center'
                    }}
                  />
                )}

                {/* Video Background */}
                {currentSlide.backgroundMedia.type === 'video' && currentSlide.backgroundMedia.url && (
                  <video
                    src={currentSlide.backgroundMedia.url}
                    autoPlay={currentSlide.backgroundMedia.autoplay}
                    loop={currentSlide.backgroundMedia.loop}
                    muted={currentSlide.backgroundMedia.muted}
                    controls={currentSlide.backgroundMedia.controls}
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{
                      objectFit: currentSlide.backgroundMedia.settings?.size === 'contain' 
                        ? 'contain' 
                        : currentSlide.backgroundMedia.settings?.size === 'stretch' 
                          ? 'fill' 
                          : 'cover',
                      objectPosition: currentSlide.backgroundMedia.settings?.position || 'center'
                    }}
                    onLoadedData={(e) => {
                      if (currentSlide.backgroundMedia?.volume !== undefined) {
                        (e.target as HTMLVideoElement).volume = currentSlide.backgroundMedia.volume;
                      }
                    }}
                  />
                )}

                {/* YouTube Background */}
                {currentSlide.backgroundMedia.type === 'youtube' && currentSlide.backgroundMedia.youtubeId && (
                  <div className="absolute inset-0 w-full h-full">
                    <iframe
                      src={`https://www.youtube.com/embed/${currentSlide.backgroundMedia.youtubeId}?autoplay=${
                        currentSlide.backgroundMedia.autoplay ? 1 : 0
                      }&loop=${
                        currentSlide.backgroundMedia.loop ? 1 : 0
                      }&mute=${
                        currentSlide.backgroundMedia.muted ? 1 : 0
                      }&controls=${
                        currentSlide.backgroundMedia.controls ? 1 : 0
                      }&start=${
                        currentSlide.backgroundMedia.startTime || 0
                      }&end=${
                        currentSlide.backgroundMedia.endTime || ''
                      }&rel=0&modestbranding=1&playsinline=1`}
                      className="absolute inset-0 w-full h-full"
                      allow="autoplay; encrypted-media"
                      allowFullScreen
                      title="Background Video"
                      style={{
                        border: 'none',
                        objectFit: currentSlide.backgroundMedia.settings?.size === 'contain' 
                          ? 'contain' 
                          : 'cover'
                      }}
                    />
                  </div>
                )}

                {/* Audio Background */}
                {currentSlide.backgroundMedia.type === 'audio' && currentSlide.backgroundMedia.url && (
                  <>
                    <audio
                      src={currentSlide.backgroundMedia.url}
                      autoPlay={currentSlide.backgroundMedia.autoplay}
                      loop={currentSlide.backgroundMedia.loop}
                      controls={currentSlide.backgroundMedia.controls}
                      className="hidden"
                      onLoadedData={(e) => {
                        if (currentSlide.backgroundMedia?.volume !== undefined) {
                          (e.target as HTMLAudioElement).volume = currentSlide.backgroundMedia.volume;
                        }
                      }}
                    />
                    {/* Audio visualization or indicator */}
                    <div className="absolute top-4 right-4 z-20 bg-black/50 rounded-full p-2">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M9 12h.01M15 12h.01" />
                      </svg>
                    </div>
                  </>
                )}
              </div>
            )}
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
                      left: position.x * canvasDimensions.scale,
                      top: position.y * canvasDimensions.scale,
                      width: position.width * canvasDimensions.scale,
                      height: position.height * canvasDimensions.scale,
                      zIndex: (element.zIndex || 0) + 20 // Ensure elements are above background media
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

      </div>

    </div>
  );
};

export default SlideEditor;