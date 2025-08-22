import React from 'react';
import { TimelineEventData } from '../../../../shared/type-defs';

const inputClasses = "w-full bg-slate-700 p-2 rounded border border-slate-600 focus:ring-purple-500 focus:border-purple-500";
const labelClasses = "block text-sm font-medium text-slate-300 mb-1";

interface InteractionEditorProps {
  event: TimelineEventData;
  onUpdate: (updates: Partial<TimelineEventData>) => void;
}

/**
 * Placeholder component for editing audio interactions.
 *
 * This is a temporary implementation. The final version should include:
 * - Audio file upload and management
 * - Waveform visualization and editing
 * - Advanced playback controls and timing
 * - Audio effects and processing options
 */
const AudioInteractionEditor: React.FC<InteractionEditorProps> = React.memo(({ event, onUpdate }) => {
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
});
AudioInteractionEditor.displayName = 'AudioInteractionEditor';

export default AudioInteractionEditor;
