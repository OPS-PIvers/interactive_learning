import React from 'react';
import { TimelineEventData, InteractionType } from '../../../shared/types';
import { MobileSpotlightSettings } from './MobileSpotlightSettings';

interface MobileEventSettingsProps {
  event: TimelineEventData;
  onUpdate: (event: Partial<TimelineEventData>) => void;
}

export const MobileEventSettings: React.FC<MobileEventSettingsProps> = ({ event, onUpdate }) => {
  switch (event.type) {
    case InteractionType.SPOTLIGHT:
      return <MobileSpotlightSettings event={event} onUpdate={onUpdate} />;
    // Add other event types here
    default:
      return <div className="text-gray-400 text-sm p-4">No settings available for this event type.</div>;
  }
};
