import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { SlideDeck, SlideViewerState } from '../../shared/slideTypes';
import { ViewerModes } from '../../shared/interactiveTypes';
import { MigrationResult } from '../../shared/migrationUtils';
import { useIsMobile } from '../hooks/useIsMobile';
import { useDeviceDetection } from '../hooks/useDeviceDetection';
import { SlideViewer } from './slides/SlideViewer';
import TimelineSlideViewer from './slides/TimelineSlideViewer';
import ViewerToolbar from './ViewerToolbar';
import SlideTimelineAdapter from './SlideTimelineAdapter';
import TimelineProgressTracker from './TimelineProgressTracker';

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
  const [showTimeline, setShowTimeline] = useState(false);
  const [showProgressTracker, setShowProgressTracker] = useState(false);

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

  // Timeline visibility toggle
  const handleToggleTimeline = useCallback(() => {
    setShowTimeline(prev => !prev);
  }, []);

  // Progress tracker toggle
  const handleToggleProgressTracker = useCallback(() => {
    setShowProgressTracker(prev => !prev);
  }, []);

  // Progress tracker slide navigation
  const handleProgressTrackerSlideChange = useCallback((slideIndex: number) => {
    if (slideIndex >= 0 && slideIndex < slideDeck.slides.length) {
      const slideId = slideDeck.slides[slideIndex].id;
      setCurrentSlideId(slideId);
      setCurrentSlideIndex(slideIndex);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('[SlideBasedViewer] Progress tracker navigation:', {
          slideId,
          slideIndex
        });
      }
    }
  }, [slideDeck.slides]);

  // Interaction handler
  const handleInteraction = useCallback((interaction: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[SlideBasedViewer] Interaction:', interaction);
    }
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
    <div className="w-screen h-screen flex flex-col bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 text-white p-4 flex items-center justify-between shadow-2xl">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
            {projectName}
          </h1>
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-3 py-1 rounded-lg text-xs font-semibold text-white shadow-lg">
            {viewerState === 'learning' ? 'GUIDED MODE' : 'EXPLORE MODE'}
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Progress Tracker Toggle */}
          <button
            className={`slide-nav-button text-sm transition-colors ${
              showProgressTracker 
                ? 'slide-nav-button-primary' 
                : 'slide-nav-button-secondary'
            }`}
            onClick={handleToggleProgressTracker}
            title={`${showProgressTracker ? 'Hide' : 'Show'} Auto-Progression`}
          >
            🎬 Auto-Play
          </button>
          
          {/* Timeline Toggle */}
          <button
            className={`slide-nav-button text-sm transition-colors ${
              showTimeline 
                ? 'slide-nav-button-primary' 
                : 'slide-nav-button-secondary'
            }`}
            onClick={handleToggleTimeline}
            title={`${showTimeline ? 'Hide' : 'Show'} Timeline`}
          >
            ⏱️ Timeline
          </button>
          
          <button
            className="slide-nav-button slide-nav-button-secondary text-sm"
            onClick={onClose}
          >
            ← Close Viewer
          </button>
          <ViewerToolbar
            projectName={projectName}
            onBack={onClose}
            moduleState={viewerState}
            onStartLearning={handleToggleMode}
            onStartExploring={handleToggleMode}
            hasContent={slideDeck.slides.length > 0}
            isMobile={isMobile}
            viewerModes={viewerModes}
          />
        </div>
      </div>

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

        {/* Progress Tracker - visible when enabled */}
        {showProgressTracker && (
          <div className="border-t border-slate-700 bg-slate-800/50">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm text-slate-300 font-medium">
                  Timeline Auto-Progression
                </div>
                <div className="text-xs text-slate-400">
                  Interactive Timeline Experience
                </div>
              </div>
              
              <TimelineProgressTracker
                slideDeck={slideDeck}
                currentSlideIndex={currentSlideIndex}
                onSlideChange={handleProgressTrackerSlideChange}
                isAutoProgression={viewerModes.timed || false}
                autoProgressionDelay={3000}
                className="w-full"
              />
            </div>
          </div>
        )}

        {/* Timeline Navigation - visible when enabled */}
        {showTimeline && (
          <div className="border-t border-slate-700 bg-slate-800/50">
            <div className="p-2">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-slate-300 font-medium">
                  Interactive Timeline Navigation
                </div>
                <div className="text-xs text-slate-400">
                  Step {currentSlideIndex + 1} of {slideDeck.slides.length}
                </div>
              </div>
              
              <SlideTimelineAdapter
                slideDeck={slideDeck}
                currentSlideIndex={currentSlideIndex}
                onSlideDeckChange={() => {}} // Read-only in viewer mode
                onStepSelect={handleTimelineStepSelect}
                isEditing={false}
                showPreviews={true}
                moduleState={viewerState}
                isMobile={isMobile}
                className="timeline-viewer-mode"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SlideBasedViewer;