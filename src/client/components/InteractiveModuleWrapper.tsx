import React, { Fragment, useMemo, useState } from 'react';
import InteractiveModule from './InteractiveModule';
import Modal from './Modal';
import { InteractiveModuleState, Project } from '../../shared/types';

interface InteractiveModuleWrapperProps {
  selectedProject: Project;
  isEditingMode: boolean;
  isMobile: boolean;
  onClose: () => void;
  onSave: (projectId: string, data: InteractiveModuleState, thumbnailUrl?: string) => void;
  onReloadRequest?: () => void;
}

const InteractiveModuleWrapper: React.FC<InteractiveModuleWrapperProps> = ({
  selectedProject,
  isEditingMode,
  isMobile,
  onClose,
  onSave,
  onReloadRequest
}) => {
  // ✅ ALWAYS call the same hooks in the same order
  const [isModalOpen, setIsModalOpen] = useState(true);
  
  // ✅ Determine wrapper type without affecting hook order
  const WrapperComponent = useMemo(() => {
    if (isEditingMode && !isMobile) {
      return Modal; // Desktop editing uses modal
    }
    return Fragment; // Mobile editing and viewing use full-screen
  }, [isEditingMode, isMobile]);
  
  const wrapperProps = useMemo(() => {
    if (isEditingMode && !isMobile) {
      return {
        isOpen: isModalOpen,
        onClose: () => {
          setIsModalOpen(false);
          onClose();
        },
        title: selectedProject.title
      };
    }
    return {};
  }, [isEditingMode, isMobile, isModalOpen, onClose, selectedProject.title]);
  
  return (
    <div className="fixed inset-0 z-50 bg-slate-900">
      <WrapperComponent {...wrapperProps}>
        {selectedProject.interactiveData.hotspots && selectedProject.interactiveData.timelineEvents ? (
          <InteractiveModule
            key={`${selectedProject.id}-${isEditingMode}-details-loaded`}
            initialData={selectedProject.interactiveData}
            isEditing={isEditingMode}
            onSave={(data, thumbnailUrl) => onSave(selectedProject.id, data, thumbnailUrl)}
            onClose={onClose}
            projectName={selectedProject.title}
            projectId={selectedProject.id}
            onReloadRequest={onReloadRequest}
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