import React from 'react';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import AuthButton from './AuthButton';
import { InteractiveSlide } from '../../shared/slideTypes';

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
  
  // Responsive
  isMobile?: boolean;
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
  isMobile = false,
  slides,
  onSlideSelect,
  showProgress = false,
}) => {
  
  // Determine what buttons to show based on viewer modes
  const showExploreButton = viewerModes.explore && moduleState === 'idle';
  const showTourButton = (viewerModes.selfPaced || viewerModes.timed) && moduleState === 'idle';
  const showBackToMenuButton = moduleState !== 'idle';

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
    <div className="bg-slate-800 border-t border-slate-700 text-white shadow-2xl">
      <div 
        className="px-3 py-3 flex items-center justify-between"
        style={{
          paddingBottom: `max(12px, env(safe-area-inset-bottom, 0px))`,
          minHeight: '56px'
        }}
      >
        {/* Left: Back button */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors rounded-lg p-2 hover:bg-slate-700"
          aria-label="Back to projects"
        >
          <ChevronLeftIcon className="w-5 h-5" />
        </button>
        
        {/* Center: Navigation + Status */}
        <div className="flex items-center gap-4">
          {/* Timeline navigation when in learning mode */}
          {moduleState === 'learning' && (onPreviousSlide || onNextSlide || onPreviousStep || onNextStep) && (
            <div className="flex items-center gap-2">
              <button
                onClick={onPreviousStep || onPreviousSlide}
                disabled={onPreviousStep ? !canGoPreviousStep : !canGoPrevious}
                className="p-2 text-white disabled:text-slate-500 hover:bg-slate-700 rounded-full transition-colors disabled:cursor-not-allowed"
                title={onPreviousStep ? "Previous step" : "Previous slide"}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              {/* Progress indicator */}
              <div className="flex flex-col items-center gap-1 text-center min-w-0 px-2">
                <div>
                  <div className="text-sm font-medium text-white">
                    {stepLabel || `${currentSlideIndex + 1}/${totalSlides}`}
                  </div>
                  {currentStep && totalSteps && (
                    <div className="text-xs text-slate-300">
                      Step {currentStep}/{totalSlides}
                    </div>
                  )}
                </div>
                {progressDots}
              </div>
              
              <button
                onClick={onNextStep || onNextSlide}
                disabled={onNextStep ? !canGoNextStep : !canGoNext}
                className="p-2 text-white disabled:text-slate-500 hover:bg-slate-700 rounded-full transition-colors disabled:cursor-not-allowed"
                title={onNextStep ? "Next step" : "Next slide"}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors disabled:cursor-not-allowed"
                >
                  Explore
                </button>
              )}
              
              {showTourButton && (
                <button
                  onClick={onStartLearning}
                  disabled={!hasContent}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors disabled:cursor-not-allowed"
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
              className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors"
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
    <div className="bg-slate-800 border-t border-slate-700 text-white shadow-2xl">
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
        </div>
        
        {/* Center: Timeline Navigation */}
        {moduleState === 'learning' && (onPreviousSlide || onNextSlide || onPreviousStep || onNextStep) && (
          <div className="flex items-center gap-6">
            <button
              onClick={onPreviousStep || onPreviousSlide}
              disabled={onPreviousStep ? !canGoPreviousStep : !canGoPrevious}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-600 text-white rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              title={onPreviousStep ? "Previous step" : "Previous slide"}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm font-medium">Previous</span>
            </button>
            
            {/* Progress indicator */}
            <div className="flex flex-col items-center gap-3">
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
              title={onNextStep ? "Next step" : "Next slide"}
            >
              <span className="text-sm font-medium">Next</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
    </div>
  );
  
  return isMobile ? renderMobileLayout() : renderDesktopLayout();
};

export default ViewerFooterToolbar;