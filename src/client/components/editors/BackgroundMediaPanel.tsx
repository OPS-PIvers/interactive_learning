import React, { useState, useCallback } from 'react';
import { FirebaseProjectAPI } from '../../../lib/firebaseApi';
import { BackgroundMedia } from '../../../shared/slideTypes';
import { Z_INDEX_TAILWIND } from '../../utils/zIndexLevels';
import FileUpload from '../ui/FileUpload';

interface BackgroundMediaPanelProps {
  currentBackgroundMedia: BackgroundMedia | null;
  onBackgroundMediaChange: (backgroundMedia: BackgroundMedia | null) => void;
  onClose: () => void;
  isOpen: boolean;
}

/**
 * BackgroundMediaPanel - Comprehensive background media selection and configuration
 * 
 * Supports image upload, camera capture, YouTube embedding, audio, and video backgrounds
 * with full settings and overlay customization.
 */
const BackgroundMediaPanel: React.FC<BackgroundMediaPanelProps> = ({
  currentBackgroundMedia,
  onBackgroundMediaChange,
  onClose,
  isOpen
}) => {
  const [selectedTab, setSelectedTab] = useState<'image' | 'video' | 'youtube' | 'audio' | 'none'>('image');
  const [isUploading, setIsUploading] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');

  // Initialize state from current background media
  const [backgroundSettings, setBackgroundSettings] = useState<BackgroundMedia>({
    type: currentBackgroundMedia?.type || 'none',
    url: currentBackgroundMedia?.url || '',
    youtubeId: currentBackgroundMedia?.youtubeId || '',
    volume: currentBackgroundMedia?.volume || 0.5,
    autoplay: currentBackgroundMedia?.autoplay || false,
    loop: currentBackgroundMedia?.loop || false,
    muted: currentBackgroundMedia?.muted || true,
    controls: currentBackgroundMedia?.controls || false,
    overlay: currentBackgroundMedia?.overlay || {
      enabled: false,
      opacity: 0.3,
      color: '#000000'
    },
    settings: currentBackgroundMedia?.settings || {
      size: 'cover',
      position: 'center',
      repeat: 'no-repeat',
      attachment: 'scroll'
    }
  });

  // Extract YouTube video ID from URL
  const extractYouTubeId = (url: string): string | null => {
    if (!url) return null;
    const regex = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/;
    const match = url.match(regex);
    return match && match[1] ? match[1] : null;
  };

  // Handle file upload
  const handleFileUpload = useCallback(async (file: File) => {
    setIsUploading(true);
    try {
      const api = new FirebaseProjectAPI();
      const imageUrl = await api.uploadImage(file);
      const newBackgroundMedia: BackgroundMedia = {
        ...backgroundSettings,
        type: selectedTab,
        url: imageUrl
      };
      setBackgroundSettings(newBackgroundMedia);
      onBackgroundMediaChange(newBackgroundMedia);
    } catch (error) {
      console.error('Error uploading background media:', error);
    } finally {
      setIsUploading(false);
    }
  }, [backgroundSettings, selectedTab, onBackgroundMediaChange]);

  // Handle camera capture
  const handleCameraCapture = useCallback(async (file: File) => {
    await handleFileUpload(file);
  }, [handleFileUpload]);

  // Handle YouTube URL input
  const handleYouTubeUrlChange = useCallback((url: string) => {
    setYoutubeUrl(url);
    const videoId = extractYouTubeId(url);
    if (videoId) {
      const newBackgroundMedia: BackgroundMedia = {
        ...backgroundSettings,
        type: 'youtube',
        youtubeId: videoId,
        url: url
      };
      setBackgroundSettings(newBackgroundMedia);
      onBackgroundMediaChange(newBackgroundMedia);
    }
  }, [backgroundSettings, onBackgroundMediaChange]);

  // Handle settings change
  const handleSettingsChange = useCallback((key: string, value: unknown) => {
    const newSettings = { ...backgroundSettings };
    if (key.includes('.')) {
      const [parentKey, childKey] = key.split('.');
      if (parentKey === 'overlay' && childKey) {
        newSettings.overlay = {
          enabled: false,
          opacity: 0.3,
          color: '#000000',
          ...newSettings.overlay,
          [childKey]: value
        };
      } else if (parentKey === 'settings' && childKey) {
        newSettings.settings = {
          size: 'cover',
          position: 'center',
          repeat: 'no-repeat',
          attachment: 'scroll',
          ...newSettings.settings,
          [childKey]: value
        };
      }
    } else {
      if (key in newSettings) {
        (newSettings as Record<string, unknown>)[key] = value;
      }
    }
    setBackgroundSettings(newSettings);
    onBackgroundMediaChange(newSettings);
  }, [backgroundSettings, onBackgroundMediaChange]);

  // Handle remove background
  const handleRemoveBackground = useCallback(() => {
    setBackgroundSettings({ type: 'none' });
    onBackgroundMediaChange(null);
  }, [onBackgroundMediaChange]);

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 bg-black/50 flex items-center justify-center ${Z_INDEX_TAILWIND.MODAL_BACKDROP}`} onClick={onClose}>
      <div 
        className="bg-slate-800 rounded-lg shadow-2xl border border-slate-700 w-full h-full m-0 rounded-none md:w-[90vw] md:max-w-4xl md:max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white">Background Media</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors rounded-lg p-2 hover:bg-slate-700"
            aria-label="Close background media panel"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Media Type Tabs */}
          <div className="border-b border-slate-700 p-4">
            <div className="flex flex-wrap gap-2">
              {(['image', 'video', 'youtube', 'audio', 'none'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSelectedTab(tab)}
                  className={`px-4 py-2 rounded-md font-medium transition-colors ${
                    selectedTab === tab
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white'
                  }`}
                >
                  {tab === 'none' ? 'Remove' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-4 space-y-4">
            {selectedTab === 'image' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-white font-medium mb-2">Upload Image</h3>
                    <FileUpload
                      onFileUpload={handleFileUpload}
                      acceptedTypes="image"
                      label="background image"
                    />
                    {isUploading && (
                      <div className="mt-2 text-blue-400 text-sm">Uploading...</div>
                    )}
                  </div>
                  
                  <div className="md:hidden">
                    <h3 className="text-white font-medium mb-2">Camera Capture</h3>
                    <label className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-md font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Take Photo
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleCameraCapture(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {selectedTab === 'video' && (
              <div>
                <h3 className="text-white font-medium mb-2">Upload Video</h3>
                <FileUpload
                  onFileUpload={handleFileUpload}
                  acceptedTypes="video"
                  label="background video"
                />
                {isUploading && (
                  <div className="mt-2 text-blue-400 text-sm">Uploading...</div>
                )}
              </div>
            )}

            {selectedTab === 'youtube' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-white font-medium mb-2">YouTube URL</label>
                  <input
                    type="url"
                    value={youtubeUrl}
                    onChange={(e) => handleYouTubeUrlChange(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                
                {backgroundSettings.youtubeId && (
                  <div className="bg-slate-700 rounded-md p-3">
                    <div className="text-green-400 text-sm mb-2">✓ Valid YouTube video detected</div>
                    <div className="aspect-video bg-black rounded">
                      <iframe
                        src={`https://www.youtube.com/embed/${backgroundSettings.youtubeId}?rel=0&modestbranding=1`}
                        className="w-full h-full rounded"
                        allowFullScreen
                        title="YouTube Preview"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {selectedTab === 'audio' && (
              <div>
                <h3 className="text-white font-medium mb-2">Upload Audio</h3>
                <FileUpload
                  onFileUpload={handleFileUpload}
                  acceptedTypes="audio"
                  label="background audio"
                />
                {isUploading && (
                  <div className="mt-2 text-blue-400 text-sm">Uploading...</div>
                )}
              </div>
            )}

            {selectedTab === 'none' && (
              <div className="text-center py-8">
                <div className="text-slate-400 text-lg mb-4">Remove background media</div>
                <button
                  onClick={handleRemoveBackground}
                  className="bg-red-600 hover:bg-red-700 text-white py-2 px-6 rounded-md font-medium transition-colors"
                >
                  Remove Background
                </button>
              </div>
            )}

            {/* Media Settings */}
            {selectedTab !== 'none' && backgroundSettings.type !== 'none' && (
              <div className="border-t border-slate-700 pt-4 mt-6">
                <h3 className="text-white font-medium mb-4">Background Settings</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Background Size */}
                  <div>
                    <label className="block text-slate-300 text-sm font-medium mb-2">Size</label>
                    <select
                      value={backgroundSettings.settings?.size || 'cover'}
                      onChange={(e) => handleSettingsChange('settings.size', e.target.value)}
                      className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="cover">Cover</option>
                      <option value="contain">Contain</option>
                      <option value="auto">Auto</option>
                      <option value="stretch">Stretch</option>
                    </select>
                  </div>

                  {/* Background Position */}
                  <div>
                    <label className="block text-slate-300 text-sm font-medium mb-2">Position</label>
                    <select
                      value={backgroundSettings.settings?.position || 'center'}
                      onChange={(e) => handleSettingsChange('settings.position', e.target.value)}
                      className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="center">Center</option>
                      <option value="top">Top</option>
                      <option value="bottom">Bottom</option>
                      <option value="left">Left</option>
                      <option value="right">Right</option>
                      <option value="top-left">Top Left</option>
                      <option value="top-right">Top Right</option>
                      <option value="bottom-left">Bottom Left</option>
                      <option value="bottom-right">Bottom Right</option>
                    </select>
                  </div>

                  {/* Volume (for video/audio) */}
                  {(selectedTab === 'video' || selectedTab === 'audio' || selectedTab === 'youtube') && (
                    <div>
                      <label className="block text-slate-300 text-sm font-medium mb-2">
                        Volume: {Math.round((backgroundSettings.volume || 0.5) * 100)}%
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={backgroundSettings.volume || 0.5}
                        onChange={(e) => handleSettingsChange('volume', parseFloat(e.target.value))}
                        className="w-full"
                      />
                    </div>
                  )}

                  {/* Autoplay */}
                  {(selectedTab === 'video' || selectedTab === 'audio' || selectedTab === 'youtube') && (
                    <div>
                      <label className="flex items-center gap-2 text-slate-300">
                        <input
                          type="checkbox"
                          checked={backgroundSettings.autoplay || false}
                          onChange={(e) => handleSettingsChange('autoplay', e.target.checked)}
                          className="rounded border-slate-600 bg-slate-700 text-purple-500 focus:ring-purple-500"
                        />
                        Autoplay
                      </label>
                    </div>
                  )}
                </div>

                {/* Overlay Settings */}
                <div className="border-t border-slate-700 pt-4 mt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <input
                      type="checkbox"
                      checked={backgroundSettings.overlay?.enabled || false}
                      onChange={(e) => handleSettingsChange('overlay.enabled', e.target.checked)}
                      className="rounded border-slate-600 bg-slate-700 text-purple-500 focus:ring-purple-500"
                    />
                    <label className="text-white font-medium">Background Overlay</label>
                  </div>

                  {backgroundSettings.overlay?.enabled && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                      <div>
                        <label className="block text-slate-300 text-sm font-medium mb-2">Overlay Color</label>
                        <input
                          type="color"
                          value={backgroundSettings.overlay?.color || '#000000'}
                          onChange={(e) => handleSettingsChange('overlay.color', e.target.value)}
                          className="w-full h-10 rounded border border-slate-600 bg-slate-700"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-300 text-sm font-medium mb-2">
                          Opacity: {Math.round((backgroundSettings.overlay?.opacity || 0.3) * 100)}%
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={backgroundSettings.overlay?.opacity || 0.3}
                          onChange={(e) => handleSettingsChange('overlay.opacity', parseFloat(e.target.value))}
                          className="w-full"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-700 p-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-md transition-colors font-medium"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};

export default BackgroundMediaPanel;