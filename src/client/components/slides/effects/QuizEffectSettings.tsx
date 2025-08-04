/**
 * QuizEffectSettings - Settings panel for quiz effects
 * 
 * Migrated from main_revert MobileQuizSettings with enhancements
 * for the slide-based architecture
 */

import React, { useCallback, useState, useEffect } from 'react';
import { SlideEffect, QuizParameters } from '../../../../shared/slideTypes';

interface QuizEffectSettingsProps {
  effect: SlideEffect;
  onUpdate: (updates: Partial<SlideEffect>) => void;
}

export const QuizEffectSettings: React.FC<QuizEffectSettingsProps> = ({
  effect,
  onUpdate
}) => {
  const parameters = effect.parameters as QuizParameters;
  
  const [question, setQuestion] = useState(parameters.question || '');
  const [choices, setChoices] = useState(parameters.choices || ['']);
  const [correctAnswer, setCorrectAnswer] = useState(parameters.correctAnswer || 0);
  const [explanation, setExplanation] = useState(parameters.explanation || '');

  const handleParameterUpdate = useCallback((paramUpdates: Partial<QuizParameters>) => {
    onUpdate({
      parameters: {
        ...parameters,
        ...paramUpdates
      }
    });
  }, [parameters, onUpdate]);

  // Update parameters when local state changes
  useEffect(() => {
    const updatedParams: Partial<QuizParameters> = {
      question,
      choices,
      correctAnswer,
      explanation
    };
    
    // Only update if there are actual changes
    const hasChanges = 
      question !== parameters.question ||
      JSON.stringify(choices) !== JSON.stringify(parameters.choices) ||
      correctAnswer !== parameters.correctAnswer ||
      explanation !== parameters.explanation;
    
    if (hasChanges) {
      handleParameterUpdate(updatedParams);
    }
  }, [question, choices, correctAnswer, explanation, parameters, handleParameterUpdate]);

  const handleChoiceChange = useCallback((index: number, value: string) => {
    const newChoices = [...choices];
    newChoices[index] = value;
    setChoices(newChoices);
  }, [choices]);

  const addChoice = useCallback(() => {
    setChoices([...choices, '']);
  }, [choices]);

  const removeChoice = useCallback((index: number) => {
    const newChoices = choices.filter((_, i) => i !== index);
    setChoices(newChoices);
    
    // Adjust correct answer index if needed
    if (typeof parameters.correctAnswer === 'number') {
      if (correctAnswer === index) {
        setCorrectAnswer(0);
      } else if (correctAnswer > index) {
        setCorrectAnswer(correctAnswer - 1);
      }
    }
  }, [choices, correctAnswer]);

  return (
    <div className="space-y-4">
      {/* Question Type */}
      <div>
        <label className="block text-xs font-medium text-slate-300 mb-2">
          Question Type
        </label>
        <select
          value={parameters.questionType || 'multiple-choice'}
          onChange={(e) => handleParameterUpdate({ questionType: e.target.value as QuizParameters['questionType'] })}
          className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-xs"
        >
          <option value="multiple-choice">Multiple Choice</option>
          <option value="true-false">True/False</option>
          <option value="fill-in-the-blank">Fill in the Blank</option>
        </select>
      </div>

      {/* Question Text */}
      <div>
        <label className="block text-xs font-medium text-slate-300 mb-2">
          Question
        </label>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="w-full p-2 bg-slate-700 border border-slate-600 rounded text-white text-xs resize-none"
          rows={3}
          placeholder="Enter your question..."
        />
      </div>

      {/* Options (for multiple choice and true/false) */}
      {(parameters.questionType !== 'fill-in-the-blank') && (
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-2">
            Answer Options
          </label>
          {choices.map((option, index) => (
            <div key={index} className="flex items-center space-x-2 mb-2">
              <input
                type="radio"
                name="correctAnswer"
                checked={correctAnswer === index}
                onChange={() => setCorrectAnswer(index)}
                className="w-4 h-4 text-purple-600 bg-slate-700 border-slate-600 focus:ring-purple-500"
              />
              <input
                type="text"
                value={option}
                onChange={(e) => handleChoiceChange(index, e.target.value)}
                className="flex-1 p-2 bg-slate-700 border border-slate-600 rounded text-white text-xs"
                placeholder={`Option ${index + 1}`}
              />
              {choices.length > 1 && (
                <button
                  onClick={() => removeChoice(index)}
                  className="p-2 bg-red-600 hover:bg-red-700 text-white rounded text-xs transition-colors"
                  title={`Remove option ${index + 1}`}
                >
                  ×
                </button>
              )}
            </div>
          ))}
          
          {parameters.questionType !== 'true-false' && choices.length < 6 && (
            <button
              onClick={addChoice}
              className="w-full p-2 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-medium transition-colors"
            >
              + Add Option
            </button>
          )}
        </div>
      )}

      {/* Correct Answer (for fill-in-the-blank) */}
      {parameters.questionType === 'fill-in-the-blank' && (
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-2">
            Correct Answer
          </label>
          <input
            type="text"
            value={typeof parameters.correctAnswer === 'string' ? parameters.correctAnswer : ''}
            onChange={(e) => handleParameterUpdate({ correctAnswer: e.target.value })}
            className="w-full p-2 bg-slate-700 border border-slate-600 rounded text-white text-xs"
            placeholder="Enter the correct answer"
          />
        </div>
      )}

      {/* Explanation */}
      <div>
        <label className="block text-xs font-medium text-slate-300 mb-2">
          Explanation (Optional)
        </label>
        <textarea
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          className="w-full p-2 bg-slate-700 border border-slate-600 rounded text-white text-xs resize-none"
          rows={2}
          placeholder="Explain why the correct answer is right..."
        />
      </div>

      {/* Quiz Settings */}
      <div>
        <label className="block text-xs font-medium text-slate-300 mb-2">
          Quiz Options
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={parameters.allowMultipleAttempts || false}
              onChange={(e) => handleParameterUpdate({ allowMultipleAttempts: e.target.checked })}
              className="w-4 h-4 text-purple-600 bg-slate-700 border-slate-600 rounded focus:ring-purple-500"
            />
            <span className="text-xs text-slate-300">Allow retry on wrong answer</span>
          </label>
        </div>
      </div>

      {/* Scoring */}
      <div>
        <label className="block text-xs font-medium text-slate-300 mb-2">
          Points
        </label>
        <input
          type="number"
          min="0"
          max="100"
          value={parameters.points || 1}
          onChange={(e) => handleParameterUpdate({ points: parseInt(e.target.value) })}
          className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-xs"
        />
      </div>

      {/* Time Limit */}
      <div>
        <label className="block text-xs font-medium text-slate-300 mb-2">
          Time Limit (seconds)
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            max="300"
            value={parameters.timeLimit || 0}
            onChange={(e) => handleParameterUpdate({ timeLimit: parseInt(e.target.value) })}
            className="flex-1 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-xs"
            placeholder="No limit"
          />
          <span className="text-xs text-slate-400">0 = no limit</span>
        </div>
      </div>
    </div>
  );
};

export default QuizEffectSettings;