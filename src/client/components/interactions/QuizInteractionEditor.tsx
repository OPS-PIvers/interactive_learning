import React, { useState, useEffect, useCallback } from 'react';
import { ElementInteraction, EffectParameters } from '../../../shared/slideTypes';

interface QuizInteractionEditorProps {
  interaction: ElementInteraction;
  onUpdate: (updates: Partial<ElementInteraction>) => void;
  onDone: () => void;
}

interface QuizParameters extends EffectParameters {
  questionType?: 'multiple-choice' | 'fill-in-the-blank';
  quizQuestion?: string;
  quizOptions?: string[];
  quizCorrectAnswer?: number | string;
  quizShuffleOptions?: boolean;
  isSubjective?: boolean;
}

export const QuizInteractionEditor: React.FC<QuizInteractionEditorProps> = ({
  interaction,
  onUpdate,
  onDone,
}) => {
  const [params, setParams] = useState<QuizParameters>(
    interaction.effect.parameters as QuizParameters
  );

  const handleParamChange = useCallback(<K extends keyof QuizParameters>(
    param: K,
    value: QuizParameters[K]
  ) => {
    setParams(currentParams => ({
      ...currentParams,
      [param]: value,
    }));
  }, []);

  const handleSave = () => {
    onUpdate({
      effect: {
        ...interaction.effect,
        parameters: params,
      },
    });
    onDone();
  };

  useEffect(() => {
    setParams(interaction.effect.parameters as QuizParameters);
  }, [interaction]);

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...(params.quizOptions || [])];
    newOptions[index] = value;
    handleParamChange('quizOptions', newOptions);
  };

  const addOption = () => {
    const newOptions = [...(params.quizOptions || []), ''];
    handleParamChange('quizOptions', newOptions);
  };

  const removeOption = (index: number) => {
    // Prevent removing the last option
    if ((params.quizOptions || []).length <= 1) {
      return;
    }
    
    const newOptions = [...(params.quizOptions || [])];
    newOptions.splice(index, 1);
    handleParamChange('quizOptions', newOptions);
    
    // Adjust correct answer index if needed
    if (typeof params.quizCorrectAnswer === 'number') {
      if (params.quizCorrectAnswer === index) {
        // If we're removing the correct answer, set it to the first option
        handleParamChange('quizCorrectAnswer', 0);
      } else if (params.quizCorrectAnswer > index) {
        // If correct answer is after the removed option, shift it down
        handleParamChange('quizCorrectAnswer', params.quizCorrectAnswer - 1);
      }
    }
  };

  return (
    <div className="p-4 bg-slate-800 text-white h-full flex flex-col space-y-4">
      <div className="flex-1 overflow-y-auto pr-2 space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Question Type</label>
          <div className="flex items-center space-x-2 p-1 bg-slate-700 rounded-lg">
            <button
              onClick={() => handleParamChange('questionType', 'multiple-choice')}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                params.questionType === 'multiple-choice' ? 'bg-purple-600 text-white' : 'bg-transparent text-slate-300 hover:bg-slate-600'
              }`}
            >
              Multiple Choice
            </button>
            <button
              onClick={() => handleParamChange('questionType', 'fill-in-the-blank')}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                params.questionType === 'fill-in-the-blank' ? 'bg-purple-600 text-white' : 'bg-transparent text-slate-300 hover:bg-slate-600'
              }`}
            >
              Fill-in-the-Blank
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="quiz-question" className="block text-sm font-medium text-slate-300 mb-2">
            Question
          </label>
          <textarea
            id="quiz-question"
            value={params.quizQuestion || ''}
            onChange={(e) => handleParamChange('quizQuestion', e.target.value)}
            placeholder="e.g., What is the capital of France?"
            className="w-full p-3 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:ring-purple-500 focus:border-purple-500"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            {params.questionType === 'multiple-choice' ? 'Options' : 'Correct Answer'}
          </label>
          {params.questionType === 'multiple-choice' ? (
            <div className="space-y-2">
              {(params.quizOptions || []).map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    className="flex-grow p-3 bg-slate-700 border border-slate-600 rounded-md text-white"
                    placeholder={`Option ${index + 1}`}
                  />
                  <button
                    onClick={() => handleParamChange('quizCorrectAnswer', index)}
                    className={`w-10 h-10 flex items-center justify-center rounded-full text-white transition-colors ${
                      params.quizCorrectAnswer === index ? 'bg-green-500' : 'bg-slate-600 hover:bg-slate-500'
                    }`}
                    title="Mark as correct"
                  >
                    ✓
                  </button>
                  <button 
                    onClick={() => removeOption(index)} 
                    className={`p-2 transition-colors ${
                      (params.quizOptions || []).length <= 1
                        ? 'text-slate-500 cursor-not-allowed'
                        : 'text-red-400 hover:text-red-300'
                    }`}
                    disabled={(params.quizOptions || []).length <= 1}
                    title={(params.quizOptions || []).length <= 1 ? 'Cannot remove the last option' : 'Remove option'}
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                onClick={addOption}
                className="w-full py-2 mt-2 text-purple-400 border-2 border-dashed border-purple-400 rounded-md hover:bg-purple-400/10 transition-colors"
              >
                + Add Option
              </button>
            </div>
          ) : (
            <input
              type="text"
              value={(params.quizCorrectAnswer as string) || ''}
              onChange={(e) => handleParamChange('quizCorrectAnswer', e.target.value)}
              placeholder="Enter the correct answer"
              className="w-full p-3 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:ring-purple-500 focus:border-purple-500"
            />
          )}
        </div>
      </div>

      <div className="p-4 border-t border-slate-700">
        <button
          onClick={handleSave}
          className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 rounded-md text-white font-semibold transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  );
};
