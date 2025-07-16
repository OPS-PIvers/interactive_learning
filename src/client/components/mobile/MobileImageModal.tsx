import React, { useState, useEffect, useCallback } from 'react';
import { TimelineEventData } from '../../../shared/types';
import { triggerHapticFeedback } from '../../utils/hapticUtils';

interface MobileImageModalProps {
  event: TimelineEventData;
  onComplete: () => void;
}

const MobileImageModal: React.FC<MobileImageModalProps> = ({ event, onComplete }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

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
              zIndex: 1002,
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