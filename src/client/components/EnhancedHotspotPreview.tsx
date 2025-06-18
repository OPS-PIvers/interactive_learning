import React, { useState, useRef, useCallback, useEffect } from 'react';
import { HotspotData, TimelineEventData, InteractionType } from '../../shared/types';

interface TextPosition {
  x: number; // percentage
  y: number; // percentage  
  width: number; // pixels
  height: number; // pixels
}

interface SpotlightPosition {
  x: number; // percentage
  y: number; // percentage
  width: number; // pixels
  height: number; // pixels
}

interface EnhancedHotspotPreviewProps {
  backgroundImage: string; // base64 image
  hotspot: HotspotData;
  selectedEventTypes: Set<InteractionType>;
  
  // Event settings
  zoomLevel: number;
  spotlightShape: 'circle' | 'rectangle';
  dimPercentage: number;
  textContent: string;
  textPosition: 'top' | 'bottom' | 'left' | 'right' | 'center';
  
  // Position callbacks
  onSpotlightPositionChange?: (position: SpotlightPosition) => void;
  onTextPositionChange?: (position: TextPosition) => void;
}

// Spotlight drag handles component
const SpotlightHandles: React.FC<{
  position: SpotlightPosition;
  onPositionChange: (position: SpotlightPosition) => void;
}> = ({ position, onPositionChange }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState<'move' | 'resize'>('move');
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent, type: 'move' | 'resize') => {
    e.preventDefault();
    setIsDragging(true);
    setDragType(type);
    setDragStart({ x: e.clientX, y: e.clientY });
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    
    if (dragType === 'move') {
      onPositionChange({
        ...position,
        x: Math.max(0, Math.min(100, position.x + (deltaX / 8))), // Scale to percentage
        y: Math.max(0, Math.min(100, position.y + (deltaY / 8)))
      });
    } else {
      onPositionChange({
        ...position,
        width: Math.max(20, position.width + deltaX),
        height: Math.max(20, position.height + deltaY)
      });
    }
    
    setDragStart({ x: e.clientX, y: e.clientY });
  }, [isDragging, dragType, dragStart, position, onPositionChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);
  
  return (
    <>
      {/* Move handle */}
      <div 
        className="absolute w-3 h-3 bg-purple-500 border-2 border-white rounded-full cursor-move transform -translate-x-1/2 -translate-y-1/2 hover:bg-purple-400 transition-colors z-10"
        style={{ 
          left: `${position.x}%`, 
          top: `${position.y}%` 
        }}
        title="Drag to move spotlight"
        onMouseDown={(e) => handleMouseDown(e, 'move')}
      />
      
      {/* Resize handle */}
      <div 
        className="absolute w-3 h-3 bg-purple-500 border-2 border-white rounded-full cursor-nw-resize transform -translate-x-1/2 -translate-y-1/2 hover:bg-purple-400 transition-colors z-10"
        style={{ 
          left: `calc(${position.x}% + ${position.width / 8}px)`, 
          top: `calc(${position.y}% + ${position.height / 8}px)` 
        }}
        title="Drag to resize"
        onMouseDown={(e) => handleMouseDown(e, 'resize')}
      />
    </>
  );
};

// Text drag handles component  
const TextHandles: React.FC<{
  position: TextPosition;
  onPositionChange: (position: TextPosition) => void;
}> = ({ position, onPositionChange }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState<'move' | 'resize'>('move');
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent, type: 'move' | 'resize') => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setDragType(type);
    setDragStart({ x: e.clientX, y: e.clientY });
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    
    if (dragType === 'move') {
      onPositionChange({
        ...position,
        x: Math.max(0, Math.min(100, position.x + (deltaX / 8))),
        y: Math.max(0, Math.min(100, position.y + (deltaY / 8)))
      });
    } else {
      onPositionChange({
        ...position,
        width: Math.max(100, position.width + deltaX),
        height: Math.max(40, position.height + deltaY)
      });
    }
    
    setDragStart({ x: e.clientX, y: e.clientY });
  }, [isDragging, dragType, dragStart, position, onPositionChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);
  
  return (
    <>
      {/* Move handle */}
      <div 
        className="absolute -top-2 -left-2 w-3 h-3 bg-blue-500 border-2 border-white rounded-full cursor-move hover:bg-blue-400 transition-colors z-20"
        title="Drag to move text"
        onMouseDown={(e) => handleMouseDown(e, 'move')}
      />
      
      {/* Resize handle */}
      <div 
        className="absolute -bottom-2 -right-2 w-3 h-3 bg-blue-500 border-2 border-white rounded-full cursor-nw-resize hover:bg-blue-400 transition-colors z-20"
        title="Drag to resize text box"
        onMouseDown={(e) => handleMouseDown(e, 'resize')}
      />
    </>
  );
};

