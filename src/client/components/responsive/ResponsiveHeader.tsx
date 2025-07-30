/**
 * Responsive Header Component
 * 
 * Unified header that adapts between desktop and mobile layouts.
 * Provides consistent navigation and actions across all device types.
 */

import React from 'react';
import { useIsMobile } from '../../hooks/useIsMobile';
import { ChevronLeftIcon } from '../icons/ChevronLeftIcon';
import { EyeIcon } from '../icons/EyeIcon';
import { PencilIcon } from '../icons/PencilIcon';
import { SaveIcon } from '../icons/SaveIcon';
import { CheckIcon } from '../icons/CheckIcon';
import { GearIcon } from '../icons/GearIcon';
import { UserIcon } from '../icons/UserIcon';
import { EyeSlashIcon } from '../icons/EyeSlashIcon';
import AuthButton from '../AuthButton';

export interface ResponsiveHeaderProps {
  projectName: string;
  isPreviewMode: boolean;
  isSaving: boolean;
  showSuccessMessage: boolean;
  onTogglePreview: () => void;
  onSave: () => void;
  onClose: () => void;
  onOpenSettings: () => void;
  onOpenShare: () => void;
  isPublished: boolean;
}

/**
 * ResponsiveHeader - Adaptive header supporting both desktop and mobile layouts
 */
export const ResponsiveHeader: React.FC<ResponsiveHeaderProps> = ({
  projectName,
  isPreviewMode,
  isSaving,
  showSuccessMessage,
  onTogglePreview,
  onSave,
  onClose,
  onOpenSettings,
  onOpenShare,
  isPublished,
}) => {
  const isMobile = useIsMobile();
  
  if (isMobile) {
    // Mobile layout - single row, compact design
    return (
      <div className="bg-slate-800 border-b border-slate-700 text-white shadow-2xl">
        <div className="px-3 py-3 flex items-center justify-between">
          {/* Left: Back button */}
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors p-2 -ml-2 rounded-lg"
          >
            <ChevronLeftIcon className="w-5 h-5" />
            <span className="text-sm font-medium">Back</span>
          </button>
          
          {/* Center: Project name */}
          <div className="flex-1 text-center mx-4">
            <h1 className="text-lg font-semibold text-white truncate">
              {projectName}
            </h1>
          </div>
          
          {/* Right: Actions */}
          <div className="flex items-center gap-1">
            {/* Preview toggle */}
            <button
              onClick={onTogglePreview}
              className={`p-2 rounded-lg transition-colors ${
                isPreviewMode 
                  ? 'bg-blue-600 text-white' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
              title={isPreviewMode ? 'Exit Preview' : 'Preview'}
            >
              {isPreviewMode ? <PencilIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
            </button>
            
            {/* Settings */}
            <button
              onClick={onOpenSettings}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              title="Settings"
            >
              <GearIcon className="w-5 h-5" />
            </button>
            
            {/* Profile/Auth */}
            <AuthButton
              onShare={isPublished ? onOpenShare : undefined}
            />
          </div>
        </div>
      </div>
    );
  }
  
  // Desktop layout - more spacious with additional features
  return (
    <div className="bg-slate-800 border-b border-slate-700 text-white shadow-lg">
      <div className="px-6 py-4 flex items-center justify-between">
        {/* Left section */}
        <div className="flex items-center gap-4">
          {/* Back button */}
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors p-2 rounded-lg hover:bg-slate-700"
          >
            <ChevronLeftIcon className="w-5 h-5" />
            <span className="font-medium">Back to Dashboard</span>
          </button>
          
          {/* Project name */}
          <div className="border-l border-slate-600 pl-4">
            <h1 className="text-xl font-bold text-white">
              {projectName}
            </h1>
          </div>
        </div>
        
        {/* Center section - Status indicators */}
        <div className="flex items-center gap-4">
          {/* Save status */}
          {isSaving && (
            <div className="flex items-center gap-2 text-blue-400">
              <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Saving...</span>
            </div>
          )}
          
          {showSuccessMessage && (
            <div className="flex items-center gap-2 text-green-400">
              <CheckIcon className="w-4 h-4" />
              <span className="text-sm">Saved</span>
            </div>
          )}
        </div>
        
        {/* Right section */}
        <div className="flex items-center gap-3">
          {/* Preview toggle */}
          <button
            onClick={onTogglePreview}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              isPreviewMode
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-slate-700 text-slate-300 hover:text-white hover:bg-slate-600'
            }`}
          >
            {isPreviewMode ? (
              <>
                <PencilIcon className="w-4 h-4" />
                <span>Edit</span>
              </>
            ) : (
              <>
                <EyeIcon className="w-4 h-4" />
                <span>Preview</span>
              </>
            )}
          </button>
          
          {/* Save button */}
          <button
            onClick={onSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
          >
            <SaveIcon className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save'}</span>
          </button>
          
          {/* Settings */}
          <button
            onClick={onOpenSettings}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            title="Project Settings"
          >
            <GearIcon className="w-5 h-5" />
          </button>
          
          {/* Profile/Auth */}
          <AuthButton
            onShare={isPublished ? onOpenShare : undefined}
          />
        </div>
      </div>
    </div>
  );
};

export default ResponsiveHeader;