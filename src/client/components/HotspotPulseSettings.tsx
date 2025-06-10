// src/client/components/HotspotPulseSettings.tsx - NEW FILE
import React from 'react';
import { HotspotData } from '../../shared/types';

interface HotspotPulseSettingsProps {
  hotspots: HotspotData[];
  onUpdateHotspot: (hotspotId: string, updates: Partial<HotspotData>) => void;
}

const HotspotPulseSettings: React.FC<HotspotPulseSettingsProps> = ({
  hotspots,
  onUpdateHotspot
}) => {
  const togglePulse = (hotspotId: string) => {
    const hotspot = hotspots.find(h => h.id === hotspotId);
    if (hotspot) {
      onUpdateHotspot(hotspotId, { 
        defaultPulse: !hotspot.defaultPulse 
      });
    }
  };

  return (
    <div className="bg-slate-800 rounded-lg p-4">
      <h3 className="font-semibold mb-4 text-white">Default Hotspot Animations</h3>
      <div className="grid md:grid-cols-3 gap-3">
        {hotspots.map((hotspot) => (
          <div key={hotspot.id} className="bg-slate-700 rounded p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className={`w-4 h-4 rounded-full ${hotspot.color || 'bg-gray-500'}`}></div>
                <span className="text-sm text-white">{hotspot.title}</span>
              </div>
              <label className="flex items-center space-x-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hotspot.defaultPulse !== false} // Default to true
                  onChange={() => togglePulse(hotspot.id)}
                  className="accent-purple-500"
                />
                <span className="text-xs text-slate-400">Pulse</span>
              </label>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HotspotPulseSettings;