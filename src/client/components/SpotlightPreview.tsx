import React, { useState, useRef, useCallback } from 'react';

interface SpotlightPreviewProps {
  shape: 'circle' | 'rectangle';
  dimPercentage: number;
  zoomLevel: number;
  onPositionChange?: (x: number, y: number, width: number, height: number) => void;
}

const SpotlightPreview: React.FC<SpotlightPreviewProps> = ({
  shape,
  dimPercentage,
  zoomLevel,
  onPositionChange
}) => {
  const [spotlightPosition, setSpotlightPosition] = useState({
    x: 35, // percentage
    y: 30, // percentage
    width: 120, // pixels
    height: 120 // pixels
  });
  
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState<'move' | 'resize'>('move');
  const dragStartRef = useRef({ x: 0, y: 0 });
  const positionStartRef = useRef(spotlightPosition);

  const handleMouseDown = useCallback((e: React.MouseEvent, type: 'move' | 'resize') => {
    e.preventDefault();
    setIsDragging(true);
    setDragType(type);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    positionStartRef.current = spotlightPosition;
  }, [spotlightPosition]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;

    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;

    if (dragType === 'move') {
      const newX = Math.max(0, Math.min(70, positionStartRef.current.x + (deltaX * 0.2)));
      const newY = Math.max(0, Math.min(70, positionStartRef.current.y + (deltaY * 0.2)));
      
      const newPosition = { ...spotlightPosition, x: newX, y: newY };
      setSpotlightPosition(newPosition);
      onPositionChange?.(newPosition.x, newPosition.y, newPosition.width, newPosition.height);
    } else {
      const newWidth = Math.max(60, positionStartRef.current.width + deltaX);
      const newHeight = Math.max(60, positionStartRef.current.height + deltaY);
      
      const newPosition = { ...spotlightPosition, width: newWidth, height: newHeight };
      setSpotlightPosition(newPosition);
      onPositionChange?.(newPosition.x, newPosition.y, newPosition.width, newPosition.height);
    }
  }, [isDragging, dragType, spotlightPosition, onPositionChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
    return undefined; // Explicit return for else case
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const clipPath = shape === 'circle' 
    ? `circle(${Math.min(spotlightPosition.width, spotlightPosition.height) / 2}px at center)`
    : 'none';

  return (
    <div className="mb-4">
      <h3 className="text-lg font-medium text-white mb-4">Preview</h3>
      
      <div className="relative bg-slate-700 rounded-lg h-80 overflow-hidden">
        {/* Sample background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 to-purple-900 rounded-lg opacity-50"></div>
        
        {/* Spotlight overlay */}
        <div 
          className="absolute inset-0 rounded-lg pointer-events-none"
          style={{ background: `rgba(0, 0, 0, ${dimPercentage / 100})` }}
        />
        
        {/* Spotlight area */}
        <div 
          className={`absolute border-2 border-purple-500 ${shape === 'circle' ? 'rounded-full' : ''}`}
          style={{
            left: `${spotlightPosition.x}%`,
            top: `${spotlightPosition.y}%`,
            width: `${spotlightPosition.width}px`,
            height: `${spotlightPosition.height}px`,
            boxShadow: `0 0 0 1000px rgba(0, 0, 0, ${dimPercentage / 100})`,
            clipPath
          }}
        />
        
        {/* Drag handles */}
        <div 
          className="absolute w-3 h-3 bg-purple-500 border-2 border-white rounded-full cursor-move transform -translate-x-1/2 -translate-y-1/2 hover:bg-purple-400 transition-colors"
          style={{ 
            left: `${spotlightPosition.x}%`, 
            top: `${spotlightPosition.y}%` 
          }}
          onMouseDown={(e) => handleMouseDown(e, 'move')}
          title="Drag to move spotlight"
        />
        <div 
          className="absolute w-3 h-3 bg-purple-500 border-2 border-white rounded-full cursor-nw-resize transform -translate-x-1/2 -translate-y-1/2 hover:bg-purple-400 transition-colors"
          style={{ 
            left: `calc(${spotlightPosition.x}% + ${spotlightPosition.width}px)`, 
            top: `calc(${spotlightPosition.y}% + ${spotlightPosition.height}px)` 
          }}
          onMouseDown={(e) => handleMouseDown(e, 'resize')}
          title="Drag to resize"
        />
        
        {/* Sample hotspot */}
        <div 
          className="absolute w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-lg transform -translate-x-1/2 -translate-y-1/2" 
          style={{ left: '40%', top: '35%' }}
        />
        
        {/* Zoom indicator */}
        <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
          {zoomLevel.toFixed(1)}x Zoom
        </div>
      </div>
    </div>
  );
};

export default SpotlightPreview;