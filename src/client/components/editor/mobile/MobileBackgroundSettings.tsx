// src/client/components/MobileBackgroundSettings.tsx
import React, { useState, useEffect } from 'react';
import { extractYouTubeVideoId } from '../../shared/types';

interface MobileBackgroundSettingsProps {
  backgroundImage: string | null;
  backgroundType: 'image' | 'video';
  backgroundVideoType: 'youtube' | 'mp4';
  onReplaceImage: (file: File) => void;
  onBackgroundImageChange: (url: string) => void;
  onBackgroundTypeChange: (type: 'image' | 'video') => void;
  onBackgroundVideoTypeChange: (type: 'youtube' | 'mp4') => void;
}

const MobileBackgroundSettings: React.FC<MobileBackgroundSettingsProps> = ({
  backgroundImage,
  backgroundType,
  backgroundVideoType,
  onReplaceImage,
  onBackgroundImageChange,
  onBackgroundTypeChange,
  onBackgroundVideoTypeChange
}) => {
  const [showYouTubeInput, setShowYouTubeInput] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [localBackgroundImageUrl, setLocalBackgroundImageUrl] = useState(backgroundImage || '');

  // Sync local URL state when prop changes
  useEffect(() => {
    setLocalBackgroundImageUrl(backgroundImage || '');
  }, [backgroundImage]);


  const handleImageFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      onReplaceImage(event.target.files[0]);
      onBackgroundTypeChange('image');
    }
  };

  const handleUrlInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setLocalBackgroundImageUrl(event.target.value);
  };

  const handleUrlInputBlur = () => {
    onBackgroundImageChange(localBackgroundImageUrl);
    // Auto-detect video type from URL if type is video
    if (backgroundType === 'video') {
      if (localBackgroundImageUrl.includes('youtube.com') || localBackgroundImageUrl.includes('youtu.be')) {
        onBackgroundVideoTypeChange('youtube');
      } else if (localBackgroundImageUrl.toLowerCase().endsWith('.mp4')) {
        onBackgroundVideoTypeChange('mp4');
      }
    }
  };

  const handleYouTubeUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setYoutubeUrl(event.target.value);
  };

  const handleYouTubeUrlBlur = () => {
    if (youtubeUrl.trim()) {
      const videoId = extractYouTubeVideoId(youtubeUrl);
      if (videoId) {
        const embedUrl = `https://www.youtube.com/embed/${videoId}`;
        onBackgroundImageChange(embedUrl);
        onBackgroundTypeChange('video');
        onBackgroundVideoTypeChange('youtube');
        setYoutubeUrl('');
        setShowYouTubeInput(false);
      } else {
        onBackgroundImageChange(youtubeUrl);
        onBackgroundTypeChange('video');
      }
    }
  };

  return (
    <div className="p-4 space-y-6 bg-white">
      {/* Background Type Selection */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-3">
          Background Type
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onBackgroundTypeChange('image')}
            className={`p-3 rounded-lg border-2 transition-colors ${
              backgroundType === 'image'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-slate-200 bg-white text-slate-700'
            }`}
          >
            📷 Image
          </button>
          <button
            type="button"
            onClick={() => onBackgroundTypeChange('video')}
            className={`p-3 rounded-lg border-2 transition-colors ${
              backgroundType === 'video'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-slate-200 bg-white text-slate-700'
            }`}
          >
            🎥 Video
          </button>
        </div>
      </div>

      {/* Upload Options */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-3">
          {backgroundType === 'image' ? 'Upload or Add Background Image' : 'Upload or Add Background Video'}
        </label>
        
        <div className="space-y-3">
          {/* File Upload Option */}
          {backgroundType === 'image' && (
            <div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageFileUpload}
                className="hidden"
                id="mobile-image-upload"
              />
              <label
                htmlFor="mobile-image-upload"
                className="w-full flex items-center justify-center p-4 border border-slate-300 rounded-lg bg-white text-slate-700 active:bg-slate-50 transition-colors"
              >
                📁 Choose Image File
              </label>
            </div>
          )}
          
          {/* YouTube URL Option */}
          {backgroundType === 'video' && (
            <div>
              <button
                type="button"
                onClick={() => setShowYouTubeInput(!showYouTubeInput)}
                className="w-full flex items-center justify-center p-4 border border-slate-300 rounded-lg bg-white text-slate-700 active:bg-slate-50 transition-colors"
              >
                🎥 Add YouTube URL
              </button>
            </div>
          )}
          
          {/* URL Input Option */}
          <div>
            <button
              type="button"
              onClick={() => setShowUrlInput(!showUrlInput)}
              className="w-full flex items-center justify-center p-4 border border-slate-300 rounded-lg bg-white text-slate-700 active:bg-slate-50 transition-colors"
            >
              🔗 Add {backgroundType === 'image' ? 'Image' : 'Video'} URL
            </button>
          </div>
        </div>

        {/* YouTube URL Input */}
        {backgroundType === 'video' && showYouTubeInput && (
          <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <label htmlFor="mobile-youtube-url" className="block text-sm font-medium text-slate-700 mb-2">
              YouTube URL
            </label>
            <input
              type="text"
              id="mobile-youtube-url"
              value={youtubeUrl}
              onChange={handleYouTubeUrlChange}
              onBlur={handleYouTubeUrlBlur}
              placeholder="https://youtube.com/watch?v=... or youtu.be/..."
              className="w-full px-3 py-3 text-base border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="mt-2 text-xs text-slate-500">
              Paste any YouTube URL format - video ID will be extracted automatically
            </p>
          </div>
        )}

        {/* General URL Input */}
        {showUrlInput && (
          <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <label htmlFor="mobile-background-url" className="block text-sm font-medium text-slate-700 mb-2">
              {backgroundType === 'image' ? 'Image URL' : 'Video URL (YouTube or MP4)'}
            </label>
            <input
              type="text"
              id="mobile-background-url"
              value={localBackgroundImageUrl}
              onChange={handleUrlInputChange}
              onBlur={handleUrlInputBlur}
              placeholder={backgroundType === 'image' ? 'https://example.com/image.png' : 'https://youtube.com/watch?v=... or https://example.com/video.mp4'}
              className="w-full px-3 py-3 text-base border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        )}
      </div>

      {/* Video Format Selection */}
      {backgroundType === 'video' && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-3">
            Video Format (auto-detected, can override)
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onBackgroundVideoTypeChange('youtube')}
              className={`p-3 rounded-lg border-2 transition-colors ${
                backgroundVideoType === 'youtube'
                  ? 'border-red-500 bg-red-50 text-red-700'
                  : 'border-slate-200 bg-white text-slate-700'
              }`}
            >
              YouTube
            </button>
            <button
              type="button"
              onClick={() => onBackgroundVideoTypeChange('mp4')}
              className={`p-3 rounded-lg border-2 transition-colors ${
                backgroundVideoType === 'mp4'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-slate-200 bg-white text-slate-700'
              }`}
            >
              MP4
            </button>
          </div>
        </div>
      )}

      {/* Current Background Preview */}
      {backgroundImage && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Current Background
          </label>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-xs text-slate-600 break-all">
              {backgroundImage.length > 50 ? `${backgroundImage.substring(0, 50)}...` : backgroundImage}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileBackgroundSettings;