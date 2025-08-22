import React from 'react';
import { TimelineEventData } from '../../../../shared/type-defs';
import { PlusIcon } from '../../icons/PlusIcon';
import { TrashIcon } from '../../icons/TrashIcon';

const inputClasses = "w-full bg-slate-700 p-2 rounded border border-slate-600 focus:ring-purple-500 focus:border-purple-500";
const labelClasses = "block text-sm font-medium text-slate-300 mb-1";

interface InteractionEditorProps {
  event: TimelineEventData;
  onUpdate: (updates: Partial<TimelineEventData>) => void;
}

/**
 * Placeholder component for editing quiz interactions.
 *
 * This is a temporary implementation. The final version should include:
 * - Advanced question types (multiple choice, fill-in-the-blank, drag-and-drop)
 * - Question randomization and shuffling
 * - Detailed explanation and feedback systems
 * - Quiz analytics and progress tracking
 */
const QuizInteractionEditor: React.FC<InteractionEditorProps> = React.memo(({ event, onUpdate }) => {
    const handleOptionChange = (index: number, value: string) => {
        const newOptions = [...(event.quizOptions || [])];
        newOptions[index] = value;
        onUpdate({ quizOptions: newOptions });
    };

    const handleAddOption = () => {
        const newOptions = [...(event.quizOptions || []), `New Option ${(event.quizOptions?.length || 0) + 1}`];
        onUpdate({ quizOptions: newOptions });
    };

    const handleDeleteOption = (index: number) => {
        const newOptions = [...(event.quizOptions || [])];
        newOptions.splice(index, 1);
        onUpdate({ quizOptions: newOptions });
    };

    const handleCorrectAnswerChange = (index: number) => {
        onUpdate({ quizCorrectAnswer: index });
    };

    return (
        <div className="space-y-4">
            <div>
                <label htmlFor="quizQuestion" className={labelClasses}>Question</label>
                <input
                    id="quizQuestion"
                    type="text"
                    value={event.quizQuestion || ''}
                    onChange={e => onUpdate({ quizQuestion: e.target.value })}
                    className={inputClasses}
                />
            </div>

            <div>
                <label className={labelClasses}>Options</label>
                <div className="space-y-2">
                    {(event.quizOptions || []).map((option, index) => (
                        <div key={`${option}-${index}`} className="flex items-center space-x-2">
                            <input
                                type="radio"
                                name="correctAnswer"
                                checked={event.quizCorrectAnswer === index}
                                onChange={() => handleCorrectAnswerChange(index)}
                                className="form-radio h-4 w-4 text-purple-600 bg-slate-600 border-slate-500"
                            />
                            <input
                                type="text"
                                value={option}
                                onChange={e => handleOptionChange(index, e.target.value)}
                                className={inputClasses}
                            />
                            <button onClick={() => handleDeleteOption(index)} className="p-1 text-red-500 hover:text-red-400">
                                <TrashIcon className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
                <button onClick={handleAddOption} className="mt-2 text-sm text-purple-400 hover:text-purple-300 flex items-center">
                    <PlusIcon className="w-4 h-4 mr-1" />
                    Add Option
                </button>
            </div>

            <div>
                <label htmlFor="quizExplanation" className={labelClasses}>Explanation (optional)</label>
                <textarea
                    id="quizExplanation"
                    value={event.quizExplanation || ''}
                    onChange={e => onUpdate({ quizExplanation: e.target.value })}
                    className={`${inputClasses} min-h-[60px]`}
                    rows={3}
                    placeholder="Explain why the correct answer is right."
                />
            </div>
        </div>
    );
});
QuizInteractionEditor.displayName = 'QuizInteractionEditor';

export default QuizInteractionEditor;
