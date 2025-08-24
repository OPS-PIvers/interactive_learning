import { VideoSourceType } from '../../shared/types';

// Video source detection utility
export const detectVideoSource = (input: string): VideoSourceType => {
  const youtubePatterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/ // Direct video ID
  ];

  for (const pattern of youtubePatterns) {
    if (pattern.test(input)) return 'youtube';
  }

  const videoExtensions = /\.(mp4|webm|ogg|avi|mov|wmv|flv|mkv)$/i;
  if (videoExtensions.test(input)) return 'file';

  return 'url';
};

// Extract YouTube video ID from various URL formats
export const extractYouTubeVideoId = (input: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/ // Direct video ID
  ];

  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match) return match[1] || null;
  }
  return null;
};
