import React from 'react';
import { QuizEvent } from '../../../shared/types';
import { PlusCircleIcon, TrashIcon } from '@heroicons/react/24/outline';

interface MobileQuizSettingsProps {
  settings: QuizEvent;
  onSettingsChange: (settings: QuizEvent) => void;
}

export const MobileQuizSettings: React.FC<MobileQuizSettingsProps> = ({
  settings,
  onSettingsChange,
}) => {
  const handleQuestionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onSettingsChange({ ...settings, question: e.target.value });
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...(settings.options || [])];
    newOptions[index] = value;
    onSettingsChange({ ...settings, options: newOptions });
  };

  const addOption = () => {
    const newOptions = [...(settings.options || []), ''];
    onSettingsChange({ ...settings, options: newOptions });
  };

  const removeOption = (index: number) => {
    const newOptions = [...(settings.options || [])];
    newOptions.splice(index, 1);
    onSettingsChange({ ...settings, options: newOptions });
  };

  const setCorrectAnswer = (index: number) => {
    onSettingsChange({ ...settings, correctAnswer: index });
  };

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="quiz-question" className="block text-sm font-medium text-gray-300">
          Question
        </label>
        <textarea
          id="quiz-question"
          rows={3}
          value={settings.question || ''}
          onChange={handleQuestionChange}
          className="mt-1 block w-full bg-slate-800 border-slate-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-white p-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Options</label>
        <div className="space-y-2">
          {(settings.options || []).map((option, index) => (
            <div key={index} className="flex items-center space-x-2">
              <input
                type="radio"
                name="correct-answer"
                checked={settings.correctAnswer === index}
                onChange={() => setCorrectAnswer(index)}
                className="h-5 w-5 text-blue-600 bg-slate-700 border-slate-500 focus:ring-blue-500"
              />
              <input
                type="text"
                value={option}
                onChange={(e) => handleOptionChange(index, e.target.value)}
                className="flex-grow bg-slate-800 border-slate-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-white p-2"
              />
              <button onClick={() => removeOption(index)}>
                <TrashIcon className="h-6 w-6 text-red-500" />
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={addOption}
          className="mt-2 flex items-center space-x-2 text-blue-400 hover:text-blue-300"
        >
          <PlusCircleIcon className="h-6 w-6" />
          <span>Add Option</span>
        </button>
      </div>
    </div>
  );
};
