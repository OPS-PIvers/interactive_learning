import React from 'react';

interface AspectRatioSelectorProps {
  aspectRatio: string;
  developmentMode: 'desktop' | 'mobile';
  onAspectRatioChange: (ratio: string) => void;
  onDevelopmentModeChange: (mode: 'desktop' | 'mobile') => void;
  className?: string;
}

const ASPECT_RATIOS = [
  { ratio: '16:9', label: '16:9 (Widescreen)', description: 'Most common for presentations' },
  { ratio: '4:3', label: '4:3 (Standard)', description: 'Traditional presentation format' },
  { ratio: '3:2', label: '3:2 (Photo)', description: 'Photography standard' },
  { ratio: '1:1', label: '1:1 (Square)', description: 'Social media posts' },
  { ratio: '9:16', label: '9:16 (Portrait)', description: 'Mobile stories, TikTok' }
];

/**
 * AspectRatioSelector - Choose canvas aspect ratio and development mode
 * 
 * Features:
 * - Aspect ratio selection (16:9, 4:3, etc.)
 * - Development mode toggle (desktop vs mobile optimization)
 * - Visual preview of selected ratio
 */
export const AspectRatioSelector: React.FC<AspectRatioSelectorProps> = ({
  aspectRatio,
  developmentMode,
  onAspectRatioChange,
  onDevelopmentModeChange,
  className = ''
}) => {
  const selectedRatio = ASPECT_RATIOS.find(r => r.ratio === aspectRatio) || ASPECT_RATIOS[0];

  return (
    <div className={`aspect-ratio-selector ${className}`}>
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <h3 className="text-lg font-semibold mb-4">Canvas Settings</h3>
        
        {/* Development Mode Toggle */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Development Mode
          </label>
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => onDevelopmentModeChange('desktop')}
              className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                developmentMode === 'desktop'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🖥️ Desktop
            </button>
            <button
              onClick={() => onDevelopmentModeChange('mobile')}
              className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                developmentMode === 'mobile'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📱 Mobile
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {developmentMode === 'desktop' 
              ? 'Optimizing for desktop/tablet viewing experience'
              : 'Optimizing for mobile viewing experience'
            }
          </p>
        </div>

        {/* Aspect Ratio Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Aspect Ratio
          </label>
          <div className="grid grid-cols-1 gap-2">
            {ASPECT_RATIOS.map((ratio) => {
              const [w, h] = ratio.ratio.split(':').map(Number);
              if (!w || !h) return null;
              const isSelected = aspectRatio === ratio.ratio;
              
              return (
                <button
                  key={ratio.ratio}
                  onClick={() => onAspectRatioChange(ratio.ratio)}
                  className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-colors text-left ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {/* Visual ratio preview */}
                  <div className="flex-shrink-0">
                    <div
                      className={`border-2 ${
                        isSelected ? 'border-blue-400' : 'border-gray-300'
                      }`}
                      style={{
                        width: Math.max(40, Math.min(60, 40 * (w! / h!))),
                        height: Math.max(30, Math.min(40, 40 * (h! / w!))),
                      }}
                    />
                  </div>
                  
                  <div className="flex-1">
                    <div className={`font-medium ${isSelected ? 'text-blue-700' : 'text-gray-900'}`}>
                      {ratio.label}
                    </div>
                    <div className="text-sm text-gray-500">
                      {ratio.description}
                    </div>
                  </div>
                  
                  {isSelected && (
                    <div className="flex-shrink-0 text-blue-500">
                      ✓
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Current selection info */}
        <div className="pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            <strong>Current:</strong> {selectedRatio?.label || aspectRatio} • {developmentMode} mode
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Canvas will be optimized for {developmentMode} viewing with {aspectRatio} aspect ratio
          </div>
        </div>

        {/* Tips */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="text-sm text-blue-800">
            <strong>💡 Tip:</strong> 
            {developmentMode === 'desktop' 
              ? ' Use 16:9 for presentations, 4:3 for traditional content.'
              : ' Use 9:16 for mobile stories, 1:1 for social media.'
            }
          </div>
        </div>
      </div>
    </div>
  );
};

export default AspectRatioSelector;