import React from 'react';
import EditorPopupBase from './shared/EditorPopupBase';

interface AspectRatioSettingsPopupProps {
  isOpen: boolean;
  onClose: () => void;
  aspectRatio: string;
  developmentMode: 'desktop' | 'mobile';
  onAspectRatioChange: (ratio: string) => void;
  onDevelopmentModeChange: (mode: 'desktop' | 'mobile') => void;
  position?: 'bottom-left' | 'bottom-center' | 'bottom-right';
}

interface AspectRatioOption {
  ratio: string;
  label: string;
  description: string;
}

/**
 * AspectRatioSettingsPopup - Modern popup for aspect ratio and development mode selection
 * 
 * Features:
 * - Four main aspect ratios: 16:9, 9:16, 4:3, 1:1
 * - Toggle button layout for quick selection
 * - Development mode selection (web vs mobile module)
 * - Matches the design from the HTML mockup
 */
const AspectRatioSettingsPopup: React.FC<AspectRatioSettingsPopupProps> = ({
  isOpen,
  onClose,
  aspectRatio,
  developmentMode,
  onAspectRatioChange,
  onDevelopmentModeChange,
  position = 'bottom-center'
}) => {
  const aspectRatioOptions: AspectRatioOption[] = [
    { ratio: '16:9', label: '16:9', description: 'Widescreen' },
    { ratio: '9:16', label: '9:16', description: 'Mobile Portrait' },
    { ratio: '4:3', label: '4:3', description: 'Traditional' },
    { ratio: '1:1', label: '1:1', description: 'Square' },
  ];

  return (
    <EditorPopupBase 
      isOpen={isOpen} 
      onClose={onClose}
      position={position}
      className="w-64"
    >
      <div className="space-y-4">
        {/* Development Mode Selection */}
        <div>
          <h3 className="text-md font-semibold mb-2 text-gray-200">Module Type</h3>
          <div className="flex bg-[#17214a] p-1 rounded-lg">
            <button
              onClick={() => onDevelopmentModeChange('desktop')}
              className={`flex-1 px-3 py-2 text-sm rounded-md transition-all duration-300 font-medium ${
                developmentMode === 'desktop'
                  ? 'bg-[#1e3fe8] shadow text-white'
                  : 'text-gray-300 hover:bg-[#3e4f8a]'
              }`}
            >
              🖥️ Web
            </button>
            <button
              onClick={() => onDevelopmentModeChange('mobile')}
              className={`flex-1 px-3 py-2 text-sm rounded-md transition-all duration-300 font-medium ${
                developmentMode === 'mobile'
                  ? 'bg-[#1e3fe8] shadow text-white'
                  : 'text-gray-300 hover:bg-[#3e4f8a]'
              }`}
            >
              📱 Mobile
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {developmentMode === 'desktop' 
              ? 'Optimized for web/desktop viewing'
              : 'Optimized for mobile devices'
            }
          </p>
        </div>

        {/* Aspect Ratio Selection */}
        <div>
          <h3 className="text-md font-semibold mb-2 text-gray-200">Aspect Ratio</h3>
          <div className="flex bg-[#17214a] p-1 rounded-lg">
            {aspectRatioOptions.map((option) => (
              <button
                key={option.ratio}
                onClick={() => onAspectRatioChange(option.ratio)}
                className={`flex-1 px-2 py-2 text-sm rounded-md transition-all duration-300 font-medium ${
                  aspectRatio === option.ratio
                    ? 'bg-[#1e3fe8] shadow text-white'
                    : 'text-gray-300 hover:bg-[#3e4f8a]'
                }`}
                title={option.description}
              >
                {option.label}
              </button>
            ))}
          </div>
          
          {/* Visual Preview */}
          <div className="mt-3 flex items-center justify-center">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <div
                  className="border-2 border-[#1e3fe8] bg-[#1e3fe8]/20 rounded"
                  style={{
                    width: (() => {
                      const parts = aspectRatio.split(':');
                      const w = Number(parts[0]);
                      const h = Number(parts[1]);
                      if (!w || !h) return 40;
                      return Math.min(60, 40 * (w / h));
                    })(),
                    height: (() => {
                      const parts = aspectRatio.split(':');
                      const w = Number(parts[0]);
                      const h = Number(parts[1]);
                      if (!w || !h) return 30;
                      return Math.min(40, 40 * (h / w));
                    })(),
                  }}
                />
              </div>
              <p className="text-xs text-gray-400">
                {aspectRatio} • {aspectRatioOptions.find(opt => opt.ratio === aspectRatio)?.description}
              </p>
            </div>
          </div>
        </div>

        {/* Current Settings Summary */}
        <div className="border-t border-[#3e4f8a] pt-3">
          <div className="text-xs text-gray-400 text-center">
            <span className="font-medium text-gray-300">
              {developmentMode === 'desktop' ? 'Web' : 'Mobile'} Module
            </span> • <span className="font-medium text-gray-300">{aspectRatio}</span>
          </div>
        </div>

        {/* Helpful Tips */}
        <div className="bg-[#1e3fe8]/10 border border-[#1e3fe8]/20 rounded-lg p-3">
          <div className="text-xs text-gray-300">
            <span className="font-medium">💡 Tip:</span>
            {developmentMode === 'desktop' ? (
              aspectRatio === '16:9' 
                ? ' Perfect for presentations and web content.'
                : aspectRatio === '4:3'
                ? ' Great for traditional content and older displays.'
                : aspectRatio === '1:1'
                ? ' Ideal for social media posts.'
                : ' Excellent for mobile-first web content.'
            ) : (
              aspectRatio === '9:16'
                ? ' Perfect for mobile stories and vertical video.'
                : aspectRatio === '1:1'
                ? ' Great for Instagram and social media.'
                : aspectRatio === '16:9'
                ? ' Good for landscape mobile content.'
                : ' Suitable for mobile presentations.'
            )}
          </div>
        </div>
      </div>
    </EditorPopupBase>
  );
};

export default AspectRatioSettingsPopup;