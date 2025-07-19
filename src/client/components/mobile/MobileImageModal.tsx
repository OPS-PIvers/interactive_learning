import React, { useState, useEffect, useCallback } from 'react';
import { TimelineEventData } from '../../../shared/types';
import { triggerHapticFeedback } from '../../utils/hapticUtils';
import { Z_INDEX } from '../../constants/interactionConstants';

interface MobileImageModalProps {
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
}

const MobileImageModal: React.FC<MobileImageModalProps> = ({ 
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
  autoProgressionDuration = 3000
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    triggerHapticFeedback('light');
    
    // Auto-progression for timed mode
    if (isTimedMode) {
      const timer = setTimeout(() => {
        handleClose();
      }, autoProgressionDuration);
      
      return () => clearTimeout(timer);
    }
  }, [isTimedMode, autoProgressionDuration]);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    triggerHapticFeedback('light');
    setTimeout(onComplete, 300);
  }, [onComplete]);

  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  }, [handleClose]);

  const imageUrl = event.imageUrl || event.url || event.mediaUrl;
  const caption = event.caption || event.message;

  return (
    <div
      className={`mobile-image-modal-overlay ${isVisible ? 'visible' : 'hidden'}`}
      onClick={handleOverlayClick}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: Z_INDEX.MOBILE_MODAL_OVERLAY,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.3s ease',
        touchAction: 'manipulation',
        // Ensure proper viewport handling on mobile
        width: '100vw',
        height: '100vh',
        minHeight: '100vh',
      }}
    >
      <div
        className="mobile-image-modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '95vw',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          transform: isVisible ? 'scale(1)' : 'scale(0.9)',
          transition: 'transform 0.3s ease',
        }}
      >
        <div className="mobile-image-modal-header">
          <button
            onClick={handleClose}
            className="close-button"
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              background: 'rgba(0, 0, 0, 0.7)',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: Z_INDEX.MOBILE_MODAL_CLOSE,
              color: 'white',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        
        <div className="mobile-image-container" style={{ position: 'relative', flex: 1 }}>
          {imageUrl && (
            <img
              src={imageUrl}
              alt={event.name || 'Modal image'}
              onLoad={() => setImageLoaded(true)}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                borderRadius: '8px',
                opacity: imageLoaded ? 1 : 0,
                transition: 'opacity 0.3s ease',
              }}
            />
          )}
          
          {!imageLoaded && (
            <div className="loading-spinner" style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: 'white',
            }}>
              <div className="spinner"></div>
            </div>
          )}
        </div>
        
        {caption && (
          <div className="mobile-image-caption" style={{
            marginTop: '16px',
            padding: '12px',
            background: 'rgba(0, 0, 0, 0.7)',
            borderRadius: '8px',
            color: 'white',
            textAlign: 'center',
            fontSize: '14px',
            lineHeight: '1.4',
          }}>
            {caption}
          </div>
        )}
        
        <div className="mobile-image-footer">
          {/* Multi-modal navigation (within same step) */}
          {showNavigation && totalCount > 1 && (
            <div className="navigation-controls" style={{ marginTop: '16px', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <button
                  onClick={onPrevious}
                  disabled={!canGoPrevious}
                  className="mobile-button"
                  style={{
                    background: canGoPrevious ? '#64748b' : '#334155',
                    color: canGoPrevious ? 'white' : '#64748b',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: canGoPrevious ? 'pointer' : 'not-allowed',
                    transition: 'background-color 0.2s ease',
                  }}
                >
                  ← Previous
                </button>
                
                <span style={{ color: '#94a3b8', fontSize: '14px' }}>
                  {currentIndex + 1} of {totalCount}
                </span>
                
                <button
                  onClick={onNext}
                  disabled={!canGoNext}
                  className="mobile-button"
                  style={{
                    background: canGoNext ? '#64748b' : '#334155',
                    color: canGoNext ? 'white' : '#64748b',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: canGoNext ? 'pointer' : 'not-allowed',
                    transition: 'background-color 0.2s ease',
                  }}
                >
                  Next →
                </button>
              </div>
            </div>
          )}

          {/* Timeline step navigation (for guided learning) */}
          {showTimelineNavigation && (
            <div className="timeline-navigation" style={{ marginTop: '16px', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <button
                  onClick={onTimelinePrevious}
                  disabled={!canGoToPrevStep}
                  className="mobile-button"
                  style={{
                    background: canGoToPrevStep ? '#3b82f6' : '#334155',
                    color: canGoToPrevStep ? 'white' : '#64748b',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: canGoToPrevStep ? 'pointer' : 'not-allowed',
                    transition: 'background-color 0.2s ease',
                  }}
                >
                  ← Previous Step
                </button>
                
                <span style={{ color: '#94a3b8', fontSize: '14px' }}>
                  Step {currentStep} of {totalSteps}
                </span>
                
                <button
                  onClick={onTimelineNext}
                  disabled={!canGoToNextStep}
                  className="mobile-button"
                  style={{
                    background: canGoToNextStep ? '#3b82f6' : '#334155',
                    color: canGoToNextStep ? 'white' : '#64748b',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: canGoToNextStep ? 'pointer' : 'not-allowed',
                    transition: 'background-color 0.2s ease',
                  }}
                >
                  Next Step →
                </button>
              </div>
            </div>
          )}

          {/* Timed mode indicator */}
          {isTimedMode && (
            <div className="timed-mode-indicator" style={{ marginTop: '16px', marginBottom: '8px', textAlign: 'center' }}>
              <span style={{ color: '#94a3b8', fontSize: '14px' }}>
                Auto-advancing in {Math.ceil(autoProgressionDuration / 1000)} seconds...
              </span>
            </div>
          )}
          
          {/* Main action button */}
          <button
            onClick={showExploreButton ? onExploreComplete : handleClose}
            className="mobile-button"
            style={{
              marginTop: '16px',
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
            {showExploreButton 
              ? 'Continue Exploring' 
              : showNavigation && totalCount > 1 && currentIndex === totalCount - 1 
                ? 'Finish' 
                : isTimedMode 
                  ? 'Skip' 
                  : 'Close'}
          </button>
        </div>
      </div>

      <style jsx>{`
        .mobile-image-modal-overlay {
          -webkit-tap-highlight-color: transparent;
        }
        
        .close-button:hover {
          background: rgba(0, 0, 0, 0.9) !important;
        }
        
        .close-button:active {
          transform: scale(0.95);
          transition-duration: 0.1s;
        }
        
        .mobile-button:hover {
          background: #7c3aed !important;
        }
        
        .mobile-button:active {
          transform: scale(0.98);
          transition-duration: 0.1s;
        }
        
        .spinner {
          width: 32px;
          height: 32px;
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-top: 3px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default MobileImageModal;