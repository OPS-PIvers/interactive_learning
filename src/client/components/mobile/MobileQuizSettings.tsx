// MobileQuizSettings.tsx
import React, { useState, useEffect, useId } from 'react';
import { TimelineEventData, InteractionType } from '../../../shared/types';
import { MobileToggle } from './MobileToggle';

interface MobileQuizSettingsProps {
  event: TimelineEventData;
  onChange: (event: TimelineEventData) => void;
}

export const MobileQuizSettings: React.FC<MobileQuizSettingsProps> = ({ event, onChange }) => {
  const questionId = useId();
  if (event.type !== InteractionType.QUIZ) {
    return null;
  }

  const [question, setQuestion] = useState(event.quizQuestion || '');
  const [options, setOptions] = useState(event.quizOptions || ['']);
  const [correctAnswer, setCorrectAnswer] = useState(event.quizCorrectAnswer || 0);
  const [explanation, setExplanation] = useState(event.quizExplanation || '');
  const [shuffleOptions, setShuffleOptions] = useState(event.quizShuffleOptions || false);

  useEffect(() => {
    onChange({
      ...event,
      quizQuestion: question,
      quizOptions: options,
      quizCorrectAnswer: correctAnswer,
      quizExplanation: explanation,
      quizShuffleOptions: shuffleOptions,
    });
  }, [question, options, correctAnswer, explanation, shuffleOptions]);

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const addOption = () => {
    setOptions([...options, '']);
  };

  const removeOption = (index: number) => {
    const newOptions = options.filter((_, i) => i !== index);
    setOptions(newOptions);
    if (correctAnswer === index) {
      setCorrectAnswer(0);
    } else if (correctAnswer > index) {
      setCorrectAnswer(correctAnswer - 1);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor={questionId} className="block text-sm font-medium text-gray-300 mb-2">Question</label>
        <textarea
          id={questionId}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-white"
          rows={3}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Options</label>
        {options.map((option, index) => (
          <div key={index} className="flex items-center space-x-2 mb-2">
            <input
              type="radio"
              name="correctAnswer"
              checked={correctAnswer === index}
              onChange={() => setCorrectAnswer(index)}
              className="form-radio h-5 w-5 text-blue-600 bg-slate-700 border-slate-600"
            />
            <input
              data-testid={`option-${index}`}
              type="text"
              value={option}
              onChange={(e) => handleOptionChange(index, e.target.value)}
              className="flex-grow p-2 bg-slate-700 border border-slate-600 rounded-md text-white"
            />
            <button
              onClick={() => removeOption(index)}
              className="p-2 bg-red-600 text-white rounded-md"
            >
              Remove
            </button>
          </div>
        ))}
        <button
          onClick={addOption}
          className="p-2 bg-blue-600 text-white rounded-md"
        >
          Add Option
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Explanation (Optional)</label>
        <textarea
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-white"
          rows={2}
          placeholder="Explain why the correct answer is right."
        />
      </div>

      <MobileToggle
        label="Shuffle Options"
        enabled={shuffleOptions}
        onChange={setShuffleOptions}
      />
    </div>
  );
};