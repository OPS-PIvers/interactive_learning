import React, { useId } from 'react';

interface Shape {
  value: string;
  label: string;
  icon: React.ReactNode;
}

interface MobileShapeSelectorProps {
  label: string;
  shapes: Shape[];
  selectedShape: string;
  onChange: (shape: string) => void;
  className?: string;
}

export const MobileShapeSelector: React.FC<MobileShapeSelectorProps> = ({
  label,
  shapes,
  selectedShape,
  onChange,
  className = ''
}) => {
  const id = useId();
  
  return (
    <div className={className}>
      <label id={`${id}-label`} className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
      <div 
        role="radiogroup" 
        aria-labelledby={`${id}-label`}
        className="grid grid-cols-3 gap-4"
      >
        {shapes.map((shape) => (
          <button
            key={shape.value}
            type="button"
            role="radio"
            aria-checked={selectedShape === shape.value}
            aria-label={shape.label}
            className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 ${
              selectedShape === shape.value
                ? 'border-blue-500 bg-blue-900'
                : 'border-slate-700 bg-slate-800'
            }`}
            onClick={() => onChange(shape.value)}
          >
            {shape.icon}
            <span className="mt-2 text-sm text-gray-300">{shape.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
