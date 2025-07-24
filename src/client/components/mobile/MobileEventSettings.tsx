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
      return (
        <div className="text-gray-400 text-sm p-4">
          <div className="flex items-center space-x-2 mb-2">
            <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
            <span className="font-medium">Unknown Event Type</span>
          </div>
          <p className="text-sm">No settings available for event type: <code className="bg-slate-700 px-1 rounded">{event.type}</code></p>
          <p className="text-xs text-gray-500 mt-1">This event type may be deprecated or unsupported on mobile.</p>
        </div>
      );
  }
};
