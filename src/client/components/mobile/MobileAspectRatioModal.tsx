import React from 'react';
import { XMarkIcon } from '../icons/XMarkIcon';
import { useMobileToolbar } from '../../hooks/useMobileToolbar';

interface MobileAspectRatioModalProps {
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

export const MobileAspectRatioModal: React.FC<MobileAspectRatioModalProps> = ({
  isOpen,
  onClose,
  currentRatio,
  onRatioChange
}) => {
  const { dimensions } = useMobileToolbar();
  
  if (!isOpen) return null;

  const handleRatioSelect = (ratio: string) => {
    onRatioChange(ratio);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50">
      <div 
        className="bg-slate-800 rounded-t-2xl w-full overflow-hidden"
        style={{
          /* Position above bottom toolbar and limit height */
          marginBottom: `${dimensions.toolbarHeight}px`, // Space for responsive toolbar
          maxHeight: `calc(70vh - ${dimensions.toolbarHeight}px - 30px)`, // Conservative height with safety margin
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-lg font-bold text-white">Aspect Ratio</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1"
            aria-label="Close aspect ratio selector"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 max-h-[60vh] overflow-y-auto">
          <p className="text-slate-400 text-sm mb-4">
            Choose the aspect ratio for your slide canvas
          </p>
          
          <div className="space-y-3">
            {aspectRatios.map((ratio) => (
              <button
                key={ratio.value}
                onClick={() => handleRatioSelect(ratio.value)}
                className={`w-full p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                  currentRatio === ratio.value
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-slate-600 hover:border-slate-500 bg-slate-700/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-white">{ratio.label}</h3>
                  {currentRatio === ratio.value && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  )}
                </div>
                <p className="text-slate-400 text-sm">{ratio.description}</p>
                
                {/* Visual preview */}
                <div className="mt-3 flex justify-center">
                  <div 
                    className={`border-2 border-slate-500 bg-slate-600/30 ${
                      currentRatio === ratio.value ? 'border-blue-400' : ''
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

        {/* Footer */}
        <div className="p-4 border-t border-slate-700">
          <button
            onClick={onClose}
            className="w-full bg-slate-600 hover:bg-slate-500 text-white py-3 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileAspectRatioModal;