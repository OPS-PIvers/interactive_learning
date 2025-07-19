import React from 'react';
import { MobileMediaUpload } from './MobileMediaUpload';
import { MobileToggle } from './MobileToggle';
import { TimelineEventData, InteractionType } from '../../../shared/types';

interface MobileMediaSettingsProps {
  event: TimelineEventData;
  onUpdate: (event: Partial<TimelineEventData>) => void;
}

export const MobileMediaSettings: React.FC<MobileMediaSettingsProps> = ({ event, onUpdate }) => {
  const handleMediaTypeChange = (mediaType: 'image' | 'video' | 'audio' | 'youtube') => {
    let type: InteractionType;
    switch (mediaType) {
      case 'image':
        type = InteractionType.SHOW_IMAGE_MODAL;
        break;
      case 'video':
        type = InteractionType.SHOW_VIDEO;
        break;
      case 'audio':
        type = InteractionType.SHOW_AUDIO_MODAL;
        break;
      case 'youtube':
        type = InteractionType.SHOW_YOUTUBE;
        break;
    }
    onUpdate({ mediaType, type });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Media Type</label>
        <div className="flex space-x-2">
          {(['image', 'video', 'audio', 'youtube'] as const).map((mediaType) => (
            <button
              key={mediaType}
              onClick={() => handleMediaTypeChange(mediaType)}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                event.mediaType === mediaType
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-600 text-gray-300'
              }`}
              aria-label={`Set media type to ${mediaType}`}
              aria-pressed={event.mediaType === mediaType}
            >
              {mediaType.charAt(0).toUpperCase() + mediaType.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <MobileMediaUpload
        label="Upload Media"
        onUpload={(file) => {
          // Here you would typically upload the file and get a URL
          console.log('Uploaded file:', file.name);
          // For now, we'll just pretend we got a URL
          onUpdate({ mediaUrl: `/${file.name}` });
        }}
      />
      <MobileToggle
        label="Auto-play"
        enabled={event.autoplay || false}
        onChange={(enabled) => onUpdate({ autoplay: enabled })}
      />
    </div>
  );
};
