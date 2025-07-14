import React from 'react';
import { MobileSlider } from './MobileSlider';
import { TimelineEventData } from '../../../shared/types';

interface MobilePanZoomSettingsProps {
  event: TimelineEventData;
  onUpdate: (event: Partial<TimelineEventData>) => void;
}

export const MobilePanZoomSettings: React.FC<MobilePanZoomSettingsProps> = ({ event, onUpdate }) => {
  return (
    <div className="space-y-4">
      <MobileSlider
        label="Zoom Level"
        min={1}
        max={5}
        step={0.1}
        value={event.zoomLevel || 2}
        onChange={(value) => onUpdate({ zoomLevel: value })}
        unit="x"
      />
      <MobileSlider
        label="Duration"
        min={500}
        max={5000}
        step={100}
        value={event.duration || 1000}
        onChange={(value) => onUpdate({ duration: value })}
        unit="ms"
      />
    </div>
  );
};
