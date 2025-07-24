import React from 'react';
import { InteractiveSlide, DeviceType } from '../../../shared/slideTypes';

interface SlideNavigationProps {
  currentSlideIndex: number;
  totalSlides: number;
  onPrevious: () => void;
  onNext: () => void;
  onSlideSelect: (slideId: string) => void;
  slides: InteractiveSlide[];
  showProgress: boolean;
  deviceType: DeviceType;
}

/**
 * SlideNavigation - Navigation controls for slide viewer
 */
export const SlideNavigation: React.FC<SlideNavigationProps> = ({
  currentSlideIndex,
  totalSlides,
  onPrevious,
  onNext,
  onSlideSelect,
  slides,
  showProgress,
  deviceType
}) => {
  const isMobile = deviceType === 'mobile';

  if (isMobile) {
    return (
      <div className="slide-navigation-mobile absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20">
        {/* Progress dots - Matches app accent colors */}
        {showProgress && (
          <div className="flex space-x-2 mb-4">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                className={`w-3 h-3 rounded-full transition-all duration-200 ${
                  index === currentSlideIndex 
                    ? 'bg-gradient-to-r from-purple-500 to-pink-600 shadow-lg' 
                    : 'bg-slate-700 border border-slate-600 hover:bg-slate-600'
                }`}
                onClick={() => onSlideSelect(slide.id)}
                aria-label={`Go to slide ${index + 1}: ${slide.title}`}
              />
            ))}
          </div>
        )}

        {/* Navigation buttons - Matches app button styling */}
        <div className="flex space-x-3">
          <button
            className="bg-slate-800 border border-slate-700 text-white p-3 rounded-xl disabled:opacity-50 
                     hover:bg-slate-700 shadow-2xl transition-all duration-200 hover:scale-105"
            onClick={onPrevious}
            disabled={currentSlideIndex === 0}
            aria-label="Previous slide"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="bg-slate-800 border border-slate-700 text-white px-4 py-3 rounded-xl text-sm font-semibold shadow-2xl">
            {currentSlideIndex + 1} / {totalSlides}
          </div>

          <button
            className="bg-slate-800 border border-slate-700 text-white p-3 rounded-xl disabled:opacity-50
                     hover:bg-slate-700 shadow-2xl transition-all duration-200 hover:scale-105"
            onClick={onNext}
            disabled={currentSlideIndex === totalSlides - 1}
            aria-label="Next slide"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="slide-navigation-desktop absolute bottom-6 left-0 right-0 z-20">
      <div className="max-w-4xl mx-auto px-6">
        <div className="flex items-center justify-between bg-slate-800 border border-slate-700 rounded-xl p-4 shadow-2xl backdrop-blur-sm">
          {/* Previous button - Matches app button styling */}
          <button
            className="flex items-center space-x-2 text-white hover:text-purple-400 disabled:opacity-50 disabled:cursor-not-allowed
                     transition-all duration-200 px-3 py-2 rounded-lg hover:bg-slate-700"
            onClick={onPrevious}
            disabled={currentSlideIndex === 0}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-semibold">Previous</span>
          </button>

          {/* Progress and slide selector - Matches app styling */}
          <div className="flex items-center space-x-4">
            {showProgress && (
              <div className="flex space-x-2">
                {slides.map((slide, index) => (
                  <button
                    key={slide.id}
                    className={`w-3 h-3 rounded-full transition-all duration-200 ${
                      index === currentSlideIndex 
                        ? 'bg-gradient-to-r from-purple-500 to-pink-600 shadow-lg' 
                        : 'bg-slate-600 border border-slate-500 hover:bg-slate-500'
                    }`}
                    onClick={() => onSlideSelect(slide.id)}
                    title={slide.title || `Slide ${index + 1}`}
                  />
                ))}
              </div>
            )}

            <div className="text-white text-sm font-semibold bg-slate-700 px-3 py-1 rounded-lg">
              {currentSlideIndex + 1} of {totalSlides}
            </div>
          </div>

          {/* Next button - Matches app button styling */}
          <button
            className="flex items-center space-x-2 text-white hover:text-purple-400 disabled:opacity-50 disabled:cursor-not-allowed
                     transition-all duration-200 px-3 py-2 rounded-lg hover:bg-slate-700"
            onClick={onNext}
            disabled={currentSlideIndex === totalSlides - 1}
          >
            <span className="font-semibold">Next</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SlideNavigation;