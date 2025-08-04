import React, { useState, useEffect, useCallback } from 'react';
import { ElementInteraction, EffectParameters } from '../../../shared/slideTypes';

interface AudioInteractionEditorProps {
  interaction: ElementInteraction;
  onUpdate: (updates: Partial<ElementInteraction>) => void;
  onDone: () => void;
}

// Define the structure of our audio interaction parameters
interface AudioParameters {
  audioUrl?: string;
  autoStartPlayback?: boolean;
  showPlayerControls?: boolean;
  allowPlaybackSpeedAdjustment?: boolean;
  displayMode?: 'background' | 'modal' | 'mini-player';
  showControls?: boolean;
  autoplay?: boolean;
  loop?: boolean;
  volume?: number;
  startTime?: number;
  endTime?: number;
}

export const AudioInteractionEditor: React.FC<AudioInteractionEditorProps> = ({
  interaction,
  onUpdate,
  onDone,
}) => {
  const [params, setParams] = useState<AudioParameters>(
    interaction.effect.parameters as AudioParameters
  );

  const handleParamChange = useCallback(<K extends keyof AudioParameters>(
    param: K,
    value: AudioParameters[K]
  ) => {
    setParams(currentParams => ({
      ...currentParams,
      [param]: value,
    }));
  }, []);

  const handleSave = () => {
    onUpdate({
      effect: {
        ...interaction.effect,
        parameters: params as EffectParameters,
      },
    });
    onDone();
  };

  // Update internal state if the interaction prop changes from outside
  useEffect(() => {
    setParams(interaction.effect.parameters as AudioParameters);
  }, [interaction]);

  return (
    <div className="p-4 bg-slate-800 text-white h-full flex flex-col space-y-4">
      <div className="flex-1 overflow-y-auto pr-2 space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Audio Source</h3>
          <p className="text-sm text-slate-400 mb-2">
            Currently, only URL-based audio is supported in this editor.
          </p>
          <input
            type="url"
            placeholder="Paste audio URL"
            value={params.audioUrl || ''}
            onChange={e => handleParamChange('audioUrl', e.target.value)}
            className="w-full p-3 bg-slate-700 rounded-md border border-slate-600 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Playback Options</h3>
          <div className="flex items-center justify-between">
            <label htmlFor="auto-start-playback" className="text-sm text-slate-300">
              Auto start playback
            </label>
            <button
              type="button"
              id="auto-start-playback"
              role="switch"
              aria-checked={!!params.autoStartPlayback}
              onClick={() => handleParamChange('autoStartPlayback', !params.autoStartPlayback)}
              className={`relative inline-flex items-center h-6 rounded-full w-11 cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-purple-500 ${params.autoStartPlayback ? 'bg-green-500' : 'bg-gray-600'}`}
            >
              <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${params.autoStartPlayback ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <label htmlFor="show-player-controls" className="text-sm text-slate-300">
              Show player controls
            </label>
            <button
              type="button"
              id="show-player-controls"
              role="switch"
              aria-checked={params.showPlayerControls !== false}
              onClick={() => handleParamChange('showPlayerControls', !(params.showPlayerControls !== false))}
              className={`relative inline-flex items-center h-6 rounded-full w-11 cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-purple-500 ${params.showPlayerControls !== false ? 'bg-green-500' : 'bg-gray-600'}`}
            >
              <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${params.showPlayerControls !== false ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <label htmlFor="allow-speed-adjustment" className="text-sm text-slate-300">
              Allow playback speed adjustment
            </label>
            <button
              type="button"
              id="allow-speed-adjustment"
              role="switch"
              aria-checked={!!params.allowPlaybackSpeedAdjustment}
              onClick={() => handleParamChange('allowPlaybackSpeedAdjustment', !params.allowPlaybackSpeedAdjustment)}
              className={`relative inline-flex items-center h-6 rounded-full w-11 cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-purple-500 ${params.allowPlaybackSpeedAdjustment ? 'bg-green-500' : 'bg-gray-600'}`}
            >
              <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${params.allowPlaybackSpeedAdjustment ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-slate-700">
        <button
          onClick={handleSave}
          className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 rounded-md text-white font-semibold transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  );
};
