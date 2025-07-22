import React from 'react';
import { TimelineEventData, InteractionType } from '../../../shared/types';
import { MobileSpotlightSettings } from './MobileSpotlightSettings';
import { MobilePanZoomSettings } from './MobilePanZoomSettings';
import { MobileMediaSettings } from './MobileMediaSettings';
import { MobileTextSettings } from './MobileTextSettings';
import { MobileQuizSettings } from './MobileQuizSettings';

interface MobileEventSettingsProps {
  event: TimelineEventData;
  onUpdate: (event: Partial<TimelineEventData>) => void;
}

export const MobileEventSettings: React.FC<MobileEventSettingsProps> = ({ event, onUpdate }) => {
  switch (event.type) {
    case InteractionType.SPOTLIGHT:
    case InteractionType.HIGHLIGHT_HOTSPOT:
    case InteractionType.PULSE_HOTSPOT:
    case InteractionType.PULSE_HIGHLIGHT:
      return <MobileSpotlightSettings event={event} onUpdate={onUpdate} />;
    
    case InteractionType.PAN_ZOOM:
    case InteractionType.PAN_ZOOM_TO_HOTSPOT:
      return <MobilePanZoomSettings event={event} onUpdate={onUpdate} />;
    
    case InteractionType.SHOW_VIDEO:
    case InteractionType.SHOW_AUDIO_MODAL:
    case InteractionType.SHOW_YOUTUBE:
    case InteractionType.PLAY_VIDEO:
    case InteractionType.PLAY_AUDIO:
    case InteractionType.SHOW_IMAGE:
    case InteractionType.SHOW_IMAGE_MODAL:
      return <MobileMediaSettings event={event} onUpdate={onUpdate} />;
    
    case InteractionType.SHOW_TEXT:
    case InteractionType.SHOW_MESSAGE:
      return (
        <MobileTextSettings 
          event={event} 
          onUpdate={(updatedEvent) => onUpdate(updatedEvent)} 
        />
      );
    
    case InteractionType.QUIZ:
      return (
        <MobileQuizSettings 
          event={event} 
          onChange={(updatedEvent) => onUpdate(updatedEvent)} 
        />
      );
    
    default:
      return <div className="text-gray-400 text-sm p-4">No settings available for this event type.</div>;
  }
};
