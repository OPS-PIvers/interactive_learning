import React from 'react';
import { HotspotData, TimelineEventData, InteractionType } from '../../shared/types';
import HotspotViewer from './HotspotViewer';
import FileUpload from './FileUpload';
import { PlusIcon } from './icons/PlusIcon';
import PanZoomPreviewOverlay from './PanZoomPreviewOverlay';
import SpotlightPreviewOverlay from './SpotlightPreviewOverlay';
import TextPreviewOverlay from './TextPreviewOverlay';
import { Z_INDEX } from '../utils/styleConstants';

interface ImageEditCanvasProps {
  backgroundImage: string | undefined;
  editingZoom: number;
  actualImageRef: React.RefObject<HTMLImageElement>;
  zoomedImageContainerRef: React.RefObject<HTMLDivElement>;
  scrollableContainerRef: React.RefObject<HTMLDivElement>; // For scrollable area around zoomed image
  imageContainerRef: React.RefObject<HTMLDivElement>; // For overall image editing area

  hotspotsWithPositions: Array<HotspotData & { pixelPosition: { x: number; y: number; baseX?: number; baseY?: number } | null }>;
  pulsingHotspotId: string | null;
  activeHotspotDisplayIds: Set<string>;
  highlightedHotspotId: string | null;
  getHighlightGradientStyle: () => React.CSSProperties;


  // Event Handlers
  onImageLoad: (event: React.SyntheticEvent<HTMLImageElement>) => void;
  onImageOrHotspotClick?: (event: React.MouseEvent<HTMLDivElement>, hotspotId?: string) => void; // Updated prop
  onTouchStart?: (event: React.TouchEvent<HTMLDivElement>) => void;
  onTouchMove?: (event: React.TouchEvent<HTMLDivElement>) => void;
  onTouchEnd?: (event: React.TouchEvent<HTMLDivElement>) => void;

  // Hotspot Interaction Callbacks
  onFocusHotspot: (hotspotId: string) => void;
  onEditHotspotRequest: (hotspotId: string) => void;
  onHotspotPositionChange: (hotspotId: string, x: number, y: number) => void;
  onDragStateChange?: (isDragging: boolean) => void;

  // Props for MemoizedHotspotViewer that were sourced from InteractiveModule's state/props
  isEditing: boolean;
  isMobile: boolean;
  currentStep?: number; // Optional, as it's for dimming logic which might be specific
  timelineEvents?: TimelineEventData[]; // Optional for dimming

  // Fallback for no image
  onImageUpload?: (file: File) => void;
  
  // Drag state management
  isDragModeActive?: boolean;
  
  // Preview overlay support
  previewOverlayEvent?: TimelineEventData | null;
  onPreviewOverlayUpdate?: (event: TimelineEventData) => void;
  
  // Standardized positioning functions
  getImageBounds?: () => { width: number; height: number; left: number; top: number } | null;
  imageNaturalDimensions?: { width: number; height: number } | null;
  imageFitMode?: string;

  // Props for "click to place" new hotspot
  isPlacingHotspot?: boolean;
  onPlaceNewHotspot?: (x: number, y: number) => void;
}

