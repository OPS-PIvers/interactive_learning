import React from 'react';
import { MobileSlider } from './MobileSlider';
import { MobileShapeSelector } from './MobileShapeSelector';
import { SpotlightEvent } from '../../../shared/types';

interface MobileSpotlightSettingsProps {
  settings: SpotlightEvent;
  onSettingsChange: (settings: SpotlightEvent) => void;
}

export const MobileSpotlightSettings: React.FC<MobileSpotlightSettingsProps> = ({
  settings,
  onSettingsChange,
}) => {
  return (
    <div className="space-y-4">
      <MobileSlider
        label="Spotlight Size"
        value={settings.spotlightWidth || 120}
        min={50}
        max={300}
        step={10}
        unit="px"
        onChange={(value) => onSettingsChange({ ...settings, spotlightWidth: value })}
      />
      <MobileShapeSelector
        label="Shape"
        value={settings.shape || 'circle'}
        onChange={(value) => onSettingsChange({ ...settings, shape: value })}
      />
      <MobileSlider
        label="Opacity"
        value={settings.opacity || 1}
        min={0.1}
        max={1}
        step={0.1}
        onChange={(value) => onSettingsChange({ ...settings, opacity: value })}
      />
      <MobileSlider
        label="Dim Percentage"
        value={settings.dimPercentage || 0}
        min={0}
        max={90}
        step={5}
        unit="%"
        onChange={(value) => onSettingsChange({ ...settings, dimPercentage: value })}
      />
    </div>
  );
};
