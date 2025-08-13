import debounce from 'lodash.debounce';
import React, { Fragment, useMemo, useState, useCallback, Suspense, lazy } from 'react';
import { SlideDeck, ThemePreset } from '../../shared/slideTypes';
import { InteractiveModuleState, Project } from '../../shared/types';
import { Z_INDEX_TAILWIND } from '../utils/zIndexLevels';
import LoadingScreen from './shared/LoadingScreen';
import SlideBasedInteractiveModule from './SlideBasedInteractiveModule';
import SlideViewer from './slides/SlideViewer';

// Lazy load the heavy editor component
const UnifiedSlideEditor = lazy(() => import('./slides/UnifiedSlideEditor'));

// Note: This wrapper is now primarily for editing mode.
// Viewing mode uses the separate ViewerView component with its own route.
interface InteractiveModuleWrapperProps {
  selectedProject: Project;
  isEditingMode: boolean;
  onClose: () => void;
  onSave: (projectId: string, data: InteractiveModuleState, thumbnailUrl?: string, slideDeck?: SlideDeck) => void;
  onImageUpload: (file: File) => Promise<void>;
  onReloadRequest?: () => void;
  isPublished?: boolean;
  onProjectThemeChange?: (themeId: ThemePreset) => void;
}

const InteractiveModuleWrapper: React.FC<InteractiveModuleWrapperProps> = ({
  selectedProject,
  isEditingMode,
  onClose,
  onSave,
  onImageUpload,
  onReloadRequest,
  isPublished,
  onProjectThemeChange
}) => {
  // ✅ ALWAYS call the same hooks in the same order
  const [_isModalOpen, _setIsModalOpen] = useState(true);
  const [slideDeck, setSlideDeck] = useState<SlideDeck | null>(
    selectedProject.slideDeck || null
  );

  // Debounced save function to prevent excessive network requests
  const debouncedSave = useMemo(
    () =>
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
    // Use Fragment (full-screen) for unified responsive editing
    return Fragment;
  }, []);
  const wrapperProps = useMemo(() => {
    // No modal props needed - unified full-screen editing approach
    return {};
  }, []);
  return (
    <div className={`fixed inset-0 ${Z_INDEX_TAILWIND.MODAL_CONTENT} mobile-viewport-fix ${slideDeck && isEditingMode ? '' : 'bg-slate-900'}`}>
      <WrapperComponent {...wrapperProps}>
        {/* Native slide projects - use comprehensive slide editor */}
        {slideDeck && isEditingMode ?
        <Suspense fallback={<LoadingScreen message="Loading Slide Editor..." />}>
            <UnifiedSlideEditor
            slideDeck={slideDeck}
            projectName={selectedProject.title}
            projectId={selectedProject.id}
            projectTheme={selectedProject.theme as ThemePreset || 'professional'}
            onSlideDeckChange={handleSlideDeckChange}
            {...(onProjectThemeChange && { onProjectThemeChange })}
            onSave={handleImmediateSave}
            onImageUpload={onImageUpload}
            onClose={onClose}
            isPublished={selectedProject.isPublished || false} />

          </Suspense> :
        slideDeck ?
        <SlideViewer
          slideDeck={slideDeck}
          showTimeline={!isEditingMode}
          timelineAutoPlay={false}
          onSlideChange={(_slideId, _slideIndex) => {

          }}
          onInteraction={(_interaction) => {

          }} /> :

        /* All projects now use slide-based architecture */
        selectedProject.interactiveData ?
        <SlideBasedInteractiveModule
          key={`${selectedProject.id}-${isEditingMode}-slide-based`}
          initialData={selectedProject.interactiveData}
          isEditing={isEditingMode}
          onSave={(projectData) => {
            // Handle both legacy data and full project objects
            if (projectData.slideDeck && projectData.projectType === 'slide') {
              // New slide-based project with slide deck data
              onSave(selectedProject.id, projectData, projectData.thumbnailUrl, projectData.slideDeck);
            } else {
              // Legacy project format
              onSave(selectedProject.id, projectData, projectData.thumbnailUrl);
            }
          }}
          onImageUpload={onImageUpload}
          onClose={onClose}
          projectName={selectedProject.title}
          projectId={selectedProject.id}
          {...onReloadRequest && { onReloadRequest }}
          {...isPublished !== undefined && { isPublished }}
          viewerModes={{
            explore: true,
            selfPaced: true,
            timed: false
          }} /> :


        <div className="flex items-center justify-center h-full">
            <p className="text-slate-400 text-xl">
              {isEditingMode ? 'Loading editor...' : 'Loading viewer...'}
            </p>
          </div>
        }
      </WrapperComponent>
    </div>);

};

export default InteractiveModuleWrapper;