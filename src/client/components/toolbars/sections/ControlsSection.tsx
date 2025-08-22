import React from 'react';
import ToolbarButton from '../shared/ToolbarButton';

interface ControlsSectionProps {
  currentZoom?: number;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onZoomReset?: () => void;
  onCenter?: () => void;
}

const ControlsSection: React.FC<ControlsSectionProps> = ({
  currentZoom,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onCenter,
}) => {
  if (currentZoom === undefined || !onZoomIn || !onZoomOut || !onZoomReset || !onCenter) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-medium text-white">Zoom Controls</h3>
      <div className="bg-slate-800/50 rounded-lg p-4 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-300">
            Current Zoom: {Math.round(currentZoom * 100)}%
          </span>
        </div>

        <div className="flex items-center gap-3">
          <ToolbarButton onClick={onZoomOut}>
            Zoom Out
          </ToolbarButton>
          <ToolbarButton onClick={onZoomIn}>
            Zoom In
          </ToolbarButton>
          <ToolbarButton onClick={onZoomReset}>
            Reset
          </ToolbarButton>
          <ToolbarButton onClick={onCenter}>
            Center
          </ToolbarButton>
        </div>
      </div>
    </div>
  );
};

export default ControlsSection;
