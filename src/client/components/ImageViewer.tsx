import React, { useState, useRef, useEffect, useCallback } from 'react';

interface ImageViewerProps {
  src: string;
  alt?: string;
  title?: string;
  caption?: string;
  className?: string;
}

const ImageViewer: React.FC<ImageViewerProps> = ({
  src,
  alt = '',
  title,
  caption,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false); // Initially false
  const instructionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Reset zoom, position, and instruction visibility when image changes
  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setImageLoaded(false);
    setImageError(false);
    // Don't set showInstructions to true here, wait for image load
    if (instructionTimeoutRef.current) {
      clearTimeout(instructionTimeoutRef.current);
      instructionTimeoutRef.current = null;
    }
  }, [src]);

  // Effect to clear timeout on component unmount
  useEffect(() => {
    return () => {
      if (instructionTimeoutRef.current) {
        clearTimeout(instructionTimeoutRef.current);
      }
    };
  }, []);

  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
    setShowInstructions(true); // Ensure they are shown on load
    if (instructionTimeoutRef.current) {
      clearTimeout(instructionTimeoutRef.current);
    }
    instructionTimeoutRef.current = setTimeout(() => {
      setShowInstructions(false);
    }, 5000); // Hide after 5 seconds
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(false);
  };

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.5, Math.min(5, scale * delta));

    // Zoom towards mouse position
    const scaleChange = newScale / scale;
    const newX = mouseX - (mouseX - position.x) * scaleChange;
    const newY = mouseY - (mouseY - position.y) * scaleChange;

    setScale(newScale);
    setPosition({ x: newX, y: newY });
  }, [scale, position]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left mouse button
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  }, [position]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (scale === 1) {
      // Zoom to 2x at click point
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const newScale = 2;
      const scaleChange = newScale / scale;
      const newX = mouseX - (mouseX - position.x) * scaleChange;
      const newY = mouseY - (mouseY - position.y) * scaleChange;

      setScale(newScale);
      setPosition({ x: newX, y: newY });
    } else {
      // Reset to fit
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [scale, position]);

  const zoomIn = () => {
    const newScale = Math.min(5, scale * 1.2);
    setScale(newScale);
  };

  const zoomOut = () => {
    const newScale = Math.max(0.5, scale * 0.8);
    setScale(newScale);
  };

  const resetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const fitToContainer = () => {
    if (!containerRef.current || !imageRef.current) return;

    const container = containerRef.current;
    const image = imageRef.current;

    const containerAspect = container.clientWidth / container.clientHeight;
    const imageAspect = image.naturalWidth / image.naturalHeight;

    let newScale;
    if (imageAspect > containerAspect) {
      // Image is wider than container
      newScale = container.clientWidth / image.naturalWidth;
    } else {
      // Image is taller than container
      newScale = container.clientHeight / image.naturalHeight;
    }

    setScale(Math.min(1, newScale));
    setPosition({ x: 0, y: 0 });
  };

  return (
    <div className={`relative overflow-hidden bg-slate-900 ${className}`}>
      {/* Image Container */}
      <div
        ref={containerRef}
        className="w-full h-full flex items-center justify-center cursor-move"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        style={{ cursor: isDragging ? 'grabbing' : scale > 1 ? 'grab' : 'zoom-in' }}
      >
        <img
          ref={imageRef}
          src={src}
          alt={alt}
          onLoad={handleImageLoad}
          onError={handleImageError}
          className="max-w-none select-none transition-transform duration-200 ease-out"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            display: imageLoaded ? 'block' : 'none'
          }}
          draggable={false}
        />
        
        {/* Loading State */}
        {!imageLoaded && !imageError && (
          <div className="flex flex-col items-center justify-center text-slate-400">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mb-4"></div>
            <p>Loading image...</p>
          </div>
        )}
        
        {/* Error State */}
        {imageError && (
          <div className="flex flex-col items-center justify-center text-slate-400">
            <svg className="w-16 h-16 mb-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
            <p>Failed to load image</p>
            <button
              onClick={() => {
                setImageError(false);
                if (imageRef.current) {
                  imageRef.current.src = src;
                }
              }}
              className="mt-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
            >
              Retry
            </button>
          </div>
        )}
      </div>
      
      {/* Controls */}
      {imageLoaded && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 backdrop-blur-sm rounded-lg p-2 flex items-center space-x-2">
          <button
            onClick={zoomOut}
            className="text-white hover:text-blue-400 transition-colors p-1 rounded"
            aria-label="Zoom out"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              <path fillRule="evenodd" d="M5 8a1 1 0 011-1h4a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          </button>
          
          <span className="text-white text-sm min-w-[4rem] text-center">
            {Math.round(scale * 100)}%
          </span>
          
          <button
            onClick={zoomIn}
            className="text-white hover:text-blue-400 transition-colors p-1 rounded"
            aria-label="Zoom in"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              <path fillRule="evenodd" d="M8 6a1 1 0 011 1v1h1a1 1 0 110 2H9v1a1 1 0 11-2 0v-1H6a1 1 0 110-2h1V7a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          </button>
          
          <div className="w-px h-6 bg-slate-600 mx-1"></div>
          
          <button
            onClick={resetZoom}
            className="text-white hover:text-blue-400 transition-colors p-1 rounded text-xs"
            aria-label="Reset zoom"
          >
            1:1
          </button>
          
          <button
            onClick={fitToContainer}
            className="text-white hover:text-blue-400 transition-colors p-1 rounded"
            aria-label="Fit to container"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}
      
      {/* Title and Caption */}
      {(title || caption) && imageLoaded && (
        <div className="absolute top-4 left-4 right-4 bg-black/70 backdrop-blur-sm rounded-lg p-3">
          {title && <h3 className="text-white font-semibold mb-1">{title}</h3>}
          {caption && <p className="text-slate-300 text-sm">{caption}</p>}
        </div>
      )}
      
      {/* Instructions */}
      {imageLoaded && (
        <div
          className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm rounded-lg p-2 transition-opacity duration-500 ease-in-out"
          style={{ opacity: showInstructions ? 1 : 0, visibility: showInstructions ? 'visible' : 'hidden' }}
        >
          <div className="text-slate-300 text-xs space-y-1">
            <div>Scroll: Zoom</div>
            <div>Double-click: Reset</div>
            <div>Drag: Pan</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageViewer;