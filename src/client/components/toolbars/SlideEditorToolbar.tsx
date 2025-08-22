import React, { useState } from 'react';
import { Project } from '../../../shared/types';
import { Z_INDEX_TAILWIND } from '../../utils/zIndexLevels';
import AuthButton from '../auth/AuthButton';
import { CheckIcon } from '../icons/CheckIcon';
import { ChevronLeftIcon } from '../icons/ChevronLeftIcon';
import { ExternalLinkIcon } from '../icons/ExternalLinkIcon';
import { EyeIcon } from '../icons/EyeIcon';
import { GearIcon } from '../icons/GearIcon';
import { SaveIcon } from '../icons/SaveIcon';
import { ShareIcon } from '../icons/ShareIcon';
import ShareModal from '../modals/ShareModal';

interface SlideEditorToolbarProps {
  projectName: string;
  onSave: () => Promise<void>;
  onClose: () => void;
  isSaving: boolean;
  isPublished: boolean;
  onImageUpload: (file: File) => void;
  project?: Project;
  onTogglePreview: () => void;
  onLivePreview: () => void;
  isPreview: boolean;
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
  onImageUpload: _onImageUpload,
  project,
  onTogglePreview,
  onLivePreview,
  isPreview
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


  };

  // Unified responsive toolbar using CSS breakpoints with modern dark blue theme
  return (
    <>
      <div className={`slide-editor-toolbar bg-[#17214a] text-white shadow-2xl ${Z_INDEX_TAILWIND.TOOLBAR}`}>
        <div className="flex items-center p-3 md:p-4">
          {/* Left: Back button and project info */}
          <div className="flex items-center gap-2 md:gap-4 min-w-0">
            <button
              onClick={onClose}
              className="flex items-center gap-1 md:gap-2 text-slate-300 hover:text-white transition-colors rounded-lg p-2 md:px-3 hover:bg-slate-700"
              aria-label="Back to projects">

              <span className="material-icons w-5 h-5 text-lg">arrow_back_ios</span>
              <span className="hidden md:inline font-medium">Back</span>
            </button>
            
            <div className="hidden md:block h-6 w-px bg-slate-600" />
            
            <div className="flex items-center gap-2 md:gap-3 min-w-0">
              {/* Project name with red color */}
              <h1 className="text-lg md:text-xl font-bold text-[#b73031] truncate max-w-32 md:max-w-none">
                {projectName}
              </h1>
              {isPublished &&
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-2 md:px-3 py-1 rounded-lg text-xs font-semibold text-white shadow-lg">
                  <span className="hidden md:inline">PUBLISHED</span>
                  <span className="md:hidden">PUB</span>
                </div>
              }
            </div>
          </div>

          {/* Center: Expli.Co Learning branding */}
          <div className="flex-1 text-center">
            <div className="flex items-center justify-center">
              <span className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-red-500 via-blue-500 to-indigo-600 text-transparent bg-clip-text">
                Expli.Co Learning
              </span>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1 md:gap-3">
            <button
              onClick={onTogglePreview}
              className={`flex items-center gap-1 md:gap-2 p-2 md:px-4 md:py-2 text-slate-300 md:text-white hover:text-white transition-colors rounded-lg hover:bg-slate-700 md:font-medium ${
                isPreview ? 'md:bg-purple-700' : 'md:bg-purple-600 md:hover:bg-purple-700'
              }`}
              aria-label="Toggle preview"
            >
              <EyeIcon className="w-4 h-4" />
              <span className="hidden md:inline">{isPreview ? 'Editing' : 'Preview'}</span>
            </button>

            <button
              onClick={onLivePreview}
              className="flex items-center gap-1 md:gap-2 p-2 md:px-4 md:py-2 text-slate-300 md:text-white hover:text-white transition-colors rounded-lg hover:bg-slate-700 md:bg-[#b73031] md:hover:bg-[#9c2829] md:font-medium"
              aria-label="Live preview"
            >
              <span className="material-icons w-4 h-4 text-sm">play_circle_outline</span>
              <span className="hidden md:inline">Live Preview</span>
            </button>

            {/* Save Button - responsive design */}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`flex items-center gap-1 md:gap-2 rounded-lg transition-all duration-200 ${
              isSaving ?
              'cursor-not-allowed' :
              ''} ${

              // Mobile: icon only with color changes, Desktop: full button styling
              'p-2 md:py-2 md:px-4 md:shadow-md md:font-semibold md:text-white'} ${

              isSaving ?
              'text-slate-400 md:bg-green-500' :
              showSuccessMessage ?
              'text-green-400 md:bg-green-500' :
              'text-slate-300 hover:text-white hover:bg-slate-700 md:bg-[#1e3fe8] md:hover:bg-[#1833b7]'}`
              }
              aria-label="Save project">

              {isSaving ?
              <>
                  <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                  <span className="hidden md:inline">Saving...</span>
                </> :
              showSuccessMessage ?
              <>
                  <CheckIcon className="w-4 h-4" />
                  <span className="hidden md:inline">Saved!</span>
                </> :

              <>
                  <span className="material-icons w-4 h-4 text-sm md:mr-1">save</span>
                  <span className="hidden md:inline">Save</span>
                </>
              }
            </button>

            {/* Share Button */}
            {project &&
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="flex items-center gap-1 md:gap-2 p-2 md:px-4 md:py-2 text-slate-300 md:text-white hover:text-white transition-colors rounded-lg hover:bg-slate-700 md:bg-[#687178] md:hover:bg-[#545b60] md:font-medium"
              aria-label="Share project">

                <span className="material-icons w-4 h-4 text-sm">share</span>
                <span className="hidden md:inline">Share</span>
              </button>
            }

            {/* Divider - desktop only */}
            <div className="hidden md:block h-6 w-px bg-slate-600" />

            {/* Settings Button */}
            <button
              onClick={handleSettings}
              className="flex items-center gap-1 md:gap-2 p-2 md:px-3 md:py-2 text-slate-300 md:text-slate-200 hover:text-white transition-colors rounded-lg hover:bg-slate-700"
              aria-label="Project settings">

              <span className="material-icons w-4 h-4 text-sm">settings</span>
              <span className="hidden md:inline">Settings</span>
            </button>

            {/* Divider - desktop only */}
            <div className="hidden md:block h-6 w-px bg-slate-600" />

            {/* Auth Button */}
            <AuthButton variant="toolbar" />
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {project &&
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        project={project} />

      }
    </>);

};

export default SlideEditorToolbar;