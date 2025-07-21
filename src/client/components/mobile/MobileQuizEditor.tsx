import React, { useState, useEffect } from 'react';
import { TimelineEventData } from '../../../shared/types';
import { CameraIcon, PlayIcon, SpeakerWaveIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

interface MobileQuizEditorProps {
    event: TimelineEventData;
    onUpdate: (event: TimelineEventData) => void;
    onClose: () => void;
}

type QuestionMedia = 'text' | 'image' | 'audio' | 'video';

const MobileQuizEditor: React.FC<MobileQuizEditorProps> = ({ event, onUpdate, onClose }) => {
    const [internalEvent, setInternalEvent] = useState<TimelineEventData>(event);
    const [questionMedia, setQuestionMedia] = useState<QuestionMedia>('text');

    useEffect(() => {
        setInternalEvent(event);
    }, [event]);

    const handleUpdate = (field: keyof TimelineEventData, value: any) => {
        const updatedEvent = { ...internalEvent, [field]: value };
        setInternalEvent(updatedEvent);
        onUpdate(updatedEvent);
    };

    const renderQuestionTypeSelector = () => {
        return (
            <div className="flex items-center space-x-2 p-1 bg-slate-700 rounded-lg">
                {(['text', 'image', 'audio', 'video'] as QuestionMedia[]).map(media => (
                    <button
                        key={media}
                        onClick={() => setQuestionMedia(media)}
                        className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                            questionMedia === media ? 'bg-purple-600 text-white' : 'bg-transparent text-slate-300 hover:bg-slate-600'
                        }`}
                    >
                        {media.charAt(0).toUpperCase() + media.slice(1)}
                    </button>
                ))}
            </div>
        );
    };

    const renderQuestionContent = () => {
        switch (questionMedia) {
            case 'image':
                return <div>Image upload placeholder</div>;
            case 'audio':
                return <div>Audio upload placeholder</div>;
            case 'video':
                return <div>Video upload placeholder</div>;
            case 'text':
            default:
                return (
                    <textarea
                        value={internalEvent.quizQuestion || ''}
                        onChange={(e) => handleUpdate('quizQuestion', e.target.value)}
                        placeholder="e.g., What is the capital of France?"
                        className="w-full p-3 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:ring-purple-500 focus:border-purple-500"
                        rows={3}
                    />
                );
        }
    };

    const renderAnswerEditor = () => {
        if (internalEvent.questionType === 'fill-in-the-blank') {
            return (
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Correct Answer</label>
                    <input
                        type="text"
                        value={(internalEvent.quizCorrectAnswer as string) || ''}
                        onChange={(e) => handleUpdate('quizCorrectAnswer', e.target.value)}
                        placeholder="Enter the correct answer"
                        className="w-full p-3 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:ring-purple-500 focus:border-purple-500"
                    />
                </div>
            );
        }

        // Multiple choice is the default
        return (
            <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Options</label>
                <div className="space-y-2">
                    {(internalEvent.quizOptions || []).map((option, index) => (
                        <div key={index} className="flex items-center space-x-2">
                            <input
                                type="text"
                                value={option}
                                onChange={(e) => {
                                    const newOptions = [...(internalEvent.quizOptions || [])];
                                    newOptions[index] = e.target.value;
                                    handleUpdate('quizOptions', newOptions);
                                }}
                                className="flex-grow p-3 bg-slate-700 border border-slate-600 rounded-md text-white"
                                placeholder={`Option ${index + 1}`}
                            />
                            <button
                                onClick={() => handleUpdate('quizCorrectAnswer', index)}
                                className={`w-10 h-10 flex items-center justify-center rounded-full ${
                                    internalEvent.quizCorrectAnswer === index ? 'bg-green-500' : 'bg-slate-600'
                                }`}
                            >
                                ✔
                            </button>
                        </div>
                    ))}
                    <button
                        onClick={() => {
                            const newOptions = [...(internalEvent.quizOptions || []), ''];
                            handleUpdate('quizOptions', newOptions);
                        }}
                        className="w-full py-2 text-purple-400 border-2 border-purple-400 rounded-md"
                    >
                        Add Option
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="p-4 space-y-4">
            <h3 className="text-lg font-medium text-white">Quiz Editor</h3>

            <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Question Type</label>
                <div className="flex items-center space-x-2 p-1 bg-slate-700 rounded-lg">
                    <button
                        onClick={() => handleUpdate('questionType', 'multiple-choice')}
                        className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                            internalEvent.questionType === 'multiple-choice' ? 'bg-purple-600 text-white' : 'bg-transparent text-slate-300 hover:bg-slate-600'
                        }`}
                    >
                        Multiple Choice
                    </button>
                    <button
                        onClick={() => handleUpdate('questionType', 'fill-in-the-blank')}
                        className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                            internalEvent.questionType === 'fill-in-the-blank' ? 'bg-purple-600 text-white' : 'bg-transparent text-slate-300 hover:bg-slate-600'
                        }`}
                    >
                        Fill-in-the-Blank
                    </button>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Question</label>
                {renderQuestionTypeSelector()}
                <div className="mt-2">{renderQuestionContent()}</div>
            </div>

            {renderAnswerEditor()}

            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <label htmlFor="showCorrectAnswer" className="text-sm text-slate-300">Show correct answer after submission</label>
                    <input
                        id="showCorrectAnswer"
                        type="checkbox"
                        checked={internalEvent.quizShuffleOptions || false}
                        onChange={(e) => handleUpdate('quizShuffleOptions', e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                </div>
                <div className="flex items-center justify-between">
                    <label htmlFor="isSubjective" className="text-sm text-slate-300">Subjective question (no correct answer)</label>
                    <input
                        id="isSubjective"
                        type="checkbox"
                        checked={internalEvent.isSubjective || false}
                        onChange={(e) => handleUpdate('isSubjective', e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                </div>
            </div>

            <button
                onClick={() => {
                    // Logic to add a new question will be handled in the parent component
                }}
                className="w-full py-2 text-purple-400 border-2 border-purple-400 rounded-md mt-4"
            >
                Add Another Question
            </button>

            <button onClick={onClose} className="w-full py-2 bg-slate-600 text-white rounded-md mt-2">
                Done
            </button>
        </div>
    );
};

export default MobileQuizEditor;
