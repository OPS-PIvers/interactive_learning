import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { SlideDeck, SlideViewerState } from '../../shared/slideTypes';
import { ViewerModes } from '../../shared/interactiveTypes';
import { MigrationResult } from '../../shared/migrationUtils';
import { useIsMobile } from '../hooks/useIsMobile';
import { useDeviceDetection } from '../hooks/useDeviceDetection';
import { SlideViewer } from './slides/SlideViewer';
import TimelineSlideViewer from './slides/TimelineSlideViewer';
import ViewerToolbar from './ViewerToolbar';

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
  const [viewerState, setViewerState] = useState<'idle' | 'exploring' | 'learning'>('idle');
  const [hasUserChosenMode, setHasUserChosenMode] = useState(false);
  const [currentSlideId, setCurrentSlideId] = useState<string>(slideDeck.slides[0]?.id || '');

  // Auto-start functionality
  useEffect(() => {
    if (autoStart && !hasUserChosenMode) {
      // Determine the best mode to auto-start with
      if (viewerModes.selfPaced) {
        handleStartGuidedTour();
      } else if (viewerModes.explore) {
        handleExploreModule();
      }
    }
  }, [autoStart, hasUserChosenMode, viewerModes]);

  // Mode selection handlers
  const handleExploreModule = useCallback(() => {
    setViewerState('exploring');
    setHasUserChosenMode(true);
  }, []);

  const handleStartGuidedTour = useCallback(() => {
    setViewerState('learning');
    setHasUserChosenMode(true);
  }, []);

  const handleBackToMenu = useCallback(() => {
    setViewerState('idle');
    setHasUserChosenMode(false);
    setCurrentSlideId(slideDeck.slides[0]?.id || '');
  }, [slideDeck.slides]);

  // Slide change handler
  const handleSlideChange = useCallback((slideId: string, slideIndex: number) => {
    setCurrentSlideId(slideId);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[SlideBasedViewer] Slide changed:', {
        slideId,
        slideIndex,
        viewerState
      });
    }
  }, [viewerState]);

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

  // Render initial overlay for mode selection
  if (viewerState === 'idle' && !autoStart) {
    const showExploreButton = viewerModes.explore;
    const showGuidedButton = viewerModes.selfPaced || viewerModes.timed;
    
    return (
      <div className="w-screen h-screen flex flex-col bg-gradient-to-br from-slate-900 to-slate-800">
        {/* Header with project info */}
        <div className="bg-slate-800 border-b border-slate-700 text-white p-4 flex items-center justify-between shadow-2xl">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
              {projectName}
            </h1>
            {migrationResult && (
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-3 py-1 rounded-lg text-xs font-semibold text-white shadow-lg">
                SLIDE-BASED
              </div>
            )}
          </div>
          
          <ViewerToolbar
            projectName={projectName}
            onBack={onClose}
            moduleState={viewerState}
            onStartLearning={handleStartGuidedTour}
            onStartExploring={handleExploreModule} 
            hasContent={slideDeck.slides.length > 0}
            isMobile={isMobile}
            viewerModes={viewerModes}
          />
        </div>

        {/* Main content with mode selection */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-4">
              Interactive Learning Experience
            </h2>
            <p className="text-slate-300 mb-8 text-lg leading-relaxed">
              Choose how you'd like to experience this interactive content
            </p>
            
            {/* Migration info */}
            {migrationResult && (
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 mb-8">
                <h3 className="text-lg font-semibold text-white mb-4">Enhanced Slide Experience</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">{migrationResult.slideDeck.slides.length}</div>
                    <div className="text-slate-400">Interactive Slides</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-400">{migrationResult.elementsConverted}</div>
                    <div className="text-slate-400">Interactive Elements</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">{migrationResult.interactionsConverted}</div>
                    <div className="text-slate-400">Interactions</div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Mode selection buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {showExploreButton && (
                <button
                  className="slide-nav-button slide-nav-button-secondary px-8 py-4 text-lg"
                  onClick={handleExploreModule}
                >
                  🔍 Explore Freely
                </button>
              )}
              
              {showGuidedButton && (
                <button
                  className="slide-nav-button slide-nav-button-primary px-8 py-4 text-lg"
                  onClick={handleStartGuidedTour}
                >
                  🎯 Guided Experience
                </button>
              )}
            </div>
            
            {(!showExploreButton && !showGuidedButton) && (
              <div className="text-slate-400">
                No viewer modes are currently enabled for this project.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-800 border-t border-slate-700 text-slate-400 p-3 text-xs text-center">
          <span className="bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent font-semibold">
            Slide-Based Interactive Learning
          </span>
          <span className="mx-2">•</span>
          Modern Architecture
          <span className="mx-2">•</span>
          Enhanced Performance
        </div>
      </div>
    );
  }

  // Render active slide viewer
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
          <button
            className="slide-nav-button slide-nav-button-secondary text-sm"
            onClick={handleBackToMenu}
          >
            ← Back to Menu
          </button>
          <ViewerToolbar
            projectName={projectName}
            onBack={onClose}
            moduleState={viewerState}
            onStartLearning={handleStartGuidedTour}
            onStartExploring={handleExploreModule} 
            hasContent={slideDeck.slides.length > 0}
            isMobile={isMobile}
            viewerModes={viewerModes}
          />
        </div>
      </div>

      {/* Slide viewer - use timeline viewer for guided/timed modes */}
      <div className="flex-1 relative">
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
  );
};

export default SlideBasedViewer;