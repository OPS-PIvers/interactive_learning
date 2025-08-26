import React, { useState, useEffect, useCallback, useRef } from 'react';
import { InteractiveSlide, SlideElement, BackgroundMedia } from '../../../shared/slideTypes';
import { Project } from '../../../shared/types';
import { extractYouTubeVideoId } from '../../utils/videoUtils';
import { EffectExecutor } from '../../utils/EffectExecutor';
import { generateHotspotId } from '../../utils/generateId';
import SlideCanvas from '../slides/SlideCanvas';
import SlideEditorToolbar from '../toolbars/SlideEditorToolbar';
import EditorFooterControls from '../toolbars/EditorFooterControls';
import PropertiesPanel from '../panels/PropertiesPanel';
import { EditorStateProvider, useEditorState } from '../../contexts/EditorStateContext';
import classNames from 'classnames';

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

// Separate the inner component that uses the context
const ModernSlideEditorInner: React.FC<ModernSlideEditorProps> = ({
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
  const {
    state,
    selectElements,
    clearSelection,
    undo,
    redo,
    markDirty,
    setCurrentSlide
  } = useEditorState();

  // Sync slide changes with editor state
  useEffect(() => {
    setCurrentSlide(slide);
  }, [slide, setCurrentSlide]);
  const effectExecutorRef = useRef<EffectExecutor | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  const [aspectRatio, setAspectRatio] = useState(slide.layout?.aspectRatio || '16:9');
  const [developmentMode, setDevelopmentMode] = useState<'desktop' | 'mobile'>('desktop');
  const [editingHotspot, setEditingHotspot] = useState<Hotspot | null>(null);
  const [isPreview, setIsPreview] = useState(false);

  // Get selected element from editor state
  const selectedElement = state.selectedElements.length > 0 
    ? slide.elements.find(el => el.id === state.selectedElements[0]) || null
    : null;

  const handleDeleteHotspot = useCallback((hotspotId: string) => {
    const updatedElements = slide.elements.filter(
      (element: SlideElement) => element.id !== hotspotId
    );
    onSlideChange({
      ...slide,
      elements: updatedElements,
    });
    clearSelection();
    markDirty();
  }, [slide, onSlideChange, clearSelection, markDirty]);

  useEffect(() => {
    if (canvasContainerRef.current && !effectExecutorRef.current) {
      effectExecutorRef.current = new EffectExecutor(canvasContainerRef.current);
    }
  }, []);

  const hotspots: Hotspot[] = slide.elements.map((element: SlideElement) => ({
    id: element.id,
    relativePosition: {
      x: (element.position?.[developmentMode]?.x || 0) / 800,
      y: (element.position?.[developmentMode]?.y || 0) / 600,
      width: (element.position?.[developmentMode]?.width || 40) / 800,
      height: (element.position?.[developmentMode]?.height || 40) / 600,
    },
    element
  }));

  const handleBackgroundChange = useCallback((background: BackgroundMedia) => {
    onSlideChange({ ...slide, backgroundMedia: background });
    markDirty();
  }, [slide, onSlideChange, markDirty]);

  const handleBackgroundImageChange = useCallback((url: string) => {
    const currentType = slide.backgroundMedia?.type || 'image';
    const youtubeId = currentType === 'youtube' ? extractYouTubeVideoId(url) : null;
    handleBackgroundChange({
      type: currentType,
      url: url,
      ...(youtubeId && { youtubeId })
    });
  }, [slide.backgroundMedia, handleBackgroundChange]);

  const handleBackgroundTypeChange = useCallback((type: 'image' | 'video') => {
    handleBackgroundChange({ type, url: slide.backgroundMedia?.url || '' });
  }, [slide.backgroundMedia, handleBackgroundChange]);

  const handleBackgroundVideoTypeChange = useCallback((videoType: 'youtube' | 'mp4') => {
    const url = slide.backgroundMedia?.url || '';
    const youtubeId = videoType === 'youtube' ? extractYouTubeVideoId(url) : null;
    handleBackgroundChange({
      type: videoType === 'youtube' ? 'youtube' : 'video',
      url: url,
      ...(youtubeId && { youtubeId })
    });
  }, [slide.backgroundMedia, handleBackgroundChange]);

  const handleAspectRatioChange = useCallback((newRatio: string) => {
    setAspectRatio(newRatio);
    onSlideChange({ ...slide, layout: { ...slide.layout, aspectRatio: newRatio } });
    markDirty();
  }, [slide, onSlideChange, markDirty]);

  const handleHotspotAdd = useCallback((relativePosition: RelativePosition) => {
    const newElement: SlideElement = {
      id: generateHotspotId(),
      type: 'hotspot',
      position: {
        desktop: { x: relativePosition.x * 800, y: relativePosition.y * 600, width: relativePosition.width * 800, height: relativePosition.height * 600 },
        tablet: { x: relativePosition.x * 600, y: relativePosition.y * 450, width: relativePosition.width * 600, height: relativePosition.height * 450 },
        mobile: { x: relativePosition.x * 375, y: relativePosition.y * 667, width: relativePosition.width * 375, height: relativePosition.height * 667 }
      },
      content: { title: `Hotspot ${slide.elements.length + 1}`, description: 'New hotspot' },
      interactions: [],
      style: { backgroundColor: '#3b82f6', borderColor: '#1e40af', borderWidth: 2, opacity: 1 },
      isVisible: true
    };
    onSlideChange({ ...slide, elements: [...slide.elements, newElement] });
    selectElements(newElement.id);
    markDirty();
  }, [slide, onSlideChange]);

  const handleAddHotspotClick = useCallback(() => {
    const centerRelativePosition: RelativePosition = { x: 0.45, y: 0.45, width: 0.1, height: 0.1 };
    handleHotspotAdd(centerRelativePosition);
  }, [handleHotspotAdd]);

  const handleElementUpdate = useCallback((elementId: string, updates: Partial<SlideElement>) => {
    const updatedElements = slide.elements.map((el) => 
      el.id === elementId ? { ...el, ...updates } : el
    );
    onSlideChange({ ...slide, elements: updatedElements });
    markDirty();
  }, [slide, onSlideChange, markDirty]);

  const handleSlideUpdate = useCallback((updates: Partial<InteractiveSlide>) => {
    onSlideChange({ ...slide, ...updates });
    markDirty();
  }, [slide, onSlideChange, markDirty]);

  const handleHotspotDrag = useCallback((hotspotId: string, newRelativePosition: RelativePosition) => {
    const updatedElements = slide.elements.map((element) => {
      if (element.id === hotspotId) {
        return {
          ...element,
          position: {
            desktop: { x: newRelativePosition.x * 800, y: newRelativePosition.y * 600, width: newRelativePosition.width * 800, height: newRelativePosition.height * 600 },
            tablet: { x: newRelativePosition.x * 600, y: newRelativePosition.y * 450, width: newRelativePosition.width * 600, height: newRelativePosition.height * 450 },
            mobile: { x: newRelativePosition.x * 375, y: newRelativePosition.y * 667, width: newRelativePosition.width * 375, height: newRelativePosition.height * 667 }
          }
        };
      }
      return element;
    });
    onSlideChange({ ...slide, elements: updatedElements });
    markDirty();
  }, [slide, onSlideChange, markDirty]);

  const handleHotspotClick = useCallback((hotspot: Hotspot) => {
    selectElements(hotspot.id);
  }, [selectElements]);

  const handleCanvasClick = useCallback(() => {
    clearSelection();
  }, [clearSelection]);

  const handleHotspotSave = useCallback((updatedHotspot: SlideElement) => {
    const updatedElements = slide.elements.map((el) => el.id === updatedHotspot.id ? updatedHotspot : el);
    onSlideChange({ ...slide, elements: updatedElements });
    setEditingHotspot(null);
    markDirty();
  }, [slide, onSlideChange, markDirty]);

  const [aspectWidth, aspectHeight] = aspectRatio.split(':').map(Number);
  const canvasStyle = {
    aspectRatio: `${aspectWidth} / ${aspectHeight}`
  };

  return (
    <div {...divProps} className={classNames('slide-editor', divProps.className)} data-testid="modern-slide-editor">
      <header className="slide-editor__header">
        {project && (
          <SlideEditorToolbar
            projectName={projectName}
            onSave={onSave}
            onClose={onClose}
            isSaving={isSaving}
            isPublished={isPublished}
            onImageUpload={onImageUpload}
            project={project}
            onTogglePreview={() => setIsPreview(!isPreview)}
            onLivePreview={onLivePreview}
            isPreview={isPreview}
            {...(state.selectedElements.length > 0 && { selectedHotspotId: state.selectedElements[0] })}
            onDeleteHotspot={handleDeleteHotspot}
            onUndo={undo}
            onRedo={redo}
            canUndo={state.undoHistory.length > 0}
            canRedo={state.redoHistory.length > 0}
          />
        )}
      </header>
      
      <main className="slide-editor__main">
        <div className="canvas-area">
          <div className="canvas-wrapper" style={canvasStyle}>
            <div ref={canvasContainerRef} className="slide-canvas">
              <SlideCanvas
                background={slide.backgroundMedia}
                hotspots={hotspots}
                aspectRatio={aspectRatio}
                developmentMode={developmentMode}
                onHotspotClick={handleHotspotClick}
                onHotspotDrag={handleHotspotDrag}
                onCanvasClick={handleCanvasClick}
                selectedElementIds={state.selectedElements}
              />
            </div>
          </div>
        </div>
        
        {/* Properties Panel */}
        <PropertiesPanel
          selectedElement={selectedElement}
          onElementUpdate={handleElementUpdate}
          currentSlide={slide}
          onSlideUpdate={handleSlideUpdate}
        />
      </main>

      <footer className="slide-editor__footer">
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
      </footer>

    </div>
  );
};

// Main component that provides the context
export const ModernSlideEditor: React.FC<ModernSlideEditorProps> = (props) => {
  return (
    <EditorStateProvider initialSlide={props.slide}>
      <ModernSlideEditorInner {...props} />
    </EditorStateProvider>
  );
};

export default ModernSlideEditor;
