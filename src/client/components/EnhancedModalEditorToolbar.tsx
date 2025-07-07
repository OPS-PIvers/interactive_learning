import React, { useState } from 'react';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { XMarkIcon } from './icons/XMarkIcon';

interface ColorScheme {
  name: string;
  colors: string[];
}

interface ColorPreset {
  name: string;
  value: string;
}

interface EnhancedModalEditorToolbarProps {
  isOpen: boolean;
  onClose: () => void;
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

  // Viewer Modes
  viewerModes: {
    explore?: boolean;
    selfPaced?: boolean;
    timed?: boolean;
  };
  onViewerModeChange: (mode: 'explore' | 'selfPaced' | 'timed', enabled: boolean) => void;
  
  // Save
  onSave: () => void;
  isSaving: boolean;
  showSuccessMessage: boolean;
  isMobile?: boolean;
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

const COLOR_PRESETS: ColorPreset[] = [
  { name: 'Red', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Slate', value: '#64748b' },
  { name: 'Gray', value: '#6b7280' },
];

const EnhancedModalEditorToolbar: React.FC<EnhancedModalEditorToolbarProps> = ({
  isOpen,
  onClose,
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
  viewerModes,
  onViewerModeChange,
  onSave,
  isSaving,
  showSuccessMessage,
  isMobile = false
}) => {
  const [activeTab, setActiveTab] = useState('general');
  const [selectedColorPreset, setSelectedColorPreset] = useState('#ef4444');

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      onReplaceImage(event.target.files[0]);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Modal Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-70 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Modal Content */}
        <div 
          className={`bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-4xl w-full overflow-hidden ${
            isMobile 
              ? 'h-full max-h-none flex flex-col' 
              : 'max-h-[90vh]'
          }`}
          style={isMobile ? {
            maxHeight: 'calc(100vh - env(keyboard-inset-height, 0px) - 2rem)'
          } : {}}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <ChevronLeftIcon className="w-5 h-5" />
                <span className="font-medium">Back</span>
              </button>
              
              <div className="h-6 w-px bg-slate-300 dark:bg-slate-600" />
              
              <div>
                <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
                  Editor Settings
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {projectName}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Close settings"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="border-b border-slate-200 dark:border-slate-700">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {[
                { id: 'general', name: 'General', icon: null },
                { id: 'appearance', name: 'Appearance', icon: null },
                { id: 'controls', name: 'Controls', icon: null },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                  }`}
                >
                  {tab.icon && <span>{tab.icon}</span>}
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Mobile Zoom Controls Bar */}
          {isMobile && (
            <div className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Zoom: {Math.round(currentZoom * 100)}%
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={onZoomOut}
                    className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors text-sm font-medium"
                  >
                    −
                  </button>
                  <button
                    onClick={onZoomReset}
                    className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors text-sm font-medium"
                  >
                    Reset
                  </button>
                  <button
                    onClick={onZoomIn}
                    className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors text-sm font-medium"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab Content */}
          <div className={`p-6 overflow-y-auto ${
            isMobile 
              ? 'flex-1 min-h-0' 
              : 'max-h-[60vh]'
          }`}
          style={isMobile ? {
            maxHeight: 'calc(100vh - env(keyboard-inset-height, 0px) - 20rem)'
          } : {}}>
            {/* General Tab */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                {/* Image Settings */}
                <div className="space-y-3">
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white">Image Settings</h3>
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Background Image
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="enhanced-image-upload"
                    />
                    <label
                      htmlFor="enhanced-image-upload"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 cursor-pointer transition-colors"
                    >
                      Replace Image
                    </label>
                  </div>
                </div>

                {/* Auto-progression */}
                <div className="space-y-3">
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white">Auto-progression</h3>
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isAutoProgression}
                          onChange={(e) => onToggleAutoProgression(e.target.checked)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Enable auto-progression
                        </span>
                      </label>
                    </div>
                    
                    {isAutoProgression && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Duration: {autoProgressionDuration / 1000}s
                        </label>
                        <div className="flex items-center gap-4">
                          <input
                            type="range"
                            min="2000"
                            max="10000"
                            step="1000"
                            value={autoProgressionDuration}
                            onChange={(e) => onAutoProgressionDurationChange(Number(e.target.value))}
                            className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700"
                          />
                          <select
                            value={autoProgressionDuration}
                            onChange={(e) => onAutoProgressionDurationChange(Number(e.target.value))}
                            className="px-3 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                          >
                            <option value={2000}>2s</option>
                            <option value={3000}>3s</option>
                            <option value={5000}>5s</option>
                            <option value={10000}>10s</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Viewer Modes */}
                <div className="space-y-3">
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white">Viewer Modes</h3>
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 space-y-4">
                    {['explore', 'selfPaced', 'timed'].map((mode) => (
                      <div key={mode} className="flex items-center justify-between">
                        <label className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={viewerModes[mode as keyof typeof viewerModes] ?? false}
                            onChange={(e) => onViewerModeChange(mode as 'explore' | 'selfPaced' | 'timed', e.target.checked)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300 capitalize">
                            {mode.replace(/([A-Z])/g, ' $1')} Mode
                          </span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Appearance Tab */}
            {activeTab === 'appearance' && (
              <div className="space-y-6">
                {/* Color Schemes */}
                <div className="space-y-3">
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white">Color Schemes</h3>
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Theme
                      </label>
                      <select
                        value={currentColorScheme}
                        onChange={(e) => onColorSchemeChange(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
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
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Preview
                      </label>
                      <div className="flex gap-2">
                        {COLOR_SCHEMES.find(s => s.name === currentColorScheme)?.colors.map((color, i) => (
                          <div key={i} className={`w-8 h-8 rounded-lg ${color} border-2 border-slate-300 dark:border-slate-600`} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Color Presets */}
                <div className="space-y-3">
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white">Hotspot Colors</h3>
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                      Quick Color Selection
                    </label>
                    <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
                      {COLOR_PRESETS.map((color) => (
                        <button
                          key={color.value}
                          onClick={() => setSelectedColorPreset(color.value)}
                          className={`w-10 h-10 rounded-lg border-2 transition-all hover:scale-105 ${
                            selectedColorPreset === color.value 
                              ? 'border-slate-900 dark:border-white scale-110' 
                              : 'border-slate-300 dark:border-slate-600 hover:border-slate-500'
                          }`}
                          style={{ backgroundColor: color.value }}
                          title={color.name}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Controls Tab */}
            {activeTab === 'controls' && (
              <div className="space-y-6">
                {/* Zoom Controls */}
                <div className="space-y-3">
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white">Zoom Controls</h3>
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Current Zoom: {Math.round(currentZoom * 100)}%
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <button
                        onClick={onZoomOut}
                        className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-md transition-colors font-medium"
                      >
                        Zoom Out
                      </button>
                      <button
                        onClick={onZoomIn}
                        className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-md transition-colors font-medium"
                      >
                        Zoom In
                      </button>
                      <button
                        onClick={onZoomReset}
                        className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-md transition-colors font-medium"
                      >
                        Reset
                      </button>
                      <button
                        onClick={onCenter}
                        className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-md transition-colors font-medium"
                      >
                        Center
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-between p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
            >
              Close
            </button>
            <div className="flex items-center gap-3">
              <button
                onClick={onSave}
                disabled={isSaving}
                className={`inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm transition-all duration-200 ${
                  isSaving 
                    ? 'bg-green-500 cursor-not-allowed' 
                    : showSuccessMessage 
                      ? 'bg-green-500' 
                      : 'bg-blue-600 hover:bg-blue-700'
                } text-white`}
              >
                {isSaving ? (
                  <>
                    <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                    Saving...
                  </>
                ) : showSuccessMessage ? (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Saved!
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export { COLOR_SCHEMES };
export default EnhancedModalEditorToolbar;