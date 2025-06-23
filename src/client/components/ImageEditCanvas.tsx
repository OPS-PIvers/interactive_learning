import React from 'react';
import { HotspotData, TimelineEventData, InteractionType } from '../../shared/types';
import { MemoizedHotspotViewer } from './HotspotViewer'; // Assuming MemoizedHotspotViewer is exported from HotspotViewer
import FileUpload from './FileUpload';
import { PlusIcon } from './icons/PlusIcon';

// Z_INDEX might be needed if it was used for z-ordering within this canvas part
// For now, assuming styles are self-contained or passed via classNames.
// const Z_INDEX = { IMAGE_TRANSFORMED: 15, IMAGE_BASE: 10, HOTSPOTS: 20 };


interface ImageEditCanvasProps {
  backgroundImage: string | undefined;
  editingZoom: number;
  actualImageRef: React.RefObject<HTMLImageElement>;
  zoomedImageContainerRef: React.RefObject<HTMLDivElement>;
  scrollableContainerRef: React.RefObject<HTMLDivElement>; // For scrollable area around zoomed image
  imageContainerRef: React.RefObject<HTMLDivElement>; // For overall image editing area, used for pending hotspot coords

  hotspotsWithPositions: Array<HotspotData & { pixelPosition: { x: number; y: number; baseX?: number; baseY?: number } | null }>;
  pulsingHotspotId: string | null;
  activeHotspotDisplayIds: Set<string>;
  highlightedHotspotId: string | null;
  getHighlightGradientStyle: () => React.CSSProperties;

  pendingHotspot: { viewXPercent: number; viewYPercent: number; imageXPercent: number; imageYPercent: number } | null;

  // Event Handlers
  onImageLoad: (event: React.SyntheticEvent<HTMLImageElement>) => void;
  onImageClick?: (event: React.MouseEvent<HTMLDivElement>) => void; // Optional as mobile might handle clicks on a higher div
  onTouchStart?: (event: React.TouchEvent<HTMLDivElement>) => void;
  onTouchMove?: (event: React.TouchEvent<HTMLDivElement>) => void;
  onTouchEnd?: (event: React.TouchEvent<HTMLDivElement>) => void;

  // Hotspot Interaction Callbacks
  onFocusHotspot: (hotspotId: string) => void;
  onEditHotspotRequest: (hotspotId: string) => void;
  onHotspotPositionChange: (hotspotId: string, x: number, y: number) => void;

  // Props for MemoizedHotspotViewer that were sourced from InteractiveModule's state/props
  isEditing: boolean;
  isMobile: boolean;
  currentStep?: number; // Optional, as it's for dimming logic which might be specific
  timelineEvents?: TimelineEventData[]; // Optional for dimming

  // Fallback for no image
  onImageUpload?: (file: File) => void;
}

