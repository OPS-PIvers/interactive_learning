import React, { useState, useEffect, useCallback } from 'react';
import { TimelineEventData, MediaQuizTrigger } from '../../../shared/types';
import { triggerHapticFeedback } from '../../utils/hapticUtils';
import VideoPlayer from '../VideoPlayer';
import { Z_INDEX } from '../../constants/interactionConstants';

interface MobileVideoModalProps {
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

const MobileVideoModal: React.FC<MobileVideoModalProps> = ({ 
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
  // Pan & zoom positioning
  modalPositioning = null
}) => {
  const [isVisible, setIsVisible] = useState(false);

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

  // Calculate modal positioning based on pan & zoom state
  const getModalStyles = () => {
    const baseStyles = {
      position: 'fixed' as const,
      zIndex: Z_INDEX.MOBILE_MODAL_OVERLAY,
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
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
        width: '100vw',
        height: '100vh',
        minHeight: '100vh',
      };
    }
  };

  const getVideoContent = () => {
    const videoUrl = event.videoUrl || event.url || event.mediaUrl;
    const youtubeId = event.youtubeVideoId;
    const startTime = event.youtubeStartTime || 0;
    const endTime = event.youtubeEndTime;
    const autoplay = event.autoplay || false;

    if (youtubeId) {
      let embedUrl = `https://www.youtube.com/embed/${youtubeId}?`;
      const params = new URLSearchParams();
      
      if (autoplay) params.append('autoplay', '1');
      if (startTime > 0) params.append('start', startTime.toString());
      if (endTime) params.append('end', endTime.toString());
      
      embedUrl += params.toString();
      
      return (
        <iframe
          src={embedUrl}
          width="100%"
          height="100%"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{ borderRadius: '8px' }}
        />
      );
    }

    if (videoUrl) {
      return (
        <VideoPlayer
          src={videoUrl}
          autoplay={autoplay}
          loop={event.loop || false}
          poster={event.poster}
          quizTriggers={event.quizTriggers}
          allowSeeking={event.allowSeeking}
          enforceQuizCompletion={event.enforceQuizCompletion}
          onQuizTrigger={(trigger: MediaQuizTrigger) => {
            console.log('Mobile Quiz triggered:', trigger);
            triggerHapticFeedback('medium');
          }}
          onQuizComplete={(triggerId: string, correct: boolean) => {
            console.log('Mobile Quiz completed:', triggerId, correct);
            triggerHapticFeedback(correct ? 'success' : 'error');
          }}
          className="rounded-lg"
        />
      );
    }

    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        height: '200px',
        color: 'white',
        textAlign: 'center',
      }}>
        <p>No video content available</p>
      </div>
    );
  };

  return (
    <div
      className={`mobile-video-modal-overlay ${isVisible ? 'visible' : 'hidden'}`}
      onClick={handleOverlayClick}
      style={getModalStyles()}
    >
      <div
        className="mobile-video-modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#1e293b',
          borderRadius: '12px',
          padding: '24px',
          maxWidth: '95vw',
          maxHeight: '85vh',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid #334155',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
          transform: isVisible ? 'scale(1)' : 'scale(0.9)',
          transition: 'transform 0.3s ease',
        }}
      >
        <div className="mobile-video-modal-header">
          <h3 className="text-lg font-semibold text-white mb-4">
            {event.name || 'Video'}
          </h3>
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
        </div>
        
        <div className="mobile-video-container" style={{ 
          flex: 1, 
          minHeight: '300px',
          position: 'relative',
        }}>
          {getVideoContent()}
        </div>
        
        {event.message && (
          <div className="mobile-video-caption" style={{
            marginTop: '16px',
            padding: '12px',
            background: '#374151',
            borderRadius: '8px',
            color: '#d1d5db',
            fontSize: '14px',
            lineHeight: '1.4',
          }}>
            {event.message}
          </div>
        )}
        
        <div className="mobile-video-footer">
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
        .mobile-video-modal-overlay {
          -webkit-tap-highlight-color: transparent;
        }
        
        .mobile-button:hover {
          background: #7c3aed !important;
        }
        
        .mobile-button:active {
          transform: scale(0.98);
          transition-duration: 0.1s;
        }
        
        @media (max-height: 600px) {
          .mobile-video-modal-content {
            max-height: 95vh;
            padding: 16px;
          }
          
          .mobile-video-container {
            min-height: 200px;
          }
        }
      `}</style>
    </div>
  );
};

export default MobileVideoModal;