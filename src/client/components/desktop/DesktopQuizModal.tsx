import React, { useState, useCallback } from 'react';
import { TimelineEventData } from '../../../shared/types';
import Modal from '../Modal';

interface DesktopQuizModalProps {
  event: TimelineEventData;
  onComplete: () => void;
  showNavigation?: boolean;
  canGoNext?: boolean;
  canGoPrevious?: boolean;
  onNext?: () => void;
  onPrevious?: () => void;
  currentIndex?: number;
  totalCount?: number;
  showTimelineNavigation?: boolean;
  canGoToNextStep?: boolean;
  canGoToPrevStep?: boolean;
  onTimelineNext?: () => void;
  onTimelinePrevious?: () => void;
  currentStep?: number;
  totalSteps?: number;
  showExploreButton?: boolean;
  onExploreComplete?: () => void;
}

const DesktopQuizModal: React.FC<DesktopQuizModalProps> = ({ 
  event, 
  onComplete,
  showNavigation = false,
  canGoNext = false,
  canGoPrevious = false,
  onNext,
  onPrevious,
  currentIndex = 0,
  totalCount = 1,
  showTimelineNavigation = false,
  canGoToNextStep = false,
  canGoToPrevStep = false,
  onTimelineNext,
  onTimelinePrevious,
  currentStep = 1,
  totalSteps = 1,
  showExploreButton = false,
  onExploreComplete
}) => {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const question = event.question || event.quizQuestion || 'No question available';
  const options = event.options || event.quizOptions || ['No options available'];
  const explanation = event.quizExplanation || '';

  const handleSubmit = useCallback(() => {
    if (selectedAnswer === null) return;
    
    const correctAnswer = event.correctAnswer || event.quizCorrectAnswer || 0;
    const correct = selectedAnswer === correctAnswer;
    
    setIsCorrect(correct);
    setShowResult(true);
  }, [selectedAnswer, event.correctAnswer, event.quizCorrectAnswer]);

  const handleClose = () => {
    onComplete();
  };

  const handleContinue = () => {
    if (showNavigation && canGoNext) {
      onNext?.();
    } else if (showTimelineNavigation && canGoToNextStep) {
      onTimelineNext?.();
    } else if (showExploreButton) {
      onExploreComplete?.();
    } else {
      handleClose();
    }
  };

  const title = event.title || 'Quiz';

  return (
    <Modal isOpen={true} onClose={handleClose} title={title}>
      <div className="space-y-6">
        {!showResult ? (
          <>
            {/* Question */}
            <div className="text-lg text-white font-medium">
              {question}
            </div>

            {/* Options */}
            <div className="space-y-3">
              {options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedAnswer(index)}
                  className={`w-full p-4 text-left border-2 rounded-lg transition-all duration-200 ${
                    selectedAnswer === index
                      ? 'border-purple-500 bg-purple-500 bg-opacity-20'
                      : 'border-slate-600 hover:border-slate-500 bg-slate-700 hover:bg-slate-600'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm font-medium ${
                      selectedAnswer === index
                        ? 'border-purple-400 bg-purple-400 text-white'
                        : 'border-slate-400 text-slate-400'
                    }`}>
                      {String.fromCharCode(65 + index)}
                    </div>
                    <span className="text-gray-300">{option}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Submit button */}
            <div className="flex justify-end">
              <button
                onClick={handleSubmit}
                disabled={selectedAnswer === null}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  selectedAnswer !== null
                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                Submit Answer
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Result */}
            <div className={`p-6 rounded-lg border-2 ${
              isCorrect 
                ? 'border-green-500 bg-green-500 bg-opacity-10'
                : 'border-red-500 bg-red-500 bg-opacity-10'
            }`}>
              <div className={`text-xl font-bold mb-2 ${
                isCorrect ? 'text-green-400' : 'text-red-400'
              }`}>
                {isCorrect ? '✓ Correct!' : '✗ Incorrect'}
              </div>
              
              {!isCorrect && (
                <div className="text-gray-300 mb-2">
                  Correct answer: {String.fromCharCode(65 + (event.correctAnswer || event.quizCorrectAnswer || 0))}
                </div>
              )}
              
              {explanation && (
                <div className="text-gray-300 text-sm">
                  {explanation}
                </div>
              )}
            </div>

            {/* Navigation buttons */}
            <div className="flex flex-col gap-4">
              {showNavigation && (
                <div className="flex justify-between items-center">
                  <button
                    onClick={onPrevious}
                    disabled={!canGoPrevious}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      canGoPrevious
                        ? 'bg-slate-700 hover:bg-slate-600 text-white'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    Previous
                  </button>
                  
                  <span className="text-slate-400 text-sm">
                    {currentIndex + 1} of {totalCount}
                  </span>
                  
                  <button
                    onClick={onNext}
                    disabled={!canGoNext}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      canGoNext
                        ? 'bg-purple-600 hover:bg-purple-700 text-white'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    Next
                  </button>
                </div>
              )}

              {showTimelineNavigation && (
                <div className="flex justify-between items-center">
                  <button
                    onClick={onTimelinePrevious}
                    disabled={!canGoToPrevStep}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      canGoToPrevStep
                        ? 'bg-slate-700 hover:bg-slate-600 text-white'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    Previous Step
                  </button>
                  
                  <span className="text-slate-400 text-sm">
                    Step {currentStep} of {totalSteps}
                  </span>
                  
                  <button
                    onClick={onTimelineNext}
                    disabled={!canGoToNextStep}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      canGoToNextStep
                        ? 'bg-purple-600 hover:bg-purple-700 text-white'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    Next Step
                  </button>
                </div>
              )}

              {showExploreButton && (
                <div className="flex justify-center">
                  <button
                    onClick={onExploreComplete}
                    className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Complete Exploration
                  </button>
                </div>
              )}

              {!showNavigation && !showTimelineNavigation && !showExploreButton && (
                <div className="flex justify-end">
                  <button
                    onClick={handleContinue}
                    className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Continue
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default DesktopQuizModal;