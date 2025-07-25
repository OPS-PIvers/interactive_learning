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

  const handleDurationUpdate = useCallback((duration: number) => {
    onUpdate({ duration });
  }, [onUpdate]);

  const shapes = [
    { value: 'circle', label: 'Circle' },
    { value: 'rectangle', label: 'Rectangle' },
  ] as const;

  const isCircle = parameters.shape === 'circle';

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
        <div className="grid grid-cols-2 gap-2">
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
            value={parameters.width || 150}
            onChange={(e) => {
              const value = parseInt(e.target.value);
              if (isCircle) {
                handleParameterUpdate({ width: value, height: value });
              } else {
                handleParameterUpdate({ width: value });
              }
            }}
            className="flex-1"
          />
          <span className="text-xs text-slate-400 w-12">
            {parameters.width || 150}px
          </span>
        </div>
      </div>

      {/* Height (for rectangle only) */}
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
              value={parameters.height || 150}
              onChange={(e) => handleParameterUpdate({ height: parseInt(e.target.value) })}
              className="flex-1"
            />
            <span className="text-xs text-slate-400 w-12">
              {parameters.height || 150}px
            </span>
          </div>
        </div>
      )}

      {/* Spotlight Opacity */}
      <div>
        <label className="block text-xs font-medium text-slate-300 mb-2">
          Spotlight Opacity
        </label>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={parameters.spotlightOpacity || 0}
            onChange={(e) => handleParameterUpdate({ spotlightOpacity: parseFloat(e.target.value) })}
            className="flex-1"
          />
          <span className="text-xs text-slate-400 w-12">
            {Math.round((parameters.spotlightOpacity || 0) * 100)}%
          </span>
        </div>
      </div>

      {/* Background Dim */}
      <div>
        <label className="block text-xs font-medium text-slate-300 mb-2">
          Background Dim
        </label>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="0"
            max="100"
            value={parameters.backgroundDimPercentage || 70}
            onChange={(e) => handleParameterUpdate({ backgroundDimPercentage: parseInt(e.target.value) })}
            className="flex-1"
          />
          <span className="text-xs text-slate-400 w-12">
            {parameters.backgroundDimPercentage || 70}%
          </span>
        </div>
      </div>

      {/* Position Override */}
      <div>
        <label className="block text-xs font-medium text-slate-300 mb-2">
          Position Override
        </label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-slate-400 mb-1">X (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={parameters.x || 0}
              onChange={(e) => handleParameterUpdate({ x: parseFloat(e.target.value) })}
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
              value={parameters.y || 0}
              onChange={(e) => handleParameterUpdate({ y: parseFloat(e.target.value) })}
              className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-xs"
              placeholder="Auto"
            />
          </div>
        </div>
        <div className="text-xs text-slate-400 mt-1">
          Leave blank to use element position
        </div>
      </div>
    </div>
  );
};

export default SpotlightEffectSettings;