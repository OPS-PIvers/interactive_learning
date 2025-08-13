import React, { useState, useCallback, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { SlideDeck, SlideViewerState, SlideEffect } from '../../../shared/slideTypes';
import { useDeviceDetection } from '../../hooks/useDeviceDetection';
import { calculateCanvasDimensions } from '../../utils/aspectRatioUtils';
import { ensureSlideElementInteractions } from '../../utils/interactionUtils';
import { Z_INDEX_TAILWIND } from '../../utils/zIndexLevels';
import { SlideEffectRenderer } from './SlideEffectRenderer';
import { SlideElement } from './SlideElement';
import { SlideTimeline } from './SlideTimeline';
import '../../styles/slide-components.css';

interface SlideViewerProps {
  slideDeck: SlideDeck;
  initialSlideId?: string;
  onSlideChange?: (slideId: string, slideIndex: number) => void;
  onInteraction?: (interaction: any) => void;
  className?: string;
  showTimeline?: boolean;
  timelineAutoPlay?: boolean;
}

// Interface for SlideViewer imperative methods
export interface SlideViewerRef {
  triggerEffect: (effect: SlideEffect) => void;
  clearEffect: (effectId: string) => void;
  navigateToSlide: (slideId: string) => void;
}

/**
 * SlideViewer - Core slide-based viewer component
 * 
 * This replaces the complex coordinate system with predictable slide positioning
 */
export const SlideViewer = React.memo(forwardRef<SlideViewerRef, SlideViewerProps>(({
  slideDeck,
  initialSlideId,
  onSlideChange,
  onInteraction,
  className = '',
  showTimeline = true,
  timelineAutoPlay = false
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { deviceType, viewportInfo } = useDeviceDetection();

  // Viewer state
  const [viewerState, setViewerState] = useState<SlideViewerState>(() => {
    const slides = slideDeck?.slides || [];
    const initialIndex = initialSlideId ?
    slides.findIndex((slide) => slide.id === initialSlideId) :
    0;
    const validIndex = Math.max(0, initialIndex);
    const slideId = slides?.[validIndex]?.id || slides?.[0]?.id || null;

    return {
      currentSlideId: slideId,
      currentSlideIndex: validIndex,
      isPlaying: false,
      playbackSpeed: 1.0,
      history: slideId ? [slideId] : [],
      userInteractions: []
    };
  });

  // Active slide effects
  const [activeEffects, setActiveEffects] = useState<SlideEffect[]>([]);

  // Timeline and playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTimelineStep, setCurrentTimelineStep] = useState(0);

  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  // Get current slide and ensure elements have interactions
  const currentSlide = React.useMemo(() => {
    const slide = slideDeck?.slides?.find((slide) => slide.id === viewerState.currentSlideId);
    if (!slide) return slide;

    // Ensure all elements have proper interactions
    const slideWithInteractions = {
      ...slide,
      elements: ensureSlideElementInteractions(slide?.elements || [])
    };


    return slideWithInteractions;
  }, [slideDeck?.slides, viewerState?.currentSlideId]);

  // Navigation functions
  const navigateToSlide = useCallback((slideId: string) => {
    const slideIndex = slideDeck?.slides?.findIndex((s) => s.id === slideId) ?? -1;
    if (slideIndex === -1) return;

    setViewerState((prev) => ({
      ...prev,
      currentSlideId: slideId,
      currentSlideIndex: slideIndex,
      history: [...prev.history, slideId]
    }));

    // Clear active effects when changing slides
    setActiveEffects([]);

    onSlideChange?.(slideId, slideIndex);
  }, [slideDeck, onSlideChange]);

  // Play/pause handlers
  const handlePlay = useCallback(() => {
    setIsPlaying(true);
    setViewerState((prev) => ({ ...prev, isPlaying: true }));
  }, []);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
    setViewerState((prev) => ({ ...prev, isPlaying: false }));
  }, []);

  const navigateToNext = useCallback(() => {
    const nextIndex = viewerState.currentSlideIndex + 1;
    if (slideDeck?.slides && nextIndex < slideDeck.slides.length) {
      const nextSlideId = slideDeck.slides[nextIndex]?.id;
      if (nextSlideId) {
        navigateToSlide(nextSlideId);
      }
    }
  }, [viewerState.currentSlideIndex, slideDeck, navigateToSlide]);

  const navigateToPrevious = useCallback(() => {
    const prevIndex = viewerState.currentSlideIndex - 1;
    if (slideDeck?.slides && prevIndex >= 0) {
      const prevSlideId = slideDeck.slides[prevIndex]?.id;
      if (prevSlideId) {
        navigateToSlide(prevSlideId);
      }
    }
  }, [viewerState.currentSlideIndex, slideDeck, navigateToSlide]);

  // Effect handling
  const triggerEffect = useCallback((effect: SlideEffect) => {


    setActiveEffects((prev) => {
      const newEffects = [...prev, effect];

      return newEffects;
    });

    // Auto-remove effect after duration
    if (effect.duration > 0) {

      setTimeout(() => {
        setActiveEffects((prev) => prev.filter((e) => e.id !== effect.id));

      }, effect.duration);
    }
  }, []);

  const clearEffect = useCallback((effectId: string) => {
    setActiveEffects((prev) => prev.filter((e) => e.id !== effectId));
  }, []);

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    triggerEffect,
    clearEffect,
    navigateToSlide
  }), [triggerEffect, clearEffect, navigateToSlide]);

  // Element interaction handler
  const handleElementInteraction = useCallback((elementId: string, interactionId: string) => {


    if (!currentSlide) {

      return;
    }

    const element = currentSlide?.elements?.find((el) => el.id === elementId);
    if (!element) {

      return;
    }




    const interaction = element?.interactions?.find((int) => int.id === interactionId);
    if (!interaction) {

      return;
    }



    // Log interaction
    const interactionLog = {
      timestamp: Date.now(),
      slideId: currentSlide.id,
      elementId,
      interactionType: interaction.trigger,
      details: { interactionId }
    };

    setViewerState((prev) => ({
      ...prev,
      userInteractions: [...prev.userInteractions, interactionLog]
    }));

    if (interaction.effect) {
      // Trigger effect
      triggerEffect(interaction.effect);

    }

    onInteraction?.(interactionLog);
  }, [currentSlide, triggerEffect, onInteraction]);

  // Timeline step change handler
  const handleTimelineStepChange = useCallback((stepIndex: number) => {
    setCurrentTimelineStep(stepIndex);
  }, []);

  // Timeline effect trigger handler
  const handleTimelineEffectTrigger = useCallback((effect: SlideEffect) => {
    triggerEffect(effect);
  }, [triggerEffect]);

  // Simplified touch gesture handlers for mobile swipe
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!slideDeck?.settings?.touchGestures || e.touches.length !== 1) {
      touchStartRef.current = null;
      return;
    }
    const touch = e.touches[0];
    if (!touch) return;
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
  }, [slideDeck]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!slideDeck?.settings?.touchGestures || !touchStartRef.current || e.changedTouches.length !== 1) {
      return;
    }

    const touch = e.changedTouches[0];
    if (!touch) return;
    const touchStart = touchStartRef.current;
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;
    const deltaTime = Date.now() - touchStart.time;

    // Detect swipe gestures (fast horizontal movement)
    if (deltaTime < 500) { // Max swipe duration
      const minSwipeDistance = 50; // Min horizontal movement
      const maxVerticalMovement = 100; // Max vertical movement allowed

      if (Math.abs(deltaX) > minSwipeDistance && Math.abs(deltaY) < maxVerticalMovement) {
        if (deltaX > 0) {
          navigateToPrevious();
        } else {
          navigateToNext();
        }
      }
    }
    touchStartRef.current = null;
  }, [slideDeck, navigateToNext, navigateToPrevious]);

  // Keyboard navigation
  useEffect(() => {
    if (!slideDeck?.settings?.keyboardShortcuts) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event?.key) {
        case 'ArrowRight':
        case ' ':
          event.preventDefault();
          navigateToNext();
          break;
        case 'ArrowLeft':
          event.preventDefault();
          navigateToPrevious();
          break;
        case 'Home':{
            event.preventDefault();
            const firstSlideId = slideDeck?.slides?.[0]?.id;
            if (firstSlideId) {
              navigateToSlide(firstSlideId);
            }
            break;
          }
        case 'End':{
            event.preventDefault();
            const lastSlideId = slideDeck?.slides?.[slideDeck.slides.length - 1]?.id;
            if (lastSlideId) {
              navigateToSlide(lastSlideId);
            }
            break;
          }
        case 'Escape':
          event.preventDefault();
          setActiveEffects([]);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [slideDeck, navigateToNext, navigateToPrevious, navigateToSlide]);

  // Auto-advance
  useEffect(() => {
    if (!slideDeck?.settings?.autoAdvance || !isPlaying) return;

    const delay = slideDeck.settings.autoAdvanceDelay || 5000;
    const timer = setTimeout(() => {
      if (slideDeck?.slides && viewerState.currentSlideIndex < slideDeck.slides.length - 1) {
        navigateToNext();
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [slideDeck, isPlaying, viewerState.currentSlideIndex, navigateToNext]);

  // Calculate responsive container dimensions with proper scaling
  const canvasDimensions = React.useMemo(() => {
    if (!containerRef.current || !currentSlide?.layout?.aspectRatio) {
      return { width: 800, height: 600, scale: 1 };
    }

    const containerRect = containerRef.current.getBoundingClientRect();

    return calculateCanvasDimensions(
      currentSlide.layout.aspectRatio,
      containerRect.width || window.innerWidth,
      containerRect.height || window.innerHeight,
      16, // Standard padding - CSS handles responsive behavior
      false // Remove device-specific logic
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSlide?.layout?.aspectRatio, viewportInfo.width, viewportInfo.height, deviceType]);

  if (!currentSlide) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400 bg-gradient-to-br from-slate-900 to-slate-800">
        No slides available
      </div>);

  }

  const containerStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: currentSlide?.backgroundColor || '#0f172a', // slate-900
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  const slideCanvasStyle: React.CSSProperties = {
    width: canvasDimensions.width,
    height: canvasDimensions.height,
    position: 'relative',
    backgroundColor: currentSlide?.backgroundColor || 'transparent',
    touchAction: slideDeck?.settings?.touchGestures ? 'none' : 'auto'
  };

  if (currentSlide?.backgroundImage) {
    slideCanvasStyle.backgroundImage = `url(${currentSlide.backgroundImage})`;
    slideCanvasStyle.backgroundSize = currentSlide.layout?.backgroundSize || 'cover';
    slideCanvasStyle.backgroundPosition = currentSlide.layout?.backgroundPosition || 'center';
    slideCanvasStyle.backgroundRepeat = 'no-repeat';
  }

  return (
    <div
      ref={containerRef}
      className={`slide-viewer-container mobile-enhanced ${className}`}
      data-slide-id={currentSlide.id}>
      
      <div className="slide-viewer-main">
        {/* Slide Canvas Wrapper - Takes remaining space */}
        <div 
          className="slide-canvas-wrapper"
          style={containerStyle}
        >
          {/* Scaled Slide Canvas with Touch Support */}
          <div
            className="slide-canvas"
            style={slideCanvasStyle}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}>

        {/* Background Media Renderer */}
        {currentSlide?.backgroundMedia && currentSlide.backgroundMedia.type !== 'none' &&
        <div className="absolute inset-0 w-full h-full">
            {/* Background Overlay */}
            {currentSlide.backgroundMedia.overlay?.enabled &&
          <div
            className={`absolute inset-0 w-full h-full ${Z_INDEX_TAILWIND.SLIDE_CONTENT}`}
            style={{
              backgroundColor: currentSlide.backgroundMedia.overlay?.color || '#000000',
              opacity: currentSlide.backgroundMedia.overlay?.opacity || 0.3
            }} />

          }

            {/* Image Background */}
            {currentSlide.backgroundMedia.type === 'image' && currentSlide.backgroundMedia.url &&
          <img
            src={currentSlide.backgroundMedia.url}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            style={{
              objectFit: currentSlide.backgroundMedia.settings?.size === 'contain' ?
              'contain' :
              currentSlide.backgroundMedia.settings?.size === 'stretch' ?
              'fill' :
              'cover',
              objectPosition: currentSlide.backgroundMedia.settings?.position || 'center'
            }} />

          }

            {/* Video Background */}
            {currentSlide.backgroundMedia.type === 'video' && currentSlide.backgroundMedia.url &&
          <video
            src={currentSlide.backgroundMedia.url}
            autoPlay={currentSlide.backgroundMedia.autoplay}
            loop={currentSlide.backgroundMedia.loop}
            muted={currentSlide.backgroundMedia.muted}
            controls={currentSlide.backgroundMedia.controls}
            className="absolute inset-0 w-full h-full object-cover"
            style={{
              objectFit: currentSlide.backgroundMedia.settings?.size === 'contain' ?
              'contain' :
              currentSlide.backgroundMedia.settings?.size === 'stretch' ?
              'fill' :
              'cover',
              objectPosition: currentSlide.backgroundMedia.settings?.position || 'center'
            }}
            onLoadedData={(e) => {
              if (currentSlide.backgroundMedia?.volume !== undefined) {
                (e.target as HTMLVideoElement).volume = currentSlide.backgroundMedia.volume;
              }
            }} />

          }

            {/* YouTube Background */}
            {currentSlide.backgroundMedia.type === 'youtube' && currentSlide.backgroundMedia.youtubeId &&
          <div className="absolute inset-0 w-full h-full">
                <iframe
              src={`https://www.youtube.com/embed/${currentSlide.backgroundMedia.youtubeId}?autoplay=${
              currentSlide.backgroundMedia.autoplay ? 1 : 0}&loop=${

              currentSlide.backgroundMedia.loop ? 1 : 0}&mute=${

              currentSlide.backgroundMedia.muted ? 1 : 0}&controls=${

              currentSlide.backgroundMedia.controls ? 1 : 0}&start=${

              currentSlide.backgroundMedia.startTime || 0}&end=${

              currentSlide.backgroundMedia.endTime || ''}&rel=0&modestbranding=1&playsinline=1`
              }
              className="absolute inset-0 w-full h-full"
              allow="autoplay; encrypted-media"
              allowFullScreen
              title="Background Video"
              style={{
                border: 'none',
                objectFit: currentSlide.backgroundMedia.settings?.size === 'contain' ?
                'contain' :
                'cover'
              }} />

              </div>
          }

            {/* Audio Background */}
            {currentSlide.backgroundMedia.type === 'audio' && currentSlide.backgroundMedia.url &&
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
              }} />

                <div className={`absolute top-4 right-4 ${Z_INDEX_TAILWIND.HOTSPOTS} bg-black/50 rounded-full p-2`}>
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M9 12h.01M15 12h.01" />
                  </svg>
                </div>
              </>
          }
          </div>
        }

        {/* Slide Elements */}
        <div className="slide-elements-container absolute inset-0">
          {currentSlide?.elements?.
          filter((element) => element.isVisible).
          map((element) => {
            const devicePosition = element.position?.[deviceType] || element.position?.desktop;
            if (!devicePosition) return null;

            // Apply scaling to element positions
            const scaledElement = {
              ...element,
              position: {
                ...element.position,
                [deviceType]: {
                  ...devicePosition,
                  x: devicePosition.x * canvasDimensions.scale,
                  y: devicePosition.y * canvasDimensions.scale,
                  width: devicePosition.width * canvasDimensions.scale,
                  height: devicePosition.height * canvasDimensions.scale
                }
              }
            };

            return (
              <SlideElement
                key={element.id}
                element={scaledElement}
                deviceType={deviceType}
                viewportInfo={viewportInfo}
                onInteraction={handleElementInteraction} />);


          })
          }
        </div>
        </div> {/* Close slide-canvas */}
        
        {/* Timeline - Mobile positioned in flexbox layout */}
        {showTimeline && (
          <div className="slide-timeline-mobile">
            <SlideTimeline
              slideDeck={slideDeck}
              currentSlideIndex={viewerState.currentSlideIndex}
              initialStep={currentTimelineStep}
              onStepChange={handleTimelineStepChange}
              onEffectTrigger={handleTimelineEffectTrigger}
              autoPlay={timelineAutoPlay}
              className="w-full pointer-events-none" 
            />
          </div>
        )}
        
      </div> {/* Close slide-canvas-wrapper */}
      
      </div> {/* Close slide-viewer-main */}

      {/* Active Effects - Positioned over entire viewer */}
      {activeEffects.map((effect) =>
      <SlideEffectRenderer
        key={effect.id}
        effect={effect}
        containerRef={containerRef}
        deviceType={deviceType}
        canvasDimensions={canvasDimensions}
        onComplete={() => clearEffect(effect.id)} />

      )}

      {/* Debug Info (development only with explicit flag) */}
      {process.env['NODE_ENV'] === 'development' && process.env['REACT_APP_DEBUG_OVERLAY'] === 'true' &&
      <div className={`absolute top-2 right-2 bg-black bg-opacity-75 text-white text-xs p-2 rounded ${Z_INDEX_TAILWIND.DEBUG_OVERLAY}`}>
          Slide: {viewerState.currentSlideIndex + 1}/{slideDeck?.slides?.length || 0}<br />
          Device: {deviceType}<br />
          Canvas: {canvasDimensions.width}x{canvasDimensions.height}<br />
          Scale: {canvasDimensions.scale.toFixed(2)}<br />
          Effects: {activeEffects.length}<br />
          Timeline: External control
        </div>
      }
    </div>);

}));

SlideViewer.displayName = 'SlideViewer';

export default SlideViewer;