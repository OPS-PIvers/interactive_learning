/**
 * Responsive Aspect Ratio Modal Component
 * 
 * Unified modal for aspect ratio selection that adapts to all screen sizes.
 * Progressive enhancement from mobile-first foundation to desktop features.
 */

import React from 'react';
import { ResponsiveModal } from './ResponsiveModal';

interface ResponsiveAspectRatioModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRatio: string;
  onRatioChange: (ratio: string) => void;
}

const aspectRatios = [
  { value: '16:9', label: '16:9 (Widescreen)', description: 'Standard widescreen format' },
  { value: '4:3', label: '4:3 (Traditional)', description: 'Classic presentation format' },
  { value: '1:1', label: '1:1 (Square)', description: 'Social media friendly' },
  { value: '9:16', label: '9:16 (Vertical)', description: 'Mobile portrait format' },
  { value: '3:2', label: '3:2 (Photo)', description: 'Photography standard' },
  { value: '21:9', label: '21:9 (Ultrawide)', description: 'Cinema format' }
];

/**
 * ResponsiveAspectRatioModal - Unified modal for aspect ratio selection
 */
export const ResponsiveAspectRatioModal: React.FC<ResponsiveAspectRatioModalProps> = ({
  isOpen,
  onClose,
  currentRatio,
  onRatioChange
}) => {
  if (!isOpen) return null;

  const handleRatioSelect = (ratio: string) => {
    onRatioChange(ratio);
    onClose();
  };

  return (
    <ResponsiveModal
      type="standard"
      isOpen={isOpen}
      onClose={onClose}
    >
      <div className="p-4 sm:p-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
            Aspect Ratio
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-4 sm:mb-6">
          Choose the aspect ratio for your slide canvas
        </p>
        
        {/* Aspect ratio options */}
        <div className="max-h-64 sm:max-h-96 overflow-y-auto mb-4 sm:mb-6">
          <div className="space-y-3">
            {aspectRatios.map((ratio) => (
              <button
                key={ratio.value}
                onClick={() => handleRatioSelect(ratio.value)}
                className={`w-full p-3 sm:p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                  currentRatio === ratio.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base">{ratio.label}</h3>
                  {currentRatio === ratio.value && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  )}
                </div>
                <p className="text-gray-600 text-xs sm:text-sm mb-3">{ratio.description}</p>
                
                {/* Visual preview */}
                <div className="flex justify-center">
                  <div 
                    className={`border-2 bg-gray-100 ${
                      currentRatio === ratio.value ? 'border-blue-400' : 'border-gray-300'
                    }`}
                    style={{
                      width: ratio.value === '16:9' ? '48px' : 
                             ratio.value === '4:3' ? '40px' :
                             ratio.value === '1:1' ? '32px' :
                             ratio.value === '9:16' ? '18px' :
                             ratio.value === '3:2' ? '42px' : '56px',
                      height: ratio.value === '16:9' ? '27px' : 
                              ratio.value === '4:3' ? '30px' :
                              ratio.value === '1:1' ? '32px' :
                              ratio.value === '9:16' ? '32px' :
                              ratio.value === '3:2' ? '28px' : '24px'
                    }}
                  />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="pt-3 sm:pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full bg-slate-600 hover:bg-slate-500 text-white py-3 px-4 rounded-lg font-medium transition-colors text-sm sm:text-base"
          >
            Cancel
          </button>
        </div>
      </div>
    </ResponsiveModal>
  );
};

export default ResponsiveAspectRatioModal;