import React, { useState } from 'react';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { SaveIcon } from './icons/SaveIcon';
import { CheckIcon } from './icons/CheckIcon';
import { GearIcon } from './icons/GearIcon';
import { ShareIcon } from './icons/ShareIcon';
import AuthButton from './AuthButton';
import ShareModal from './ShareModal';
import { Project } from '../../shared/types';

interface SlideEditorToolbarProps {
  projectName: string;
  onSave: () => Promise<void>;
  onClose: () => void;
  isSaving: boolean;
  isPublished: boolean;
  onImageUpload: (file: File) => void;
  isMobile: boolean;
  project?: Project;
}

/**
 * SlideEditorToolbar - Toolbar component designed for slide-based editing
 * 
 * Replaces the outdated EditorToolbar.tsx which contained hotspot-specific
 * functionality and zoom controls incompatible with the slide architecture.
 */
const SlideEditorToolbar: React.FC<SlideEditorToolbarProps> = ({
  projectName,
  onSave,
  onClose,
  isSaving,
  isPublished,
  onImageUpload,
  isMobile,
  project
}) => {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const handleSave = async () => {
    try {
      await onSave();
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 2000);
    } catch (error) {
      console.error('Save failed:', error);
    }
  };

  const handleSettings = () => {
    // TODO: Implement slide-specific settings modal
    console.log('Slide settings - to be implemented');
  };

  if (isMobile) {
    return (
      <>
        <div className="slide-editor-toolbar bg-slate-800 border-b border-slate-700 text-white p-4 flex items-center justify-between shadow-2xl">
          {/* Left: Back button and project name */}
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="p-2 text-slate-300 hover:text-white transition-colors rounded-lg hover:bg-slate-700"
              aria-label="Back to projects"
            >
              <ChevronLeftIcon className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 truncate max-w-32">
              {projectName}
            </h1>
          </div>

          {/* Right: Save, Share, Auth, Settings */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`p-2 rounded-lg transition-colors ${
                isSaving
                  ? 'text-slate-400 cursor-not-allowed'
                  : showSuccessMessage
                  ? 'text-green-400'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
              aria-label="Save project"
            >
              {isSaving ? (
                <div className="animate-spin w-5 h-5 border-2 border-slate-300 border-t-transparent rounded-full" />
              ) : showSuccessMessage ? (
                <CheckIcon className="w-5 h-5" />
              ) : (
                <SaveIcon className="w-5 h-5" />
              )}
            </button>

            {project && (
              <button
                onClick={() => setIsShareModalOpen(true)}
                className="p-2 text-slate-300 hover:text-white transition-colors rounded-lg hover:bg-slate-700"
                aria-label="Share project"
              >
                <ShareIcon className="w-5 h-5" />
              </button>
            )}

            <AuthButton variant="compact" />

            <button
              onClick={handleSettings}
              className="p-2 text-slate-300 hover:text-white transition-colors rounded-lg hover:bg-slate-700"
              aria-label="Project settings"
            >
              <GearIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Share Modal */}
        {project && (
          <ShareModal
            isOpen={isShareModalOpen}
            onClose={() => setIsShareModalOpen(false)}
            project={project}
          />
        )}
      </>
    );
  }

  // Desktop toolbar
  return (
    <>
      <div className="slide-editor-toolbar bg-slate-800 border-b border-slate-700 text-white p-4 flex items-center justify-between shadow-2xl">
        {/* Left: Back button and project info */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onClose}
            className="flex items-center space-x-2 text-slate-300 hover:text-white transition-colors rounded-lg px-3 py-2 hover:bg-slate-700"
          >
            <ChevronLeftIcon className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </button>
          
          <div className="h-6 w-px bg-slate-600" />
          
          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
              {projectName}
            </h1>
            {isPublished && (
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-3 py-1 rounded-lg text-xs font-semibold text-white shadow-lg">
                PUBLISHED
              </div>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-3">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`font-semibold py-2 px-4 rounded-lg shadow-md transition-all duration-200 flex items-center space-x-2 ${
              isSaving 
                ? 'bg-green-500 cursor-not-allowed' 
                : showSuccessMessage 
                  ? 'bg-green-500' 
                  : 'bg-green-600 hover:bg-green-700'
            } text-white`}
          >
            {isSaving ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                <span>Saving...</span>
              </>
            ) : showSuccessMessage ? (
              <>
                <CheckIcon className="w-4 h-4" />
                <span>Saved!</span>
              </>
            ) : (
              <span>Save</span>
            )}
          </button>

          {project && (
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
            >
              <ShareIcon className="w-4 h-4" />
              <span>Share</span>
            </button>
          )}

          <div className="h-6 w-px bg-slate-600" />

          <button
            onClick={handleSettings}
            className="bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
          >
            <GearIcon className="w-5 h-5" />
            <span>Settings</span>
          </button>

          <div className="h-6 w-px bg-slate-600" />

          <AuthButton variant="toolbar" />
        </div>
      </div>

      {/* Share Modal */}
      {project && (
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          project={project}
        />
      )}
    </>
  );
};

export default SlideEditorToolbar;