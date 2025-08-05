import React, { useCallback } from 'react';
import { ElementInteraction, SlideEffectType, EffectParameters } from '../../../shared/slideTypes';
import { InteractionType } from '../../../shared/InteractionPresets';
import { interactionPresets } from '../../../shared/InteractionPresets';

interface InteractionEditorProps {
  interaction: ElementInteraction | null;
  onInteractionUpdate: (interactionId: string, updates: Partial<ElementInteraction>) => void;
  isCompact?: boolean;
  className?: string;
}

/**
 * InteractionEditor - Inline interaction editing component
 * 
 * Provides comprehensive interaction editing capabilities directly within
 * the properties panel, eliminating the need for modal-based editing
 */
const InteractionEditor: React.FC<InteractionEditorProps> = ({
  interaction,
  onInteractionUpdate,
  isCompact = false,
  className = ''
}) => {
  const handleTriggerChange = useCallback((trigger: string) => {
    if (!interaction) return;
    onInteractionUpdate(interaction.id, { trigger: trigger as any });
  }, [interaction, onInteractionUpdate]);

  const handleEffectTypeChange = useCallback((effectType: SlideEffectType) => {
    if (!interaction) return;
    onInteractionUpdate(interaction.id, { 
      effect: { 
        ...interaction.effect, 
        type: effectType,
        // Reset parameters when changing effect type
        parameters: {} as EffectParameters
      } 
    });
  }, [interaction, onInteractionUpdate]);

  const handleEffectPropertyChange = useCallback((property: string, value: any) => {
    if (!interaction) return;
    onInteractionUpdate(interaction.id, { 
      effect: { 
        ...interaction.effect, 
        [property]: value 
      } 
    });
  }, [interaction, onInteractionUpdate]);

  const handleParameterChange = useCallback((parameter: string, value: any) => {
    if (!interaction) return;
    onInteractionUpdate(interaction.id, { 
      effect: { 
        ...interaction.effect, 
        parameters: {
          ...interaction.effect.parameters,
          [parameter]: value
        }
      } 
    });
  }, [interaction, onInteractionUpdate]);

  if (!interaction) {
    return (
      <div className={`text-center py-6 text-slate-400 ${className}`}>
        <div className="text-2xl mb-2">👈</div>
        <p className="text-sm">Select an interaction to configure its settings</p>
        <p className="text-xs mt-1 text-slate-500">Choose from the interactions list above</p>
      </div>
    );
  }

  const preset = interactionPresets[interaction.effect.type as InteractionType];

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-2 pb-2 border-b border-slate-600">
        <span className="text-lg">{preset?.icon || '⚡'}</span>
        <div>
          <h3 className="text-white font-medium text-sm">
            {preset?.name || interaction.effect.type} Settings
          </h3>
          <p className="text-slate-400 text-xs">
            Configure how this interaction behaves
          </p>
        </div>
      </div>

      {/* Trigger Settings */}
      <div>
        <label className="block text-xs font-medium text-slate-300 mb-2">
          Trigger Event
        </label>
        <select
          value={interaction.trigger}
          onChange={(e) => handleTriggerChange(e.target.value)}
          className="w-full p-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        >
          <option value="click">Click</option>
          <option value="hover">Hover</option>
          <option value="timeline">Timeline</option>
        </select>
        <p className="text-xs text-slate-400 mt-1">
          When should this interaction trigger?
        </p>
      </div>

      {/* Effect Type */}
      <div>
        <label className="block text-xs font-medium text-slate-300 mb-2">
          Effect Type
        </label>
        <select
          value={interaction.effect.type}
          onChange={(e) => handleEffectTypeChange(e.target.value as SlideEffectType)}
          className="w-full p-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        >
          {Object.entries(interactionPresets).map(([type, preset]) => (
            <option key={type} value={type}>
              {preset.icon} {preset.name}
            </option>
          ))}
        </select>
        <p className="text-xs text-slate-400 mt-1">
          {preset?.description || 'What should happen when triggered?'}
        </p>
      </div>

      {/* Timing Settings */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-2">
            Duration (ms)
          </label>
          <input
            type="number"
            value={interaction.effect.duration || 500}
            onChange={(e) => handleEffectPropertyChange('duration', parseInt(e.target.value) || 500)}
            className="w-full p-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            min="0"
            step="100"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-2">
            Delay (ms)
          </label>
          <input
            type="number"
            value={interaction.effect.delay || 0}
            onChange={(e) => handleEffectPropertyChange('delay', parseInt(e.target.value) || 0)}
            className="w-full p-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            min="0"
            step="100"
          />
        </div>
      </div>

      {/* Effect-Specific Parameters */}
      {interaction.effect.type === 'modal' && (
        <div className="space-y-3 p-3 bg-slate-700/30 rounded-lg border border-slate-600/50">
          <h4 className="text-sm font-medium text-slate-200 flex items-center gap-2">
            📋 Modal Settings
          </h4>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">
              Modal Title
            </label>
            <input
              type="text"
              value={(interaction.effect.parameters as any)?.title || ''}
              onChange={(e) => handleParameterChange('title', e.target.value)}
              className="w-full p-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter modal title"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">
              Modal Message
            </label>
            <textarea
              value={(interaction.effect.parameters as any)?.message || ''}
              onChange={(e) => handleParameterChange('message', e.target.value)}
              className="w-full p-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              placeholder="Enter modal content"
              rows={3}
            />
          </div>
        </div>
      )}

      {interaction.effect.type === 'transition' && (
        <div className="space-y-3 p-3 bg-slate-700/30 rounded-lg border border-slate-600/50">
          <h4 className="text-sm font-medium text-slate-200 flex items-center gap-2">
            ➡️ Transition Settings
          </h4>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">
              Transition Type
            </label>
            <select
              value={(interaction.effect.parameters as any)?.type || 'next-slide'}
              onChange={(e) => handleParameterChange('type', e.target.value)}
              className="w-full p-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="next-slide">Next Slide</option>
              <option value="prev-slide">Previous Slide</option>
              <option value="first-slide">First Slide</option>
              <option value="last-slide">Last Slide</option>
              <option value="specific-slide">Specific Slide</option>
            </select>
          </div>
          {(interaction.effect.parameters as any)?.type === 'specific-slide' && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">
                Target Slide Index
              </label>
              <input
                type="number"
                value={(interaction.effect.parameters as any)?.slideIndex || 0}
                onChange={(e) => handleParameterChange('slideIndex', parseInt(e.target.value) || 0)}
                className="w-full p-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                min="0"
              />
            </div>
          )}
        </div>
      )}

      {interaction.effect.type === 'sound' && (
        <div className="space-y-3 p-3 bg-slate-700/30 rounded-lg border border-slate-600/50">
          <h4 className="text-sm font-medium text-slate-200 flex items-center gap-2">
            🔊 Sound Settings
          </h4>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">
              Sound URL
            </label>
            <input
              type="url"
              value={(interaction.effect.parameters as any)?.url || ''}
              onChange={(e) => handleParameterChange('url', e.target.value)}
              className="w-full p-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="https://example.com/sound.mp3"
            />
          </div>
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
                value={(interaction.effect.parameters as any)?.volume || 0.7}
                onChange={(e) => handleParameterChange('volume', parseFloat(e.target.value))}
                className="flex-1"
              />
              <span className="text-xs text-slate-400 w-8">
                {Math.round(((interaction.effect.parameters as any)?.volume || 0.7) * 100)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {interaction.effect.type === 'tooltip' && (
        <div className="space-y-3 p-3 bg-slate-700/30 rounded-lg border border-slate-600/50">
          <h4 className="text-sm font-medium text-slate-200 flex items-center gap-2">
            💬 Tooltip Settings
          </h4>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">
              Tooltip Text
            </label>
            <textarea
              value={(interaction.effect.parameters as any)?.text || ''}
              onChange={(e) => handleParameterChange('text', e.target.value)}
              className="w-full p-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              placeholder="Enter tooltip text"
              rows={2}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">
              Position
            </label>
            <select
              value={(interaction.effect.parameters as any)?.position || 'top'}
              onChange={(e) => handleParameterChange('position', e.target.value)}
              className="w-full p-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="top">Top</option>
              <option value="bottom">Bottom</option>
              <option value="left">Left</option>
              <option value="right">Right</option>
            </select>
          </div>
        </div>
      )}

      {interaction.effect.type === 'spotlight' && (
        <div className="space-y-3 p-3 bg-slate-700/30 rounded-lg border border-slate-600/50">
          <h4 className="text-sm font-medium text-slate-200 flex items-center gap-2">
            💡 Spotlight Settings
          </h4>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">
              Spotlight Shape
            </label>
            <select
              value={(interaction.effect.parameters as any)?.spotlightShape || 'circle'}
              onChange={(e) => handleParameterChange('spotlightShape', e.target.value)}
              className="w-full p-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="circle">Circle</option>
              <option value="rectangle">Rectangle</option>
              <option value="oval">Oval</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">
                Width (px)
              </label>
              <input
                type="number"
                value={(interaction.effect.parameters as any)?.spotlightWidth || 200}
                onChange={(e) => handleParameterChange('spotlightWidth', parseInt(e.target.value) || 200)}
                className="w-full p-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                min="50"
                max="1000"
                step="10"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">
                Height (px)
              </label>
              <input
                type="number"
                value={(interaction.effect.parameters as any)?.spotlightHeight || 200}
                onChange={(e) => handleParameterChange('spotlightHeight', parseInt(e.target.value) || 200)}
                className="w-full p-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                min="50"
                max="1000"
                step="10"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">
                Position X (%)
              </label>
              <input
                type="number"
                value={(interaction.effect.parameters as any)?.spotlightX || 50}
                onChange={(e) => handleParameterChange('spotlightX', parseFloat(e.target.value) || 50)}
                className="w-full p-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                min="0"
                max="100"
                step="1"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">
                Position Y (%)
              </label>
              <input
                type="number"
                value={(interaction.effect.parameters as any)?.spotlightY || 50}
                onChange={(e) => handleParameterChange('spotlightY', parseFloat(e.target.value) || 50)}
                className="w-full p-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                min="0"
                max="100"
                step="1"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">
              Background Dimming
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={(interaction.effect.parameters as any)?.backgroundDimPercentage || 70}
                onChange={(e) => handleParameterChange('backgroundDimPercentage', parseInt(e.target.value))}
                className="flex-1"
              />
              <span className="text-xs text-slate-400 w-12">
                {(interaction.effect.parameters as any)?.backgroundDimPercentage || 70}%
              </span>
            </div>
          </div>
        </div>
      )}

      {interaction.effect.type === 'pan_zoom' && (
        <div className="space-y-3 p-3 bg-slate-700/30 rounded-lg border border-slate-600/50">
          <h4 className="text-sm font-medium text-slate-200 flex items-center gap-2">
            🔍 Pan & Zoom Settings
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">
                Target X (%)
              </label>
              <input
                type="number"
                value={(interaction.effect.parameters as any)?.targetX || 50}
                onChange={(e) => handleParameterChange('targetX', parseFloat(e.target.value) || 50)}
                className="w-full p-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                min="0"
                max="100"
                step="1"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">
                Target Y (%)
              </label>
              <input
                type="number"
                value={(interaction.effect.parameters as any)?.targetY || 50}
                onChange={(e) => handleParameterChange('targetY', parseFloat(e.target.value) || 50)}
                className="w-full p-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                min="0"
                max="100"
                step="1"
              />
            </div>
          </div>
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
                value={(interaction.effect.parameters as any)?.zoomLevel || 2.0}
                onChange={(e) => handleParameterChange('zoomLevel', parseFloat(e.target.value))}
                className="flex-1"
              />
              <span className="text-xs text-slate-400 w-12">
                {Math.round(((interaction.effect.parameters as any)?.zoomLevel || 2.0) * 100)}%
              </span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">
              Animation Duration (ms)
            </label>
            <input
              type="number"
              value={(interaction.effect.parameters as any)?.duration || 1000}
              onChange={(e) => handleParameterChange('duration', parseInt(e.target.value) || 1000)}
              className="w-full p-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              min="100"
              max="5000"
              step="100"
            />
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="smooth-animation"
              checked={(interaction.effect.parameters as any)?.smooth !== false}
              onChange={(e) => handleParameterChange('smooth', e.target.checked)}
              className="rounded border-slate-600 bg-slate-700 text-purple-600 focus:ring-purple-500"
            />
            <label htmlFor="smooth-animation" className="text-sm text-slate-300 flex-1">
              Smooth Animation
            </label>
          </div>
        </div>
      )}

      {/* Timeline-specific settings */}
      {interaction.trigger === 'timeline' && (
        <div className="space-y-3 p-3 bg-slate-700/30 rounded-lg border border-slate-600/50">
          <h4 className="text-sm font-medium text-slate-200 flex items-center gap-2">
            ⏱️ Timeline Settings
          </h4>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">
              Timeline Step
            </label>
            <input
              type="number"
              value={(interaction.effect.parameters as any)?.timelineStep || 1}
              onChange={(e) => handleParameterChange('timelineStep', parseInt(e.target.value) || 1)}
              className="w-full p-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              min="1"
              placeholder="Enter timeline step number"
            />
            <p className="text-xs text-slate-400 mt-1">
              The timeline step when this interaction should trigger
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="auto-advance"
              checked={(interaction.effect.parameters as any)?.autoAdvance || false}
              onChange={(e) => handleParameterChange('autoAdvance', e.target.checked)}
              className="rounded border-slate-600 bg-slate-700 text-purple-600 focus:ring-purple-500"
            />
            <label htmlFor="auto-advance" className="text-sm text-slate-300 flex-1">
              Auto-advance Timeline
            </label>
          </div>
          <p className="text-xs text-slate-400">
            Automatically advance to next timeline step after this interaction
          </p>
        </div>
      )}

      {/* Preview/Test Section */}
      <div className="pt-3 border-t border-slate-600">
        <div className="text-xs text-slate-400 text-center">
          💡 Changes are applied immediately. Test your interaction on the canvas!
        </div>
      </div>
    </div>
  );
};

export default InteractionEditor;