import React from 'react';
import { TimelineEventData } from '../../../../shared/type-defs';

const inputClasses = "w-full bg-slate-700 p-2 rounded border border-slate-600 focus:ring-purple-500 focus:border-purple-500";
const labelClasses = "block text-sm font-medium text-slate-300 mb-1";

interface InteractionEditorProps {
  event: TimelineEventData;
  onUpdate: (updates: Partial<TimelineEventData>) => void;
}

/**
 * Placeholder component for editing video interactions.
 *
 * This is a temporary implementation. The final version should include:
 * - Video file upload and management
 * - Video preview and thumbnail generation
 * - Advanced timing and clipping controls
 * - Video quality and compression options
 */
const VideoInteractionEditor: React.FC<InteractionEditorProps> = React.memo(({ event, onUpdate }) => {
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
                              const startTimeValue = e.target.value;
                              if (startTimeValue) {
                                const numValue = parseInt(startTimeValue, 10);
                                if (!isNaN(numValue)) {
                                  onUpdate({ youtubeStartTime: numValue });
                                }
                              } else {
                                onUpdate({ youtubeStartTime: null });
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
                              const endTimeValue = e.target.value;
                              if (endTimeValue) {
                                const numValue = parseInt(endTimeValue, 10);
                                if (!isNaN(numValue)) {
                                  onUpdate({ youtubeEndTime: numValue });
                                }
                              } else {
                                onUpdate({ youtubeEndTime: null });
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
});
VideoInteractionEditor.displayName = 'VideoInteractionEditor';

export default VideoInteractionEditor;
