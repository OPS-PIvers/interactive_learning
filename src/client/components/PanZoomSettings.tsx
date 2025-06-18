import React from 'react';

interface PanZoomSettingsProps {
  zoomLevel: number;
  onZoomChange: (zoom: number) => void;
}

const ZOOM_PRESETS = [1.0, 1.5, 2.5, 4.0];

const PanZoomSettings: React.FC<PanZoomSettingsProps> = ({ zoomLevel, onZoomChange }) => {
  return (
    <div className="mb-6 bg-slate-700 rounded-lg p-4">
      <h4 className="text-md font-medium text-white mb-4 flex items-center">
        <span className="text-xl mr-2">🔍</span>
        Pan & Zoom Settings
      </h4>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Zoom Level: <span className="text-blue-400 font-mono">{zoomLevel.toFixed(1)}x</span>
          </label>
          <input 
            type="range" 
            min="0.1" 
            max="5" 
            step="0.1" 
            value={zoomLevel}
            onChange={(e) => onZoomChange(parseFloat(e.target.value))}
            className="slider w-full" 
            aria-label="Zoom level"
          />
          <div className="flex justify-between text-xs text-slate-400 mt-1">
            <span>0.1x</span>
            <span>5.0x</span>
          </div>
        </div>
        <div className="flex space-x-2">
          {ZOOM_PRESETS.map((preset) => (
            <button
              key={preset}
              onClick={() => onZoomChange(preset)}
              className={`px-3 py-1 rounded transition-colors text-sm ${
                Math.abs(zoomLevel - preset) < 0.1
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-slate-600 hover:bg-slate-500 text-slate-200'
              }`}
            >
              {preset}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PanZoomSettings;