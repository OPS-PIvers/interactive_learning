/**
 * Unified Slide Editor
 * 
 * Responsive editor component that replaces SlideBasedEditor with a mobile-first,
 * unified architecture. Consolidates desktop and mobile functionality while
 * providing optimal experience across all device types.
 */

import React, { useCallback, useMemo, useEffect } from 'react';
import { firebaseAPI } from '../../../lib/firebaseApi';
import { getHotspotPixelDimensions, defaultHotspotSize } from '../../../shared/hotspotStylePresets';
import { MigrationResult } from '../../../shared/migrationUtils';
import { SlideDeck, InteractiveSlide, SlideElement, ThemePreset, BackgroundMedia, DeviceType, SlideLayout } from '../../../shared/slideTypes';
import { HotspotData, TimelineEventData } from '../../../shared/types';
import { ProjectThemeProvider } from '../../hooks/useProjectTheme';
import { useUnifiedEditorState } from '../../hooks/useUnifiedEditorState';
import { generateId } from '../../utils/generateId';
import {
  slideElementToHotspotData,
  hotspotDataToSlideElement,
  extractTimelineEventsFromElement,
  timelineEventToSlideInteraction,
  getHotspotsFromSlide,
  getCanvasDimensionsFromSlide } from
'../../utils/hotspotEditorBridge';
import { Z_INDEX_TAILWIND } from '../../utils/zIndexLevels';
import HotspotEditorModal from '../HotspotEditorModal';
import { ResponsiveAspectRatioModal } from '../responsive/ResponsiveAspectRatioModal';
import { ResponsiveBackgroundModal } from '../responsive/ResponsiveBackgroundModal';
import { ResponsiveHeader } from '../responsive/ResponsiveHeader';
import { ResponsiveInsertModal } from '../responsive/ResponsiveInsertModal';
import { ResponsiveModal } from '../responsive/ResponsiveModal';
import { ResponsiveSlidesModal } from '../responsive/ResponsiveSlidesModal';
import { ResponsiveToolbar } from '../responsive/ResponsiveToolbar';
import { ResponsiveCanvas } from './ResponsiveCanvas';
import { ResponsivePropertiesPanel } from './ResponsivePropertiesPanel';
// Mobile toolbar hooks removed - functionality moved to responsive design

// Import responsive components and modals (to be created)

// Mobile-specific components removed - functionality moved to ResponsiveToolbar

// Import unified modal components

// Import hotspot editor modal and bridge utilities

export interface UnifiedSlideEditorProps {
  slideDeck: SlideDeck;
  projectName: string;
  projectId?: string;
  projectTheme?: ThemePreset;
  onSlideDeckChange: (slideDeck: SlideDeck) => void;
  onSave: (currentSlideDeck: SlideDeck) => Promise<void>;
  onImageUpload: (file: File) => Promise<void>;
  onClose: () => void;
  isPublished: boolean;
  migrationResult?: MigrationResult | null;
}

/**
 * UnifiedSlideEditor - Mobile-first responsive editor
 */
export const UnifiedSlideEditor: React.FC<UnifiedSlideEditorProps> = ({
  slideDeck,
  projectName,
  projectId,
  projectTheme,
  onSlideDeckChange,
  onSave,
  onImageUpload,
  onClose,
  isPublished,
  migrationResult
}) => {
  // Unified state management
  const {
    state,
    actions,
    computed
  } = useUnifiedEditorState();

  // Mobile toolbar configuration removed - using responsive design instead

  // Current slide and selected element
  const currentSlide = slideDeck?.slides?.[state.navigation.currentSlideIndex];
  const selectedElement = useMemo(() => {
    if (!state.editing.selectedElementId || !currentSlide) return null;
    return currentSlide.elements?.find((el) => el.id === state.editing.selectedElementId) || null;
  }, [state.editing.selectedElementId, currentSlide]);

  // Hotspot editor data - prepare legacy format for the modal
  const hotspotEditorData = useMemo(() => {
    if (!state.hotspotEditor.isOpen || !state.hotspotEditor.selectedHotspotId || !currentSlide) {
      return null;
    }

    const selectedHotspotElement = currentSlide.elements?.find(
      (el) => el.id === state.hotspotEditor.selectedHotspotId && el.type === 'hotspot'
    );

    if (!selectedHotspotElement) return null;

    // Get canvas dimensions for coordinate conversion
    const containerDimensions = { width: 1200, height: 800 }; // Default, will be refined
    const canvasDimensions = getCanvasDimensionsFromSlide(currentSlide, containerDimensions);

    try {
      // Convert slide element to legacy hotspot data
      const hotspotData = slideElementToHotspotData(
        selectedHotspotElement,
        computed.effectiveDeviceType,
        canvasDimensions
      );

      // Extract timeline events from element interactions
      const timelineEvents = extractTimelineEventsFromElement(selectedHotspotElement, 1);

      // Get all hotspots from current slide for context
      const allHotspots = getHotspotsFromSlide(currentSlide).map((element) =>
      slideElementToHotspotData(element, computed.effectiveDeviceType, canvasDimensions)
      );

      // Get background image URL if available
      const backgroundImage = currentSlide.backgroundMedia?.type === 'image' ?
      currentSlide.backgroundMedia.url || '' :
      '';

      return {
        selectedHotspot: hotspotData,
        relatedEvents: timelineEvents,
        allHotspots,
        backgroundImage,
        canvasDimensions
      };
    } catch (error) {
      console.error('Error preparing hotspot editor data:', error);
      return null;
    }
  }, [state.hotspotEditor.isOpen, state.hotspotEditor.selectedHotspotId, currentSlide, computed.effectiveDeviceType]);

  // Handle slide deck updates
  const handleSlideDeckUpdate = useCallback((updatedSlideDeck: SlideDeck) => {






    onSlideDeckChange(updatedSlideDeck);
  }, [onSlideDeckChange]);

  // Handle element updates
  const handleElementUpdate = useCallback((elementId: string, updates: Partial<SlideElement>) => {
    const updatedSlideDeck = {
      ...slideDeck,
      slides: slideDeck?.slides?.map((slide, index) => {
        if (index !== state.navigation.currentSlideIndex) return slide;

        return {
          ...slide,
          elements: slide.elements?.map((element) =>
          element.id === elementId ? { ...element, ...updates } : element
          ) || []
        };
      })
    };

    handleSlideDeckUpdate(updatedSlideDeck);
  }, [slideDeck, state.navigation.currentSlideIndex, handleSlideDeckUpdate]);

  // Handle slide updates
  const handleSlideUpdate = useCallback((slideUpdates: Partial<InteractiveSlide>, propertiesToRemove: (keyof InteractiveSlide)[] = []) => {






    const updatedSlideDeck = {
      ...slideDeck,
      slides: slideDeck?.slides?.map((slide, index) => {
        if (index !== state.navigation.currentSlideIndex) return slide;

        const updatedSlide = { ...slide, ...slideUpdates };
        for (const prop of propertiesToRemove) {
          delete (updatedSlide as any)[prop];
        }
        return updatedSlide;
      })
    };



    handleSlideDeckUpdate(updatedSlideDeck);
  }, [slideDeck, state.navigation.currentSlideIndex, handleSlideDeckUpdate]);

  // Handle hotspot double-click to open editor
  const handleHotspotDoubleClick = useCallback((elementId: string) => {

    actions.openHotspotEditor(elementId);
  }, [actions]);

  // Handle hotspot updates from the editor modal
  const handleHotspotUpdate = useCallback((updatedHotspotData: HotspotData) => {
    if (!hotspotEditorData || !currentSlide) return;



    try {
      // Convert updated hotspot data back to slide element
      const existingElement = currentSlide.elements?.find((el) => el.id === updatedHotspotData.id);
      const updatedElement = hotspotDataToSlideElement(
        updatedHotspotData,
        computed.effectiveDeviceType,
        hotspotEditorData.canvasDimensions,
        existingElement
      );

      handleElementUpdate(updatedHotspotData.id, updatedElement);
    } catch (error) {
      console.error('Error updating hotspot element:', error);
    }
  }, [hotspotEditorData, currentSlide, computed.effectiveDeviceType, handleElementUpdate]);

  // Handle hotspot deletion from the editor modal
  const handleHotspotDelete = useCallback((hotspotId: string) => {


    const updatedSlideDeck = {
      ...slideDeck,
      slides: slideDeck?.slides?.map((slide, index) => {
        if (index !== state.navigation.currentSlideIndex) return slide;

        return {
          ...slide,
          elements: slide.elements?.filter((el) => el.id !== hotspotId) || []
        };
      })
    };

    handleSlideDeckUpdate(updatedSlideDeck);
    actions.closeHotspotEditor();
  }, [slideDeck, state.navigation.currentSlideIndex, handleSlideDeckUpdate, actions]);

  // Handle adding timeline events from the editor modal
  const handleAddTimelineEvent = useCallback((event: TimelineEventData) => {
    if (!currentSlide || !state.hotspotEditor.selectedHotspotId) return;



    try {
      // Convert timeline event to slide interaction
      const interaction = timelineEventToSlideInteraction(event);

      // Find the hotspot element and add the interaction
      const updatedElements = currentSlide.elements?.map((element) => {
        if (element.id === state.hotspotEditor.selectedHotspotId) {
          return {
            ...element,
            interactions: [...(element.interactions || []), interaction]
          };
        }
        return element;
      }) || [];

      handleSlideUpdate({ elements: updatedElements });
    } catch (error) {
      console.error('Error adding timeline event:', error);
    }
  }, [currentSlide, state.hotspotEditor.selectedHotspotId, handleSlideUpdate]);

  // Handle updating timeline events from the editor modal
  const handleUpdateTimelineEvent = useCallback((event: TimelineEventData) => {
    if (!currentSlide || !state.hotspotEditor.selectedHotspotId) return;



    try {
      // Convert timeline event to slide interaction
      const updatedInteraction = timelineEventToSlideInteraction(event);

      // Find the hotspot element and update the interaction
      const updatedElements = currentSlide.elements?.map((element) => {
        if (element.id === state.hotspotEditor.selectedHotspotId) {
          return {
            ...element,
            interactions: element.interactions?.map((interaction) =>
            interaction.id === event.id ? updatedInteraction : interaction
            ) || []
          };
        }
        return element;
      }) || [];

      handleSlideUpdate({ elements: updatedElements });
    } catch (error) {
      console.error('Error updating timeline event:', error);
    }
  }, [currentSlide, state.hotspotEditor.selectedHotspotId, handleSlideUpdate]);

  // Handle deleting timeline events from the editor modal
  const handleDeleteTimelineEvent = useCallback((eventId: string) => {
    if (!currentSlide || !state.hotspotEditor.selectedHotspotId) return;



    // Find the hotspot element and remove the interaction
    const updatedElements = currentSlide.elements?.map((element) => {
      if (element.id === state.hotspotEditor.selectedHotspotId) {
        return {
          ...element,
          interactions: element.interactions?.filter((interaction) => interaction.id !== eventId) || []
        };
      }
      return element;
    }) || [];

    handleSlideUpdate({ elements: updatedElements });
  }, [currentSlide, state.hotspotEditor.selectedHotspotId, handleSlideUpdate]);

  // Handle adding new slides
  const handleAddSlide = useCallback((insertAfterIndex?: number) => {
    const insertIndex = insertAfterIndex !== undefined ?
    insertAfterIndex + 1 :
    state.navigation.currentSlideIndex + 1;

    const newSlideLayout: SlideLayout = {
      aspectRatio: currentSlide?.layout?.aspectRatio || '16:9',
      scaling: 'fit',
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    };
    if (currentSlide?.layout?.containerWidth) {
      newSlideLayout.containerWidth = currentSlide.layout.containerWidth;
    }
    if (currentSlide?.layout?.containerHeight) {
      newSlideLayout.containerHeight = currentSlide.layout.containerHeight;
    }

    const newSlide: InteractiveSlide = {
      id: generateId(),
      title: `Slide ${insertIndex + 1}`,
      elements: [],
      transitions: [],
      layout: newSlideLayout
    };

    const updatedSlides = [
    ...(slideDeck?.slides?.slice(0, insertIndex) || []),
    newSlide,
    ...(slideDeck?.slides?.slice(insertIndex) || [])];


    const updatedSlideDeck = { ...slideDeck, slides: updatedSlides };
    handleSlideDeckUpdate(updatedSlideDeck);
    actions.setCurrentSlide(insertIndex);
  }, [slideDeck, state.navigation.currentSlideIndex, currentSlide, handleSlideDeckUpdate, actions]);

  // Handle duplicating slides
  const handleDuplicateSlide = useCallback((slideIndex: number) => {
    const slideToDuplicate = slideDeck?.slides?.[slideIndex];
    if (!slideToDuplicate) return;

    const duplicatedSlide: InteractiveSlide = {
      ...slideToDuplicate,
      id: generateId(),
      elements: slideToDuplicate.elements?.map((element) => ({
        ...element,
        id: generateId()
      })) ?? []
    };

    const updatedSlides = [
    ...(slideDeck?.slides?.slice(0, slideIndex + 1) ?? []),
    duplicatedSlide,
    ...(slideDeck?.slides?.slice(slideIndex + 1) ?? [])];


    const updatedSlideDeck = { ...slideDeck, slides: updatedSlides };
    handleSlideDeckUpdate(updatedSlideDeck);
    actions.setCurrentSlide(slideIndex + 1);
  }, [slideDeck, handleSlideDeckUpdate, actions]);

  // Handle deleting slides
  const handleDeleteSlide = useCallback((slideIndex: number) => {
    if (slideDeck?.slides?.length <= 1) return; // Don't delete the last slide

    const updatedSlides = slideDeck?.slides.filter((_, index) => index !== slideIndex);
    const updatedSlideDeck = { ...slideDeck, slides: updatedSlides };

    handleSlideDeckUpdate(updatedSlideDeck);

    // Adjust current slide index if necessary
    const newCurrentIndex = slideIndex >= updatedSlides.length ?
    updatedSlides.length - 1 :
    slideIndex;
    actions.setCurrentSlide(newCurrentIndex);
  }, [slideDeck, handleSlideDeckUpdate, actions]);

  // Handle adding new elements
  const handleAddElement = useCallback((elementType: 'hotspot' | 'text' | 'shape' | 'media') => {
    if (!currentSlide) return;

    // Calculate initial position (center of canvas)
    const getInitialDimensions = (deviceType: DeviceType) => {
      if (elementType === 'hotspot') {
        const isMobile = deviceType === 'mobile';
        const dimensions = getHotspotPixelDimensions(defaultHotspotSize, isMobile);
        return { width: dimensions.width, height: dimensions.height };
      }
      return deviceType === 'desktop' ? { width: 100, height: 100 } :
      deviceType === 'tablet' ? { width: 80, height: 80 } :
      { width: 60, height: 60 };
    };

    const newElement: SlideElement = {
      id: generateId(),
      type: elementType,
      position: {
        desktop: { x: 300, y: 200, ...getInitialDimensions('desktop') },
        tablet: { x: 250, y: 150, ...getInitialDimensions('tablet') },
        mobile: { x: 150, y: 100, ...getInitialDimensions('mobile') }
      },
      style: {
        ...(elementType === 'shape' && { backgroundColor: '#e2e8f0' }),
        ...(elementType === 'text' && { fontSize: 16, color: '#000000' })
      },
      content: elementType === 'text' ? { textContent: 'New Text Element' } : {},
      interactions: [],
      isVisible: true
    };

    const updatedSlide = {
      ...currentSlide,
      elements: [...(currentSlide.elements || []), newElement]
    };

    handleSlideUpdate(updatedSlide);
    actions.enterEditMode(newElement.id);
    actions.closeAllModals();
  }, [currentSlide, handleSlideUpdate, actions]);

  // Handle aspect ratio changes
  const handleAspectRatioChange = useCallback((slideIndex: number, aspectRatio: string) => {
    if (slideIndex !== state.navigation.currentSlideIndex || !currentSlide) return;

    handleSlideUpdate({
      layout: {
        ...currentSlide.layout,
        aspectRatio
      }
    });
  }, [state.navigation.currentSlideIndex, currentSlide, handleSlideUpdate]);

  // Handle background media changes
  const handleBackgroundUpload = useCallback(async (file: File) => {








    try {

      const imageUrl = await firebaseAPI.uploadImage(file);


      const backgroundMedia: BackgroundMedia = {
        type: file.type.startsWith('video/') ? 'video' : 'image',
        url: imageUrl,
        settings: {
          size: 'cover',
          position: 'center',
          repeat: 'no-repeat',
          attachment: 'scroll'
        }
      };




      handleSlideUpdate({ backgroundMedia });


    } catch (error) {
      console.error('❌ Background upload failed:', error);
      throw error;
    }
  }, [handleSlideUpdate]);

  const handleBackgroundRemove = useCallback(() => {
    handleSlideUpdate({}, ['backgroundMedia']);
  }, [handleSlideUpdate]);

  const handleBackgroundUpdate = useCallback((mediaConfig: BackgroundMedia) => {
    handleSlideUpdate({ backgroundMedia: mediaConfig });
  }, [handleSlideUpdate]);

  // Handle theme changes
  const handleThemeChange = useCallback((theme: any, themeId: ThemePreset) => {


  }, []);

  // Handle save operation
  const handleSave = useCallback(async () => {







    actions.setSaving(true);
    actions.setError(null);

    try {

      await onSave(slideDeck);
      actions.showSuccessMessage();

      // Auto-save to Firebase if projectId exists
      if (projectId) {

        const projectData = {
          id: projectId,
          title: projectName,
          description: '',
          projectType: 'slide' as const,
          slideDeck,
          ...(projectTheme && { theme: projectTheme }),
          createdBy: '', // Will be set by Firebase API
          createdAt: new Date(),
          updatedAt: new Date(),
          isPublished: false,
          // Required interactiveData field
          interactiveData: {
            imageFitMode: 'cover' as const,
            viewerModes: { explore: true, selfPaced: true, timed: true },
            hotspots: [],
            timelineEvents: []
          }
        };








        await firebaseAPI.saveProject(projectData);

      }
    } catch (error) {
      console.error('❌ Save error:', error);
      actions.setError(error instanceof Error ? error.message : 'Failed to save project');
    } finally {
      actions.setSaving(false);
    }
  }, [actions, onSave, slideDeck, projectId, projectName, projectTheme]);

  // Auto-dismiss help hint
  useEffect(() => {
    if (state.ui.showHelpHint) {
      const timer = setTimeout(() => {
        actions.dismissHelpHint();
      }, 5000);
      return () => clearTimeout(timer);
    }
    return undefined; // Explicit return for else case
  }, [state.ui.showHelpHint, actions]);

  // Add editor body classes
  useEffect(() => {
    document.body.classList.add('unified-editor-active');
    return () => {
      document.body.classList.remove('unified-editor-active');
    };
  }, []);

  // Generate viewer config for sharing
  const viewerConfig = useMemo(() => ({
    slides: slideDeck?.slides,
    config: {
      autoAdvance: false,
      allowNavigation: true,
      showProgress: false,
      showControls: false,
      keyboardShortcuts: true,
      touchGestures: true,
      fullscreenMode: false
    }
  }), [slideDeck]);

  return (
    <ProjectThemeProvider
      {...projectTheme && { initialThemeId: projectTheme }}
      onThemeChange={handleThemeChange}>

      <div className="unified-slide-editor fixed inset-0 h-full w-full flex flex-col bg-gradient-to-br from-slate-900 to-slate-800 overflow-hidden
                     /* Mobile-first layout improvements */
                     h-screen
                     h-[100dvh]
                     md:h-full">
        
        {/* Mobile-first CSS Grid Layout */}
        <style jsx>{`
          .unified-slide-editor {
            height: 100vh;
            height: 100dvh; /* Dynamic viewport height for iOS */
            display: grid;
            grid-template-rows: auto 1fr auto;
            grid-template-areas: 
              "header"
              "main" 
              "toolbar";
          }
          
          @media (min-width: 768px) {
            .unified-slide-editor {
              display: flex;
              flex-direction: column;
            }
          }
          
          .editor-header {
            grid-area: header;
          }
          
          .editor-main {
            grid-area: main;
            min-height: 0;
            overflow: hidden;
          }
          
          .editor-toolbar {
            grid-area: toolbar;
          }
          
          /* Mobile properties panel - collapsible drawer */
          @media (max-width: 767px) {
            .properties-panel-mobile {
              position: fixed;
              bottom: 0;
              left: 0;
              right: 0;
              max-height: 60vh;
              transform: translateY(calc(100% - 48px));
              transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
              z-index: 9998;
              background: rgba(0, 0, 0, 0.95);
              backdrop-filter: blur(8px);
              border-radius: 16px 16px 0 0;
            }
            
            .properties-panel-mobile.expanded {
              transform: translateY(0);
            }
            
            .properties-panel-mobile::before {
              content: '';
              position: absolute;
              top: 8px;
              left: 50%;
              transform: translateX(-50%);
              width: 40px;
              height: 4px;
              background: rgba(255, 255, 255, 0.3);
              border-radius: 2px;
              cursor: grab;
            }
          }
        `}</style>
        
        {/* Responsive Header */}
        <div className="editor-header">
          <ResponsiveHeader
            projectName={projectName}
            isPreviewMode={state.navigation.isPreviewMode}
            isSaving={state.operations.isSaving}
            errorMessage={state.operations.error}
            showSuccessMessage={state.ui.showSuccessMessage}
            onTogglePreview={actions.togglePreviewMode}
            onSave={handleSave}
            onClose={onClose}
            onOpenSettings={() => actions.openModal('settingsModal')}
            onOpenShare={() => actions.openModal('shareModal')}
            isPublished={isPublished} />
        </div>

        {/* Main editor content */}
        <div className="editor-main flex-1 flex overflow-hidden 
                        md:flex-row flex-col">
          
          {/* Main canvas area */}
          <div className="flex-1 flex flex-col relative min-h-0">
            
            {/* Responsive Canvas - with proper height constraint */}
            <div className="flex-1 overflow-hidden relative">
              <ResponsiveCanvas
                slideDeck={slideDeck}
                currentSlideIndex={state.navigation.currentSlideIndex}
                onSlideDeckChange={handleSlideDeckUpdate}
                selectedElementId={state.editing.selectedElementId}
                onElementSelect={actions.selectElement}
                onElementUpdate={handleElementUpdate}
                onSlideUpdate={handleSlideUpdate}
                onHotspotDoubleClick={handleHotspotDoubleClick}
                {...state.navigation.deviceTypeOverride && { deviceTypeOverride: state.navigation.deviceTypeOverride }}
                className="w-full h-full"
                isEditable={!state.navigation.isPreviewMode}
                onAspectRatioChange={handleAspectRatioChange} />

            </div>
          </div>
          
          {/* Desktop Properties Panel - positioned right */}
          <div className="hidden md:block">
            {!state.navigation.isPreviewMode && selectedElement &&
            <ResponsivePropertiesPanel
              selectedElement={selectedElement}
              currentSlide={currentSlide ?? null}
              onElementUpdate={handleElementUpdate}
              onSlideUpdate={handleSlideUpdate}
              onDelete={() => {
                if (!selectedElement) return;
                const updatedSlide = {
                  ...currentSlide,
                  elements: currentSlide?.elements?.filter((el) => el.id !== selectedElement.id) || []
                };
                handleSlideUpdate(updatedSlide);
                actions.exitEditMode();
              }}
            onClose={actions.exitEditMode}
            mode="auto" />

          }
          </div>
        </div>

        {/* Mobile Toolbar - positioned at bottom via CSS grid */}
        <div className="editor-toolbar md:hidden">
          {!state.navigation.isPreviewMode &&
          <ResponsiveToolbar
            onSlidesOpen={() => actions.openModal('slidesModal')}
            onBackgroundOpen={() => actions.openModal('backgroundModal')}
            onInsertOpen={() => actions.openModal('insertModal')}
            onAspectRatioOpen={() => actions.openModal('aspectRatioModal')}
            onPropertiesOpen={() => {
              // Toggle mobile properties panel expansion
              const panel = document.querySelector('.properties-panel-mobile') as HTMLElement;
              if (panel) {
                panel.classList.toggle('expanded');
              }
            }}
            hasSelectedElement={!!selectedElement} />
          }
        </div>

        {/* Mobile Properties Panel - collapsible bottom drawer */}
        {!state.navigation.isPreviewMode && selectedElement &&
        <div className={`properties-panel-mobile md:hidden ${Z_INDEX_TAILWIND.PROPERTIES_PANEL}`}>
          <div className="overflow-y-auto p-4 pt-8">
            <ResponsivePropertiesPanel
              selectedElement={selectedElement}
              currentSlide={currentSlide ?? null}
              onElementUpdate={handleElementUpdate}
              onSlideUpdate={handleSlideUpdate}
              onDelete={() => {
                if (!selectedElement) return;
                const updatedSlide = {
                  ...currentSlide,
                  elements: currentSlide?.elements?.filter((el) => el.id !== selectedElement.id) || []
                };
                handleSlideUpdate(updatedSlide);
                actions.exitEditMode();
              }}
            onClose={actions.exitEditMode}
            mode="mobile" />
          </div>
        </div>
        }
        
        {/* Help hint */}
        {state.ui.showHelpHint && !state.navigation.isPreviewMode &&
        <div className={`fixed top-4 right-4 ${Z_INDEX_TAILWIND.SLIDE_ELEMENTS} bg-blue-600/90 backdrop-blur-sm text-white text-xs px-3 py-2 rounded-lg shadow-lg max-w-xs`}>
            <div className="flex items-center gap-2">
              <span className="text-blue-200">✨</span>
              <span>Use touch/mouse to zoom, navigate slides, and select elements. Double-click hotspots to edit.</span>
              <button
              onClick={actions.dismissHelpHint}
              className="ml-2 text-blue-200 hover:text-white">

                ✕
              </button>
            </div>
          </div>
        }
        
        {/* Migration info footer */}
        {migrationResult &&
        <div className="bg-slate-800 border-t border-slate-700 text-slate-400 p-3 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <span className="bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent font-semibold">
                  Unified Editor
                </span>
                <span className="mx-2">•</span>
                <span>
                  Successfully migrated {migrationResult.slideDeck.slides.length} slides, 
                  {migrationResult.elementsConverted} interactive elements
                </span>
              </div>
            </div>
          </div>
        }
        
        {/* Hotspot Editor Modal */}
        {state.hotspotEditor.isOpen && hotspotEditorData &&
        <HotspotEditorModal
          editorState={state}
          editorActions={actions}
          selectedHotspot={hotspotEditorData.selectedHotspot}
          relatedEvents={hotspotEditorData.relatedEvents}
          currentStep={1}
          backgroundImage={hotspotEditorData.backgroundImage}
          onUpdateHotspot={handleHotspotUpdate}
          onDeleteHotspot={handleHotspotDelete}
          onAddEvent={handleAddTimelineEvent}
          onUpdateEvent={handleUpdateTimelineEvent}
          onDeleteEvent={handleDeleteTimelineEvent}
          allHotspots={hotspotEditorData.allHotspots} />

        }
        
        {/* Responsive Modals */}
        {/* Unified slides modal */}
        {state.ui.slidesModal &&
        <ResponsiveSlidesModal
          slides={slideDeck.slides}
          currentSlideIndex={state.navigation.currentSlideIndex}
          onSlideSelect={(index) => {
            actions.setCurrentSlide(index);
            actions.closeModal('slidesModal');
          }}
          onSlideAdd={handleAddSlide}
          onSlideDelete={handleDeleteSlide}
          onSlideDuplicate={handleDuplicateSlide}
          onClose={() => actions.closeModal('slidesModal')} />

        }
        
        {/* Unified background modal */}
        {state.ui.backgroundModal && currentSlide &&
        <ResponsiveBackgroundModal
          currentSlide={currentSlide}
          onAspectRatioChange={(ratio) => handleAspectRatioChange(state.navigation.currentSlideIndex, ratio)}
          onBackgroundUpload={handleBackgroundUpload}
          onBackgroundRemove={handleBackgroundRemove}
          onBackgroundUpdate={handleBackgroundUpdate}
          onClose={() => actions.closeModal('backgroundModal')} />

        }
        
        {/* Unified insert modal */}
        {state.ui.insertModal &&
        <ResponsiveInsertModal
          onInsertElement={(type) => handleAddElement(type)}
          onClose={() => actions.closeModal('insertModal')} />

        }
        
        {/* Unified aspect ratio modal */}
        {state.ui.aspectRatioModal && currentSlide &&
        <ResponsiveAspectRatioModal
          isOpen={state.ui.aspectRatioModal}
          currentRatio={currentSlide.layout?.aspectRatio || '16:9'}
          onRatioChange={(ratio) => handleAspectRatioChange(state.navigation.currentSlideIndex, ratio)}
          onClose={() => actions.closeModal('aspectRatioModal')} />

        }
        
        <ResponsiveModal
          type="share"
          isOpen={state.ui.shareModal}
          onClose={() => actions.closeModal('shareModal')}
          title="Share Project">

          {/* Share modal content */}
          <div className="p-4">
            <p>Share settings content will go here</p>
          </div>
        </ResponsiveModal>
        
        <ResponsiveModal
          type="settings"
          isOpen={state.ui.settingsModal}
          onClose={() => actions.closeModal('settingsModal')}
          title="Project Settings">

          {/* Settings modal content */}
          <div className="p-4">
            <p>Project settings content will go here</p>
          </div>
        </ResponsiveModal>
      </div>
    </ProjectThemeProvider>);

};

export default UnifiedSlideEditor;