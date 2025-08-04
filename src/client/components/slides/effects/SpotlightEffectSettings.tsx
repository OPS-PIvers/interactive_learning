/**
 * SpotlightEffectSettings - Settings panel for spotlight effects
 * 
 * Migrated from main_revert MobileSpotlightSettings with enhancements
 * for the slide-based architecture
 */

import React, { useCallback } from 'react';
import { SlideEffect, SpotlightParameters } from '../../../../shared/slideTypes';

interface SpotlightEffectSettingsProps {
  effect: SlideEffect;
  onUpdate: (updates: Partial<SlideEffect>) => void;
}

export const SpotlightEffectSettings: React.FC<SpotlightEffectSettingsProps> = ({
  effect,
  onUpdate
}) => {
  const parameters = effect.parameters as SpotlightParameters;

  const handleParameterUpdate = useCallback((paramUpdates: Partial<SpotlightParameters>) => {
    onUpdate({
      parameters: {
        ...parameters,
        ...paramUpdates
      }
    });
  }, [parameters, onUpdate]);

  const handlePositionUpdate = useCallback((positionUpdates: Partial<SpotlightParameters['position']>) => {
    handleParameterUpdate({
      position: {
        ...parameters.position,
        ...positionUpdates
      }
    });
  }, [parameters, handleParameterUpdate]);

  const handleDurationUpdate = useCallback((duration: number) => {
    onUpdate({ duration });
  }, [onUpdate]);

  const shapes = [
    { value: 'circle', label: 'Circle' },
    { value: 'rectangle', label: 'Rectangle' },
    { value: 'oval', label: 'Oval' },
  ] as const;

  const isCircle = parameters.shape === 'circle';
  const position = parameters.position || { x: 0, y: 0, width: 150, height: 150 };

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

      {/* Spotlight Shape */}
      <div>
        <label className="block text-xs font-medium text-slate-300 mb-2">
          Spotlight Shape
        </label>
        <div className="grid grid-cols-3 gap-2">
          {shapes.map((shape) => (
            <button
              key={shape.value}
              onClick={() => handleParameterUpdate({ shape: shape.value })}
              className={`p-2 rounded border text-xs font-medium transition-colors ${
                parameters.shape === shape.value
                  ? 'bg-purple-600 border-purple-500 text-white'
                  : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {shape.label}
            </button>
          ))}
        </div>
      </div>

      {/* Spotlight Size */}
      <div>
        <label className="block text-xs font-medium text-slate-300 mb-2">
          {isCircle ? 'Radius' : 'Width'}
        </label>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="50"
            max="500"
            value={position.width}
            onChange={(e) => {
              const value = parseInt(e.target.value);
              if (isCircle) {
                handlePositionUpdate({ width: value, height: value });
              } else {
                handlePositionUpdate({ width: value });
              }
            }}
            className="flex-1"
          />
          <span className="text-xs text-slate-400 w-12">
            {position.width}px
          </span>
        </div>
      </div>

      {/* Height (for rectangle/oval) */}
      {!isCircle && (
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-2">
            Height
          </label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="50"
              max="500"
              value={position.height}
              onChange={(e) => handlePositionUpdate({ height: parseInt(e.target.value) })}
              className="flex-1"
            />
            <span className="text-xs text-slate-400 w-12">
              {position.height}px
            </span>
          </div>
        </div>
      )}

      {/* Spotlight Intensity */}
      <div>
        <label className="block text-xs font-medium text-slate-300 mb-2">
          Intensity
        </label>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={parameters.intensity || 70}
            onChange={(e) => handleParameterUpdate({ intensity: parseInt(e.target.value) })}
            className="flex-1"
          />
          <span className="text-xs text-slate-400 w-12">
            {parameters.intensity || 70}%
          </span>
        </div>
      </div>

      {/* Fade Edges */}
      <div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={parameters.fadeEdges || false}
            onChange={(e) => handleParameterUpdate({ fadeEdges: e.target.checked })}
            className="w-4 h-4 text-purple-600 bg-slate-700 border-slate-600 rounded focus:ring-purple-500"
          />
          <span className="text-xs text-slate-300">Fade Edges</span>
        </label>
      </div>

      {/* Message */}
      <div>
        <label className="block text-xs font-medium text-slate-300 mb-2">
          Message (Optional)
        </label>
        <input
          type="text"
          value={parameters.message || ''}
          onChange={(e) => handleParameterUpdate({ message: e.target.value })}
          className="w-full p-2 bg-slate-700 border border-slate-600 rounded text-white text-xs"
          placeholder="Enter an optional message..."
        />
      </div>

      {/* Position Override */}
      <div>
        <label className="block text-xs font-medium text-slate-300 mb-2">
          Position Override
        </label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-slate-400 mb-1">X (px)</label>
            <input
              type="number"
              value={position.x}
              onChange={(e) => handlePositionUpdate({ x: parseInt(e.target.value) || 0 })}
              className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-xs"
              placeholder="Auto"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Y (px)</label>
            <input
              type="number"
              value={position.y}
              onChange={(e) => handlePositionUpdate({ y: parseInt(e.target.value) || 0 })}
              className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-xs"
              placeholder="Auto"
            />
          </div>
        </div>
        <div className="text-xs text-slate-400 mt-1">
          Uses element position by default
        </div>
      </div>
    </div>
  );
};

export default SpotlightEffectSettings;