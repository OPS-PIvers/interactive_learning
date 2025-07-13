import React from 'react';

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
  return (
    <div className={`flex items-center justify-between ${className}`}>
      <label className="text-sm font-medium text-gray-300">{label}</label>
      <div className="flex items-center space-x-2">
        <input
          type="color"
          value={color}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 cursor-pointer"
        />
        <span className="text-sm text-gray-400">{color.toUpperCase()}</span>
      </div>
    </div>
  );
};
