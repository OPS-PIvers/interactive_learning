import React, { useState } from 'react';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
// Assuming these icons exist or will be created
import { MenuIcon } from './icons/MenuIcon';
import { ZoomInIcon } from './icons/ZoomInIcon';
import { ZoomOutIcon } from './icons/ZoomOutIcon';
import { SaveIcon } from './icons/SaveIcon'; // For mobile save button
import { CheckIcon } from './icons/CheckIcon'; // Import CheckIcon
import { PlusCircleIcon } from './icons/PlusCircleIcon'; // Import for Add Hotspot button
import EnhancedModalEditorToolbar, { COLOR_SCHEMES } from './EnhancedModalEditorToolbar';

interface EditorToolbarProps {
  projectName: string;
  onBack: () => void;
  onReplaceImage: (file: File) => void;
  
  // Auto-progression
  isAutoProgression: boolean;
  onToggleAutoProgression: (enabled: boolean) => void;
  autoProgressionDuration: number;
  onAutoProgressionDurationChange: (duration: number) => void;
  
  // Zoom controls
  currentZoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onCenter: () => void;
  
  // Color schemes
  currentColorScheme: string;
  onColorSchemeChange: (schemeName: string) => void;
  
  // Save
  onSave: () => void;
  isSaving: boolean;
  showSuccessMessage: boolean;
  isMobile?: boolean; // Already present as per instructions
  onAddHotspot: () => void; // Prop for adding a hotspot
}

const EditorToolbar: React.FC<EditorToolbarProps> = (props) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false); // For mobile collapsible menu

  if (props.isMobile) {
    const saveButtonClasses = `p-2 rounded transition-colors flex items-center justify-center ${
      props.isSaving
        ? 'text-slate-400 cursor-not-allowed'
        : props.showSuccessMessage
        ? 'text-green-400'
        : 'text-slate-300 hover:text-white'
    }`;

    return (
      <>
        <div className="fixed top-0 left-0 right-0 bg-slate-800 border-b border-slate-700 z-50 h-14 flex items-center justify-between px-2">
          {/* Left: Back Button & Title */}
          <div className="flex items-center gap-2">
            <button
              onClick={props.onBack}
              className="p-2 text-slate-300 hover:text-white transition-colors"
            >
              <ChevronLeftIcon className="w-6 h-6" />
            </button>
            <h1 className="text-md font-semibold text-white truncate max-w-32 sm:max-w-48">
              {props.projectName}
            </h1>
          </div>

          {/* Center: Add Hotspot Button */}
          <div className="flex items-center gap-1">
            <button
              onClick={props.onAddHotspot}
              className="flex items-center gap-1 text-slate-300 hover:text-white bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded transition-colors"
              title="Add Hotspot"
            >
              <PlusCircleIcon className="w-5 h-5" />
              <span className="text-sm">Add</span>
            </button>
          </div>

          {/* Right: Save & Menu */}
          <div className="flex items-center gap-1">
            <button
              onClick={props.onSave}
              disabled={props.isSaving}
              className={saveButtonClasses}
            >
              {props.isSaving ? (
                <span className="animate-spin w-5 h-5 border-2 border-slate-300 border-t-transparent rounded-full" />
              ) : props.showSuccessMessage ? (
                <CheckIcon className="w-6 h-6 text-green-400" /> // Use CheckIcon for success
              ) : (
                <SaveIcon className="w-6 h-6" />
              )}
            </button>
            <button
              onClick={() => setShowMobileMenu(true)} // Open collapsible menu/modal
              className="p-2 text-slate-300 hover:text-white transition-colors"
            >
              <MenuIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Collapsible Menu (Modal for advanced controls) */}
        {/* Reusing EnhancedModalEditorToolbar for now, might need a more mobile-specific one later */}
        <EnhancedModalEditorToolbar
          isOpen={showMobileMenu}
          onClose={() => setShowMobileMenu(false)}
          {...props}
          isMobile={true} // Pass isMobile to the modal as well
        />
      </>
    );
  }

  // Desktop Toolbar (Original Structure)
  return (
    <>
      {/* Minimal Top Bar with Settings Button */}
      <div className="fixed top-0 left-0 right-0 bg-slate-800 border-b border-slate-700 z-50 h-14">
        <div className="flex items-center justify-between h-full px-4">
          {/* Left Section */}
          <div className="flex items-center gap-4">
            <button
              onClick={props.onBack}
              className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
            >
              <ChevronLeftIcon className="w-5 h-5" />
              <span className="font-medium">Back</span>
            </button>
            
            <div className="h-6 w-px bg-slate-600" />
            
            <h1 className="text-lg font-semibold text-white truncate max-w-48">
              {props.projectName}
            </h1>

            <button
              onClick={props.onAddHotspot}
              className="flex items-center gap-2 text-slate-300 hover:text-white bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-md transition-colors"
              title="Add Hotspot"
            >
              <PlusCircleIcon className="w-5 h-5" />
              <span>Add Hotspot</span>
            </button>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-4">
            {/* Quick Save Button */}
            <button
              onClick={props.onSave}
              disabled={props.isSaving}
              className={`font-semibold py-1.5 px-4 rounded shadow-md transition-all duration-200 flex items-center space-x-2 ${
                props.isSaving 
                  ? 'bg-green-500 cursor-not-allowed' 
                  : props.showSuccessMessage 
                    ? 'bg-green-500' 
                    : 'bg-green-600 hover:bg-green-700'
              } text-white`}
            >
              {props.isSaving ? (
                <>
                  <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  <span>Saving...</span>
                </>
              ) : props.showSuccessMessage ? (
                <>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Saved!</span>
                </>
              ) : (
                <span>Save</span>
              )}
            </button>

            <div className="h-6 w-px bg-slate-600" />

            {/* Settings Button */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-slate-700 hover:bg-slate-600 text-slate-200 px-4 py-1.5 rounded font-medium transition-colors"
            >
              Settings
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Modal Settings Panel */}
      <EnhancedModalEditorToolbar
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        {...props}
      />
    </>
  );
};

export { COLOR_SCHEMES };
export default EditorToolbar;