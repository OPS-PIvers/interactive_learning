import React from 'react';
import { TimelineEventData } from '../../shared/types';
import { XMarkIcon } from './icons/XMarkIcon';
import PanZoomSettings from './PanZoomSettings';
import SpotlightSettings from './SpotlightSettings';
import { InteractionType } from '../../shared/InteractionPresets';
import { TrashIcon } from './icons/TrashIcon';
import { PlusIcon } from './icons/PlusIcon';
import { Z_INDEX_TAILWIND } from '../utils/zIndexLevels';

interface InteractionEditorProps {
  event: TimelineEventData;
  onUpdate: (updates: Partial<TimelineEventData>) => void;
}

/**
 * Placeholder component for editing text interactions.
 * 
 * This is a temporary implementation. The final version should include:
 * - Rich text editing capabilities
 * - Text formatting options (bold, italic, colors)
 * - Advanced positioning and sizing controls
 * - Text animation and transition effects
 */
const TextInteractionEditor: React.FC<InteractionEditorProps> = ({ event, onUpdate }) => {
    const inputClasses = "w-full bg-gray-700 p-2 rounded border border-gray-600 focus:ring-purple-500 focus:border-purple-500";
    const labelClasses = "block text-sm font-medium text-gray-300 mb-1";

    return (
        <div className="space-y-4">
            <div>
                <label htmlFor="textContent" className={labelClasses}>Text Content</label>
                <textarea
                    id="textContent"
                    value={event.textContent || ''}
                    onChange={e => onUpdate({ textContent: e.target.value })}
                    className={`${inputClasses} min-h-[80px]`}
                    rows={4}
                />
            </div>
            <div>
                <label htmlFor="textPosition" className={labelClasses}>Position</label>
                <select
                    id="textPosition"
                    value={event.textPosition || 'center'}
                    onChange={e => onUpdate({ textPosition: e.target.value as 'center' | 'custom' })}
                    className={inputClasses}
                >
                    <option value="center">Center</option>
                    <option value="custom">Custom</option>
                </select>
            </div>
            {event.textPosition === 'custom' && (
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="textX" className={labelClasses}>X (%)</label>
                        <input
                            id="textX"
                            type="number"
                            value={event.textX || 50}
                            onChange={e => onUpdate({ textX: parseInt(e.target.value, 10) })}
                            className={inputClasses}
                        />
                    </div>
                    <div>
                        <label htmlFor="textY" className={labelClasses}>Y (%)</label>
                        <input
                            id="textY"
                            type="number"
                            value={event.textY || 50}
                            onChange={e => onUpdate({ textY: parseInt(e.target.value, 10) })}
                            className={inputClasses}
                        />
                    </div>
                </div>
            )}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="textWidth" className={labelClasses}>Width (px)</label>
                    <input
                        id="textWidth"
                        type="number"
                        value={event.textWidth || 300}
                        onChange={e => onUpdate({ textWidth: parseInt(e.target.value, 10) })}
                        className={inputClasses}
                    />
                </div>
                <div>
                    <label htmlFor="textHeight" className={labelClasses}>Height (px)</label>
                    <input
                        id="textHeight"
                        type="number"
                        value={event.textHeight || 100}
                        onChange={e => onUpdate({ textHeight: parseInt(e.target.value, 10) })}
                        className={inputClasses}
                    />
                </div>
            </div>
        </div>
    );
};

/**
 * Placeholder component for editing audio interactions.
 * 
 * This is a temporary implementation. The final version should include:
 * - Audio file upload and management
 * - Waveform visualization and editing
 * - Advanced playback controls and timing
 * - Audio effects and processing options
 */
