/**
 * Responsive Toolbar Component
 * 
 * Unified toolbar that adapts between desktop and mobile presentations.
 * Uses UniversalMobileToolbar as foundation with desktop enhancements.
 */

import React from 'react';
import { DeviceType } from '../../../shared/slideTypes';
import { useIsMobile } from '../../hooks/useIsMobile';
import { UniversalMobileToolbar } from '../mobile/UniversalMobileToolbar';
import { MobileEditorToolbarContent } from '../mobile/MobileEditorToolbarContent';

export interface ResponsiveToolbarProps {
  onSlidesOpen: () => void;
  onBackgroundOpen: () => void;
  onInsertOpen: () => void;
  onAspectRatioOpen: () => void;
  deviceType: DeviceType;
  onDeviceTypeChange: (deviceType: DeviceType | null) => void;
}

/**
 * ResponsiveToolbar - Adaptive toolbar supporting both desktop and mobile layouts
 */
export const ResponsiveToolbar: React.FC<ResponsiveToolbarProps> = ({
  onSlidesOpen,
  onBackgroundOpen,
  onInsertOpen,
  onAspectRatioOpen,
  deviceType,
  onDeviceTypeChange,
}) => {
  const isMobile = useIsMobile();
  
  if (isMobile) {
    // Use mobile toolbar foundation
    return (
      <UniversalMobileToolbar>
        <MobileEditorToolbarContent
          onSlidesOpen={onSlidesOpen}
          onBackgroundOpen={onBackgroundOpen}
          onInsertOpen={onInsertOpen}
          onAspectRatioOpen={onAspectRatioOpen}
          deviceType={deviceType}
          onDeviceTypeChange={onDeviceTypeChange}
        />
      </UniversalMobileToolbar>
    );
  }
  
  // Desktop toolbar layout
  return (
    <div className="bg-slate-800 border-t border-slate-700 p-4">
      <div className="flex items-center justify-between">
        {/* Left section - Main actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={onSlidesOpen}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span>Slides</span>
          </button>
          
          <button
            onClick={onBackgroundOpen}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>Background</span>
          </button>
          
          <button
            onClick={onInsertOpen}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Insert Element</span>
          </button>
          
          <button
            onClick={onAspectRatioOpen}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
            <span>Aspect Ratio</span>
          </button>
        </div>
        
        {/* Right section - Device type selector */}
        <div className="flex items-center gap-3">
          <span className="text-slate-400 text-sm">Preview for:</span>
          <div className="flex items-center bg-slate-700 rounded-lg p-1">
            <button
              onClick={() => onDeviceTypeChange('desktop')}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                deviceType === 'desktop'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Desktop
            </button>
            <button
              onClick={() => onDeviceTypeChange('tablet')}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                deviceType === 'tablet'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Tablet
            </button>
            <button
              onClick={() => onDeviceTypeChange('mobile')}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                deviceType === 'mobile'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Mobile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResponsiveToolbar;