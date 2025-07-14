import React from 'react';
import { TimelineEventData } from '../../../shared/types';
import { MobileSlider } from './MobileSlider';

interface MobileTextSettingsProps {
  event: TimelineEventData;
  onUpdate: (event: Partial<TimelineEventData>) => void;
}

export const MobileTextSettings: React.FC<MobileTextSettingsProps> = ({ event, onUpdate }) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300">Text Content</label>
        <textarea
          value={event.textContent || ''}
          onChange={(e) => onUpdate({ textContent: e.target.value })}
          className="w-full bg-slate-700 text-white rounded-lg p-2 mt-1"
          rows={5}
        />
      </div>
      <MobileSlider
        label="Font Size"
        min={12}
        max={48}
        value={event.size?.width || 16}
        onChange={(value) => onUpdate({ size: { ...(event.size || { width: 16, height: 0 }), width: value } })}
        unit="px"
      />
    </div>
  );
};
