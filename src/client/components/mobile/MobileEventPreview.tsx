import React from 'react';
import { TimelineEventData, HotspotData, InteractionType } from '../../../shared/types';
import SpotlightPreview from '../SpotlightPreview';
import PanZoomPreviewOverlay from '../PanZoomPreviewOverlay';
import TextPreviewOverlay from '../TextPreviewOverlay';
import { YouTubePlayer }d from '..';
import { VideoPlayer } from '../VideoPlayer';
import { AudioPlayer } from '../AudioPlayer';
import { ImageViewer } from '../ImageViewer';

interface MobileEventPreviewProps {
  event: TimelineEventData;
  hotspot: HotspotData;
  onUpdateEvent: (event: TimelineEventData) => void;
  // This would be the image of the interactive module
  backgroundImageUrl?: string;
}

const MobileEventPreview: React.FC<MobileEventPreviewProps> = ({
  event,
  hotspot,
  onUpdateEvent,
  backgroundImageUrl = "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
}) => {

  const renderEventPreview = () => {
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
        return (
          <div className="w-full h-full flex items-center justify-center">
            <YouTubePlayer
              videoId={event.youtubeVideoId || ''}
              width="100%"
              height="100%"
            />
          </div>
        );

      case InteractionType.SHOW_VIDEO:
        return (
          <VideoPlayer
            src={event.mediaUrl || ''}
            width="100%"
            height="100%"
          />
        );

      case InteractionType.SHOW_AUDIO_MODAL:
        return (
          <div className="w-full h-full flex items-center justify-center">
            <AudioPlayer src={event.mediaUrl || ''} />
          </div>
        );

      case InteractionType.SHOW_IMAGE_MODAL:
        return (
          <ImageViewer
            src={event.mediaUrl || ''}
            alt="Image preview"
          />
        );

      default:
        return (
          <div className="text-white text-center p-8">
            Preview for this event type is not yet available.
          </div>
        );
    }
  };

  return (
    <div
      className="w-full h-full bg-black bg-cover bg-center"
      style={{ backgroundImage: `url(${backgroundImageUrl})` }}
    >
      <div className="absolute inset-0 bg-black bg-opacity-30" />
      <div className="relative w-full h-full">
        {renderEventPreview()}
      </div>
    </div>
  );
};

export default MobileEventPreview;
