import React from 'react';
import { HotspotData } from '../../../../../shared/types';
import { hotspotStylePresets, hotspotSizePresets, applyStylePreset } from '../../../../../shared/hotspotStylePresets';
import PropertyField from '../shared/PropertyField';

interface StyleTabProps {
  localHotspot: HotspotData;
  setLocalHotspot: React.Dispatch<React.SetStateAction<HotspotData | null>>;
  onUpdateHotspot: (hotspot: HotspotData) => void;
}

const StyleTab: React.FC<StyleTabProps> = ({ localHotspot, setLocalHotspot, onUpdateHotspot }) => {
  return (
    <div className="p-4 overflow-y-auto">
      <PropertyField label="Display hotspot during event">
        <div
          onClick={() =>
            setLocalHotspot((prev) => prev ? { ...prev, displayHotspotInEvent: !prev.displayHotspotInEvent } : null)
          }
          id="display-hotspot-toggle"
          className={`relative inline-flex items-center h-6 rounded-full w-11 cursor-pointer transition-colors
            ${localHotspot.displayHotspotInEvent ? 'bg-purple-500' : 'bg-slate-600'}`}>
          <span
            className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform
              ${localHotspot.displayHotspotInEvent ? 'translate-x-6' : 'translate-x-1'}`} />
        </div>
      </PropertyField>

      <PropertyField label="Style Presets">
        <div className="grid grid-cols-2 gap-2 mb-3">
          {hotspotStylePresets.map((preset) => (
            <button
              key={preset.name}
              onClick={() => {
                if (localHotspot) {
                  const updatedHotspot = applyStylePreset(localHotspot, preset);
                  setLocalHotspot(updatedHotspot);
                  onUpdateHotspot(updatedHotspot);
                }
              }}
              className="px-3 py-2 bg-slate-600 text-white rounded hover:bg-slate-500 text-xs transition-colors flex items-center gap-2"
              title={preset.description}>
              <div
                className="w-3 h-3 rounded-full border border-slate-400"
                style={{ backgroundColor: preset.style.color }} />
              {preset.name}
            </button>
          ))}
        </div>
      </PropertyField>

      <PropertyField label="Size">
        <div className="grid grid-cols-2 gap-2 mb-3">
          {hotspotSizePresets.map((sizePreset) => (
            <button
              key={sizePreset.value}
              onClick={() => {
                if (localHotspot) {
                  setLocalHotspot((prev) => prev ? { ...prev, size: sizePreset.value } : null);
                }
              }}
              className={`px-3 py-2 rounded text-xs transition-colors ${
                localHotspot?.size === sizePreset.value ?
                'bg-purple-600 text-white' :
                'bg-slate-600 text-white hover:bg-slate-500'}`
              }
              title={sizePreset.description}>
              {sizePreset.name}
            </button>
          ))}
        </div>
      </PropertyField>

      <PropertyField label="Pulse Animation">
        <button
          type="button"
          role="switch"
          aria-checked={!!localHotspot.pulseAnimation}
          onClick={() =>
            setLocalHotspot((prev) => {
              if (!prev) return null;
              const newPulseAnimation = !prev.pulseAnimation;
              return {
                ...prev,
                pulseAnimation: newPulseAnimation,
                ...(newPulseAnimation && !prev.pulseType && { pulseType: 'loop' as const })
              };
            })
          }
          id="pulse-animation-toggle"
          className={`relative inline-flex items-center h-6 rounded-full w-11 cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-800
            ${localHotspot.pulseAnimation ? 'bg-purple-500' : 'bg-slate-600'}`}>
          <span
            className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform
              ${localHotspot.pulseAnimation ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
      </PropertyField>

      {localHotspot.pulseAnimation && (
        <PropertyField label="Pulse Type">
          <div className="flex items-center mt-2">
            <input
              type="radio"
              id="pulse-loop"
              name="pulseType"
              value="loop"
              checked={localHotspot.pulseType === 'loop'}
              onChange={() =>
                setLocalHotspot((prev) => prev ? { ...prev, pulseType: 'loop' } : null)
              }
              className="mr-2" />
            <label htmlFor="pulse-loop" className="text-sm text-slate-300">Loop</label>
            <input
              type="radio"
              id="pulse-timed"
              name="pulseType"
              value="timed"
              checked={localHotspot.pulseType === 'timed'}
              onChange={() =>
                setLocalHotspot((prev) => prev ? { ...prev, pulseType: 'timed' } : null)
              }
              className="ml-4 mr-2" />
            <label htmlFor="pulse-timed" className="text-sm text-slate-300">Timed</label>
          </div>
        </PropertyField>
      )}

      {localHotspot.pulseAnimation && localHotspot.pulseType === 'timed' && (
        <PropertyField label="Pulse Duration (seconds)">
          <input
            type="number"
            id="pulse-duration"
            value={localHotspot.pulseDuration ?? ''}
            onChange={(e) => {
              const newDuration = parseFloat(e.target.value);
              setLocalHotspot((prev) => {
                if (!prev) return null;
                const updatedHotspot = { ...prev };
                if (isNaN(newDuration)) {
                  delete updatedHotspot.pulseDuration;
                } else {
                  updatedHotspot.pulseDuration = newDuration;
                }
                return updatedHotspot;
              });
            }}
            className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white mt-2"
            min="0"
            step="0.1"
            placeholder="Enter duration in seconds" />
        </PropertyField>
      )}
    </div>
  );
};

export default StyleTab;
