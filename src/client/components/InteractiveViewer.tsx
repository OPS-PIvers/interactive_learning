import React, { useState, useEffect, useCallback, useRef, useMemo, Suspense, lazy } from 'react';
import { useIsMobile } from '../hooks/useIsMobile';
import { useTouchGestures } from '../hooks/useTouchGestures';
import LazyLoadingFallback from './shared/LazyLoadingFallback';
import { HotspotData, TimelineEventData, InteractionType } from '../../shared/types';
import MobileEventRenderer from './mobile/MobileEventRenderer';
import DesktopEventRenderer from './desktop/DesktopEventRenderer';
import { Z_INDEX } from '../constants/interactionConstants';
import '../styles/mobile-events.css';
import { debugMobilePositioning } from '../utils/unifiedMobilePositioning';
import { getActualImageVisibleBounds, getActualImageVisibleBoundsRelative } from '../utils/imageBounds';
import { clampToImageBounds, percentageToPixelImageBounds } from '../../lib/safeMathUtils';
import { PanZoomProvider } from '../contexts/PanZoomProvider';
import { InteractiveViewerContent } from './InteractiveViewerContent';

// Lazy load timeline component
const HorizontalTimeline = lazy(() => import('./HorizontalTimeline'));
const HotspotViewer = lazy(() => import('./HotspotViewer'));

interface InteractiveViewerProps {
  projectName: string;
  backgroundImage: string | null;
  hotspots: HotspotData[];
  timelineEvents: TimelineEventData[];
  viewerModes: {
    explore: boolean;
    selfPaced: boolean;
    timed: boolean;
  };
  onClose: () => void;
}

