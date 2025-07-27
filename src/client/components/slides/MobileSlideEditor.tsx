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

  // Remove problematic touch handling that was intercepting hotspot touches
  // The SlideEditor component handles touch interactions directly on elements

  // Prevent page scrolling within editor bounds, but allow hotspot interactions
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const preventScroll = (e: TouchEvent) => {
      // Only prevent scroll if the touch isn't on an interactive element
      const target = e.target as HTMLElement;
      const isInteractiveElement = target?.closest('[data-hotspot-id]') || 
                                  target?.hasAttribute('data-hotspot-id') ||
                                  target?.closest('.hotspot-element') ||
                                  target?.classList.contains('hotspot-element') ||
                                  target?.closest('button') ||
                                  target?.closest('input') ||
                                  target?.closest('textarea');
      
      if (!isInteractiveElement) {
        e.preventDefault();
      }
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
      style={{
        /* iOS Safari viewport handling */
        height: '100dvh',
        maxHeight: '100dvh',
        /* Fallback for browsers without dvh support and webkit-fill-available */
        minHeight: '-webkit-fill-available',
        /* Safe area awareness */
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        paddingLeft: 'env(safe-area-inset-left, 0px)',
        paddingRight: 'env(safe-area-inset-right, 0px)',
        /* Prevent content from extending into notch/home indicator areas */
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Main slide area with proper containment */}
      <div 
        ref={slideAreaRef}
        className="mobile-slide-area mobile-viewport-content"
        style={{
          /* Dynamic height calculation for content area */
          height: 'calc(100dvh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px))',
          /* Fallback */
          minHeight: 'calc(100vh - 88px)', // Account for typical iOS safe areas
          width: '100%',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div 
          className="mobile-slide-canvas touch-container"
          style={{
            /* Ensure canvas stays within safe boundaries */
            height: '100%',
            width: '100%',
            maxHeight: '100%',
            maxWidth: '100%',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
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