const AudioInteractionEditor: React.FC<InteractionEditorProps> = ({ event, onUpdate }) => {
    const inputClasses = "w-full bg-gray-700 p-2 rounded border border-gray-600 focus:ring-purple-500 focus:border-purple-500";
    const labelClasses = "block text-sm font-medium text-gray-300 mb-1";
    const checkboxLabelClasses = "flex items-center space-x-2 cursor-pointer text-sm text-gray-300";
    const checkboxInputClasses = "form-checkbox h-4 w-4 text-purple-600 bg-slate-600 border-slate-500 rounded focus:ring-purple-500";

    return (
        <div className="space-y-4">
            <div>
                <label htmlFor="audioUrl" className={labelClasses}>Audio URL</label>
                <input
                    id="audioUrl"
                    type="text"
                    value={event.audioUrl || ''}
                    onChange={e => onUpdate({ audioUrl: e.target.value })}
                    className={inputClasses}
                    placeholder="https://example.com/audio.mp3"
                />
            </div>
            <div>
                <label htmlFor="audioDisplayMode" className={labelClasses}>Display Mode</label>
                <select
                    id="audioDisplayMode"
                    value={event.audioDisplayMode || 'background'}
                    onChange={e => onUpdate({ audioDisplayMode: e.target.value as 'background' | 'modal' | 'mini-player' })}
                    className={inputClasses}
                >
                    <option value="background">Background</option>
                    <option value="modal">Modal</option>
                    <option value="mini-player">Mini-Player</option>
                </select>
            </div>
            <div>
                <label htmlFor="volume" className={labelClasses}>Volume</label>
                <input
                    id="volume"
                    type="range"
                    min="0"
                    max="100"
                    value={event.volume === undefined ? 80 : event.volume}
                    onChange={e => onUpdate({ volume: parseInt(e.target.value, 10) })}
                    className="w-full"
                />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <label className={checkboxLabelClasses}>
                    <input
                        type="checkbox"
                        checked={!!event.audioShowControls}
                        onChange={e => onUpdate({ audioShowControls: e.target.checked })}
                        className={checkboxInputClasses}
                    />
                    <span>Show Controls</span>
                </label>
                <label className={checkboxLabelClasses}>
                    <input
                        type="checkbox"
                        checked={!!event.autoplay}
                        onChange={e => onUpdate({ autoplay: e.target.checked })}
                        className={checkboxInputClasses}
                    />
                    <span>Autoplay</span>
                </label>
                <label className={checkboxLabelClasses}>
                    <input
                        type="checkbox"
                        checked={!!event.loop}
                        onChange={e => onUpdate({ loop: e.target.checked })}
                        className={checkboxInputClasses}
                    />
                    <span>Loop</span>
                </label>
            </div>
        </div>
    );
};

/**
 * Placeholder component for editing video interactions.
 * 
 * This is a temporary implementation. The final version should include:
 * - Video file upload and management
 * - Video preview and thumbnail generation
 * - Advanced timing and clipping controls
 * - Video quality and compression options
 */
const VideoInteractionEditor: React.FC<InteractionEditorProps> = ({ event, onUpdate }) => {
    const inputClasses = "w-full bg-gray-700 p-2 rounded border border-gray-600 focus:ring-purple-500 focus:border-purple-500";
    const labelClasses = "block text-sm font-medium text-gray-300 mb-1";
    const checkboxLabelClasses = "flex items-center space-x-2 cursor-pointer text-sm text-gray-300";
    const checkboxInputClasses = "form-checkbox h-4 w-4 text-purple-600 bg-slate-600 border-slate-500 rounded focus:ring-purple-500";

    const isYouTube = event.videoSource === 'youtube';

    return (
        <div className="space-y-4">
            <div>
                <label htmlFor="videoSource" className={labelClasses}>Video Source</label>
                <select
                    id="videoSource"
                    value={event.videoSource || 'url'}
                    onChange={e => {
                        const newSource = e.target.value as 'url' | 'youtube';
                        onUpdate({ videoSource: newSource, videoUrl: '', youtubeVideoId: '' });
                    }}
                    className={inputClasses}
                >
                    <option value="url">URL</option>
                    <option value="youtube">YouTube</option>
                </select>
            </div>

            {isYouTube ? (
                <div>
                    <label htmlFor="youtubeVideoId" className={labelClasses}>YouTube Video ID</label>
                    <input
                        id="youtubeVideoId"
                        type="text"
                        value={event.youtubeVideoId || ''}
                        onChange={e => onUpdate({ youtubeVideoId: e.target.value })}
                        className={inputClasses}
                        placeholder="e.g. dQw4w9WgXcQ"
                    />
                </div>
            ) : (
                <div>
                    <label htmlFor="videoUrl" className={labelClasses}>Video URL</label>
                    <input
                        id="videoUrl"
                        type="text"
                        value={event.videoUrl || ''}
                        onChange={e => onUpdate({ videoUrl: e.target.value })}
                        className={inputClasses}
                        placeholder="https://example.com/video.mp4"
                    />
                </div>
            )}

            <div>
                <label htmlFor="videoDisplayMode" className={labelClasses}>Display Mode</label>
                <select
                    id="videoDisplayMode"
                    value={event.videoDisplayMode || 'inline'}
                    onChange={e => onUpdate({ videoDisplayMode: e.target.value as 'inline' | 'modal' | 'overlay' })}
                    className={inputClasses}
                >
                    <option value="inline">Inline</option>
                    <option value="modal">Modal</option>
                    <option value="overlay">Overlay</option>
                </select>
            </div>

            {isYouTube && (
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="youtubeStartTime" className={labelClasses}>Start Time (s)</label>
                        <input
                            id="youtubeStartTime"
                            type="number"
                            value={event.youtubeStartTime || ''}
                            onChange={e => {
                              const value = e.target.value;
                              if (value) {
                                const numValue = parseInt(value, 10);
                                if (!isNaN(numValue)) {
                                  onUpdate({ youtubeStartTime: numValue });
                                }
                              } else {
                                const updates: any = { youtubeStartTime: undefined };
                                delete updates.youtubeStartTime;
                                onUpdate(updates);
                              }
                            }}
                            className={inputClasses}
                        />
                    </div>
                    <div>
                        <label htmlFor="youtubeEndTime" className={labelClasses}>End Time (s)</label>
                        <input
                            id="youtubeEndTime"
                            type="number"
                            value={event.youtubeEndTime || ''}
                            onChange={e => {
                              const value = e.target.value;
                              if (value) {
                                const numValue = parseInt(value, 10);
                                if (!isNaN(numValue)) {
                                  onUpdate({ youtubeEndTime: numValue });
                                }
                              } else {
                                const updates: any = { youtubeEndTime: undefined };
                                delete updates.youtubeEndTime;
                                onUpdate(updates);
                              }
                            }}
                            className={inputClasses}
                        />
                    </div>
                </div>
            )}

            <div className="grid grid-cols-2 gap-4">
                <label className={checkboxLabelClasses}>
                    <input
                        type="checkbox"
                        checked={!!event.videoShowControls}
                        onChange={e => onUpdate({ videoShowControls: e.target.checked })}
                        className={checkboxInputClasses}
                    />
                    <span>Show Controls</span>
                </label>
                <label className={checkboxLabelClasses}>
                    <input
                        type="checkbox"
                        checked={!!event.autoplay}
                        onChange={e => onUpdate({ autoplay: e.target.checked })}
                        className={checkboxInputClasses}
                    />
                    <span>Autoplay</span>
                </label>
                <label className={checkboxLabelClasses}>
                    <input
                        type="checkbox"
                        checked={!!event.loop}
                        onChange={e => onUpdate({ loop: e.target.checked })}
                        className={checkboxInputClasses}
                    />
                    <span>Loop</span>
                </label>
            </div>
        </div>
    );
};

