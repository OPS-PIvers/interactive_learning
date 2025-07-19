import React, { useRef, useEffect, useState } from 'react';

interface MobileVideoPlayerProps {
  src: string;
  onClose: () => void;
}

export const MobileVideoPlayer: React.FC<MobileVideoPlayerProps> = ({ src, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Stable event listener functions for potential future use
    const onPlay = () => {};
    const onPause = () => {};

    // This is a basic implementation. A more robust solution would
    // involve a library for gesture controls.
    let touchstartY = 0;
    const swipeThreshold = 50; // Minimum pixels to be considered a swipe

    const handleTouchStart = (e: TouchEvent) => {
      touchstartY = e.changedTouches[0].screenY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const touchendY = e.changedTouches[0].screenY;
      if (touchendY > touchstartY + swipeThreshold) {
        // Swiped down
        onClose();
      }
    };

    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('touchstart', handleTouchStart);
    video.addEventListener('touchend', handleTouchEnd);

    return () => {
      if (video) {
        video.removeEventListener('play', onPlay);
        video.removeEventListener('pause', onPause);
        video.removeEventListener('touchstart', handleTouchStart);
        video.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="relative w-full h-full flex items-center justify-center">
        <video
          ref={videoRef}
          src={src}
          autoPlay
          controls
          playsInline
          className="w-full h-full"
          onDoubleClick={() => {
            if (videoRef.current) {
              if (document.pictureInPictureElement) {
                document.exitPictureInPicture();
              } else {
                videoRef.current.requestPictureInPicture();
              }
            }
          }}
        />
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white text-2xl"
          aria-label="Close video"
        >
          &times;
        </button>
      </div>
    </div>
  );
};
