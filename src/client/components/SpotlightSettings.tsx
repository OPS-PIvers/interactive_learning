import React from 'react';

interface SpotlightSettingsProps {
  shape: 'circle' | 'rectangle' | 'oval';
  dimPercentage: number;
  onShapeChange: (shape: 'circle' | 'rectangle' | 'oval') => void;
  onDimPercentageChange: (percentage: number) => void;
}

const SpotlightSettings: React.FC<SpotlightSettingsProps> = ({
  shape,
  dimPercentage,
  onShapeChange,
  onDimPercentageChange
}) => {
  return (
    <div className="mb-6 bg-slate-700 rounded-lg p-4">
      <h4 className="text-md font-medium text-white mb-4 flex items-center">
        <span className="text-xl mr-2">💡</span>
        Spotlight Settings
      </h4>
      <div className="space-y-4">
        {/* Shape Selection */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Shape</label>
          <div className="flex space-x-2">
            <button
              onClick={() => onShapeChange('circle')}
              className={`flex-1 py-2 rounded font-medium transition-colors ${
                shape === 'circle'
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-slate-600 hover:bg-slate-500 text-slate-200'
              }`}
            >
              ⭕ Circle
            </button>
            <button
              onClick={() => onShapeChange('rectangle')}
              className={`flex-1 py-2 rounded font-medium transition-colors ${
                shape === 'rectangle'
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-slate-600 hover:bg-slate-500 text-slate-200'
              }`}
            >
              ▢ Rectangle
            </button>
            <button
              onClick={() => onShapeChange('oval')}
              className={`flex-1 py-2 rounded font-medium transition-colors ${
                shape === 'oval'
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-slate-600 hover:bg-slate-500 text-slate-200'
              }`}
            >
              ⬭ Oval
            </button>
          </div>
        </div>
        
        {/* Dimming Control */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Background Dimming: <span className="text-yellow-400 font-mono">{dimPercentage}%</span>
          </label>
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={dimPercentage}
            onChange={(e) => onDimPercentageChange(parseInt(e.target.value))}
            className="slider w-full" 
            aria-label="Background dimming percentage"
          />
          <div className="flex justify-between text-xs text-slate-400 mt-1">
            <span>0% (No dimming)</span>
            <span>100% (Completely dark)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpotlightSettings;