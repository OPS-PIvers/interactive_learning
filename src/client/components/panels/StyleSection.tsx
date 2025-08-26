import React from 'react';
import { SlideElement } from '../../../shared/slideTypes';

const FORM_STYLES = {
  input: "w-full border rounded px-3 py-2 transition-colors focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-800 border-gray-700 text-white placeholder-gray-500",
  select: "w-full border rounded px-3 py-2 transition-colors focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-800 border-gray-700 text-white",
  label: "block text-sm font-medium mb-1 text-gray-400",
  colorInput: "w-full h-10 border rounded cursor-pointer bg-gray-800 border-gray-700",
} as const;

interface StyleSectionProps {
  element: SlideElement;
  onUpdate: (updates: Partial<SlideElement>) => void;
}

const StyleSection: React.FC<StyleSectionProps> = ({
  element,
  onUpdate
}) => {
  const handleStyleUpdate = (styleUpdates: Partial<SlideElement['style']>) => {
    onUpdate({
      style: {
        ...element.style,
        ...styleUpdates
      }
    });
  };

  return (
    <div className="properties-section">
      <div className="properties-section__header">
        <h4 className="text-md font-semibold text-gray-300 mb-4">Style</h4>
      </div>
      
      <div className="space-y-4">
        {/* Background Color */}
        <div>
          <label className={FORM_STYLES.label}>Background Color</label>
          <div className="flex space-x-2">
            <input
              type="color"
              value={element.style?.backgroundColor || '#3b82f6'}
              onChange={(e) => handleStyleUpdate({ backgroundColor: e.target.value })}
              className={FORM_STYLES.colorInput}
            />
            <input
              type="text"
              value={element.style?.backgroundColor || '#3b82f6'}
              onChange={(e) => handleStyleUpdate({ backgroundColor: e.target.value })}
              className={`${FORM_STYLES.input} flex-1`}
              placeholder="#3b82f6"
            />
          </div>
        </div>

        {/* Border Color */}
        <div>
          <label className={FORM_STYLES.label}>Border Color</label>
          <div className="flex space-x-2">
            <input
              type="color"
              value={element.style?.borderColor || '#1e40af'}
              onChange={(e) => handleStyleUpdate({ borderColor: e.target.value })}
              className={FORM_STYLES.colorInput}
            />
            <input
              type="text"
              value={element.style?.borderColor || '#1e40af'}
              onChange={(e) => handleStyleUpdate({ borderColor: e.target.value })}
              className={`${FORM_STYLES.input} flex-1`}
              placeholder="#1e40af"
            />
          </div>
        </div>

        {/* Border Width */}
        <div>
          <label className={FORM_STYLES.label}>
            Border Width: {element.style?.borderWidth || 0}px
          </label>
          <input
            type="range"
            min="0"
            max="10"
            value={element.style?.borderWidth || 0}
            onChange={(e) => handleStyleUpdate({ borderWidth: Number(e.target.value) })}
            className="w-full"
          />
        </div>

        {/* Opacity */}
        <div>
          <label className={FORM_STYLES.label}>
            Opacity: {Math.round((element.style?.opacity || 1) * 100)}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={Math.round((element.style?.opacity || 1) * 100)}
            onChange={(e) => handleStyleUpdate({ opacity: Number(e.target.value) / 100 })}
            className="w-full"
          />
        </div>

        {/* Border Radius */}
        <div>
          <label className={FORM_STYLES.label}>
            Border Radius: {element.style?.borderRadius || 0}px
          </label>
          <input
            type="range"
            min="0"
            max="50"
            value={element.style?.borderRadius || 0}
            onChange={(e) => handleStyleUpdate({ borderRadius: Number(e.target.value) })}
            className="w-full"
          />
        </div>

        {/* Text Color (for text elements) */}
        {element.type === 'text' && (
          <div>
            <label className={FORM_STYLES.label}>Text Color</label>
            <div className="flex space-x-2">
              <input
                type="color"
                value={element.style?.color || '#000000'}
                onChange={(e) => handleStyleUpdate({ color: e.target.value })}
                className={FORM_STYLES.colorInput}
              />
              <input
                type="text"
                value={element.style?.color || '#000000'}
                onChange={(e) => handleStyleUpdate({ color: e.target.value })}
                className={`${FORM_STYLES.input} flex-1`}
                placeholder="#000000"
              />
            </div>
          </div>
        )}

        {/* Font Size (for text elements) */}
        {element.type === 'text' && (
          <div>
            <label className={FORM_STYLES.label}>
              Font Size: {element.style?.fontSize || 16}px
            </label>
            <input
              type="range"
              min="8"
              max="72"
              value={element.style?.fontSize || 16}
              onChange={(e) => handleStyleUpdate({ fontSize: Number(e.target.value) })}
              className="w-full"
            />
          </div>
        )}

        {/* Font Weight (for text elements) */}
        {element.type === 'text' && (
          <div>
            <label className={FORM_STYLES.label}>Font Weight</label>
            <select
              value={element.style?.fontWeight || 'normal'}
              onChange={(e) => handleStyleUpdate({ fontWeight: e.target.value as any })}
              className={FORM_STYLES.select}
            >
              <option value="normal">Normal</option>
              <option value="bold">Bold</option>
              <option value="lighter">Light</option>
              <option value="100">100</option>
              <option value="200">200</option>
              <option value="300">300</option>
              <option value="400">400</option>
              <option value="500">500</option>
              <option value="600">600</option>
              <option value="700">700</option>
              <option value="800">800</option>
              <option value="900">900</option>
            </select>
          </div>
        )}

        {/* Text Align (for text elements) */}
        {element.type === 'text' && (
          <div>
            <label className={FORM_STYLES.label}>Text Align</label>
            <select
              value={element.style?.textAlign || 'left'}
              onChange={(e) => handleStyleUpdate({ textAlign: e.target.value as any })}
              className={FORM_STYLES.select}
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
              <option value="justify">Justify</option>
            </select>
          </div>
        )}

        {/* Shadow */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id={`shadow-${element.id}`}
            checked={Boolean(element.style?.boxShadow)}
            onChange={(e) => handleStyleUpdate({ 
              boxShadow: e.target.checked ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : '' 
            })}
            className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500"
          />
          <label htmlFor={`shadow-${element.id}`} className={FORM_STYLES.label}>
            Drop Shadow
          </label>
        </div>
      </div>
    </div>
  );
};

export default StyleSection;