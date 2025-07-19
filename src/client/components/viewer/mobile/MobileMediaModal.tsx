import React from 'react';
import { MobileVideoPlayer } from './MobileVideoPlayer';
import { MobileAudioPlayer } from './MobileAudioPlayer';

interface MobileMediaModalProps {
  mediaType: 'video' | 'audio';
  src: string;
  onClose: () => void;
}

export const MobileMediaModal: React.FC<MobileMediaModalProps> = ({ mediaType, src, onClose }) => {
  if (mediaType === 'video') {
    return <MobileVideoPlayer src={src} onClose={onClose} />;
  }

  if (mediaType === 'audio') {
    return <MobileAudioPlayer src={src} onClose={onClose} />;
  }

  return null;
};
