import React, { useState, useEffect, useCallback } from 'react';
import { TimelineEventData } from '../../../shared/types';
import { triggerHapticFeedback } from '../../utils/hapticUtils';

interface MobileQuizModalProps {
  event: TimelineEventData;
  onComplete: () => void;
}

const MobileQuizModal: React.FC<MobileQuizModalProps> = ({ event, onComplete }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    triggerHapticFeedback('light');
  }, []);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    triggerHapticFeedback('light');
    setTimeout(onComplete, 300);
  }, [onComplete]);

  const handleAnswerSelect = useCallback((answerIndex: number) => {
    setSelectedAnswer(answerIndex);
    triggerHapticFeedback('light');
  }, []);

  const handleSubmit = useCallback(() => {
    if (selectedAnswer === null) return;
    
    const correctAnswer = event.correctAnswer || event.quizCorrectAnswer || 0;
    const correct = selectedAnswer === correctAnswer;
    
    setIsCorrect(correct);
    setShowResult(true);
    triggerHapticFeedback(correct ? 'success' : 'error');
  }, [selectedAnswer, event.correctAnswer, event.quizCorrectAnswer]);

  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  }, [handleClose]);

  const question = event.question || event.quizQuestion || 'No question available';
  const options = event.options || event.quizOptions || ['No options available'];
  const explanation = event.quizExplanation || '';

  return (
    <div
      className={`mobile-quiz-modal-overlay ${isVisible ? 'visible' : 'hidden'}`}
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
        className="mobile-quiz-modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#1e293b',
          borderRadius: '12px',
          padding: '24px',
          maxWidth: '90vw',
          maxHeight: '85vh',
          overflow: 'auto',
          border: '1px solid #334155',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
          transform: isVisible ? 'scale(1)' : 'scale(0.9)',
          transition: 'transform 0.3s ease',
        }}
      >
        <div className="mobile-quiz-modal-header">
          <h3 className="text-lg font-semibold text-white mb-4">
            {event.name || 'Quiz Question'}
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
        
        <div className="mobile-quiz-modal-body">
          <div className="question-section mb-6">
            <h4 className="text-slate-200 text-lg font-medium mb-4">{question}</h4>
          </div>
          
          {!showResult ? (
            <div className="options-section">
              <div className="space-y-3">
                {options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(index)}
                    className={`option-button ${selectedAnswer === index ? 'selected' : ''}`}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '12px 16px',
                      textAlign: 'left',
                      background: selectedAnswer === index ? '#8b5cf6' : '#374151',
                      color: 'white',
                      border: selectedAnswer === index ? '2px solid #a855f7' : '2px solid #4b5563',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      fontSize: '16px',
                      lineHeight: '1.4',
                    }}
                  >
                    <span className="option-letter" style={{ fontWeight: 'bold', marginRight: '8px' }}>
                      {String.fromCharCode(65 + index)}.
                    </span>
                    {option}
                  </button>
                ))}
              </div>
              
              <button
                onClick={handleSubmit}
                disabled={selectedAnswer === null}
                className="submit-button"
                style={{
                  marginTop: '24px',
                  width: '100%',
                  background: selectedAnswer !== null ? '#10b981' : '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 24px',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: selectedAnswer !== null ? 'pointer' : 'not-allowed',
                  transition: 'background-color 0.2s ease',
                  opacity: selectedAnswer !== null ? 1 : 0.6,
                }}
              >
                Submit Answer
              </button>
            </div>
          ) : (
            <div className="result-section">
              <div className={`result-indicator ${isCorrect ? 'correct' : 'incorrect'}`} style={{
                padding: '16px',
                borderRadius: '8px',
                marginBottom: '16px',
                textAlign: 'center',
                background: isCorrect ? '#065f46' : '#7f1d1d',
                border: `2px solid ${isCorrect ? '#10b981' : '#ef4444'}`,
              }}>
                <div className="result-icon" style={{ fontSize: '32px', marginBottom: '8px' }}>
                  {isCorrect ? '✅' : '❌'}
                </div>
                <div className="result-text" style={{ fontSize: '18px', fontWeight: '600', color: 'white' }}>
                  {isCorrect ? 'Correct!' : 'Incorrect'}
                </div>
                {!isCorrect && (
                  <div className="correct-answer" style={{ fontSize: '14px', color: '#d1d5db', marginTop: '8px' }}>
                    Correct answer: {String.fromCharCode(65 + (event.correctAnswer || event.quizCorrectAnswer || 0))}
                  </div>
                )}
              </div>
              
              {explanation && (
                <div className="explanation" style={{
                  padding: '16px',
                  background: '#374151',
                  borderRadius: '8px',
                  marginBottom: '16px',
                }}>
                  <h5 className="text-slate-200 font-medium mb-2">Explanation:</h5>
                  <p className="text-slate-300 text-sm leading-relaxed">{explanation}</p>
                </div>
              )}
              
              <button
                onClick={handleClose}
                className="continue-button"
                style={{
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
                Continue
              </button>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .mobile-quiz-modal-overlay {
          -webkit-tap-highlight-color: transparent;
        }
        
        .option-button:hover {
          background: #4b5563 !important;
        }
        
        .option-button.selected:hover {
          background: #7c3aed !important;
        }
        
        .option-button:active {
          transform: scale(0.98);
          transition-duration: 0.1s;
        }
        
        .submit-button:hover:not(:disabled) {
          background: #059669 !important;
        }
        
        .submit-button:active:not(:disabled) {
          transform: scale(0.98);
          transition-duration: 0.1s;
        }
        
        .continue-button:hover {
          background: #7c3aed !important;
        }
        
        .continue-button:active {
          transform: scale(0.98);
          transition-duration: 0.1s;
        }
        
        @media (max-height: 600px) {
          .mobile-quiz-modal-content {
            max-height: 95vh;
            padding: 16px;
          }
        }
      `}</style>
    </div>
  );
};

export default MobileQuizModal;