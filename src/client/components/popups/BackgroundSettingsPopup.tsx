import React, { useState, useEffect } from 'react';
import { extractYouTubeVideoId } from '../../../shared/types';
import EditorPopupBase from './shared/EditorPopupBase';

interface BackgroundSettingsPopupProps {
  isOpen: boolean;
  onClose: () => void;
  backgroundImage?: string;
  backgroundType?: 'image' | 'video';
  backgroundVideoType?: 'youtube' | 'mp4';
  onBackgroundImageChange: (url: string) => void;
  onBackgroundTypeChange: (type: 'image' | 'video') => void;
  onBackgroundVideoTypeChange: (type: 'youtube' | 'mp4') => void;
  onReplaceImage: (file: File) => void;
  position?: 'bottom-left' | 'bottom-center' | 'bottom-right';
}

type BackgroundOption = 'none' | 'color' | 'image' | 'video' | 'youtube';

/**
 * BackgroundSettingsPopup - Modern popup for background settings
 * 
 * Features:
 * - Five background type options: None, Color, Image, Video, YouTube
 * - YouTube URL input with auto-processing
 * - File upload for images
 * - Matches the design from the HTML mockup
 */
const BackgroundSettingsPopup: React.FC<BackgroundSettingsPopupProps> = ({
  isOpen,
  onClose,
  backgroundImage = '',
  backgroundType = 'image',
  backgroundVideoType = 'mp4',
  onBackgroundImageChange,
  onBackgroundTypeChange,
  onBackgroundVideoTypeChange,
  onReplaceImage,
  position = 'bottom-center'
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
    <EditorPopupBase 
      isOpen={isOpen} 
      onClose={onClose}
      position={position}
      className="w-80"
    >
      <div className="space-y-6">
        <div>
          <h3 className="text-md font-semibold mb-3 text-gray-200">Background Type</h3>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {backgroundOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => handleOptionSelect(option.id)}
                className={`flex flex-col items-center justify-center p-3 border rounded-lg transition-colors ${
                  selectedOption === option.id
                    ? 'border-blue-500 bg-[#3e4f8a]'
                    : 'border-[#687178] bg-[#2c3a6f] hover:bg-[#3e4f8a]'
                }`}
              >
                <span className="material-icons text-gray-300 text-lg mb-1">{option.icon}</span>
                <span className="text-xs text-gray-300">{option.label}</span>
              </button>
            ))}
            
            {/* YouTube Special Button */}
            <button
              onClick={() => handleOptionSelect('youtube')}
              className={`col-span-3 flex items-center justify-center p-3 rounded-lg shadow-sm transition-colors ${
                selectedOption === 'youtube'
                  ? 'bg-[#1833b7] text-white'
                  : 'bg-[#1e3fe8] text-white hover:bg-[#1833b7]'
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
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-[#687178] text-sm font-medium rounded-lg text-gray-300 bg-[#2c3a6f] hover:bg-[#3e4f8a] cursor-pointer transition-colors"
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
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-[#687178] text-sm font-medium rounded-lg text-gray-300 bg-[#2c3a6f] hover:bg-[#3e4f8a] cursor-pointer transition-colors"
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
            <label className="block text-xs font-medium text-gray-400 mb-1">
              YouTube URL
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="Paste your YouTube video URL"
                className="flex-1 block w-full px-3 py-2 bg-[#17214a] border border-[#687178] rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#1e3fe8] focus:border-[#1e3fe8] text-sm text-white"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleYouTubeUrlSubmit();
                  }
                }}
              />
              <button
                onClick={handleYouTubeUrlSubmit}
                className="px-3 py-2 bg-[#1e3fe8] text-white text-sm rounded-md hover:bg-[#1833b7] transition-colors"
              >
                Apply
              </button>
            </div>
          </div>
        )}

        {/* Current Background Preview */}
        {backgroundImage && (
          <div className="border-t border-[#3e4f8a] pt-4">
            <label className="block text-xs font-medium text-gray-400 mb-2">
              Current Background
            </label>
            <div className="relative">
              {backgroundType === 'image' ? (
                <img
                  src={backgroundImage}
                  alt="Current background"
                  className="w-full h-24 object-cover rounded-lg border border-[#687178]"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-full h-24 bg-[#17214a] rounded-lg border border-[#687178] flex items-center justify-center">
                  <div className="text-center">
                    <span className="material-icons text-gray-500 text-2xl mb-1 block">videocam</span>
                    <p className="text-xs text-gray-400">
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
    </EditorPopupBase>
  );
};

export default BackgroundSettingsPopup;