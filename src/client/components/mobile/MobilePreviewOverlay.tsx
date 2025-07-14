import React from 'react';

interface MobilePreviewOverlayProps {
  onPlay?: () => void;
  onPause?: () => void;
  onRestart?: () => void;
  onExit: () => void;
  isPlaying: boolean;
}

const MobilePreviewOverlay: React.FC<MobilePreviewOverlayProps> = ({
  onPlay,
  onPause,
  onRestart,
  onExit,
  isPlaying,
}) => {
  const showPlaybackControls = onPlay && onPause && onRestart;

  return (
    <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none">
      {/* Top controls */}
      <div className="flex justify-end pointer-events-auto">
        <button
          onClick={onExit}
          className="text-white bg-black bg-opacity-60 rounded-full p-3 shadow-lg hover:bg-opacity-80 transition-all"
          aria-label="Exit preview"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Bottom controls */}
      {showPlaybackControls && (
        <div className="flex justify-center pointer-events-auto">
          <div className="flex items-center space-x-4 bg-black bg-opacity-60 rounded-full p-2 shadow-lg">
            <button
              onClick={onRestart}
              className="text-white p-3 hover:bg-white/10 rounded-full transition-colors"
              aria-label="Restart preview"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 110 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm1 14a1 1 0 011-1h5.001a5.002 5.002 0 002.566-11.601 1 1 0 11.666 1.885A7.002 7.002 0 0114.899 15H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 111.885-.666A5.002 5.002 0 008.001 17H5a1 1 0 01-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            <button
              onClick={isPlaying ? onPause : onPlay}
              className="text-white bg-purple-600 p-4 rounded-full hover:bg-purple-500 transition-colors"
              aria-label={isPlaying ? 'Pause preview' : 'Play preview'}
            >
              {isPlaying ? (
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 6a1 1 0 00-1 1v6a1 1 0 102 0V7a1 1 0 00-1-1zm4 0a1 1 0 00-1 1v6a1 1 0 102 0V7a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4.536 3.123A1 1 0 016 4v12a1 1 0 01-1.464.877L1.5 14.828V5.172l3.036-2.049zM15.464 3.123l-3.036 2.049v9.656l3.036 2.049A1 1 0 0016 16V4a1 1 0 00-.536-.877z" />
                </svg>
              )}
            </button>

            {/* Placeholder for future controls like timeline scrubbing */}
            <div className="w-6 h-6" />
          </div>
        </div>
      )}
    </div>
  );
};

export default MobilePreviewOverlay;
