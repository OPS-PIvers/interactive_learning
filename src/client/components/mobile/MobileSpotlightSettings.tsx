import React from 'react';
import { MobileSlider } from './MobileSlider';
import { MobileShapeSelector } from './MobileShapeSelector';
import { TimelineEventData } from '../../../shared/types';
import { CircleIcon, SquareIcon } from '@radix-ui/react-icons';

interface MobileSpotlightSettingsProps {
  event: TimelineEventData;
  onUpdate: (event: Partial<TimelineEventData>) => void;
}

const shapes = [
  { value: 'circle', label: 'Circle', icon: <CircleIcon className="w-8 h-8" /> },
  { value: 'rectangle', label: 'Rectangle', icon: <SquareIcon className="w-8 h-8" /> },
];

export const MobileSpotlightSettings: React.FC<MobileSpotlightSettingsProps> = ({ event, onUpdate }) => {
  return (
    <div className="space-y-4">
      <MobileShapeSelector
        label="Shape"
        shapes={shapes}
        selectedShape={event.spotlightShape || 'circle'}
        onChange={(shape) => onUpdate({ spotlightShape: shape })}
      />
      <MobileSlider
        label="Size"
        min={50}
        max={300}
        value={event.spotlightWidth || 120}
        onChange={(value) => onUpdate({ spotlightWidth: value, spotlightHeight: value })}
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
