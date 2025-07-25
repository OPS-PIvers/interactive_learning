import React, { Fragment, useMemo, useState, useCallback } from 'react';
import debounce from 'lodash.debounce';
import SlideBasedInteractiveModule from './SlideBasedInteractiveModule';
import Modal from './Modal';
import { InteractiveModuleState, Project } from '../../shared/types';
import SlideEditor from './slides/SlideEditor';
import { SlideDeck } from '../../shared/slideTypes';
import SlideViewer from './slides/SlideViewer';

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
  
  // ✅ Determine wrapper type without affecting hook order
  const WrapperComponent = useMemo(() => {
    // Use Fragment (full-screen) for all slide editing modes
    // Only use Modal for legacy non-slide projects if needed
    if (slideDeck && isEditingMode) {
      return Fragment; // All slide editing uses full-screen
    }
    if (isEditingMode && !isMobile) {
      return Modal; // Legacy desktop editing uses modal
    }
    return Fragment; // Mobile editing and viewing use full-screen
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
        {/* Native slide projects - use existing slide components */}
        {slideDeck && isEditingMode ? (
          <SlideEditor
            slideDeck={slideDeck}
            onSlideDeckChange={handleSlideDeckChange}
            onClose={onClose}
          />
        ) : slideDeck ? (
          <SlideViewer slideDeck={slideDeck} />
        ) : /* All projects now use slide-based architecture */ 
        selectedProject.interactiveData ? (
          <SlideBasedInteractiveModule
            key={`${selectedProject.id}-${isEditingMode}-slide-based`}
            initialData={selectedProject.interactiveData}
            isEditing={isEditingMode}
            onSave={(data, thumbnailUrl) => onSave(selectedProject.id, data, thumbnailUrl)}
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