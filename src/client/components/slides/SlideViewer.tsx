import React, { useState, useCallback, useEffect, useRef } from 'react';
import { SlideDeck, InteractiveSlide, SlideViewerState, DeviceType, SlideEffect } from '../../../shared/slideTypes';
import { useDeviceDetection } from '../../hooks/useDeviceDetection';
import { SlideElement } from './SlideElement';
import { SlideEffectRenderer } from './SlideEffectRenderer';
import { SlideNavigation } from './SlideNavigation';

interface SlideViewerProps {
  slideDeck: SlideDeck;
  initialSlideId?: string;
  onSlideChange?: (slideId: string, slideIndex: number) => void;
  onInteraction?: (interaction: any) => void;
  className?: string;
}

/**
 * SlideViewer - Core slide-based viewer component
 * 
 * This replaces the complex coordinate system with predictable slide positioning
 */
export const SlideViewer: React.FC<SlideViewerProps> = ({
  slideDeck,
  initialSlideId,
  onSlideChange,
  onInteraction,
  className = ''
}) => {
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

  // Get current slide
  const currentSlide = slideDeck.slides.find(slide => slide.id === viewerState.currentSlideId);

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
    setActiveEffects(prev => [...prev, effect]);
    
    // Auto-remove effect after duration
    if (effect.duration > 0) {
      setTimeout(() => {
        setActiveEffects(prev => prev.filter(e => e.id !== effect.id));
      }, effect.duration);
    }
  }, []);

  const clearEffect = useCallback((effectId: string) => {
    setActiveEffects(prev => prev.filter(e => e.id !== effectId));
  }, []);

  // Element interaction handler
  const handleElementInteraction = useCallback((elementId: string, interactionId: string) => {
    if (!currentSlide) return;

    const element = currentSlide.elements.find(el => el.id === elementId);
    if (!element) return;

    const interaction = element.interactions.find(int => int.id === interactionId);
    if (!interaction) return;

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

  // Keyboard navigation
  useEffect(() => {
    if (!slideDeck.settings.keyboardShortcuts) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
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
    if (!slideDeck.settings.autoAdvance || !viewerState.isPlaying) return;

    const delay = slideDeck.settings.autoAdvanceDelay || 5000;
    const timer = setTimeout(() => {
      if (viewerState.currentSlideIndex < slideDeck.slides.length - 1) {
        navigateToNext();
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [slideDeck.settings, viewerState, navigateToNext]);

  if (!currentSlide) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400 bg-gradient-to-br from-slate-900 to-slate-800">
        No slides available
      </div>
    );
  }

  // Calculate responsive container dimensions - Matches app dark theme
  const containerStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: currentSlide.backgroundColor || '#0f172a' // slate-900
  };

  if (currentSlide.backgroundImage) {
    containerStyle.backgroundImage = `url(${currentSlide.backgroundImage})`;
    containerStyle.backgroundSize = currentSlide.layout.backgroundSize || 'cover';
    containerStyle.backgroundPosition = currentSlide.layout.backgroundPosition || 'center';
    containerStyle.backgroundRepeat = 'no-repeat';
  }

  return (
    <div 
      ref={containerRef}
      className={`slide-viewer ${className}`}
      style={containerStyle}
      data-slide-id={currentSlide.id}
      data-device-type={deviceType}
    >
      {/* Slide Elements */}
      <div className="slide-elements-container absolute inset-0">
        {currentSlide.elements
          .filter(element => element.isVisible)
          .map(element => (
            <SlideElement
              key={element.id}
              element={element}
              deviceType={deviceType}
              viewportInfo={viewportInfo}
              onInteraction={handleElementInteraction}
            />
          ))
        }
      </div>

      {/* Active Effects */}
      {activeEffects.map(effect => (
        <SlideEffectRenderer
          key={effect.id}
          effect={effect}
          containerRef={containerRef}
          deviceType={deviceType}
          onComplete={() => clearEffect(effect.id)}
        />
      ))}

      {/* Navigation Controls */}
      {slideDeck.settings.showControls && (
        <SlideNavigation
          currentSlideIndex={viewerState.currentSlideIndex}
          totalSlides={slideDeck.slides.length}
          onPrevious={navigateToPrevious}
          onNext={navigateToNext}
          onSlideSelect={navigateToSlide}
          slides={slideDeck.slides}
          showProgress={slideDeck.settings.showProgress}
          deviceType={deviceType}
        />
      )}

      {/* Debug Info (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white text-xs p-2 rounded">
          Slide: {viewerState.currentSlideIndex + 1}/{slideDeck.slides.length}<br/>
          Device: {deviceType}<br/>
          Effects: {activeEffects.length}
        </div>
      )}
    </div>
  );
};

export default SlideViewer;