/**
 * Placeholder component for editing quiz interactions.
 * 
 * This is a temporary implementation. The final version should include:
 * - Advanced question types (multiple choice, fill-in-the-blank, drag-and-drop)
 * - Question randomization and shuffling
 * - Detailed explanation and feedback systems
 * - Quiz analytics and progress tracking
 */
const QuizInteractionEditor: React.FC<InteractionEditorProps> = ({ event, onUpdate }) => {
    const inputClasses = "w-full bg-gray-700 p-2 rounded border border-gray-600 focus:ring-purple-500 focus:border-purple-500";
    const labelClasses = "block text-sm font-medium text-gray-300 mb-1";

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
                        <div key={index} className="flex items-center space-x-2">
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
};


interface InteractionSettingsModalProps {
  isOpen: boolean;
  event: TimelineEventData | null;
  onUpdate: (event: TimelineEventData) => void;
  onClose: () => void;
}

const InteractionSettingsModal: React.FC<InteractionSettingsModalProps> = ({
  isOpen,
  event,
  onUpdate,
  onClose,
}) => {
  if (!isOpen || !event) {
    return null;
  }

  const handleUpdate = (updates: Partial<TimelineEventData>) => {
    onUpdate({ ...event, ...updates });
  };

  const renderEditorForEvent = () => {
    switch (event.type) {
      case InteractionType.PAN_ZOOM:
      case InteractionType.PAN_ZOOM_TO_HOTSPOT:
        return (
          <PanZoomSettings
            zoomLevel={event.zoomLevel || 2}
            onZoomChange={(zoom) => handleUpdate({ zoomLevel: zoom })}
            showTextBanner={!!event.showTextBanner}
            onShowTextBannerChange={(value) => handleUpdate({ showTextBanner: value })}
          />
        );
      case InteractionType.SPOTLIGHT:
        return (
          <SpotlightSettings
            shape={event.spotlightShape || 'circle'}
            onShapeChange={(shape) => handleUpdate({ spotlightShape: shape })}
            dimPercentage={event.backgroundDimPercentage || 70}
            onDimPercentageChange={(dim) => handleUpdate({ backgroundDimPercentage: dim })}
            showTextBanner={event.showTextBanner || false}
            onShowTextBannerChange={(value) => handleUpdate({ showTextBanner: value })}
          />
        );
      case InteractionType.SHOW_TEXT:
        return <TextInteractionEditor event={event} onUpdate={handleUpdate} />;
      case InteractionType.PLAY_AUDIO:
        return <AudioInteractionEditor event={event} onUpdate={handleUpdate} />;
      case InteractionType.PLAY_VIDEO:
        return <VideoInteractionEditor event={event} onUpdate={handleUpdate} />;
      case InteractionType.QUIZ:
        return <QuizInteractionEditor event={event} onUpdate={handleUpdate} />;
      default:
        return <div className="text-center py-4 text-gray-400">No specific editor available for this interaction type.</div>;
    }
  };

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-60 ${Z_INDEX_TAILWIND.MODAL_BACKDROP} flex items-center justify-center`} onClick={onClose}>
      <div className="bg-gray-800 text-white rounded-lg shadow-xl p-4 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
          <h2 className="text-lg font-semibold">Edit: {event.name}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-700 rounded-full">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-4">
          {renderEditorForEvent()}
        </div>
      </div>
    </div>
  );
};

export default InteractionSettingsModal;
