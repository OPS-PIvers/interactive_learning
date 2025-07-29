import React from 'react';
import { useMobileToolbar } from '../../hooks/useMobileToolbar';

interface MobileHeaderProps {
  title: string;
  onBack?: () => void;
  rightContent?: React.ReactNode;
  className?: string;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  title,
  onBack,
  rightContent,
  className = ''
}) => {
  const { dimensions, cssVariables, isReady } = useMobileToolbar();
  
  if (!isReady) {
    return null;
  }

  const { headerHeight, isVerySmallScreen } = dimensions;

  return (
    <header
      className={`mobile-header ${className}`}
      style={{
        /* Apply CSS variables for synchronization */
        ...cssVariables,
        /* Fixed positioning at top */
        position: 'fixed',
        top: '0px',
        left: '0px',
        right: '0px',
        width: '100vw',
        zIndex: 998, // Below toolbar but above content
        /* Header styling */
        background: '#1e293b',
        borderBottom: '1px solid #334155',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
        /* Layout */
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        /* Responsive height and padding */
        height: `${headerHeight}px`,
        minHeight: `${headerHeight}px`,
        padding: isVerySmallScreen ? '8px 12px' : '12px 16px',
        paddingTop: `calc(${isVerySmallScreen ? '8px' : '12px'} + env(safe-area-inset-top, 0px))`,
        boxSizing: 'border-box',
        /* Enhanced mobile styling */
        color: 'white',
        fontSize: isVerySmallScreen ? '16px' : '18px',
        fontWeight: '600',
        /* Smooth transitions */
        transition: 'height 0.3s ease, padding 0.3s ease'
      }}
    >
      {/* Left section - Back button */}
      <div className="mobile-header-left">
        {onBack && (
          <button
            onClick={onBack}
            className="mobile-header-back-button"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '44px',
              minHeight: '44px',
              padding: '8px',
              background: 'transparent',
              border: 'none',
              color: 'white',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'background-color 0.2s ease',
              touchAction: 'manipulation'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            aria-label="Go back"
          >
            <svg 
              width={isVerySmallScreen ? '20' : '24'} 
              height={isVerySmallScreen ? '20' : '24'} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
      </div>

      {/* Center section - Title */}
      <div 
        className="mobile-header-title"
        style={{
          flex: 1,
          textAlign: 'center',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          marginLeft: onBack ? '0px' : '16px',
          marginRight: rightContent ? '0px' : '16px'
        }}
      >
        {title}
      </div>

      {/* Right section - Custom content */}
      <div className="mobile-header-right">
        {rightContent}
      </div>
    </header>
  );
};

export default MobileHeader;