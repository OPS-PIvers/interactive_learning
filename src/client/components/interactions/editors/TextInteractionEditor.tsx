import React from 'react';
import { TimelineEventData } from '../../../../shared/type-defs';

const inputClasses = "w-full bg-slate-700 p-2 rounded border border-slate-600 focus:ring-purple-500 focus:border-purple-500";
const labelClasses = "block text-sm font-medium text-slate-300 mb-1";

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
const TextInteractionEditor: React.FC<InteractionEditorProps> = React.memo(({ event, onUpdate }) => {
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
});
TextInteractionEditor.displayName = 'TextInteractionEditor';

export default TextInteractionEditor;
