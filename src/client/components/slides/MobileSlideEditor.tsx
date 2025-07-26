import React, { useState, useCallback, useRef, useEffect } from 'react';
import { SlideDeck, InteractiveSlide, SlideElement, DeviceType } from '../../../shared/slideTypes';
import { SlideEditor } from './SlideEditor';

interface MobileSlideEditorProps {
  slideDeck: SlideDeck;
  currentSlideIndex?: number;
  onSlideDeckChange: (slideDeck: SlideDeck) => void;
  onClose: () => void;
  className?: string;
  deviceTypeOverride?: DeviceType;
  onAspectRatioChange?: (slideIndex: number, aspectRatio: string) => void;
  selectedElementId?: string | null;
  onElementSelect?: (elementId: string | null) => void;
  onElementUpdate?: (elementId: string, updates: Partial<SlideElement>) => void;
  onSlideUpdate?: (slideUpdates: Partial<InteractiveSlide>) => void;
}

/**
 * MobileSlideEditor - Clean mobile-first slide editor with proper containment
 * 
 * Replaces TouchAwareSlideEditor with simplified approach:
 * - Fixed layout structure with proper containment
 * - Simple touch handling for element selection
 * - No complex zoom transforms that break layout
 * - Modal-based controls instead of side panels
 */
export const MobileSlideEditor: React.FC<MobileSlideEditorProps> = (props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const slideAreaRef = useRef<HTMLDivElement>(null);
  const [isLandscape] = useState(window.innerWidth > window.innerHeight);

  // Handle touch start for element selection
  const handleTouchStart = useCallback((e: TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Simple tap detection for element selection
    const touch = e.touches[0];
    if (touch && props.onElementSelect) {
      // Get slide area bounds for coordinate calculation
      const slideArea = slideAreaRef.current;
      if (slideArea) {
        const rect = slideArea.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        
        console.log(`Touch at ${x}, ${y} in slide area`);
        // Element selection will be handled by SlideEditor's existing logic
      }
    }
  }, [props.onElementSelect]);

  // Add touch event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: false });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
    };
  }, [handleTouchStart]);

  // Prevent page scrolling within editor bounds
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const preventScroll = (e: TouchEvent) => {
      e.preventDefault();
    };

    container.addEventListener('touchmove', preventScroll, { passive: false });

    return () => {
      container.removeEventListener('touchmove', preventScroll);
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className={`mobile-slide-editor mobile-viewport-manager ${props.className || ''}`}
    >
      {/* Main slide area with proper containment */}
      <div 
        ref={slideAreaRef}
        className="mobile-slide-area mobile-viewport-content"
      >
        <div className="mobile-slide-canvas touch-container">
          <SlideEditor
            {...props}
            className="h-full w-full mobile-editor-canvas"
          />
        </div>
      </div>
    </div>
  );
};

export default MobileSlideEditor;