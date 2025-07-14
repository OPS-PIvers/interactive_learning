import React from 'react';
import { MobileMediaUpload } from './MobileMediaUpload';
import { MobileToggle } from './MobileToggle';
import { MediaEvent, MediaType } from '../../../shared/types';

interface MobileMediaSettingsProps {
  settings: MediaEvent;
  onSettingsChange: (settings: MediaEvent) => void;
}

export const MobileMediaSettings: React.FC<MobileMediaSettingsProps> = ({
  settings,
  onSettingsChange,
}) => {
  const handleMediaTypeChange = (mediaType: MediaType) => {
    onSettingsChange({ ...settings, mediaType });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Media Type</label>
        <div className="flex space-x-2">
          {(['image', 'video', 'audio', 'youtube'] as MediaType[]).map((type) => (
            <button
              key={type}
              onClick={() => handleMediaTypeChange(type)}
              className={`flex-1 py-2 rounded font-medium transition-colors ${
                settings.mediaType === type
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-slate-600 hover:bg-slate-500 text-slate-200'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {settings.mediaType === 'youtube' ? (
        <div>
          <label htmlFor="youtube-url" className="block text-sm font-medium text-gray-300">
            YouTube URL
          </label>
          <input
            type="text"
            id="youtube-url"
            value={settings.url || ''}
            onChange={(e) => onSettingsChange({ ...settings, url: e.target.value })}
            className="mt-1 block w-full bg-slate-800 border-slate-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-white p-2"
          />
        </div>
      ) : (
        <MobileMediaUpload
          onUpload={(url) => onSettingsChange({ ...settings, url })}
        />
      )}

      <MobileToggle
        label="Auto Play"
        enabled={settings.autoPlay || false}
        onChange={(enabled) => onSettingsChange({ ...settings, autoPlay: enabled })}
      />
    </div>
  );
};
