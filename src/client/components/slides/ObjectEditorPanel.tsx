/**
 * Object Editor Panel
 * 
 * Unified object editor panel that automatically adapts to different screen sizes using responsive CSS.
 * Handles editing for text, shape, and media elements (hotspots use specialized HotspotEditorModal).
 * No device detection or conditional rendering - uses CSS-only responsive design.
 */

import React from 'react';
import { UnifiedObjectEditorProps } from '../shared/BasePropertiesPanel';
import UnifiedObjectEditor from '../UnifiedObjectEditor';

/**
 * Object Editor Panel - unified responsive component for non-hotspot elements
 */
export const ObjectEditorPanel: React.FC<UnifiedObjectEditorProps> = (props) => {
  if (!props.selectedElement || !props.currentSlide) {
    return null;
  }
  return (
    <UnifiedObjectEditor
      selectedElement={props.selectedElement}
      currentSlide={props.currentSlide}
      onElementUpdate={props.onElementUpdate}
      {...(props.onSlideUpdate && { onSlideUpdate: props.onSlideUpdate })}
      {...(props.onDelete && { onDelete: props.onDelete })}
      {...(props.onClose && { onClose: props.onClose })}
      {...(props.className && { className: props.className })}
      {...(props.style && { style: props.style })}
    />
  );
};

// Legacy exports for backward compatibility - these are now no-ops
export const useObjectEditorPanel = () => ({
  mode: 'unified',
  shouldUseMobileLayout: false,
  shouldUseDesktopFeatures: false,
  breakpoint: 'responsive'
});

export const ObjectEditorPanelModeSelector: React.FC<{
  currentMode: string;
  onModeChange: (mode: string) => void;
}> = () => {
  // No longer needed - component is fully responsive
  return null;
};

export default ObjectEditorPanel;