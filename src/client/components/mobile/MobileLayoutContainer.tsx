import React from 'react';
import { useMobileToolbar, useContentAreaHeight } from '../../hooks/useMobileToolbar';

interface MobileLayoutContainerProps {
  children: React.ReactNode;
  isTimelineVisible?: boolean;
  className?: string;
  enableScrolling?: boolean;
}

/**
 * Mobile layout container that automatically handles:
 * - Header height offset
 * - Toolbar height offset  
 * - Timeline height offset
 * - iOS Safari safe areas
 * - Content area calculations
 */
export const MobileLayoutContainer: React.FC<MobileLayoutContainerProps> = ({
  children,
  isTimelineVisible = false,
  className = '',
  enableScrolling = true
}) => {
  const { dimensions, cssVariables, isReady } = useMobileToolbar(isTimelineVisible);
  const { contentHeight, maxHeight } = useContentAreaHeight(isTimelineVisible);

  if (!isReady) {
    return (
      <div 
        className="mobile-layout-loading"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          color: 'white'
        }}
      >
        Loading...
      </div>
    );
  }

  return (
    <div
      className={`mobile-layout-container ${className}`}
      style={{
        /* Apply CSS variables for synchronization */
        ...cssVariables,
        /* Layout positioning */
        position: 'relative',
        width: '100%',
        minHeight: '100vh',
        /* Account for header at the top */
        paddingTop: `${dimensions.headerHeight}px`,
        /* Account for toolbar and timeline at the bottom */
        paddingBottom: `calc(${dimensions.toolbarHeight}px + ${dimensions.timelineOffset}px + env(safe-area-inset-bottom, 0px))`,
        /* Safe area adjustments */
        paddingLeft: 'env(safe-area-inset-left, 0px)',
        paddingRight: 'env(safe-area-inset-right, 0px)',
        /* Background */
        background: '#0f172a',
        /* Box model */
        boxSizing: 'border-box',
        /* Scrolling behavior */
        overflow: enableScrolling ? 'auto' : 'hidden',
        /* Content height management */
        maxHeight: '100vh',
        /* Smooth transitions */
        transition: 'padding 0.3s ease'
      }}
    >
      <div
        className="mobile-layout-content"
        style={{
          width: '100%',
          minHeight: `${contentHeight}px`,
          maxHeight: enableScrolling ? 'none' : maxHeight,
          overflow: enableScrolling ? 'visible' : 'hidden',
          position: 'relative'
        }}
      >
        {children}
      </div>
    </div>
  );
};

/**
 * Specialized content area for slide editor
 */
export const MobileEditorContentArea: React.FC<{
  children: React.ReactNode;
  isTimelineVisible?: boolean;
}> = ({ children, isTimelineVisible = false }) => {
  const { contentHeight } = useContentAreaHeight(isTimelineVisible);

  return (
    <div
      className="mobile-editor-content-area"
      style={{
        width: '100%',
        height: `${contentHeight}px`,
        maxHeight: `${contentHeight}px`,
        overflow: 'hidden',
        position: 'relative',
        /* Touch handling for editor */
        touchAction: 'none',
        WebkitUserSelect: 'none',
        userSelect: 'none',
        /* Background for editor */
        background: '#1e293b'
      }}
    >
      {children}
    </div>
  );
};

export default MobileLayoutContainer;