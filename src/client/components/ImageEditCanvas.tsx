import React from 'react';
import { useIsMobile } from '../hooks/useIsMobile';
import { HotspotData, TimelineEventData, InteractionType } from '../../shared/types';
import HotspotViewer from './HotspotViewer';
import FileUpload from './FileUpload';
import { PlusIcon } from './icons/PlusIcon';
import PanZoomPreviewOverlay from './PanZoomPreviewOverlay';
import SpotlightPreviewOverlay from './SpotlightPreviewOverlay';
import TextPreviewOverlay from './TextPreviewOverlay';
import { Z_INDEX } from '../utils/styleConstants';
import { PREVIEW_DEFAULTS } from '../constants/interactionConstants';
import { getActualImageVisibleBounds } from '../utils/imageBounds';

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
  previewingEvents?: TimelineEventData[];
  isPreviewMode?: boolean;
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
  previewingEvents = [],
  isPreviewMode = false
}) => {
  
  // Simple image loading like the working version
  
  const renderPreviewOverlays = () => {
    if (!isPreviewMode || previewingEvents.length === 0) return null;

    return previewingEvents.map(event => {
      switch (event.type) {
        case InteractionType.SPOTLIGHT:
          return (
            <div
              key={`preview-${event.id}`}
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `radial-gradient(circle at ${event.spotlightX || PREVIEW_DEFAULTS.SPOTLIGHT_X}% ${event.spotlightY || PREVIEW_DEFAULTS.SPOTLIGHT_Y}%,
                  transparent ${event.highlightRadius || PREVIEW_DEFAULTS.HIGHLIGHT_RADIUS}px,
                  rgba(0, 0, 0, ${(event.dimPercentage || PREVIEW_DEFAULTS.DIM_PERCENTAGE) / 100}) 100%)`,
                zIndex: Z_INDEX.PREVIEW_SPOTLIGHT
              }}
            />
          );

        case InteractionType.SHOW_TEXT:
        case InteractionType.SHOW_MESSAGE:
          return (
            <div
              key={`preview-text-${event.id}`}
              className="absolute bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-lg pointer-events-none"
              style={{
                left: `${event.textX || PREVIEW_DEFAULTS.TEXT_X}%`,
                top: `${event.textY || PREVIEW_DEFAULTS.TEXT_Y}%`,
                transform: 'translate(-50%, -50%)',
                maxWidth: PREVIEW_DEFAULTS.MAX_WIDTH,
                zIndex: Z_INDEX.PREVIEW_TEXT
              }}
            >
              <div className="text-white text-sm">{event.message || event.textContent}</div>
            </div>
          );

        case InteractionType.PAN_ZOOM:
        case InteractionType.PAN_ZOOM_TO_HOTSPOT:
          // Apply zoom preview effect
          return (
            <div
              key={`preview-zoom-${event.id}`}
              className="absolute pointer-events-none border-2 border-blue-400 rounded"
              style={{
                left: `${(event.targetX || PREVIEW_DEFAULTS.TARGET_X) - PREVIEW_DEFAULTS.ZOOM_PREVIEW_WIDTH_PERCENT / 2}%`,
                top: `${(event.targetY || PREVIEW_DEFAULTS.TARGET_Y) - PREVIEW_DEFAULTS.ZOOM_PREVIEW_HEIGHT_PERCENT / 2}%`,
                width: `${PREVIEW_DEFAULTS.ZOOM_PREVIEW_WIDTH_PERCENT}%`,
                height: `${PREVIEW_DEFAULTS.ZOOM_PREVIEW_HEIGHT_PERCENT}%`,
                zIndex: Z_INDEX.PREVIEW_ZOOM
              }}
            />
          );

        default:
          return null;
      }
    });
  };

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
      (e.type === InteractionType.SPOTLIGHT ||
       e.type === InteractionType.PAN_ZOOM_TO_HOTSPOT)
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
        console.log('Debug [ImageEditCanvas]: Click handler called', {
          target: e.target,
          currentTarget: e.currentTarget,
          isPlacingHotspot,
          timestamp: Date.now()
        });

        // If currently placing a hotspot and the click is on the canvas background (not a hotspot itself)
        if (isPlacingHotspot && onPlaceNewHotspot && actualImageRef.current) {
          const target = e.target as HTMLElement;
          
          const isClickingOnHotspot = target.closest('[data-hotspot-id]') !== null;
          
          if (!isClickingOnHotspot) {
            const img = actualImageRef.current;
            const rect = img.getBoundingClientRect();

            // Click position relative to the <img> element's bounding box
            const clickXInBox = e.clientX - rect.left;
            const clickYInBox = e.clientY - rect.top;

            const { naturalWidth, naturalHeight } = img;
            const { width: displayedWidth, height: displayedHeight } = rect;

            // Calculate the dimensions and offset of the actual image content
            const naturalAspectRatio = naturalWidth / naturalHeight;
            const displayedAspectRatio = displayedWidth / displayedHeight;

            let contentWidth = displayedWidth;
            let contentHeight = displayedHeight;
            let offsetX = 0;
            let offsetY = 0;

            if (naturalAspectRatio > displayedAspectRatio) {
              // Letterboxed (empty space top/bottom)
              contentHeight = displayedWidth / naturalAspectRatio;
              offsetY = (displayedHeight - contentHeight) / 2;
            } else {
              // Pillarboxed (empty space left/right)
              contentWidth = displayedHeight * naturalAspectRatio;
              offsetX = (displayedWidth - contentWidth) / 2;
            }

            // Ignore clicks in the empty padded area
            if (
              clickXInBox < offsetX || clickXInBox > offsetX + contentWidth ||
              clickYInBox < offsetY || clickYInBox > offsetY + contentHeight
            ) {
              return;
            }
            
            // Adjust click coordinates to be relative to the image content itself
            const clickXInContent = clickXInBox - offsetX;
            const clickYInContent = clickYInBox - offsetY;

            // Calculate final relative coordinates based on content dimensions
            const relativeX = clickXInContent / contentWidth;
            const relativeY = clickYInContent / contentHeight;

            const finalXPercent = Math.max(0, Math.min(100, relativeX * 100));
            const finalYPercent = Math.max(0, Math.min(100, relativeY * 100));

            console.log('Debug [ImageEditCanvas]: Hotspot placement with letterbox handling:', {
              click: { x: clickXInBox, y: clickYInBox },
              content: { width: contentWidth, height: contentHeight, offsetX, offsetY },
              relative: { x: relativeX, y: relativeY },
              final: { x: finalXPercent, y: finalYPercent }
            });

            onPlaceNewHotspot(finalXPercent, finalYPercent);
            e.stopPropagation();
            return;
          }
        }
        
        // Default behavior if not placing a hotspot
        console.log('Debug [ImageEditCanvas]: Container click detected (default)', {
          target: e.target,
          currentTarget: e.currentTarget,
          isEditing,
          isPlacingHotspot,
          timestamp: Date.now()
        });
        
        // Only call the background click handler if we're not in placement mode
        if (!isPlacingHotspot) {
          onImageOrHotspotClick && onImageOrHotspotClick(e);
        }
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
            {backgroundImage && (
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
                onError={() => {
                  console.error('Failed to load background image in editor:', backgroundImage);
                }}
                draggable={false}
              />
            )}

            {/* Highlight overlay - ensure it's within the scaled container */}
            {highlightedHotspotId && backgroundImage && activeHotspotDisplayIds.has(highlightedHotspotId) && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={getHighlightGradientStyle()}
                aria-hidden="true"
              />
            )}

            {/* Hotspots */}
            {(() => {
              console.log('Debug [ImageEditCanvas]: Rendering hotspots', {
                hotspotsCount: hotspotsWithPositions.length,
                isEditing,
                hotspotIds: hotspotsWithPositions.map(h => h.id),
                timestamp: Date.now()
              });
              return hotspotsWithPositions.map(hotspot => (
              <div
                key={hotspot.id}
                className="hotspot-viewer"
                style={{
                  touchAction: isMobile ? 'none' : 'auto', // Better mobile drag performance
                  pointerEvents: 'auto', // Ensure pointer events are enabled
                  zIndex: isEditing ? Z_INDEX.MODAL : Z_INDEX.HOTSPOTS // Higher z-index in editing mode for better interaction
                }}
              >
                <HotspotViewer
                  hotspot={hotspot}
                  pixelPosition={hotspot.pixelPosition}
                  usePixelPositioning={!!hotspot.pixelPosition && !isMobile}
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
            ));
            })()}

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
                  
                  if (previewOverlayEvent.type === InteractionType.SPOTLIGHT) {
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

        {/* Preview Overlays */}
        {renderPreviewOverlays()}
      </div>
    </div>
  );
});

export default ImageEditCanvas;

// Need to ensure MemoizedHotspotViewer is exported from './HotspotViewer'
// Example export in HotspotViewer.tsx:
// export const MemoizedHotspotViewer = React.memo(HotspotViewer);
// export default HotspotViewer; (or just export default React.memo(HotspotViewer))
