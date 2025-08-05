import React, { useState, useCallback, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { SlideDeck, InteractiveSlide, SlideViewerState, DeviceType, SlideEffect } from '../../../shared/slideTypes';
import { useDeviceDetection } from '../../hooks/useDeviceDetection';
import { ensureSlideElementInteractions } from '../../utils/interactionUtils';
import { SlideElement } from './SlideElement';
import { SlideEffectRenderer } from './SlideEffectRenderer';
import { SlideTimeline } from './SlideTimeline';
import { calculateCanvasDimensions } from '../../utils/aspectRatioUtils';

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
    const initialIndex = initialSlideId 
      ? slideDeck.slides.findIndex(slide => slide.id === initialSlideId)
      : 0;
    const slideId = slideDeck.slides[Math.max(0, initialIndex)]?.id || slideDeck.slides[0]?.id;
    
    return {
      currentSlideId: slideId,
      currentSlideIndex: Math.max(0, initialIndex),
      isPlaying: false,
      playbackSpeed: 1.0,
      history: [slideId],
      userInteractions: []
    };
  });

  // Active slide effects
  const [activeEffects, setActiveEffects] = useState<SlideEffect[]>([]);
  
  // Timeline and playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTimelineStep, setCurrentTimelineStep] = useState(0);
  
  // Touch gesture state for mobile
  const [touchState, setTouchState] = useState({
    startX: 0,
    startY: 0,
    startTime: 0,
    isDragging: false,
    panX: 0,
    panY: 0,
    scale: 1,
    initialDistance: 0
  });

  // Get current slide and ensure elements have interactions
  const currentSlide = React.useMemo(() => {
    const slide = slideDeck.slides.find(slide => slide.id === viewerState.currentSlideId);
    if (!slide) return slide;
    
    // Ensure all elements have proper interactions
    const slideWithInteractions = {
      ...slide,
      elements: ensureSlideElementInteractions(slide?.elements || [])
    };
    
    console.log('[SlideViewer] Current slide with interactions:', slideWithInteractions);
    return slideWithInteractions;
  }, [slideDeck?.slides, viewerState?.currentSlideId]);

  // Navigation functions
  const navigateToSlide = useCallback((slideId: string) => {
    const slideIndex = slideDeck.slides.findIndex(slide => slide.id === slideId);
    if (slideIndex === -1) return;

    setViewerState(prev => ({
      ...prev,
      currentSlideId: slideId,
      currentSlideIndex: slideIndex,
      history: [...prev.history, slideId]
    }));

    // Clear active effects when changing slides
    setActiveEffects([]);

    onSlideChange?.(slideId, slideIndex);
  }, [slideDeck.slides, onSlideChange]);

  // Play/pause handlers
  const handlePlay = useCallback(() => {
    setIsPlaying(true);
    setViewerState(prev => ({ ...prev, isPlaying: true }));
  }, []);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
    setViewerState(prev => ({ ...prev, isPlaying: false }));
  }, []);

  const navigateToNext = useCallback(() => {
    const nextIndex = viewerState.currentSlideIndex + 1;
    if (nextIndex < slideDeck.slides.length) {
      navigateToSlide(slideDeck.slides[nextIndex].id);
    }
  }, [viewerState.currentSlideIndex, slideDeck.slides, navigateToSlide]);

  const navigateToPrevious = useCallback(() => {
    const prevIndex = viewerState.currentSlideIndex - 1;
    if (prevIndex >= 0) {
      navigateToSlide(slideDeck.slides[prevIndex].id);
    }
  }, [viewerState.currentSlideIndex, slideDeck.slides, navigateToSlide]);

  // Effect handling
  const triggerEffect = useCallback((effect: SlideEffect) => {
    console.log('[SlideViewer] triggerEffect called:', effect);
    
    setActiveEffects(prev => {
      const newEffects = [...prev, effect];
      console.log('[SlideViewer] Active effects updated:', newEffects);
      return newEffects;
    });
    
    // Auto-remove effect after duration
    if (effect.duration > 0) {
      console.log('[SlideViewer] Setting effect auto-removal timer:', effect.duration + 'ms');
      setTimeout(() => {
        setActiveEffects(prev => prev.filter(e => e.id !== effect.id));
        console.log('[SlideViewer] Effect auto-removed:', effect.id);
      }, effect.duration);
    }
  }, []);

  const clearEffect = useCallback((effectId: string) => {
    setActiveEffects(prev => prev.filter(e => e.id !== effectId));
  }, []);
  
  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    triggerEffect,
    clearEffect,
    navigateToSlide
  }), [triggerEffect, clearEffect, navigateToSlide]);

  // Element interaction handler
  const handleElementInteraction = useCallback((elementId: string, interactionId: string) => {
    console.log('[SlideViewer] handleElementInteraction called:', { elementId, interactionId });
    
    if (!currentSlide) {
      console.log('[SlideViewer] No current slide found');
      return;
    }

    const element = currentSlide.elements.find(el => el.id === elementId);
    if (!element) {
      console.log('[SlideViewer] Element not found:', elementId);
      return;
    }
    
    console.log('[SlideViewer] Element found:', element);
    console.log('[SlideViewer] Element interactions:', element.interactions);

    const interaction = element.interactions.find(int => int.id === interactionId);
    if (!interaction) {
      console.log('[SlideViewer] Interaction not found:', interactionId);
      return;
    }
    
    console.log('[SlideViewer] Interaction found:', interaction);

    // Log interaction
    const interactionLog = {
      timestamp: Date.now(),
      slideId: currentSlide.id,
      elementId,
      interactionType: interaction.trigger,
      details: { interactionId }
    };

    setViewerState(prev => ({
      ...prev,
      userInteractions: [...prev.userInteractions, interactionLog]
    }));

    // Trigger effect
    triggerEffect(interaction.effect);

    // Handle special effect types
    if (interaction.effect.type === 'transition') {
      const params = interaction.effect.parameters as any;
      if (params.targetSlideId) {
        setTimeout(() => {
          navigateToSlide(params.targetSlideId);
        }, interaction.effect.duration);
      }
    }

    onInteraction?.(interactionLog);
  }, [currentSlide, triggerEffect, navigateToSlide, onInteraction]);

  // Timeline step change handler
  const handleTimelineStepChange = useCallback((stepIndex: number) => {
    setCurrentTimelineStep(stepIndex);
  }, []);

  // Timeline effect trigger handler
  const handleTimelineEffectTrigger = useCallback((effect: SlideEffect) => {
    triggerEffect(effect);
  }, [triggerEffect]);

  // Touch gesture handlers for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!slideDeck?.settings?.touchGestures) return;
    
    const touch = e?.touches?.[0];
    const now = Date.now();
    
    if (e?.touches?.length === 1) {
      // Single touch - prepare for swipe or pan
      setTouchState(prev => ({
        ...prev,
        startX: touch?.clientX || 0,
        startY: touch?.clientY || 0,
        startTime: now,
        isDragging: false
      }));
    } else if (e.touches.length === 2) {
      // Two finger touch - prepare for pinch zoom
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) + 
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      
      setTouchState(prev => ({
        ...prev,
        initialDistance: distance,
        isDragging: false
      }));
    }
  }, [slideDeck.settings.touchGestures]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!slideDeck.settings.touchGestures) return;
    
    e.preventDefault(); // Prevent scrolling while handling gestures
    
    if (e.touches.length === 1) {
      // Single finger - pan or swipe detection
      const touch = e.touches[0];
      const deltaX = touch.clientX - touchState.startX;
      const deltaY = touch.clientY - touchState.startY;
      
      if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
        setTouchState(prev => ({ ...prev, isDragging: true, panX: deltaX, panY: deltaY }));
      }
    } else if (e.touches.length === 2 && touchState.initialDistance > 0) {
      // Two finger - pinch zoom
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) + 
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      
      const scale = Math.max(0.5, Math.min(3, distance / touchState.initialDistance));
      setTouchState(prev => ({ ...prev, scale, isDragging: true }));
    }
  }, [slideDeck.settings.touchGestures, touchState.startX, touchState.startY, touchState.initialDistance]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!slideDeck.settings.touchGestures) return;
    
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchState.startX;
    const deltaY = touch.clientY - touchState.startY;
    const deltaTime = Date.now() - touchState.startTime;
    
    // Reset dragging state
    setTouchState(prev => ({ ...prev, isDragging: false, panX: 0, panY: 0 }));
    
    // Detect swipe gestures (fast horizontal movement)
    if (!touchState.isDragging && deltaTime < 300) {
      const minSwipeDistance = 50;
      const maxVerticalMovement = 100;
      
      if (Math.abs(deltaX) > minSwipeDistance && Math.abs(deltaY) < maxVerticalMovement) {
        if (deltaX > 0) {
          // Swipe right - go to previous slide
          navigateToPrevious();
        } else {
          // Swipe left - go to next slide
          navigateToNext();
        }
      }
    }
    
    // Reset scale if it was adjusted
    if (touchState.scale !== 1) {
      setTimeout(() => {
        setTouchState(prev => ({ ...prev, scale: 1 }));
      }, 300);
    }
  }, [slideDeck.settings.touchGestures, touchState, navigateToNext, navigateToPrevious]);

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
        case 'Home':
          event.preventDefault();
          navigateToSlide(slideDeck.slides[0].id);
          break;
        case 'End':
          event.preventDefault();
          navigateToSlide(slideDeck.slides[slideDeck.slides.length - 1].id);
          break;
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
    if (!slideDeck.settings.autoAdvance || !isPlaying) return;

    const delay = slideDeck.settings.autoAdvanceDelay || 5000;
    const timer = setTimeout(() => {
      if (viewerState.currentSlideIndex < slideDeck.slides.length - 1) {
        navigateToNext();
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [slideDeck.settings, isPlaying, viewerState.currentSlideIndex, navigateToNext]);

  if (!currentSlide) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400 bg-gradient-to-br from-slate-900 to-slate-800">
        No slides available
      </div>
    );
  }

  // Calculate responsive container dimensions with proper scaling
  const canvasDimensions = React.useMemo(() => {
    if (!containerRef.current || !currentSlide?.layout?.aspectRatio) {
      return { width: 800, height: 600, scale: 1 };
    }
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const isLandscape = window.innerWidth > window.innerHeight;
    const isMobile = deviceType === 'mobile';
    const isMobileLandscape = isMobile && isLandscape;
    
    return calculateCanvasDimensions(
      currentSlide.layout.aspectRatio,
      containerRect.width || window.innerWidth,
      containerRect.height || window.innerHeight,
      isMobileLandscape ? 8 : 24, // Much reduced padding for mobile landscape
      isMobileLandscape
    );
  }, [currentSlide?.layout?.aspectRatio, viewportInfo.width, viewportInfo.height, deviceType]);

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
    backgroundColor: currentSlide.backgroundColor || 'transparent',
    transform: `translate(${touchState.panX}px, ${touchState.panY}px) scale(${touchState.scale})`,
    transition: touchState.isDragging ? 'none' : 'transform 0.3s ease-out',
    touchAction: slideDeck.settings.touchGestures ? 'none' : 'auto'
  };

  if (currentSlide.backgroundImage) {
    slideCanvasStyle.backgroundImage = `url(${currentSlide.backgroundImage})`;
    slideCanvasStyle.backgroundSize = currentSlide.layout.backgroundSize || 'cover';
    slideCanvasStyle.backgroundPosition = currentSlide.layout.backgroundPosition || 'center';
    slideCanvasStyle.backgroundRepeat = 'no-repeat';
  }

  return (
    <div 
      ref={containerRef}
      className={`slide-viewer ${className}`}
      style={containerStyle}
      data-slide-id={currentSlide.id}
      data-device-type={deviceType}
    >
      {/* Scaled Slide Canvas with Touch Support */}
      <div 
        className="slide-canvas"
        style={slideCanvasStyle}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
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
                <div className="absolute top-4 right-4 z-20 bg-black/50 rounded-full p-2">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M9 12h.01M15 12h.01" />
                  </svg>
                </div>
              </>
            )}
          </div>
        )}

        {/* Slide Elements */}
        <div className="slide-elements-container absolute inset-0">
          {currentSlide.elements
            .filter(element => element.isVisible)
            .map(element => {
              // Apply scaling to element positions
              const scaledElement = {
                ...element,
                position: {
                  ...element.position,
                  [deviceType]: {
                    x: element.position[deviceType].x * canvasDimensions.scale,
                    y: element.position[deviceType].y * canvasDimensions.scale,
                    width: element.position[deviceType].width * canvasDimensions.scale,
                    height: element.position[deviceType].height * canvasDimensions.scale
                  }
                }
              };
              
              return (
                <SlideElement
                  key={element.id}
                  element={scaledElement}
                  deviceType={deviceType}
                  viewportInfo={viewportInfo}
                  onInteraction={handleElementInteraction}
                />
              );
            })
          }
        </div>
      </div>

      {/* Active Effects */}
      {activeEffects.map(effect => (
        <SlideEffectRenderer
          key={effect.id}
          effect={effect}
          containerRef={containerRef}
          deviceType={deviceType}
          canvasDimensions={canvasDimensions}
          onComplete={() => clearEffect(effect.id)}
        />
      ))}

      {/* Timeline (when enabled) */}
      {showTimeline && (
        <SlideTimeline
          slideDeck={slideDeck}
          currentSlideIndex={viewerState.currentSlideIndex}
          initialStep={currentTimelineStep}
          onStepChange={handleTimelineStepChange}
          onEffectTrigger={handleTimelineEffectTrigger}
          autoPlay={timelineAutoPlay}
          className="absolute bottom-0 left-0 right-0 z-30"
        />
      )}

      {/* Debug Info (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white text-xs p-2 rounded z-50">
          Slide: {viewerState.currentSlideIndex + 1}/{slideDeck.slides.length}<br/>
          Device: {deviceType}<br/>
          Canvas: {canvasDimensions.width}x{canvasDimensions.height}<br/>
          Scale: {canvasDimensions.scale.toFixed(2)}<br/>
          Effects: {activeEffects.length}<br/>
          Timeline: External control
        </div>
      )}
    </div>
  );
}));

SlideViewer.displayName = 'SlideViewer';

export default SlideViewer;