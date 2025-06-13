import React from 'react';

interface SliderControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (value: number) => void;
  onPreview?: (value: number) => void;
  onPreviewEnd?: () => void;
  className?: string;
}

const SliderControl: React.FC<SliderControlProps> = ({
  label,
  value,
  min,
  max,
  step,
  unit = '',
  onChange,
  onPreview,
  onPreviewEnd,
  className = '',
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    onChange(newValue);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLInputElement>) => {
    if (onPreview && e.buttons === 1) { // Only if mouse is pressed
      const newValue = parseFloat((e.target as HTMLInputElement).value);
      onPreview(newValue);
    }
  };

  const handleMouseUp = () => {
    if (onPreviewEnd) {
      onPreviewEnd();
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-300">{label}</label>
        <span className="text-sm text-slate-400">
          {value.toFixed(step < 1 ? 1 : 0)}{unit}
        </span>
      </div>
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer slider"
        />
        <style jsx>{`
          .slider::-webkit-slider-thumb {
            appearance: none;
            height: 16px;
            width: 16px;
            border-radius: 50%;
            background: #8b5cf6;
            cursor: pointer;
            border: 2px solid #ffffff;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          }
          
          .slider::-webkit-slider-thumb:hover {
            background: #7c3aed;
          }
          
          .slider::-moz-range-thumb {
            height: 16px;
            width: 16px;
            border-radius: 50%;
            background: #8b5cf6;
            cursor: pointer;
            border: 2px solid #ffffff;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          }
          
          .slider::-moz-range-thumb:hover {
            background: #7c3aed;
          }
          
          .slider::-webkit-slider-track {
            height: 8px;
            border-radius: 4px;
            background: linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${((value - min) / (max - min)) * 100}%, #475569 ${((value - min) / (max - min)) * 100}%, #475569 100%);
          }
          
          .slider::-moz-range-track {
            height: 8px;
            border-radius: 4px;
            background: #475569;
          }
          
          .slider::-moz-range-progress {
            height: 8px;
            border-radius: 4px;
            background: #8b5cf6;
          }
        `}</style>
      </div>
    </div>
  );
};

export default SliderControl;