import React from 'react';
import { HotspotData } from '../../shared/types';

interface HotspotViewerProps {
  hotspot: HotspotData;
  isPulsing: boolean; // Timeline event driven pulse
  isEditing: boolean;
  onFocusRequest: (id: string) => void; // Callback to request focus/info display for this hotspot
  isDimmedInEditMode?: boolean;
  isContinuouslyPulsing?: boolean; // For idle mode gentle pulse
}

const HotspotViewer: React.FC<HotspotViewerProps> = ({ 
  hotspot, isPulsing, isEditing, onFocusRequest, isDimmedInEditMode, isContinuouslyPulsing
}) => {
  
  const baseColor = hotspot.color || 'bg-sky-500';
  const hoverColor = hotspot.color ? hotspot.color.replace('500', '400').replace('600','500') : 'bg-sky-400'; // ensure hover works for darker colors too
  
  const timelinePulseClasses = isPulsing ? `animate-ping absolute inline-flex h-full w-full rounded-full ${baseColor} opacity-75` : '';
  const continuousPulseDotClasses = isContinuouslyPulsing ? 'subtle-pulse-animation' : '';

  const dotClasses = `relative inline-flex rounded-full h-4 w-4 sm:h-5 sm:w-5 ${baseColor} group-hover:${hoverColor} transition-colors duration-200 ${continuousPulseDotClasses}`;

  const containerClasses = `absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group ${
    isDimmedInEditMode ? 'opacity-40 hover:opacity-100 focus-within:opacity-100 transition-opacity' : ''
  }`;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); 
    onFocusRequest(hotspot.id);
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      onFocusRequest(hotspot.id);
    }
  };

  return (
    <div
      className={containerClasses}
      style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%` }}
      onClick={handleClick}
      onKeyPress={handleKeyPress}
      role="button"
      aria-label={`Hotspot: ${hotspot.title}`}
      tabIndex={0} // Make it focusable
    >
      <span className={dotClasses} aria-hidden="true">
        {isPulsing && <span className={timelinePulseClasses} aria-hidden="true"></span>}
      </span>
      {/* Info panel rendering is now handled by InteractiveModule using InfoPanel component */}
    </div>
  );
};

export default HotspotViewer;
