import React from 'react';

interface SliderControlProps {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
  valueLabelMap?: string[];
}

const SliderControl: React.FC<SliderControlProps> = ({
  label,
  min,
  max,
  step,
  value,
  onChange,
  valueLabelMap,
}) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(Number(event.target.value));
  };

  const displayValue = valueLabelMap?.[value] ?? value;

  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-1">
        {label}
      </label>
      <div className="flex items-center space-x-3">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          className="slider" // Uses custom styles from index.css
        />
        <span className="text-sm text-slate-300 w-16 text-right">{displayValue}</span>
      </div>
    </div>
  );
};

export default SliderControl;