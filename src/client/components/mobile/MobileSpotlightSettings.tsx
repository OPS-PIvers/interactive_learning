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

  return (
    <div className="space-y-4">
      <MobileShapeSelector
        label="Spotlight Shape"
        shapes={shapes}
        selectedShape={event.highlightShape || 'circle'}
        onChange={(shape) => onUpdate({ highlightShape: shape })}
      />
      <MobileSlider
        label="Size"
        min={50}
        max={300}
        value={event.highlightRadius || 120}
        onChange={(value) => onUpdate({ highlightRadius: value })}
        unit="px"
      />
      <MobileSlider
        label="Opacity"
        min={0.1}
        max={1.0}
        step={0.1}
        value={event.opacity || 0.5}
        onChange={(value) => onUpdate({ opacity: value })}
      />
      <MobileSlider
        label="Dimming"
        min={0}
        max={90}
        value={event.dimPercentage || 70}
        onChange={(value) => onUpdate({ dimPercentage: value })}
        unit="%"
      />
    </div>
  );
};
