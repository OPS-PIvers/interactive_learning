/**
 * Responsive Properties Panel
 * 
 * Unified properties panel that adapts between mobile and desktop modes based on device detection.
 * Uses the mobile editor implementation as the foundation with desktop enhancements.
 */

import React, { useMemo } from 'react';
import { useDeviceDetection } from '../../hooks/useDeviceDetection';
import { UnifiedPropertiesPanelProps, PROPERTIES_PANEL_BREAKPOINTS } from '../shared/BasePropertiesPanel';
import { MobilePropertiesPanel } from './MobilePropertiesPanel';
import EnhancedPropertiesPanel from '../EnhancedPropertiesPanel';

/**
 * Responsive Properties Panel that switches between mobile and desktop implementations
 */
export const ResponsivePropertiesPanel: React.FC<UnifiedPropertiesPanelProps> = ({
  mode = 'auto',
  forceMobile,
  className,
  style,
  ...props
}) => {
  const { isMobile } = useDeviceDetection();
  
  // Determine which mode to use based on configuration and device detection
  const effectiveMode = useMemo(() => {
    if (forceMobile) return 'mobile';
    
    switch (mode) {
      case 'mobile':
        return 'mobile';
      case 'desktop':
        return 'desktop';
      case 'auto':
      default:
        return isMobile ? 'mobile' : 'desktop';
    }
  }, [mode, forceMobile, isMobile]);
  
  // Render mobile implementation
  if (effectiveMode === 'mobile') {
    return (
      <MobilePropertiesPanel
        selectedElement={props.selectedElement}
        deviceType={props.deviceType}
        onElementUpdate={props.onElementUpdate}
        onDelete={props.onDelete || (() => {})}
        onClose={props.onClose || (() => {})}
      />
    );
  }
  
  // Render desktop implementation
  return (
    <div className={className} style={style}>
      <EnhancedPropertiesPanel
        selectedElement={props.selectedElement}
        currentSlide={props.currentSlide}
        deviceType={props.deviceType}
        onElementUpdate={props.onElementUpdate}
        onSlideUpdate={props.onSlideUpdate}
        isMobile={isMobile}
      />
    </div>
  );
};

/**
 * Hook for responsive properties panel configuration
 */
export const useResponsivePropertiesPanel = (
  userMode: 'mobile' | 'desktop' | 'auto' = 'auto',
  forceMobile?: boolean
) => {
  const { isMobile } = useDeviceDetection();
  
  return useMemo(() => {
    const effectiveMode = forceMobile ? 'mobile' : 
      userMode === 'auto' ? (isMobile ? 'mobile' : 'desktop') : userMode;
    
    return {
      mode: effectiveMode,
      isMobile,
      shouldUseMobileLayout: effectiveMode === 'mobile',
      shouldUseDesktopFeatures: effectiveMode === 'desktop',
      breakpoint: window.innerWidth < PROPERTIES_PANEL_BREAKPOINTS.MOBILE_THRESHOLD ? 'mobile' : 'desktop',
    };
  }, [userMode, forceMobile, isMobile]);
};

/**
 * Utility component for testing different panel modes
 */
export const PropertiesPanelModeSelector: React.FC<{
  currentMode: 'mobile' | 'desktop' | 'auto';
  onModeChange: (mode: 'mobile' | 'desktop' | 'auto') => void;
}> = ({ currentMode, onModeChange }) => {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }
  
  return (
    <div className="fixed top-4 right-4 z-[11000] bg-black/80 text-white p-2 rounded-lg text-xs">
      <div className="mb-2">Properties Panel Mode:</div>
      <select 
        value={currentMode} 
        onChange={(e) => onModeChange(e.target.value as any)}
        className="bg-slate-700 text-white text-xs p-1 rounded"
      >
        <option value="auto">Auto</option>
        <option value="mobile">Mobile</option>
        <option value="desktop">Desktop</option>
      </select>
    </div>
  );
};

export default ResponsivePropertiesPanel;