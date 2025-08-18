/**
 * Responsive Toolbar Component
 * 
 * Truly unified toolbar that adapts using responsive CSS and viewport-based logic.
 * Progressive enhancement from mobile-first foundation to desktop features.
 */

import React from 'react';
import { Z_INDEX_TAILWIND } from '../../utils/zIndexLevels';

export interface ResponsiveToolbarProps {
  onSlidesOpen: () => void;
  onBackgroundOpen: () => void;
  onInsertOpen: () => void;
  onAspectRatioOpen: () => void;
  onPropertiesOpen?: () => void;
  hasSelectedElement?: boolean;
}

/**
 * ResponsiveToolbar - Truly unified toolbar with responsive behavior
 */
export const ResponsiveToolbar: React.FC<ResponsiveToolbarProps> = ({
  onSlidesOpen,
  onBackgroundOpen,
  onInsertOpen,
  onAspectRatioOpen,
  onPropertiesOpen,
  hasSelectedElement = false,
}) => {
  return (
    <div role="toolbar" className={`bg-slate-800 border-t border-slate-700 p-2 sm:p-4 flex-shrink-0 ${Z_INDEX_TAILWIND.TOOLBAR}`}>
      <div className="flex items-center justify-center gap-2">
        {/* Left section - Main actions */}
        <div className="flex items-center gap-1 sm:gap-3 flex-wrap">
          <button
            onClick={onSlidesOpen}
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-xs sm:text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span className="hidden sm:inline">Slides</span>
          </button>
          
          <button
            onClick={onBackgroundOpen}
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-xs sm:text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="hidden sm:inline">Background</span>
          </button>
          
          <button
            onClick={onInsertOpen}
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-xs sm:text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span className="hidden sm:inline">Insert</span>
          </button>
          
          <button
            onClick={onAspectRatioOpen}
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-xs sm:text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
            <span className="hidden sm:inline">Ratio</span>
          </button>
          
          {/* Properties button - only shown when element is selected */}
          {hasSelectedElement && onPropertiesOpen && (
            <button
              onClick={onPropertiesOpen}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-xs sm:text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="hidden sm:inline">Properties</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResponsiveToolbar;