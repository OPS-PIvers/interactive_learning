/**
 * TextEffectSettings - Settings panel for text/message effects
 * 
 * Migrated from main_revert MobileTextSettings with enhancements
 * for the slide-based architecture
 */

import React, { useCallback, useState } from 'react';
import { SlideEffect, ShowTextParameters } from '../../../../shared/slideTypes';

interface TextEffectSettingsProps {
  effect: SlideEffect;
  onUpdate: (updates: Partial<SlideEffect>) => void;
}

export const TextEffectSettings: React.FC<TextEffectSettingsProps> = ({
  effect,
  onUpdate
}) => {
  const parameters = effect.parameters as ShowTextParameters;
  const [textContent, setTextContent] = useState(parameters.text || '');

  const handleParameterUpdate = useCallback((paramUpdates: Partial<ShowTextParameters>) => {
    onUpdate({
      parameters: {
        ...parameters,
        ...paramUpdates
      }
    });
  }, [parameters, onUpdate]);

  const handleTextBlur = useCallback(() => {
    handleParameterUpdate({ text: textContent });
  }, [textContent, handleParameterUpdate]);

  const toggleStyle = useCallback((style: 'bold' | 'italic') => {
    const startTag = style === 'bold' ? '**' : '_';
    const endTag = style === 'bold' ? '**' : '_';
    const newText = `${startTag}${textContent}${endTag}`;
    setTextContent(newText);
    handleParameterUpdate({ text: newText });
  }, [textContent, handleParameterUpdate]);

  return (
    <div className="space-y-4">
      {/* Text Content */}
      <div>
        <label className="block text-xs font-medium text-slate-300 mb-2">
          Text Content
        </label>
        <div className="flex items-center space-x-2 mb-2">
          <button 
            onClick={() => toggleStyle('bold')} 
            className="px-2 py-1 bg-slate-600 rounded text-white font-bold text-xs hover:bg-slate-500 transition-colors"
            title="Toggle bold text"
          >
            B
          </button>
          <button 
            onClick={() => toggleStyle('italic')} 
            className="px-2 py-1 bg-slate-600 rounded text-white italic text-xs hover:bg-slate-500 transition-colors"
            title="Toggle italic text"
          >
            I
          </button>
        </div>
        <textarea
          value={textContent}
          onChange={(e) => setTextContent(e.target.value)}
          onBlur={handleTextBlur}
          className="w-full h-24 p-2 bg-slate-700 border border-slate-600 rounded text-white text-xs resize-none"
          placeholder="Enter your text content..."
        />
      </div>

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
          <option value="tooltip">Tooltip</option>
          <option value="banner">Banner</option>
          <option value="overlay">Overlay</option>
        </select>
      </div>

      {/* Font Settings */}
      <div>
        <label className="block text-xs font-medium text-slate-300 mb-2">
          Font Size
        </label>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="10"
            max="48"
            value={parameters.fontSize || 16}
            onChange={(e) => handleParameterUpdate({ fontSize: parseInt(e.target.value) })}
            className="flex-1"
          />
          <span className="text-xs text-slate-400 w-12">
            {parameters.fontSize || 16}px
          </span>
        </div>
      </div>

      {/* Text Alignment */}
      <div>
        <label className="block text-xs font-medium text-slate-300 mb-2">
          Text Alignment
        </label>
        <div className="grid grid-cols-3 gap-2">
          {['left', 'center', 'right'].map((align) => (
            <button
              key={align}
              onClick={() => handleParameterUpdate({ textAlign: align as any })}
              className={`p-2 rounded border text-xs font-medium transition-colors ${
                (parameters.textAlign || 'center') === align
                  ? 'bg-purple-600 border-purple-500 text-white'
                  : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {align.charAt(0).toUpperCase() + align.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Modal Settings (for modal display mode) */}
      {parameters.displayMode === 'modal' && (
        <>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">
              Modal Size
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Width (px)</label>
                <input
                  type="number"
                  min="100"
                  max="800"
                  value={parameters.modalWidth || 400}
                  onChange={(e) => handleParameterUpdate({ modalWidth: parseInt(e.target.value) })}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-xs"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Max Height (px)</label>
                <input
                  type="number"
                  min="100"
                  max="600"
                  value={parameters.modalMaxHeight || 300}
                  onChange={(e) => handleParameterUpdate({ modalMaxHeight: parseInt(e.target.value) })}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-xs"
                />
              </div>
            </div>
          </div>

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
              <option value="element">Near Element</option>
            </select>
          </div>
        </>
      )}

      {/* Auto-close Settings */}
      <div>
        <label className="block text-xs font-medium text-slate-300 mb-2">
          Auto-close Options
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={parameters.autoClose || false}
              onChange={(e) => handleParameterUpdate({ autoClose: e.target.checked })}
              className="w-4 h-4 text-purple-600 bg-slate-700 border-slate-600 rounded focus:ring-purple-500"
            />
            <span className="text-xs text-slate-300">Auto-close after duration</span>
          </label>
          
          {parameters.autoClose && (
            <div className="ml-6">
              <label className="block text-xs text-slate-400 mb-1">Duration (ms)</label>
              <input
                type="number"
                min="1000"
                max="30000"
                step="1000"
                value={parameters.autoCloseDuration || 5000}
                onChange={(e) => handleParameterUpdate({ autoCloseDuration: parseInt(e.target.value) })}
                className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-xs"
              />
            </div>
          )}
        </div>
      </div>

      {/* Background Settings */}
      <div>
        <label className="block text-xs font-medium text-slate-300 mb-2">
          Background
        </label>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={parameters.backgroundColor || '#1e293b'}
              onChange={(e) => handleParameterUpdate({ backgroundColor: e.target.value })}
              className="w-8 h-8 rounded border border-slate-600 cursor-pointer"
            />
            <input
              type="text"
              value={parameters.backgroundColor || '#1e293b'}
              onChange={(e) => handleParameterUpdate({ backgroundColor: e.target.value })}
              className="flex-1 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-xs"
              placeholder="#1e293b"
            />
          </div>
          
          <div>
            <label className="block text-xs text-slate-400 mb-1">Background Opacity</label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={parameters.backgroundOpacity || 0.9}
                onChange={(e) => handleParameterUpdate({ backgroundOpacity: parseFloat(e.target.value) })}
                className="flex-1"
              />
              <span className="text-xs text-slate-400 w-12">
                {Math.round((parameters.backgroundOpacity || 0.9) * 100)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TextEffectSettings;