import React, { useState, useEffect, useCallback } from 'react';
import { TimelineEventData } from '../../../shared/types';
import { triggerHapticFeedback } from '../../utils/hapticUtils';
import { Z_INDEX } from '../../constants/interactionConstants';
import { useMobileKeyboard } from '../../hooks/useMobileKeyboard';

interface MobileTextModalProps {
  event: TimelineEventData;
  onComplete: () => void;
  showNavigation?: boolean;
  canGoNext?: boolean;
  canGoPrevious?: boolean;
  onNext?: () => void;
  onPrevious?: () => void;
  currentIndex?: number;
  totalCount?: number;
}

const MobileTextModal: React.FC<MobileTextModalProps> = ({ 
  event, 
  onComplete,
  showNavigation = false,
  canGoNext = false,
  canGoPrevious = false,
  onNext,
  onPrevious,
  currentIndex = 0,
  totalCount = 1
}) => {
  const [isVisible, setIsVisible] = useState(false);
  
  // Mobile keyboard handling
  const keyboardInfo = useMobileKeyboard();

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

  const textContent = event.textContent || event.content || event.message || 'No content available';

  return (
    <div
      className={`mobile-text-modal-overlay keyboard-aware-container ${isVisible ? 'visible' : 'hidden'} ${keyboardInfo.isVisible ? 'keyboard-open' : ''}`}
      onClick={handleOverlayClick}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: Z_INDEX.MOBILE_MODAL_OVERLAY,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
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
          {showNavigation && totalCount > 1 && (
            <div className="navigation-controls" style={{ marginTop: '16px', marginBottom: '8px' }}>
              <div className="flex items-center justify-between">
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
                
                <span className="text-slate-400 text-sm">
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
          
          <button
            onClick={handleClose}
            className="mobile-button"
            style={{
              marginTop: '20px',
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
            {showNavigation && totalCount > 1 && currentIndex === totalCount - 1 ? 'Finish' : 'Continue'}
          </button>
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