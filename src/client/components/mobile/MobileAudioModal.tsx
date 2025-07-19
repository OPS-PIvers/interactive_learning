import React, { useState, useEffect, useCallback } from 'react';
import { TimelineEventData, MediaQuizTrigger } from '../../../shared/types';
import { triggerHapticFeedback } from '../../utils/hapticUtils';
import AudioPlayer from '../AudioPlayer';
import { Z_INDEX } from '../../constants/interactionConstants';

interface MobileAudioModalProps {
  event: TimelineEventData;
  onComplete: () => void;
}

const MobileAudioModal: React.FC<MobileAudioModalProps> = ({ event, onComplete }) => {
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

  const audioUrl = event.audioUrl || event.url || event.mediaUrl;
  const title = event.textContent || event.name || 'Audio';
  const artist = event.artist || 'Unknown Artist';

  if (!audioUrl) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: 'white' }}>
        <p>No audio URL provided</p>
        <button onClick={handleClose} style={{ marginTop: '10px' }}>Close</button>
      </div>
    );
  }

  return (
    <div
      className="mobile-audio-modal-overlay"
      onClick={handleOverlayClick}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: Z_INDEX.MOBILE_MODAL_OVERLAY,
        padding: '20px',
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.3s ease',
        // Ensure proper viewport handling on mobile
        width: '100vw',
        height: '100vh',
        minHeight: '100vh',
      }}
    >
      <div
        className="mobile-audio-modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#1e293b',
          borderRadius: '12px',
          padding: '24px',
          maxWidth: '90vw',
          width: '100%',
          maxHeight: '80vh',
          border: '1px solid #334155',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
          transform: isVisible ? 'scale(1)' : 'scale(0.9)',
          transition: 'transform 0.3s ease',
          position: 'relative',
        }}
      >
        <div className="mobile-audio-modal-header">
          <h3 className="text-lg font-semibold text-white mb-2">
            {title}
          </h3>
          <p className="text-slate-400 text-sm mb-4">{artist}</p>
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
        
        <div className="mobile-audio-player">
          <AudioPlayer
            src={audioUrl}
            title={title}
            artist={artist}
            autoplay={event.autoplay}
            loop={event.loop}
            quizTriggers={event.quizTriggers}
            allowSeeking={event.allowSeeking}
            enforceQuizCompletion={event.enforceQuizCompletion}
            onQuizTrigger={(trigger: MediaQuizTrigger) => {
              console.log('Mobile Audio Quiz triggered:', trigger);
              triggerHapticFeedback('medium');
            }}
            onQuizComplete={(triggerId: string, correct: boolean) => {
              console.log('Mobile Audio Quiz completed:', triggerId, correct);
              triggerHapticFeedback(correct ? 'success' : 'error');
            }}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
};

export default MobileAudioModal;