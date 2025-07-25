/**
 * PanZoomEffectSettings - Settings panel for pan/zoom effects
 * 
 * Migrated from main_revert MobilePanZoomSettings with enhancements
 * for the slide-based architecture
 */

import React, { useCallback } from 'react';
import { SlideEffect, PanZoomParameters } from '../../../../shared/slideTypes';

interface PanZoomEffectSettingsProps {
  effect: SlideEffect;
  onUpdate: (updates: Partial<SlideEffect>) => void;
}

export const PanZoomEffectSettings: React.FC<PanZoomEffectSettingsProps> = ({
  effect,
  onUpdate
}) => {
  const parameters = effect.parameters as PanZoomParameters;

  const handleParameterUpdate = useCallback((paramUpdates: Partial<PanZoomParameters>) => {
    onUpdate({
      parameters: {
        ...parameters,
        ...paramUpdates
      }
    });
  }, [parameters, onUpdate]);

  const handleDurationUpdate = useCallback((duration: number) => {
    onUpdate({ duration });
  }, [onUpdate]);

  return (
    <div className="space-y-4">
      {/* Effect Duration */}
      <div>
        <label className="block text-xs font-medium text-slate-300 mb-2">
          Duration
        </label>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="500"
            max="5000"
            step="100"
            value={effect.duration}
            onChange={(e) => handleDurationUpdate(parseInt(e.target.value))}
            className="flex-1"
          />
          <span className="text-xs text-slate-400 w-16">
            {effect.duration}ms
          </span>
        </div>
      </div>

      {/* Zoom Level */}
      <div>
        <label className="block text-xs font-medium text-slate-300 mb-2">
          Zoom Level
        </label>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="1"
            max="5"
            step="0.1"
            value={parameters.zoomLevel || 2}
            onChange={(e) => handleParameterUpdate({ zoomLevel: parseFloat(e.target.value) })}
            className="flex-1"
          />
          <span className="text-xs text-slate-400 w-12">
            {parameters.zoomLevel || 2}x
          </span>
        </div>
      </div>

      {/* Target Position Override */}
      <div>
        <label className="block text-xs font-medium text-slate-300 mb-2">
          Target Position Override
        </label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-slate-400 mb-1">X (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={parameters.targetX || 0}
              onChange={(e) => handleParameterUpdate({ targetX: parseFloat(e.target.value) })}
              className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-xs"
              placeholder="Auto"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Y (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={parameters.targetY || 0}
              onChange={(e) => handleParameterUpdate({ targetY: parseFloat(e.target.value) })}
              className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-xs"
              placeholder="Auto"
            />
          </div>
        </div>
        <div className="text-xs text-slate-400 mt-1">
          Leave blank to use element center
        </div>
      </div>

      {/* Animation Settings */}
      <div>
        <label className="block text-xs font-medium text-slate-300 mb-2">
          Animation
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={parameters.smooth !== false}
              onChange={(e) => handleParameterUpdate({ smooth: e.target.checked })}
              className="w-4 h-4 text-purple-600 bg-slate-700 border-slate-600 rounded focus:ring-purple-500"
            />
            <span className="text-xs text-slate-300">Smooth animation</span>
          </label>
        </div>
      </div>

      {/* Easing Type */}
      <div>
        <label className="block text-xs font-medium text-slate-300 mb-2">
          Easing
        </label>
        <select
          value={parameters.easing || 'ease-in-out'}
          onChange={(e) => handleParameterUpdate({ easing: e.target.value as any })}
          className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-xs"
        >
          <option value="ease">Ease</option>
          <option value="ease-in">Ease In</option>
          <option value="ease-out">Ease Out</option>
          <option value="ease-in-out">Ease In-Out</option>
          <option value="linear">Linear</option>
        </select>
      </div>

      {/* Reset to Original Position */}
      <div>
        <label className="block text-xs font-medium text-slate-300 mb-2">
          Reset Options
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={parameters.resetAfterDuration || false}
              onChange={(e) => handleParameterUpdate({ resetAfterDuration: e.target.checked })}
              className="w-4 h-4 text-purple-600 bg-slate-700 border-slate-600 rounded focus:ring-purple-500"
            />
            <span className="text-xs text-slate-300">Reset after duration</span>
          </label>
          
          {parameters.resetAfterDuration && (
            <div className="ml-6">
              <label className="block text-xs text-slate-400 mb-1">Reset Delay (ms)</label>
              <input
                type="number"
                min="0"
                max="10000"
                step="100"
                value={parameters.resetDelay || 1000}
                onChange={(e) => handleParameterUpdate({ resetDelay: parseInt(e.target.value) })}
                className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-xs"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PanZoomEffectSettings;