import React from 'react';
import { InteractiveSlide, BackgroundMedia } from '../../../shared/slideTypes';

const FORM_STYLES = {
  input: "w-full border rounded px-3 py-2 transition-colors focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-800 border-gray-700 text-white placeholder-gray-500",
  textarea: "w-full border rounded px-3 py-2 transition-colors focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-800 border-gray-700 text-white placeholder-gray-500",
  select: "w-full border rounded px-3 py-2 transition-colors focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-800 border-gray-700 text-white",
  label: "block text-sm font-medium mb-1 text-gray-400",
  colorInput: "w-full h-10 border rounded cursor-pointer bg-gray-800 border-gray-700",
} as const;

interface SlidePropertiesSectionProps {
  slide: InteractiveSlide;
  onUpdate: (updates: Partial<InteractiveSlide>) => void;
}

const SlidePropertiesSection: React.FC<SlidePropertiesSectionProps> = ({
  slide,
  onUpdate
}) => {
  const handleBackgroundMediaUpdate = (mediaUpdates: Partial<BackgroundMedia>) => {
    onUpdate({
      backgroundMedia: {
        ...slide.backgroundMedia,
        ...mediaUpdates
      } as BackgroundMedia
    });
  };

  return (
    <div className="properties-section">
      <div className="properties-section__header">
        <h4 className="text-md font-semibold text-gray-300 mb-4">Slide Properties</h4>
      </div>
      
      <div className="space-y-6">
        {/* Basic Slide Info */}
        <div className="space-y-4">
          <h5 className="text-sm font-semibold text-gray-400">Basic Information</h5>
          
          <div>
            <label className={FORM_STYLES.label}>Slide Title</label>
            <input
              type="text"
              value={slide.title}
              onChange={(e) => onUpdate({ title: e.target.value })}
              className={FORM_STYLES.input}
              placeholder="Slide title..."
            />
          </div>

          <div>
            <label className={FORM_STYLES.label}>Slide ID</label>
            <div className="px-3 py-2 bg-gray-700 rounded text-gray-300 text-sm font-mono">
              {slide.id}
            </div>
          </div>
        </div>

        {/* Background Configuration */}
        <div className="space-y-4">
          <h5 className="text-sm font-semibold text-gray-400">Background</h5>
          
          <div>
            <label className={FORM_STYLES.label}>Background Type</label>
            <select
              value={slide.backgroundMedia?.type || 'color'}
              onChange={(e) => handleBackgroundMediaUpdate({ 
                type: e.target.value as BackgroundMedia['type'],
                ...(e.target.value === 'color' && { color: '#000000' })
              })}
              className={FORM_STYLES.select}
            >
              <option value="color">Solid Color</option>
              <option value="image">Image</option>
              <option value="video">Video</option>
              <option value="none">None</option>
            </select>
          </div>

          {/* Color Background */}
          {slide.backgroundMedia?.type === 'color' && (
            <div>
              <label className={FORM_STYLES.label}>Background Color</label>
              <div className="flex space-x-2">
                <input
                  type="color"
                  value={slide.backgroundMedia.color || '#000000'}
                  onChange={(e) => {
                    handleBackgroundMediaUpdate({ color: e.target.value });
                  }}
                  className={FORM_STYLES.colorInput}
                />
                <input
                  type="text"
                  value={slide.backgroundMedia.color || '#000000'}
                  onChange={(e) => {
                    handleBackgroundMediaUpdate({ color: e.target.value });
                  }}
                  className={`${FORM_STYLES.input} flex-1`}
                  placeholder="#000000"
                />
              </div>
            </div>
          )}

          {/* Image/Video URL */}
          {(slide.backgroundMedia?.type === 'image' || slide.backgroundMedia?.type === 'video') && (
            <div>
              <label className={FORM_STYLES.label}>
                {slide.backgroundMedia.type === 'image' ? 'Image URL' : 'Video URL'}
              </label>
              <input
                type="url"
                value={slide.backgroundMedia.url || ''}
                onChange={(e) => handleBackgroundMediaUpdate({ url: e.target.value })}
                className={FORM_STYLES.input}
                placeholder={`https://example.com/${slide.backgroundMedia.type === 'image' ? 'image.jpg' : 'video.mp4'}`}
              />
            </div>
          )}

          {/* Image/Video URL */}
          {(slide.backgroundMedia?.type === 'image' || slide.backgroundMedia?.type === 'video') && (
            <div>
              <label className={FORM_STYLES.label}>
                {slide.backgroundMedia.type === 'image' ? 'Image URL' : 'Video URL'}
              </label>
              <input
                type="url"
                value={slide.backgroundMedia.url || ''}
                onChange={(e) => handleBackgroundMediaUpdate({ url: e.target.value })}
                className={FORM_STYLES.input}
                placeholder={`https://example.com/${slide.backgroundMedia.type === 'image' ? 'image.jpg' : 'video.mp4'}`}
              />
            </div>
          )}
        </div>

        {/* Element Summary */}
        <div className="space-y-4">
          <h5 className="text-sm font-semibold text-gray-400">Elements Summary</h5>
          
          <div className="bg-gray-700 p-3 rounded">
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Total Elements:</span>
                <span className="text-gray-200">{slide.elements.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Hotspots:</span>
                <span className="text-gray-200">{slide.elements.filter(e => e.type === 'hotspot').length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Text Elements:</span>
                <span className="text-gray-200">{slide.elements.filter(e => e.type === 'text').length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Media Elements:</span>
                <span className="text-gray-200">{slide.elements.filter(e => e.type === 'media').length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Shapes:</span>
                <span className="text-gray-200">{slide.elements.filter(e => e.type === 'shape').length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SlidePropertiesSection;