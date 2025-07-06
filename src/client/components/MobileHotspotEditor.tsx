import React, { useState, useEffect, useCallback, useMemo } from 'react';
import debounce from 'lodash.debounce';
import { HotspotData, HotspotSize } from '../../shared/types';

interface MobileHotspotEditorProps {
  hotspot: HotspotData;
  onUpdate: (updates: Partial<HotspotData>) => void;
  onDelete?: () => void;
}

const DEBOUNCE_DELAY = 500;

const MOBILE_COLOR_OPTIONS = [
  { value: 'bg-red-500', label: 'Red', color: '#ef4444' },
  { value: 'bg-blue-500', label: 'Blue', color: '#3b82f6' },
  { value: 'bg-green-500', label: 'Green', color: '#22c55e' },
  { value: 'bg-yellow-500', label: 'Yellow', color: '#eab308' },
  { value: 'bg-purple-500', label: 'Purple', color: '#a855f7' },
  { value: 'bg-pink-500', label: 'Pink', color: '#ec4899' },
  { value: 'bg-indigo-500', label: 'Indigo', color: '#6366f1' },
  { value: 'bg-gray-500', label: 'Gray', color: '#6b7280' },
];

const HOTSPOT_SIZES = [
  { value: 'small', label: 'S', previewClass: 'w-4 h-4' },
  { value: 'medium', label: 'M', previewClass: 'w-6 h-6' },
  { value: 'large', label: 'L', previewClass: 'w-8 h-8' },
];

type ActiveTab = 'basic' | 'style';

const MobileHotspotEditor: React.FC<MobileHotspotEditorProps> = ({ hotspot, onUpdate, onDelete }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('basic');
  const [internalHotspot, setInternalHotspot] = useState<HotspotData>(hotspot);

  // Debounced onUpdate function
  const debouncedOnUpdate = useMemo(
    () =>
      debounce((updates: Partial<HotspotData>) => {
        onUpdate(updates);
      }, DEBOUNCE_DELAY),
    [onUpdate]
  );

  useEffect(() => {
    setInternalHotspot(hotspot);
    // When the external hotspot data changes, cancel any pending debounced updates
    // to prevent updating stale data or the wrong hotspot.
    // Flush any pending changes for the outgoing hotspot before switching to the new one.
    return () => {
      debouncedOnUpdate.flush();
    };
  }, [hotspot, debouncedOnUpdate]);


  // Update internal state and call onUpdate (or debouncedOnUpdate) when changes are made
  const handleChange = useCallback((field: keyof HotspotData, value: any) => {
    setInternalHotspot(prevHotspot => ({ ...prevHotspot, [field]: value }));

    if (field === 'title' || field === 'description') {
      debouncedOnUpdate({ [field]: value });
    } else {
      // For non-text fields (color, size), update immediately
      onUpdate({ [field]: value });
      // If there was a pending debounced update for text, it might be good to cancel it,
      // or ensure the immediate update doesn't conflict.
      // However, typical use case is editing text OR clicking a button, not simultaneously.
      // For now, this should be fine.
    }
  }, [onUpdate, debouncedOnUpdate]);


  // Ensure debounced calls are flushed or cancelled on unmount
  useEffect(() => {
    return () => {
      debouncedOnUpdate.flush();
    };
  }, [debouncedOnUpdate]);

  const renderBasicTab = () => (
    <div className="space-y-4">
      <div>
        <label htmlFor="hotspotTitle" className="block text-sm font-medium text-slate-300 mb-1">
          Title
        </label>
        <input
          type="text"
          id="hotspotTitle"
          value={internalHotspot.title || ''}
          onChange={(e) => handleChange('title', e.target.value)}
          className="w-full p-3 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:ring-purple-500 focus:border-purple-500"
          placeholder="Enter hotspot title"
        />
      </div>
      <div>
        <label htmlFor="hotspotDescription" className="block text-sm font-medium text-slate-300 mb-1">
          Description
        </label>
        <textarea
          id="hotspotDescription"
          value={internalHotspot.description || ''}
          onChange={(e) => handleChange('description', e.target.value)}
          rows={3}
          className="w-full p-3 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:ring-purple-500 focus:border-purple-500"
          placeholder="Enter hotspot description"
        />
      </div>
    </div>
  );

  const renderStyleTab = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Background Color
        </label>
        <div className="grid grid-cols-4 gap-3">
          {MOBILE_COLOR_OPTIONS.map(option => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleChange('backgroundColor', option.value)}
              className={`aspect-square rounded-lg border-2 flex items-center justify-center
                          ${internalHotspot.backgroundColor === option.value ? 'border-white ring-2 ring-purple-500' : 'border-transparent hover:border-slate-400'}`}
              style={{ backgroundColor: option.color }}
              aria-label={option.label}
            >
              {internalHotspot.backgroundColor === option.value && (
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Size
        </label>
        <div className="flex space-x-3">
          {HOTSPOT_SIZES.map(sizeOpt => (
            <button
              key={sizeOpt.value}
              type="button"
              onClick={() => handleChange('size', sizeOpt.value as 'small' | 'medium' | 'large')}
              className={`p-3 border rounded-md flex-1 flex flex-col items-center justify-center
                          ${internalHotspot.size === sizeOpt.value ? 'bg-purple-600 border-purple-500 text-white' : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'}`}
            >
              <div className={`rounded-full bg-slate-400 mb-1 ${sizeOpt.previewClass}`} />
              <span className="text-sm">{sizeOpt.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-slate-800 text-white h-full flex flex-col">
      {/* Tab Navigation */}
      <div className="flex border-b border-slate-700">
        <button
          onClick={() => setActiveTab('basic')}
          className={`flex-1 py-3 px-4 text-center font-medium transition-colors
                      ${activeTab === 'basic' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-slate-400 hover:text-slate-200'}`}
        >
          Basic
        </button>
        <button
          onClick={() => setActiveTab('style')}
          className={`flex-1 py-3 px-4 text-center font-medium transition-colors
                      ${activeTab === 'style' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-slate-400 hover:text-slate-200'}`}
        >
          Style
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'basic' && renderBasicTab()}
        {activeTab === 'style' && renderStyleTab()}
      </div>

      {/* Action Buttons */}
      {onDelete && (
        <div className="p-4 border-t border-slate-700">
          <button
            onClick={onDelete}
            className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 rounded-md text-white font-semibold transition-colors"
          >
            Delete Hotspot
          </button>
        </div>
      )}
    </div>
  );
};

export default MobileHotspotEditor;
// Placeholder for HotspotData if not defined globally
// export interface HotspotData {
//   id: string;
//   title?: string;
//   description?: string;
//   backgroundColor?: string; // e.g., 'bg-red-500' or '#ef4444' for style consistency
//   size?: 'small' | 'medium' | 'large';
//   // other potential fields
//   x?: number; // position
//   y?: number; // position
//   link?: string;
// }
