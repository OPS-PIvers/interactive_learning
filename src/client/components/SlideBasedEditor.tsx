import React, { useState, useCallback, useMemo } from 'react';
import { SlideDeck, InteractiveSlide, SlideElement } from '../../shared/slideTypes';
import { MigrationResult } from '../../shared/migrationUtils';
import { useIsMobile } from '../hooks/useIsMobile';
import { useDeviceDetection } from '../hooks/useDeviceDetection';
import { SlideEditor } from './slides/SlideEditor';
import EditorToolbar from './EditorToolbar';
import { generateId } from '../utils/generateId';

interface SlideBasedEditorProps {
  slideDeck: SlideDeck;
  projectName: string;
  projectId?: string;
  onSlideDeckChange: (slideDeck: SlideDeck) => void;
  onSave: () => Promise<void>;
  onImageUpload: (file: File) => Promise<void>;
  onClose: () => void;
  isPublished: boolean;
  migrationResult?: MigrationResult | null;
}

/**
 * SlideBasedEditor - Visual editor for creating and editing slide-based content
 * 
 * Provides a comprehensive editing interface for slide decks with drag-and-drop,
 * properties panels, and real-time preview capabilities.
 */
const SlideBasedEditor: React.FC<SlideBasedEditorProps> = ({
  slideDeck,
  projectName,
  projectId,
  onSlideDeckChange,
  onSave,
  onImageUpload,
  onClose,
  isPublished,
  migrationResult
}) => {
  const isMobile = useIsMobile();
  const { deviceType } = useDeviceDetection();
  
  // Editor state
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const currentSlide = slideDeck.slides[currentSlideIndex];

  // Handle slide changes
  const handleSlideChange = useCallback((slideIndex: number) => {
    setCurrentSlideIndex(slideIndex);
    setSelectedElementId(null);
  }, []);

  // Handle slide deck updates
  const handleSlideDeckUpdate = useCallback((newSlideDeck: SlideDeck) => {
    onSlideDeckChange(newSlideDeck);
  }, [onSlideDeckChange]);

  // Add new slide
  const handleAddSlide = useCallback(() => {
    const newSlide: InteractiveSlide = {
      id: generateId(),
      title: `Slide ${slideDeck.slides.length + 1}`,
      elements: [],
      transitions: [],
      layout: {
        containerWidth: 1200,
        containerHeight: 800,
        aspectRatio: '16:9',
        scaling: 'fit',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }
    };

    const updatedSlideDeck: SlideDeck = {
      ...slideDeck,
      slides: [...slideDeck.slides, newSlide],
      metadata: {
        ...slideDeck.metadata,
        modified: Date.now()
      }
    };

    handleSlideDeckUpdate(updatedSlideDeck);
    setCurrentSlideIndex(slideDeck.slides.length);
  }, [slideDeck, handleSlideDeckUpdate]);

  // Delete slide
  const handleDeleteSlide = useCallback((slideIndex: number) => {
    if (slideDeck.slides.length <= 1) return; // Don't delete the last slide

    const updatedSlides = slideDeck.slides.filter((_, index) => index !== slideIndex);
    const newCurrentIndex = slideIndex >= updatedSlides.length ? updatedSlides.length - 1 : slideIndex;

    const updatedSlideDeck: SlideDeck = {
      ...slideDeck,
      slides: updatedSlides,
      metadata: {
        ...slideDeck.metadata,
        modified: Date.now()
      }
    };

    handleSlideDeckUpdate(updatedSlideDeck);
    setCurrentSlideIndex(newCurrentIndex);
  }, [slideDeck, handleSlideDeckUpdate]);

  // Add element to current slide
  const handleAddElement = useCallback((elementType: 'hotspot' | 'text' | 'media' | 'shape') => {
    const newElement: SlideElement = {
      id: generateId(),
      type: elementType,
      position: {
        desktop: { x: 100, y: 100, width: 100, height: 100 },
        tablet: { x: 80, y: 80, width: 80, height: 80 },
        mobile: { x: 60, y: 60, width: 60, height: 60 }
      },
      content: {
        title: `New ${elementType}`,
        description: `Description for ${elementType}`
      },
      interactions: [],
      style: {
        backgroundColor: '#3b82f6',
        borderRadius: elementType === 'hotspot' ? 50 : 8,
        opacity: 0.9
      },
      isVisible: true
    };

    const updatedSlide: InteractiveSlide = {
      ...currentSlide,
      elements: [...currentSlide.elements, newElement]
    };

    const updatedSlides = slideDeck.slides.map((slide, index) =>
      index === currentSlideIndex ? updatedSlide : slide
    );

    const updatedSlideDeck: SlideDeck = {
      ...slideDeck,
      slides: updatedSlides,
      metadata: {
        ...slideDeck.metadata,
        modified: Date.now()
      }
    };

    handleSlideDeckUpdate(updatedSlideDeck);
    setSelectedElementId(newElement.id);
  }, [currentSlide, currentSlideIndex, slideDeck, handleSlideDeckUpdate]);

  // Save functionality
  const handleSaveProject = useCallback(async () => {
    setIsSaving(true);
    try {
      await onSave();
      
      if (process.env.NODE_ENV === 'development') {
        console.log('[SlideBasedEditor] Project saved successfully');
      }
    } catch (error) {
      console.error('[SlideBasedEditor] Save failed:', error);
    } finally {
      setIsSaving(false);
    }
  }, [onSave]);

  // Toggle preview mode
  const handleTogglePreview = useCallback(() => {
    setIsPreviewMode(prev => !prev);
    setSelectedElementId(null);
  }, []);

  // Enhanced slide deck for editor
  const editorSlideDeck = useMemo(() => ({
    ...slideDeck,
    settings: {
      ...slideDeck.settings,
      autoAdvance: false,
      allowNavigation: true,
      showProgress: false,
      showControls: false,
      keyboardShortcuts: true,
      touchGestures: isMobile,
      fullscreenMode: false
    }
  }), [slideDeck, isMobile]);

  return (
    <div className="slide-editor w-screen h-screen flex flex-col bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 text-white p-4 flex items-center justify-between shadow-2xl">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
            {projectName} - Editor
          </h1>
          {migrationResult && (
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-3 py-1 rounded-lg text-xs font-semibold text-white shadow-lg">
              MIGRATED TO SLIDES
            </div>
          )}
          <div className="bg-gradient-to-r from-orange-500 to-red-600 px-3 py-1 rounded-lg text-xs font-semibold text-white shadow-lg">
            {isPreviewMode ? 'PREVIEW' : 'EDIT'} MODE
          </div>
        </div>
        
        <EditorToolbar
          projectName={projectName}
          onSave={handleSaveProject}
          onClose={onClose}
          isSaving={isSaving}
          isPublished={isPublished}
          onImageUpload={onImageUpload}
          isMobile={isMobile}
        />
      </div>

      {/* Main editor content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Slide navigation panel */}
        <div className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col">
          {/* Slide list header */}
          <div className="p-4 border-b border-slate-700">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-semibold">Slides</h3>
              <button
                className="slide-nav-button slide-nav-button-primary text-sm px-3 py-1"
                onClick={handleAddSlide}
              >
                + Add
              </button>
            </div>
            
            {/* Mode toggle */}
            <button
              className={`w-full text-sm px-3 py-2 rounded-lg transition-all duration-200 ${
                isPreviewMode 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
              }`}
              onClick={handleTogglePreview}
            >
              {isPreviewMode ? '✏️ Edit Mode' : '👁️ Preview Mode'}
            </button>
          </div>

          {/* Slide list */}
          <div className="flex-1 overflow-y-auto p-2">
            {slideDeck.slides.map((slide, index) => (
              <div
                key={slide.id}
                className={`p-3 mb-2 rounded-lg cursor-pointer transition-all duration-200 ${
                  index === currentSlideIndex
                    ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-white'
                    : 'bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white'
                }`}
                onClick={() => handleSlideChange(index)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">{slide.title}</div>
                    <div className="text-xs opacity-70">{slide.elements.length} elements</div>
                  </div>
                  
                  {slideDeck.slides.length > 1 && (
                    <button
                      className="text-red-400 hover:text-red-300 text-xs p-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSlide(index);
                      }}
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Element tools */}
          {!isPreviewMode && (
            <div className="p-4 border-t border-slate-700">
              <h4 className="text-white font-medium mb-3 text-sm">Add Elements</h4>
              <div className="grid grid-cols-2 gap-2">
                <button
                  className="slide-nav-button text-xs p-2"
                  onClick={() => handleAddElement('hotspot')}
                >
                  🎯 Hotspot
                </button>
                <button
                  className="slide-nav-button text-xs p-2"
                  onClick={() => handleAddElement('text')}
                >
                  📝 Text
                </button>
                <button
                  className="slide-nav-button text-xs p-2"
                  onClick={() => handleAddElement('media')}
                >
                  🎬 Media
                </button>
                <button
                  className="slide-nav-button text-xs p-2"
                  onClick={() => handleAddElement('shape')}
                >
                  🔷 Shape
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Main canvas area */}
        <div className="flex-1 flex flex-col">
          <SlideEditor
            slideDeck={editorSlideDeck}
            onSlideDeckChange={handleSlideDeckUpdate}
            onClose={onClose}
            className="flex-1"
          />
        </div>

        {/* Properties panel */}
        {!isPreviewMode && selectedElementId && (
          <div className="properties-panel bg-slate-800 border-l border-slate-700 p-4">
            <h3 className="text-white font-semibold mb-4">Element Properties</h3>
            <div className="text-slate-400 text-sm">
              Properties panel for element: {selectedElementId}
              {/* TODO: Implement detailed properties panel */}
            </div>
          </div>
        )}
      </div>

      {/* Footer with migration info */}
      {migrationResult && (
        <div className="bg-slate-800 border-t border-slate-700 text-slate-400 p-3 text-xs">
          <div className="flex items-center justify-between">
            <div>
              <span className="bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent font-semibold">
                Slide Editor
              </span>
              <span className="mx-2">•</span>
              {migrationResult.elementsConverted} elements migrated
              <span className="mx-2">•</span>
              {migrationResult.interactionsConverted} interactions preserved
            </div>
            
            {migrationResult.warnings.length > 0 && (
              <div className="text-yellow-400">
                ⚠️ {migrationResult.warnings.length} migration warnings
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SlideBasedEditor;