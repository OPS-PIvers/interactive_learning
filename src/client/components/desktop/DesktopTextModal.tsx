import React, { useState, useEffect, useCallback } from 'react';
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
  // Text event specific settings
  autoDismiss?: boolean;
  dismissDelay?: number;
  allowClickToClose?: boolean;
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
  onExploreComplete,
  // Text event specific settings
  autoDismiss = false,
  dismissDelay = 5,
  allowClickToClose = true
}) => {
  const [countdown, setCountdown] = useState(0);

  const handleClose = useCallback(() => {
    onComplete();
  }, [onComplete]);

  useEffect(() => {
    // Auto-dismiss for text events with countdown
    if (autoDismiss && dismissDelay > 0) {
      setCountdown(dismissDelay);
      
      const countdownInterval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            handleClose();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(countdownInterval);
    }
  }, [autoDismiss, dismissDelay, handleClose]);

  const title = event.title || event.text || 'Text Message';

  return (
    <Modal 
      isOpen={true} 
      onClose={allowClickToClose && !autoDismiss ? handleClose : undefined} 
      title={title}
    >
      <div className="space-y-6">
        {/* Auto-dismiss countdown display */}
        {autoDismiss && countdown > 0 && (
          <div className="bg-slate-700 rounded-lg p-3 text-center">
            <span className="text-slate-300 text-sm font-medium">
              Closing automatically in {countdown} second{countdown !== 1 ? 's' : ''}
            </span>
          </div>
        )}

        {/* Main content */}
        <div className="text-gray-300 leading-relaxed">
          <div className="whitespace-pre-wrap">{event.textContent || event.content || event.message || event.text || 'No content available'}</div>
        </div>

        {/* Simplified footer - navigation handled by timeline */}
        <div className="flex justify-center gap-4">
          {showExploreButton && (
            <button
              onClick={onExploreComplete}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
            >
              Continue Exploring
            </button>
          )}

          {allowClickToClose && !autoDismiss && !showExploreButton && (
            <button
              onClick={handleClose}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
            >
              Continue
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default DesktopTextModal;