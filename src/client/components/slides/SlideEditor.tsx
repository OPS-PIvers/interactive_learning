import React, { useState, useCallback, useRef, useEffect } from 'react';
import { SlideDeck, InteractiveSlide, SlideElement, DeviceType, FixedPosition, ResponsivePosition, ElementInteraction } from '../../../shared/slideTypes';
import { useDeviceDetection } from '../../hooks/useDeviceDetection';
import { useIsMobile } from '../../hooks/useIsMobile';
import MobilePropertiesPanel from './MobilePropertiesPanel';
import { calculateCanvasDimensions } from '../../utils/aspectRatioUtils';
import SlideTimelineAdapter from '../SlideTimelineAdapter';
import ChevronDownIcon from '../icons/ChevronDownIcon';
import { getHotspotSizeClasses, defaultHotspotSize, getHotspotPixelDimensions } from '../../../shared/hotspotStylePresets';
import { InteractionType } from '../../../shared/types';
import { HotspotFeedbackAnimation } from '../ui/HotspotFeedbackAnimation';

interface SlideEditorProps {
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

interface DragState {
  isDragging: boolean;
  elementId: string | null;
  startPosition: { x: number; y: number };
  startElementPosition: FixedPosition;
}

/**
 * SlideEditor - Visual drag-and-drop editor for creating slides
 * 
 * Maintains consistency with Interactive Learning Hub design system
 */
export const SlideEditor: React.FC<SlideEditorProps> = ({
  slideDeck,
  currentSlideIndex: propCurrentSlideIndex = 0,
  onSlideDeckChange,
  onClose,
  className = '',
  deviceTypeOverride,
  onAspectRatioChange,
  selectedElementId: propSelectedElementId,
  onElementSelect,
  onElementUpdate,
  onSlideUpdate
}) => {
  const { deviceType: detectedDeviceType, viewportInfo } = useDeviceDetection();
  const deviceType = deviceTypeOverride || detectedDeviceType;
  const isMobile = useIsMobile();
  const canvasRef = useRef<HTMLDivElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  
  // Editor state - use prop if provided, otherwise manage internal state
  const [internalSlideIndex, setInternalSlideIndex] = useState(0);
  const currentSlideIndex = propCurrentSlideIndex;
  const [internalSelectedElementId, setInternalSelectedElementId] = useState<string | null>(null);
  
  // Use prop selectedElementId if provided, otherwise use internal state
  const selectedElementId = propSelectedElementId !== undefined ? propSelectedElementId : internalSelectedElementId;
  const setSelectedElementId = onElementSelect || setInternalSelectedElementId;
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    elementId: null,
    startPosition: { x: 0, y: 0 },
    startElementPosition: { x: 0, y: 0, width: 0, height: 0 }
  });
  
  const currentSlide = slideDeck.slides[currentSlideIndex];
  
  // Debug current slide background media in development
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[SlideEditor] Current slide changed:', {
        slideIndex: currentSlideIndex,
        slideTitle: currentSlide?.title,
        backgroundMediaType: currentSlide?.backgroundMedia?.type,
        backgroundMediaUrl: currentSlide?.backgroundMedia?.url,
        backgroundMediaYoutubeId: currentSlide?.backgroundMedia?.youtubeId,
        allSlideBackgrounds: slideDeck.slides.map((s, i) => ({
          index: i,
          title: s.title,
          backgroundType: s.backgroundMedia?.type || 'none'
        }))
      });
    }
  }, [currentSlideIndex, currentSlide, slideDeck.slides]);
  
  // Calculate canvas dimensions based on aspect ratio
  const canvasDimensions = React.useMemo(() => {
    if (!canvasContainerRef.current || !currentSlide?.layout?.aspectRatio) {
      return { width: 800, height: 600, scale: 1 };
    }
    
    const containerRect = canvasContainerRef.current.getBoundingClientRect();
    const isLandscape = window.innerWidth > window.innerHeight;
    const isMobileLandscape = isMobile && isLandscape;
    
    // For mobile, use constrained viewport dimensions to ensure proper scaling
    let availableWidth: number;
    let availableHeight: number;
    
    if (isMobile) {
      // Mobile-specific dimension calculation with viewport constraints
      const viewportWidth = Math.min(window.innerWidth, window.screen.width);
      const viewportHeight = Math.min(window.innerHeight, window.screen.height);
      
      // Account for safe areas and browser UI
      const safeWidth = viewportWidth - 32; // 16px padding on each side
      const safeHeight = viewportHeight - (isMobileLandscape ? 64 : 120); // Account for mobile UI
      
      availableWidth = Math.min(containerRect.width || safeWidth, safeWidth);
      availableHeight = Math.min(containerRect.height || safeHeight, safeHeight);
    } else {
      availableWidth = containerRect.width || 800;
      availableHeight = containerRect.height || 600;
    }
    
    return calculateCanvasDimensions(
      currentSlide.layout.aspectRatio,
      availableWidth,
      availableHeight,
      isMobileLandscape ? 4 : isMobile ? 8 : 48, // Minimal padding for mobile
      isMobileLandscape
    );
  }, [currentSlide?.layout?.aspectRatio, viewportInfo.width, viewportInfo.height, isMobile]);

  // Handle element drag start
  const handleElementDragStart = useCallback((elementId: string, event: React.MouseEvent | React.TouchEvent) => {
    event.stopPropagation();
    
    const element = currentSlide.elements.find(el => el.id === elementId);
    if (!element) return;

    const startPosition = 'touches' in event ? { x: event.touches[0].clientX, y: event.touches[0].clientY } : { x: event.clientX, y: event.clientY };
    
    const position = element.position[deviceType];
    setDragState({
      isDragging: true,
      elementId,
      startPosition: startPosition,
      startElementPosition: position
    });
    
    setSelectedElementId(elementId);
  }, [currentSlide.elements, deviceType]);

  // Handle mouse move during drag
  const handleMove = useCallback((event: MouseEvent | TouchEvent) => {
    if (!dragState.isDragging || !dragState.elementId) return;

    const currentPosition = 'touches' in event ? { x: event.touches[0].clientX, y: event.touches[0].clientY } : { x: event.clientX, y: event.clientY };
    
    const deltaX = currentPosition.x - dragState.startPosition.x;
    const deltaY = currentPosition.y - dragState.startPosition.y;
    
    const newPosition: FixedPosition = {
      x: Math.max(0, dragState.startElementPosition.x + deltaX),
      y: Math.max(0, dragState.startElementPosition.y + deltaY),
      width: dragState.startElementPosition.width,
      height: dragState.startElementPosition.height
    };
    
    // Update element position
    const updatedSlides = slideDeck.slides.map((slide, index) => {
      if (index !== currentSlideIndex) return slide;
      
      return {
        ...slide,
        elements: slide.elements.map(element => {
          if (element.id !== dragState.elementId) return element;
          
          return {
            ...element,
            position: {
              ...element.position,
              [deviceType]: newPosition
            }
          };
        })
      };
    });
    
    onSlideDeckChange({
      ...slideDeck,
      slides: updatedSlides
    });
  }, [dragState, slideDeck, currentSlideIndex, deviceType, onSlideDeckChange]);

  // Handle mouse up (end drag)
  const handleDragEnd = useCallback(() => {
    setDragState({
      isDragging: false,
      elementId: null,
      startPosition: { x: 0, y: 0 },
      startElementPosition: { x: 0, y: 0, width: 0, height: 0 }
    });
  }, []);

  // Attach global mouse event listeners
  useEffect(() => {
    if (dragState.isDragging) {
      document.addEventListener('mousemove', handleMove);
      document.addEventListener('mouseup', handleDragEnd);
      document.addEventListener('touchmove', handleMove);
      document.addEventListener('touchend', handleDragEnd);
      
      return () => {
        document.removeEventListener('mousemove', handleMove);
        document.removeEventListener('mouseup', handleDragEnd);
        document.removeEventListener('touchmove', handleMove);
        document.removeEventListener('touchend', handleDragEnd);
      };
    }
  }, [dragState.isDragging, handleMove, handleDragEnd]);

  // Delete selected element
  const handleDeleteElement = useCallback(() => {
    if (!selectedElementId) return;
    
    const updatedSlides = slideDeck.slides.map((slide, index) => {
      if (index !== currentSlideIndex) return slide;
      
      return {
        ...slide,
        elements: slide.elements.filter(element => element.id !== selectedElementId)
      };
    });
    
    onSlideDeckChange({
      ...slideDeck,
      slides: updatedSlides
    });
    
    setSelectedElementId(null);
  }, [slideDeck, currentSlideIndex, selectedElementId, onSlideDeckChange]);

  const selectedElement = selectedElementId 
    ? currentSlide.elements.find(el => el.id === selectedElementId)
    : null;

  // Create update handlers - use props if provided, otherwise update via onSlideDeckChange
  const handleElementUpdate = useCallback((elementId: string, updates: Partial<SlideElement>) => {
    if (onElementUpdate) {
      onElementUpdate(elementId, updates);
    } else {
      // Fallback to direct slide deck update if no prop handler provided
      const updatedElements = currentSlide.elements.map(element =>
        element.id === elementId ? { ...element, ...updates } : element
      );

      const updatedSlide = {
        ...currentSlide,
        elements: updatedElements
      };

      const updatedSlides = slideDeck.slides.map((slide, index) =>
        index === currentSlideIndex ? updatedSlide : slide
      );

      onSlideDeckChange({
        ...slideDeck,
        slides: updatedSlides,
        metadata: {
          ...slideDeck.metadata,
          modified: Date.now()
        }
      });
    }
  }, [onElementUpdate, currentSlide, currentSlideIndex, slideDeck, onSlideDeckChange]);

  const handleSlideUpdate = useCallback((slideUpdates: Partial<InteractiveSlide>) => {
    if (onSlideUpdate) {
      onSlideUpdate(slideUpdates);
    } else {
      // Fallback to direct slide deck update if no prop handler provided
      const updatedSlide = {
        ...currentSlide,
        ...slideUpdates
      };

      const updatedSlides = slideDeck.slides.map((slide, index) =>
        index === currentSlideIndex ? updatedSlide : slide
      );

      onSlideDeckChange({
        ...slideDeck,
        slides: updatedSlides,
        metadata: {
          ...slideDeck.metadata,
          modified: Date.now()
        }
      });
    }
  }, [onSlideUpdate, currentSlide, currentSlideIndex, slideDeck, onSlideDeckChange]);

  const [isMobilePanelOpen, setIsMobilePanelOpen] = useState(false);
  const [isTimelineCollapsed, setIsTimelineCollapsed] = useState(true);
  
  // Modal state for interactions
  const [modalInteraction, setModalInteraction] = useState<{
    title: string;
    message: string;
  } | null>(null);
  
  // Tooltip state for interactions
  const [tooltipInteraction, setTooltipInteraction] = useState<{
    text: string;
    position: { x: number; y: number };
  } | null>(null);

  // Feedback animation state
  const [feedbackAnimations, setFeedbackAnimations] = useState<Array<{
    id: string;
    x: number;
    y: number;
    color: string;
    timestamp: number;
  }>>([]);
  
  // Spotlight state for interactions
  const [spotlightInteraction, setSpotlightInteraction] = useState<{
    shape: 'circle' | 'rectangle' | 'oval';
    x: number; // percentage
    y: number; // percentage 
    width: number; // pixels
    height: number; // pixels
    backgroundDimPercentage: number; // 0-100
  } | null>(null);
  
  // Pan&Zoom state for interactions
  const [panZoomInteraction, setPanZoomInteraction] = useState<{
    targetX: number; // percentage
    targetY: number; // percentage
    zoomLevel: number; // 1.0 = 100%
    smooth: boolean;
    duration: number; // milliseconds
  } | null>(null);

  useEffect(() => {
    if (isMobile && selectedElementId) {
      setIsMobilePanelOpen(true);
    } else {
      setIsMobilePanelOpen(false);
    }
  }, [isMobile, selectedElementId]);

  // Handle interaction execution when elements are clicked
  const executeInteraction = useCallback((interaction: ElementInteraction, element: SlideElement, event: React.MouseEvent) => {
    console.log('[SlideEditor] Executing interaction:', interaction.effect.type, interaction);
    
    switch (interaction.effect.type as InteractionType) {
      case InteractionType.MODAL:
        const modalParams = interaction.effect.parameters as { title?: string; message?: string };
        setModalInteraction({
          title: modalParams?.title || element.content.title || 'Information',
          message: modalParams?.message || element.content.description || 'No message configured'
        });
        break;
        
      case InteractionType.TRANSITION:
        const transitionParams = interaction.effect.parameters as { type?: string; slideIndex?: number };
        const transitionType = transitionParams?.type || 'next-slide';
        
        // Handle different transition types
        switch (transitionType) {
          case 'next-slide':
            if (currentSlideIndex < slideDeck.slides.length - 1) {
              // This would need to be handled by parent component
              console.log('[SlideEditor] Transition to next slide');
            }
            break;
          case 'prev-slide':
            if (currentSlideIndex > 0) {
              console.log('[SlideEditor] Transition to previous slide');
            }
            break;
          case 'specific-slide':
            const targetSlide = transitionParams?.slideIndex || 0;
            if (targetSlide >= 0 && targetSlide < slideDeck.slides.length) {
              console.log('[SlideEditor] Transition to slide:', targetSlide);
            }
            break;
          default:
            console.log('[SlideEditor] Unknown transition type:', transitionType);
        }
        break;
        
      case InteractionType.SOUND:
        const soundParams = interaction.effect.parameters as { url?: string; volume?: number };
        if (soundParams?.url) {
          const audio = new Audio(soundParams.url);
          audio.volume = soundParams.volume || 0.7;
          audio.play().catch(error => {
            console.error('[SlideEditor] Failed to play sound:', error);
          });
        }
        break;
        
      case InteractionType.TOOLTIP:
        const tooltipParams = interaction.effect.parameters as { text?: string; position?: string };
        const rect = (event.target as HTMLElement).getBoundingClientRect();
        setTooltipInteraction({
          text: tooltipParams?.text || element.content.description || 'No tooltip text configured',
          position: { x: rect.left + rect.width / 2, y: rect.top }
        });
        
        // Auto-hide tooltip after 3 seconds
        setTimeout(() => {
          setTooltipInteraction(null);
        }, 3000);
        break;
        
      case InteractionType.SPOTLIGHT:
        const spotlightParams = interaction.effect.parameters as { 
          spotlightShape?: string; 
          spotlightX?: number; 
          spotlightY?: number; 
          spotlightWidth?: number; 
          spotlightHeight?: number; 
          backgroundDimPercentage?: number;
        };
        
        // Get element position if no custom position specified
        const elementPosition = element.position[deviceType];
        
        // Calculate hotspot visual center by adding half the hotspot dimensions to position
        let spotlightX: number;
        let spotlightY: number;
        
        if (spotlightParams?.spotlightX !== undefined && spotlightParams?.spotlightY !== undefined) {
          // Use custom position if specified
          spotlightX = spotlightParams.spotlightX;
          spotlightY = spotlightParams.spotlightY;
        } else {
          // Calculate center of hotspot for spotlight positioning
          if (element.type === 'hotspot') {
            const hotspotSize = element.content?.customProperties?.size || defaultHotspotSize;
            const dimensions = getHotspotPixelDimensions(hotspotSize, isMobile);
            
            // Add half the hotspot dimensions to get visual center
            const centerX = elementPosition.x + (dimensions.width / 2);
            const centerY = elementPosition.y + (dimensions.height / 2);
            
            spotlightX = (centerX / canvasDimensions.width) * 100;
            spotlightY = (centerY / canvasDimensions.height) * 100;
          } else {
            // For non-hotspot elements, use top-left as before
            spotlightX = (elementPosition.x / canvasDimensions.width) * 100;
            spotlightY = (elementPosition.y / canvasDimensions.height) * 100;
          }
        }
        
        setSpotlightInteraction({
          shape: (spotlightParams?.spotlightShape as 'circle' | 'rectangle' | 'oval') || 'circle',
          x: spotlightX,
          y: spotlightY,
          width: spotlightParams?.spotlightWidth || 200,
          height: spotlightParams?.spotlightHeight || 200,
          backgroundDimPercentage: spotlightParams?.backgroundDimPercentage || 70
        });
        
        // Auto-hide spotlight after 5 seconds
        setTimeout(() => {
          setSpotlightInteraction(null);
        }, 5000);
        break;
        
      case InteractionType.PAN_ZOOM:
        const panZoomParams = interaction.effect.parameters as { 
          targetX?: number; 
          targetY?: number; 
          zoomLevel?: number; 
          smooth?: boolean;
          duration?: number;
        };
        
        // Get element position if no custom target specified
        const targetElementPosition = element.position[deviceType];
        const targetX = panZoomParams?.targetX !== undefined ? panZoomParams.targetX : 
          (targetElementPosition.x / canvasDimensions.width) * 100;
        const targetY = panZoomParams?.targetY !== undefined ? panZoomParams.targetY : 
          (targetElementPosition.y / canvasDimensions.height) * 100;
        
        const panZoomConfig = {
          targetX,
          targetY, 
          zoomLevel: panZoomParams?.zoomLevel || 2.0,
          smooth: panZoomParams?.smooth !== false, // default to true
          duration: panZoomParams?.duration || 1000
        };
        
        setPanZoomInteraction(panZoomConfig);
        
        console.log('[SlideEditor] Pan&Zoom interaction triggered:', panZoomConfig);
        
        // Auto-reset zoom after duration + 3 seconds
        setTimeout(() => {
          setPanZoomInteraction(null);
        }, panZoomConfig.duration + 3000);
        break;
        
      default:
        console.warn('[SlideEditor] Unknown interaction type:', interaction.effect.type);
    }
  }, [currentSlideIndex, slideDeck.slides.length]);
  
  // Handle element click with interaction support (supports both mouse and touch events)
  const handleElementClick = useCallback((element: SlideElement, event: React.MouseEvent | React.TouchEvent) => {
    event.stopPropagation();
    
    // Get coordinates from either mouse or touch event
    const clientX = 'touches' in event ? event.touches[0]?.clientX || event.changedTouches[0]?.clientX : event.clientX;
    const clientY = 'touches' in event ? event.touches[0]?.clientY || event.changedTouches[0]?.clientY : event.clientY;
    
    // Add feedback animation for hotspots
    if (element.type === 'hotspot') {
      const animationId = `feedback-${Date.now()}-${Math.random()}`;
      const feedbackAnimation = {
        id: animationId,
        x: clientX,
        y: clientY,
        color: element.style.backgroundColor || '#3b82f6',
        timestamp: Date.now()
      };
      
      setFeedbackAnimations(prev => [...prev, feedbackAnimation]);
      
      // Clean up animation after duration
      setTimeout(() => {
        setFeedbackAnimations(prev => prev.filter(anim => anim.id !== animationId));
      }, 600);
    }
    
    // If element has click interactions, execute them
    const clickInteractions = element.interactions.filter(i => i.trigger === 'click');
    if (clickInteractions.length > 0) {
      // Execute all click interactions - cast to MouseEvent for compatibility
      clickInteractions.forEach(interaction => {
        executeInteraction(interaction, element, event as React.MouseEvent);
      });
    }
    
    // Always select the element for editing (this maintains existing behavior)
    setSelectedElementId(element.id);
  }, [executeInteraction, setSelectedElementId]);

  // Handle timeline step selection for slide navigation
  const handleTimelineStepSelect = useCallback((slideIndex: number) => {
    // This would be handled by parent component if slide index changes
    if (process.env.NODE_ENV === 'development') {
      console.log('[SlideEditor] Timeline navigation to slide:', slideIndex);
    }
  }, []);

  return (
    <div className={`slide-editor w-full h-full flex flex-col bg-gradient-to-br from-slate-900 to-slate-800 ${className}`}>
      {isMobile && isMobilePanelOpen && (
        <MobilePropertiesPanel
          selectedElement={selectedElement}
          deviceType={deviceType}
          onElementUpdate={handleElementUpdate}
          onDelete={handleDeleteElement}
          onClose={() => {
            setSelectedElementId(null);
            setIsMobilePanelOpen(false);
          }}
        />
      )}
      

      {/* Main Editor Content */}
      <div className="editor-content flex-1 flex">
        {/* Canvas Area */}
        <div ref={canvasContainerRef} className={`canvas-area flex-1 relative flex items-center justify-center ${isMobile ? 'p-2' : 'p-6'}`}>
          <div
            ref={canvasRef}
            className={`slide-canvas relative bg-slate-900 overflow-hidden shadow-2xl ${isMobile ? 'mobile-slide-canvas touch-container' : 'rounded-xl border border-slate-700'}`}
            style={{
              width: canvasDimensions.width,
              height: canvasDimensions.height,
              // Legacy background image support
              backgroundImage: (!currentSlide.backgroundMedia && currentSlide.backgroundImage) 
                ? `url(${currentSlide.backgroundImage})` 
                : undefined,
              backgroundSize: currentSlide.layout?.backgroundSize || 'cover',
              backgroundPosition: currentSlide.layout?.backgroundPosition || 'center',
              backgroundRepeat: 'no-repeat',
              // Pan & Zoom transforms
              ...(panZoomInteraction && {
                transform: `scale(${panZoomInteraction.zoomLevel}) translate(${
                  // Calculate translate values to center the zoom on target
                  ((50 - panZoomInteraction.targetX) / panZoomInteraction.zoomLevel)
                }%, ${
                  ((50 - panZoomInteraction.targetY) / panZoomInteraction.zoomLevel)
                }%)`,
                transformOrigin: `${panZoomInteraction.targetX}% ${panZoomInteraction.targetY}%`,
                transition: panZoomInteraction.smooth 
                  ? `transform ${panZoomInteraction.duration}ms ease-in-out` 
                  : 'none'
              })
            }}
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
                    {process.env.NODE_ENV === 'development' && console.log('[SlideEditor] Rendering YouTube background:', {
                      slideIndex: currentSlideIndex,
                      youtubeId: currentSlide.backgroundMedia.youtubeId,
                      autoplay: currentSlide.backgroundMedia.autoplay,
                      slideDeckLength: slideDeck.slides.length
                    })}
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
                    {/* Audio visualization or indicator */}
                    <div className="absolute top-4 right-4 z-20 bg-black/50 rounded-full p-2">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M9 12h.01M15 12h.01" />
                      </svg>
                    </div>
                  </>
                )}
              </div>
            )}
            {/* Render Elements */}
            {currentSlide.elements
              .filter(element => element.isVisible)
              .map(element => {
                const position = element.position[deviceType];
                const isSelected = element.id === selectedElementId;
                
                // For hotspots, use dynamic sizing based on size preset to ensure container matches visual
                let containerWidth = position.width;
                let containerHeight = position.height;
                let hotspotDimensions: { width: number; height: number } | null = null;
                
                if (element.type === 'hotspot') {
                  const hotspotSize = element.content?.customProperties?.size || defaultHotspotSize;
                  hotspotDimensions = getHotspotPixelDimensions(hotspotSize, isMobile);
                  containerWidth = hotspotDimensions.width;
                  containerHeight = hotspotDimensions.height;
                }
                
                return (
                  <div
                    key={element.id}
                    className={`absolute cursor-move transition-all duration-200 ${
                      isSelected ? 'ring-2 ring-purple-500 ring-opacity-75' : ''
                    } ${element.type === 'hotspot' ? 'hotspot-element' : ''}`}
                    data-element-id={element.id}
                    data-hotspot-id={element.type === 'hotspot' ? element.id : undefined}
                    style={{
                      left: position.x * canvasDimensions.scale,
                      top: position.y * canvasDimensions.scale,
                      width: containerWidth * canvasDimensions.scale,
                      height: containerHeight * canvasDimensions.scale,
                      zIndex: (element.zIndex || 0) + 20 // Ensure elements are above background media
                    }}
                    onMouseDown={(e) => handleElementDragStart(element.id, e)}
                    onTouchStart={(e) => handleElementDragStart(element.id, e)}
                    onClick={(e) => handleElementClick(element, e)}
                    onTouchEnd={(e) => {
                      // Handle touch end as a click for better mobile responsiveness
                      // Only if we're not dragging
                      if (!dragState.isDragging) {
                        handleElementClick(element, e);
                      }
                    }}
                  >
                    {/* Element Content Based on Type */}
                    {element.type === 'hotspot' && (
                      <div className="relative w-full h-full">
                        <div
                          className={`rounded-full shadow-2xl border-2 border-white border-opacity-30 transition-all duration-150 ${
                            element.interactions.length > 0 
                              ? 'cursor-pointer animate-pulse hover:shadow-3xl' 
                              : ''
                          }`}
                          style={{
                            // Use calculated dimensions instead of Tailwind classes for consistency
                            width: hotspotDimensions ? `${hotspotDimensions.width}px` : '20px',
                            height: hotspotDimensions ? `${hotspotDimensions.height}px` : '20px',
                            backgroundColor: element.content?.style?.backgroundColor || '#3b82f6',
                            opacity: element.content?.style?.opacity !== undefined ? element.content.style.opacity : 0.9
                          }}
                        />
                      </div>
                    )}
                    
                    {element.type === 'text' && (
                      <div
                        className="w-full h-full p-2 rounded-xl shadow-2xl text-xs flex items-center justify-center text-center"
                        style={{
                          backgroundColor: element.content?.style?.backgroundColor || 'rgba(30, 41, 59, 0.9)',
                          color: element.content?.style?.color || '#ffffff'
                        }}
                      >
                        <div>
                          <div className="font-semibold">{element.content?.title || 'Text'}</div>
                          {element.content?.description && (
                            <div className="text-xs opacity-75">{element.content.description}</div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {element.type === 'shape' && (
                      <div
                        className="w-full h-full shadow-2xl"
                        style={{
                          backgroundColor: element.content?.style?.backgroundColor || '#8b5cf6',
                          borderRadius: element.content?.style?.borderRadius || '8px'
                        }}
                      />
                    )}
                  </div>
                );
              })}
            
            {/* Selection Guidelines */}
            {selectedElement && (
              <div
                className="absolute pointer-events-none"
                style={{
                  left: selectedElement.position[deviceType].x - 2,
                  top: selectedElement.position[deviceType].y - 2,
                  width: selectedElement.position[deviceType].width + 4,
                  height: selectedElement.position[deviceType].height + 4,
                  border: '2px dashed #a855f7',
                  borderRadius: '4px'
                }}
              />
            )}
          </div>
          
          {/* Canvas Info */}
          <div className="absolute bottom-4 left-4 bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-slate-300 shadow-lg">
            <div>Canvas: {deviceType} view</div>
            <div>Elements: {currentSlide.elements.length}</div>
            {selectedElement && (
              <div className="text-purple-400 font-semibold">
                Selected: {selectedElement.type}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Timeline Panel */}
      <div className="timeline-panel border-t border-slate-700 bg-slate-800/50">
        {/* Timeline Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsTimelineCollapsed(!isTimelineCollapsed)}
              className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
              aria-label={`${isTimelineCollapsed ? 'Expand' : 'Collapse'} timeline`}
            >
              <ChevronDownIcon 
                className={`w-4 h-4 transform transition-transform ${
                  isTimelineCollapsed ? '-rotate-90' : ''
                }`} 
              />
              <span className="font-medium">Timeline</span>
            </button>
            
            <div className="text-xs text-slate-400">
              {slideDeck.slides.reduce((total, slide) => {
                return total + slide.elements.filter(el => 
                  el.interactions.some(int => int.trigger === 'timeline')
                ).length;
              }, 0)} timeline events across {slideDeck.slides.length} slides
            </div>
          </div>

          {!isTimelineCollapsed && (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>Editing timeline events for slide elements</span>
            </div>
          )}
        </div>

        {/* Timeline Content */}
        {!isTimelineCollapsed && (
          <div className="timeline-content" style={{ maxHeight: '300px', overflowY: 'auto' }}>
            <SlideTimelineAdapter
              slideDeck={slideDeck}
              currentSlideIndex={currentSlideIndex}
              onSlideDeckChange={onSlideDeckChange}
              onStepSelect={handleTimelineStepSelect}
              isEditing={true}
              showPreviews={true}
              moduleState="idle"
              isMobile={isMobile}
              className="p-4"
            />
          </div>
        )}
      </div>

      {/* Modal Interaction Overlay */}
      {modalInteraction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {modalInteraction.title}
            </h2>
            <div className="text-gray-700 mb-6 whitespace-pre-wrap">
              {modalInteraction.message}
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setModalInteraction(null)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hotspot Feedback Animations */}
      {feedbackAnimations.map((animation) => (
        <HotspotFeedbackAnimation
          key={animation.id}
          x={animation.x}
          y={animation.y}
          color={animation.color}
          variant="ripple"
          intensity="normal"
          onComplete={() => {
            setFeedbackAnimations(prev => prev.filter(anim => anim.id !== animation.id));
          }}
        />
      ))}

      {/* Tooltip Interaction */}
      {tooltipInteraction && (
        <div
          className="fixed bg-gray-900 text-white px-3 py-2 rounded-lg text-sm shadow-lg z-50 pointer-events-none max-w-xs"
          style={{
            left: tooltipInteraction.position.x,
            top: tooltipInteraction.position.y - 40,
            transform: 'translateX(-50%)'
          }}
        >
          <div className="whitespace-pre-wrap">{tooltipInteraction.text}</div>
          {/* Tooltip arrow */}
          <div 
            className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"
          />
        </div>
      )}

      {/* Spotlight Interaction Overlay */}
      {spotlightInteraction && (
        <div className="absolute inset-0 pointer-events-none z-40">
          {/* Background dim overlay */}
          <div 
            className="absolute inset-0 bg-black transition-opacity duration-500"
            style={{ 
              opacity: spotlightInteraction.backgroundDimPercentage / 100 
            }}
          />
          
          {/* Spotlight area */}
          <div
            className="absolute transition-all duration-500"
            style={{
              left: `${spotlightInteraction.x}%`,
              top: `${spotlightInteraction.y}%`,
              width: `${spotlightInteraction.width}px`,
              height: `${spotlightInteraction.height}px`,
              transform: 'translate(-50%, -50%)',
              // Create spotlight effect using box-shadow
              boxShadow: spotlightInteraction.shape === 'circle' 
                ? `0 0 0 9999px rgba(0, 0, 0, ${spotlightInteraction.backgroundDimPercentage / 100})`
                : `0 0 0 9999px rgba(0, 0, 0, ${spotlightInteraction.backgroundDimPercentage / 100})`,
              borderRadius: spotlightInteraction.shape === 'circle' ? '50%' : 
                           spotlightInteraction.shape === 'oval' ? '50%' : '8px',
              background: 'transparent',
              border: '3px solid rgba(255, 255, 255, 0.8)',
              animation: 'pulse 2s infinite'
            }}
          />
          
          {/* Close button */}
          <button
            className="absolute top-4 right-4 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-full transition-all pointer-events-auto"
            onClick={() => setSpotlightInteraction(null)}
            aria-label="Close spotlight"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Pan&Zoom Interaction Overlay */}
      {panZoomInteraction && (
        <div className="absolute inset-0 pointer-events-none z-30">          
          {/* Zoom level and status indicator */}
          <div className="absolute top-4 left-4 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
              </svg>
              <span>Zoom: {Math.round(panZoomInteraction.zoomLevel * 100)}%</span>
            </div>
            <div className="text-xs text-blue-200 mt-1">
              Target: {Math.round(panZoomInteraction.targetX)}%, {Math.round(panZoomInteraction.targetY)}%
            </div>
          </div>
          
          {/* Target crosshair indicator */}
          <div
            className="absolute pointer-events-none"
            style={{
              left: `${panZoomInteraction.targetX}%`,
              top: `${panZoomInteraction.targetY}%`,
              transform: 'translate(-50%, -50%)',
              transition: panZoomInteraction.smooth ? `all ${panZoomInteraction.duration}ms ease-in-out` : 'none'
            }}
          >
            {/* Crosshair */}
            <div className="relative">
              <div className="absolute w-8 h-0.5 bg-blue-400 -translate-x-1/2 -translate-y-1/2"></div>
              <div className="absolute h-8 w-0.5 bg-blue-400 -translate-x-1/2 -translate-y-1/2"></div>
              <div className="absolute w-3 h-3 border-2 border-blue-400 rounded-full -translate-x-1/2 -translate-y-1/2 animate-ping"></div>
            </div>
          </div>
          
          {/* Reset button */}
          <button
            className="absolute top-4 right-4 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full transition-all pointer-events-auto shadow-lg"
            onClick={() => setPanZoomInteraction(null)}
            aria-label="Reset zoom"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

    </div>
  );
};

export default SlideEditor;