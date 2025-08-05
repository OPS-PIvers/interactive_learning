/**
 * Properties Panel
 * 
 * Unified properties panel that automatically adapts to different screen sizes using responsive CSS.
 * No device detection or conditional rendering - uses CSS-only responsive design.
 */

import React from 'react';
import { UnifiedPropertiesPanelProps } from '../shared/BasePropertiesPanel';
import UnifiedPropertiesPanel from '../UnifiedPropertiesPanel';

/**
 * Properties Panel - unified responsive component
 */
export const ResponsivePropertiesPanel: React.FC<UnifiedPropertiesPanelProps> = (props) => {
  if (!props.selectedElement || !props.currentSlide) {
    return null;
  }
  return (
    <UnifiedPropertiesPanel
      selectedElement={props.selectedElement}
      currentSlide={props.currentSlide}
      deviceType={props.deviceType}
      onElementUpdate={props.onElementUpdate}
      onSlideUpdate={props.onSlideUpdate}
      onDelete={props.onDelete}
      onClose={props.onClose}
      className={props.className}
      style={props.style}
    />
  );
};

// Legacy exports for backward compatibility - these are now no-ops
export const useResponsivePropertiesPanel = () => ({
  mode: 'unified',
  shouldUseMobileLayout: false,
  shouldUseDesktopFeatures: false,
  breakpoint: 'responsive'
});

export const PropertiesPanelModeSelector: React.FC<{
  currentMode: any;
  onModeChange: (mode: any) => void;
}> = () => {
  // No longer needed - component is fully responsive
  return null;
};

export default ResponsivePropertiesPanel;