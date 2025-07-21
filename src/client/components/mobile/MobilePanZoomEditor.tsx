import React from 'react';
import { TimelineEventData } from '../../../shared/types';
import { XMarkIcon } from '../icons/XMarkIcon';

interface MobilePanZoomEditorProps {
  event: TimelineEventData;
  onUpdate: (event: TimelineEventData) => void;
  onClose: () => void;
}

const ZOOM_PRESETS = [1.0, 1.5, 2.5, 4.0];

const MobilePanZoomEditor: React.FC<MobilePanZoomEditorProps> = ({ event, onUpdate, onClose }) => {
  const zoomLevel = event.zoomLevel || 1.0;

  const handleZoomChange = (newZoom: number) => {
    onUpdate({ ...event, zoomLevel: newZoom });
  };

  return (
    <div className="bg-slate-800 p-4 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-white">Edit Pan & Zoom Event</h3>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white"
          aria-label="Close"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="zoom-level-slider" className="block text-sm font-medium text-slate-300 mb-2">
            Zoom Level: <span className="text-blue-400 font-mono">{zoomLevel.toFixed(1)}x</span>
          </label>
          <input
            id="zoom-level-slider"
            type="range"
            min="0.1"
            max="5"
            step="0.1"
            value={zoomLevel}
            onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
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
              onClick={() => handleZoomChange(preset)}
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

export default MobilePanZoomEditor;
