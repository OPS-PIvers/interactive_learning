import React from 'react';
import { SlideElement as SlideElementType } from '../../../shared/slideTypes';

interface SlideElementProps {
  element: SlideElementType;
}

const SlideElement: React.FC<SlideElementProps> = ({ element }) => {
  // For now, we'll just use desktop positioning.
  // A real implementation would have logic to select the correct position based on screen size.
  const { x, y, width, height } = element.position.desktop;

  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${x}%`,
    top: `${y}%`,
    width: `${width}%`,
    height: `${height}%`,
    backgroundColor: element.style.backgroundColor || 'transparent',
    border: `${element.style.borderWidth || 0}px solid ${element.style.borderColor || 'transparent'}`,
    borderRadius: `${element.style.borderRadius || 0}px`,
    opacity: element.style.opacity || 1,
    zIndex: element.style.zIndex || 'auto',
    // We'll add a simple transition for visibility
    transition: 'opacity 0.3s ease-in-out',
    visibility: element.isVisible ? 'visible' : 'hidden',
    opacity: element.isVisible ? (element.style.opacity || 1) : 0,
  };

  const renderElementContent = () => {
    switch (element.type) {
      case 'text':
        return <div style={{ width: '100%', height: '100%', whiteSpace: 'pre-wrap', overflow: 'hidden' }}>{element.content.textContent}</div>;
      case 'hotspot':
        return <button style={{ width: '100%', height: '100%' }}>{element.content.title || 'Hotspot'}</button>;
      case 'media':
        if (element.content.mediaType === 'image' && element.content.mediaUrl) {
          return <img src={element.content.mediaUrl} alt={element.content.title || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
        }
        // Other media types can be added here
        return <div>Media Element</div>;
      case 'shape':
        return <div style={{ width: '100%', height: '100%' }} />;
      default:
        return <div>Unknown Element Type</div>;
    }
  };

  return (
    <div className={`slide-element slide-element-${element.type}`} style={style}>
      {renderElementContent()}
    </div>
  );
};

export default SlideElement;
