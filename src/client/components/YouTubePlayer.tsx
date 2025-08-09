import React, { useState } from 'react';
import { Z_INDEX_TAILWIND } from '../utils/zIndexLevels';

interface YouTubePlayerProps {
  videoId: string;
  title?: string;
  autoplay?: boolean;
  startTime?: number;
  endTime?: number;
  loop?: boolean;
  showControls?: boolean;
  className?: string;
}

const YouTubePlayer: React.FC<YouTubePlayerProps> = ({
  videoId,
  title,
  autoplay = false,
  startTime,
  endTime,
  loop = false,
  showControls = true,
  className = ''
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Extract video ID from URL if full URL is provided
  const extractVideoId = (input: string): string => {
    // Handle different YouTube URL formats
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/ // Direct video ID
    ];

    for (const pattern of patterns) {
      const match = input.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return input; // Return as-is if no pattern matches
  };

  const cleanVideoId = extractVideoId(videoId);

  // Build YouTube embed URL with parameters
  const buildEmbedUrl = (): string => {
    const baseUrl = `https://www.youtube.com/embed/${cleanVideoId}`;
    const params = new URLSearchParams();

    if (autoplay) params.append('autoplay', '1');
    if (startTime) params.append('start', startTime.toString());
    if (endTime) params.append('end', endTime.toString());
    if (loop) {
      params.append('loop', '1');
      params.append('playlist', cleanVideoId);
    }
    if (!showControls) params.append('controls', '0');
    
    // Additional parameters for better embedding experience
    params.append('modestbranding', '1'); // Reduce YouTube branding
    params.append('rel', '0'); // Don't show related videos
    params.append('enablejsapi', '1'); // Enable JavaScript API

    return `${baseUrl}?${params.toString()}`;
  };

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const openInYouTube = () => {
    const youtubeUrl = `https://www.youtube.com/watch?v=${cleanVideoId}${startTime ? `&t=${startTime}s` : ''}`;
    window.open(youtubeUrl, '_blank', 'noopener,noreferrer');
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`relative bg-black rounded-lg overflow-hidden ${className}`}>
      {/* Loading State */}
      {isLoading && (
        <div className={`absolute inset-0 flex items-center justify-center bg-slate-900 ${Z_INDEX_TAILWIND.SLIDE_CONTENT}`}>
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4" />
            <p>Loading YouTube video...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {hasError && (
        <div className={`absolute inset-0 flex items-center justify-center bg-slate-900 ${Z_INDEX_TAILWIND.SLIDE_CONTENT}`}>
          <div className="text-center text-white">
            <svg className="w-16 h-16 mx-auto mb-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="mb-4">Failed to load YouTube video</p>
            <button
              onClick={openInYouTube}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
            >
              Open in YouTube
            </button>
          </div>
        </div>
      )}

      {/* YouTube Embed */}
      <div className="relative w-full h-0 pb-[56.25%]"> {/* 16:9 aspect ratio */}
        <iframe
          className="absolute inset-0 w-full h-full"
          src={buildEmbedUrl()}
          title={title || `YouTube video ${cleanVideoId}`}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          onLoad={handleLoad}
          onError={handleError}
        />
      </div>

      {/* Video Info Overlay */}
      {(title || startTime || endTime) && !isLoading && !hasError && (
        <div className="absolute top-4 left-4 right-4 bg-black/70 backdrop-blur-sm rounded-lg p-3">
          {title && <h3 className="text-white font-semibold mb-1">{title}</h3>}
          {(startTime || endTime) && (
            <div className="text-slate-300 text-sm flex items-center space-x-2">
              {startTime && (
                <span>Start: {formatTime(startTime)}</span>
              )}
              {startTime && endTime && <span>•</span>}
              {endTime && (
                <span>End: {formatTime(endTime)}</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* External Link Button */}
      {!isLoading && !hasError && (
        <div className="absolute top-4 right-4">
          <button
            onClick={openInYouTube}
            className="bg-black/70 backdrop-blur-sm text-white p-2 rounded-lg hover:bg-black/80 transition-colors"
            aria-label="Open in YouTube"
            title="Open in YouTube"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5z" clipRule="evenodd" />
              <path fillRule="evenodd" d="M6.194 12.753a.75.75 0 001.06.053L16.5 4.44v2.81a.75.75 0 001.5 0v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 000 1.5h2.553l-9.056 8.194a.75.75 0 00-.053 1.06z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}

      {/* YouTube Logo */}
      {!isLoading && !hasError && (
        <div className="absolute bottom-4 right-4">
          <div className="bg-black/70 backdrop-blur-sm rounded px-2 py-1 flex items-center space-x-1">
            <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
            <span className="text-white text-xs">YouTube</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default YouTubePlayer;