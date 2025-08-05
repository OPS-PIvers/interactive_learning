import React, { useState, useEffect } from 'react';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { XMarkIcon } from './icons/XMarkIcon';
import { extractYouTubeVideoId } from '../../shared/types';
import { Z_INDEX_TAILWIND } from '../utils/zIndexLevels';

interface ColorScheme {
  name: string;
  colors: string[];
}

interface ColorPreset {
  name: string;
  value: string;
}

interface EnhancedModalEditorToolbarProps {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
  onBack: () => void;
  onReplaceImage: (file: File) => void;
  
  // Auto-progression
  isAutoProgression: boolean;
  onToggleAutoProgression: (enabled: boolean) => void;
  autoProgressionDuration: number;
  onAutoProgressionDurationChange: (duration: number) => void;
  
  // Zoom controls (optional for deprecated EditorToolbar compatibility)
  currentZoom?: number;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onZoomReset?: () => void;
  onCenter?: () => void;
  
  // Color schemes
  currentColorScheme: string;
  onColorSchemeChange: (schemeName: string) => void;

  // Viewer Modes
  viewerModes: {
    explore?: boolean;
    selfPaced?: boolean;
    timed?: boolean;
  };
  onViewerModeChange: (mode: 'explore' | 'selfPaced' | 'timed', enabled: boolean) => void;
  
  // Save
  onSave: () => void;
  isSaving: boolean;
  showSuccessMessage: boolean;
  isMobile?: boolean;

  // New background props
  backgroundImage?: string; // Current background image/video URL
  backgroundType?: 'image' | 'video';
  backgroundVideoType?: 'youtube' | 'mp4' | undefined;
  onBackgroundImageChange: (url: string) => void;
  onBackgroundTypeChange: (type: 'image' | 'video') => void;
  onBackgroundVideoTypeChange: (type: 'youtube' | 'mp4') => void;
}

const COLOR_SCHEMES: ColorScheme[] = [
  {
    name: 'Default',
    colors: ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500']
  },
  {
    name: 'Professional', 
    colors: ['bg-slate-700', 'bg-teal-600', 'bg-gray-600', 'bg-blue-700', 'bg-slate-800']
  },
  {
    name: 'Warm',
    colors: ['bg-orange-500', 'bg-amber-500', 'bg-red-600', 'bg-yellow-600', 'bg-orange-600']
  },
  {
    name: 'Cool',
    colors: ['bg-sky-500', 'bg-cyan-500', 'bg-blue-600', 'bg-indigo-500', 'bg-teal-500']
  },
  {
    name: 'High Contrast',
    colors: ['bg-black', 'bg-white', 'bg-red-600', 'bg-yellow-400', 'bg-blue-600']
  }
];