const InteractiveViewer: React.FC<InteractiveViewerProps> = ({
  projectName,
  backgroundImage,
  hotspots,
  timelineEvents,
  viewerModes,
  onClose
}) => {
  const isMobile = useIsMobile();
  
  // Simple image loading like the working version
  const [imageLoading, setImageLoading] = useState(false);
  const [imageNaturalDimensions, setImageNaturalDimensions] = useState<{width: number; height: number} | null>(null);
  
  // Viewer-specific state
  const [moduleState, setModuleState] = useState<'idle' | 'exploring' | 'learning'>('idle');
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [hasUserChosenMode, setHasUserChosenMode] = useState(false);
  const [isTimedMode, setIsTimedMode] = useState(false);
  const [autoProgressionDuration, setAutoProgressionDuration] = useState<number>(3000);
  
  // Image and viewport state
  const [imageTransform, setImageTransform] = useState({
    scale: 1,
    translateX: 0,
    translateY: 0,
    targetHotspotId: undefined as string | undefined
  });
  
  // Hotspot interaction state
  const [pulsingHotspotId, setPulsingHotspotId] = useState<string | null>(null);
  const [activeHotspotDisplayIds, setActiveHotspotDisplayIds] = useState<Set<string>>(new Set());
  const [exploredHotspotId, setExploredHotspotId] = useState<string | null>(null);
  const [focusedHotspot, setFocusedHotspot] = useState<HotspotData | null>(null);
  const [currentMessage, setCurrentMessage] = useState<string | null>(null);
  
  // Event handling
  const [mobileActiveEvents, setMobileActiveEvents] = useState<TimelineEventData[]>([]);
  const [desktopActiveEvents, setDesktopActiveEvents] = useState<TimelineEventData[]>([]);
  const [textBannerContent, setTextBannerContent] = useState<string | null>(null);
  
  // Refs
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const imageElementRef = useRef<HTMLImageElement>(null);
  const viewerTimelineRef = useRef<HTMLDivElement>(null);
  
  // Transform constraints and utilities
  const [isTransformingFromGestures, setIsTransformingFromGestures] = useState(false);
  const isTransforming = useMemo(() => {
    const isProgrammaticTransform = imageTransform.scale !== 1 || imageTransform.translateX !== 0 || imageTransform.translateY !== 0;
    return isProgrammaticTransform || isTransformingFromGestures;
  }, [imageTransform, isTransformingFromGestures]);

  // Touch gesture handling
  const {
    isGestureActive,
    setEventActive,
    isEventActive,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd
  } = useTouchGestures(
    imageContainerRef,
    imageTransform,
    (transform) => setImageTransform(prev => ({ ...prev, ...transform })),
    setIsTransformingFromGestures, // Correctly pass the setter
    {
      isDragging: false,
      isEditing: false
    }
  );

  const touchHandlers = useMemo(() => ({
    onTouchStart: isMobile ? handleTouchStart : undefined,
    onTouchMove: isMobile ? handleTouchMove : undefined,
    onTouchEnd: isMobile ? handleTouchEnd : undefined,
  }), [isMobile, handleTouchStart, handleTouchMove, handleTouchEnd]);

  // Timeline management - Memoize filtered events for reuse
  const filteredTimelineEvents = useMemo(() => {
    const hotspotIds = new Set(hotspots.map(h => h.id));
    return timelineEvents.filter(e => e.targetId && hotspotIds.has(e.targetId));
  }, [timelineEvents, hotspots]);

  const uniqueSortedSteps = useMemo(() => {
    return [...new Set(filteredTimelineEvents.map(e => e.step))].sort((a, b) => a - b);
  }, [filteredTimelineEvents]);

  const currentStepIndex = useMemo(() => {
    return uniqueSortedSteps.indexOf(currentStep);
  }, [uniqueSortedSteps, currentStep]);

  const totalTimelineInteractionPoints = uniqueSortedSteps.length;

  // Event handlers
  const handleStartExploring = useCallback(() => {
    setModuleState('exploring');
    setHasUserChosenMode(true);
  }, []);

  const handleStartLearning = useCallback(() => {
    setModuleState('learning');
    setHasUserChosenMode(true);
    // Automatically start with the first available timeline step
    if (uniqueSortedSteps.length > 0) {
      setCurrentStep(uniqueSortedSteps[0]);
    }
  }, [uniqueSortedSteps]);

  const handleHotspotClick = useCallback((hotspotId: string) => {
    if (moduleState === 'exploring') {
      setExploredHotspotId(hotspotId);
      
      // Trigger events associated with this hotspot
      const hotspotEvents = timelineEvents.filter(event => event.targetId === hotspotId);
      if (hotspotEvents.length > 0) {
        if (isMobile) {
          setMobileActiveEvents(hotspotEvents);
        } else {
          setDesktopActiveEvents(hotspotEvents);
        }
      }
    }
  }, [moduleState, isMobile, timelineEvents]);

  // Helper function to reset transform state - extracted to reduce duplication
  const resetTransform = useCallback(() => {
    setImageTransform({
      scale: 1,
      translateX: 0,
      translateY: 0,
      targetHotspotId: undefined
    });
    setIsTransformingFromGestures(false);
  }, []);

  const handleTimelineDotClick = useCallback((step: number) => {
    console.log('[InteractiveViewer] Timeline dot clicked:', step);
    // Clear active events first to prevent overlapping with new step events
    setMobileActiveEvents([]);
    setDesktopActiveEvents([]);
    
    // Reset pan & zoom when moving to a different step
    resetTransform();
    setCurrentStep(step);
    if (moduleState === 'idle') {
      setModuleState('learning');
      setHasUserChosenMode(true);
    }
  }, [moduleState, resetTransform]);

  const handlePrevStep = useCallback(() => {
    if (currentStepIndex > 0) {
      console.log('[InteractiveViewer] Moving to previous step');
      // Clear active events first to prevent overlapping
      setMobileActiveEvents([]);
      setDesktopActiveEvents([]);
      
      const prevStepIndex = currentStepIndex - 1;
      const prevStep = uniqueSortedSteps[prevStepIndex];
      const eventsForPrevStep = timelineEvents.filter(event => event.step === prevStep);
      const hasPanZoom = eventsForPrevStep.some(event =>
        event.type === InteractionType.PAN_ZOOM || event.type === InteractionType.PAN_ZOOM_TO_HOTSPOT
      );

      if (!hasPanZoom) {
        resetTransform();
      }

      setCurrentStep(prevStep);
    }
  }, [currentStepIndex, uniqueSortedSteps, timelineEvents, resetTransform]);

  const handleNextStep = useCallback(() => {
    if (currentStepIndex < uniqueSortedSteps.length - 1) {
      console.log('[InteractiveViewer] Moving to next step');
      // Clear active events first to prevent overlapping
      setMobileActiveEvents([]);
      setDesktopActiveEvents([]);
      
      const nextStepIndex = currentStepIndex + 1;
      const nextStep = uniqueSortedSteps[nextStepIndex];
      const eventsForNextStep = timelineEvents.filter(event => event.step === nextStep);
      const hasPanZoom = eventsForNextStep.some(event =>
        event.type === InteractionType.PAN_ZOOM || event.type === InteractionType.PAN_ZOOM_TO_HOTSPOT
      );

      if (!hasPanZoom) {
        resetTransform();
      }

      setCurrentStep(nextStep);
    }
  }, [currentStepIndex, uniqueSortedSteps, timelineEvents, resetTransform]);

  const handleMobileEventComplete = useCallback(() => {
    setMobileActiveEvents([]);
  }, []);

  const handleDesktopEventComplete = useCallback(() => {
    setDesktopActiveEvents([]);
  }, []);

  // Initialize viewer
  useEffect(() => {
    setModuleState('idle');
    setHasUserChosenMode(false);
  }, []);

  // Stable transform update callback to prevent infinite loops
  const handleTransformUpdate = useCallback((transform: any) => {
    setImageTransform(prev => ({ ...prev, ...transform }));
  }, [setImageTransform]);

  // Ref to track last processed step to prevent infinite loops
  const lastProcessedStepRef = useRef<{
    step: number;
    moduleState: string;
    eventsCount: number;
    timestamp: number;
  } | null>(null);

  // Process timeline events and activate hotspots based on current step
  useEffect(() => {
    console.log('[InteractiveViewer] Processing step events:', {
      currentStep,
      moduleState,
      timelineEventsCount: timelineEvents.length
    });

    // Loop prevention: Check if we're processing the same step too frequently
    const now = Date.now();
    const current = {
      step: currentStep,
      moduleState,
      eventsCount: timelineEvents.length,
      timestamp: now
    };

    if (lastProcessedStepRef.current) {
      const last = lastProcessedStepRef.current;
      const isSameState = last.step === current.step && 
                          last.moduleState === current.moduleState && 
                          last.eventsCount === current.eventsCount;
      const timeDiff = now - last.timestamp;
      
      // Prevent processing the same state within 100ms (loop prevention)
      if (isSameState && timeDiff < 100) {
        console.log('[InteractiveViewer] Skipping duplicate event processing within 100ms');
        return;
      }
    }

    lastProcessedStepRef.current = current;

    const eventsForCurrentStep = timelineEvents.filter(event => event.step === currentStep);
    
    if (moduleState === 'learning') {
      const newActiveDisplayIds = new Set<string>();
      let newPulsingHotspotId: string | null = null;
      let newTextBannerContent: string | null = null;
      
      // Process events for the current step
      eventsForCurrentStep.forEach(event => {
        if (event.showTextBanner && event.targetId) {
          const targetHotspot = hotspots.find(h => h.id === event.targetId);
          if (targetHotspot) {
            newTextBannerContent = `${targetHotspot.title}: ${targetHotspot.description}`;
          }
        }

        // Show hotspot if it has an event or if displayHotspotInEvent is true
        if (event.targetId) {
          const targetHotspot = hotspots.find(h => h.id === event.targetId);
          if (targetHotspot && (targetHotspot.displayHotspotInEvent !== false)) {
            newActiveDisplayIds.add(event.targetId);
          }
          
          // Set pulsing for pulse events
          if (event.type === InteractionType.PULSE_HOTSPOT || event.type === InteractionType.PULSE_HIGHLIGHT) {
            newPulsingHotspotId = event.targetId;
          }
        }
      });
      
      // FIXED: Also show hotspots that don't have any timeline events for all learning steps
      // This ensures hotspots without timeline events are visible in learning mode
      hotspots.forEach(hotspot => {
        const hasAnyTimelineEvents = timelineEvents.some(event => event.targetId === hotspot.id);
        if (!hasAnyTimelineEvents && hotspot.displayHotspotInEvent !== false) {
          newActiveDisplayIds.add(hotspot.id);
        }
      });
      
      // CRITICAL FIX: Clear previous events before setting new ones to prevent duplication
      console.log('[InteractiveViewer] Clearing previous events before setting new ones for step:', currentStep);
      setMobileActiveEvents([]);
      setDesktopActiveEvents([]);
      
      // Small delay to ensure cleanup completes before setting new events
      setTimeout(() => {
        console.log('[InteractiveViewer] Setting events for step:', currentStep, 'Events:', eventsForCurrentStep.map(e => ({ id: e.id, type: e.type })));
        // Set active events for current platform
        if (isMobile) {
          setMobileActiveEvents(eventsForCurrentStep);
        } else {
          setDesktopActiveEvents(eventsForCurrentStep);
        }
      }, 50);
      
      setActiveHotspotDisplayIds(newActiveDisplayIds);
      setPulsingHotspotId(newPulsingHotspotId);
      setTextBannerContent(newTextBannerContent);
    } else if (moduleState === 'idle' || moduleState === 'exploring') {
      // In idle/exploring mode, show all hotspots that don't have events or have displayHotspotInEvent = true
      const activeEventHotspotIds = new Set(eventsForCurrentStep.map(e => e.targetId));
      const visibleIds = new Set<string>();
      
      hotspots.forEach(hotspot => {
        if (!activeEventHotspotIds.has(hotspot.id) || hotspot.displayHotspotInEvent !== false) {
          visibleIds.add(hotspot.id);
        }
      });
      
      setActiveHotspotDisplayIds(visibleIds);
      setPulsingHotspotId(null);
      setMobileActiveEvents([]);
      setDesktopActiveEvents([]);
      setTextBannerContent(null);
    }
  }, [currentStep, timelineEvents, moduleState, hotspots, isMobile]);

  // Hotspot positioning calculations - mobile vs desktop aware
  const hotspotsWithPositions = useMemo(() => {
    if (!backgroundImage) return [];
    
    return hotspots.map(hotspot => {
      // Apply boundary validation to percentage coordinates
      const clampedPercentage = clampToImageBounds(
        { x: hotspot.x, y: hotspot.y },
        { width: 100, height: 100 }, // Not used for percentage clamping
        'percentage'
      );
      
      const clampedHotspot = {
        ...hotspot,
        x: clampedPercentage.x,
        y: clampedPercentage.y
      };
      
      let pixelPosition = null;
      
      if (isMobile) {
        // Mobile: Use percentage positioning for consistency across screen sizes
        // No pixel position needed - will use CSS percentage positioning
      } else {
        // Desktop: Use pixel positioning for perfect alignment with events
        if (imageElementRef.current && imageContainerRef.current) {
          const visibleImageBounds = getActualImageVisibleBoundsRelative(
            imageElementRef.current, 
            imageContainerRef.current
          );
          
          if (visibleImageBounds && visibleImageBounds.width > 0 && visibleImageBounds.height > 0) {
            // Convert percentage to pixel position within image content area
            const imagePixelPosition = percentageToPixelImageBounds(
              { x: clampedHotspot.x, y: clampedHotspot.y },
              visibleImageBounds
            );
            
            // Add image offset within container to get final container-relative coordinates
            pixelPosition = {
              x: visibleImageBounds.x + imagePixelPosition.x,
              y: visibleImageBounds.y + imagePixelPosition.y
            };
          }
        }
      }
      
      return {
        ...clampedHotspot,
        pixelPosition
      };
    });
  }, [hotspots, backgroundImage, isMobile, imageElementRef.current, imageContainerRef.current]);

  // Current viewer modes state
  const [currentViewerModes] = useState(() => ({
    explore: viewerModes.explore ?? true,
    selfPaced: viewerModes.selfPaced ?? true,
    timed: viewerModes.timed ?? true
  }));

  return (
    <PanZoomProvider>
      <InteractiveViewerContent 
        imageContainerRef={imageContainerRef}
        imageElementRef={imageElementRef}
      >
        <div className="fixed inset-0 z-50 bg-slate-900">
        <div
          id="viewer-content"
          tabIndex={-1}
          className="text-slate-200 fixed inset-0 z-50 bg-slate-900"
          role="main"
          aria-label="Interactive module viewer"
          aria-live="polite"
        >
        {/* Viewer Toolbar */}
        <div className="bg-slate-800 border-b border-slate-700 p-4 flex items-center justify-between">
          <button
            onClick={onClose}
            className="flex items-center space-x-2 text-slate-300 hover:text-white transition-colors"
          >
            <span>← Back</span>
          </button>
          <h1 className="text-lg font-semibold text-white truncate mx-4">
            {projectName}
          </h1>
          <div className="w-16"></div> {/* Spacer for centering */}
        </div>

        {textBannerContent && (
          <div 
            className="bg-blue-600 text-white p-2 text-center text-sm" 
            role="banner" 
            aria-live="polite"
            aria-label="Contextual information banner"
          >
            {textBannerContent}
          </div>
        )}

        {/* Main Content Area */}
        <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} h-full`}>
          {/* Image Display Area */}
          <div
            className={`flex-1 relative bg-slate-900 ${isMobile ? 'pb-24' : ''}`}
            style={{ zIndex: Z_INDEX.IMAGE_BASE }}
          >
            {backgroundImage ? (
              <>
                <div
                  ref={imageContainerRef}
                  className="w-full h-full relative overflow-hidden"
                  {...touchHandlers}
                >
                  {/* Background Image with Secure Loading */}
                  {imageLoading && (
                    <div className="w-full h-full flex items-center justify-center bg-slate-200">
                      <div className="text-slate-600">Loading image...</div>
                    </div>
                  )}
                  {backgroundImage && (
                    <img
                      ref={imageElementRef}
                      src={backgroundImage}
                      alt="Interactive content background"
                      className="w-full h-full object-contain"
                      onLoad={(e) => {
                        setImageNaturalDimensions({
                          width: e.currentTarget.naturalWidth,
                          height: e.currentTarget.naturalHeight
                        });
                        setImageLoading(false);
                      }}
                      onError={() => {
                        console.error('Failed to load background image:', backgroundImage);
                        setImageNaturalDimensions(null);
                        setImageLoading(false);
                      }}
                      style={{
                        transform: `translate(${imageTransform.translateX}px, ${imageTransform.translateY}px) scale(${imageTransform.scale})`,
                        transformOrigin: 'center center',
                        transition: 'transform 0.3s ease-out'
                      }}
                      draggable={false}
                    />
                  )}

                  {/* Hotspots */}
                  <div className="absolute inset-0 pointer-events-none">
                    {hotspotsWithPositions.map((hotspot) => {
                      const shouldShow = moduleState === 'idle' ||
                        moduleState === 'exploring' || 
                        (moduleState === 'learning' && activeHotspotDisplayIds.has(hotspot.id));
                      
                      if (!shouldShow) return null;

                      return (
                        <Suspense key={hotspot.id} fallback={<div className="hotspot-placeholder" />}>
                          <HotspotViewer
                            hotspot={hotspot}
                            pixelPosition={hotspot.pixelPosition}
                            usePixelPositioning={!isMobile && !!hotspot.pixelPosition}
                            imageElement={imageElementRef.current}
                            isPulsing={moduleState === 'learning' && pulsingHotspotId === hotspot.id}
                            isDimmedInEditMode={false}
                            isEditing={false}
                            onFocusRequest={handleHotspotClick}
                            isContinuouslyPulsing={moduleState === 'idle' && !isTransforming}
                            isMobile={isMobile}
                            isVisible={shouldShow}
                            isActive={activeHotspotDisplayIds.has(hotspot.id)}
                          />
                        </Suspense>
                      );
                    })}
                  </div>

                  {/* Mobile Event Renderer moved outside to prevent viewport clipping */}

                  {/* Mode Selection Overlay */}
                  {moduleState === 'idle' && backgroundImage && !hasUserChosenMode && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm" style={{ zIndex: Z_INDEX.MODAL }}>
                      <div className="text-center space-y-4 sm:space-y-6 p-6 sm:p-8 bg-black/60 rounded-lg sm:rounded-2xl border border-white/20 shadow-xl sm:shadow-2xl max-w-xs sm:max-w-md">
                        <div>
                          <h2 className="text-xl sm:text-2xl font-bold text-white mb-1 sm:mb-2">Interactive Module Ready</h2>
                          <p className="text-slate-300 text-xs sm:text-sm">Choose how you'd like to explore this content</p>
                        </div>
                        <div className="flex flex-col space-y-2.5 sm:space-y-3">
                          {currentViewerModes.explore && (
                            <button
                              onClick={handleStartExploring}
                              className="flex-1 bg-gradient-to-r from-sky-600 to-cyan-600 text-white font-semibold py-2.5 sm:py-3 px-5 sm:px-6 rounded-md sm:rounded-lg shadow-lg hover:from-sky-500 hover:to-cyan-500 transition-all duration-200 text-sm sm:text-base"
                            >
                              Explore Module
                            </button>
                          )}
                          {(currentViewerModes.selfPaced || currentViewerModes.timed) && (
                            <button
                              onClick={handleStartLearning}
                              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-2.5 sm:py-3 px-5 sm:px-6 rounded-md sm:rounded-lg shadow-lg hover:from-purple-500 hover:to-pink-500 transition-all duration-200 text-sm sm:text-base"
                            >
                              Start Guided Tour
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-center text-slate-400">
                <p>No background image set.</p>
              </div>
            )}
          </div>

          {/* Mobile Event Renderer - positioned outside constrained containers for proper viewport centering */}
          {isMobile && (
            <MobileEventRenderer
              events={mobileActiveEvents}
              hotspots={hotspots}
              imageElement={imageElementRef.current}
              onEventComplete={handleMobileEventComplete}
              imageContainerRef={imageContainerRef}
              isActive={moduleState === 'learning' || moduleState === 'exploring'}
              currentTransform={imageTransform}
              onTransformUpdate={handleTransformUpdate}
              isGestureActive={isGestureActive()}
              isVisible={moduleState === 'learning' || moduleState === 'exploring'}
              // New timeline navigation props
              moduleState={moduleState}
              currentStep={currentStep}
              totalSteps={totalTimelineInteractionPoints}
              currentStepIndex={currentStepIndex}
              isTimedMode={isTimedMode}
              autoProgressionDuration={autoProgressionDuration}
              onPrevStep={handlePrevStep}
              onNextStep={handleNextStep}
              onCompleteAllEvents={() => {
                if (moduleState === 'exploring') {
                  // Reset to idle state for explore mode
                  setModuleState('idle');
                  setHasUserChosenMode(false);
                } else {
                  // For learning mode, just clear active events
                  setMobileActiveEvents([]);
                }
              }}
            />
          )}
          
          {/* Desktop Event Renderer */}
          {!isMobile && (
            <DesktopEventRenderer
              events={desktopActiveEvents}
              hotspots={hotspots}
              imageElement={imageElementRef.current}
              onEventComplete={handleDesktopEventComplete}
              imageContainerRef={imageContainerRef}
              isActive={moduleState === 'learning' || moduleState === 'exploring'}
              currentTransform={imageTransform}
              onTransformUpdate={handleTransformUpdate}
              moduleState={moduleState}
              currentStep={currentStep}
              totalSteps={totalTimelineInteractionPoints}
              currentStepIndex={currentStepIndex}
              onPrevStep={handlePrevStep}
              onNextStep={handleNextStep}
              onCompleteAllEvents={() => {
                if (moduleState === 'exploring') {
                  // Reset to idle state for explore mode
                  setModuleState('idle');
                  setHasUserChosenMode(false);
                } else {
                  // For learning mode, just clear active events
                  setDesktopActiveEvents([]);
                }
              }}
            />
          )}

          {/* Timeline Container */}
          <div
            ref={viewerTimelineRef}
            className={`${
              isMobile 
                ? 'flex-shrink-0 relative' 
                : 'bg-slate-800 border-t border-slate-700 absolute bottom-0 left-0 right-0'
            }`}
            style={{ 
              zIndex: Z_INDEX.TIMELINE, 
              paddingBottom: isMobile ? '0px' : 'max(env(safe-area-inset-bottom), 0px)' 
            }}
          >
            <Suspense fallback={<LazyLoadingFallback type="component" message="Loading timeline..." />}>
              <HorizontalTimeline
                uniqueSortedSteps={uniqueSortedSteps}
                currentStep={currentStep}
                onStepSelect={handleTimelineDotClick}
                isEditing={false}
                timelineEvents={filteredTimelineEvents}
                setTimelineEvents={() => {}} // Read-only in viewer
                hotspots={hotspots}
                moduleState={moduleState === 'exploring' ? 'idle' : moduleState}
                onPrevStep={handlePrevStep}
                onNextStep={handleNextStep}
                currentStepIndex={currentStepIndex}
                totalSteps={totalTimelineInteractionPoints}
                isMobile={isMobile}
                onAddStep={() => {}} // No-op in viewer mode
                onDeleteStep={() => {}} // No-op in viewer mode
                onUpdateStep={() => {}} // No-op in viewer mode
                onMoveStep={() => {}} // No-op in viewer mode
              />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
      </InteractiveViewerContent>
    </PanZoomProvider>
  );
};

export default InteractiveViewer;