import React from 'react';

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
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
      <div className="grid grid-cols-3 gap-4">
        {shapes.map((shape) => (
          <button
            key={shape.value}
            type="button"
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
