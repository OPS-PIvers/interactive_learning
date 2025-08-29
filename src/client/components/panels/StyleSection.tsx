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

      </div>
    </div>
  );
};

export default StyleSection;