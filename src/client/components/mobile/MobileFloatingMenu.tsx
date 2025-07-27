import React from 'react';

interface MobileFloatingMenuProps {
  onSlidesOpen: () => void;
  onBackgroundOpen: () => void;
  onInsertOpen: () => void;
  isTimelineVisible: boolean;
}

/**
 * MobileFloatingMenu - Floating action menu for mobile slide editor
 * 
 * Provides quick access to:
 * - Slides management (replaces side panel)
 * - Background settings (replaces background controls)
 * - Insert element options (replaces insert toolbar)
 */
export const MobileFloatingMenu: React.FC<MobileFloatingMenuProps> = ({
  onSlidesOpen,
  onBackgroundOpen,
  onInsertOpen,
  isTimelineVisible
}) => {
  const menuItems = [
    {
      id: 'slides',
      label: 'Slides',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      ),
      onClick: onInsertOpen,
      color: 'bg-green-600 hover:bg-green-700'
    }
  ];

  return (
    <div 
      className={`mobile-floating-menu ${
        isTimelineVisible ? 'timeline-visible' : ''
      }`}
      style={{
        position: 'fixed', // Changed from absolute to fixed for iOS Safari
        bottom: `max(${isTimelineVisible ? '72px' : '16px'}, calc(env(safe-area-inset-bottom, 0px) + 8px))`, // Safe area aware
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 100, // Increased z-index to stay above iOS Safari UI
        background: 'rgba(30, 41, 59, 0.95)',
        backdropFilter: 'blur(8px)',
        borderRadius: '24px',
        padding: '8px 16px',
        display: 'flex',
        gap: '12px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        transition: 'bottom 0.3s ease',
        /* Prevent iOS Safari from hiding the menu behind browser UI */
        marginBottom: 'env(safe-area-inset-bottom, 0px)'
      }}
    >
      {menuItems.map((item) => (
        <button
          key={item.id}
          onClick={item.onClick}
          className={`relative group ${item.color} text-white p-3 rounded-full transition-all duration-200 hover:scale-110 active:scale-95 shadow-lg`}
          title={item.label}
          aria-label={item.label}
        >
          {item.icon}
          
          {/* Tooltip */}
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

export default MobileFloatingMenu;