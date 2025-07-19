import React, { useMemo } from 'react';

// Define props for the mobile hotspot viewer
interface MobileHotspotViewerProps {
  hotspot: any; // Replace 'any' with a proper hotspot type
  onClick: () => void;
  scale?: number; // Optional scale factor for responsive sizing
}

export const MobileHotspotViewer: React.FC<MobileHotspotViewerProps> = ({ 
  hotspot, 
  onClick, 
  scale = 1 
}) => {
  // Calculate responsive hotspot size based on screen size and accessibility settings
  const hotspotSize = useMemo(() => {
    const baseSize = 44; // Base 44px for accessibility (Apple's recommended minimum touch target)
    const scaledSize = baseSize * scale;
    
    // Ensure minimum touch target size for accessibility
    const minSize = 44;
    const maxSize = Math.min(80, window.innerWidth * 0.15); // Cap at 15% of screen width or 80px
    
    return Math.max(minSize, Math.min(maxSize, scaledSize));
  }, [scale]);

  const style = useMemo(() => ({
    position: 'absolute' as const,
    left: `${hotspot.x}%`,
    top: `${hotspot.y}%`,
    width: `${hotspotSize}px`,
    height: `${hotspotSize}px`,
    borderRadius: '50%',
    backgroundColor: 'rgba(255, 0, 0, 0.5)',
    border: '2px solid white',
    cursor: 'pointer',
    // Ensure proper touch area even if visually smaller
    minWidth: '44px',
    minHeight: '44px',
    // Center the hotspot properly
    transform: `translate(-50%, -50%)`,
    // Improve touch responsiveness
    touchAction: 'manipulation',
  }), [hotspot.x, hotspot.y, hotspotSize]);

  return (
    <div style={style} onClick={onClick}>
      {/* Hotspot content can be customized here */}
    </div>
  );
};
