import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TimelineEventData } from '../../../shared/types';
import { triggerHapticFeedback } from '../../utils/hapticUtils';

interface MobileAudioModalProps {
  event: TimelineEventData;
  onComplete: () => void;
}

const MobileAudioModal: React.FC<MobileAudioModalProps> = ({ event, onComplete }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    setIsVisible(true);
    triggerHapticFeedback('light');
  }, []);

  const handleClose = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsVisible(false);
    triggerHapticFeedback('light');
    setTimeout(onComplete, 300);
  }, [onComplete]);

  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  }, [handleClose]);

  const handlePlayPause = useCallback(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
      triggerHapticFeedback('light');
    }
  }, [isPlaying]);

  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  }, []);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (audioRef.current) {
      const newTime = parseFloat(e.target.value);
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  }, []);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const audioUrl = event.audioUrl || event.url || event.mediaUrl;
  const artist = event.artist || 'Unknown Artist';
  const volume = event.volume || 1;

  return (
    <div
      className={`mobile-audio-modal-overlay ${isVisible ? 'visible' : 'hidden'}`}
      onClick={handleOverlayClick}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1001,
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
        className="mobile-audio-modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#1e293b',
          borderRadius: '12px',
          padding: '24px',
          maxWidth: '90vw',
          width: '100%',
          border: '1px solid #334155',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
          transform: isVisible ? 'scale(1)' : 'scale(0.9)',
          transition: 'transform 0.3s ease',
        }}
      >
        <div className="mobile-audio-modal-header">
          <h3 className="text-lg font-semibold text-white mb-2">
            {event.name || 'Audio'}
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
          {audioUrl && (
            <audio
              ref={audioRef}
              src={audioUrl}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onEnded={() => setIsPlaying(false)}
              volume={volume}
              style={{ display: 'none' }}
            />
          )}
          
          {/* Audio visualizer placeholder */}
          <div className="audio-visualizer" style={{
            height: '120px',
            background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div className="audio-icon" style={{
              color: 'white',
              fontSize: '48px',
              opacity: 0.9,
            }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
              </svg>
            </div>
            {isPlaying && (
              <div className="audio-waves" style={{
                position: 'absolute',
                bottom: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                gap: '2px',
              }}>
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="wave-bar"
                    style={{
                      width: '3px',
                      height: '20px',
                      background: 'rgba(255, 255, 255, 0.7)',
                      borderRadius: '1px',
                      animation: `wave 1s ease-in-out infinite ${i * 0.1}s`,
                    }}
                  />
                ))}
              </div>
            )}
          </div>
          
          {/* Progress bar */}
          <div className="progress-section" style={{ marginBottom: '20px' }}>
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              className="progress-slider"
              style={{
                width: '100%',
                height: '4px',
                background: '#374151',
                borderRadius: '2px',
                outline: 'none',
                appearance: 'none',
                WebkitAppearance: 'none',
              }}
            />
            <div className="time-display" style={{
              display: 'flex',
              justifyContent: 'space-between',
              color: '#94a3b8',
              fontSize: '12px',
              marginTop: '8px',
            }}>
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
          
          {/* Controls */}
          <div className="audio-controls" style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '20px',
          }}>
            <button
              onClick={handlePlayPause}
              className="play-pause-button"
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: '#8b5cf6',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)',
              }}
            >
              {isPlaying ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              )}
            </button>
          </div>
        </div>
        
        {event.message && (
          <div className="mobile-audio-caption" style={{
            padding: '12px',
            background: '#374151',
            borderRadius: '8px',
            color: '#d1d5db',
            fontSize: '14px',
            lineHeight: '1.4',
            marginBottom: '16px',
          }}>
            {event.message}
          </div>
        )}
        
        <div className="mobile-audio-footer">
          <button
            onClick={handleClose}
            className="mobile-button"
            style={{
              width: '100%',
              background: '#6b7280',
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
        .mobile-audio-modal-overlay {
          -webkit-tap-highlight-color: transparent;
        }
        
        .play-pause-button:hover {
          background: #7c3aed !important;
          transform: scale(1.05);
        }
        
        .play-pause-button:active {
          transform: scale(0.95);
          transition-duration: 0.1s;
        }
        
        .mobile-button:hover {
          background: #4b5563 !important;
        }
        
        .mobile-button:active {
          transform: scale(0.98);
          transition-duration: 0.1s;
        }
        
        .progress-slider::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          background: #8b5cf6;
          border-radius: 50%;
          cursor: pointer;
        }
        
        .progress-slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          background: #8b5cf6;
          border-radius: 50%;
          cursor: pointer;
          border: none;
        }
        
        @keyframes wave {
          0%, 100% { transform: scaleY(0.5); }
          50% { transform: scaleY(1); }
        }
      `}</style>
    </div>
  );
};

export default MobileAudioModal;