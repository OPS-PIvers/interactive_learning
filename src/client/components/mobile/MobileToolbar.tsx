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
  
  // Don't render until the toolbar system is ready
  if (!isReady) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[MobileToolbar] Not ready to render:', {
        isReady,
        dimensions,
        positioning,
        timestamp: new Date().toISOString()
      });
    }
    return null;
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('[MobileToolbar] Rendering toolbar:', {
      isReady,
      isTimelineVisible,
      toolbarHeight: dimensions.toolbarHeight,
      zIndex: positioning.zIndex,
      bottom: positioning.bottom,
      timestamp: new Date().toISOString()
    });
  }

  const { toolbarHeight, isVerySmallScreen } = dimensions;
  const buttonSize = isVerySmallScreen ? 'p-2' : 'p-3';
  const iconSize = isVerySmallScreen ? 'w-4 h-4' : 'w-5 h-5';
  const gap = isVerySmallScreen ? '12px' : '16px';
  const padding = isVerySmallScreen ? '8px 12px' : '12px 16px';
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
      className={`mobile-toolbar ${isTimelineVisible ? 'timeline-visible' : ''}`}
      style={{
        /* Apply CSS variables for synchronization */
        ...cssVariables,
        /* FORCE fixed positioning over all content with enhanced positioning */
        position: 'fixed',
        bottom: positioning.bottom,
        left: '0px',
        right: '0px',
        width: '100vw',
        zIndex: Math.max(positioning.zIndex, 9999), // Ensure it's above everything
        /* Strong background to ensure visibility */
        background: '#1e293b',
        borderTop: '1px solid #334155',
        boxShadow: '0 -4px 32px rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(8px)',
        /* Responsive padding with enhanced safe area awareness */
        padding: padding,
        paddingBottom: positioning.paddingBottom,
        /* Layout - force flex display */
        display: 'flex !important' as any,
        alignItems: 'center',
        justifyContent: 'center',
        gap: gap,
        flexDirection: 'row' as const,
        /* Height management - responsive based on screen size */
        height: `${toolbarHeight}px`,
        minHeight: `${toolbarHeight}px`,
        maxHeight: `${toolbarHeight}px`,
        boxSizing: 'border-box',
        /* Ensure visibility with iOS Safari compensation */
        visibility: 'visible !important' as any,
        opacity: '1 !important' as any,
        /* Force display */
        display: 'flex !important' as any,
        /* Apply iOS Safari UI compensation transform */
        transform: positioning.transform,
        /* Ensure it's not being clipped */
        overflow: 'visible',
        /* Enhanced transition for smooth repositioning */
        transition: 'transform 0.3s ease, bottom 0.3s ease',
        /* Additional fallback positioning */
        inset: 'auto 0 0 0' as any
      }}
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