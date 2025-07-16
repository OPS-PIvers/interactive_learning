import React, { useRef, useEffect, useState } from 'react';

interface MobileVideoPlayerProps {
  src: string;
  onClose: () => void;
}

export const MobileVideoPlayer: React.FC<MobileVideoPlayerProps> = ({ src, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePictureInPicture = () => {
      if (document.pictureInPictureElement) {
        document.exitPictureInPicture();
      } else {
        video.requestPictureInPicture();
      }
    };

    video.addEventListener('play', () => setIsPlaying(true));
    video.addEventListener('pause', () => setIsPlaying(false));

    // This is a basic implementation. A more robust solution would
    // involve a library for gesture controls.
    let touchstartY = 0;
    let touchendY = 0;

    const handleGesture = () => {
      if (touchendY < touchstartY) {
        // Swiped up
      }
      if (touchendY > touchstartY) {
        // Swiped down
        onClose();
      }
    }

    const handleTouchStart = (e: TouchEvent) => {
      touchstartY = e.changedTouches[0].screenY;
    }

    const handleTouchEnd = (e: TouchEvent) => {
      touchendY = e.changedTouches[0].screenY;
      handleGesture();
    }

    video.addEventListener('touchstart', handleTouchStart);
    video.addEventListener('touchend', handleTouchEnd);


    return () => {
      video.removeEventListener('play', () => setIsPlaying(true));
      video.removeEventListener('pause', () => setIsPlaying(false));
      video.removeEventListener('touchstart', handleTouchStart);
      video.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="relative w-full h-full">
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