const EnhancedHotspotPreview: React.FC<EnhancedHotspotPreviewProps> = ({
  backgroundImage,
  hotspot,
  selectedEventTypes,
  zoomLevel,
  spotlightShape,
  dimPercentage,
  textContent,
  textPosition,
  onSpotlightPositionChange,
  onTextPositionChange
}) => {
  const [previewMode, setPreviewMode] = useState<'edit' | 'preview'>('edit');
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentAnimationStep, setCurrentAnimationStep] = useState(0);
  const [previewZoom, setPreviewZoom] = useState(1);
  const [previewPan, setPreviewPan] = useState({ x: 0, y: 0 });
  
  // Position states
  const [spotlightPosition, setSpotlightPosition] = useState<SpotlightPosition>({
    x: 35, y: 30, width: 120, height: 120
  });
  const [textBoxPosition, setTextBoxPosition] = useState<TextPosition>({
    x: 50, y: 20, width: 200, height: 60
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Convert event types to animation sequence
  const animationSequence = Array.from(selectedEventTypes).map(type => ({
    type,
    duration: 3000 // Default duration, could be configurable
  }));

  // Handle preview mode animation
  useEffect(() => {
    if (previewMode === 'preview' && animationSequence.length > 0) {
      setIsAnimating(true);
      setCurrentAnimationStep(0);
      
      const animateSequence = async () => {
        for (let i = 0; i < animationSequence.length; i++) {
          setCurrentAnimationStep(i);
          await new Promise(resolve => setTimeout(resolve, animationSequence[i].duration));
        }
        setIsAnimating(false);
      };
      
      animateSequence();
    } else {
      setIsAnimating(false);
      setCurrentAnimationStep(0);
    }
  }, [previewMode, animationSequence.length]);

  // Native wheel event handler to fix passive event listener warnings
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleNativeWheel = (e: WheelEvent) => {
      if (previewMode === 'edit' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        setPreviewZoom(prev => Math.max(0.1, Math.min(5, prev * delta)));
      }
    };

    // Add event listener with passive: false to allow preventDefault
    container.addEventListener('wheel', handleNativeWheel, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleNativeWheel);
    };
  }, [previewMode]);

  // Spotlight drag handlers
  const handleSpotlightDrag = useCallback((newPosition: SpotlightPosition) => {
    setSpotlightPosition(newPosition);
    onSpotlightPositionChange?.(newPosition);
  }, [onSpotlightPositionChange]);

  // Text box drag handlers  
  const handleTextDrag = useCallback((newPosition: TextPosition) => {
    setTextBoxPosition(newPosition);
    onTextPositionChange?.(newPosition);
  }, [onTextPositionChange]);

  // Apply current animation state
  const getCurrentAnimationState = () => {
    if (previewMode === 'edit') {
      return {
        showSpotlight: selectedEventTypes.has(InteractionType.HIGHLIGHT_HOTSPOT),
        showText: selectedEventTypes.has(InteractionType.SHOW_TEXT),
        showZoomRect: selectedEventTypes.has(InteractionType.PAN_ZOOM_TO_HOTSPOT),
        actualZoom: 1,
        showPulse: false
      };
    } else {
      // Preview mode - apply current animation step
      const currentEvent = animationSequence[currentAnimationStep];
      if (!currentEvent) return { showSpotlight: false, showText: false, showZoomRect: false, actualZoom: 1, showPulse: false };
      
      const state = {
        showSpotlight: false,
        showText: false, 
        showZoomRect: false,
        actualZoom: 1,
        showPulse: false
      };

      // Apply all events up to current step
      for (let i = 0; i <= currentAnimationStep; i++) {
        const event = animationSequence[i];
        switch (event.type) {
          case InteractionType.HIGHLIGHT_HOTSPOT:
            state.showSpotlight = true;
            break;
          case InteractionType.SHOW_TEXT:
            state.showText = true;
            break;
          case InteractionType.PAN_ZOOM_TO_HOTSPOT:
            state.actualZoom = zoomLevel;
            break;
          case InteractionType.PULSE_HOTSPOT:
            state.showPulse = true;
            break;
        }
      }
      
      return state;
    }
  };

  const animationState = getCurrentAnimationState();

  return (
    <div className="mb-4">
      {/* Toggle Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-white">Preview</h3>
        <div className="flex bg-slate-700 rounded-lg p-1">
          <button
            onClick={() => setPreviewMode('edit')}
            className={`px-3 py-1 text-sm rounded transition-colors ${
              previewMode === 'edit' 
                ? 'bg-blue-600 text-white' 
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Edit
          </button>
          <button
            onClick={() => setPreviewMode('preview')}
            className={`px-3 py-1 text-sm rounded transition-colors ${
              previewMode === 'preview' 
                ? 'bg-blue-600 text-white' 
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Preview
          </button>
        </div>
      </div>

      {/* Preview Container */}
      <div 
        ref={containerRef}
        className="relative bg-slate-700 rounded-lg h-80 overflow-hidden cursor-grab active:cursor-grabbing"
        style={{ 
          transform: `scale(${previewZoom}) translate(${previewPan.x}px, ${previewPan.y}px)`,
          transformOrigin: 'center',
          transition: previewMode === 'preview' ? 'all 0.5s ease' : 'none'
        }}
      >
        {/* Actual Background Image */}
        {backgroundImage && (
          <img
            ref={imageRef}
            src={backgroundImage}
            alt="Hotspot background"
            className="absolute inset-0 w-full h-full object-contain"
            draggable={false}
          />
        )}

        {/* Placeholder if no image */}
        {!backgroundImage && (
          <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm">
            Upload an image to see preview
          </div>
        )}

        {/* Hotspot Dot */}
        <div
          className="absolute w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-lg transform -translate-x-1/2 -translate-y-1/2"
          style={{ 
            left: `${hotspot.x}%`, 
            top: `${hotspot.y}%`,
            animation: animationState.showPulse ? 'subtle-pulse-keyframes 2s infinite ease-in-out' : 'none'
          }}
        />

        {/* Spotlight Overlay */}
        {animationState.showSpotlight && (
          <>
            {/* Dim overlay */}
            <div 
              className="absolute inset-0 pointer-events-none"
              style={{ background: `rgba(0, 0, 0, ${dimPercentage / 100})` }}
            />
            
            {/* Spotlight area */}
            <div 
              className={`absolute border-2 border-purple-500 pointer-events-none ${
                spotlightShape === 'circle' ? 'rounded-full' : ''
              }`}
              style={{
                left: `${spotlightPosition.x}%`,
                top: `${spotlightPosition.y}%`,
                width: `${spotlightPosition.width}px`,
                height: `${spotlightPosition.height}px`,
                boxShadow: `0 0 0 1000px rgba(0, 0, 0, ${dimPercentage / 100})`,
                clipPath: spotlightShape === 'circle' 
                  ? `circle(${Math.min(spotlightPosition.width, spotlightPosition.height) / 2}px at center)`
                  : 'none'
              }}
            />

            {/* Spotlight drag handles (Edit mode only) */}
            {previewMode === 'edit' && (
              <SpotlightHandles 
                position={spotlightPosition}
                onPositionChange={handleSpotlightDrag}
              />
            )}
          </>
        )}

        {/* Pan & Zoom Rectangle (Edit mode only) */}
        {previewMode === 'edit' && selectedEventTypes.has(InteractionType.PAN_ZOOM_TO_HOTSPOT) && (
          <div 
            className="absolute border-2 border-blue-500 bg-blue-500 bg-opacity-20 pointer-events-none"
            style={{
              left: `${hotspot.x - 10}%`,
              top: `${hotspot.y - 10}%`, 
              width: '20%',
              height: '20%'
            }}
          >
            <div className="absolute -top-6 left-0 text-xs text-blue-400 bg-slate-800 px-2 py-1 rounded">
              Zoom {zoomLevel}x
            </div>
          </div>
        )}

        {/* Text Display */}
        {animationState.showText && textContent && (
          <div
            className="absolute bg-slate-800 bg-opacity-90 text-white p-3 rounded-lg border border-slate-600 shadow-lg"
            style={{
              left: `${textBoxPosition.x}%`,
              top: `${textBoxPosition.y}%`,
              width: `${textBoxPosition.width}px`,
              minHeight: `${textBoxPosition.height}px`,
              transform: 'translate(-50%, -50%)',
              zIndex: 1000 // Above dim layer
            }}
          >
            {textContent}
            
            {/* Text drag handles (Edit mode only) */}
            {previewMode === 'edit' && (
              <TextHandles 
                position={textBoxPosition}
                onPositionChange={handleTextDrag}
              />
            )}
          </div>
        )}

        {/* Animation Progress Indicator (Preview mode only) */}
        {previewMode === 'preview' && isAnimating && (
          <div className="absolute bottom-4 left-4 right-4">
            <div className="bg-slate-800 bg-opacity-90 rounded-lg p-2">
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>Animation Progress</span>
                <span>{currentAnimationStep + 1} / {animationSequence.length}</span>
              </div>
              <div className="w-full bg-slate-600 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentAnimationStep + 1) / animationSequence.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Zoom indicator */}
        <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
          {(animationState.actualZoom * previewZoom).toFixed(1)}x
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-4 text-xs text-slate-400">
        {previewMode === 'edit' ? (
          <p>Ctrl+scroll to zoom • Drag handles to position elements</p>
        ) : (
          <p>Watching animation sequence • Switch to Edit mode to modify</p>
        )}
      </div>
    </div>
  );
};

export default EnhancedHotspotPreview;