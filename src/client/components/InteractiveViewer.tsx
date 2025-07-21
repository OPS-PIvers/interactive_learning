import React, { useState, useEffect, useCallback, useRef, useMemo, Suspense, lazy } from 'react';
import { useIsMobile } from '../hooks/useIsMobile';
import { useTouchGestures } from '../hooks/useTouchGestures';
import LazyLoadingFallback from './shared/LazyLoadingFallback';
import { HotspotData, TimelineEventData, InteractionType } from '../../shared/types';
import MobileEventRenderer from './mobile/MobileEventRenderer';
import { Z_INDEX } from '../constants/interactionConstants';
import '../styles/mobile-events.css';

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
  
  // Mobile event handling
  const [mobileActiveEvents, setMobileActiveEvents] = useState<TimelineEventData[]>([]);
  
  // Refs
  const imageContainerRef = useRef<HTMLDivElement>(null);
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

  // Timeline management
  const uniqueSortedSteps = useMemo(() => {
    return [...new Set(timelineEvents.map(e => e.step))].sort((a, b) => a - b);
  }, [timelineEvents]);

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
      
      // For mobile, trigger events associated with this hotspot
      if (isMobile) {
        const hotspotEvents = timelineEvents.filter(event => event.targetId === hotspotId);
        if (hotspotEvents.length > 0) {
          setMobileActiveEvents(hotspotEvents);
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
      resetTransform();
      setCurrentStep(uniqueSortedSteps[currentStepIndex - 1]);
    }
  }, [currentStepIndex, uniqueSortedSteps, resetTransform]);

  const handleNextStep = useCallback(() => {
    if (currentStepIndex < uniqueSortedSteps.length - 1) {
      resetTransform();
      setCurrentStep(uniqueSortedSteps[currentStepIndex + 1]);
    }
  }, [currentStepIndex, uniqueSortedSteps, resetTransform]);

  const handleMobileEventComplete = useCallback(() => {
    setMobileActiveEvents([]);
  }, []);

  // Initialize viewer
  useEffect(() => {
    setModuleState('idle');
    setHasUserChosenMode(false);
  }, []);

  // Process timeline events and activate hotspots based on current step
  useEffect(() => {
    const eventsForCurrentStep = timelineEvents.filter(event => event.step === currentStep);
    
    if (moduleState === 'learning') {
      const newActiveDisplayIds = new Set<string>();
      let newPulsingHotspotId: string | null = null;
      
      // Process events for the current step
      eventsForCurrentStep.forEach(event => {
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
      
      // For mobile, set active events
      if (isMobile) {
        setMobileActiveEvents(eventsForCurrentStep);
      }
      
      setActiveHotspotDisplayIds(newActiveDisplayIds);
      setPulsingHotspotId(newPulsingHotspotId);
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
    }
  }, [currentStep, timelineEvents, moduleState, hotspots, isMobile]);

  // Hotspot positioning calculations
  const hotspotsWithPositions = useMemo(() => {
    if (!backgroundImage) return [];
    
    // For viewer mode, always use percentage positioning for consistent behavior
    // across different screen sizes and zoom levels
    return hotspots.map(hotspot => ({
      ...hotspot,
      pixelPosition: null // Use percentage positioning
    }));
  }, [hotspots, backgroundImage]);

  // Current viewer modes state
  const [currentViewerModes] = useState(() => ({
    explore: viewerModes.explore ?? true,
    selfPaced: viewerModes.selfPaced ?? true,
    timed: viewerModes.timed ?? true
  }));

  return (
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
                        transform: `scale(${imageTransform.scale}) translate(${imageTransform.translateX}px, ${imageTransform.translateY}px)`,
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
                            usePixelPositioning={false}
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
              onEventComplete={handleMobileEventComplete}
              imageContainerRef={imageContainerRef}
              isActive={moduleState === 'learning' || moduleState === 'exploring'}
              currentTransform={imageTransform}
              onTransformUpdate={(transform) => setImageTransform(prev => ({ ...prev, ...transform }))}
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
                timelineEvents={timelineEvents}
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
  );
};

export default InteractiveViewer;