/**
 * Object Editor Panel
 * 
 * Unified object editor panel that automatically adapts to different screen sizes using responsive CSS.
 * Handles editing for text, shape, and media elements (hotspots use specialized HotspotEditorModal).
 * No device detection or conditional rendering - uses CSS-only responsive design.
 */

import React from 'react';
import { UnifiedObjectEditorProps } from '../shared/BasePropertiesPanel';
// UnifiedObjectEditor removed - legacy component no longer used

/**
 * Object Editor Panel - unified responsive component for non-hotspot elements
 */
export const ObjectEditorPanel: React.FC<UnifiedObjectEditorProps> = (props) => {
  if (!props.selectedElement || !props.currentSlide) {
    return null;
  }
  return (
    <div className="p-4 bg-gray-100 rounded">
      <p className="text-gray-600">Legacy object editor removed. Use SimpleSlideEditor for slide editing.</p>
    </div>
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