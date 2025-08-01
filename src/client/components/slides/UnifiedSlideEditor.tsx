/**
 * Unified Slide Editor
 * 
 * Responsive editor component that replaces SlideBasedEditor with a mobile-first,
 * unified architecture. Consolidates desktop and mobile functionality while
 * providing optimal experience across all device types.
 */

import React, { useCallback, useMemo, useEffect } from 'react';
import { SlideDeck, InteractiveSlide, SlideElement, ThemePreset, BackgroundMedia, DeviceType } from '../../../shared/slideTypes';
import { MigrationResult } from '../../../shared/migrationUtils';
import { useUnifiedEditorState } from '../../hooks/useUnifiedEditorState';
import { ResponsiveCanvas } from './ResponsiveCanvas';
import { ResponsivePropertiesPanel } from './ResponsivePropertiesPanel';
import { generateId } from '../../utils/generateId';
import { getHotspotPixelDimensions, defaultHotspotSize } from '../../../shared/hotspotStylePresets';
import { firebaseAPI } from '../../../lib/firebaseApi';
import { useMobileToolbar, useContentAreaHeight } from '../../hooks/useMobileToolbar';
import { ProjectThemeProvider } from '../../hooks/useProjectTheme';

// Import responsive components and modals (to be created)
import { ResponsiveToolbar } from '../responsive/ResponsiveToolbar';
import { ResponsiveHeader } from '../responsive/ResponsiveHeader';
import { ResponsiveSlideNavigation } from '../responsive/ResponsiveSlideNavigation';
import { ResponsiveModal } from '../responsive/ResponsiveModal';

// Mobile-specific components that will be unified
import { UniversalMobileToolbar } from '../mobile/UniversalMobileToolbar';
import { MobileEditorToolbarContent } from '../mobile/MobileEditorToolbarContent';

