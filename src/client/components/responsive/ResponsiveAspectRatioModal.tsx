/**
 * Responsive Aspect Ratio Modal Component
 * 
 * Unified modal for aspect ratio and development mode selection that adapts to all screen sizes.
 * Progressive enhancement from mobile-first foundation to desktop features.
 */

import React from 'react';
import { ResponsiveModal } from './ResponsiveModal';

interface ResponsiveAspectRatioModalProps {
  isOpen: boolean;
  onClose: () => void;
  aspectRatio: string;
  developmentMode: 'desktop' | 'mobile';
  onAspectRatioChange: (ratio: string) => void;
  onDevelopmentModeChange: (mode: 'desktop' | 'mobile') => void;
}

interface AspectRatioOption {
  ratio: string;
  label: string;
  description: string;
}

/**
 * ResponsiveAspectRatioModal - Unified modal for aspect ratio and development mode selection
 */
export const ResponsiveAspectRatioModal: React.FC<ResponsiveAspectRatioModalProps> = ({
  isOpen,
  onClose,
  aspectRatio,
  developmentMode,
  onAspectRatioChange,
  onDevelopmentModeChange
}) => {
  const aspectRatioOptions: AspectRatioOption[] = [
    { ratio: '16:9', label: '16:9', description: 'Widescreen' },
    { ratio: '9:16', label: '9:16', description: 'Mobile Portrait' },
    { ratio: '4:3', label: '4:3', description: 'Traditional' },
    { ratio: '1:1', label: '1:1', description: 'Square' },
  ];

  return (
    <ResponsiveModal
      type="properties"
      isOpen={isOpen}
      onClose={onClose}
      title="Aspect Ratio & Module Settings"
    >
      <div className="p-4 sm:p-6 space-y-6">
        {/* Development Mode Selection */}
        <div>
          <h3 className="text-md font-semibold mb-3 text-gray-900">Module Type</h3>
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => onDevelopmentModeChange('desktop')}
              className={`flex-1 px-3 py-2 text-sm rounded-md transition-all duration-300 font-medium ${
                developmentMode === 'desktop'
                  ? 'bg-blue-600 shadow text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              🖥️ Web
            </button>
            <button
              onClick={() => onDevelopmentModeChange('mobile')}
              className={`flex-1 px-3 py-2 text-sm rounded-md transition-all duration-300 font-medium ${
                developmentMode === 'mobile'
                  ? 'bg-blue-600 shadow text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              📱 Mobile
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {developmentMode === 'desktop' 
              ? 'Optimized for web/desktop viewing'
              : 'Optimized for mobile devices'
            }
          </p>
        </div>

        {/* Aspect Ratio Selection */}
        <div>
          <h3 className="text-md font-semibold mb-3 text-gray-900">Aspect Ratio</h3>
          <div className="flex bg-gray-100 p-1 rounded-lg">
            {aspectRatioOptions.map((option) => (
              <button
                key={option.ratio}
                onClick={() => onAspectRatioChange(option.ratio)}
                className={`flex-1 px-2 py-2 text-sm rounded-md transition-all duration-300 font-medium ${
                  aspectRatio === option.ratio
                    ? 'bg-blue-600 shadow text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
                title={option.description}
              >
                {option.label}
              </button>
            ))}
          </div>
          
          {/* Visual Preview */}
          <div className="mt-4 flex items-center justify-center">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <div
                  className="border-2 border-blue-600 bg-blue-50 rounded"
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
              <p className="text-xs text-gray-500">
                {aspectRatio} • {aspectRatioOptions.find(opt => opt.ratio === aspectRatio)?.description}
              </p>
            </div>
          </div>
        </div>

        {/* Current Settings Summary */}
        <div className="border-t border-gray-200 pt-4">
          <div className="text-xs text-gray-500 text-center">
            <span className="font-medium text-gray-700">
              {developmentMode === 'desktop' ? 'Web' : 'Mobile'} Module
            </span> • <span className="font-medium text-gray-700">{aspectRatio}</span>
          </div>
        </div>

        {/* Helpful Tips */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="text-xs text-gray-700">
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
    </ResponsiveModal>
  );
};

export default ResponsiveAspectRatioModal;