const ImageEditCanvas: React.FC<ImageEditCanvasProps> = React.memo(({
  backgroundImage,
  editingZoom,
  actualImageRef,
  zoomedImageContainerRef,
  scrollableContainerRef,
  imageContainerRef, // Used for pending hotspot in mobile view
  hotspotsWithPositions,
  pulsingHotspotId,
  activeHotspotDisplayIds,
  highlightedHotspotId,
  getHighlightGradientStyle,
  pendingHotspot,
  onImageLoad,
  onImageClick,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  onFocusHotspot,
  onEditHotspotRequest,
  onHotspotPositionChange,
  isEditing,
  isMobile,
  currentStep,
  timelineEvents,
  onImageUpload,
}) => {
  // Determine if dimming logic is applicable (simplified from InteractiveModule)
  const getIsHotspotDimmed = (hotspotId: string) => {
    if (!isEditing || !currentStep || !timelineEvents) return false;
    // In editing mode, a hotspot is dimmed if it's not part of an active event in the current step
    return currentStep > 0 && !timelineEvents.some(e =>
      e.step === currentStep &&
      e.targetId === hotspotId &&
      (e.type === InteractionType.SHOW_HOTSPOT ||
       e.type === InteractionType.PULSE_HOTSPOT ||
       e.type === InteractionType.PAN_ZOOM_TO_HOTSPOT ||
       e.type === InteractionType.HIGHLIGHT_HOTSPOT)
    );
  };

  // The main click/touch handlers might be on the parent div in InteractiveModule for mobile,
  // so onImageClick, onTouchStart etc. are passed to this specific scrollable/image area
  // if direct interaction is needed here.

  const Z_INDEX_IMAGE_BASE = 10;
  const Z_INDEX_IMAGE_TRANSFORMED = 15;

  return (
    <div
      ref={scrollableContainerRef}
      className="w-full h-full overflow-auto bg-slate-900 flex items-center justify-center" // Added flex items-center justify-center for mobile
      style={{ // Styles from desktop version
        scrollBehavior: 'smooth',
        scrollbarWidth: 'thin',
        scrollbarColor: '#475569 #1e293b',
      }}
      // onClick={onImageClick} // Clicks are now handled by parent in mobile, or by this div for desktop
      // onTouchStart={onTouchStart}
      // onTouchMove={onTouchMove}
      // onTouchEnd={onTouchEnd}
    >
      <div
        // This inner div is what was 'imageContainerRef' in desktop,
        // but for mobile, imageContainerRef is the parent of this component.
        // For desktop, InteractiveModule will pass its imageContainerRef to this component's scrollableContainerRef's child.
        // Let's assume the direct parent of the img tag is the one for click if not mobile.
        className={`relative flex items-center justify-center ${isMobile ? 'min-w-full min-h-full' : 'min-w-full min-h-full'}`} // Ensure it fills scrollable
        style={{
          cursor: backgroundImage && !pendingHotspot ? 'crosshair' : 'default',
          zIndex: Z_INDEX_IMAGE_BASE
        }}
        onClick={!isMobile ? onImageClick : undefined} // Desktop handles its own click here
      >
        {backgroundImage ? (
          <div
            ref={zoomedImageContainerRef}
            className="relative"
            style={{
              transform: `scale(${editingZoom})`,
              transformOrigin: 'center',
              transition: 'transform 0.2s ease-out',
              // zIndex for desktop, mobile canvas is simpler
              zIndex: !isMobile && editingZoom > 1 ? Z_INDEX_IMAGE_TRANSFORMED : Z_INDEX_IMAGE_BASE,
            }}
          >
            <img
              ref={actualImageRef}
              src={backgroundImage}
              alt="Interactive module background"
              className={isMobile ? "block max-w-full max-h-full object-contain" : "block max-w-none"}
              style={!isMobile ? { // Desktop specific styles from original
                width: scrollableContainerRef.current?.clientWidth || 'auto',
                height: 'auto',
              } : {}}
              onLoad={onImageLoad}
              draggable={false}
            />

            {/* Highlight overlay - ensure it's within the scaled container */}
            {highlightedHotspotId && backgroundImage && activeHotspotDisplayIds.has(highlightedHotspotId) && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={getHighlightGradientStyle()}
                aria-hidden="true"
              />
            )}

            {/* Hotspots */}
            {hotspotsWithPositions.map(hotspot => (
              <MemoizedHotspotViewer
                key={hotspot.id}
                hotspot={hotspot}
                pixelPosition={hotspot.pixelPosition}
                usePixelPositioning={true}
                imageElement={actualImageRef.current}
                isPulsing={pulsingHotspotId === hotspot.id && activeHotspotDisplayIds.has(hotspot.id)}
                isDimmedInEditMode={getIsHotspotDimmed(hotspot.id)}
                isEditing={isEditing}
                onFocusRequest={onFocusHotspot}
                onEditRequest={onEditHotspotRequest}
                onPositionChange={onHotspotPositionChange}
                isContinuouslyPulsing={false} // Assuming this is for viewer mode, not editor
                isMobile={isMobile}
              />
            ))}
          </div>
        ) : (
          onImageUpload && ( // Only show upload if handler is provided
            <div className="w-full h-full flex items-center justify-center text-slate-400">
              <div className="text-center">
                <p className="text-lg mb-4">Upload an image to start editing</p>
                <FileUpload onFileUpload={onImageUpload} />
              </div>
            </div>
          )
        )}

        {/* Visual marker for pending hotspot */}
        {/* For mobile, viewXPercent/viewYPercent are relative to imageContainerRef (parent of this canvas) */}
        {/* For desktop, they were relative to the old imageContainerRef (which is now this component's inner div) */}
        {/* This needs careful handling in InteractiveModule when passing pendingHotspot or this needs its own container ref */}
        {pendingHotspot && imageContainerRef.current && ( // Use imageContainerRef from props for positioning context
           <div
            className="absolute w-8 h-8 bg-green-500 opacity-70 rounded-full transform -translate-x-1/2 -translate-y-1/2 pointer-events-none animate-pulse flex items-center justify-center"
            style={{
              left: `${pendingHotspot.viewXPercent}%`,
              top: `${pendingHotspot.viewYPercent}%`
            }}
            aria-hidden="true"
          ><PlusIcon className="w-5 h-5 text-white"/></div>
        )}
      </div>
    </div>
  );
});

export default ImageEditCanvas;

// Need to ensure MemoizedHotspotViewer is exported from './HotspotViewer'
// Example export in HotspotViewer.tsx:
// export const MemoizedHotspotViewer = React.memo(HotspotViewer);
// export default HotspotViewer; (or just export default React.memo(HotspotViewer))
