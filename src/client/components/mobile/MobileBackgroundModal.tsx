import React, { useState } from 'react';
import { InteractiveSlide, BackgroundMedia } from '../../../shared/slideTypes';
import Modal from '../Modal';
import AspectRatioSelector from '../AspectRatioSelector';
import FileUpload from '../FileUpload';
import { TrashIcon } from '../icons/TrashIcon';

interface MobileBackgroundModalProps {
  currentSlide: InteractiveSlide;
  onAspectRatioChange: (ratio: string) => void;
  onBackgroundUpload: (file: File) => void;
  onBackgroundRemove: () => void;
  onBackgroundUpdate: (mediaConfig: BackgroundMedia) => void;
  onClose: () => void;
}

/**
 * MobileBackgroundModal - Modal for managing slide background and aspect ratio
 * 
 * Provides mobile-friendly interface for:
 * - Changing aspect ratio
 * - Uploading background images/videos
 * - Removing background media
 * - Adjusting background settings
 */
export const MobileBackgroundModal: React.FC<MobileBackgroundModalProps> = ({
  currentSlide,
  onAspectRatioChange,
  onBackgroundUpload,
  onBackgroundRemove,
  onBackgroundUpdate,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'aspectRatio' | 'background'>('aspectRatio');
  
  const backgroundMedia = currentSlide.backgroundMedia;
  const currentAspectRatio = currentSlide.layout?.aspectRatio || '16:9';

  const handleFileUpload = (file: File) => {
    onBackgroundUpload(file);
    // Switch to background tab after upload
    setActiveTab('background');
  };

  const handleBackgroundRemove = () => {
    if (window.confirm('Remove background media?')) {
      onBackgroundRemove();
    }
  };

  const handleBackgroundSizeChange = (size: 'cover' | 'contain' | 'fill') => {
    if (backgroundMedia) {
      onBackgroundUpdate({
        ...backgroundMedia,
        size
      });
    }
  };

  const handleBackgroundPositionChange = (position: string) => {
    if (backgroundMedia) {
      onBackgroundUpdate({
        ...backgroundMedia,
        position
      });
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Background & Layout">
      <div className="p-4">
        {/* Tab navigation */}
        <div className="flex mb-4 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('aspectRatio')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'aspectRatio'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Aspect Ratio
          </button>
          <button
            onClick={() => setActiveTab('background')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'background'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Background
          </button>
        </div>

        {/* Aspect Ratio Tab */}
        {activeTab === 'aspectRatio' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Select Aspect Ratio
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {['16:9', '4:3', '1:1', '9:16'].map((ratio) => (
                  <button
                    key={ratio}
                    onClick={() => onAspectRatioChange(ratio)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      currentAspectRatio === ratio
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <div className="text-sm font-medium">{ratio}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {ratio === '16:9' ? 'Widescreen' :
                       ratio === '4:3' ? 'Standard' :
                       ratio === '1:1' ? 'Square' : 'Portrait'}
                    </div>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg">
              <strong>Current:</strong> {currentAspectRatio} • 
              {currentSlide.layout?.containerWidth}×{currentSlide.layout?.containerHeight}px
            </div>
          </div>
        )}

        {/* Background Tab */}
        {activeTab === 'background' && (
          <div className="space-y-4">
            {/* Current background preview */}
            {backgroundMedia && (
              <div className="relative">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">
                  Current Background
                </h3>
                <div className="relative bg-gray-100 rounded-lg overflow-hidden">
                  {backgroundMedia.type === 'image' ? (
                    <img
                      src={backgroundMedia.url}
                      alt="Background"
                      className="w-full h-32 object-cover"
                    />
                  ) : backgroundMedia.type === 'video' ? (
                    <video
                      src={backgroundMedia.url}
                      className="w-full h-32 object-cover"
                      muted
                    />
                  ) : (
                    <div 
                      className="w-full h-32"
                      style={{ backgroundColor: backgroundMedia.url }}
                    />
                  )}
                  <button
                    onClick={handleBackgroundRemove}
                    className="absolute top-2 right-2 p-2 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors"
                    title="Remove background"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Upload new background */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                {backgroundMedia ? 'Change Background' : 'Add Background'}
              </h3>
              <FileUpload
                onFileSelect={handleFileUpload}
                accept="image/*,video/*"
                className="w-full"
                label={`${backgroundMedia ? 'Change' : 'Upload'} Image or Video`}
              />
            </div>

            {/* Background settings */}
            {backgroundMedia && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Background Size
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['cover', 'contain', 'fill'] as const).map((size) => (
                      <button
                        key={size}
                        onClick={() => handleBackgroundSizeChange(size)}
                        className={`py-2 px-3 text-xs rounded-md border transition-colors ${
                          backgroundMedia.size === size
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300 text-gray-700'
                        }`}
                      >
                        {size.charAt(0).toUpperCase() + size.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Background Position
                  </label>
                  <select
                    value={backgroundMedia.position || 'center'}
                    onChange={(e) => handleBackgroundPositionChange(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="center">Center</option>
                    <option value="top">Top</option>
                    <option value="bottom">Bottom</option>
                    <option value="left">Left</option>
                    <option value="right">Right</option>
                    <option value="top left">Top Left</option>
                    <option value="top right">Top Right</option>
                    <option value="bottom left">Bottom Left</option>
                    <option value="bottom right">Bottom Right</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default MobileBackgroundModal;