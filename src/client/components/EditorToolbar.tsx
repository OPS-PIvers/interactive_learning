import React from 'react';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';

interface ColorScheme {
  name: string;
  colors: string[];
}

interface EditorToolbarProps {
  projectName: string;
  onBack: () => void;
  onReplaceImage: (file: File) => void;
  
  // Auto-progression
  isAutoProgression: boolean;
  onToggleAutoProgression: (enabled: boolean) => void;
  autoProgressionDuration: number;
  onAutoProgressionDurationChange: (duration: number) => void;
  
  // Zoom controls
  currentZoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onCenter: () => void;
  
  // Color schemes
  currentColorScheme: string;
  onColorSchemeChange: (schemeName: string) => void;
  
  // Save
  onSave: () => void;
  isSaving: boolean;
  showSuccessMessage: boolean;
}

const COLOR_SCHEMES: ColorScheme[] = [
  {
    name: 'Default',
    colors: ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500']
  },
  {
    name: 'Professional', 
    colors: ['bg-slate-700', 'bg-teal-600', 'bg-gray-600', 'bg-blue-700', 'bg-slate-800']
  },
  {
    name: 'Warm',
    colors: ['bg-orange-500', 'bg-amber-500', 'bg-red-600', 'bg-yellow-600', 'bg-orange-600']
  },
  {
    name: 'Cool',
    colors: ['bg-sky-500', 'bg-cyan-500', 'bg-blue-600', 'bg-indigo-500', 'bg-teal-500']
  },
  {
    name: 'High Contrast',
    colors: ['bg-black', 'bg-white', 'bg-red-600', 'bg-yellow-400', 'bg-blue-600']
  }
];

const EditorToolbar: React.FC<EditorToolbarProps> = ({
  projectName,
  onBack,
  onReplaceImage,
  isAutoProgression,
  onToggleAutoProgression,
  autoProgressionDuration,
  onAutoProgressionDurationChange,
  currentZoom,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onCenter,
  currentColorScheme,
  onColorSchemeChange,
  onSave,
  isSaving,
  showSuccessMessage
}) => {
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      onReplaceImage(event.target.files[0]);
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 bg-slate-800 border-b border-slate-700 z-50 h-14">
      <div className="flex items-center justify-between h-full px-4">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
          >
            <ChevronLeftIcon className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </button>
          
          <div className="h-6 w-px bg-slate-600" />
          
          <h1 className="text-lg font-semibold text-white truncate max-w-48">
            {projectName}
          </h1>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* Replace Image */}
          <div className="flex items-center gap-2">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              id="toolbar-image-upload"
            />
            <label
              htmlFor="toolbar-image-upload"
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-sm font-medium cursor-pointer transition-colors"
            >
              Replace Image
            </label>
          </div>

          <div className="h-6 w-px bg-slate-600" />

          {/* Auto-progression */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={isAutoProgression}
                onChange={(e) => onToggleAutoProgression(e.target.checked)}
                className="rounded"
              />
              Auto-progress
            </label>
            {isAutoProgression && (
              <select
                value={autoProgressionDuration}
                onChange={(e) => onAutoProgressionDurationChange(Number(e.target.value))}
                className="bg-slate-700 text-slate-200 text-sm px-2 py-1 rounded border border-slate-600"
              >
                <option value={2000}>2s</option>
                <option value={3000}>3s</option>
                <option value={5000}>5s</option>
                <option value={10000}>10s</option>
              </select>
            )}
          </div>

          <div className="h-6 w-px bg-slate-600" />

          {/* Zoom Controls */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-300">Zoom: {Math.round(currentZoom * 100)}%</span>
            <button
              onClick={onZoomOut}
              className="bg-slate-700 hover:bg-slate-600 text-slate-200 px-2 py-1 rounded"
            >
              −
            </button>
            <button
              onClick={onZoomIn}
              className="bg-slate-700 hover:bg-slate-600 text-slate-200 px-2 py-1 rounded"
            >
              +
            </button>
            <button
              onClick={onZoomReset}
              className="bg-slate-700 hover:bg-slate-600 text-slate-200 px-2 py-1 rounded text-xs"
            >
              Reset
            </button>
            <button
              onClick={onCenter}
              className="bg-slate-700 hover:bg-slate-600 text-slate-200 px-2 py-1 rounded text-xs"
            >
              Center
            </button>
          </div>

          <div className="h-6 w-px bg-slate-600" />

          {/* Color Schemes */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-300">Colors:</span>
            <div className="relative">
              <select
                value={currentColorScheme}
                onChange={(e) => onColorSchemeChange(e.target.value)}
                className="bg-slate-700 text-slate-200 text-sm px-2 py-1 rounded border border-slate-600 pr-8"
              >
                {COLOR_SCHEMES.map(scheme => (
                  <option key={scheme.name} value={scheme.name}>
                    {scheme.name}
                  </option>
                ))}
              </select>
              {/* Color preview dots */}
              <div className="absolute right-8 top-1/2 transform -translate-y-1/2 flex gap-0.5 pointer-events-none">
                {COLOR_SCHEMES.find(s => s.name === currentColorScheme)?.colors.map((color, i) => (
                  <div key={i} className={`w-2 h-2 rounded-full ${color}`} />
                ))}
              </div>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-600" />

          {/* Save Button */}
          <button
            onClick={onSave}
            disabled={isSaving}
            className={`font-semibold py-1.5 px-4 rounded shadow-md transition-all duration-200 flex items-center space-x-2 ${
              isSaving 
                ? 'bg-green-500 cursor-not-allowed' 
                : showSuccessMessage 
                  ? 'bg-green-500' 
                  : 'bg-green-600 hover:bg-green-700'
            } text-white`}
          >
            {isSaving ? (
              <>
                <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                <span>Saving...</span>
              </>
            ) : showSuccessMessage ? (
              <>
                <span>✓</span>
                <span>Saved!</span>
              </>
            ) : (
              <span>Save</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export { COLOR_SCHEMES };
export default EditorToolbar;