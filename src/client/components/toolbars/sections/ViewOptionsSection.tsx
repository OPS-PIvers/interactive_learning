import React from 'react';

interface ViewOptionsSectionProps {
  isAutoProgression: boolean;
  onToggleAutoProgression: (enabled: boolean) => void;
  autoProgressionDuration: number;
  onAutoProgressionDurationChange: (duration: number) => void;
  viewerModes: {
    explore?: boolean;
    selfPaced?: boolean;
    timed?: boolean;
  };
  onViewerModeChange: (mode: 'explore' | 'selfPaced' | 'timed', enabled: boolean) => void;
}

const ViewOptionsSection: React.FC<ViewOptionsSectionProps> = ({
  isAutoProgression,
  onToggleAutoProgression,
  autoProgressionDuration,
  onAutoProgressionDurationChange,
  viewerModes,
  onViewerModeChange,
}) => {
  return (
    <div className="space-y-6">
      {/* Auto-progression */}
      <div className="space-y-3">
        <h3 className="text-lg font-medium text-white">Auto-progression</h3>
        <div className="bg-slate-800/50 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={isAutoProgression}
                onChange={(e) => onToggleAutoProgression(e.target.checked)}
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <span className="text-sm font-medium text-slate-300">
                Enable auto-progression
              </span>
            </label>
          </div>

          {isAutoProgression && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
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
                  className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                />
                <select
                  value={autoProgressionDuration}
                  onChange={(e) => onAutoProgressionDurationChange(Number(e.target.value))}
                  className="px-3 py-1 text-sm border border-slate-600 rounded-md bg-slate-800 text-slate-100"
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
        <h3 className="text-lg font-medium text-white">Viewer Modes</h3>
        <div className="bg-slate-800/50 rounded-lg p-4 space-y-4">
          {['explore', 'selfPaced', 'timed'].map((mode) => (
            <div key={mode} className="flex items-center justify-between">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={viewerModes[mode as keyof typeof viewerModes] ?? false}
                  onChange={(e) => onViewerModeChange(mode as 'explore' | 'selfPaced' | 'timed', e.target.checked)}
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <span className="text-sm font-medium text-slate-300 capitalize">
                  {mode.replace(/([A-Z])/g, ' $1')} Mode
                </span>
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ViewOptionsSection;
