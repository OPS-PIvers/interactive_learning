import React, { useState, useRef } from 'react';
import { TimelineEventData, InteractionType, MediaQuizTrigger } from '../../shared/types';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';

interface MobilePlayAudioEditorProps {
  event: TimelineEventData;
  onUpdate: (event: TimelineEventData) => void;
  onClose: () => void;
}

const MobilePlayAudioEditor: React.FC<MobilePlayAudioEditorProps> = ({ event, onUpdate, onClose }) => {
  const [internalEvent, setInternalEvent] = useState<TimelineEventData>(event);

  const handleUpdate = <K extends keyof TimelineEventData>(field: K, value: TimelineEventData[K]) => {
    setInternalEvent(prev => ({ ...prev, [field]: value }));
  };

  const handleQuizChange = (index: number, field: keyof MediaQuizTrigger, value: any) => {
    const newQuizTriggers = [...(internalEvent.quizTriggers || [])];
    newQuizTriggers[index] = { ...newQuizTriggers[index], [field]: value };
    handleUpdate('quizTriggers', newQuizTriggers);
  };

  const quizIdCounter = useRef(0);

  const addQuizQuestion = () => {
    const newQuestion: MediaQuizTrigger = {
      id: `quiz_${++quizIdCounter.current}`,
      timestamp: 0,
      pauseMedia: true,
      quiz: {
        question: '',
        options: ['', ''],
        correctAnswer: 0,
      },
      resumeAfterCompletion: true,
    };
    handleUpdate('quizTriggers', [...(internalEvent.quizTriggers || []), newQuestion]);
  };

  const removeQuizQuestion = (index: number) => {
    const newQuizTriggers = [...(internalEvent.quizTriggers || [])];
    newQuizTriggers.splice(index, 1);
    handleUpdate('quizTriggers', newQuizTriggers);
  };

  const handleSave = () => {
    onUpdate(internalEvent);
    onClose();
  };

  return (
    <div className="p-4 bg-gray-800 text-white">
      <h3 className="text-lg font-bold mb-4">Play Audio Event</h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Audio Source</label>
          <div className="flex space-x-2 mt-1">
            <button className="flex-1 py-2 px-4 bg-blue-600 rounded">Upload Audio</button>
            <button className="flex-1 py-2 px-4 bg-blue-600 rounded">Record</button>
          </div>
          <input
            type="text"
            placeholder="Or paste audio URL"
            className="w-full mt-2 p-2 bg-gray-700 rounded"
            value={internalEvent.audioUrl || ''}
            onChange={(e) => handleUpdate('audioUrl', e.target.value)}
          />
        </div>

        <div className="flex items-center justify-between">
          <label>Auto start playback</label>
          <input
            type="checkbox"
            checked={internalEvent.autoplay || false}
            onChange={(e) => handleUpdate('autoplay', e.target.checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <label>Show player controls</label>
          <input
            type="checkbox"
            checked={internalEvent.audioShowControls || false}
            onChange={(e) => handleUpdate('audioShowControls', e.target.checked)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Start at (seconds)</label>
            <input
              type="number"
              placeholder="0"
              className="w-full mt-1 p-2 bg-gray-700 rounded"
              value={internalEvent.audioStartTime ?? ''}
              onChange={(e) => {
                const value = parseInt(e.target.value, 10);
                handleUpdate('audioStartTime', isNaN(value) ? undefined : value);
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">End at (seconds)</label>
            <input
              type="number"
              placeholder="End of audio"
              className="w-full mt-1 p-2 bg-gray-700 rounded"
              value={internalEvent.audioEndTime ?? ''}
              onChange={(e) => {
                const value = parseInt(e.target.value, 10);
                handleUpdate('audioEndTime', isNaN(value) ? undefined : value);
              }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <label>Include quiz questions</label>
          <input
            type="checkbox"
            checked={!!internalEvent.quizTriggers}
            onChange={(e) => handleUpdate('quizTriggers', e.target.checked ? [] : undefined)}
          />
        </div>

        {internalEvent.quizTriggers && (
          <div className="space-y-4 p-4 bg-gray-700 rounded">
            {internalEvent.quizTriggers.map((quiz, index) => (
              <div key={quiz.id} className="p-2 border border-gray-600 rounded">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold">Question {index + 1}</h4>
                  <button onClick={() => removeQuizQuestion(index)} className="p-1 text-red-500">
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-2 mt-2">
                  <input
                    type="number"
                    placeholder="Timestamp (seconds)"
                    className="w-full p-2 bg-gray-600 rounded"
                    value={quiz.timestamp}
                    onChange={(e) => handleQuizChange(index, 'timestamp', parseInt(e.target.value))}
                  />
                  <select
                    className="w-full p-2 bg-gray-600 rounded"
                    value={quiz.quiz.questionType || 'multiple-choice'}
                    onChange={(e) => {
                      const newType = e.target.value;
                      const newCorrectAnswer = newType === 'multiple-choice' ? 0 : '';
                      handleQuizChange(index, 'quiz', { ...quiz.quiz, questionType: newType, correctAnswer: newCorrectAnswer });
                    }}
                  >
                    <option value="multiple-choice">Multiple Choice</option>
                    <option value="fill-in-the-blank">Fill in the Blank</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Question"
                    className="w-full p-2 bg-gray-600 rounded"
                    value={quiz.quiz.question}
                    onChange={(e) => handleQuizChange(index, 'quiz', { ...quiz.quiz, question: e.target.value })}
                  />
                  {quiz.quiz.questionType === 'multiple-choice' && (
                    <div className="space-y-2">
                      {quiz.quiz.options.map((option, optionIndex) => (
                        <div key={optionIndex} className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name={`quiz-correct-answer-${index}`}
                            checked={quiz.quiz.correctAnswer === optionIndex}
                            onChange={() => handleQuizChange(index, 'quiz', { ...quiz.quiz, correctAnswer: optionIndex })}
                            aria-label={`Select option ${optionIndex + 1} as correct answer`}
                          />
                          <input
                            type="text"
                            placeholder={`Option ${optionIndex + 1}`}
                            className="flex-1 p-2 bg-gray-500 rounded"
                            value={option}
                            onChange={(e) => {
                              const newOptions = [...quiz.quiz.options];
                              newOptions[optionIndex] = e.target.value;
                              handleQuizChange(index, 'quiz', { ...quiz.quiz, options: newOptions });
                            }}
                          />
                        </div>
                      ))}
                      <button
                        onClick={() => {
                          const newOptions = [...quiz.quiz.options, ''];
                          handleQuizChange(index, 'quiz', { ...quiz.quiz, options: newOptions });
                        }}
                        className="text-blue-400 text-sm"
                      >
                        Add another option
                      </button>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <label className="text-sm">Show correct answer</label>
                    <input
                      type="checkbox"
                      checked={quiz.quiz.showExplanation || false}
                      onChange={(e) => handleQuizChange(index, 'quiz', { ...quiz.quiz, showExplanation: e.target.checked })}
                    />
                  </div>
                  {quiz.quiz.questionType === 'fill-in-the-blank' && (
                    <input
                      type="text"
                      placeholder="Correct Answer"
                      className="w-full p-2 bg-gray-500 rounded"
                      value={quiz.quiz.correctAnswer}
                      onChange={(e) => handleQuizChange(index, 'quiz', { ...quiz.quiz, correctAnswer: e.target.value })}
                    />
                  )}
                </div>
              </div>
            ))}
            <button onClick={addQuizQuestion} className="w-full py-2 px-4 bg-blue-600 rounded flex items-center justify-center">
              <PlusIcon className="w-5 h-5 mr-2" />
              Add another question
            </button>
          </div>
        )}
      </div>

      <div className="mt-6">
        <button onClick={handleSave} className="w-full py-3 px-4 bg-green-600 rounded text-white font-bold">
          Save and close
        </button>
      </div>
    </div>
  );
};

export default MobilePlayAudioEditor;
