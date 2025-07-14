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
      <MobileMediaUpload
        mediaType={event.mediaType || 'image'}
        url={event.mediaUrl || ''}
        onMediaTypeChange={handleMediaTypeChange}
        onUrlChange={(url) => onUpdate({ mediaUrl: url })}
      />
      <MobileToggle
        label="Auto-play"
        enabled={event.autoplay || false}
        onChange={(enabled) => onUpdate({ autoplay: enabled })}
      />
    </div>
  );
};
