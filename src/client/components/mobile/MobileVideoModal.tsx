import React, { useState, useEffect, useCallback } from 'react';
import { TimelineEventData, MediaQuizTrigger } from '../../../shared/types';
import { triggerHapticFeedback } from '../../utils/hapticUtils';
import VideoPlayer from '../VideoPlayer';

interface MobileVideoModalProps {
  event: TimelineEventData;
  onComplete: () => void;
}

const MobileVideoModal: React.FC<MobileVideoModalProps> = ({ event, onComplete }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    triggerHapticFeedback('light');
  }, []);

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
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1001,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.3s ease',
        touchAction: 'manipulation',
      }}
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
          <button
            onClick={handleClose}
            className="mobile-button"
            style={{
              marginTop: '16px',
              width: '100%',
              background: '#8b5cf6',
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
            Close
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