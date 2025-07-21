import React from 'react';
import { TimelineEventData } from '../../../shared/types';
import Modal from '../Modal';

interface DesktopAudioModalProps {
  event: TimelineEventData;
  onComplete: () => void;
  showNavigation?: boolean;
  canGoNext?: boolean;
  canGoPrevious?: boolean;
  onNext?: () => void;
  onPrevious?: () => void;
  currentIndex?: number;
  totalCount?: number;
  showTimelineNavigation?: boolean;
  canGoToNextStep?: boolean;
  canGoToPrevStep?: boolean;
  onTimelineNext?: () => void;
  onTimelinePrevious?: () => void;
  currentStep?: number;
  totalSteps?: number;
  showExploreButton?: boolean;
  onExploreComplete?: () => void;
}

const DesktopAudioModal: React.FC<DesktopAudioModalProps> = ({ 
  event, 
  onComplete,
  showNavigation = false,
  canGoNext = false,
  canGoPrevious = false,
  onNext,
  onPrevious,
  currentIndex = 0,
  totalCount = 1,
  showTimelineNavigation = false,
  canGoToNextStep = false,
  canGoToPrevStep = false,
  onTimelineNext,
  onTimelinePrevious,
  currentStep = 1,
  totalSteps = 1,
  showExploreButton = false,
  onExploreComplete
}) => {

  const handleClose = () => {
    onComplete();
  };

  const title = event.title || 'Audio';
  const audioUrl = event.mediaUrl || event.text; // text field may contain audio URL

  return (
    <Modal isOpen={true} onClose={handleClose} title={title}>
      <div className="space-y-6">
        {/* Audio content */}
        <div className="flex justify-center">
          {audioUrl ? (
            <div className="w-full max-w-lg">
              <audio
                src={audioUrl}
                controls
                className="w-full"
                onError={(e) => {
                  const target = e.target as HTMLAudioElement;
                  target.style.display = 'none';
                  const errorDiv = document.createElement('div');
                  errorDiv.className = 'text-red-400 text-center p-8 border-2 border-dashed border-red-400 rounded-lg';
                  errorDiv.textContent = 'Failed to load audio';
                  target.parentNode?.insertBefore(errorDiv, target);
                }}
              >
                Your browser does not support the audio tag.
              </audio>
            </div>
          ) : (
            <div className="text-slate-400 text-center p-8 border-2 border-dashed border-slate-600 rounded-lg">
              No audio URL provided
            </div>
          )}
        </div>

        {/* Description if available */}
        {event.description && (
          <div className="text-gray-300 text-center">
            {event.description}
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex flex-col gap-4">
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

export default DesktopAudioModal;