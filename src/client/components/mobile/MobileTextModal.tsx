import React, { useState, useEffect, useCallback } from 'react';
import { TimelineEventData } from '../../../shared/types';
import { triggerHapticFeedback } from '../../utils/hapticUtils';
import { Z_INDEX } from '../../constants/interactionConstants';
import { useMobileKeyboard } from '../../hooks/useMobileKeyboard';

interface MobileTextModalProps {
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
  // Timed mode
  isTimedMode?: boolean;
  autoProgressionDuration?: number;
  // Text event specific settings
  autoDismiss?: boolean;
  dismissDelay?: number;
  allowClickToClose?: boolean;
  // Pan & zoom positioning
  modalPositioning?: {
    isPanZoomActive: boolean;
    viewportCenterX: number;
    viewportCenterY: number;
    scale: number;
    translateX: number;
    translateY: number;
    containerRect: DOMRect;
  } | null;
}

const MobileTextModal: React.FC<MobileTextModalProps> = ({ 
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
  // Timed mode
  isTimedMode = false,
  autoProgressionDuration = 3000,
  // Text event specific settings
  autoDismiss = false,
  dismissDelay = 5,
  allowClickToClose = true,
  // Pan & zoom positioning
  modalPositioning = null
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [countdown, setCountdown] = useState(0);
  
  // Mobile keyboard handling
  const keyboardInfo = useMobileKeyboard();

  useEffect(() => {
    setIsVisible(true);
    triggerHapticFeedback('light');
    
    // Auto-progression for timed mode (legacy behavior)
    if (isTimedMode) {
      const timer = setTimeout(() => {
        handleClose();
      }, autoProgressionDuration);
      
      return () => clearTimeout(timer);
    }
    
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
  }, [isTimedMode, autoProgressionDuration, autoDismiss, dismissDelay]);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    triggerHapticFeedback('light');
    setTimeout(onComplete, 300);
  }, [onComplete]);

  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget && allowClickToClose) {
      handleClose();
    }
  }, [handleClose, allowClickToClose]);

  const textContent = event.textContent || event.content || event.message || 'No content available';

  // Calculate modal positioning based on pan & zoom state
  const getModalStyles = () => {
    const baseStyles = {
      position: 'fixed' as const,
      zIndex: Z_INDEX.MOBILE_MODAL_OVERLAY,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      padding: '20px',
      opacity: isVisible ? 1 : 0,
      transition: 'opacity 0.3s ease',
      touchAction: 'manipulation' as const,
    };

    if (modalPositioning?.isPanZoomActive) {
      // Position modal relative to the current pan & zoom viewport
      return {
        ...baseStyles,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100vw',
        height: '100vh',
        minHeight: '100vh',
      };
    } else {
      // Default fullscreen positioning
      return {
        ...baseStyles,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100vw',
        height: '100vh',
        minHeight: '100vh',
      };
    }
  };

  return (
    <div
      className={`mobile-text-modal-overlay keyboard-aware-container ${isVisible ? 'visible' : 'hidden'} ${keyboardInfo.isVisible ? 'keyboard-open' : ''}`}
      onClick={handleOverlayClick}
      style={getModalStyles()}
    >
      <div
        className="mobile-text-modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#1e293b',
          borderRadius: '12px',
          padding: '24px',
          maxWidth: '90vw',
          maxHeight: '80vh',
          overflow: 'auto',
          border: '1px solid #334155',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
          transform: isVisible ? 'scale(1)' : 'scale(0.9)',
          transition: 'transform 0.3s ease',
        }}
      >
        <div className="mobile-text-modal-header">
          <h3 className="text-lg font-semibold text-white mb-4">
            {event.name || 'Information'}
          </h3>
          {allowClickToClose && !autoDismiss && (
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '4px',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
          {autoDismiss && countdown > 0 && (
            <div
              className="absolute top-4 right-4 text-slate-300 text-sm font-medium"
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'rgba(0, 0, 0, 0.7)',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 12px',
                pointerEvents: 'none',
              }}
            >
              Closing in {countdown}s
            </div>
          )}
        </div>
        
        <div className="mobile-text-modal-body">
          <div 
            className="text-slate-200 leading-relaxed"
            style={{
              fontSize: '16px',
              lineHeight: '1.6',
              whiteSpace: 'pre-wrap',
            }}
          >
            {textContent}
          </div>
        </div>
        
        <div className="mobile-text-modal-footer">
          {/* Simplified footer - navigation handled by timeline */}
          {(allowClickToClose || showExploreButton) && !autoDismiss && (
            <button
              onClick={showExploreButton ? onExploreComplete : handleClose}
              className="mobile-button"
              style={{
                marginTop: '20px',
                width: '100%',
                background: showExploreButton ? '#059669' : '#8b5cf6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease',
              }}
            >
              {showExploreButton ? 'Continue Exploring' : 'Continue'}
            </button>
          )}
        </div>
      </div>

      <style jsx>{`
        .mobile-text-modal-overlay {
          -webkit-tap-highlight-color: transparent;
        }
        
        .mobile-button:hover {
          background: #7c3aed !important;
        }
        
        .mobile-button:active {
          transform: scale(0.98);
          transition-duration: 0.1s;
        }
        
        .flex {
          display: flex;
        }
        
        .items-center {
          align-items: center;
        }
        
        .justify-between {
          justify-content: space-between;
        }
        
        .text-slate-400 {
          color: #94a3b8;
        }
        
        .text-sm {
          font-size: 14px;
        }
        
        @media (max-height: 600px) {
          .mobile-text-modal-content {
            max-height: 90vh;
            padding: 16px;
          }
        }
      `}</style>
    </div>
  );
};

export default MobileTextModal;