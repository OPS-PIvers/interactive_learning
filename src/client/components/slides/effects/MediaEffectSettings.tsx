/**
 * MediaEffectSettings - Settings panel for media effects (video, audio, image)
 * 
 * Migrated from main_revert MobileMediaSettings with enhancements
 * for the slide-based architecture
 */

import React, { useCallback } from 'react';
import { SlideEffect, PlayVideoParameters, PlayAudioParameters } from '../../../../shared/slideTypes';

interface MediaEffectSettingsProps {
  effect: SlideEffect;
  onUpdate: (updates: Partial<SlideEffect>) => void;
}

export const MediaEffectSettings: React.FC<MediaEffectSettingsProps> = ({
  effect,
  onUpdate
}) => {
  const isVideoEffect = effect.type === 'play_video';
  const isAudioEffect = effect.type === 'play_audio';

  const handleParameterUpdate = useCallback((paramUpdates: Partial<PlayVideoParameters | PlayAudioParameters>) => {
    const newParameters = {
      ...effect.parameters,
      ...paramUpdates,
    };
    onUpdate({
      parameters: newParameters
    });
  }, [effect.parameters, onUpdate]);

  const renderVideoSettings = () => {
    const parameters = effect.parameters as PlayVideoParameters;
    const videoSources = [
      { value: 'url', label: 'URL' },
      { value: 'youtube', label: 'YouTube' },
      { value: 'file', label: 'File' },
    ] as const;

    return (
      <>
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-2">Video Source</label>
          <div className="grid grid-cols-3 gap-2">
            {videoSources.map(source => (
              <button
                key={source.value}
                onClick={() => handleParameterUpdate({ videoSource: source.value })}
                className={`p-2 rounded border text-xs font-medium transition-colors ${
                  parameters.videoSource === source.value
                    ? 'bg-purple-600 border-purple-500 text-white'
                    : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {source.label}
              </button>
            ))}
          </div>
        </div>

        {parameters.videoSource === 'url' && (
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">Video URL</label>
            <input
              type="text"
              value={parameters.videoUrl || ''}
              onChange={e => handleParameterUpdate({ videoUrl: e.target.value })}
              className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-xs"
              placeholder="https://example.com/video.mp4"
            />
          </div>
        )}

        {parameters.videoSource === 'youtube' && (
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">YouTube Video ID</label>
            <input
              type="text"
              value={parameters.youtubeVideoId || ''}
              onChange={e => handleParameterUpdate({ youtubeVideoId: e.target.value })}
              className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-xs"
              placeholder="dQw4w9WgXcQ"
            />
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Start Time (s)</label>
                <input
                  type="number"
                  min="0"
                  value={parameters.youtubeStartTime || 0}
                  onChange={e => handleParameterUpdate({ youtubeStartTime: parseInt(e.target.value) || 0 })}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-xs"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">End Time (s)</label>
                <input
                  type="number"
                  min="0"
                  value={parameters.youtubeEndTime || 0}
                  onChange={e => handleParameterUpdate({ youtubeEndTime: parseInt(e.target.value) || 0 })}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-xs"
                  placeholder="Full duration"
                />
              </div>
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-2">Display Mode</label>
          <select
            value={parameters.displayMode || 'modal'}
            onChange={e => handleParameterUpdate({ displayMode: e.target.value as PlayVideoParameters['displayMode'] })}
            className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-xs"
          >
            <option value="modal">Modal</option>
            <option value="inline">Inline</option>
            <option value="overlay">Overlay</option>
          </select>
        </div>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={parameters.loop || false}
            onChange={e => handleParameterUpdate({ loop: e.target.checked })}
            className="w-4 h-4 text-purple-600 bg-slate-700 border-slate-600 rounded focus:ring-purple-500"
          />
          <span className="text-xs text-slate-300">Loop playback</span>
        </label>
      </>
    );
  };

  const renderAudioSettings = () => {
    const parameters = effect.parameters as PlayAudioParameters;
    return (
      <>
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-2">Audio URL</label>
          <input
            type="text"
            value={parameters.audioUrl || ''}
            onChange={e => handleParameterUpdate({ audioUrl: e.target.value })}
            className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-xs"
            placeholder="https://example.com/audio.mp3"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-2">Display Mode</label>
          <select
            value={parameters.displayMode || 'modal'}
            onChange={e => handleParameterUpdate({ displayMode: e.target.value as PlayAudioParameters['displayMode'] })}
            className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-xs"
          >
            <option value="modal">Modal</option>
            <option value="background">Background</option>
            <option value="mini-player">Mini Player</option>
          </select>
        </div>
      </>
    );
  };

  const parameters = effect.parameters as PlayVideoParameters | PlayAudioParameters;

  return (
    <div className="space-y-4">
      {isVideoEffect && renderVideoSettings()}
      {isAudioEffect && renderAudioSettings()}

      {/* Common Playback Settings */}
      <div>
        <label className="block text-xs font-medium text-slate-300 mb-2">
          Playback Options
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={parameters.autoplay || false}
              onChange={(e) => handleParameterUpdate({ autoplay: e.target.checked })}
              className="w-4 h-4 text-purple-600 bg-slate-700 border-slate-600 rounded focus:ring-purple-500"
            />
            <span className="text-xs text-slate-300">Auto-play</span>
          </label>
          
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={parameters.showControls !== false}
              onChange={(e) => handleParameterUpdate({ showControls: e.target.checked })}
              className="w-4 h-4 text-purple-600 bg-slate-700 border-slate-600 rounded focus:ring-purple-500"
            />
            <span className="text-xs text-slate-300">Show controls</span>
          </label>
        </div>
      </div>

      {/* Volume Control */}
      <div>
        <label className="block text-xs font-medium text-slate-300 mb-2">
          Volume
        </label>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={parameters.volume || 1}
            onChange={(e) => handleParameterUpdate({ volume: parseFloat(e.target.value) })}
            className="flex-1"
          />
          <span className="text-xs text-slate-400 w-12">
            {Math.round((parameters.volume || 1) * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default MediaEffectSettings;