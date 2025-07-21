import React from 'react';
import { MobileSlider } from './MobileSlider';
import { MobileShapeSelector } from './MobileShapeSelector';
import { TimelineEventData } from '../../../shared/types';

interface MobileSpotlightSettingsProps {
  event: TimelineEventData;
  onUpdate: (event: Partial<TimelineEventData>) => void;
}

export const MobileSpotlightSettings: React.FC<MobileSpotlightSettingsProps> = ({ event, onUpdate }) => {
  const shapes = [
    { value: 'circle', label: 'Circle', icon: <div className="w-10 h-10 bg-white rounded-full" /> },
    { value: 'rectangle', label: 'Rectangle', icon: <div className="w-10 h-10 bg-white" /> },
  ];

  const isCircle = (event.spotlightShape || 'circle') === 'circle';

  return (
    <div className="space-y-4">
      <MobileShapeSelector
        label="Spotlight Shape"
        shapes={shapes}
        selectedShape={event.spotlightShape || 'circle'}
        onChange={(shape) => onUpdate({ spotlightShape: shape as 'circle' | 'rectangle' })}
      />
      <MobileSlider
        label={isCircle ? "Radius" : "Width"}
        min={50}
        max={500}
        value={event.spotlightWidth || 150}
        onChange={(value) => onUpdate({ spotlightWidth: value })}
        unit="px"
      />
      {isCircle && (
         <MobileSlider
         label="Height"
         min={50}
         max={500}
         value={event.spotlightHeight || 150}
         onChange={(value) => onUpdate({ spotlightHeight: value })}
         unit="px"
       />
      )}
      <MobileSlider
        label="Opacity"
        min={0.1}
        max={1.0}
        step={0.1}
        value={event.spotlightOpacity || 0.5}
        onChange={(value) => onUpdate({ spotlightOpacity: value })}
      />
      <MobileSlider
        label="Background Dim"
        min={0}
        max={100}
        value={event.backgroundDimPercentage || 70}
        onChange={(value) => onUpdate({ backgroundDimPercentage: value })}
        unit="%"
      />
    </div>
  );
};
