import React from 'react';

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
  // Simple responsive sizing without complex hooks
  const buttonSize = 'p-3';
  const iconSize = 'w-5 h-5';
  const gap = '16px';
  const padding = '12px 16px';
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
      className="flex items-center justify-center bg-slate-800 text-white"
      style={{
        padding: padding,
        paddingBottom: `max(12px, env(safe-area-inset-bottom, 0px))`,
        gap: gap,
        height: '56px',
        minHeight: '56px'
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