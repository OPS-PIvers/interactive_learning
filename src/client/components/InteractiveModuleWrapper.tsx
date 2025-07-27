import React, { Fragment, useMemo, useState, useCallback, Suspense, lazy } from 'react';
import debounce from 'lodash.debounce';
import SlideBasedInteractiveModule from './SlideBasedInteractiveModule';
import Modal from './Modal';
import { InteractiveModuleState, Project } from '../../shared/types';
import { SlideDeck, ThemePreset } from '../../shared/slideTypes';
import SlideViewer from './slides/SlideViewer';
import LoadingScreen from './shared/LoadingScreen';

// Lazy load the heavy editor component
const SlideBasedEditor = lazy(() => import('./SlideBasedEditor'));

// Note: This wrapper is now primarily for editing mode.
// Viewing mode uses the separate ViewerView component with its own route.
interface InteractiveModuleWrapperProps {
  selectedProject: Project;
  isEditingMode: boolean;
  isMobile: boolean;
  onClose: () => void;
  onSave: (projectId: string, data: InteractiveModuleState, thumbnailUrl?: string, slideDeck?: SlideDeck) => void;
  onImageUpload: (file: File) => Promise<void>;
  onReloadRequest?: () => void;
  isPublished?: boolean;
}

const InteractiveModuleWrapper: React.FC<InteractiveModuleWrapperProps> = ({
  selectedProject,
  isEditingMode,
  isMobile,
  onClose,
  onSave,
  onImageUpload,
  onReloadRequest,
  isPublished
}) => {
  // ✅ ALWAYS call the same hooks in the same order
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [slideDeck, setSlideDeck] = useState<SlideDeck | null>(
    selectedProject.slideDeck || null
  );

  // Debounced save function to prevent excessive network requests
  const debouncedSave = useCallback(
    debounce((projectId: string, data: InteractiveModuleState, thumbnailUrl: string | undefined, slideDeck: SlideDeck) => {
      onSave(projectId, data, thumbnailUrl, slideDeck);
    }, 1000), // 1 second delay
    [onSave]
  );

  const handleSlideDeckChange = useCallback((newSlideDeck: SlideDeck) => {
    setSlideDeck(newSlideDeck);
    debouncedSave(selectedProject.id, selectedProject.interactiveData, undefined, newSlideDeck);
  }, [debouncedSave, selectedProject.id, selectedProject.interactiveData]);

  const handleImmediateSave = useCallback(async (currentSlideDeck: SlideDeck) => {
    // Cancel any pending debounced saves and save immediately
    debouncedSave.cancel();
    await onSave(selectedProject.id, selectedProject.interactiveData, undefined, currentSlideDeck);
  }, [onSave, selectedProject.id, selectedProject.interactiveData, debouncedSave]);
  
  // ✅ Determine wrapper type - now simplified since viewer mode uses separate route
  const WrapperComponent = useMemo(() => {
    // Use Fragment (full-screen) for all slide editing modes
    if (slideDeck && isEditingMode) {
      return Fragment; // All slide editing uses full-screen
    }
    if (isEditingMode && !isMobile) {
      return Modal; // Legacy desktop editing uses modal
    }
    return Fragment; // Mobile editing uses full-screen
  }, [isEditingMode, isMobile, slideDeck]);
  
  const wrapperProps = useMemo(() => {
    // Only use modal props for legacy non-slide projects
    if (isEditingMode && !isMobile && !slideDeck) {
      return {
        isOpen: isModalOpen,
        onClose: () => {
          setIsModalOpen(false);
          onClose();
        },
        title: selectedProject.title
      };
    }
    return {
      isOpen: true, // Default for non-modal usage
      onClose: () => {},
      title: ''
    };
  }, [isEditingMode, isMobile, slideDeck, isModalOpen, onClose, selectedProject.title]);
  
  return (
    <div className={`fixed inset-0 z-50 mobile-viewport-fix ${slideDeck && isEditingMode ? '' : 'bg-slate-900'}`}>
      <WrapperComponent {...wrapperProps}>
        {/* Native slide projects - use comprehensive slide editor */}
        {slideDeck && isEditingMode ? (
          <Suspense fallback={<LoadingScreen title="Loading Slide Editor..." />}>
            <SlideBasedEditor
              slideDeck={slideDeck}
              projectName={selectedProject.title}
              projectId={selectedProject.id}
              projectTheme={selectedProject.theme as ThemePreset || 'professional'}
              onSlideDeckChange={handleSlideDeckChange}
              onSave={handleImmediateSave}
              onImageUpload={onImageUpload}
              onClose={onClose}
              isPublished={selectedProject.isPublished || false}
            />
          </Suspense>
        ) : slideDeck ? (
          <SlideViewer 
            slideDeck={slideDeck} 
            showTimeline={!isEditingMode}
            timelineAutoPlay={false}
            onSlideChange={(slideId, slideIndex) => {
              console.log(`Navigated to slide ${slideIndex + 1}: ${slideId}`);
            }}
            onInteraction={(interaction) => {
              console.log('Interaction triggered:', interaction);
            }}
          />
        ) : /* All projects now use slide-based architecture */ 
        selectedProject.interactiveData ? (
          <SlideBasedInteractiveModule
            key={`${selectedProject.id}-${isEditingMode}-slide-based`}
            initialData={selectedProject.interactiveData}
            isEditing={isEditingMode}
            onSave={(projectData) => {
              // Handle both legacy data and full project objects
              if (projectData.slideDeck && projectData.projectType === 'slide') {
                // New slide-based project with slide deck data
                onSave(selectedProject.id, projectData.interactiveData, projectData.thumbnailUrl, projectData.slideDeck);
              } else {
                // Legacy project format
                onSave(selectedProject.id, projectData, projectData.thumbnailUrl);
              }
            }}
            onImageUpload={onImageUpload}
            onClose={onClose}
            projectName={selectedProject.title}
            projectId={selectedProject.id}
            onReloadRequest={onReloadRequest}
            isPublished={isPublished}
            viewerModes={{
              explore: true,
              selfPaced: true,
              timed: false
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-slate-400 text-xl">
              {isEditingMode ? 'Loading editor...' : 'Loading viewer...'}
            </p>
          </div>
        )}
      </WrapperComponent>
    </div>
  );
};

export default InteractiveModuleWrapper;