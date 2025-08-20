import React from 'react';
import { InteractiveSlide } from '../../shared/slideTypes';
import { Z_INDEX_TAILWIND } from '../utils/zIndexLevels';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import '../styles/slide-components.css';

interface ViewerFooterToolbarProps {
  // Project info
  projectName: string;
  onBack: () => void;
  
  // Timeline navigation
  currentSlideIndex: number;
  totalSlides: number;
  onPreviousSlide?: () => void;
  onNextSlide?: () => void;
  canGoPrevious?: boolean;
  canGoNext?: boolean;
  
  // Slide selection for progress dots
  slides?: InteractiveSlide[];
  onSlideSelect?: (slideId: string) => void;
  showProgress?: boolean;

  // Timeline step info
  currentStep?: number;
  totalSteps?: number;
  stepLabel?: string;
  onPreviousStep?: () => void;
  onNextStep?: () => void;
  canGoPreviousStep?: boolean;
  canGoNextStep?: boolean;
  
  // Viewer mode controls
  moduleState: 'idle' | 'learning' | 'exploring';
  onStartLearning: () => void;
  onStartExploring: () => void;
  hasContent: boolean;
  
  // Mode configuration
  viewerModes?: {
    explore?: boolean;
    selfPaced?: boolean;
    timed?: boolean;
  };
  
  // Responsive design uses CSS breakpoints only
}

