import React, { useState, useEffect, useCallback } from 'react';
import { ElementInteraction, EffectParameters } from '../../../shared/slideTypes';

interface TextInteractionEditorProps {
  interaction: ElementInteraction;
  onUpdate: (updates: Partial<ElementInteraction>) => void;
  onDone: () => void;
}

// Define the structure of our text interaction parameters
interface TextParameters extends EffectParameters {
  title?: string;
  textContent?: string;
  autoDismiss?: boolean;
  dismissDelay?: number;
  allowClickToClose?: boolean;
}

export const TextInteractionEditor: React.FC<TextInteractionEditorProps> = ({
  interaction,
  onUpdate,
  onDone,
}) => {
  const [params, setParams] = useState<TextParameters>(
    interaction.effect.parameters as TextParameters
  );

  const handleParamChange = useCallback(<K extends keyof TextParameters>(
    param: K,
    value: TextParameters[K]
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
        parameters: params,
      },
    });
    onDone();
  };

  // Update internal state if the interaction prop changes from outside
  useEffect(() => {
    setParams(interaction.effect.parameters as TextParameters);
  }, [interaction]);

  return (
    <div className="p-4 bg-slate-800 text-white h-full flex flex-col space-y-4">
      <div className="flex-1 overflow-y-auto pr-2 space-y-6">
        <div>
          <label htmlFor="text-title" className="block text-sm font-medium text-slate-300 mb-2">
            Title
          </label>
          <input
            id="text-title"
            type="text"
            placeholder="Enter a title for the text popup"
            value={params.title || ''}
            onChange={e => handleParamChange('title', e.target.value)}
            className="w-full p-3 bg-slate-700 rounded-md border border-slate-600 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
        </div>
        <div>
          <label htmlFor="text-content" className="block text-sm font-medium text-slate-300 mb-2">
            Text Content
          </label>
          <textarea
            id="text-content"
            placeholder="Enter the text to display..."
            value={params.textContent || ''}
            onChange={e => handleParamChange('textContent', e.target.value)}
            className="w-full p-3 bg-slate-700 rounded-md border border-slate-600 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none"
            rows={8}
          />
          <p className="text-xs text-slate-400 mt-1">
            This text will be displayed when the interaction is triggered.
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label htmlFor="auto-dismiss" className="text-sm text-slate-300">
              Auto-dismiss after delay
            </label>
            <button
              type="button"
              id="auto-dismiss"
              role="switch"
              aria-checked={!!params.autoDismiss}
              onClick={() => handleParamChange('autoDismiss', !params.autoDismiss)}
              className={`relative inline-flex items-center h-6 rounded-full w-11 cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-purple-500 ${params.autoDismiss ? 'bg-green-500' : 'bg-gray-600'}`}
            >
              <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${params.autoDismiss ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          {params.autoDismiss && (
            <div>
              <label htmlFor="dismiss-delay" className="block text-sm font-medium text-slate-300 mb-2">
                Display Duration (seconds)
              </label>
              <input
                id="dismiss-delay"
                type="number"
                min="1"
                max="30"
                value={params.dismissDelay || 5}
                onChange={e => {
                  const value = parseInt(e.target.value, 10);
                  handleParamChange('dismissDelay', isNaN(value) ? 5 : Math.max(1, Math.min(30, value)));
                }}
                className="w-full p-2 bg-slate-700 rounded-md border border-slate-600 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
          )}

          <div className="flex items-center justify-between">
            <label htmlFor="clickable-close" className="text-sm text-slate-300">
              Allow click to close
            </label>
            <button
              type="button"
              id="clickable-close"
              role="switch"
              aria-checked={params.allowClickToClose !== false} // Default to true
              onClick={() => handleParamChange('allowClickToClose', params.allowClickToClose === false)}
              className={`relative inline-flex items-center h-6 rounded-full w-11 cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-purple-500 ${params.allowClickToClose !== false ? 'bg-green-500' : 'bg-gray-600'}`}
            >
              <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${params.allowClickToClose !== false ? 'translate-x-6' : 'translate-x-1'}`} />
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
