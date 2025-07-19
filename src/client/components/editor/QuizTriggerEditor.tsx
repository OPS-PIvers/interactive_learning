import React, { useState } from 'react';
import { MediaQuizTrigger } from '../../shared/types';

interface QuizTriggerEditorProps {
  trigger: MediaQuizTrigger;
  index: number;
  onUpdate: (trigger: MediaQuizTrigger) => void;
  onDelete: () => void;
}

const QuizTriggerEditor: React.FC<QuizTriggerEditorProps> = ({
  trigger,
  index,
  onUpdate,
  onDelete
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateQuiz = (updates: Partial<MediaQuizTrigger['quiz']>) => {
    onUpdate({
      ...trigger,
      quiz: { ...trigger.quiz, ...updates }
    });
  };

  const addOption = () => {
    const newOptions = [...trigger.quiz.options, `Option ${trigger.quiz.options.length + 1}`];
    updateQuiz({ options: newOptions });
  };

  const removeOption = (optionIndex: number) => {
    if (trigger.quiz.options.length <= 2) return; // Minimum 2 options
    
    const newOptions = trigger.quiz.options.filter((_, i) => i !== optionIndex);
    const newCorrectAnswer = trigger.quiz.correctAnswer >= optionIndex && trigger.quiz.correctAnswer > 0
      ? trigger.quiz.correctAnswer - 1
      : trigger.quiz.correctAnswer;
    
    updateQuiz({ options: newOptions, correctAnswer: newCorrectAnswer });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="border border-gray-300 rounded p-3 bg-gray-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">Quiz {index + 1}</span>
          <span className="text-xs text-gray-600">
            at {formatTime(trigger.timestamp)}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            {isExpanded ? 'Collapse' : 'Edit'}
          </button>
          <button
            onClick={onDelete}
            className="text-xs text-red-600 hover:text-red-800"
          >
            Delete
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-3 space-y-3">
          {/* Timestamp */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Timestamp (seconds)
            </label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={trigger.timestamp}
              onChange={(e) => onUpdate({ ...trigger, timestamp: parseFloat(e.target.value) || 0 })}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
            />
          </div>

          {/* Question */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Question
            </label>
            <textarea
              value={trigger.quiz.question}
              onChange={(e) => updateQuiz({ question: e.target.value })}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
              rows={2}
            />
          </div>

          {/* Options */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-medium text-gray-700">
                Answer Options
              </label>
              <button
                onClick={addOption}
                className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
              >
                + Option
              </button>
            </div>
            {trigger.quiz.options.map((option, optionIndex) => (
              <div key={optionIndex} className="flex items-center space-x-2 mb-2">
                <input
                  type="radio"
                  name={`correct-${trigger.id}`}
                  checked={trigger.quiz.correctAnswer === optionIndex}
                  onChange={() => updateQuiz({ correctAnswer: optionIndex })}
                  className="text-green-600"
                />
                <input
                  type="text"
                  value={option}
                  onChange={(e) => {
                    const newOptions = [...trigger.quiz.options];
                    newOptions[optionIndex] = e.target.value;
                    updateQuiz({ options: newOptions });
                  }}
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                />
                {trigger.quiz.options.length > 2 && (
                  <button
                    onClick={() => removeOption(optionIndex)}
                    className="text-red-600 hover:text-red-800 text-xs"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Settings */}
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={trigger.pauseMedia}
                onChange={(e) => onUpdate({ ...trigger, pauseMedia: e.target.checked })}
                className="mr-2"
              />
              <span className="text-xs">Pause media at this point</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={trigger.resumeAfterCompletion}
                onChange={(e) => onUpdate({ ...trigger, resumeAfterCompletion: e.target.checked })}
                className="mr-2"
              />
              <span className="text-xs">Auto-resume after quiz completion</span>
            </label>
          </div>

          {/* Optional Explanation */}
          <div>
            <label className="flex items-center mb-1">
              <input
                type="checkbox"
                checked={!!trigger.quiz.showExplanation}
                onChange={(e) => updateQuiz({ showExplanation: e.target.checked })}
                className="mr-2"
              />
              <span className="text-xs font-medium text-gray-700">Show explanation after answer</span>
            </label>
            {trigger.quiz.showExplanation && (
              <textarea
                value={trigger.quiz.explanation || ''}
                onChange={(e) => updateQuiz({ explanation: e.target.value })}
                placeholder="Explain the correct answer..."
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                rows={2}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizTriggerEditor;