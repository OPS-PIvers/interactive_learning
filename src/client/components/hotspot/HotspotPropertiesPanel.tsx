import React, { useState, useCallback, useEffect } from 'react';
import { WalkthroughHotspot } from '../../../shared/hotspotTypes';

interface HotspotPropertiesPanelProps {
  hotspot: WalkthroughHotspot | null;
  onUpdate: (hotspot: WalkthroughHotspot) => void;
  onDelete: (hotspotId: string) => void;
}

export default function HotspotPropertiesPanel({
  hotspot,
  onUpdate,
  onDelete
}: HotspotPropertiesPanelProps) {
  
  const [localHotspot, setLocalHotspot] = useState<WalkthroughHotspot | null>(hotspot);
  
  // Update local state when hotspot prop changes
  useEffect(() => {
    setLocalHotspot(hotspot);
  }, [hotspot]);
  
  const handleContentChange = useCallback((field: string, value: string) => {
    if (!localHotspot) return;
    
    const updated = {
      ...localHotspot,
      content: {
        ...localHotspot.content,
        [field]: value
      }
    };
    setLocalHotspot(updated);
    onUpdate(updated);
  }, [localHotspot, onUpdate]);
  
  const handleEffectChange = useCallback((field: string, value: any) => {
    if (!localHotspot) return;
    
    const updated = {
      ...localHotspot,
      interaction: {
        ...localHotspot.interaction,
        effect: {
          ...localHotspot.interaction.effect,
          [field]: value
        }
      }
    };
    setLocalHotspot(updated);
    onUpdate(updated);
  }, [localHotspot, onUpdate]);
  
  const handleStyleChange = useCallback((field: string, value: any) => {
    if (!localHotspot) return;
    
    const updated = {
      ...localHotspot,
      style: {
        ...localHotspot.style,
        [field]: value
      }
    };
    setLocalHotspot(updated);
    onUpdate(updated);
  }, [localHotspot, onUpdate]);
  
  if (!localHotspot) {
    return (
      <div className="p-6 bg-white border-l border-gray-200 h-full">
        <div className="text-center text-gray-500 mt-8">
          <div className="w-12 h-12 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.122 2.122" />
            </svg>
          </div>
          <p className="text-sm">Select a hotspot to edit its properties</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6 bg-white border-l border-gray-200 h-full overflow-y-auto">
      <div className="space-y-6">
        {/* Header */}
        <div className="border-b border-gray-200 pb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Hotspot Properties
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Step {localHotspot.sequenceIndex + 1}
          </p>
        </div>
        
        {/* Content Section */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Content</h4>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title
            </label>
            <input
              type="text"
              value={localHotspot.content.title || ''}
              onChange={(e) => handleContentChange('title', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Step title"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={localHotspot.content.description || ''}
              onChange={(e) => handleContentChange('description', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Describe what happens in this step"
            />
          </div>
        </div>
        
        {/* Effect Section */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Effect</h4>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Effect Type
            </label>
            <select
              value={localHotspot.interaction.effect.type}
              onChange={(e) => handleEffectChange('type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="spotlight">Spotlight</option>
              <option value="text">Text Popup</option>
              <option value="tooltip">Tooltip</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duration (seconds)
            </label>
            <input
              type="number"
              min="1"
              max="30"
              value={(localHotspot.interaction.effect.duration || 3000) / 1000}
              onChange={(e) => handleEffectChange('duration', parseInt(e.target.value) * 1000)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* Effect-specific parameters */}
          {localHotspot.interaction.effect.type === 'spotlight' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Intensity (%)
              </label>
              <input
                type="range"
                min="30"
                max="90"
                value={localHotspot.interaction.effect.parameters?.intensity || 70}
                onChange={(e) => handleEffectChange('parameters', { 
                  ...localHotspot.interaction.effect.parameters,
                  intensity: parseInt(e.target.value)
                })}
                className="w-full"
              />
              <div className="text-xs text-gray-500 mt-1">
                {localHotspot.interaction.effect.parameters?.intensity || 70}%
              </div>
            </div>
          )}
          
          {localHotspot.interaction.effect.type === 'text' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Text Message
              </label>
              <input
                type="text"
                value={localHotspot.interaction.effect.parameters?.text || localHotspot.content.description || ''}
                onChange={(e) => handleEffectChange('parameters', { 
                  ...localHotspot.interaction.effect.parameters,
                  text: e.target.value
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Text to display"
              />
            </div>
          )}
        </div>
        
        {/* Style Section */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Style</h4>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Color
            </label>
            <div className="flex space-x-2">
              {['#2d3f89', '#ad2122', '#2e8540', '#f9c642'].map((color) => (
                <button
                  key={color}
                  onClick={() => handleStyleChange('color', color)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    localHotspot.style.color === color ? 'border-gray-800 scale-110' : 'border-gray-300 hover:border-gray-400'
                  }`}
                  style={{ backgroundColor: color }}
                  title={`Select ${color}`}
                />
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Size
            </label>
            <select
              value={localHotspot.style.size}
              onChange={(e) => handleStyleChange('size', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="small">Small (32px)</option>
              <option value="medium">Medium (48px)</option>
              <option value="large">Large (64px)</option>
            </select>
          </div>
          
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={localHotspot.style.pulseAnimation}
                onChange={(e) => handleStyleChange('pulseAnimation', e.target.checked)}
                className="mr-2 text-blue-500 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Pulse animation</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={localHotspot.style.hideAfterTrigger}
                onChange={(e) => handleStyleChange('hideAfterTrigger', e.target.checked)}
                className="mr-2 text-blue-500 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Hide after trigger</span>
            </label>
          </div>
        </div>
        
        {/* Actions */}
        <div className="pt-4 border-t border-gray-200">
          <button
            onClick={() => onDelete(localHotspot.id)}
            className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium"
          >
            Delete Hotspot
          </button>
        </div>
      </div>
    </div>
  );
}