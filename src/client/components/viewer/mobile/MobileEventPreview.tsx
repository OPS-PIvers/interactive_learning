import React from 'react';
import { TimelineEventData, HotspotData, InteractionType } from '../../../shared/types';
import SpotlightPreview from '../SpotlightPreview';
import PanZoomPreviewOverlay from '../PanZoomPreviewOverlay';
import TextPreviewOverlay from '../TextPreviewOverlay';
import YouTubePlayer from '../YouTubePlayer';
import VideoPlayer from '../VideoPlayer';
import AudioPlayer from '../AudioPlayer';
import ImageViewer from '../ImageViewer';

interface MobileEventPreviewProps {
  event: TimelineEventData;
  hotspot: HotspotData;
  onUpdateEvent: (event: TimelineEventData) => void;
  // This would be the image of the interactive module
  backgroundImageUrl: string;
}

const MobileEventPreview: React.FC<MobileEventPreviewProps> = ({
  event,
  hotspot,
  onUpdateEvent,
  backgroundImageUrl
}) => {

  const renderEventPreview = () => {
    try {
      switch (event.type) {
        case InteractionType.SPOTLIGHT:
          return (
            <SpotlightPreview
              shape={event.spotlightShape || 'circle'}
              dimPercentage={event.spotlightDim || 50}
              zoomLevel={1} // Spotlight doesn't have zoom
            />
          );
        case InteractionType.PAN_ZOOM:
          return (
            <div className="relative w-full h-full">
              <PanZoomPreviewOverlay
                event={event}
                onUpdate={onUpdateEvent}
                containerBounds={{ width: window.innerWidth, height: window.innerHeight, left: 0, top: 0 }}
              />
            </div>
          );
        case InteractionType.SHOW_TEXT:
          return <TextPreviewOverlay content={event.text || ''} />;

        case InteractionType.SHOW_YOUTUBE:
          if (!event.youtubeVideoId) {
            return (
              <div className="w-full h-full flex items-center justify-center text-white">
                <p>No YouTube video ID provided</p>
              </div>
            );
          }
          return (
            <div className="w-full h-full flex items-center justify-center">
              <YouTubePlayer
                videoId={event.youtubeVideoId}
                className="w-full h-full"
              />
            </div>
          );

        case InteractionType.SHOW_VIDEO:
          if (!event.mediaUrl) {
            return (
              <div className="w-full h-full flex items-center justify-center text-white">
                <p>No video URL provided</p>
              </div>
            );
          }
          return (
            <VideoPlayer
              src={event.mediaUrl}
              className="w-full h-full"
            />
          );

        case InteractionType.SHOW_AUDIO_MODAL:
          if (!event.mediaUrl) {
            return (
              <div className="w-full h-full flex items-center justify-center text-white">
                <p>No audio URL provided</p>
              </div>
            );
          }
          return (
            <div className="w-full h-full flex items-center justify-center">
              <AudioPlayer src={event.mediaUrl} className="w-full max-w-md" />
            </div>
          );

        case InteractionType.SHOW_IMAGE_MODAL:
          if (!event.mediaUrl) {
            return (
              <div className="w-full h-full flex items-center justify-center text-white">
                <p>No image URL provided</p>
              </div>
            );
          }
          return (
            <ImageViewer
              src={event.mediaUrl}
              alt="Image preview"
              className="w-full h-full"
            />
          );

        default:
          return (
            <div className="text-white text-center p-8">
              <p>Preview for "{event.type}" event type is not yet available.</p>
            </div>
          );
      }
    } catch (error) {
      console.error('Error rendering event preview:', error);
      return (
        <div className="w-full h-full flex items-center justify-center text-white">
          <div className="text-center">
            <p className="mb-2">Error loading preview</p>
            <p className="text-sm text-gray-400">Check console for details</p>
          </div>
        </div>
      );
    }
  };

  return (
    <div
      className="w-full h-full bg-black bg-cover bg-center"
      style={{ backgroundImage: backgroundImageUrl ? `url(${backgroundImageUrl})` : undefined }}
      role="main"
      aria-label="Event preview"
    >
      <div className="absolute inset-0 bg-black bg-opacity-30" />
      <div className="relative w-full h-full">
        {renderEventPreview()}
      </div>
    </div>
  );
};

export default MobileEventPreview;
