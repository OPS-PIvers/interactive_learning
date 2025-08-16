import React from 'react';
import { SlideDeck } from '../../../shared/slideTypes';
import SlideBasedViewer from '../SlideBasedViewer';

interface SlidePreviewProps {
  slideDeck: SlideDeck;
  projectName: string;
  onClose: () => void;
}

const SlidePreview: React.FC<SlidePreviewProps> = ({ slideDeck, projectName, onClose }) => {
  return (
    <div className="absolute inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center">
      <div className="w-full h-full max-w-4xl max-h-[80vh] bg-white rounded-lg overflow-hidden shadow-2xl">
        <SlideBasedViewer
          slideDeck={slideDeck}
          projectName={projectName}
          viewerModes={{ explore: true, selfPaced: false, timed: false }}
          autoStart={true}
          onClose={onClose}
        />
      </div>
    </div>
  );
};

export default SlidePreview;
