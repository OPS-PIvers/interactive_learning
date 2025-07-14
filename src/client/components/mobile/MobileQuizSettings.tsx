import React, { useState } from 'react';
import { TimelineEventData } from '../../../shared/types';
import { PlusCircleIcon, TrashIcon } from '@heroicons/react/24/solid';

interface MobileQuizSettingsProps {
  event: TimelineEventData;
  onUpdate: (event: Partial<TimelineEventData>) => void;
}

export const MobileQuizSettings: React.FC<MobileQuizSettingsProps> = ({ event, onUpdate }) => {
  const [options, setOptions] = useState(event.quizOptions || ['']);
  const [correctAnswer, setCorrectAnswer] = useState(event.quizCorrectAnswer || 0);

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
    onUpdate({ quizOptions: newOptions });
  };

  const addOption = () => {
    const newOptions = [...options, ''];
    setOptions(newOptions);
    onUpdate({ quizOptions: newOptions });
  };

  const removeOption = (index: number) => {
    const newOptions = options.filter((_, i) => i !== index);
    setOptions(newOptions);
    onUpdate({ quizOptions: newOptions });
    if (correctAnswer === index) {
      setCorrectAnswer(0);
      onUpdate({ quizCorrectAnswer: 0 });
    }
  };

  const handleCorrectAnswerChange = (index: number) => {
    setCorrectAnswer(index);
    onUpdate({ quizCorrectAnswer: index });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300">Question</label>
        <textarea
          value={event.quizQuestion || ''}
          onChange={(e) => onUpdate({ quizQuestion: e.target.value })}
          className="w-full bg-slate-700 text-white rounded-lg p-2 mt-1"
          rows={3}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300">Options</label>
        {options.map((option, index) => (
          <div key={index} className="flex items-center space-x-2 mt-2">
            <input
              type="radio"
              name="correctAnswer"
              checked={correctAnswer === index}
              onChange={() => handleCorrectAnswerChange(index)}
              className="form-radio h-5 w-5 text-blue-600 bg-slate-600 border-slate-500"
            />
            <input
              type="text"
              value={option}
              onChange={(e) => handleOptionChange(index, e.target.value)}
              className="w-full bg-slate-700 text-white rounded-lg p-2"
            />
            <button onClick={() => removeOption(index)}>
              <TrashIcon className="h-6 w-6 text-red-500" />
            </button>
          </div>
        ))}
        <button onClick={addOption} className="mt-2 flex items-center space-x-2 text-blue-400">
          <PlusCircleIcon className="h-6 w-6" />
          <span>Add Option</span>
        </button>
      </div>
    </div>
  );
};
