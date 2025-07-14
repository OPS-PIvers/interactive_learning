import React from 'react';
import { MobileSlider } from './MobileSlider';
import { PanZoomEvent } from '../../../shared/types';

interface MobilePanZoomSettingsProps {
  settings: PanZoomEvent;
  onSettingsChange: (settings: PanZoomEvent) => void;
}

export const MobilePanZoomSettings: React.FC<MobilePanZoomSettingsProps> = ({
  settings,
  onSettingsChange,
}) => {
  return (
    <div className="space-y-4">
      <MobileSlider
        label="Zoom Level"
        value={settings.zoom || 1}
        min={1}
        max={5}
        step={0.1}
        unit="x"
        onChange={(value) => onSettingsChange({ ...settings, zoom: value })}
      />
      <MobileSlider
        label="Target X"
        value={settings.targetX || 50}
        min={0}
        max={100}
        step={1}
        unit="%"
        onChange={(value) => onSettingsChange({ ...settings, targetX: value })}
      />
      <MobileSlider
        label="Target Y"
        value={settings.targetY || 50}
        min={0}
        max={100}
        step={1}
        unit="%"
        onChange={(value) => onSettingsChange({ ...settings, targetY: value })}
      />
      <MobileSlider
        label="Duration"
        value={settings.duration || 1000}
        min={500}
        max={5000}
        step={100}
        unit="ms"
        onChange={(value) => onSettingsChange({ ...settings, duration: value })}
      />
    </div>
  );
};