// Import proper modal components
import { MobileSlidesModal } from '../mobile/MobileSlidesModal';
import { MobileBackgroundModal } from '../mobile/MobileBackgroundModal';
import { MobileAspectRatioModal } from '../mobile/MobileAspectRatioModal';
import { MobileInsertModal } from '../mobile/MobileInsertModal';

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
  migrationResult,
}) => {
  // Unified state management
  const {
    state,
    actions,
    computed,
  } = useUnifiedEditorState();
  
  // Mobile toolbar configuration
  const mobileToolbarConfig = useMobileToolbar(false); // Not used in viewer context
  const contentAreaConfig = useContentAreaHeight(false);
  
  // Current slide and selected element
  const currentSlide = slideDeck.slides[state.navigation.currentSlideIndex];
  const selectedElement = useMemo(() => {
    if (!state.editing.selectedElementId || !currentSlide) return null;
    return currentSlide.elements?.find(el => el.id === state.editing.selectedElementId) || null;
  }, [state.editing.selectedElementId, currentSlide]);
  
  // Handle slide deck updates
  const handleSlideDeckUpdate = useCallback((updatedSlideDeck: SlideDeck) => {
    console.log('🔄 handleSlideDeckUpdate called with:', {
      slideCount: updatedSlideDeck.slides.length,
      currentSlideIndex: state.navigation.currentSlideIndex,
      currentSlide: updatedSlideDeck.slides[state.navigation.currentSlideIndex],
      hasBackgroundMedia: !!updatedSlideDeck.slides[state.navigation.currentSlideIndex]?.backgroundMedia
    });
    onSlideDeckChange(updatedSlideDeck);
  }, [onSlideDeckChange, state.navigation.currentSlideIndex]);
  
  // Handle element updates
  const handleElementUpdate = useCallback((elementId: string, updates: Partial<SlideElement>) => {
    const updatedSlideDeck = {
      ...slideDeck,
      slides: slideDeck.slides.map((slide, index) => {
        if (index !== state.navigation.currentSlideIndex) return slide;
        
        return {
          ...slide,
          elements: slide.elements?.map(element => 
            element.id === elementId ? { ...element, ...updates } : element
          ) || [],
        };
      }),
    };
    
    handleSlideDeckUpdate(updatedSlideDeck);
  }, [slideDeck, state.navigation.currentSlideIndex, handleSlideDeckUpdate]);
  
  // Handle slide updates
  const handleSlideUpdate = useCallback((slideUpdates: Partial<InteractiveSlide>) => {
    console.log('📝 handleSlideUpdate called with:', {
      slideUpdates,
      currentSlideIndex: state.navigation.currentSlideIndex,
      existingSlide: slideDeck.slides[state.navigation.currentSlideIndex]
    });
    
    const updatedSlideDeck = {
      ...slideDeck,
      slides: slideDeck.slides.map((slide, index) => 
        index === state.navigation.currentSlideIndex ? { ...slide, ...slideUpdates } : slide
      ),
    };
    
    console.log('📝 Updated slide after merge:', updatedSlideDeck.slides[state.navigation.currentSlideIndex]);
    
    handleSlideDeckUpdate(updatedSlideDeck);
  }, [slideDeck, state.navigation.currentSlideIndex, handleSlideDeckUpdate]);
  
  // Handle adding new slides
  const handleAddSlide = useCallback((insertAfterIndex?: number) => {
    const insertIndex = insertAfterIndex !== undefined 
      ? insertAfterIndex + 1 
      : state.navigation.currentSlideIndex + 1;
    
    const newSlide: InteractiveSlide = {
      id: generateId(),
      elements: [],
      layout: {
        aspectRatio: currentSlide?.layout?.aspectRatio || '16:9',
      },
    };
    
    const updatedSlides = [
      ...slideDeck.slides.slice(0, insertIndex),
      newSlide,
      ...slideDeck.slides.slice(insertIndex),
    ];
    
    const updatedSlideDeck = { ...slideDeck, slides: updatedSlides };
    handleSlideDeckUpdate(updatedSlideDeck);
    actions.setCurrentSlide(insertIndex);
  }, [slideDeck, state.navigation.currentSlideIndex, currentSlide, handleSlideDeckUpdate, actions]);
  
  // Handle duplicating slides
  const handleDuplicateSlide = useCallback((slideIndex: number) => {
    const slideToDuplicate = slideDeck.slides[slideIndex];
    if (!slideToDuplicate) return;
    
    const duplicatedSlide: InteractiveSlide = {
      ...slideToDuplicate,
      id: generateId(),
      elements: slideToDuplicate.elements?.map(element => ({
        ...element,
        id: generateId(),
      })) || [],
    };
    
    const updatedSlides = [
      ...slideDeck.slides.slice(0, slideIndex + 1),
      duplicatedSlide,
      ...slideDeck.slides.slice(slideIndex + 1),
    ];
    
    const updatedSlideDeck = { ...slideDeck, slides: updatedSlides };
    handleSlideDeckUpdate(updatedSlideDeck);
    actions.setCurrentSlide(slideIndex + 1);
  }, [slideDeck, handleSlideDeckUpdate, actions]);
  
  // Handle deleting slides
  const handleDeleteSlide = useCallback((slideIndex: number) => {
    if (slideDeck.slides.length <= 1) return; // Don't delete the last slide
    
    const updatedSlides = slideDeck.slides.filter((_, index) => index !== slideIndex);
    const updatedSlideDeck = { ...slideDeck, slides: updatedSlides };
    
    handleSlideDeckUpdate(updatedSlideDeck);
    
    // Adjust current slide index if necessary
    const newCurrentIndex = slideIndex >= updatedSlides.length 
      ? updatedSlides.length - 1 
      : slideIndex;
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
        mobile: { x: 150, y: 100, ...getInitialDimensions('mobile') },
      },
      style: elementType === 'hotspot' ? {} : {
        backgroundColor: elementType === 'shape' ? '#e2e8f0' : undefined,
        fontSize: elementType === 'text' ? 16 : undefined,
        color: elementType === 'text' ? '#000000' : undefined,
      },
      content: elementType === 'text' ? { text: 'New Text Element' } : {},
      interactions: [],
    };
    
    const updatedSlide = {
      ...currentSlide,
      elements: [...(currentSlide.elements || []), newElement],
    };
    
    handleSlideUpdate(updatedSlide);
    actions.enterEditMode(newElement.id);
    actions.closeAllModals();
  }, [currentSlide, handleSlideUpdate, actions]);
  
  // Handle aspect ratio changes
  const handleAspectRatioChange = useCallback((slideIndex: number, aspectRatio: string) => {
    if (slideIndex !== state.navigation.currentSlideIndex) return;
    
    handleSlideUpdate({ 
      layout: { 
        ...currentSlide?.layout, 
        aspectRatio 
      } 
    });
  }, [state.navigation.currentSlideIndex, currentSlide, handleSlideUpdate]);
  
  // Handle background media changes
  const handleBackgroundUpload = useCallback(async (file: File) => {
    console.log('🖼️ Background upload starting:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      currentSlideIndex: state.navigation.currentSlideIndex,
      currentSlide: currentSlide
    });
    
    try {
      console.log('☁️ Uploading to Firebase Storage...');
      const imageUrl = await firebaseAPI.uploadImage(file);
      console.log('✅ Firebase Storage upload successful:', imageUrl);
      
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
      
      console.log('🎨 Created backgroundMedia object:', backgroundMedia);
      console.log('🔄 Calling handleSlideUpdate with backgroundMedia...');
      
      handleSlideUpdate({ backgroundMedia });
      
      console.log('✅ Background upload process completed successfully');
    } catch (error) {
      console.error('❌ Background upload failed:', error);
      throw error;
    }
  }, [handleSlideUpdate, state.navigation.currentSlideIndex, currentSlide]);

  const handleBackgroundRemove = useCallback(() => {
    handleSlideUpdate({ backgroundMedia: undefined });
  }, [handleSlideUpdate]);

  const handleBackgroundUpdate = useCallback((mediaConfig: BackgroundMedia) => {
    handleSlideUpdate({ backgroundMedia: mediaConfig });
  }, [handleSlideUpdate]);
  
  // Handle theme changes
  const handleThemeChange = useCallback((theme: ThemePreset) => {
    // Theme changes would be handled at the project level
    console.log('Theme change:', theme);
  }, []);
  
  // Handle save operation
  const handleSave = useCallback(async () => {
    console.log('💾 handleSave called with:', {
      projectId,
      projectName,
      slideCount: slideDeck.slides.length,
      currentSlideIndex: state.navigation.currentSlideIndex
    });
    
    actions.setSaving(true);
    actions.setError(null);
    
    try {
      console.log('🔄 Calling onSave with slideDeck...');
      await onSave(slideDeck);
      actions.showSuccessMessage();
      
      // Auto-save to Firebase if projectId exists
      if (projectId) {
        console.log('☁️ Auto-saving to Firebase...');
        const projectData = {
          id: projectId,
          title: projectName,
          description: '',
          projectType: 'slide' as const,
          slideDeck,
          theme: projectTheme,
          createdBy: '', // Will be set by Firebase API
          createdAt: new Date(),
          updatedAt: new Date(),
          isPublished: false,
          // Required interactiveData field
          interactiveData: {
            backgroundImage: null,
            imageFitMode: 'cover' as const,
            viewerModes: { explore: true, selfPaced: true, timed: true },
            hotspots: [],
            timelineEvents: []
          }
        };
        
        console.log('📊 Project data for Firebase save:', {
          projectId: projectData.id,
          title: projectData.title,
          slideCount: projectData.slideDeck?.slides?.length,
          hasInteractiveData: !!projectData.interactiveData
        });
        
        await firebaseAPI.saveProject(projectData);
        console.log('✅ Auto-save to Firebase completed');
      }
    } catch (error) {
      console.error('❌ Save error:', error);
      actions.setError(error instanceof Error ? error.message : 'Failed to save project');
    } finally {
      actions.setSaving(false);
    }
  }, [actions, onSave, slideDeck, projectId, projectName, projectTheme, state.navigation.currentSlideIndex]);
  
  // Auto-dismiss mobile hint
  useEffect(() => {
    if (computed.isMobile && state.ui.showMobileHint) {
      const timer = setTimeout(() => {
        actions.dismissMobileHint();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [computed.isMobile, state.ui.showMobileHint, actions]);
  
  // Add mobile body classes
  useEffect(() => {
    if (computed.isMobile) {
      document.body.classList.add('mobile-editor-active');
      return () => {
        document.body.classList.remove('mobile-editor-active');
      };
    }
  }, [computed.isMobile]);
  
  // Generate viewer config for sharing
  const viewerConfig = useMemo(() => ({
    slides: slideDeck.slides,
    config: {
      autoAdvance: false,
      allowNavigation: true,
      showProgress: false,
      showControls: false,
      keyboardShortcuts: true,
      touchGestures: computed.isMobile,
      fullscreenMode: false,
    },
  }), [slideDeck, computed.isMobile]);
  
  return (
    <ProjectThemeProvider 
      initialThemeId={projectTheme}
      onThemeChange={handleThemeChange}
    >
      <div className={`unified-slide-editor ${computed.isMobile ? 'h-screen' : 'fixed inset-0 h-full'} w-full flex flex-col bg-gradient-to-br from-slate-900 to-slate-800 ${computed.isMobile ? '' : 'overflow-hidden'}`}>
        
        {/* Responsive Header */}
        <ResponsiveHeader
          projectName={projectName}
          isPreviewMode={state.navigation.isPreviewMode}
          isSaving={state.operations.isSaving}
          showSuccessMessage={state.ui.showSuccessMessage}
          onTogglePreview={actions.togglePreviewMode}
          onSave={handleSave}
          onClose={onClose}
          onOpenSettings={() => actions.openModal('settingsModal')}
          onOpenShare={() => actions.openModal('shareModal')}
          isPublished={isPublished}
        />
        
        {/* Main editor content */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Responsive slide navigation panel */}
          <ResponsiveSlideNavigation
            slides={slideDeck.slides}
            currentSlideIndex={state.navigation.currentSlideIndex}
            isCollapsed={state.navigation.isSlidePanelCollapsed}
            isVisible={!computed.isMobile && !state.navigation.isPreviewMode}
            onSlideSelect={actions.setCurrentSlide}
            onSlideAdd={handleAddSlide}
            onSlideDuplicate={handleDuplicateSlide}
            onSlideDelete={handleDeleteSlide}
            onToggleCollapse={actions.toggleSlidePanelCollapse}
            activeDropdownId={state.ui.activeDropdownId}
            onDropdownToggle={actions.setActiveDropdown}
          />
          
          {/* Main canvas area */}
          <div className="flex-1 flex flex-col relative">
            
            {/* Responsive Canvas */}
            <ResponsiveCanvas
              slideDeck={slideDeck}
              currentSlideIndex={state.navigation.currentSlideIndex}
              onSlideDeckChange={handleSlideDeckUpdate}
              selectedElementId={state.editing.selectedElementId}
              onElementSelect={actions.selectElement}
              onElementUpdate={handleElementUpdate}
              onSlideUpdate={handleSlideUpdate}
              deviceTypeOverride={state.navigation.deviceTypeOverride}
              className="flex-1"
              isEditable={!state.navigation.isPreviewMode}
              onAspectRatioChange={handleAspectRatioChange}
            />
            
            {/* Responsive Toolbar */}
            {!state.navigation.isPreviewMode && (
              <ResponsiveToolbar
                onSlidesOpen={() => actions.openModal('slidesModal')}
                onBackgroundOpen={() => actions.openModal('backgroundModal')}
                onInsertOpen={() => actions.openModal('insertModal')}
                onAspectRatioOpen={() => actions.openModal('aspectRatioModal')}
                deviceType={computed.effectiveDeviceType}
                onDeviceTypeChange={actions.setDeviceTypeOverride}
              />
            )}
          </div>
          
          {/* Responsive Properties Panel */}
          {!state.navigation.isPreviewMode && !computed.isMobile && selectedElement && (
            <ResponsivePropertiesPanel
              selectedElement={selectedElement}
              currentSlide={currentSlide}
              deviceType={computed.effectiveDeviceType}
              onElementUpdate={handleElementUpdate}
              onSlideUpdate={handleSlideUpdate}
              onDelete={() => {
                if (!selectedElement) return;
                const updatedSlide = {
                  ...currentSlide,
                  elements: currentSlide?.elements?.filter(el => el.id !== selectedElement.id) || [],
                };
                handleSlideUpdate(updatedSlide);
                actions.exitEditMode();
              }}
              onClose={actions.exitEditMode}
              mode="auto"
            />
          )}
        </div>
        
        {/* Mobile help hint */}
        {computed.isMobile && state.ui.showMobileHint && !state.navigation.isPreviewMode && (
          <div className="fixed top-4 right-4 z-30 bg-blue-600/90 backdrop-blur-sm text-white text-xs px-3 py-2 rounded-lg shadow-lg max-w-xs">
            <div className="flex items-center gap-2">
              <span className="text-blue-200">📱</span>
              <span>Pinch to zoom, swipe to navigate slides, tap elements to select</span>
              <button
                onClick={actions.dismissMobileHint}
                className="ml-2 text-blue-200 hover:text-white"
              >
                ✕
              </button>
            </div>
          </div>
        )}
        
        {/* Migration info footer */}
        {migrationResult && !computed.isMobile && (
          <div className="bg-slate-800 border-t border-slate-700 text-slate-400 p-3 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <span className="bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent font-semibold">
                  Unified Editor
                </span>
                <span className="mx-2">•</span>
                <span>
                  Successfully migrated {migrationResult.migratedSlides} slides, 
                  {migrationResult.migratedHotspots} interactive elements
                </span>
              </div>
            </div>
          </div>
        )}
        
        {/* Responsive Modals */}
        {/* Use proper MobileSlidesModal instead of ResponsiveModal with placeholder */}
        {state.ui.slidesModal && (
          <MobileSlidesModal
            slides={slideDeck.slides}
            currentSlideIndex={state.ui.currentSlideIndex}
            onSlideSelect={(index) => {
              actions.setCurrentSlide(index);
              actions.closeModal('slidesModal');
            }}
            onSlideAdd={handleAddSlide}
            onSlideDelete={handleDeleteSlide}
            onSlideDuplicate={handleDuplicateSlide}
            onClose={() => actions.closeModal('slidesModal')}
          />
        )}
        
        {/* Use proper MobileBackgroundModal instead of ResponsiveModal with placeholder */}
        {state.ui.backgroundModal && currentSlide && (
          <MobileBackgroundModal
            currentSlide={currentSlide}
            onAspectRatioChange={(ratio) => handleAspectRatioChange(state.navigation.currentSlideIndex, ratio)}
            onBackgroundUpload={handleBackgroundUpload}
            onBackgroundRemove={handleBackgroundRemove}
            onBackgroundUpdate={handleBackgroundUpdate}
            onClose={() => actions.closeModal('backgroundModal')}
          />
        )}
        
        {/* Use proper MobileInsertModal instead of ResponsiveModal */}
        {state.ui.insertModal && (
          <MobileInsertModal
            onInsertElement={(type) => handleAddElement(type)}
            onClose={() => actions.closeModal('insertModal')}
          />
        )}
        
        {/* Use proper MobileAspectRatioModal instead of ResponsiveModal with placeholder */}
        {state.ui.aspectRatioModal && currentSlide && (
          <MobileAspectRatioModal
            isOpen={state.ui.aspectRatioModal}
            currentRatio={currentSlide.layout?.aspectRatio || '16:9'}
            onRatioChange={(ratio) => handleAspectRatioChange(state.navigation.currentSlideIndex, ratio)}
            onClose={() => actions.closeModal('aspectRatioModal')}
          />
        )}
        
        <ResponsiveModal
          type="share"
          isOpen={state.ui.shareModal}
          onClose={() => actions.closeModal('shareModal')}
          title="Share Project"
        >
          {/* Share modal content */}
          <div className="p-4">
            <p>Share settings content will go here</p>
          </div>
        </ResponsiveModal>
        
        <ResponsiveModal
          type="settings"
          isOpen={state.ui.settingsModal}
          onClose={() => actions.closeModal('settingsModal')}
          title="Project Settings"
        >
          {/* Settings modal content */}
          <div className="p-4">
            <p>Project settings content will go here</p>
          </div>
        </ResponsiveModal>
      </div>
    </ProjectThemeProvider>
  );
};

export default UnifiedSlideEditor;