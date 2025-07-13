import React, { useId } from 'react';

interface MobileSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
  className?: string;
}

export const MobileSlider: React.FC<MobileSliderProps> = ({
  label, value, min, max, step = 1, unit = '', onChange, className = ''
}) => {
  const id = useId();
  
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex justify-between items-center">
        <label htmlFor={id} className="text-sm font-medium text-gray-300">{label}</label>
        <span className="text-sm text-gray-400">{value}{unit}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-8 bg-slate-700 rounded-lg appearance-none cursor-pointer slider-thumb"
      />
    </div>
  );
};
