import React, { useState, useEffect, useCallback, useRef } from 'react';
import { InteractiveSlide, SlideElement, BackgroundMedia } from '../../../shared/slideTypes';
import { Project } from '../../../shared/types';
import { extractYouTubeVideoId } from '../../../shared/types';
import { EffectExecutor } from '../../utils/EffectExecutor';
import { generateId } from '../../utils/generateId';
import SlideCanvas from '../slides/SlideCanvas';
import SlideEditorToolbar from '../toolbars/SlideEditorToolbar';
import EditorFooterControls from '../toolbars/EditorFooterControls';
import HotspotEditorModal from '../modals/editors/HotspotEditorModal';
import { UnifiedEditorState, EditorStateActions } from '../../hooks/useUnifiedEditorState';

interface RelativePosition {
  x: number; // 0-1 (percentage of canvas width)
  y: number; // 0-1 (percentage of canvas height)
  width: number; // 0-1 (percentage of canvas width)
  height: number; // 0-1 (percentage of canvas height)
}

interface Hotspot {
  id: string;
  relativePosition: RelativePosition;
  element: SlideElement;
}

interface ModernSlideEditorProps extends React.HTMLAttributes<HTMLDivElement> {
  slide: InteractiveSlide;
  onSlideChange: (slide: InteractiveSlide) => void;
  projectName: string;
  onSave: () => Promise<void>;
  onClose: () => void;
  isSaving: boolean;
  isPublished: boolean;
  onImageUpload: (file: File) => void;
  project?: Project;
  onLivePreview: () => void;
}

/**
 * ModernSlideEditor - Modern centered slide editor with new UI design
 * 
 * Features:
 * - Matches the design from the HTML mockup with dark blue theme
 * - Centered canvas with aspect ratio overlay badge
 * - Footer controls for Background, Aspect Ratio, and Add Hotspot
 * - Integrated with existing effect execution system
 * - Responsive design that works across all devices
 */
