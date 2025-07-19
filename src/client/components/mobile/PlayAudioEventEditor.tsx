import React, { useState } from 'react';
import { TimelineEventData, QuizQuestion, QuestionType } from '../../../shared/types';
import { PlusIcon } from '../icons/PlusIcon';
import { TrashIcon } from '../icons/TrashIcon';

interface PlayAudioEventEditorProps {
  event: TimelineEventData;
  onUpdate: (updates: Partial<TimelineEventData>) => void;
  onClose: () => void;
}

const PlayAudioEventEditor: React.FC<PlayAudioEventEditorProps> = ({ event, onUpdate, onClose }) => {
  const [internalEvent, setInternalEvent] = useState<TimelineEventData>(event);

  const handleUpdate = (field: keyof TimelineEventData, value: any) => {
    const newEvent = { ...internalEvent, [field]: value };
    setInternalEvent(newEvent);
    onUpdate({ [field]: value });
  };

  const handleQuestionChange = (questionId: string, field: keyof QuizQuestion, value: any) => {
    const newQuestions = (internalEvent.questions || []).map(q => {
      if (q.id === questionId) {
        return { ...q, [field]: value };
      }
      return q;
    });
    handleUpdate('questions', newQuestions);
  };

  const addQuestion = () => {
    const newQuestion: QuizQuestion = {
      id: `q_${Date.now()}`,
      timestamp: 0,
      questionType: 'multiple-choice',
      questionText: '',
      options: [''],
      correctAnswer: 0,
      showCorrectAnswer: true,
    };
    const newQuestions = [...(internalEvent.questions || []), newQuestion];
    handleUpdate('questions', newQuestions);
  };

  const removeQuestion = (questionId: string) => {
    const newQuestions = (internalEvent.questions || []).filter(q => q.id !== questionId);
    handleUpdate('questions', newQuestions);
  };

  const addOption = (questionId: string) => {
    const newQuestions = (internalEvent.questions || []).map(q => {
      if (q.id === questionId) {
        return { ...q, options: [...(q.options || []), ''] };
      }
      return q;
    });
    handleUpdate('questions', newQuestions);
  };

    const handleOptionChange = (questionId: string, optionIndex: number, value: string) => {
    const newQuestions = (internalEvent.questions || []).map(q => {
      if (q.id === questionId) {
        const newOptions = [...(q.options || [])];
        newOptions[optionIndex] = value;
        return { ...q, options: newOptions };
      }
      return q;
    });
    handleUpdate('questions', newQuestions);
  };

  const removeOption = (questionId: string, optionIndex: number) => {
    const newQuestions = (internalEvent.questions || []).map(q => {
      if (q.id === questionId) {
        const newOptions = [...(q.options || [])];
        newOptions.splice(optionIndex, 1);
        return { ...q, options: newOptions };
      }
      return q;
    });
    handleUpdate('questions', newQuestions);
  };


  const renderQuizQuestions = () => {
    if (!internalEvent.includeQuiz) return null;

    return (
      <div className="space-y-4">
        {(internalEvent.questions || []).map(q => (
          <div key={q.id} className="p-3 bg-slate-700 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-semibold">Question</h4>
              <button onClick={() => removeQuestion(q.id)} className="text-red-400 hover:text-red-300 p-1">
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2">
              <input
                type="number"
                placeholder="Timestamp (seconds)"
                value={q.timestamp}
                onChange={e => handleQuestionChange(q.id, 'timestamp', parseInt(e.target.value, 10))}
                className="w-full p-2 bg-slate-600 rounded"
              />
              <select
                value={q.questionType}
                onChange={e => handleQuestionChange(q.id, 'questionType', e.target.value as QuestionType)}
                className="w-full p-2 bg-slate-600 rounded"
              >
                <option value="multiple-choice">Multiple Choice</option>
                <option value="fill-in-the-blank">Fill in the Blank</option>
              </select>
              <textarea
                placeholder="Question text"
                value={q.questionText}
                onChange={e => handleQuestionChange(q.id, 'questionText', e.target.value)}
                className="w-full p-2 bg-slate-600 rounded"
                rows={2}
              />
              {q.questionType === 'multiple-choice' && (
                <div className="space-y-2">
                  <h5 className="text-sm font-medium">Options</h5>
                  {(q.options || []).map((opt, i) => (
                    <div key={i} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name={`correct-answer-${q.id}`}
                        checked={q.correctAnswer === i}
                        onChange={() => handleQuestionChange(q.id, 'correctAnswer', i)}
                      />
                      <input
                        type="text"
                        placeholder={`Option ${i + 1}`}
                        value={opt}
                        onChange={e => handleOptionChange(q.id, i, e.target.value)}
                        className="flex-grow p-2 bg-slate-500 rounded"
                      />
                      <button onClick={() => removeOption(q.id, i)} className="text-red-400 hover:text-red-300 p-1">
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button onClick={() => addOption(q.id)} className="text-purple-400 hover:text-purple-300 text-sm flex items-center">
                    <PlusIcon className="w-4 h-4 mr-1" /> Add Option
                  </button>
                </div>
              )}
              {q.questionType === 'fill-in-the-blank' && (
                <input
                  type="text"
                  placeholder="Correct Answer"
                  value={q.correctAnswer as string || ''}
                  onChange={e => handleQuestionChange(q.id, 'correctAnswer', e.target.value)}
                  className="w-full p-2 bg-slate-600 rounded"
                />
              )}
               <div className="flex items-center justify-between">
                <label className="text-sm text-slate-300">Show correct answer</label>
                <div
                    onClick={() => handleQuestionChange(q.id, 'showCorrectAnswer', !q.showCorrectAnswer)}
                    className={`relative inline-flex items-center h-6 rounded-full w-11 cursor-pointer transition-colors ${q.showCorrectAnswer ? 'bg-green-500' : 'bg-gray-600'}`}
                >
                    <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${q.showCorrectAnswer ? 'translate-x-6' : 'translate-x-1'}`} />
                </div>
              </div>
            </div>
          </div>
        ))}
        <button onClick={addQuestion} className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 rounded-md text-white font-semibold transition-colors flex items-center justify-center gap-2">
            <PlusIcon className="w-5 h-5" /> Add another
        </button>
      </div>
    );
  };

  return (
    <div className="p-4 bg-slate-800 text-white h-full flex flex-col space-y-4">
      <div className="flex-1 overflow-y-auto pr-2 space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Audio Source</h3>
          <div className="grid grid-cols-3 gap-2">
            <button className="p-2 bg-slate-700 rounded text-center">Upload</button>
            <button className="p-2 bg-slate-700 rounded text-center">Record</button>
            <button className="p-2 bg-slate-700 rounded text-center">URL</button>
          </div>
          <input
            type="text"
            placeholder="Paste audio URL"
            value={internalEvent.audioUrl || ''}
            onChange={e => handleUpdate('audioUrl', e.target.value)}
            className="w-full p-2 bg-slate-600 rounded mt-2"
          />
        </div>

        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <label className="text-sm text-slate-300">Auto start playback</label>
                <div
                    onClick={() => handleUpdate('autoStartPlayback', !internalEvent.autoStartPlayback)}
                    className={`relative inline-flex items-center h-6 rounded-full w-11 cursor-pointer transition-colors ${internalEvent.autoStartPlayback ? 'bg-green-500' : 'bg-gray-600'}`}
                >
                    <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${internalEvent.autoStartPlayback ? 'translate-x-6' : 'translate-x-1'}`} />
                </div>
            </div>
            <div className="flex items-center justify-between">
                <label className="text-sm text-slate-300">Show player controls</label>
                <div
                    onClick={() => handleUpdate('audioShowControls', !internalEvent.audioShowControls)}
                    className={`relative inline-flex items-center h-6 rounded-full w-11 cursor-pointer transition-colors ${internalEvent.audioShowControls ? 'bg-green-500' : 'bg-gray-600'}`}
                >
                    <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${internalEvent.audioShowControls ? 'translate-x-6' : 'translate-x-1'}`} />
                </div>
            </div>
            <div className="flex items-center justify-between">
                <label className="text-sm text-slate-300">Allow playback speed adjustment</label>
                <div
                    onClick={() => handleUpdate('allowPlaybackSpeedAdjustment', !internalEvent.allowPlaybackSpeedAdjustment)}
                    className={`relative inline-flex items-center h-6 rounded-full w-11 cursor-pointer transition-colors ${internalEvent.allowPlaybackSpeedAdjustment ? 'bg-green-500' : 'bg-gray-600'}`}
                >
                    <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${internalEvent.allowPlaybackSpeedAdjustment ? 'translate-x-6' : 'translate-x-1'}`} />
                </div>
            </div>
            <div className="flex items-center justify-between">
                <label className="text-sm text-slate-300">Show subtitles</label>
                <div
                    onClick={() => handleUpdate('showSubtitles', !internalEvent.showSubtitles)}
                    className={`relative inline-flex items-center h-6 rounded-full w-11 cursor-pointer transition-colors ${internalEvent.showSubtitles ? 'bg-green-500' : 'bg-gray-600'}`}
                >
                    <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${internalEvent.showSubtitles ? 'translate-x-6' : 'translate-x-1'}`} />
                </div>
            </div>
            <div className="flex items-center justify-between">
                <label className="text-sm text-slate-300">Include quiz questions</label>
                <div
                    onClick={() => handleUpdate('includeQuiz', !internalEvent.includeQuiz)}
                    className={`relative inline-flex items-center h-6 rounded-full w-11 cursor-pointer transition-colors ${internalEvent.includeQuiz ? 'bg-green-500' : 'bg-gray-600'}`}
                >
                    <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${internalEvent.includeQuiz ? 'translate-x-6' : 'translate-x-1'}`} />
                </div>
            </div>
        </div>

        {renderQuizQuestions()}
      </div>

      <div className="p-4 border-t border-slate-700">
        <button
          onClick={onClose}
          className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 rounded-md text-white font-semibold transition-colors"
        >
          Save and close
        </button>
      </div>
    </div>
  );
};

export default PlayAudioEventEditor;
