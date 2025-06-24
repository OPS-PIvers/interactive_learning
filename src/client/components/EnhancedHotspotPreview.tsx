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
  
  // Position data
  spotlightPosition: SpotlightPosition;
  textBoxPosition: TextPosition;
  
  // Position callbacks
  onSpotlightPositionChange?: (position: SpotlightPosition) => void;
  onTextPositionChange?: (position: TextPosition) => void;
  onZoomLevelChange?: (level: number) => void;
}

// Spotlight drag handles component
const SpotlightHandles: React.FC<{
  position: SpotlightPosition;
  onPositionChange: (position: SpotlightPosition) => void;
}> = ({ position, onPositionChange }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState<'move' | 'resize'>('move');
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent, type: 'move' | 'resize') => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setDragType(type);
    setDragStart({ x: e.clientX, y: e.clientY });

    // Get container element from parent preview container
    const container = e.currentTarget.closest('.relative.bg-slate-700');
    if (container) {
      containerRef.current = container as HTMLDivElement;
    }
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    
    if (dragType === 'move') {
      // Convert pixel movement to percentage movement based on container size
      const percentDeltaX = (deltaX / containerRect.width) * 100;
      const percentDeltaY = (deltaY / containerRect.height) * 100;
      
      // Calculate spotlight boundaries based on its size
      const spotlightWidthPercent = (position.width / containerRect.width) * 100;
      const spotlightHeightPercent = (position.height / containerRect.height) * 100;
      
      // Apply position with proper bounds checking (keep spotlight center within reasonable bounds)
      const newX = Math.max(spotlightWidthPercent / 2 + 2, Math.min(100 - spotlightWidthPercent / 2 - 2, position.x + percentDeltaX));
      const newY = Math.max(spotlightHeightPercent / 2 + 2, Math.min(100 - spotlightHeightPercent / 2 - 2, position.y + percentDeltaY));
      
      onPositionChange({
        ...position,
        x: newX,
        y: newY
      });
    } else {
      // Resize: maintain minimum sizes and reasonable maximums
      const newWidth = Math.max(30, Math.min(300, position.width + deltaX));
      const newHeight = Math.max(30, Math.min(300, position.height + deltaY));
      
      onPositionChange({
        ...position,
        width: newWidth,
        height: newHeight
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
      {/* Move handle - Center of spotlight */}
      <div 
        className="absolute w-4 h-4 bg-purple-500 border-2 border-white rounded-full cursor-move transform -translate-x-1/2 -translate-y-1/2 hover:bg-purple-400 transition-colors z-20 shadow-lg"
        style={{ 
          left: `${position.x}%`, 
          top: `${position.y}%` 
        }}
        title="Drag to move spotlight"
        onMouseDown={(e) => handleMouseDown(e, 'move')}
      >
        {/* Inner dot for better visibility */}
        <div className="absolute inset-1 bg-white rounded-full opacity-80" />
      </div>
      
      {/* Resize handle - Corner positioned relative to spotlight size */}
      <div 
        className="absolute w-4 h-4 bg-purple-500 border-2 border-white rounded-full cursor-nw-resize transform -translate-x-1/2 -translate-y-1/2 hover:bg-purple-400 transition-colors z-20 shadow-lg"
        style={{ 
          left: `calc(${position.x}% + ${(position.width * 0.35)}px)`, 
          top: `calc(${position.y}% + ${(position.height * 0.35)}px)` 
        }}
        title="Drag to resize spotlight"
        onMouseDown={(e) => handleMouseDown(e, 'resize')}
      >
        {/* Resize icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 border-r border-b border-white transform rotate-45" />
        </div>
      </div>

      {/* Visual feedback while dragging */}
      {isDragging && (
        <div
          className="absolute border border-dashed border-purple-300 pointer-events-none z-10 rounded"
          style={{
            left: `${position.x}%`,
            top: `${position.y}%`,
            width: `${position.width}px`,
            height: `${position.height}px`,
            transform: 'translate(-50%, -50%)'
          }}
        />
      )}
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
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent, type: 'move' | 'resize') => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setDragType(type);
    setDragStart({ x: e.clientX, y: e.clientY });

    // Get container element from parent preview container
    const container = e.currentTarget.closest('.relative.bg-slate-700');
    if (container) {
      containerRef.current = container as HTMLDivElement;
    }
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    
    if (dragType === 'move') {
      // Convert pixel movement to percentage movement based on container size
      const percentDeltaX = (deltaX / containerRect.width) * 100;
      const percentDeltaY = (deltaY / containerRect.height) * 100;
      
      // Calculate text box boundaries based on its size
      const textWidthPercent = (position.width / containerRect.width) * 100;
      const textHeightPercent = (position.height / containerRect.height) * 100;
      
      // Apply position with proper bounds checking (keep text completely within container)
      const newX = Math.max(textWidthPercent / 2 + 2, Math.min(100 - textWidthPercent / 2 - 2, position.x + percentDeltaX));
      const newY = Math.max(textHeightPercent / 2 + 2, Math.min(100 - textHeightPercent / 2 - 2, position.y + percentDeltaY));
      
      onPositionChange({
        ...position,
        x: newX,
        y: newY
      });
    } else {
      // Resize: maintain minimum sizes and reasonable maximums
      const newWidth = Math.max(100, Math.min(400, position.width + deltaX));
      const newHeight = Math.max(40, Math.min(200, position.height + deltaY));
      
      onPositionChange({
        ...position,
        width: newWidth,
        height: newHeight
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
      {/* Move handle - Top-left corner */}
      <div 
        className="absolute -top-2 -left-2 w-4 h-4 bg-blue-500 border-2 border-white rounded-full cursor-move hover:bg-blue-400 transition-colors z-30 shadow-lg"
        title="Drag to move text box"
        onMouseDown={(e) => handleMouseDown(e, 'move')}
      >
        {/* Move icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 bg-white rounded-full opacity-80" />
        </div>
      </div>
      
      {/* Resize handle - Bottom-right corner */}
      <div 
        className="absolute -bottom-2 -right-2 w-4 h-4 bg-blue-500 border-2 border-white rounded-full cursor-nw-resize hover:bg-blue-400 transition-colors z-30 shadow-lg"
        title="Drag to resize text box"
        onMouseDown={(e) => handleMouseDown(e, 'resize')}
      >
        {/* Resize icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 border-r border-b border-white transform rotate-45" />
        </div>
      </div>

      {/* Visual feedback while dragging */}
      {isDragging && (
        <div className="absolute inset-0 border-2 border-dashed border-blue-300 pointer-events-none rounded z-20 bg-blue-500 bg-opacity-5" />
      )}
    </>
  );
};

interface PanZoomPosition {
  x: number; // percentage
  y: number; // percentage
  width: number; // percentage
  height: number; // percentage
}

const InteractivePanZoomArea: React.FC<{
  hotspotPosition: { x: number; y: number };
  zoomLevel: number;
  onZoomLevelChange?: (level: number) => void;
}> = ({ hotspotPosition, zoomLevel, onZoomLevelChange }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState<'move' | 'resize'>('move');
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Initialize pan/zoom area around hotspot
  const [panZoomArea, setPanZoomArea] = useState<PanZoomPosition>({
    x: Math.max(5, Math.min(70, hotspotPosition.x - 15)),
    y: Math.max(5, Math.min(70, hotspotPosition.y - 15)),
    width: 25, // percentage
    height: 25  // percentage
  });

  const handleMouseDown = useCallback((e: React.MouseEvent, type: 'move' | 'resize') => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setDragType(type);
    setDragStart({ x: e.clientX, y: e.clientY });

    // Get container element
    const container = e.currentTarget.closest('.relative.bg-slate-700');
    if (container) {
      containerRef.current = container as HTMLDivElement;
    }
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    
    if (dragType === 'move') {
      // Convert pixel movement to percentage movement
      const percentDeltaX = (deltaX / containerRect.width) * 100;
      const percentDeltaY = (deltaY / containerRect.height) * 100;
      
      // Apply position with bounds checking
      const newX = Math.max(2, Math.min(98 - panZoomArea.width, panZoomArea.x + percentDeltaX));
      const newY = Math.max(2, Math.min(98 - panZoomArea.height, panZoomArea.y + percentDeltaY));
      
      setPanZoomArea(prev => ({
        ...prev,
        x: newX,
        y: newY
      }));
    } else {
      // Resize: convert pixel delta to percentage delta
      const percentDeltaX = (deltaX / containerRect.width) * 100;
      const percentDeltaY = (deltaY / containerRect.height) * 100;
      
      const newWidth = Math.max(10, Math.min(50, panZoomArea.width + percentDeltaX));
      const newHeight = Math.max(10, Math.min(50, panZoomArea.height + percentDeltaY));
      
      setPanZoomArea(prev => ({
        ...prev,
        width: newWidth,
        height: newHeight
      }));
    }
    
    setDragStart({ x: e.clientX, y: e.clientY });
  }, [isDragging, dragType, dragStart, panZoomArea]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleZoomChange = useCallback((delta: number) => {
    const newLevel = Math.max(1.1, Math.min(5, zoomLevel + delta));
    onZoomLevelChange?.(newLevel);
  }, [zoomLevel, onZoomLevelChange]);

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
    <div
      className="absolute group"
      style={{
        left: `${panZoomArea.x}%`,
        top: `${panZoomArea.y}%`,
        width: `${panZoomArea.width}%`,
        height: `${panZoomArea.height}%`
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Main zoom area rectangle */}
      <div
        className={`absolute inset-0 border-2 border-blue-500 bg-blue-500 rounded-lg transition-all duration-200 ${
          isHovered || isDragging ? 'bg-opacity-25 border-blue-400' : 'bg-opacity-15'
        }`}
      >
        {/* Zoom level indicator */}
        <div className="absolute -top-8 left-0 bg-slate-800 text-blue-400 px-2 py-1 rounded text-xs font-medium shadow-lg border border-slate-600">
          {zoomLevel.toFixed(1)}x Zoom
        </div>

        {/* Center crosshair */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative">
            <div className="absolute w-4 h-px bg-blue-400 left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute w-px h-4 bg-blue-400 left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* Grid overlay */}
        <div className="absolute inset-2 border border-dashed border-blue-300 opacity-30 rounded">
          <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-px">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="border border-dotted border-blue-300 opacity-20" />
            ))}
          </div>
        </div>
      </div>

      {/* Move Handle - Center */}
      <div
        className="absolute top-1/2 left-1/2 w-5 h-5 bg-blue-500 border-2 border-white rounded-full cursor-move transform -translate-x-1/2 -translate-y-1/2 hover:bg-blue-400 transition-colors z-20 shadow-lg"
        title="Drag to move zoom area"
        onMouseDown={(e) => handleMouseDown(e, 'move')}
      >
        {/* Move icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2">
            <div className="absolute w-full h-px bg-white top-1/2 transform -translate-y-1/2" />
            <div className="absolute w-px h-full bg-white left-1/2 transform -translate-x-1/2" />
          </div>
        </div>
      </div>

      {/* Resize Handle - Bottom-right corner */}
      <div
        className="absolute bottom-0 right-0 w-4 h-4 bg-blue-500 border-2 border-white rounded-full cursor-nw-resize transform translate-x-1/2 translate-y-1/2 hover:bg-blue-400 transition-colors z-20 shadow-lg"
        title="Drag to resize zoom area"
        onMouseDown={(e) => handleMouseDown(e, 'resize')}
      >
        {/* Resize icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 border-r border-b border-white transform rotate-45" />
        </div>
      </div>

      {/* Zoom level controls */}
      <div className="absolute -right-12 top-0 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          className="w-7 h-7 bg-blue-500 hover:bg-blue-400 text-white rounded border border-white shadow-lg transition-colors text-sm font-bold"
          title="Increase zoom"
          onClick={() => handleZoomChange(0.2)}
        >
          +
        </button>
        <button
          className="w-7 h-7 bg-blue-500 hover:bg-blue-400 text-white rounded border border-white shadow-lg transition-colors text-sm font-bold"
          title="Decrease zoom"
          onClick={() => handleZoomChange(-0.2)}
        >
          −
        </button>
      </div>

      {/* Connection line to hotspot */}
      <svg
        className="absolute pointer-events-none z-0"
        style={{
          left: '50%',
          top: '50%',
          width: '100px',
          height: '100px',
          transform: 'translate(-50%, -50%)',
          overflow: 'visible'
        }}
      >
        <defs>
          <marker
            id="arrowhead-panzoom"
            markerWidth="8"
            markerHeight="6"
            refX="7"
            refY="3"
            orient="auto"
          >
            <polygon
              points="0 0, 8 3, 0 6"
              fill="#3b82f6"
              opacity="0.6"
            />
          </marker>
        </defs>
        <line
          x1="50"
          y1="50"
          x2={50 + (hotspotPosition.x - (panZoomArea.x + panZoomArea.width/2)) * 0.5}
          y2={50 + (hotspotPosition.y - (panZoomArea.y + panZoomArea.height/2)) * 0.5}
          stroke="#3b82f6"
          strokeWidth="2"
          strokeDasharray="3,3"
          opacity="0.6"
          markerEnd="url(#arrowhead-panzoom)"
        />
      </svg>

      {/* Visual feedback while dragging */}
      {isDragging && (
        <div className="absolute inset-0 border-2 border-dashed border-blue-300 pointer-events-none rounded z-10 bg-blue-500 bg-opacity-10" />
      )}
    </div>
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
  spotlightPosition,
  textBoxPosition,
  onSpotlightPositionChange,
  onTextPositionChange,
  onZoomLevelChange
}) => {
  const [previewMode, setPreviewMode] = useState<'edit' | 'preview'>('edit');
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentAnimationStep, setCurrentAnimationStep] = useState(0);
  const [previewZoom, setPreviewZoom] = useState(1);
  const [previewPan, setPreviewPan] = useState({ x: 0, y: 0 });

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
    onSpotlightPositionChange?.(newPosition);
  }, [onSpotlightPositionChange]);

  // Text box drag handlers  
  const handleTextDrag = useCallback((newPosition: TextPosition) => {
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
          <InteractivePanZoomArea
            hotspotPosition={hotspot}
            zoomLevel={zoomLevel}
            onZoomLevelChange={onZoomLevelChange}
          />
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