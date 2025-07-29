import React from 'react';
import { useMobileToolbar } from '../../hooks/useMobileToolbar';

interface MobileToolbarProps {
  onSlidesOpen: () => void;
  onBackgroundOpen: () => void;
  onInsertOpen: () => void;
  isTimelineVisible: boolean;
  onAspectRatioOpen?: () => void;
  currentAspectRatio?: string;
}

export const MobileToolbar: React.FC<MobileToolbarProps> = ({
  onSlidesOpen,
  onBackgroundOpen,
  onInsertOpen,
  isTimelineVisible,
  onAspectRatioOpen,
  currentAspectRatio = '16:9'
}) => {
  const { dimensions, positioning, cssVariables, isReady } = useMobileToolbar(isTimelineVisible);
  
  if (process.env.NODE_ENV === 'development') {
    console.log('[MobileToolbar] Component called with props:', {
      isTimelineVisible,
      currentAspectRatio,
      hasOnSlidesOpen: !!onSlidesOpen,
      hasOnBackgroundOpen: !!onBackgroundOpen,
      hasOnInsertOpen: !!onInsertOpen,
      timestamp: new Date().toISOString()
    });
    
    console.log('[MobileToolbar] Hook results:', {
      isReady,
      dimensions,
      positioning,
      cssVariables: Object.keys(cssVariables),
      timestamp: new Date().toISOString()
    });
  }
  
  // Don't render until the toolbar system is ready
  if (!isReady) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[MobileToolbar] ❌ Not ready to render - returning null');
    }
    return null;
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('[MobileToolbar] ✅ RENDERING TOOLBAR with styles:', {
      position: 'fixed',
      bottom: positioning.bottom,
      zIndex: Math.max(positioning.zIndex, 9999),
      height: `${dimensions.toolbarHeight}px`,
      background: '#1e293b',
      timestamp: new Date().toISOString()
    });
  }

  const { toolbarHeight, isVerySmallScreen } = dimensions;
  const isExtraSmallScreen = cssVariables['--mobile-extra-small-screen'] === '1';
  const buttonSize = isExtraSmallScreen ? 'p-1.5' : isVerySmallScreen ? 'p-2' : 'p-3';
  const iconSize = isExtraSmallScreen ? 'w-3.5 h-3.5' : isVerySmallScreen ? 'w-4 h-4' : 'w-5 h-5';
  const gap = isExtraSmallScreen ? '8px' : isVerySmallScreen ? '12px' : '16px';
  const padding = isExtraSmallScreen ? '6px 8px' : isVerySmallScreen ? '8px 12px' : '12px 16px';
  const menuItems = [
    {
      id: 'slides',
      label: 'Slides',
      icon: (
        <svg className={iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      onClick: onSlidesOpen,
      color: 'bg-blue-600 hover:bg-blue-700'
    },
    {
      id: 'background',
      label: 'Background',
      icon: (
        <svg className={iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      onClick: onBackgroundOpen,
      color: 'bg-purple-600 hover:bg-purple-700'
    },
    {
      id: 'insert',
      label: 'Insert',
      icon: (
        <svg className={iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      ),
      onClick: onInsertOpen,
      color: 'bg-green-600 hover:bg-green-700'
    },
    ...(onAspectRatioOpen ? [{
      id: 'aspect-ratio',
      label: `Aspect Ratio (${currentAspectRatio})`,
      icon: (
        <svg className={iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16v12H4V6z" />
        </svg>
      ),
      onClick: onAspectRatioOpen,
      color: 'bg-orange-600 hover:bg-orange-700'
    }] : [])
  ];

  return (
    <div
      className={`mobile-toolbar-container ${isTimelineVisible ? 'timeline-visible' : ''}`}
      style={{
        /* Apply CSS variables for synchronization */
        ...cssVariables,
        /* CRITICAL: FORCE fixed positioning with maximum priority - override any CSS classes */
        position: 'fixed !important' as any,
        bottom: '0px !important' as any, // Force bottom positioning regardless of calculations
        left: '0px !important' as any,
        right: '0px !important' as any,
        width: '100vw !important' as any,
        zIndex: '99999 !important' as any, // Maximum z-index to override any conflicting styles
        /* Force positioning relative to viewport, not parent */
        inset: 'auto 0px 0px 0px !important' as any,
        /* Strong background to ensure visibility */
        background: '#1e293b !important' as any,
        borderTop: '1px solid #334155',
        boxShadow: '0 -4px 32px rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(8px)',
        /* Responsive padding with enhanced safe area awareness */
        padding: padding,
        paddingBottom: `max(${isExtraSmallScreen ? '8px' : '12px'}, env(safe-area-inset-bottom, 0px)) !important` as any,
        /* Layout - force flex display with maximum priority */
        display: 'flex !important' as any,
        alignItems: 'center !important' as any,
        justifyContent: 'center !important' as any,
        gap: gap,
        flexDirection: 'row' as const,
        /* Height management - responsive based on screen size */
        height: `${toolbarHeight}px !important` as any,
        minHeight: `${toolbarHeight}px !important` as any,
        maxHeight: `${toolbarHeight}px !important` as any,
        boxSizing: 'border-box',
        /* Ensure visibility with maximum priority */
        visibility: 'visible !important' as any,
        opacity: '1 !important' as any,
        /* Ensure it's not being clipped with maximum priority */
        overflow: 'visible !important' as any,
        /* Remove any transforms that might hide the toolbar */
        transform: 'none !important' as any,
        /* Ensure no parent can hide this */
        pointerEvents: 'auto !important' as any,
        /* Override any potential CSS resets or global styles */
        margin: '0px !important' as any,
        padding: padding,
        boxSizing: 'border-box !important' as any,
        /* Ensure it's positioned relative to viewport */
        position: 'fixed !important' as any, // Duplicate to ensure it overrides everything
      }}
      // Add data attributes for debugging
      data-mobile-toolbar="true"
      data-timeline-visible={isTimelineVisible}
      data-toolbar-height={toolbarHeight}
    >
      {menuItems.map((item) => (
        <button
          key={item.id}
          onClick={item.onClick}
          className={`relative group ${item.color} text-white ${buttonSize} rounded-full transition-all duration-200 hover:scale-110 active:scale-95 shadow-lg`}
          title={item.label}
          aria-label={item.label}
        >
          {item.icon}
          
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            <div className="bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
              {item.label}
            </div>
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-black/80"></div>
          </div>
        </button>
      ))}
    </div>
  );
};

export default MobileToolbar;