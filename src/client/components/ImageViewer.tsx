import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTouchGestures } from '../hooks/useTouchGestures';
import { ImageTransformState } from '../../shared/types';
import { useIsMobile } from '../hooks/useIsMobile'; // For instruction text

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

  const initialTransform: ImageTransformState = { scale: 1, translateX: 0, translateY: 0 };
  const [imageTransform, setImageTransform] = useState<ImageTransformState>(initialTransform);
  const [isMouseDragging, setIsMouseDragging] = useState(false); // Separate for mouse dragging
  const [dragStartCoords, setDragStartCoords] = useState({ x: 0, y: 0 }); // For mouse dragging
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false); // Initially false
  const instructionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isTransformingViaTouch, setIsTransformingViaTouch] = useState(false);
  const isMobile = useIsMobile();

  const MIN_SCALE = 0.5;
  const MAX_SCALE = 5;
  const DOUBLE_TAP_ZOOM_FACTOR = 2;

  // Reset zoom, position, and instruction visibility when image changes
  useEffect(() => {
    setImageTransform(initialTransform);
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

  const {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    isGestureActive,
  } = useTouchGestures(
    containerRef,
    imageTransform,
    setImageTransform,
    setIsTransformingViaTouch,
    { minScale: MIN_SCALE, maxScale: MAX_SCALE, doubleTapZoomFactor: DOUBLE_TAP_ZOOM_FACTOR }
  );

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (isGestureActive()) return; // Don't interfere with touch gestures
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const delta = e.deltaY > 0 ? 0.9 : 1.1;

    setImageTransform(prevTransform => {
      const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, prevTransform.scale * delta));
      const scaleChange = newScale / prevTransform.scale;
      const newTranslateX = mouseX - (mouseX - prevTransform.translateX) * scaleChange;
      const newTranslateY = mouseY - (mouseY - prevTransform.translateY) * scaleChange;
      return { scale: newScale, translateX: newTranslateX, translateY: newTranslateY };
    });
  }, [isGestureActive,setImageTransform]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (isGestureActive() || e.button !== 0) return;
    e.preventDefault();
    setIsMouseDragging(true);
    setDragStartCoords({
      x: e.clientX - imageTransform.translateX,
      y: e.clientY - imageTransform.translateY
    });
  }, [imageTransform, isGestureActive, setIsMouseDragging, setDragStartCoords]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isMouseDragging || isGestureActive()) return;
    e.preventDefault();
    setImageTransform(prevTransform => ({
      scale: prevTransform.scale,
      translateX: e.clientX - dragStartCoords.x,
      translateY: e.clientY - dragStartCoords.y
    }));
  }, [isMouseDragging, dragStartCoords, isGestureActive, setImageTransform]);

  const handleMouseUp = useCallback(() => {
    if (isGestureActive()) return;
    setIsMouseDragging(false);
  }, [isGestureActive, setIsMouseDragging]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    if (isGestureActive()) return;
    e.preventDefault();

    setImageTransform(prevTransform => {
      if (prevTransform.scale === 1 && prevTransform.translateX === 0 && prevTransform.translateY === 0) {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return prevTransform;

        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const newScale = DOUBLE_TAP_ZOOM_FACTOR;
        const scaleChange = newScale / prevTransform.scale;
        const newTranslateX = mouseX - (mouseX - prevTransform.translateX) * scaleChange;
        const newTranslateY = mouseY - (mouseY - prevTransform.translateY) * scaleChange;
        return { scale: newScale, translateX: newTranslateX, translateY: newTranslateY };
      } else {
        return initialTransform;
      }
    });
  }, [isGestureActive, setImageTransform, initialTransform]);

  const zoomIn = () => {
     setImageTransform(prevTransform => ({
      ...prevTransform,
      scale: Math.min(MAX_SCALE, prevTransform.scale * 1.2)
    }));
  };

  const zoomOut = () => {
    setImageTransform(prevTransform => ({
      ...prevTransform,
      scale: Math.max(MIN_SCALE, prevTransform.scale * 0.8)
    }));
  };

  const resetZoom = () => {
    setImageTransform(initialTransform);
  };

  const fitToContainer = () => {
    if (!containerRef.current || !imageRef.current || !imageRef.current.naturalWidth || !imageRef.current.naturalHeight) {
      setImageTransform(initialTransform); // Fallback if image not loaded
      return;
    }

    const container = containerRef.current;
    const image = imageRef.current;

    const containerAspect = container.clientWidth / container.clientHeight;
    const imageAspect = image.naturalWidth / image.naturalHeight;

    let newScale;
    if (imageAspect > containerAspect) {
      newScale = container.clientWidth / image.naturalWidth;
    } else {
      newScale = container.clientHeight / image.naturalHeight;
    }
    // Ensure fit scale is not less than min_scale and not more than 1 (initial fit)
    const finalScale = Math.max(MIN_SCALE, Math.min(1, newScale));
    setImageTransform({ scale: finalScale, translateX: 0, translateY: 0 });
  };

  // Recalculate fit when window resizes, if image is loaded
  useEffect(() => {
    if (imageLoaded) {
      const handleResize = () => {
        // Only refit if current scale is close to a previous fit-to-container scale
        // This heuristic prevents overriding user's zoom on every resize.
        // A better approach might involve storing if the last action was "fitToContainer".
        if (Math.abs(imageTransform.scale - 1) < 0.1 ||
            (imageRef.current && containerRef.current &&
             (Math.abs(imageTransform.scale - (containerRef.current.clientWidth / imageRef.current.naturalWidth)) < 0.1 ||
              Math.abs(imageTransform.scale - (containerRef.current.clientHeight / imageRef.current.naturalHeight)) < 0.1))
        ) {
          fitToContainer();
        }
      };
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [imageLoaded, imageTransform.scale]); // Added imageTransform.scale to dependencies

  return (
    <div className={`relative overflow-hidden bg-slate-900 ${className} touch-none`} // Added touch-none to prevent browser default touch actions like scroll/zoom on the container
      style={{ touchAction: 'none' }} // Ensure touch-action is none for the container
    >
      {/* Image Container */}
      <div
        ref={containerRef}
        className="w-full h-full flex items-center justify-center" // Removed cursor-move, useTouchGestures will handle cursor
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp} // Keep mouse leave for mouse drag
        onDoubleClick={handleDoubleClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          cursor: isMouseDragging ? 'grabbing' : (imageTransform.scale > 1 && !isMobile) ? 'grab' : isMobile ? 'default' : 'zoom-in',
          touchAction: 'none' // Critical for useTouchGestures to work without page scroll/zoom
        }}
      >
        <img
          ref={imageRef}
          src={src}
          alt={alt}
          onLoad={handleImageLoad}
          onError={handleImageError}
          className="max-w-none select-none" // Removed transition-transform for smoother touch/mouse updates
          style={{
            transform: `translate(${imageTransform.translateX}px, ${imageTransform.translateY}px) scale(${imageTransform.scale})`,
            display: imageLoaded ? 'block' : 'none',
            transition: isTransformingViaTouch ? 'none' : 'transform 0.2s ease-out', // Only animate transform if not via touch
          }}
          draggable={false}
        />
        
        {/* Loading State */}
        {!imageLoaded && !imageError && (
          <div className="flex flex-col items-center justify-center text-slate-400 absolute inset-0">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mb-4"></div>
            <p>Loading image...</p>
          </div>
        )}
        
        {/* Error State */}
        {imageError && (
          <div className="flex flex-col items-center justify-center text-slate-400 absolute inset-0">
            <svg className="w-16 h-16 mb-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
            <p>Failed to load image</p>
            <button
              onClick={() => {
                setImageError(false);
                // Trigger reload by changing src temporarily if needed, or just reset state
                setImageLoaded(false);
                if (imageRef.current) {
                  // A common trick to force reload if src hasn't changed but error occurred
                  const currentSrc = imageRef.current.src;
                  imageRef.current.src = '';
                  imageRef.current.src = currentSrc;
                }
              }}
              className="mt-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
            >
              Retry
            </button>
          </div>
        )}
      </div>
      
      {/* Controls - Conditionally render or adapt for mobile if needed */}
      {imageLoaded && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 backdrop-blur-sm rounded-lg p-2 flex items-center space-x-2 z-10">
          <button
            onClick={zoomOut}
            className="text-white hover:text-blue-400 transition-colors p-1 rounded"
            aria-label="Zoom out"
            disabled={imageTransform.scale <= MIN_SCALE}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              <path fillRule="evenodd" d="M5 8a1 1 0 011-1h4a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          </button>
          
          <span className="text-white text-sm min-w-[4rem] text-center tabular-nums">
            {Math.round(imageTransform.scale * 100)}%
          </span>
          
          <button
            onClick={zoomIn}
            className="text-white hover:text-blue-400 transition-colors p-1 rounded"
            aria-label="Zoom in"
            disabled={imageTransform.scale >= MAX_SCALE}
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
            disabled={imageTransform.scale === 1 && imageTransform.translateX === 0 && imageTransform.translateY === 0}
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
      
      {/* Title and Caption - ensure they don't interfere with touch */}
      {(title || caption) && imageLoaded && (
        <div className="absolute top-4 left-4 right-4 bg-black/70 backdrop-blur-sm rounded-lg p-3 pointer-events-none z-10">
          {title && <h3 className="text-white font-semibold mb-1">{title}</h3>}
          {caption && <p className="text-slate-300 text-sm">{caption}</p>}
        </div>
      )}
      
      {/* Instructions - updated for touch and conditional rendering */}
      {imageLoaded && (
        <div
          className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm rounded-lg p-2 transition-opacity duration-500 ease-in-out pointer-events-none z-10"
          style={{ opacity: showInstructions ? 1 : 0, visibility: showInstructions ? 'visible' : 'hidden' }}
        >
          <div className="text-slate-300 text-xs space-y-1">
            {isMobile ? (
              <>
                <div>Pinch: Zoom</div>
                <div>Double-tap: Reset/Zoom</div>
                <div>Drag: Pan</div>
              </>
            ) : (
              <>
                <div>Scroll: Zoom</div>
                <div>Double-click: Reset/Zoom</div>
                <div>Drag: Pan</div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageViewer;