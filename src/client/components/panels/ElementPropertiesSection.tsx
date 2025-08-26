import React from 'react';
import { SlideElement } from '../../../shared/slideTypes';

const FORM_STYLES = {
  input: "w-full border rounded px-3 py-2 transition-colors focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-800 border-gray-700 text-white placeholder-gray-500",
  textarea: "w-full border rounded px-3 py-2 transition-colors focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-800 border-gray-700 text-white placeholder-gray-500",
  select: "w-full border rounded px-3 py-2 transition-colors focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-800 border-gray-700 text-white",
  label: "block text-sm font-medium mb-1 text-gray-400",
} as const;

interface ElementPropertiesSectionProps {
  element: SlideElement;
  onUpdate: (updates: Partial<SlideElement>) => void;
}

const ElementPropertiesSection: React.FC<ElementPropertiesSectionProps> = ({
  element,
  onUpdate
}) => {
  const handleContentUpdate = (contentUpdates: Partial<SlideElement['content']>) => {
    onUpdate({
      content: {
        ...element.content,
        ...contentUpdates
      }
    });
  };

  return (
    <div className="properties-section">
      <div className="properties-section__header">
        <h4 className="text-md font-semibold text-gray-300 mb-4">Element Properties</h4>
      </div>
      
      <div className="space-y-4">
        {/* Element Type Display */}
        <div>
          <label className={FORM_STYLES.label}>Element Type</label>
          <div className="px-3 py-2 bg-gray-700 rounded text-gray-300 text-sm capitalize">
            {element.type}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className={FORM_STYLES.label}>Title</label>
          <input
            type="text"
            value={element.content?.title || ''}
            onChange={(e) => handleContentUpdate({ title: e.target.value })}
            className={FORM_STYLES.input}
            placeholder={`${element.type} title...`}
          />
        </div>

        {/* Description */}
        <div>
          <label className={FORM_STYLES.label}>Description</label>
          <textarea
            value={element.content?.description || ''}
            onChange={(e) => handleContentUpdate({ description: e.target.value })}
            className={`${FORM_STYLES.textarea} h-20`}
            placeholder="Optional description..."
          />
        </div>

        {/* Media URL (for media type elements) */}
        {element.type === 'media' && (
          <div>
            <label className={FORM_STYLES.label}>Media URL</label>
            <input
              type="url"
              value={element.content?.mediaUrl || ''}
              onChange={(e) => handleContentUpdate({ mediaUrl: e.target.value })}
              className={FORM_STYLES.input}
              placeholder="https://example.com/image.jpg"
            />
          </div>
        )}

        {/* Media Type (for media elements) */}
        {element.type === 'media' && (
          <div>
            <label className={FORM_STYLES.label}>Media Type</label>
            <select
              value={element.content?.mediaType || 'image'}
              onChange={(e) => handleContentUpdate({ mediaType: e.target.value as 'image' | 'video' | 'audio' })}
              className={FORM_STYLES.select}
            >
              <option value="image">Image</option>
              <option value="video">Video</option>
              <option value="audio">Audio</option>
            </select>
          </div>
        )}

        {/* Display Mode */}
        <div>
          <label className={FORM_STYLES.label}>Display Mode</label>
          <select
            value={element.content?.displayMode || 'inline'}
            onChange={(e) => handleContentUpdate({ displayMode: e.target.value as 'inline' | 'modal' | 'overlay' })}
            className={FORM_STYLES.select}
          >
            <option value="inline">Inline</option>
            <option value="modal">Modal</option>
            <option value="overlay">Overlay</option>
          </select>
        </div>

        {/* Visibility Toggle */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id={`visible-${element.id}`}
            checked={element.isVisible}
            onChange={(e) => onUpdate({ isVisible: e.target.checked })}
            className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500"
          />
          <label htmlFor={`visible-${element.id}`} className={FORM_STYLES.label}>
            Visible
          </label>
        </div>
      </div>
    </div>
  );
};

export default ElementPropertiesSection;