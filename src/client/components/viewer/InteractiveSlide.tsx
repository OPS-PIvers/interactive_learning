import React from 'react';
import { InteractiveSlide as InteractiveSlideType } from '../../../shared/slideTypes';
import SlideElement from './SlideElement';

interface InteractiveSlideProps {
  slide: InteractiveSlideType;
}

const InteractiveSlide: React.FC<InteractiveSlideProps> = ({ slide }) => {
  const slideStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    aspectRatio: '16 / 9', // Default aspect ratio
    overflow: 'hidden',
  };

  const backgroundStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 0,
  };

  const renderBackground = () => {
    const { backgroundMedia } = slide;
    if (!backgroundMedia) return null;

    switch (backgroundMedia.type) {
      case 'color':
        return <div style={{ ...backgroundStyle, backgroundColor: backgroundMedia.color || '#f0f0f0' }} />;
      case 'image':
        return <img src={backgroundMedia.url} alt={slide.title} style={{ ...backgroundStyle, objectFit: 'cover' }} />;
      // Video and other types can be added later
      default:
        return null;
    }
  };

  return (
    <div className="interactive-slide" style={slideStyle}>
      {renderBackground()}
      <div className="slide-elements-container" style={{ position: 'relative', zIndex: 1 }}>
        {slide.elements.map(element => (
          <SlideElement key={element.id} element={element} />
        ))}
      </div>
    </div>
  );
};

export default InteractiveSlide;
