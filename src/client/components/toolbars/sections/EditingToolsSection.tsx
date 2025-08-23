import { ImageIcon, FileIcon, VideoIcon, Link2Icon } from '@radix-ui/react-icons';
import React, { useState, useEffect } from 'react';
import { extractYouTubeVideoId } from '../../../../shared/types';

interface EditingToolsSectionProps {
  backgroundImage?: string;
  backgroundType?: 'image' | 'video';
  backgroundVideoType?: 'youtube' | 'mp4' | undefined;
  onBackgroundImageChange: (url: string) => void;
  onBackgroundTypeChange: (type: 'image' | 'video') => void;
  onBackgroundVideoTypeChange: (type: 'youtube' | 'mp4') => void;
  onReplaceImage: (file: File) => void;
}

const EditingToolsSection: React.FC<EditingToolsSectionProps> = ({
  backgroundImage: currentBackgroundImageUrl = '',
  backgroundType = 'image',
  backgroundVideoType = 'mp4',
  onBackgroundImageChange,
  onBackgroundTypeChange,
  onBackgroundVideoTypeChange,
  onReplaceImage,
}) => {
  const [localBackgroundImageUrl, setLocalBackgroundImageUrl] = useState(currentBackgroundImageUrl);
  const [showYouTubeInput, setShowYouTubeInput] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');

  useEffect(() => {
    setLocalBackgroundImageUrl(currentBackgroundImageUrl);
  }, [currentBackgroundImageUrl]);

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
    <div className="space-y-3">
      <h3 className="text-lg font-medium text-white flex items-center gap-2">
        <ImageIcon className="w-5 h-5" />
        Background Settings
      </h3>
      <div className="bg-slate-800/50 rounded-lg p-4 space-y-4 border border-slate-700">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Background Type
          </label>
          <div className="flex gap-x-6 gap-y-2 flex-wrap">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="backgroundType"
                value="image"
                checked={backgroundType === 'image'}
                onChange={() => onBackgroundTypeChange('image')}
                className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
              />
              <span className="text-sm text-slate-300">Image</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="backgroundType"
                value="video"
                checked={backgroundType === 'video'}
                onChange={() => onBackgroundTypeChange('video')}
                className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
              />
              <span className="text-sm text-slate-300">Video</span>
            </label>
          </div>
        </div>

        {currentBackgroundImageUrl && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">
              Current Background
            </label>
            <div className="relative">
              {backgroundType === 'image' ? (
                <img
                  src={currentBackgroundImageUrl}
                  alt="Current background"
                  className="w-full h-32 object-cover rounded-lg border border-slate-600"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-full h-32 bg-slate-700 rounded-lg border border-slate-600 flex items-center justify-center">
                  <div className="text-center">
                    <VideoIcon className="w-10 h-10 mx-auto mb-2 text-slate-500" />
                    <p className="text-sm text-slate-400">
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

        <div className="space-y-4">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            <span className="text-purple-400 font-semibold">
              {currentBackgroundImageUrl ? 'Replace Background' : 'Add Background'}
            </span>
            {backgroundType === 'image' ? ' Image' : ' Video'}
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {backgroundType === 'image' && (
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileUpload}
                  className="hidden"
                  id="enhanced-image-upload"
                />
                <label
                  htmlFor="enhanced-image-upload"
                  className="w-full inline-flex items-center justify-center px-4 py-3 border-2 border-purple-600 text-sm font-medium rounded-lg text-purple-300 bg-purple-900/30 hover:bg-purple-900/50 cursor-pointer transition-colors shadow-sm"
                >
                  <FileIcon className="w-4 h-4 mr-2" /> Choose Image File
                </label>
              </div>
            )}

            {backgroundType === 'video' && (
              <div>
                <button
                  type="button"
                  onClick={() => setShowYouTubeInput(!showYouTubeInput)}
                  className="w-full inline-flex items-center justify-center px-4 py-3 border border-slate-600 text-sm font-medium rounded-md text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                  <VideoIcon className="w-4 h-4 mr-2" /> Add YouTube URL
                </button>
              </div>
            )}

            <div>
              <button
                type="button"
                onClick={() => setShowUrlInput(!showUrlInput)}
                className="w-full inline-flex items-center justify-center px-4 py-3 border border-slate-600 text-sm font-medium rounded-md text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                <Link2Icon className="w-4 h-4 mr-2" /> Add {backgroundType === 'image' ? 'Image' : 'Video'} URL
              </button>
            </div>
          </div>

          {backgroundType === 'video' && showYouTubeInput && (
            <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
              <label htmlFor="youtube-url" className="block text-sm font-medium text-slate-300 mb-2">
                YouTube URL
              </label>
              <input
                type="text"
                id="youtube-url"
                value={youtubeUrl}
                onChange={handleYouTubeUrlChange}
                onBlur={handleYouTubeUrlBlur}
                placeholder="https://youtube.com/watch?v=... or youtu.be/..."
                className="w-full px-3 py-2 text-base border border-slate-600 rounded-md bg-slate-800 text-slate-100 focus:ring-purple-500 focus:border-purple-500"
              />
              <p className="mt-1 text-xs text-slate-400">
                Paste any YouTube URL format - video ID will be extracted automatically
              </p>
            </div>
          )}

          {showUrlInput && (
            <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
              <label htmlFor="background-url" className="block text-sm font-medium text-slate-300 mb-2">
                {backgroundType === 'image' ? 'Image URL' : 'Video URL (YouTube or MP4)'}
              </label>
              <input
                type="text"
                id="background-url"
                value={localBackgroundImageUrl}
                onChange={handleUrlInputChange}
                onBlur={handleUrlInputBlur}
                placeholder={backgroundType === 'image' ? 'https://example.com/image.png' : 'https://youtube.com/watch?v=... or https://example.com/video.mp4'}
                className="w-full px-3 py-2 text-base border border-slate-600 rounded-md bg-slate-800 text-slate-100 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
          )}
        </div>

        {backgroundType === 'video' && (
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Video Format (auto-detected, can override)
            </label>
            <div className="flex gap-x-6 gap-y-2 flex-wrap">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="backgroundVideoType"
                  value="youtube"
                  checked={backgroundVideoType === 'youtube'}
                  onChange={() => onBackgroundVideoTypeChange('youtube')}
                  className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                />
                <span className="text-sm text-slate-300">YouTube</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="backgroundVideoType"
                  value="mp4"
                  checked={backgroundVideoType === 'mp4'}
                  onChange={() => onBackgroundVideoTypeChange('mp4')}
                  className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                />
                <span className="text-sm text-slate-300">MP4</span>
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditingToolsSection;
