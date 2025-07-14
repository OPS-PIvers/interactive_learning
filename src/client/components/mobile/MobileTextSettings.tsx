import React from 'react';
import { TextEvent } from '../../../shared/types';
import { MobileSlider } from './MobileSlider';

interface MobileTextSettingsProps {
  settings: TextEvent;
  onSettingsChange: (settings: TextEvent) => void;
}

export const MobileTextSettings: React.FC<MobileTextSettingsProps> = ({
  settings,
  onSettingsChange,
}) => {
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onSettingsChange({ ...settings, text: e.target.value });
  };

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="text-content" className="block text-sm font-medium text-gray-300">
          Text Content
        </label>
        <textarea
          id="text-content"
          rows={5}
          value={settings.text || ''}
          onChange={handleTextChange}
          className="mt-1 block w-full bg-slate-800 border-slate-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-white p-2"
        />
      </div>
      <MobileSlider
        label="Font Size"
        value={settings.fontSize || 16}
        min={10}
        max={48}
        step={2}
        unit="px"
        onChange={(value) => onSettingsChange({ ...settings, fontSize: value })}
      />
    </div>
  );
};
