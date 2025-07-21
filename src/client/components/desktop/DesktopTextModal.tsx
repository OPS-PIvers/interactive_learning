import React from 'react';
import { TimelineEventData } from '../../../shared/types';
import Modal from '../Modal';

interface DesktopTextModalProps {
  event: TimelineEventData;
  onComplete: () => void;
  // Multi-modal navigation (within same step)
  showNavigation?: boolean;
  canGoNext?: boolean;
  canGoPrevious?: boolean;
  onNext?: () => void;
  onPrevious?: () => void;
  currentIndex?: number;
  totalCount?: number;
  // Timeline step navigation (between steps)
  showTimelineNavigation?: boolean;
  canGoToNextStep?: boolean;
  canGoToPrevStep?: boolean;
  onTimelineNext?: () => void;
  onTimelinePrevious?: () => void;
  currentStep?: number;
  totalSteps?: number;
  // Explore mode
  showExploreButton?: boolean;
  onExploreComplete?: () => void;
}

const DesktopTextModal: React.FC<DesktopTextModalProps> = ({ 
  event, 
  onComplete,
  // Multi-modal navigation
  showNavigation = false,
  canGoNext = false,
  canGoPrevious = false,
  onNext,
  onPrevious,
  currentIndex = 0,
  totalCount = 1,
  // Timeline navigation
  showTimelineNavigation = false,
  canGoToNextStep = false,
  canGoToPrevStep = false,
  onTimelineNext,
  onTimelinePrevious,
  currentStep = 1,
  totalSteps = 1,
  // Explore mode
  showExploreButton = false,
  onExploreComplete
}) => {

  const handleClose = () => {
    onComplete();
  };

  const title = event.title || event.text || 'Text Message';

  return (
    <Modal isOpen={true} onClose={handleClose} title={title}>
      <div className="space-y-6">
        {/* Main content */}
        <div className="text-gray-300 leading-relaxed">
          <div className="whitespace-pre-wrap">{event.text}</div>
        </div>

        {/* Navigation buttons */}
        <div className="flex flex-col gap-4">
          {/* Multi-modal navigation (within same step) */}
          {showNavigation && (
            <div className="flex justify-between items-center">
              <button
                onClick={onPrevious}
                disabled={!canGoPrevious}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  canGoPrevious
                    ? 'bg-slate-700 hover:bg-slate-600 text-white'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                Previous
              </button>
              
              <span className="text-slate-400 text-sm">
                {currentIndex + 1} of {totalCount}
              </span>
              
              <button
                onClick={onNext}
                disabled={!canGoNext}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  canGoNext
                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                Next
              </button>
            </div>
          )}

          {/* Timeline navigation (between steps) */}
          {showTimelineNavigation && (
            <div className="flex justify-between items-center">
              <button
                onClick={onTimelinePrevious}
                disabled={!canGoToPrevStep}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  canGoToPrevStep
                    ? 'bg-slate-700 hover:bg-slate-600 text-white'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                Previous Step
              </button>
              
              <span className="text-slate-400 text-sm">
                Step {currentStep} of {totalSteps}
              </span>
              
              <button
                onClick={onTimelineNext}
                disabled={!canGoToNextStep}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  canGoToNextStep
                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                Next Step
              </button>
            </div>
          )}

          {/* Explore mode completion */}
          {showExploreButton && (
            <div className="flex justify-center">
              <button
                onClick={onExploreComplete}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
              >
                Complete Exploration
              </button>
            </div>
          )}

          {/* Default close button when no special navigation is needed */}
          {!showNavigation && !showTimelineNavigation && !showExploreButton && (
            <div className="flex justify-end">
              <button
                onClick={handleClose}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default DesktopTextModal;