const ImageEditCanvas: React.FC<ImageEditCanvasProps> = React.memo(({
  backgroundImage,
  editingZoom,
  actualImageRef,
  zoomedImageContainerRef,
  scrollableContainerRef,
  imageContainerRef,
  hotspotsWithPositions,
  pulsingHotspotId,
  activeHotspotDisplayIds,
  highlightedHotspotId,
  getHighlightGradientStyle,
  onImageLoad,
  onImageOrHotspotClick,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  onFocusHotspot,
  onEditHotspotRequest,
  onHotspotPositionChange,
  onDragStateChange,
  isEditing,
  isMobile,
  currentStep,
  timelineEvents,
  onImageUpload,
  isDragModeActive = false,
  previewOverlayEvent,
  onPreviewOverlayUpdate,
  getImageBounds,
  imageNaturalDimensions,
  imageFitMode,
  isPlacingHotspot = false,
  onPlaceNewHotspot,
}) => {
  // Determine if dimming logic is applicable (simplified from InteractiveModule)
  const getIsHotspotDimmed = (hotspotId: string) => {
    // FIXED: Never dim hotspots in editing mode - they should always be fully interactive
    // Users need to be able to click on any hotspot to edit it, regardless of timeline state
    if (isEditing) return false;
    
    if (!currentStep || !timelineEvents) return false;
    // In viewing mode, a hotspot is dimmed if it's not part of an active event in the current step
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

  return (
    <div
      ref={scrollableContainerRef}
      className={`w-full h-full overflow-auto bg-slate-900 flex items-center justify-center ${
        isDragModeActive ? 'drag-mode-active' : ''
      } ${
        // Apply crosshair if placing hotspot OR if editing and background image exists (original logic)
        (isPlacingHotspot || (isEditing && backgroundImage)) ? 'editing-mode-crosshair' : ''
      }`}
      style={{
        scrollBehavior: 'smooth',
        scrollbarWidth: 'thin',
        scrollbarColor: '#475569 #1e293b',
        cursor: isPlacingHotspot ? 'crosshair' : (isDragModeActive ? 'grabbing' : (isEditing && backgroundImage ? 'crosshair' : 'default')),
      }}
      onClick={(e) => {
        // If currently placing a hotspot and the click is on the canvas background (not a hotspot itself)
        if (isPlacingHotspot && onPlaceNewHotspot && actualImageRef.current) {
          const target = e.target as HTMLElement;
          // Check if the click was directly on the image or its container, not on a hotspot viewer
          if (target === actualImageRef.current || target === zoomedImageContainerRef.current || target === scrollableContainerRef.current) {
            const imageRect = actualImageRef.current.getBoundingClientRect();
            const scrollRect = scrollableContainerRef.current?.getBoundingClientRect();

            if (!scrollRect) return;

            // Calculate click position relative to the scrollable container
            const clickXInScrollContainer = e.clientX - scrollRect.left;
            const clickYInScrollContainer = e.clientY - scrollRect.top;

            // Account for current scroll position of the container
            const scrollLeft = scrollableContainerRef.current?.scrollLeft || 0;
            const scrollTop = scrollableContainerRef.current?.scrollTop || 0;

            // Click position relative to the actual image element's top-left corner (considering its current display rect)
            const clickXRelativeToImageOrigin = e.clientX - imageRect.left;
            const clickYRelativeToImageOrigin = e.clientY - imageRect.top;

            // Convert to coordinates on the unzoomed, natural-sized image
            // The imageRect dimensions (width/height) are the displayed size, already affected by zoom.
            // We need to map the click point (which is on the displayed image) back to the natural image.
            const xOnNaturalImage = (clickXRelativeToImageOrigin / imageRect.width) * actualImageRef.current.naturalWidth;
            const yOnNaturalImage = (clickYRelativeToImageOrigin / imageRect.height) * actualImageRef.current.naturalHeight;

            // Convert to percentage of the natural image dimensions
            const xPercent = (xOnNaturalImage / actualImageRef.current.naturalWidth) * 100;
            const yPercent = (yOnNaturalImage / actualImageRef.current.naturalHeight) * 100;

            // Clamp values between 0 and 100
            const finalXPercent = Math.max(0, Math.min(100, xPercent));
            const finalYPercent = Math.max(0, Math.min(100, yPercent));

            onPlaceNewHotspot(finalXPercent, finalYPercent);
            e.stopPropagation(); // Prevent other click handlers
            return;
          }
        }
        // Default behavior if not placing a hotspot
        console.log('Debug [ImageEditCanvas]: Container click detected (default)', {
          target: e.target,
          currentTarget: e.currentTarget,
          isEditing,
          timestamp: Date.now()
        });
        onImageOrHotspotClick && onImageOrHotspotClick(e);
      }}
    >
      <div
          className={`relative flex items-center justify-center ${isMobile ? 'min-w-full min-h-full' : 'min-w-full min-h-full'} ${
            isDragModeActive ? 'drag-mode-active' : ''
          }`}
        style={{
          // Cursor styling is now handled by the parent scrollableContainerRef
          zIndex: Z_INDEX.IMAGE_BASE
        }}
          // For mobile, the click is handled by the parent div in InteractiveModule which then calls onImageOrHotspotClick.
          // For desktop, the click is handled by the scrollableContainerRef above.
          // If we need finer-grained click detection within this div (e.g. on the image itself vs. padding),
          // this onClick could be used, ensuring it calls onImageOrHotspotClick appropriately.
          // For now, the main click logic is on scrollableContainerRef for desktop.
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
              zIndex: !isMobile && editingZoom > 1 ? Z_INDEX.IMAGE_TRANSFORMED : Z_INDEX.IMAGE_BASE,
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
            {console.log('Debug [ImageEditCanvas]: Rendering hotspots', {
              hotspotsCount: hotspotsWithPositions.length,
              isEditing,
              hotspotIds: hotspotsWithPositions.map(h => h.id),
              timestamp: Date.now()
            }) || hotspotsWithPositions.map(hotspot => (
              <div
                key={hotspot.id}
                className="hotspot-viewer"
                style={{
                  touchAction: isMobile ? 'none' : 'auto', // Better mobile drag performance
                  pointerEvents: 'auto', // Ensure pointer events are enabled
                  zIndex: isEditing ? 1000 : 100 // Higher z-index in editing mode for better interaction
                }}
              >
                <HotspotViewer
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
                  onDragStateChange={onDragStateChange}
                  isContinuouslyPulsing={false} // Assuming this is for viewer mode, not editor
                  isMobile={isMobile}
                  dragContainerRef={zoomedImageContainerRef} // Pass the ref here
                />
              </div>
            ))}

            {/* Preview Overlays - Only show when preview is active and in editing mode */}
            {isEditing && previewOverlayEvent && onPreviewOverlayUpdate && (
              <>
                {/* Calculate container bounds for overlays using standardized bounds */}
                {(() => {
                  // Use standardized bounds if available, fallback to current method
                  let containerBounds = null;
                  let boundsSource = 'none';
                  
                  if (getImageBounds && imageNaturalDimensions) {
                    // Calculate edit-mode bounds that match view-mode positioning
                    const imgElement = actualImageRef.current;
                    if (imgElement && imageNaturalDimensions) {
                      const imgRect = imgElement.getBoundingClientRect();
                      const imageAspect = imageNaturalDimensions.width / imageNaturalDimensions.height;
                      const containerAspect = imgRect.width / imgRect.height;
                      
                      // Calculate content area using the same logic as view mode
                      let contentWidth, contentHeight;
                      
                      // Edit mode typically uses 'contain' behavior
                      if (containerAspect > imageAspect) {
                        // Container is wider - image height fills, width is letterboxed
                        contentHeight = imgRect.height;
                        contentWidth = contentHeight * imageAspect;
                      } else {
                        // Container is taller - image width fills, height is letterboxed
                        contentWidth = imgRect.width;
                        contentHeight = contentWidth / imageAspect;
                      }
                      
                      containerBounds = {
                        width: contentWidth,
                        height: contentHeight,
                        left: 0,
                        top: 0
                      };
                      boundsSource = 'edit-mode-calculated';
                      console.log('📐 BOUNDS DEBUG: Using edit-mode calculated bounds', {
                        containerBounds,
                        imgRect,
                        imageNaturalDimensions,
                        imageAspect,
                        containerAspect,
                        imageFitMode,
                        isEditing
                      });
                    }
                  }
                  
                  // Fallback to original method if standardized bounds not available
                  if (!containerBounds) {
                    const imgElement = actualImageRef.current;
                    if (!imgElement) return null;
                    
                    const imgRect = imgElement.getBoundingClientRect();
                    containerBounds = {
                      width: imgRect.width,
                      height: imgRect.height,
                      left: 0, // Relative to the image
                      top: 0
                    };
                    boundsSource = 'fallback';
                    console.log('📐 BOUNDS DEBUG: Using fallback bounds', {
                      containerBounds,
                      imgRect,
                      isEditing
                    });
                  }

                  // Render the appropriate overlay based on event type
                  if (previewOverlayEvent.type === InteractionType.PAN_ZOOM || 
                      previewOverlayEvent.type === InteractionType.PAN_ZOOM_TO_HOTSPOT) {
                    return (
                      <PanZoomPreviewOverlay
                        event={previewOverlayEvent}
                        onUpdate={onPreviewOverlayUpdate}
                        containerBounds={containerBounds}
                      />
                    );
                  }
                  
                  if (previewOverlayEvent.type === InteractionType.SPOTLIGHT || 
                      previewOverlayEvent.type === InteractionType.HIGHLIGHT_HOTSPOT) {
                    return (
                      <SpotlightPreviewOverlay
                        event={previewOverlayEvent}
                        onUpdate={onPreviewOverlayUpdate}
                        containerBounds={containerBounds}
                      />
                    );
                  }
                  
                  if (previewOverlayEvent.type === InteractionType.SHOW_TEXT) {
                    return (
                      <TextPreviewOverlay
                        event={previewOverlayEvent}
                        onUpdate={onPreviewOverlayUpdate}
                        containerBounds={containerBounds}
                      />
                    );
                  }
                  
                  return null;
                })()}
              </>
            )}
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

      </div>
    </div>
  );
});

export default ImageEditCanvas;

// Need to ensure MemoizedHotspotViewer is exported from './HotspotViewer'
// Example export in HotspotViewer.tsx:
// export const MemoizedHotspotViewer = React.memo(HotspotViewer);
// export default HotspotViewer; (or just export default React.memo(HotspotViewer))