const COLOR_PRESETS: ColorPreset[] = [
  { name: 'Red', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Slate', value: '#64748b' },
  { name: 'Gray', value: '#6b7280' },
];

const EnhancedModalEditorToolbar: React.FC<EnhancedModalEditorToolbarProps> = ({
  isOpen,
  onClose,
  projectName,
  onBack,
  onReplaceImage,
  isAutoProgression,
  onToggleAutoProgression,
  autoProgressionDuration,
  onAutoProgressionDurationChange,
  currentZoom,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onCenter,
  currentColorScheme,
  onColorSchemeChange,
  viewerModes,
  onViewerModeChange,
  onSave,
  isSaving,
  showSuccessMessage,
  isMobile = false,

  // New background props
  backgroundImage: currentBackgroundImageUrl = '', // Provide default to prevent uncontrolled behavior
  backgroundType = 'image', // Default to image
  backgroundVideoType = 'mp4', // Default video type
  onBackgroundImageChange,
  onBackgroundTypeChange,
  onBackgroundVideoTypeChange
}) => {
  const [activeTab, setActiveTab] = useState('general');
  const [selectedColorPreset, setSelectedColorPreset] = useState('#ef4444');
  const [localBackgroundImageUrl, setLocalBackgroundImageUrl] = useState(currentBackgroundImageUrl);
  const [showYouTubeInput, setShowYouTubeInput] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');

  // Sync local URL state when prop changes (e.g., on initial load or external update)
  useEffect(() => {
    setLocalBackgroundImageUrl(currentBackgroundImageUrl);
  }, [currentBackgroundImageUrl]);

  const handleImageFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      onReplaceImage(event.target.files[0]); // This prop is for file uploads
      // If a file is uploaded, we assume it's an image background.
      // The parent component will handle setting the URL from Firebase.
      onBackgroundTypeChange('image');
    }
  };

  const handleUrlInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setLocalBackgroundImageUrl(event.target.value);
  };

  const handleUrlInputBlur = () => {
    onBackgroundImageChange(localBackgroundImageUrl);
    // Attempt to auto-detect video type from URL if type is video
    if (backgroundType === 'video') {
      if (localBackgroundImageUrl.includes('youtube.com') || localBackgroundImageUrl.includes('youtu.be')) {
        onBackgroundVideoTypeChange('youtube');
      } else if (localBackgroundImageUrl.toLowerCase().endsWith('.mp4')) {
        onBackgroundVideoTypeChange('mp4');
      }
      // If user manually sets video type later, that will override this auto-detection
    }
  };


  const handleYouTubeUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setYoutubeUrl(event.target.value);
  };

  const handleYouTubeUrlBlur = () => {
    if (youtubeUrl.trim()) {
      // Extract video ID and create YouTube embed URL
      const videoId = extractYouTubeVideoId(youtubeUrl);
      if (videoId) {
        const embedUrl = `https://www.youtube.com/embed/${videoId}`;
        onBackgroundImageChange(embedUrl);
        onBackgroundTypeChange('video');
        onBackgroundVideoTypeChange('youtube');
        // Clear the input after successful processing
        setYoutubeUrl('');
        setShowYouTubeInput(false);
      } else {
        // If extraction fails, treat as regular URL
        onBackgroundImageChange(youtubeUrl);
        onBackgroundTypeChange('video');
      }
    }
  };


  if (!isOpen) return null;

  return (
    <>
      {/* Modal Overlay */}
      <div 
        className={`fixed inset-0 bg-black/50 ${Z_INDEX_TAILWIND.MODAL_BACKDROP} flex items-center justify-center p-4`}
        onClick={onClose}
      >
        {/* Modal Content */}
        <div 
          className={`bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-4xl w-full overflow-hidden ${
            isMobile 
              ? 'h-full max-h-none flex flex-col' 
              : 'max-h-[90vh]'
          }`}
          style={isMobile ? {
            maxHeight: 'calc(100vh - env(keyboard-inset-height, 0px) - 2rem)'
          } : {}}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <ChevronLeftIcon className="w-5 h-5" />
                <span className="font-medium">Back</span>
              </button>
              
              <div className="h-6 w-px bg-slate-300 dark:bg-slate-600" />
              
              <div>
                <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
                  Editor Settings
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {projectName}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Close settings"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="border-b border-slate-200 dark:border-slate-700">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {[
                { id: 'general', name: 'General', icon: null },
                { id: 'appearance', name: 'Appearance', icon: null },
                { id: 'controls', name: 'Controls', icon: null },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                  }`}
                >
                  {tab.icon && <span>{tab.icon}</span>}
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Mobile Zoom Controls Bar */}
          {isMobile && currentZoom !== undefined && onZoomIn && onZoomOut && onZoomReset && (
            <div className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Zoom: {Math.round(currentZoom * 100)}%
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={onZoomOut}
                    className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors text-sm font-medium"
                  >
                    −
                  </button>
                  <button
                    onClick={onZoomReset}
                    className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors text-sm font-medium"
                  >
                    Reset
                  </button>
                  <button
                    onClick={onZoomIn}
                    className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors text-sm font-medium"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab Content */}
          <div className={`p-6 overflow-y-auto ${
            isMobile 
              ? 'flex-1 min-h-0' 
              : 'max-h-[60vh]'
          }`}
          style={isMobile ? {
            maxHeight: 'calc(100vh - env(keyboard-inset-height, 0px) - 20rem)'
          } : {}}>
            {/* General Tab */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                {/* Background Settings - Enhanced with preview and prominence */}
                <div className="space-y-3">
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="text-xl">🖼️</span>
                    Background Settings
                  </h3>
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700 rounded-lg p-4 space-y-4 border border-blue-200 dark:border-slate-600">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
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
                            className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                          />
                          <span className="text-sm text-slate-700 dark:text-slate-300">Image</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="backgroundType"
                            value="video"
                            checked={backgroundType === 'video'}
                            onChange={() => onBackgroundTypeChange('video')}
                            className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                          />
                          <span className="text-sm text-slate-700 dark:text-slate-300">Video</span>
                        </label>
                      </div>
                    </div>

                    {/* Current Background Preview */}
                    {currentBackgroundImageUrl && (
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                          Current Background
                        </label>
                        <div className="relative">
                          {backgroundType === 'image' ? (
                            <img 
                              src={currentBackgroundImageUrl} 
                              alt="Current background" 
                              className="w-full h-32 object-cover rounded-lg border border-slate-300 dark:border-slate-600"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-full h-32 bg-slate-200 dark:bg-slate-700 rounded-lg border border-slate-300 dark:border-slate-600 flex items-center justify-center">
                              <div className="text-center">
                                <span className="text-4xl mb-2 block">🎥</span>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
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

                    {/* Enhanced Upload Interface */}
                    <div className="space-y-4">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        <span className="text-blue-600 dark:text-blue-400 font-semibold">
                          {currentBackgroundImageUrl ? 'Replace Background' : 'Add Background'}
                        </span>
                        {backgroundType === 'image' ? ' Image' : ' Video'}
                      </label>
                      
                      {/* Upload Options */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* File Upload Option */}
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
                              className="w-full inline-flex items-center justify-center px-4 py-3 border-2 border-blue-300 dark:border-blue-600 text-sm font-medium rounded-lg text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 cursor-pointer transition-colors shadow-sm"
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
                              className="w-full inline-flex items-center justify-center px-4 py-3 border border-slate-300 dark:border-slate-600 text-sm font-medium rounded-md text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
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
                            className="w-full inline-flex items-center justify-center px-4 py-3 border border-slate-300 dark:border-slate-600 text-sm font-medium rounded-md text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                          >
                            🔗 Add {backgroundType === 'image' ? 'Image' : 'Video'} URL
                          </button>
                        </div>
                      </div>

                      {/* YouTube URL Input */}
                      {backgroundType === 'video' && showYouTubeInput && (
                        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                          <label htmlFor="youtube-url" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            YouTube URL
                          </label>
                          <input
                            type="text"
                            id="youtube-url"
                            value={youtubeUrl}
                            onChange={handleYouTubeUrlChange}
                            onBlur={handleYouTubeUrlBlur}
                            placeholder="https://youtube.com/watch?v=... or youtu.be/..."
                            className="w-full px-3 py-2 text-base border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-blue-500 focus:border-blue-500"
                          />
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            Paste any YouTube URL format - video ID will be extracted automatically
                          </p>
                        </div>
                      )}

                      {/* General URL Input */}
                      {showUrlInput && (
                        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                          <label htmlFor="background-url" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            {backgroundType === 'image' ? 'Image URL' : 'Video URL (YouTube or MP4)'}
                          </label>
                          <input
                            type="text"
                            id="background-url"
                            value={localBackgroundImageUrl}
                            onChange={handleUrlInputChange}
                            onBlur={handleUrlInputBlur}
                            placeholder={backgroundType === 'image' ? 'https://example.com/image.png' : 'https://youtube.com/watch?v=... or https://example.com/video.mp4'}
                            className="w-full px-3 py-2 text-base border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      )}
                    </div>

                    {backgroundType === 'video' && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
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
                              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                            />
                            <span className="text-sm text-slate-700 dark:text-slate-300">YouTube</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="backgroundVideoType"
                              value="mp4"
                              checked={backgroundVideoType === 'mp4'}
                              onChange={() => onBackgroundVideoTypeChange('mp4')}
                              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                            />
                            <span className="text-sm text-slate-700 dark:text-slate-300">MP4</span>
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Auto-progression */}
                <div className="space-y-3">
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white">Auto-progression</h3>
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isAutoProgression}
                          onChange={(e) => onToggleAutoProgression(e.target.checked)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Enable auto-progression
                        </span>
                      </label>
                    </div>
                    
                    {isAutoProgression && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Duration: {autoProgressionDuration / 1000}s
                        </label>
                        <div className="flex items-center gap-4">
                          <input
                            type="range"
                            min="2000"
                            max="10000"
                            step="1000"
                            value={autoProgressionDuration}
                            onChange={(e) => onAutoProgressionDurationChange(Number(e.target.value))}
                            className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700"
                          />
                          <select
                            value={autoProgressionDuration}
                            onChange={(e) => onAutoProgressionDurationChange(Number(e.target.value))}
                            className="px-3 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                          >
                            <option value={2000}>2s</option>
                            <option value={3000}>3s</option>
                            <option value={5000}>5s</option>
                            <option value={10000}>10s</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Viewer Modes */}
                <div className="space-y-3">
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white">Viewer Modes</h3>
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 space-y-4">
                    {['explore', 'selfPaced', 'timed'].map((mode) => (
                      <div key={mode} className="flex items-center justify-between">
                        <label className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={viewerModes[mode as keyof typeof viewerModes] ?? false}
                            onChange={(e) => onViewerModeChange(mode as 'explore' | 'selfPaced' | 'timed', e.target.checked)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300 capitalize">
                            {mode.replace(/([A-Z])/g, ' $1')} Mode
                          </span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Appearance Tab */}
            {activeTab === 'appearance' && (
              <div className="space-y-6">
                {/* Color Schemes */}
                <div className="space-y-3">
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white">Color Schemes</h3>
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Theme
                      </label>
                      <select
                        value={currentColorScheme}
                        onChange={(e) => onColorSchemeChange(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                      >
                        {COLOR_SCHEMES.map(scheme => (
                          <option key={scheme.name} value={scheme.name}>
                            {scheme.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    {/* Color preview */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Preview
                      </label>
                      <div className="flex gap-2">
                        {COLOR_SCHEMES.find(s => s.name === currentColorScheme)?.colors.map((color, i) => (
                          <div key={i} className={`w-8 h-8 rounded-lg ${color} border-2 border-slate-300 dark:border-slate-600`} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Color Presets */}
                <div className="space-y-3">
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white">Hotspot Colors</h3>
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                      Quick Color Selection
                    </label>
                    <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
                      {COLOR_PRESETS.map((color) => (
                        <button
                          key={color.value}
                          onClick={() => setSelectedColorPreset(color.value)}
                          className={`w-10 h-10 rounded-lg border-2 transition-all hover:scale-105 ${
                            selectedColorPreset === color.value 
                              ? 'border-slate-900 dark:border-white scale-110' 
                              : 'border-slate-300 dark:border-slate-600 hover:border-slate-500'
                          }`}
                          style={{ backgroundColor: color.value }}
                          title={color.name}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Controls Tab */}
            {activeTab === 'controls' && (
              <div className="space-y-6">
                {/* Zoom Controls */}
                {currentZoom !== undefined && onZoomIn && onZoomOut && onZoomReset && onCenter && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white">Zoom Controls</h3>
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Current Zoom: {Math.round(currentZoom * 100)}%
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <button
                          onClick={onZoomOut}
                          className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-md transition-colors font-medium"
                        >
                          Zoom Out
                        </button>
                        <button
                          onClick={onZoomIn}
                          className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-md transition-colors font-medium"
                        >
                          Zoom In
                        </button>
                        <button
                          onClick={onZoomReset}
                          className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-md transition-colors font-medium"
                        >
                          Reset
                        </button>
                        <button
                          onClick={onCenter}
                          className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-md transition-colors font-medium"
                        >
                          Center
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-between p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
            >
              Close
            </button>
            <div className="flex items-center gap-3">
              <button
                onClick={onSave}
                disabled={isSaving}
                className={`inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm transition-all duration-200 ${
                  isSaving 
                    ? 'bg-green-500 cursor-not-allowed' 
                    : showSuccessMessage 
                      ? 'bg-green-500' 
                      : 'bg-blue-600 hover:bg-blue-700'
                } text-white`}
              >
                {isSaving ? (
                  <>
                    <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                    Saving...
                  </>
                ) : showSuccessMessage ? (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Saved!
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export { COLOR_SCHEMES };
export default EnhancedModalEditorToolbar;