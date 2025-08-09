import React, { useState } from 'react';
import { MediaQuizTrigger } from '../../shared/types';

interface QuizOverlayProps {
  quiz: MediaQuizTrigger['quiz'];
  onComplete: (correct: boolean) => void;
  className?: string;
}

const QuizOverlay: React.FC<QuizOverlayProps> = ({ 
  quiz, 
  onComplete, 
  className = '' 
}) => {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [hasAnswered, setHasAnswered] = useState(false);

  const handleAnswerSelect = (answerIndex: number) => {
    if (hasAnswered) return;
    
    setSelectedAnswer(answerIndex);
    setHasAnswered(true);
    
    const isCorrect = answerIndex === quiz.correctAnswer;
    
    if (quiz.explanation && quiz.showExplanation) {
      setShowExplanation(true);
      setTimeout(() => onComplete(isCorrect), 3000);
    } else {
      setTimeout(() => onComplete(isCorrect), 500);
    }
  };

  return (
    <div className={`bg-black bg-opacity-80 flex items-center justify-center p-4 ${className}`}>
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl">
        <div className="flex items-center mb-4">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
            <span className="text-white text-sm font-bold">?</span>
          </div>
          <h3 className="text-lg font-bold text-gray-900">Quick Check</h3>
        </div>
        
        <p className="text-gray-800 mb-6">{quiz.question}</p>
        
        <div className="space-y-3">
          {quiz.options.map((option, index) => (
            <button
              key={`quiz-option-${index}-${option.slice(0, 10)}`}
              onClick={() => handleAnswerSelect(index)}
              disabled={hasAnswered}
              className={`w-full text-left p-3 rounded-lg border-2 transition-all duration-200 ${
                hasAnswered
                  ? index === quiz.correctAnswer
                    ? 'bg-green-100 border-green-500 text-green-800'
                    : index === selectedAnswer
                    ? 'bg-red-100 border-red-500 text-red-800'
                    : 'bg-gray-100 border-gray-300 text-gray-600'
                  : 'bg-gray-50 border-gray-300 hover:bg-blue-50 hover:border-blue-300 text-gray-800'
              }`}
            >
              <span className="font-medium">{String.fromCharCode(65 + index)}.</span> {option}
            </button>
          ))}
        </div>
        
        {showExplanation && quiz.explanation && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Explanation:</strong> {quiz.explanation}
            </p>
          </div>
        )}
        
        {hasAnswered && !showExplanation && (
          <div className="mt-6 flex justify-end">
            <button
              onClick={() => onComplete(selectedAnswer === quiz.correctAnswer)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Continue
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizOverlay;