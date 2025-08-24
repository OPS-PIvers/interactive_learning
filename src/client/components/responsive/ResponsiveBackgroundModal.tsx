import React, { useState, useEffect } from 'react';
import { extractYouTubeVideoId } from '../../utils/videoUtils';
import { ResponsiveModal } from './ResponsiveModal';

interface ResponsiveBackgroundModalProps {
  isOpen: boolean;
  onClose: () => void;
  backgroundImage?: string;
  backgroundType?: 'image' | 'video';
  backgroundVideoType?: 'youtube' | 'mp4';
  onBackgroundImageChange: (url: string) => void;
  onBackgroundTypeChange: (type: 'image' | 'video') => void;
  onBackgroundVideoTypeChange: (type: 'youtube' | 'mp4') => void;
  onReplaceImage: (file: File) => void;
}

type BackgroundOption = 'none' | 'color' | 'image' | 'video' | 'youtube';

/**
 * ResponsiveBackgroundModal - Unified modal for background settings
 * 
 * Features:
 * - Five background type options: None, Color, Image, Video, YouTube
 * - YouTube URL input with auto-processing
 * - File upload for images and videos
 * - Responsive design using ResponsiveModal base
 */
const ResponsiveBackgroundModal: React.FC<ResponsiveBackgroundModalProps> = ({
  isOpen,
  onClose,
  backgroundImage = '',
  backgroundType = 'image',
  backgroundVideoType = 'mp4',
  onBackgroundImageChange,
  onBackgroundTypeChange,
  onBackgroundVideoTypeChange,
  onReplaceImage,
}) => {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [selectedOption, setSelectedOption] = useState<BackgroundOption>(() => {
    if (!backgroundImage) return 'none';
    if (backgroundType === 'video' && backgroundVideoType === 'youtube') return 'youtube';
    if (backgroundType === 'video') return 'video';
    return backgroundType as BackgroundOption;
  });

  useEffect(() => {
    // Only update selectedOption based on props if we have a background image
    // This prevents overriding user selection when no background is set
    if (backgroundImage) {
      if (backgroundType === 'video' && backgroundVideoType === 'youtube') {
        setSelectedOption('youtube');
      } else if (backgroundType === 'video') {
        setSelectedOption('video');
      } else {
        setSelectedOption(backgroundType as BackgroundOption);
      }
    }
  }, [backgroundImage, backgroundType, backgroundVideoType]);

  const handleOptionSelect = (option: BackgroundOption) => {
    setSelectedOption(option);
    
    switch (option) {
      case 'none':
        onBackgroundImageChange('');
        break;
      case 'color':
        // For now, just clear the background - could add color picker later
        onBackgroundImageChange('');
        break;
      case 'image':
        onBackgroundTypeChange('image');
        break;
      case 'video':
        onBackgroundTypeChange('video');
        onBackgroundVideoTypeChange('mp4');
        break;
      case 'youtube':
        onBackgroundTypeChange('video');
        onBackgroundVideoTypeChange('youtube');
        break;
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, fileType: 'image' | 'video') => {
    if (event.target.files && event.target.files[0]) {
      onReplaceImage(event.target.files[0]);
      onBackgroundTypeChange(fileType);
      setSelectedOption(fileType);
    }
  };

  const handleYouTubeUrlSubmit = () => {
    if (youtubeUrl.trim()) {
      const videoId = extractYouTubeVideoId(youtubeUrl);
      if (videoId) {
        const embedUrl = `https://www.youtube.com/embed/${videoId}`;
        onBackgroundImageChange(embedUrl);
        onBackgroundTypeChange('video');
        onBackgroundVideoTypeChange('youtube');
        setYoutubeUrl('');
        setSelectedOption('youtube');
      } else {
        onBackgroundImageChange(youtubeUrl);
        onBackgroundTypeChange('video');
        onBackgroundVideoTypeChange('youtube');
      }
    }
  };

  const backgroundOptions = [
    { id: 'none' as BackgroundOption, icon: 'block', label: 'None' },
    { id: 'color' as BackgroundOption, icon: 'palette', label: 'Color' },
    { id: 'image' as BackgroundOption, icon: 'image', label: 'Image' },
    { id: 'video' as BackgroundOption, icon: 'videocam', label: 'Video' },
  ];

  return (
    <ResponsiveModal
      type="properties"
      isOpen={isOpen}
      onClose={onClose}
      title="Background Settings"
    >
      <div className="p-4 sm:p-6 space-y-6">
        <div>
          <h3 className="text-md font-semibold mb-3 text-gray-900">Background Type</h3>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {backgroundOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => handleOptionSelect(option.id)}
                className={`flex flex-col items-center justify-center p-3 border rounded-lg transition-colors ${
                  selectedOption === option.id
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 bg-white hover:bg-gray-50 text-gray-700'
                }`}
              >
                <span className="material-icons text-lg mb-1">{option.icon}</span>
                <span className="text-xs">{option.label}</span>
              </button>
            ))}
            
            {/* YouTube Special Button */}
            <button
              onClick={() => handleOptionSelect('youtube')}
              className={`col-span-3 flex items-center justify-center p-3 rounded-lg transition-colors ${
                selectedOption === 'youtube'
                  ? 'bg-red-600 text-white'
                  : 'bg-red-500 text-white hover:bg-red-600'
              }`}
            >
              <span className="material-icons mr-2 text-lg">smart_display</span>
              <span className="text-sm font-medium">YouTube</span>
            </button>
          </div>

          {/* File Upload for Images */}
          {selectedOption === 'image' && (
            <div className="mb-4">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e, 'image')}
                className="hidden"
                id="background-image-upload"
              />
              <label
                htmlFor="background-image-upload"
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <span className="material-icons mr-2 text-lg">upload</span>
                Upload Image
              </label>
            </div>
          )}

          {/* File Upload for Videos */}
          {selectedOption === 'video' && (
            <div className="mb-4">
              <input
                type="file"
                accept="video/*"
                onChange={(e) => handleFileUpload(e, 'video')}
                className="hidden"
                id="background-video-upload"
              />
              <label
                htmlFor="background-video-upload"
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <span className="material-icons mr-2 text-lg">upload</span>
                Upload Video
              </label>
            </div>
          )}
        </div>

        {/* YouTube URL Input */}
        {selectedOption === 'youtube' && (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              YouTube URL
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="Paste your YouTube video URL"
                className="flex-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleYouTubeUrlSubmit();
                  }
                }}
              />
              <button
                onClick={handleYouTubeUrlSubmit}
                className="px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
              >
                Apply
              </button>
            </div>
          </div>
        )}

        {/* Current Background Preview */}
        {backgroundImage && (
          <div className="border-t border-gray-200 pt-4">
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Current Background
            </label>
            <div className="relative">
              {backgroundType === 'image' ? (
                <img
                  src={backgroundImage}
                  alt="Current background"
                  className="w-full h-24 object-cover rounded-lg border border-gray-300"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-full h-24 bg-gray-100 rounded-lg border border-gray-300 flex items-center justify-center">
                  <div className="text-center">
                    <span className="material-icons text-gray-500 text-2xl mb-1 block">videocam</span>
                    <p className="text-xs text-gray-500">
                      {backgroundVideoType === 'youtube' ? 'YouTube Video' : 'MP4 Video'}
                    </p>
                  </div>
                </div>
              )}
              <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
                {backgroundType === 'image' ? 'Image' : 'Video'}
              </div>
            </div>
          </div>
        )}
      </div>
    </ResponsiveModal>
  );
};

export default ResponsiveBackgroundModal;