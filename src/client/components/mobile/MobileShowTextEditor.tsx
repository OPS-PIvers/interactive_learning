import React, { useState } from 'react';
import { TimelineEventData } from '../../../shared/types';

interface MobileShowTextEditorProps {
  event: TimelineEventData;
  onUpdate: (event: TimelineEventData) => void;
  onClose: () => void;
}

const MobileShowTextEditor: React.FC<MobileShowTextEditorProps> = ({ event, onUpdate, onClose }) => {
  const [internalEvent, setInternalEvent] = useState<TimelineEventData>(event);

  const handleUpdate = (field: keyof TimelineEventData, value: TimelineEventData[keyof TimelineEventData]) => {
    const newEvent = { ...internalEvent, [field]: value };
    setInternalEvent(newEvent);
  };

  return (
    <div className="p-4 bg-slate-800 text-white h-full flex flex-col space-y-4">
      <div className="flex-1 overflow-y-auto pr-2 space-y-4">
        <div>
          <label htmlFor="text-content" className="block text-sm font-medium text-slate-300 mb-2">
            Text Content
          </label>
          <textarea
            id="text-content"
            placeholder="Enter the text to display..."
            value={internalEvent.textContent || ''}
            onChange={e => handleUpdate('textContent', e.target.value)}
            className="w-full p-3 bg-slate-600 rounded-md border border-slate-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none"
            rows={6}
          />
          <p className="text-xs text-slate-400 mt-1">
            This text will be displayed when the hotspot is activated
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label htmlFor="auto-dismiss" className="text-sm text-slate-300">
              Auto-dismiss after delay
            </label>
            <button
              type="button"
              id="auto-dismiss"
              role="switch"
              aria-checked={!!internalEvent.autoDismiss}
              onClick={() => handleUpdate('autoDismiss', !internalEvent.autoDismiss)}
              className={`relative inline-flex items-center h-6 rounded-full w-11 cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-purple-500 ${internalEvent.autoDismiss ? 'bg-green-500' : 'bg-gray-600'}`}
            >
              <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${internalEvent.autoDismiss ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          {internalEvent.autoDismiss && (
            <div>
              <label htmlFor="dismiss-delay" className="block text-sm font-medium text-slate-300 mb-2">
                Display Duration (seconds)
              </label>
              <input
                id="dismiss-delay"
                type="number"
                min="1"
                max="30"
                value={internalEvent.dismissDelay || 5}
                onChange={e => {
                  const value = parseInt(e.target.value, 10);
                  handleUpdate('dismissDelay', isNaN(value) ? 5 : Math.max(1, Math.min(30, value)));
                }}
                className="w-full p-2 bg-slate-600 rounded-md border border-slate-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
              <p className="text-xs text-slate-400 mt-1">
                Text will automatically disappear after this duration
              </p>
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
              aria-checked={!!internalEvent.allowClickToClose}
              onClick={() => handleUpdate('allowClickToClose', !internalEvent.allowClickToClose)}
              className={`relative inline-flex items-center h-6 rounded-full w-11 cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-purple-500 ${internalEvent.allowClickToClose ? 'bg-green-500' : 'bg-gray-600'}`}
            >
              <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${internalEvent.allowClickToClose ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="text-position" className="block text-sm font-medium text-slate-300 mb-2">
            Text Position
          </label>
          <select
            id="text-position"
            value={internalEvent.textPosition || 'center'}
            onChange={e => handleUpdate('textPosition', e.target.value)}
            className="w-full p-2 bg-slate-600 rounded-md border border-slate-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          >
            <option value="top-left">Top Left</option>
            <option value="top-center">Top Center</option>
            <option value="top-right">Top Right</option>
            <option value="center-left">Center Left</option>
            <option value="center">Center</option>
            <option value="center-right">Center Right</option>
            <option value="bottom-left">Bottom Left</option>
            <option value="bottom-center">Bottom Center</option>
            <option value="bottom-right">Bottom Right</option>
          </select>
          <p className="text-xs text-slate-400 mt-1">
            Choose where the text appears relative to the hotspot
          </p>
        </div>
      </div>

      <div className="p-4 border-t border-slate-700">
        <button
          onClick={() => {
            onUpdate(internalEvent);
            onClose();
          }}
          className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 rounded-md text-white font-semibold transition-colors"
        >
          Save and close
        </button>
      </div>
    </div>
  );
};

export default MobileShowTextEditor;