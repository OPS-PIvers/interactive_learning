import React, { useState } from 'react';
import { COLOR_SCHEMES, COLOR_PRESETS } from '../shared/color-constants';

interface AppearanceSectionProps {
  currentColorScheme: string;
  onColorSchemeChange: (schemeName: string) => void;
}

const AppearanceSection: React.FC<AppearanceSectionProps> = ({
  currentColorScheme,
  onColorSchemeChange,
}) => {
  const [selectedColorPreset, setSelectedColorPreset] = useState('#ef4444');

  return (
    <div className="space-y-6">
      {/* Color Schemes */}
      <div className="space-y-3">
        <h3 className="text-lg font-medium text-white">Color Schemes</h3>
        <div className="bg-slate-800/50 rounded-lg p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Theme
            </label>
            <select
              value={currentColorScheme}
              onChange={(e) => onColorSchemeChange(e.target.value)}
              className="w-full px-3 py-2 border border-slate-600 rounded-md bg-slate-800 text-slate-100"
            >
              {COLOR_SCHEMES.map(scheme => (
                <option key={scheme.name} value={scheme.name}>
                  {scheme.name}
                </option>
              ))}
            </select>
          </div>

          {/* Color preview */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Preview
            </label>
            <div className="flex gap-2">
              {COLOR_SCHEMES.find(s => s.name === currentColorScheme)?.colors.map((color) => (
                <div key={color} className={`w-8 h-8 rounded-lg ${color} border-2 border-slate-600`} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Color Presets */}
      <div className="space-y-3">
        <h3 className="text-lg font-medium text-white">Hotspot Colors</h3>
        <div className="bg-slate-800/50 rounded-lg p-4">
          <label className="block text-sm font-medium text-slate-300 mb-3">
            Quick Color Selection
          </label>
          <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
            {COLOR_PRESETS.map((color) => (
              <button
                key={color.value}
                onClick={() => setSelectedColorPreset(color.value)}
                className={`w-10 h-10 rounded-lg border-2 transition-all hover:scale-105 ${
                  selectedColorPreset === color.value
                    ? 'border-white scale-110'
                    : 'border-slate-600 hover:border-slate-500'
                }`}
                style={{ backgroundColor: color.value }}
                title={color.name}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppearanceSection;
