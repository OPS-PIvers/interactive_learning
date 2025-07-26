import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { SlideDeck, SlideViewerState } from '../../shared/slideTypes';
import { ViewerModes } from '../../shared/interactiveTypes';
import { MigrationResult } from '../../shared/migrationUtils';
import { useIsMobile } from '../hooks/useIsMobile';
import { useDeviceDetection } from '../hooks/useDeviceDetection';
import { SlideViewer } from './slides/SlideViewer';
import TimelineSlideViewer from './slides/TimelineSlideViewer';
import ViewerToolbar from './ViewerToolbar';
import HeaderTimeline from './HeaderTimeline';

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
  const isMobile = useIsMobile();
  const { deviceType } = useDeviceDetection();
  
  // Viewer state
  const [viewerState, setViewerState] = useState<'exploring' | 'learning'>('exploring');
  const [currentSlideId, setCurrentSlideId] = useState<string>(slideDeck.slides[0]?.id || '');
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [activeHotspotId, setActiveHotspotId] = useState<string | null>(null);
  const [completedHotspots, setCompletedHotspots] = useState<Set<string>>(new Set());

  // Auto-start functionality
  useEffect(() => {
    if (autoStart) {
      if (viewerModes.selfPaced) {
        setViewerState('learning');
      } else {
        setViewerState('exploring');
      }
    }
  }, [autoStart, viewerModes]);

  const handleToggleMode = useCallback(() => {
    setViewerState(prev => prev === 'learning' ? 'exploring' : 'learning');
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
        viewerState
      });
    }
  }, [viewerState]);

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

  // Enhanced slide deck with viewer mode settings
  const enhancedSlideDeck = useMemo(() => ({
    ...slideDeck,
    settings: {
      ...slideDeck.settings,
      autoAdvance: viewerState === 'learning' && viewerModes.timed,
      allowNavigation: true,
      showProgress: viewerState === 'learning',
      showControls: true,
      keyboardShortcuts: true,
      touchGestures: isMobile,
      fullscreenMode: false
    }
  }), [slideDeck, viewerState, viewerModes, isMobile]);

  // No more 'idle' state, viewer is always active

  return (
    <div className={`w-screen h-screen flex flex-col bg-gradient-to-br from-slate-900 to-slate-800 ${!isMobile ? 'pt-16' : ''}`}>
      {/* Toolbar */}
      <ViewerToolbar
        projectName={projectName}
        onBack={onClose}
        moduleState={viewerState === 'exploring' ? 'idle' : viewerState}
        onStartLearning={() => setViewerState('learning')}
        onStartExploring={() => setViewerState('exploring')}
        hasContent={slideDeck.slides.length > 0}
        isMobile={isMobile}
        viewerModes={viewerModes}
      />

      {/* Persistent Timeline */}
      <HeaderTimeline
        slideDeck={enhancedSlideDeck}
        currentSlideIndex={currentSlideIndex}
        onSlideChange={handleSlideChange}
        viewerMode={viewerState === 'learning' && viewerModes.timed ? 'auto-progression' : 
                    viewerState === 'learning' ? 'guided' : 'explore'}
        activeHotspotId={activeHotspotId}
        completedHotspots={completedHotspots}
        onHotspotFocus={handleHotspotFocus}
        className="shadow-lg"
      />

      {/* Slide viewer - use timeline viewer for guided/timed modes */}
      <div className="flex-1 flex flex-col relative">
        <div className="flex-1">
          {(viewerState === 'learning' && (viewerModes.selfPaced || viewerModes.timed)) ? (
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
            />
          )}
        </div>

      </div>
    </div>
  );
};

export default SlideBasedViewer;