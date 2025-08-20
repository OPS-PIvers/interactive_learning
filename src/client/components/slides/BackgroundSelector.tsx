import React, { useState, useCallback } from 'react';
import { BackgroundMedia } from '../../../shared/slideTypes';

interface BackgroundSelectorProps {
  background: BackgroundMedia | undefined;
  onBackgroundChange: (background: BackgroundMedia) => void;
  className?: string;
}

/**
 * BackgroundSelector - Choose slide background
 * 
 * Supports:
 * - Image uploads/URLs
 * - MP4 video files/URLs  
 * - YouTube video links
 * - Solid colors
 * - No background
 */
export const BackgroundSelector: React.FC<BackgroundSelectorProps> = ({
  background,
  onBackgroundChange,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<'none' | 'color' | 'image' | 'video' | 'youtube'>(
    (background?.type && background.type !== 'audio') ? background.type : 'none'
  );
  const [formData, setFormData] = useState({
    imageUrl: (background?.type === 'image' ? background.url || '' : '') || '',
    videoUrl: (background?.type === 'video' ? background.url || '' : '') || '',
    youtubeUrl: (background?.type === 'youtube' && background.youtubeId ? `https://youtube.com/watch?v=${background.youtubeId}` : '') || '',
    color: (background?.type === 'color' ? background.color || '#f0f0f0' : '') || '#f0f0f0'
  });

  // Extract YouTube video ID from URL
  const extractYouTubeId = useCallback((url: string): string | null => {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? (match[1] || null) : null;
  }, []);

  // Handle background type change
  const handleTypeChange = useCallback((type: 'none' | 'color' | 'image' | 'video' | 'youtube') => {
    setActiveTab(type);

    if (type === 'none') {
      onBackgroundChange({ type: 'none' });
      return;
    }

    // Create default background for each type
    switch (type) {
      case 'color':
        onBackgroundChange({
          type: 'color',
          color: formData.color
        });
        break;
      
      case 'image':
        if (formData.imageUrl) {
          onBackgroundChange({
            type: 'image',
            url: formData.imageUrl
          });
        }
        break;
      
      case 'video':
        if (formData.videoUrl) {
          onBackgroundChange({
            type: 'video',
            url: formData.videoUrl,
            autoplay: true,
            loop: true,
            muted: true
          });
        }
        break;
      
      case 'youtube':
        const youtubeId = extractYouTubeId(formData.youtubeUrl);
        if (youtubeId) {
          onBackgroundChange({
            type: 'youtube',
            youtubeId,
            autoplay: true,
            loop: true,
            muted: true
          });
        }
        break;
    }
  }, [formData, onBackgroundChange, extractYouTubeId]);

  // Handle form input changes
  const handleInputChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Auto-update background for some fields
    if (field === 'color' && activeTab === 'color') {
      onBackgroundChange({
        type: 'color',
        color: value
      });
    }
  }, [activeTab, onBackgroundChange]);

  // Handle URL submission
  const handleUrlSubmit = useCallback((type: 'image' | 'video' | 'youtube') => {
    switch (type) {
      case 'image':
        if (formData.imageUrl) {
          onBackgroundChange({
            type: 'image',
            url: formData.imageUrl
          });
        }
        break;
      
      case 'video':
        if (formData.videoUrl) {
          onBackgroundChange({
            type: 'video',
            url: formData.videoUrl,
            autoplay: true,
            loop: true,
            muted: true
          });
        }
        break;
      
      case 'youtube':
        const youtubeId = extractYouTubeId(formData.youtubeUrl);
        if (youtubeId) {
          onBackgroundChange({
            type: 'youtube',
            youtubeId,
            autoplay: true,
            loop: true,
            muted: true
          });
        } else {
          alert('Please enter a valid YouTube URL');
        }
        break;
    }
  }, [formData, onBackgroundChange, extractYouTubeId]);

  return (
    <div className={`background-selector ${className}`}>
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <h3 className="text-lg font-semibold mb-4">Background</h3>
        
        {/* Tab buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            { key: 'none', label: 'None', icon: '🚫' },
            { key: 'color', label: 'Color', icon: '🎨' },
            { key: 'image', label: 'Image', icon: '🖼️' },
            { key: 'video', label: 'Video', icon: '🎬' },
            { key: 'youtube', label: 'YouTube', icon: '📺' }
          ].map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => handleTypeChange(key as 'none' | 'color' | 'image' | 'video' | 'youtube')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === key
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {icon} {label}
            </button>
          ))}
        </div>

        {/* Content based on active tab */}
        <div className="min-h-[120px]">
          {activeTab === 'none' && (
            <div className="text-gray-500 text-center py-8">
              No background selected
            </div>
          )}

          {activeTab === 'color' && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Background Color
              </label>
              <div className="flex gap-3 items-center">
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => handleInputChange('color', e.target.value)}
                  className="w-12 h-12 rounded border border-gray-300"
                />
                <input
                  type="text"
                  value={formData.color}
                  onChange={(e) => handleInputChange('color', e.target.value)}
                  placeholder="#f0f0f0"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {activeTab === 'image' && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Image URL
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => handleInputChange('imageUrl', e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={() => handleUrlSubmit('image')}
                  disabled={!formData.imageUrl}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                >
                  Apply
                </button>
              </div>
              <p className="text-xs text-gray-500">
                Supports JPG, PNG, GIF, WebP formats
              </p>
            </div>
          )}

          {activeTab === 'video' && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Video URL
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={formData.videoUrl}
                  onChange={(e) => handleInputChange('videoUrl', e.target.value)}
                  placeholder="https://example.com/video.mp4"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={() => handleUrlSubmit('video')}
                  disabled={!formData.videoUrl}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                >
                  Apply
                </button>
              </div>
              <p className="text-xs text-gray-500">
                Supports MP4, WebM formats. Video will auto-play muted and loop.
              </p>
            </div>
          )}

          {activeTab === 'youtube' && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                YouTube URL
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={formData.youtubeUrl}
                  onChange={(e) => handleInputChange('youtubeUrl', e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={() => handleUrlSubmit('youtube')}
                  disabled={!formData.youtubeUrl}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                >
                  Apply
                </button>
              </div>
              <p className="text-xs text-gray-500">
                Paste any YouTube video URL. Video will auto-play muted and loop.
              </p>
            </div>
          )}
        </div>

        {/* Current background preview */}
        {background && background.type !== 'none' && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="text-sm font-medium text-gray-700 mb-2">Current Background:</div>
            <div className="text-sm text-gray-600">
              {background.type === 'color' && `Color: ${background.color}`}
              {background.type === 'image' && `Image: ${background.url}`}
              {background.type === 'video' && `Video: ${background.url}`}
              {background.type === 'youtube' && `YouTube: ${background.youtubeId}`}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BackgroundSelector;