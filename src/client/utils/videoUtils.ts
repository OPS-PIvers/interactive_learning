import { VideoSourceType } from '../../shared/types';

const YOUTUBE_PATTERNS = [
  /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
  /^([a-zA-Z0-9_-]{11})$/ // Direct video ID
];

// Video source detection utility
export const detectVideoSource = (input: string): VideoSourceType => {
  for (const pattern of YOUTUBE_PATTERNS) {
    if (pattern.test(input)) return 'youtube';
  }

  const videoExtensions = /\.(mp4|webm|ogg|avi|mov|wmv|flv|mkv)$/i;
  if (videoExtensions.test(input)) return 'file';

  return 'url';
};

// Extract YouTube video ID from various URL formats
export const extractYouTubeVideoId = (input: string): string | null => {
  for (const pattern of YOUTUBE_PATTERNS) {
    const match = input.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
};
