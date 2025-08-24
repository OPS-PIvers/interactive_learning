import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ViewerModes } from '../../../shared/slideTypes';
import { SlideDeck, ElementInteraction } from '../../../shared/slideTypes';
import { useViewportHeight } from '../../hooks/useViewportHeight';
import { Z_INDEX_TAILWIND } from '../../utils/zIndexLevels';
import InteractionOverlay from '../overlays/InteractionOverlay';
import { SlideViewer } from '../slides/SlideViewer';
import TimelineSlideViewer from '../slides/TimelineSlideViewer';
import ViewerFooterToolbar from '../toolbars/ViewerFooterToolbar';

interface SlideBasedViewerProps {
  slideDeck: SlideDeck;
  projectName: string;
  viewerModes: ViewerModes;
  autoStart?: boolean;
  onClose: () => void;
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
}) => {
  useViewportHeight();

  // Viewer state
  const [moduleState, setModuleState] = useState<'idle' | 'exploring' | 'learning'>('idle');
  const [currentSlideId, setCurrentSlideId] = useState<string>(
    slideDeck.slides && slideDeck.slides.length > 0 ? slideDeck.slides[0]?.id || '' : ''
  );
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [activeInteractions, setActiveInteractions] = useState<ElementInteraction[]>([]);

  // Navigation handlers for footer toolbar
  const handlePreviousSlide = useCallback(() => {
    if (currentSlideIndex > 0) {
      const prevIndex = currentSlideIndex - 1;
      setCurrentSlideIndex(prevIndex);
      setCurrentSlideId(
        prevIndex < slideDeck.slides.length ? slideDeck.slides[prevIndex]?.id || '' : ''
      );
    }
  }, [currentSlideIndex, slideDeck.slides]);

  const handleNextSlide = useCallback(() => {
    if (currentSlideIndex < slideDeck.slides.length - 1) {
      const nextIndex = currentSlideIndex + 1;
      setCurrentSlideIndex(nextIndex);
      setCurrentSlideId(
        nextIndex < slideDeck.slides.length ? slideDeck.slides[nextIndex]?.id || '' : ''
      );
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
  }, []);

  const handleSlideSelect = useCallback((slideId: string) => {
    const slideIndex = slideDeck.slides.findIndex((s) => s.id === slideId);
    if (slideIndex !== -1) {
      handleSlideChange(slideId, slideIndex);
    }
  }, [slideDeck.slides, handleSlideChange]);

  // Interaction handler
  const handleInteraction = useCallback((interaction: ElementInteraction) => {
    if (interaction.effect.type === 'text') {
      setActiveInteractions((prev) => [...prev, interaction]);
    }
  }, []);

  const handleCloseInteraction = useCallback((interactionId: string) => {
    setActiveInteractions((prev) => prev.filter((i) => i.id !== interactionId));
  }, []);

  // Centralized keyboard navigation for Home/End
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (slideDeck.slides.length === 0) return;

      // Ensure we're not inside an input field
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          handlePreviousSlide();
          break;
        case 'ArrowRight':
          event.preventDefault();
          handleNextSlide();
          break;
        case 'Home':
          event.preventDefault();
          if (slideDeck.slides && slideDeck.slides.length > 0) {
            handleSlideSelect(slideDeck.slides[0]?.id || '');
          }
          break;
        case 'End':
          event.preventDefault();
          if (slideDeck.slides && slideDeck.slides.length > 0) {
            handleSlideSelect(slideDeck.slides[slideDeck.slides.length - 1]?.id || '');
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [slideDeck.slides, handleSlideSelect, handlePreviousSlide, handleNextSlide]);

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
      touchGestures: true,
      fullscreenMode: false
    }
  }), [slideDeck, moduleState, viewerModes]);

  // Initial overlay when in idle state
  if (moduleState === 'idle') {
    return (
      <div data-testid="slide-based-viewer" className="w-screen h-[calc(var(--vh,1vh)*100)] flex flex-col bg-gradient-to-br from-slate-900 to-slate-800 relative">
        {/* Initial overlay */}
        <div className={`absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center ${Z_INDEX_TAILWIND.MODAL_CONTENT}`}>
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 text-center">
            <h2 className="text-3xl font-bold text-slate-800 mb-6">ExpliCoLearning</h2>
            <p className="text-slate-600 mb-8">Choose how you&apos;d like to experience this content:</p>
            
            <div className="space-y-4">
              {viewerModes.explore &&
              <button
                onClick={handleStartExploring}
                className="w-full px-6 py-4 bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-3 active:scale-95 transform">

                  🔍 Explore Freely
                </button>
              }
              
              {(viewerModes.selfPaced || viewerModes.timed) &&
              <button
                onClick={handleStartLearning}
                className="w-full px-6 py-4 bg-purple-500 hover:bg-purple-600 text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-3 active:scale-95 transform">

                  🎯 Guided Experience
                </button>
              }
            </div>
          </div>
        </div>
      </div>);

  }

  return (
    <div data-testid="slide-based-viewer" className="w-screen h-[calc(var(--vh,1vh)*100)] flex flex-col bg-gradient-to-br from-slate-900 to-slate-800 relative">
      <InteractionOverlay interactions={activeInteractions} onClose={handleCloseInteraction} />
      {/* Slide viewer content area - use flex-1 for proper sizing */}
      <div className="flex-1 overflow-auto">
        {moduleState === 'learning' && (viewerModes.selfPaced || viewerModes.timed) ?
        <TimelineSlideViewer
          slideDeck={enhancedSlideDeck}
          viewerMode={viewerModes.timed ? 'auto-progression' : 'guided'}
          onSlideChange={handleSlideChange}
          onInteraction={handleInteraction}
          onClose={handleBackToMenu}
          className="w-full h-full" /> :


        <SlideViewer
          slideDeck={enhancedSlideDeck}
          initialSlideId={currentSlideId}
          onSlideChange={handleSlideChange}
          onInteraction={handleInteraction}
          className="w-full h-full"
          showTimeline={true} />

        }
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
          moduleState={moduleState}
          onStartLearning={handleStartLearning}
          onStartExploring={handleStartExploring}
          hasContent={slideDeck.slides.length > 0}
          viewerModes={viewerModes}
          slides={slideDeck.slides}
          onSlideSelect={handleSlideSelect}
          showProgress={moduleState === 'learning'} />

      </div>
    </div>);

};

export default React.memo(SlideBasedViewer);