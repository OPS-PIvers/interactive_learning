import React, { useRef, useEffect, useState } from 'react';

interface MobileAudioPlayerProps {
  src: string;
  onClose: () => void;
}

export const MobileAudioPlayer: React.FC<MobileAudioPlayerProps> = ({ src, onClose }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Stable event listener functions
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);

    // Background playback is handled by the browser and OS, but we can
    // use the Page Visibility API to pause when the app is not in the foreground.
    const handleVisibilityChange = () => {
      if (document.hidden && audio) {
        audio.pause();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (audio) {
        audio.removeEventListener('play', onPlay);
        audio.removeEventListener('pause', onPause);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <div className="fixed inset-x-0 bottom-0 bg-gray-800 text-white p-4 z-50">
      <div className="flex items-center justify-between">
        <audio ref={audioRef} src={src} autoPlay controls className="w-full" />
        <button
          onClick={onClose}
          className="ml-4 text-white text-2xl"
          aria-label="Close audio player"
        >
          &times;
        </button>
      </div>
    </div>
  );
};
