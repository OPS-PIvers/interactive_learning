/**
 * Responsive Header Component
 * 
 * Truly unified header that adapts using responsive CSS and viewport-based logic.
 * Progressive enhancement from mobile-first foundation to desktop features.
 */

import React from 'react';
import { ChevronLeftIcon } from '../icons/ChevronLeftIcon';
import { EyeIcon } from '../icons/EyeIcon';
import { PencilIcon } from '../icons/PencilIcon';
import { SaveIcon } from '../icons/SaveIcon';
import { CheckIcon } from '../icons/CheckIcon';
import { GearIcon } from '../icons/GearIcon';
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
 * ResponsiveHeader - Truly unified header with responsive behavior
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
  return (
    <div className="bg-slate-800 border-b border-slate-700 text-white shadow-lg sm:shadow-2xl">
      <div className="px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2">
        {/* Left section */}
        <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1 sm:flex-initial">
          {/* Back button */}
          <button
            onClick={onClose}
            className="flex items-center gap-1 sm:gap-2 text-slate-300 hover:text-white transition-colors p-1 sm:p-2 -ml-1 sm:-ml-0 rounded-lg hover:bg-slate-700"
          >
            <ChevronLeftIcon className="w-5 h-5" />
            <span className="text-sm sm:text-base font-medium hidden xs:inline">
              <span className="sm:hidden">Back</span>
              <span className="hidden sm:inline">Back to Dashboard</span>
            </span>
          </button>
          
          {/* Project name - responsive sizing and truncation */}
          <div className="hidden sm:block border-l border-slate-600 pl-4">
            <h1 className="text-lg sm:text-xl font-bold text-white truncate max-w-xs lg:max-w-md">
              {projectName}
            </h1>
          </div>
          
          {/* Mobile project name - center aligned */}
          <div className="sm:hidden flex-1 text-center mx-2">
            <h1 className="text-base font-semibold text-white truncate">
              {projectName}
            </h1>
          </div>
        </div>
        
        {/* Center section - Status indicators (desktop only) */}
        <div className="hidden lg:flex items-center gap-4">
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
        
        {/* Right section - Actions */}
        <div className="flex items-center gap-1 sm:gap-3">
          {/* Preview toggle */}
          <button
            onClick={onTogglePreview}
            className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-lg font-medium transition-all text-xs sm:text-sm ${
              isPreviewMode
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-slate-700 text-slate-300 hover:text-white hover:bg-slate-600'
            }`}
            title={isPreviewMode ? 'Exit Preview' : 'Preview'}
          >
            {isPreviewMode ? <PencilIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
            <span className="hidden sm:inline">
              {isPreviewMode ? 'Edit' : 'Preview'}
            </span>
          </button>
          
          {/* Save button - adaptive sizing */}
          <button
            onClick={onSave}
            disabled={isSaving}
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors text-xs sm:text-sm"
            title={isSaving ? 'Saving...' : 'Save'}
          >
            <SaveIcon className="w-4 h-4" />
            <span className="hidden xs:inline">{isSaving ? 'Saving...' : 'Save'}</span>
          </button>
          
          {/* Settings */}
          <button
            onClick={onOpenSettings}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            title="Settings"
          >
            <GearIcon className="w-4 sm:w-5 h-4 sm:h-5" />
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