export const ViewerFooterToolbar: React.FC<ViewerFooterToolbarProps> = ({
  projectName,
  onBack,
  currentSlideIndex,
  totalSlides,
  onPreviousSlide,
  onNextSlide,
  canGoPrevious = true,
  canGoNext = true,
  currentStep,
  totalSteps,
  stepLabel,
  onPreviousStep,
  onNextStep,
  canGoPreviousStep = true,
  canGoNextStep = true,
  moduleState,
  onStartLearning,
  onStartExploring,
  hasContent,
  viewerModes = { explore: true, selfPaced: true, timed: true },
  slides,
  onSlideSelect,
  showProgress = false,
}) => {
  const [showShortcuts, setShowShortcuts] = React.useState(false);
  const shortcutsButtonRef = React.useRef<HTMLButtonElement>(null);
  
  // Determine what buttons to show based on viewer modes
  const showExploreButton = viewerModes.explore && moduleState === 'idle';
  const showTourButton = (viewerModes.selfPaced || viewerModes.timed) && moduleState === 'idle';

  const modalRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (showShortcuts) {
      const buttonRef = shortcutsButtonRef.current;
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setShowShortcuts(false);
          return;
        }

        if (e.key === 'Tab') {
          const focusableElements = modalRef.current?.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (!focusableElements || focusableElements.length === 0) return;

          const firstElement = focusableElements[0];
          const lastElement = focusableElements[focusableElements.length - 1];

          if (e.shiftKey) {
            if (document.activeElement === firstElement && lastElement) {
              lastElement.focus();
              e.preventDefault();
            }
          } else {
            if (document.activeElement === lastElement && firstElement) {
              firstElement.focus();
              e.preventDefault();
            }
          }
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      modalRef.current?.focus();

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        buttonRef?.focus();
      };
    }
    return undefined;
  }, [showShortcuts]);

  const progressDots = React.useMemo(() => {
    if (!showProgress || !slides || !onSlideSelect) {
      return null;
    }

    return (
      <div className="flex items-center gap-2">
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${
              index === currentSlideIndex
                ? 'bg-gradient-to-r from-purple-400 to-pink-500 shadow-lg scale-110'
                : 'bg-slate-600 hover:bg-slate-500'
            }`}
            onClick={() => onSlideSelect(slide.id)}
            aria-label={`Go to slide ${index + 1}: ${slide.title || ''}`}
            title={slide.title || `Slide ${index + 1}`}
          />
        ))}
      </div>
    );
  }, [showProgress, slides, onSlideSelect, currentSlideIndex]);
  
  
  
  // Unified responsive layout using CSS breakpoints
  return (
    <div className={`viewer-footer-toolbar fixed bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900/95 via-slate-800/90 to-transparent backdrop-blur-sm border-t border-slate-700/50 transform transition-transform duration-300 ease-in-out ${Z_INDEX_TAILWIND.TOOLBAR}`}>
      {/* Timeline Progress */}
      {showProgress && slides && slides.length > 0 && (
        <div className="timeline-progress px-4 py-2 bg-slate-800/60">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-slate-300 font-medium">Progress</span>
            <span className="text-xs text-slate-400">
              {currentSlideIndex + 1} of {totalSlides}
            </span>
          </div>
          <div className="w-full bg-slate-700/50 rounded-full h-1.5">
            <div 
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${((currentSlideIndex + 1) / totalSlides) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Main Toolbar */}
      <div className="toolbar-main flex items-center justify-between px-4 py-3 min-h-[64px] md:min-h-[56px]">
        {/* Left Section */}
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors duration-200 px-2 py-1 rounded hover:bg-slate-700/50"
            title="Back to projects"
            aria-label="Back to projects"
          >
            <ChevronLeftIcon className="w-4 h-4" />
            <span className="hidden sm:inline font-medium">Back</span>
          </button>
        </div>

        {/* Center Section - Navigation */}
        {moduleState === 'learning' && (onPreviousSlide || onNextSlide || onPreviousStep || onNextStep) ? (
          <div className="flex items-center gap-6">
            <button
              onClick={onPreviousStep || onPreviousSlide}
              disabled={onPreviousStep ? !canGoPreviousStep : !canGoPrevious}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-600 text-white rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              aria-label={onPreviousStep ? "Previous step" : "Previous slide"}
              title={onPreviousStep ? "Previous step" : "Previous slide"}
            >
              <ChevronLeftIcon className="w-4 h-4" />
              <span className="text-sm font-medium">Previous</span>
            </button>
            
            {/* Progress indicator */}
            <div className="flex flex-col items-center gap-3" aria-live="polite">
              {progressDots}
              <div className="text-center">
                <div className="text-sm font-semibold text-white">
                  {stepLabel || `Slide ${currentSlideIndex + 1} of ${totalSlides}`}
                </div>
                {currentStep && totalSteps && (
                  <div className="text-xs text-slate-300">
                    Step {currentStep} of {totalSteps}
                  </div>
                )}
              </div>
            </div>
            
            <button
              onClick={onNextStep || onNextSlide}
              disabled={onNextStep ? !canGoNextStep : !canGoNext}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-600 text-white rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              aria-label={onNextStep ? "Next step" : "Next slide"}
              title={onNextStep ? "Next step" : "Next slide"}
            >
              <span className="text-sm font-medium">Next</span>
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>
        ) : moduleState === 'idle' ? (
          <div className="flex items-center gap-4">
            <div className="text-center px-3">
              <div className="text-white font-semibold text-sm">
                {currentSlideIndex + 1}/{totalSlides}
              </div>
              <div className="text-slate-400 text-xs truncate max-w-32 sm:max-w-48 md:max-w-64">
                {projectName}
              </div>
            </div>
            
            {showExploreButton && (
              <button
                onClick={onStartExploring}
                disabled={!hasContent}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:cursor-not-allowed"
                aria-label="Explore Mode"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>Explore Mode</span>
              </button>
            )}
            
            {showTourButton && (
              <button
                onClick={onStartLearning}
                disabled={!hasContent}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:cursor-not-allowed"
                aria-label="Guided Tour"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M12 5.5V3a1 1 0 00-1-1H9a1 1 0 00-1 1v2.5" />
                </svg>
                <span>Guided Tour</span>
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <button
              onClick={onPreviousSlide}
              disabled={!canGoPrevious}
              className="p-2 rounded-lg bg-slate-700/50 text-slate-300 hover:text-white hover:bg-slate-600/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              title="Previous Slide (←)"
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </button>

            <div className="text-center px-3">
              <div className="text-white font-semibold text-sm">
                {currentSlideIndex + 1}/{totalSlides}
              </div>
              <div className="text-slate-400 text-xs truncate max-w-32 sm:max-w-48 md:max-w-64">
                {projectName}
              </div>
            </div>

            <button
              onClick={onNextSlide}
              disabled={!canGoNext}
              className="p-2 rounded-lg bg-slate-700/50 text-slate-300 hover:text-white hover:bg-slate-600/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              title="Next Slide (→)"
            >
              <ChevronRightIcon className="w-4 h-4" />
            </button>

          </div>
        )}

        {/* Right Section */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowShortcuts(true)}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all duration-200"
            title="Show keyboard shortcuts"
            aria-label="Show keyboard shortcuts"
            aria-haspopup="dialog"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zM12 17.25h.008v.008H12v-.008z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Keyboard Shortcuts Modal */}
      {showShortcuts && (
        <div className={`fixed inset-0 bg-black/50 backdrop-blur-sm ${Z_INDEX_TAILWIND.SYSTEM_MODAL} flex items-center justify-center p-4`}>
          <div 
            className="bg-slate-800 rounded-lg border border-slate-700 p-6 max-w-md w-full max-h-[80vh] overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby="shortcuts-title"
          >
            <h3 id="shortcuts-title" className="text-lg font-semibold text-white mb-4">Keyboard Shortcuts</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Previous Slide</span>
                <kbd className="bg-slate-700 text-slate-200 px-2 py-1 rounded text-sm">←</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Next Slide</span>
                <kbd className="bg-slate-700 text-slate-200 px-2 py-1 rounded text-sm">→</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-300">First Slide</span>
                <kbd className="bg-slate-700 text-slate-200 px-2 py-1 rounded text-sm">Home</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Last Slide</span>
                <kbd className="bg-slate-700 text-slate-200 px-2 py-1 rounded text-sm">End</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Close Help</span>
                <kbd className="bg-slate-700 text-slate-200 px-2 py-1 rounded text-sm">Esc</kbd>
              </div>
            </div>
            <button
              onClick={() => setShowShortcuts(false)}
              className="mt-6 w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewerFooterToolbar;