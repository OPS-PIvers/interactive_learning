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

  const handlePositionUpdate = useCallback((positionUpdates: Partial<PanZoomParameters['targetPosition']>) => {
    handleParameterUpdate({
      targetPosition: {
        ...parameters.targetPosition,
        ...positionUpdates
      }
    });
  }, [parameters, handleParameterUpdate]);

  const handleDurationUpdate = useCallback((duration: number) => {
    onUpdate({ duration });
  }, [onUpdate]);

  const targetPosition = parameters.targetPosition || { x: 0, y: 0, width: 0, height: 0 };

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
            <label className="block text-xs text-slate-400 mb-1">X (px)</label>
            <input
              type="number"
              value={targetPosition.x}
              onChange={(e) => handlePositionUpdate({ x: parseInt(e.target.value) || 0 })}
              className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-xs"
              placeholder="Auto"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Y (px)</label>
            <input
              type="number"
              value={targetPosition.y}
              onChange={(e) => handlePositionUpdate({ y: parseInt(e.target.value) || 0 })}
              className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-xs"
              placeholder="Auto"
            />
          </div>
        </div>
        <div className="text-xs text-slate-400 mt-1">
          Leave blank to use element center
        </div>
      </div>

      {/* Easing Type */}
      <div>
        <label className="block text-xs font-medium text-slate-300 mb-2">
          Easing
        </label>
        <select
          value={parameters.easing || 'ease-in-out'}
          onChange={(e) => handleParameterUpdate({ easing: e.target.value })}
          className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-xs"
        >
          <option value="ease">Ease</option>
          <option value="ease-in">Ease In</option>
          <option value="ease-out">Ease Out</option>
          <option value="ease-in-out">Ease In-Out</option>
          <option value="linear">Linear</option>
        </select>
      </div>

      {/* Return to Original Position */}
      <div>
        <label className="block text-xs font-medium text-slate-300 mb-2">
          Return Options
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={parameters.returnToOriginal || false}
              onChange={(e) => handleParameterUpdate({ returnToOriginal: e.target.checked })}
              className="w-4 h-4 text-purple-600 bg-slate-700 border-slate-600 rounded focus:ring-purple-500"
            />
            <span className="text-xs text-slate-300">Return to original after duration</span>
          </label>
          
          {parameters.returnToOriginal && (
            <div className="ml-6">
              <label className="block text-xs text-slate-400 mb-1">Return Delay (ms)</label>
              <input
                type="number"
                min="0"
                max="10000"
                step="100"
                value={parameters.returnDelay || 1000}
                onChange={(e) => handleParameterUpdate({ returnDelay: parseInt(e.target.value) || 1000 })}
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