export const ModernSlideEditor: React.FC<ModernSlideEditorProps> = ({
  slide,
  onSlideChange,
  projectName,
  onSave,
  onClose,
  isSaving,
  isPublished,
  onImageUpload,
  project,
  onLivePreview,
  ...divProps
}) => {
  const effectExecutorRef = useRef<EffectExecutor | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // Editor state
  const [aspectRatio, setAspectRatio] = useState(slide.layout?.aspectRatio || '16:9');
  const [developmentMode, setDevelopmentMode] = useState<'desktop' | 'mobile'>('desktop');
  const [selectedHotspotId, setSelectedHotspotId] = useState<string>();
  const [editingHotspot, setEditingHotspot] = useState<Hotspot | null>(null);
  const [isPreview, setIsPreview] = useState(false);
  
  const handleDeleteHotspot = useCallback((hotspotId: string) => {
    const updatedElements = slide.elements.filter(
      (element: SlideElement) => element.id !== hotspotId
    );
    onSlideChange({
      ...slide,
      elements: updatedElements,
    });
    setSelectedHotspotId(undefined);
  }, [slide, onSlideChange]);

  // Initialize EffectExecutor
  useEffect(() => {
    if (canvasContainerRef.current && !effectExecutorRef.current) {
      effectExecutorRef.current = new EffectExecutor(canvasContainerRef.current);
    }
  }, []);

  // Convert slide elements to hotspots
  const hotspots: Hotspot[] = slide.elements.map((element: SlideElement) => ({
    id: element.id,
    relativePosition: {
      x: (element.position?.[developmentMode]?.x || 0) / 800, // Assuming 800px base width
      y: (element.position?.[developmentMode]?.y || 0) / 600, // Assuming 600px base height
      width: (element.position?.[developmentMode]?.width || 40) / 800,
      height: (element.position?.[developmentMode]?.height || 40) / 600,
    },
    element
  }));

  // Update slide when background changes
  const handleBackgroundChange = useCallback((background: BackgroundMedia) => {
    const updatedSlide = {
      ...slide,
      backgroundMedia: background
    };
    onSlideChange(updatedSlide);
  }, [slide, onSlideChange]);

  // Handle background image change
  const handleBackgroundImageChange = useCallback((url: string) => {
    const currentType = slide.backgroundMedia?.type || 'image';
    const youtubeId = currentType === 'youtube' ? extractYouTubeVideoId(url) : null;
    const background: BackgroundMedia = {
      type: currentType,
      url: url,
      ...(youtubeId && { youtubeId })
    };
    handleBackgroundChange(background);
  }, [slide.backgroundMedia, handleBackgroundChange]);

  // Handle background type change
  const handleBackgroundTypeChange = useCallback((type: 'image' | 'video') => {
    const background: BackgroundMedia = {
      type,
      url: slide.backgroundMedia?.url || ''
    };
    handleBackgroundChange(background);
  }, [slide.backgroundMedia, handleBackgroundChange]);

  // Handle background video type change - for YouTube vs regular video
  const handleBackgroundVideoTypeChange = useCallback((videoType: 'youtube' | 'mp4') => {
    const url = slide.backgroundMedia?.url || '';
    const youtubeId = videoType === 'youtube' ? extractYouTubeVideoId(url) : null;
    const background: BackgroundMedia = {
      type: videoType === 'youtube' ? 'youtube' : 'video',
      url: url,
      ...(youtubeId && { youtubeId })
    };
    handleBackgroundChange(background);
  }, [slide.backgroundMedia, handleBackgroundChange]);

  // Update slide when aspect ratio changes
  const handleAspectRatioChange = useCallback((newRatio: string) => {
    setAspectRatio(newRatio);
    const updatedSlide = {
      ...slide,
      layout: {
        ...slide.layout,
        aspectRatio: newRatio
      }
    };
    onSlideChange(updatedSlide);
  }, [slide, onSlideChange]);

  // Add new hotspot
  const handleHotspotAdd = useCallback((relativePosition: RelativePosition) => {
    const newElement: SlideElement = {
      id: generateId(),
      type: 'hotspot',
      position: {
        desktop: {
          x: relativePosition.x * 800,
          y: relativePosition.y * 600,
          width: relativePosition.width * 800,
          height: relativePosition.height * 600,
        },
        tablet: {
          x: relativePosition.x * 600,
          y: relativePosition.y * 450,
          width: relativePosition.width * 600,
          height: relativePosition.height * 450,
        },
        mobile: {
          x: relativePosition.x * 375,
          y: relativePosition.y * 667,
          width: relativePosition.width * 375,
          height: relativePosition.height * 667,
        }
      },
      content: {
        title: `Hotspot ${slide.elements.length + 1}`,
        description: 'New hotspot'
      },
      interactions: [],
      style: {
        backgroundColor: '#3b82f6',
        borderColor: '#1e40af',
        borderWidth: 2,
        opacity: 1
      },
      isVisible: true
    };

    const updatedSlide = {
      ...slide,
      elements: [...slide.elements, newElement]
    };
    onSlideChange(updatedSlide);
    setSelectedHotspotId(newElement.id);
  }, [slide, onSlideChange]);

  // Handle "Add Hotspot" button click - open hotspot editor
  const handleAddHotspotClick = useCallback(() => {
    // For now, create a default hotspot in the center and open editor
    const centerRelativePosition: RelativePosition = {
      x: 0.45, // Center horizontally
      y: 0.45, // Center vertically
      width: 0.1,
      height: 0.1
    };
    
    handleHotspotAdd(centerRelativePosition);
    
    // Find the newly created hotspot and open editor
    setTimeout(() => {
      const newHotspot = hotspots[hotspots.length - 1];
      if (newHotspot) {
        setEditingHotspot(newHotspot);
      }
    }, 100);
  }, [handleHotspotAdd, hotspots]);

  // Update hotspot position when dragged
  const handleHotspotDrag = useCallback((hotspotId: string, newRelativePosition: RelativePosition) => {
    const updatedElements = slide.elements.map((element: SlideElement) => {
      if (element.id === hotspotId) {
        return {
          ...element,
          position: {
            desktop: {
              x: newRelativePosition.x * 800,
              y: newRelativePosition.y * 600,
              width: newRelativePosition.width * 800,
              height: newRelativePosition.height * 600,
            },
            tablet: {
              x: newRelativePosition.x * 600,
              y: newRelativePosition.y * 450,
              width: newRelativePosition.width * 600,
              height: newRelativePosition.height * 450,
            },
            mobile: {
              x: newRelativePosition.x * 375,
              y: newRelativePosition.y * 667,
              width: newRelativePosition.width * 375,
              height: newRelativePosition.height * 667,
            }
          }
        };
      }
      return element;
    });

    onSlideChange({
      ...slide,
      elements: updatedElements
    });
  }, [slide, onSlideChange]);

  // Handle hotspot click (open editor)
  const handleHotspotClick = useCallback((hotspot: Hotspot) => {
    setEditingHotspot(hotspot);
  }, []);

  // Save hotspot from editor
  const handleHotspotSave = useCallback((updatedHotspot: SlideElement) => {
    const updatedElements = slide.elements.map((element: SlideElement) =>
      element.id === updatedHotspot.id ? updatedHotspot : element
    );

    onSlideChange({
      ...slide,
      elements: updatedElements
    });

    setEditingHotspot(null);
  }, [slide, onSlideChange]);

  // Calculate canvas dimensions based on aspect ratio and available viewport space
  const getCanvasDimensions = () => {
    const aspectParts = aspectRatio.split(':');
    const w = Number(aspectParts[0]);
    const h = Number(aspectParts[1]);
    
    if (!w || !h) {
      return { width: 800, height: 600 }; // Default fallback
    }
    
    // Calculate available space accounting for header and footer
    const headerHeight = 60; // SlideEditorToolbar height
    const footerHeight = 60; // EditorFooterControls height
    const padding = 32; // 16px padding on each side (p-4)
    
    const availableWidth = window.innerWidth - padding;
    const availableHeight = window.innerHeight - headerHeight - footerHeight - padding;
    
    // Use 90% of available space for better visual spacing
    const maxWidth = Math.min(availableWidth * 0.9, 1400);
    const maxHeight = availableHeight * 0.9;
    
    let width, height;
    
    if (maxWidth / maxHeight > w / h) {
      // Height constrained
      height = maxHeight;
      width = (height * w) / h;
    } else {
      // Width constrained  
      width = maxWidth;
      height = (width * h) / w;
    }
    
    return { width, height };
  };

  const canvasDimensions = getCanvasDimensions();

  return (
    <div 
      {...divProps}
      className={`modern-slide-editor ${divProps.className || ''}`}
      style={{
        height: '100vh',
        minHeight: '100vh',
        maxHeight: '100vh',
        width: '100vw',
        overflow: 'hidden',
        position: 'fixed',
        inset: '0',
        backgroundColor: '#1d2a5d', // Primary background color
        contain: 'layout style',
        isolation: 'isolate',
        display: 'flex',
        flexDirection: 'column'
      }}
      data-testid="modern-slide-editor"
    >
      {/* Header Toolbar */}
      <SlideEditorToolbar
        projectName={projectName}
        onSave={onSave}
        onClose={onClose}
        isSaving={isSaving}
        isPublished={isPublished}
        onImageUpload={onImageUpload}
        project={project!}
        onTogglePreview={() => setIsPreview(!isPreview)}
        onLivePreview={onLivePreview}
        isPreview={isPreview}
        selectedHotspotId={selectedHotspotId}
        onDeleteHotspot={handleDeleteHotspot}
      />
      
      {/* Main Canvas Area */}
      <main className="flex-1 flex items-center justify-center p-4 bg-[#1d2a5d] overflow-hidden">
        <div className="w-full h-full flex items-center justify-center">
          <div 
            className="relative shadow-2xl rounded-lg overflow-hidden"
            style={{
              width: canvasDimensions.width,
              height: canvasDimensions.height,
            }}
          >
            {/* Aspect Ratio Badge */}
            <div className="absolute top-0 right-0 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-bl-lg z-10">
              {developmentMode} - {aspectRatio}
            </div>
            
            {/* Canvas Container */}
            <div 
              ref={canvasContainerRef} 
              className="w-full h-full touch-manipulation" 
              style={{ 
                touchAction: 'pan-x pan-y',
                contain: 'layout style paint',
                isolation: 'isolate',
                position: 'relative'
              }}
            >
              <SlideCanvas
                background={slide.backgroundMedia}
                hotspots={hotspots}
                aspectRatio={aspectRatio}
                developmentMode={developmentMode}
                onHotspotClick={handleHotspotClick}
                onHotspotDrag={handleHotspotDrag}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Footer Controls */}
      <EditorFooterControls
        backgroundImage={slide.backgroundMedia?.url || ''}
        backgroundType={(slide.backgroundMedia?.type === 'image' || slide.backgroundMedia?.type === 'video') ? slide.backgroundMedia.type : 'image'}
        backgroundVideoType={(slide.backgroundMedia?.type === 'youtube') ? 'youtube' : 'mp4'}
        onBackgroundImageChange={handleBackgroundImageChange}
        onBackgroundTypeChange={handleBackgroundTypeChange}
        onBackgroundVideoTypeChange={handleBackgroundVideoTypeChange}
        onReplaceImage={onImageUpload}
        aspectRatio={aspectRatio}
        developmentMode={developmentMode}
        onAspectRatioChange={handleAspectRatioChange}
        onDevelopmentModeChange={setDevelopmentMode}
        onAddHotspot={handleAddHotspotClick}
      />

      {/* Hotspot Editor Modal */}
      {editingHotspot && (
        <HotspotEditorModal
          hotspot={editingHotspot.element}
          isOpen={true}
          onClose={() => setEditingHotspot(null)}
          onSave={handleHotspotSave}
          onDelete={(hotspotId) => {
            const updatedElements = slide.elements.filter((element: SlideElement) => element.id !== hotspotId);
            onSlideChange({
              ...slide,
              elements: updatedElements
            });
            setEditingHotspot(null);
          }}
        />
      )}
    </div>
  );
};

export default ModernSlideEditor;