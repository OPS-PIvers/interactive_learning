import React from 'react';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import AuthButton from './AuthButton';
import { InteractiveSlide } from '../../shared/slideTypes';
import { Z_INDEX_TAILWIND } from '../utils/zIndexLevels';

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
  const showBackToMenuButton = moduleState !== 'idle';

  const modalRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (showShortcuts) {
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
            if (document.activeElement === firstElement) {
              lastElement.focus();
              e.preventDefault();
            }
          } else {
            if (document.activeElement === lastElement) {
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
        shortcutsButtonRef.current?.focus();
      };
    }
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
  
  const renderMobileLayout = () => (
    <div className={`bg-slate-800 border-t border-slate-700 text-white shadow-2xl ${Z_INDEX_TAILWIND.MOBILE_TOOLBAR}`}>
      <div 
        className="px-3 py-3 flex items-center justify-between landscape:py-1 landscape:min-h-0"
        style={{
          paddingBottom: `max(12px, env(safe-area-inset-bottom, 0px))`,
          minHeight: '56px'
        }}
      >
        {/* Left: Back button */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors rounded-lg p-2 hover:bg-slate-700 landscape:p-1"
          aria-label="Back to projects"
        >
          <ChevronLeftIcon className="w-5 h-5 landscape:w-4 landscape:h-4" />
        </button>
        
        {/* Center: Navigation + Status */}
        <div className="flex items-center gap-4 landscape:gap-2">
          {/* Timeline navigation when in learning mode */}
          {moduleState === 'learning' && (onPreviousSlide || onNextSlide || onPreviousStep || onNextStep) && (
            <div className="flex items-center gap-2 landscape:gap-1">
              <button
                onClick={onPreviousStep || onPreviousSlide}
                disabled={onPreviousStep ? !canGoPreviousStep : !canGoPrevious}
                className="p-2 text-white disabled:text-slate-500 hover:bg-slate-700 rounded-full transition-colors disabled:cursor-not-allowed landscape:p-1"
                aria-label={onPreviousStep ? "Previous step" : "Previous slide"}
                title={onPreviousStep ? "Previous step" : "Previous slide"}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              {/* Progress indicator */}
              <div className="flex flex-col items-center gap-1 text-center min-w-0 px-2 landscape:px-1" aria-live="polite">
                <div>
                  <div className="text-sm font-medium text-white landscape:text-xs">
                    {stepLabel || `${currentSlideIndex + 1}/${totalSlides}`}
                  </div>
                  {currentStep && totalSteps && (
                    <div className="text-xs text-slate-300 landscape:hidden">
                      Step {currentStep}/{totalSteps}
                    </div>
                  )}
                </div>
                {progressDots}
              </div>
              
              <button
                onClick={onNextStep || onNextSlide}
                disabled={onNextStep ? !canGoNextStep : !canGoNext}
                className="p-2 text-white disabled:text-slate-500 hover:bg-slate-700 rounded-full transition-colors disabled:cursor-not-allowed landscape:p-1"
                aria-label={onNextStep ? "Next step" : "Next slide"}
                title={onNextStep ? "Next step" : "Next slide"}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
          
          {/* Mode buttons when idle */}
          {moduleState === 'idle' && (
            <div className="flex items-center gap-2">
              {showExploreButton && (
                <button
                  onClick={onStartExploring}
                  disabled={!hasContent}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors disabled:cursor-not-allowed landscape:px-2 landscape:py-1 landscape:text-xs"
                >
                  Explore
                </button>
              )}
              
              {showTourButton && (
                <button
                  onClick={onStartLearning}
                  disabled={!hasContent}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors disabled:cursor-not-allowed landscape:px-2 landscape:py-1 landscape:text-xs"
                >
                  Tour
                </button>
              )}
            </div>
          )}
          
          {/* Back to menu when in learning/exploring mode */}
          {showBackToMenuButton && (
            <button
              onClick={onBack}
              className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors landscape:px-2 landscape:py-1 landscape:text-xs"
            >
              Menu
            </button>
          )}
        </div>
        
        {/* Right: Auth */}
        <div className="flex items-center">
          <AuthButton variant="compact" size="small" />
        </div>
      </div>
    </div>
  );
  
  const renderDesktopLayout = () => (
    <div className={`bg-slate-800 border-t border-slate-700 text-white shadow-2xl ${Z_INDEX_TAILWIND.NAVIGATION}`}>
      <div className="px-6 py-4 flex items-center justify-between">
        {/* Left: Back + Project Name */}
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors rounded-lg px-3 py-2 hover:bg-slate-700"
            aria-label="Back to projects"
          >
            <ChevronLeftIcon className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </button>
          
          <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 truncate max-w-xs">
            {projectName}
          </h1>
          <button
            ref={shortcutsButtonRef}
            onClick={() => setShowShortcuts(true)}
            className="text-slate-400 hover:text-white transition-colors"
            title="Keyboard shortcuts"
            aria-label="Show keyboard shortcuts"
            aria-haspopup="dialog"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
          </button>
        </div>
        
        {/* Center: Timeline Navigation */}
        {moduleState === 'learning' && (onPreviousSlide || onNextSlide || onPreviousStep || onNextStep) && (
          <div className="flex items-center gap-6">
            <button
              onClick={onPreviousStep || onPreviousSlide}
              disabled={onPreviousStep ? !canGoPreviousStep : !canGoPrevious}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-600 text-white rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              aria-label={onPreviousStep ? "Previous step" : "Previous slide"}
              title={onPreviousStep ? "Previous step" : "Previous slide"}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
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
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
        
        {/* Mode buttons when idle */}
        {moduleState === 'idle' && (
          <div className="flex items-center gap-4">
            {showExploreButton && (
              <button
                onClick={onStartExploring}
                disabled={!hasContent}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:cursor-not-allowed"
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
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M12 5.5V3a1 1 0 00-1-1H9a1 1 0 00-1 1v2.5" />
                </svg>
                <span>Guided Tour</span>
              </button>
            )}
          </div>
        )}
        
        {/* Back to menu when in learning/exploring mode */}
        {showBackToMenuButton && (
          <button
            onClick={onBack} 
            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <span>Back to Menu</span>
          </button>
        )}
        
        {/* Right: Auth */}
        <div className="flex items-center">
          <AuthButton variant="default" size="medium" />
        </div>
      </div>
      {showShortcuts && (
        <div
          ref={modalRef}
          className={`fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center ${Z_INDEX_TAILWIND.MODAL_BACKDROP}`}
          onClick={() => setShowShortcuts(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="shortcuts-title"
          tabIndex={-1}
        >
          <div
            className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 text-slate-200"
            onClick={e => e.stopPropagation()}
          >
            <h3 id="shortcuts-title" className="text-2xl font-bold text-white mb-6">Keyboard Shortcuts</h3>
            <ul className="space-y-3">
              <li className="flex justify-between items-center"><span className="font-semibold">Next Slide</span><kbd className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">Right Arrow</kbd></li>
              <li className="flex justify-between items-center"><span className="font-semibold">Previous Slide</span><kbd className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">Left Arrow</kbd></li>
              <li className="flex justify-between items-center"><span className="font-semibold">First Slide</span><kbd className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">Home</kbd></li>
              <li className="flex justify-between items-center"><span className="font-semibold">Last Slide</span><kbd className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">End</kbd></li>
              <li className="flex justify-between items-center"><span className="font-semibold">Close Effects</span><kbd className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">Esc</kbd></li>
            </ul>
            <button
              onClick={() => setShowShortcuts(false)}
              className="mt-8 w-full px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
  
  // Unified responsive layout using CSS breakpoints
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900/95 via-slate-800/90 to-transparent backdrop-blur-sm border-t border-slate-700/50 z-[9999]">
      {/* Timeline Progress */}
      {showProgress && slides && slides.length > 0 && (
        <div className="px-4 py-2 bg-slate-800/60">
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
      <div className="flex items-center justify-between px-4 py-3 min-h-[64px] md:min-h-[56px]">
        {/* Left Section */}
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors duration-200 px-2 py-1 rounded hover:bg-slate-700/50"
            title="Back to Dashboard"
            aria-label="Back to projects"
          >
            <ChevronLeftIcon className="w-4 h-4" />
            <span className="hidden sm:inline font-medium">Back</span>
          </button>
        </div>

        {/* Center Section - Navigation */}
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
              {currentSlideIndex + 1} / {totalSlides}
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

        {/* Right Section */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowShortcuts(true)}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all duration-200"
            title="Keyboard Shortcuts"
          >
            <span className="text-sm font-medium hidden sm:inline mr-1">Help</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
          </button>
        </div>
      </div>

      {/* Keyboard Shortcuts Modal */}
      {showShortcuts && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10000] flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-white mb-4">Keyboard Shortcuts</h3>
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