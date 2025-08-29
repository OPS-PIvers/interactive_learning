import React from 'react';
import { SlideDeck } from '../../../shared/slideTypes';
import InteractiveSlide from './InteractiveSlide';

interface SlideViewerProps {
  slideDeck: SlideDeck;
  currentSlideIndex: number;
}

const SlideViewer: React.FC<SlideViewerProps> = ({ slideDeck, currentSlideIndex }) => {
  const currentSlide = slideDeck.slides[currentSlideIndex];

  if (!currentSlide) {
    return <div>Slide not found.</div>;
  }

  return (
    <div className="slide-viewer">
      <InteractiveSlide slide={currentSlide} />
    </div>
  );
};

export default SlideViewer;
