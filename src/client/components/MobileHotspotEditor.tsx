import React, { useState, useEffect } from 'react';
import { HotspotData, HotspotSize } from '../../shared/types';

interface MobileHotspotEditorProps {
  hotspot: HotspotData;
  onUpdate: (updates: Partial<HotspotData>) => void;
  onDelete?: () => void;
}

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

const MobileHotspotEditor: React.FC<MobileHotspotEditorProps> = ({ hotspot, onUpdate, onDelete }) => {
  const [activeTab, setActiveTab] = useState<'basic' | 'style'>('basic');

  const renderBasicTab = () => (
    <div className="space-y-4 p-4">
      <div>
        <label htmlFor="hotspotTitle" className="block text-sm font-medium text-slate-300 mb-2">
          Title
        </label>
        <input
          id="hotspotTitle"
          type="text"
          value={hotspot.title || ''}
          onChange={(e) => onUpdate({ title: e.target.value })}
          className="mobile-input w-full"
          placeholder="Enter hotspot title"
        />
      </div>

      <div>
        <label htmlFor="hotspotDescription" className="block text-sm font-medium text-slate-300 mb-2">
          Description
        </label>
        <textarea
          id="hotspotDescription"
          value={hotspot.description || ''}
          onChange={(e) => onUpdate({ description: e.target.value })}
          className="mobile-input w-full min-h-24 resize-none"
          placeholder="Enter description"
          rows={3}
        />
      </div>
    </div>
  );

  const renderStyleTab = () => (
    <div className="space-y-4 p-4">
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-3">
          Color
        </label>
        <div className="grid grid-cols-4 gap-3">
          {MOBILE_COLOR_OPTIONS.map((color) => (
            <button
              key={color.value}
              onClick={() => onUpdate({ backgroundColor: color.value })}
              className={`mobile-touch-target aspect-square rounded-lg border-2 transition-all ${
                hotspot.backgroundColor === color.value
                  ? 'border-white ring-2 ring-purple-500'
                  : 'border-transparent hover:border-slate-400'
              }`}
              style={{ backgroundColor: color.color }}
              aria-label={color.label}
            >
              {hotspot.backgroundColor === color.value && (
                <svg className="w-6 h-6 text-white mx-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-slate-800 text-white h-full flex flex-col">
      {/* CRITICAL: Improved tab navigation */}
      <div className="flex border-b border-slate-700 bg-slate-900">
        <button
          onClick={() => setActiveTab('basic')}
          className={`flex-1 py-4 px-4 text-center font-medium transition-colors mobile-touch-target ${
            activeTab === 'basic'
              ? 'text-purple-400 border-b-2 border-purple-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Basic
        </button>
        <button
          onClick={() => setActiveTab('style')}
          className={`flex-1 py-4 px-4 text-center font-medium transition-colors mobile-touch-target ${
            activeTab === 'style'
              ? 'text-purple-400 border-b-2 border-purple-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Style
        </button>
      </div>

      {/* CRITICAL: Improved content area */}
      <div className="flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
        {activeTab === 'basic' && renderBasicTab()}
        {activeTab === 'style' && renderStyleTab()}
      </div>

      {/* CRITICAL: Improved delete button */}
      {onDelete && (
        <div className="p-4 border-t border-slate-700 bg-slate-900">
          <button
            onClick={() => {
              if (confirm('Are you sure you want to delete this hotspot?')) {
                onDelete();
              }
            }}
            className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 rounded-lg text-white font-semibold transition-colors mobile-touch-target"
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
