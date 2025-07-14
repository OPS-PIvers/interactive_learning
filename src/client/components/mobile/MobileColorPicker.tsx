import React, { useId } from 'react';

interface MobileColorPickerProps {
  label: string;
  color: string;
  onChange: (color: string) => void;
  className?: string;
}

export const MobileColorPicker: React.FC<MobileColorPickerProps> = ({
  label,
  color,
  onChange,
  className = ''
}) => {
  const id = useId();
  
  return (
    <div className={`flex items-center justify-between ${className}`}>
      <label htmlFor={id} className="text-sm font-medium text-gray-300">{label}</label>
      <div className="flex items-center space-x-2">
        <input
          id={id}
          type="color"
          value={color}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 cursor-pointer"
          aria-label={`Current color: ${color}. Click to change.`}
        />
        <span className="text-sm text-gray-400">{color.toUpperCase()}</span>
      </div>
    </div>
  );
};
