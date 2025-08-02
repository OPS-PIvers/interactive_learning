import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { SlideDeck, SlideViewerState } from '../../shared/slideTypes';
import { ViewerModes } from '../../shared/interactiveTypes';
import { MigrationResult } from '../../shared/migrationUtils';
import { useDeviceDetection } from '../hooks/useDeviceDetection';
import { SlideViewer } from './slides/SlideViewer';
import TimelineSlideViewer from './slides/TimelineSlideViewer';
import ViewerFooterToolbar from './ViewerFooterToolbar';

interface SlideBasedViewerProps {
  slideDeck: SlideDeck;
  projectName: string;
  viewerModes: ViewerModes;
  autoStart?: boolean;
  onClose: () => void;
  migrationResult?: MigrationResult | null;
}

/**
 * SlideBasedViewer - Enhanced viewer for slide-based interactive experiences
 * 
 * Provides multiple viewing modes and integrates with the existing viewer toolbar
 * while using the new slide architecture under the hood.
 */
const SlideBasedViewer: React.FC<SlideBasedViewerProps> = ({
  slideDeck,
  projectName,
  viewerModes,
  autoStart = false,
  onClose,
  migrationResult
}) => {
  const { deviceType } = useDeviceDetection();
  
  // Viewer state
  const [moduleState, setModuleState] = useState<'idle' | 'exploring' | 'learning'>('idle');
  const [currentSlideId, setCurrentSlideId] = useState<string>(slideDeck.slides[0]?.id || '');
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [activeHotspotId, setActiveHotspotId] = useState<string | null>(null);
  const [completedHotspots, setCompletedHotspots] = useState<Set<string>>(new Set());
  
  // Auto-progression state
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  
  // Navigation handlers for footer toolbar
  const handlePreviousSlide = useCallback(() => {
    if (currentSlideIndex > 0) {
      const prevIndex = currentSlideIndex - 1;
      setCurrentSlideIndex(prevIndex);
      setCurrentSlideId(slideDeck.slides[prevIndex]?.id || '');
    }
  }, [currentSlideIndex, slideDeck.slides]);
  
  const handleNextSlide = useCallback(() => {
    if (currentSlideIndex < slideDeck.slides.length - 1) {
      const nextIndex = currentSlideIndex + 1;
      setCurrentSlideIndex(nextIndex);
      setCurrentSlideId(slideDeck.slides[nextIndex]?.id || '');
    }
  }, [currentSlideIndex, slideDeck.slides]);

  // Auto-start functionality
  useEffect(() => {
    if (autoStart) {
      if (viewerModes.selfPaced) {
        setModuleState('learning');
      } else {
        setModuleState('exploring');
      }
    }
  }, [autoStart, viewerModes]);

  const handleStartExploring = useCallback(() => {
    setModuleState('exploring');
  }, []);

  const handleStartLearning = useCallback(() => {
    setModuleState('learning');
  }, []);

  const handleBackToMenu = useCallback(() => {
    // In this simplified view, "Back to Menu" will just close the viewer
    onClose();
  }, [onClose]);

  // Slide change handler
  const handleSlideChange = useCallback((slideId: string, slideIndex: number) => {
    setCurrentSlideId(slideId);
    setCurrentSlideIndex(slideIndex);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[SlideBasedViewer] Slide changed:', {
        slideId,
        slideIndex,
        moduleState
      });
    }
  }, [moduleState]);

  const handleSlideSelect = useCallback((slideId: string) => {
    const slideIndex = slideDeck.slides.findIndex(s => s.id === slideId);
    if (slideIndex !== -1) {
      handleSlideChange(slideId, slideIndex);
    }
  }, [slideDeck.slides, handleSlideChange]);

  // Timeline navigation handler
  const handleTimelineStepSelect = useCallback((stepSlideIndex: number) => {
    if (stepSlideIndex >= 0 && stepSlideIndex < slideDeck.slides.length) {
      const slideId = slideDeck.slides[stepSlideIndex].id;
      handleSlideChange(slideId, stepSlideIndex);
    }
  }, [slideDeck.slides, handleSlideChange]);



  // Interaction handler
  const handleInteraction = useCallback((interaction: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[SlideBasedViewer] Interaction:', interaction);
    }
  }, []);

  // Hotspot state handlers
  const handleHotspotFocus = useCallback((hotspotId: string, slideIndex: number) => {
    setActiveHotspotId(hotspotId);
    // If hotspot is on different slide, navigate there
    if (slideIndex !== currentSlideIndex) {
      const slide = slideDeck.slides[slideIndex];
      if (slide) {
        handleSlideChange(slide.id, slideIndex);
      }
    }
  }, [currentSlideIndex, slideDeck.slides, handleSlideChange]);

  const handleHotspotComplete = useCallback((hotspotId: string) => {
    setCompletedHotspots(prev => new Set([...prev, hotspotId]));
    setActiveHotspotId(null);
  }, []);

  // Auto-progression handlers
  const handlePlay = useCallback(() => {
    setIsPlaying(true);
  }, []);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const handleSpeedChange = useCallback((speed: number) => {
    setPlaybackSpeed(speed);
  }, []);

  // Enhanced slide deck with viewer mode settings
  const enhancedSlideDeck = useMemo(() => ({
    ...slideDeck,
    settings: {
      ...slideDeck.settings,
      autoAdvance: moduleState === 'learning' && viewerModes.timed,
      allowNavigation: true,
      showProgress: moduleState === 'learning',
      showControls: true,
      keyboardShortcuts: true,
      touchGestures: deviceType === 'mobile',
      fullscreenMode: false
    }
  }), [slideDeck, moduleState, viewerModes, deviceType]);

  // Initial overlay when in idle state
  if (moduleState === 'idle') {
    return (
      <div className="w-screen h-screen flex flex-col bg-gradient-to-br from-slate-900 to-slate-800 relative">
        {/* Initial overlay */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 text-center">
            <h2 className="text-3xl font-bold text-slate-800 mb-6">ExpliCoLearning</h2>
            <p className="text-slate-600 mb-8">Choose how you'd like to experience this content:</p>
            
            <div className="space-y-4">
              {viewerModes.explore && (
                <button
                  onClick={handleStartExploring}
                  className="w-full px-6 py-4 bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-lg transition-colors duration-200 flex items-center justify-center gap-3"
                >
                  🔍 Explore Freely
                </button>
              )}
              
              {(viewerModes.selfPaced || viewerModes.timed) && (
                <button
                  onClick={handleStartLearning}
                  className="w-full px-6 py-4 bg-purple-500 hover:bg-purple-600 text-white font-semibold rounded-lg transition-colors duration-200 flex items-center justify-center gap-3"
                >
                  🎯 Guided Experience
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen flex flex-col bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Slide viewer content area - use flex-1 for proper sizing */}
      <div className="flex-1 overflow-auto">
        {(moduleState === 'learning' && (viewerModes.selfPaced || viewerModes.timed)) ? (
          <TimelineSlideViewer
            slideDeck={enhancedSlideDeck}
            viewerMode={viewerModes.timed ? 'auto-progression' : 'guided'}
            onSlideChange={handleSlideChange}
            onInteraction={handleInteraction}
            onClose={handleBackToMenu}
            className="w-full h-full"
          />
        ) : (
          <SlideViewer
            slideDeck={enhancedSlideDeck}
            initialSlideId={currentSlideId}
            onSlideChange={handleSlideChange}
            onInteraction={handleInteraction}
            className="w-full h-full"
            showTimeline={true}
          />
        )}
      </div>

      {/* Footer toolbar - use flex-none to ensure always visible */}
      <div className="flex-none">
        <ViewerFooterToolbar
          projectName={projectName}
          onBack={onClose}
          currentSlideIndex={currentSlideIndex}
          totalSlides={slideDeck.slides.length}
          onPreviousSlide={handlePreviousSlide}
          onNextSlide={handleNextSlide}
          canGoPrevious={currentSlideIndex > 0}
          canGoNext={currentSlideIndex < slideDeck.slides.length - 1}
          moduleState={moduleState === 'exploring' ? 'idle' : moduleState}
          onStartLearning={handleStartLearning}
          onStartExploring={handleStartExploring}
          hasContent={slideDeck.slides.length > 0}
          viewerModes={viewerModes}
          slides={slideDeck.slides}
          onSlideSelect={handleSlideSelect}
          showProgress={moduleState === 'learning'}
        />
      </div>
    </div>
  );
};

export default React.memo(SlideBasedViewer);