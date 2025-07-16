import React from 'react';

// Define props for the mobile hotspot viewer
interface MobileHotspotViewerProps {
  hotspot: any; // Replace 'any' with a proper hotspot type
  onClick: () => void;
}

export const MobileHotspotViewer: React.FC<MobileHotspotViewerProps> = ({ hotspot, onClick }) => {
  const style = {
    position: 'absolute',
    left: `${hotspot.x}%`,
    top: `${hotspot.y}%`,
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255, 0, 0, 0.5)',
    border: '2px solid white',
    cursor: 'pointer',
  };

  return (
    <div style={style} onClick={onClick}>
      {/* Hotspot content can be customized here */}
    </div>
  );
};
