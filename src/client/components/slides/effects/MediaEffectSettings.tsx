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
  const parameters = effect.parameters as PlayVideoParameters | PlayAudioParameters;
  const isVideoEffect = effect.type === 'play_video';
  const isAudioEffect = effect.type === 'play_audio';

  const handleParameterUpdate = useCallback((paramUpdates: Partial<PlayVideoParameters | PlayAudioParameters>) => {
    onUpdate({
      parameters: {
        ...parameters,
        ...paramUpdates
      }
    });
  }, [parameters, onUpdate]);

  const mediaTypes = isVideoEffect
    ? [
        { value: 'file', label: 'Video File' },
        { value: 'youtube', label: 'YouTube' },
        { value: 'url', label: 'URL' }
      ]
    : [
        { value: 'file', label: 'Audio File' },
        { value: 'url', label: 'URL' }
      ];

  return (
    <div className="space-y-4">
      {/* Media Type Selection */}
      <div>
        <label className="block text-xs font-medium text-slate-300 mb-2">
          Media Type
        </label>
        <div className="grid grid-cols-2 gap-2">
          {mediaTypes.map((mediaType) => (
            <button
              key={mediaType.value}
              onClick={() => handleParameterUpdate({ mediaType: mediaType.value as any })}
              className={`p-2 rounded border text-xs font-medium transition-colors ${
                parameters.mediaType === mediaType.value
                  ? 'bg-purple-600 border-purple-500 text-white'
                  : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {mediaType.label}
            </button>
          ))}
        </div>
      </div>

      {/* Media URL/ID */}
      <div>
        <label className="block text-xs font-medium text-slate-300 mb-2">
          {parameters.mediaType === 'youtube' ? 'YouTube Video ID or URL' : 'Media URL'}
        </label>
        <input
          type="text"
          value={parameters.url || ''}
          onChange={(e) => handleParameterUpdate({ url: e.target.value })}
          className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-xs"
          placeholder={
            parameters.mediaType === 'youtube' 
              ? 'dQw4w9WgXcQ or full YouTube URL'
              : isVideoEffect
                ? 'https://example.com/video.mp4'
                : 'https://example.com/audio.mp3'
          }
        />
      </div>

      {/* YouTube specific settings */}
      {isVideoEffect && parameters.mediaType === 'youtube' && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Start Time (s)</label>
              <input
                type="number"
                min="0"
                value={(parameters as PlayVideoParameters).startTime || 0}
                onChange={(e) => handleParameterUpdate({ startTime: parseInt(e.target.value) })}
                className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-xs"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">End Time (s)</label>
              <input
                type="number"
                min="0"
                value={(parameters as PlayVideoParameters).endTime || 0}
                onChange={(e) => handleParameterUpdate({ endTime: parseInt(e.target.value) })}
                className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-xs"
                placeholder="Full duration"
              />
            </div>
          </div>
        </>
      )}

      {/* Display Mode */}
      <div>
        <label className="block text-xs font-medium text-slate-300 mb-2">
          Display Mode
        </label>
        <select
          value={parameters.displayMode || 'modal'}
          onChange={(e) => handleParameterUpdate({ displayMode: e.target.value as any })}
          className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-xs"
        >
          <option value="modal">Modal</option>
          <option value="inline">Inline</option>
          {isVideoEffect && <option value="overlay">Overlay</option>}
          {isAudioEffect && <option value="background">Background</option>}
          {isAudioEffect && <option value="mini-player">Mini Player</option>}
        </select>
      </div>

      {/* Playback Settings */}
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

          {isVideoEffect && (
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={(parameters as PlayVideoParameters).loop || false}
                onChange={(e) => handleParameterUpdate({ loop: e.target.checked })}
                className="w-4 h-4 text-purple-600 bg-slate-700 border-slate-600 rounded focus:ring-purple-500"
              />
              <span className="text-xs text-slate-300">Loop playback</span>
            </label>
          )}
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

      {/* Audio-specific settings */}
      {isAudioEffect && (
        <>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">
              Audio Metadata
            </label>
            <div className="space-y-2">
              <input
                type="text"
                value={(parameters as PlayAudioParameters).title || ''}
                onChange={(e) => handleParameterUpdate({ title: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-xs"
                placeholder="Audio title"
              />
              <input
                type="text"
                value={(parameters as PlayAudioParameters).artist || ''}
                onChange={(e) => handleParameterUpdate({ artist: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-xs"
                placeholder="Artist name"
              />
            </div>
          </div>
        </>
      )}

      {/* Modal Position (for modal display mode) */}
      {parameters.displayMode === 'modal' && (
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-2">
            Modal Position
          </label>
          <select
            value={parameters.modalPosition || 'center'}
            onChange={(e) => handleParameterUpdate({ modalPosition: e.target.value as any })}
            className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-xs"
          >
            <option value="center">Center</option>
            <option value="top">Top</option>
            <option value="bottom">Bottom</option>
            <option value="left">Left</option>
            <option value="right">Right</option>
          </select>
        </div>
      )}
    </div>
  );
};

export default MediaEffectSettings;