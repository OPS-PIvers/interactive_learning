import React, { useState, useCallback, useMemo } from 'react';
import { SlideDeck, InteractiveSlide, SlideElement } from '../../shared/slideTypes';
import { MigrationResult } from '../../shared/migrationUtils';
import { useIsMobile } from '../hooks/useIsMobile';
import { useDeviceDetection } from '../hooks/useDeviceDetection';
import { SlideEditor } from './slides/SlideEditor';
import SlideEditorToolbar from './SlideEditorToolbar';
import { generateId } from '../utils/generateId';
import HeaderInsertDropdown from './HeaderInsertDropdown';
import EnhancedPropertiesPanel from './EnhancedPropertiesPanel';
import AspectRatioSelector from './AspectRatioSelector';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { EyeIcon } from './icons/EyeIcon';
import { PencilIcon } from './icons/PencilIcon';
import { SaveIcon } from './icons/SaveIcon';
import { CheckIcon } from './icons/CheckIcon';
import { GearIcon } from './icons/GearIcon';
import AuthButton from './AuthButton';
import ShareModal from './ShareModal';
import { DeviceType } from '../../shared/slideTypes';
import { calculateContainerDimensions } from '../utils/aspectRatioUtils';

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
  const [deviceTypeOverride, setDeviceTypeOverride] = useState<DeviceType | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

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
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 2000);
      
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

  // Handle device type change
  const handleDeviceTypeChange = useCallback((deviceType: DeviceType) => {
    setDeviceTypeOverride(deviceType);
  }, []);

  // Handle background media addition
  const handleAddBackgroundMedia = useCallback(() => {
    // TODO: Implement background media addition
    console.log('Add background media - to be implemented');
  }, []);

  // Handle element updates from properties panel
  const handleElementUpdate = useCallback((elementId: string, updates: Partial<SlideElement>) => {
    if (!currentSlide) return;

    const updatedElements = currentSlide.elements.map(element =>
      element.id === elementId ? { ...element, ...updates } : element
    );

    const updatedSlide: InteractiveSlide = {
      ...currentSlide,
      elements: updatedElements
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
  }, [currentSlide, currentSlideIndex, slideDeck, handleSlideDeckUpdate]);

  // Handle view interactions
  const handleViewInteractions = useCallback((elementId: string) => {
    // TODO: Implement interactions viewer/editor
    console.log('View interactions for element:', elementId);
  }, []);

  // Handle aspect ratio changes for slides
  const handleAspectRatioChange = useCallback((slideIndex: number, newAspectRatio: string) => {
    const targetSlide = slideDeck.slides[slideIndex];
    if (!targetSlide) return;

    // Calculate new container dimensions based on aspect ratio
    const newDimensions = calculateContainerDimensions(newAspectRatio);
    
    const updatedSlide: InteractiveSlide = {
      ...targetSlide,
      layout: {
        ...targetSlide.layout,
        aspectRatio: newAspectRatio,
        containerWidth: newDimensions.width,
        containerHeight: newDimensions.height
      }
    };

    const updatedSlides = slideDeck.slides.map((slide, index) =>
      index === slideIndex ? updatedSlide : slide
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
  }, [slideDeck, handleSlideDeckUpdate]);

  // Get effective device type (override or detected)
  const effectiveDeviceType = deviceTypeOverride || deviceType;

  // Get selected element object
  const selectedElement = selectedElementId 
    ? currentSlide?.elements.find(el => el.id === selectedElementId) || null
    : null;

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
      {/* Header - 3-Section Layout */}
      <div className="bg-slate-800 border-b border-slate-700 text-white px-4 py-2 flex items-center justify-between shadow-2xl">
        {/* Left Section: Back + Title */}
        <div className="flex items-center gap-4 flex-1">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors rounded-lg px-2 py-1 hover:bg-slate-700"
            aria-label="Back to projects"
          >
            <ChevronLeftIcon className="w-5 h-5" />
            {!isMobile && <span className="font-medium">Back</span>}
          </button>
          
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
              {projectName}
            </h1>
            <button
              onClick={handleTogglePreview}
              className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 px-2 py-1 rounded text-xs font-semibold text-white shadow-lg transition-all cursor-pointer"
              aria-label={isPreviewMode ? 'Switch to edit mode' : 'Switch to preview mode'}
            >
              {isPreviewMode ? 'PREVIEW' : 'EDIT'}
            </button>
          </div>
        </div>

        {/* Center Section: Insert and Controls */}
        <div className="flex items-center gap-3 flex-1 justify-center">


          {/* Insert Dropdown */}
          {!isPreviewMode && (
            <>
              <HeaderInsertDropdown
                onAddElement={handleAddElement}
                onAddBackgroundMedia={handleAddBackgroundMedia}
                isMobile={isMobile}
              />
              
              {/* Aspect Ratio Selector */}
              {currentSlide?.layout && (
                <AspectRatioSelector
                  currentRatio={currentSlide.layout.aspectRatio || '16:9'}
                  onRatioChange={(ratio) => handleAspectRatioChange(currentSlideIndex, ratio)}
                  isMobile={isMobile}
                />
              )}
            </>
          )}
        </div>

        {/* Right Section: Settings + Save + Share + Auth */}
        <div className="flex items-center gap-3 flex-1 justify-end">
          <button
            onClick={() => console.log('Settings - to be implemented')}
            className="text-slate-300 hover:text-white transition-colors rounded-lg p-2 hover:bg-slate-700"
            aria-label="Project settings"
          >
            <GearIcon className="w-5 h-5" />
          </button>

          <button
            onClick={handleSaveProject}
            disabled={isSaving}
            className={`font-semibold py-1.5 px-4 rounded-md shadow-md transition-all duration-200 flex items-center gap-2 ${
              isSaving 
                ? 'bg-green-500 cursor-not-allowed' 
                : showSuccessMessage 
                  ? 'bg-green-500' 
                  : 'bg-green-600 hover:bg-green-700'
            } text-white`}
            aria-label="Save project"
          >
            {isSaving ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                {!isMobile && <span>Saving...</span>}
              </>
            ) : showSuccessMessage ? (
              <>
                <CheckIcon className="w-4 h-4" />
                {!isMobile && <span>Saved!</span>}
              </>
            ) : (
              <>
                <SaveIcon className="w-4 h-4" />
                {!isMobile && <span>Save</span>}
              </>
            )}
          </button>

          {projectId && (
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-2"
              aria-label="Share project"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
              {!isMobile && <span>Share</span>}
            </button>
          )}

          <AuthButton variant={isMobile ? "compact" : "toolbar"} />
        </div>
      </div>

      {/* Main editor content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Slide navigation panel */}
        <div className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col">
          {/* Slide list header */}
          <div className="p-4 border-b border-slate-700">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-semibold">Slides</h3>
              <button
                className="slide-nav-button slide-nav-button-primary text-sm px-3 py-1"
                onClick={handleAddSlide}
              >
                + Add
              </button>
            </div>
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

        </div>

        {/* Main canvas area */}
        <div className="flex-1 flex flex-col">
          <SlideEditor
            slideDeck={editorSlideDeck}
            onSlideDeckChange={handleSlideDeckUpdate}
            onClose={onClose}
            className="flex-1"
            deviceTypeOverride={effectiveDeviceType}
            onAspectRatioChange={handleAspectRatioChange}
          />
        </div>

        {/* Properties panel */}
        {!isPreviewMode && (
          <EnhancedPropertiesPanel
            selectedElement={selectedElement}
            deviceType={effectiveDeviceType}
            onElementUpdate={handleElementUpdate}
            onViewInteractions={handleViewInteractions}
            isMobile={isMobile}
          />
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

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        project={{
          id: projectId || '',
          name: projectName,
          published: isPublished
        } as any}
      />
    </div>
  );
};

export default SlideBasedEditor;