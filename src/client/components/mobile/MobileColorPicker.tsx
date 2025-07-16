import React from 'react';

interface MobileColorPickerProps {
  currentColor: string;
  onColorChange: (newColor: string) => void;
}

const COLORS = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'];

const MobileColorPicker: React.FC<MobileColorPickerProps> = ({ currentColor, onColorChange }) => {
  return (
    <div className="mobile-color-picker">
      {COLORS.map((color) => (
        <div
          key={color}
          className={`color-swatch ${currentColor === color ? 'selected' : ''}`}
          style={{ backgroundColor: color }}
          onClick={() => onColorChange(color)}
        />
      ))}
    </div>
  );
};

export default MobileColorPicker;
