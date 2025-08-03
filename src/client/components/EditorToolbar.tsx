/**
 * @deprecated Legacy editor toolbar component - use SlideEditorToolbar.tsx instead
 * This component contains hotspot-specific functionality incompatible with slide architecture
 * Scheduled for removal in next major version
 */
import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
// Assuming these icons exist or will be created
import { MenuIcon } from './icons/MenuIcon';
import { GearIcon } from './icons/GearIcon';
// Removed ZoomInIcon and ZoomOutIcon imports - incompatible with slide architecture
import { SaveIcon } from './icons/SaveIcon'; // For mobile save button
import { CheckIcon } from './icons/CheckIcon'; // Import CheckIcon
// Removed PlusCircleIcon import - Add Hotspot functionality incompatible with slide architecture
import EnhancedModalEditorToolbar, { COLOR_SCHEMES } from './EnhancedModalEditorToolbar';
import ShareModal from './ShareModal';
import AuthButton from './AuthButton';
import { Project } from '../../shared/types';
import { triggerHapticFeedback } from '../utils/hapticUtils'; // Import haptic utility
import { Z_INDEX_TAILWIND } from '../utils/zIndexLevels';

interface EditorToolbarProps {
  projectName: string;
  onBack: () => void;
  onReplaceImage: (file: File) => void;
  
  // Auto-progression
  isAutoProgression: boolean;
  onToggleAutoProgression: (enabled: boolean) => void;
  autoProgressionDuration: number;
  onAutoProgressionDurationChange: (duration: number) => void;
  
  // Zoom controls - REMOVED: Incompatible with slide architecture
  
  // Color schemes
  currentColorScheme: string;
  onColorSchemeChange: (schemeName: string) => void;

  // Viewer Modes
  viewerModes: {
    explore?: boolean;
    selfPaced?: boolean;
    timed?: boolean;
  };
  onViewerModeChange: (mode: 'explore' | 'selfPaced' | 'timed', enabled: boolean) => void;
  
  // Save
  onSave: () => void;
  isSaving: boolean;
  showSuccessMessage: boolean;
  isMobile?: boolean; // Already present as per instructions
  // Add hotspot functionality - REMOVED: Incompatible with slide architecture
  
  // Share functionality
  project?: Project; // Optional project data for sharing

  // Background settings props to pass to EnhancedModalEditorToolbar
  backgroundImage?: string;
  backgroundType?: 'image' | 'video';
  backgroundVideoType?: 'youtube' | 'mp4';
  onBackgroundImageChange: (url: string) => void;
  onBackgroundTypeChange: (type: 'image' | 'video') => void;
  onBackgroundVideoTypeChange: (type: 'youtube' | 'mp4') => void;
}

const EditorToolbar: React.FC<EditorToolbarProps> = (props) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false); // For mobile collapsible menu
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [mobileSaveSuccessActive, setMobileSaveSuccessActive] = useState(false);
  const mobileSaveSuccessTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear the timer on unmount
    return () => {
      if (mobileSaveSuccessTimerRef.current) {
        clearTimeout(mobileSaveSuccessTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (props.isMobile && props.showSuccessMessage && !props.isSaving) {
      setMobileSaveSuccessActive(true);
      if (mobileSaveSuccessTimerRef.current) {
        clearTimeout(mobileSaveSuccessTimerRef.current);
      }
      mobileSaveSuccessTimerRef.current = setTimeout(() => {
        setMobileSaveSuccessActive(false);
        // Potentially call a prop to reset parent's showSuccessMessage if needed,
        // but for now, EditorToolbar manages its own visual success state timing.
      }, 2500); // Show success for 2.5 seconds
    } else if (props.isMobile && !props.showSuccessMessage) {
      // If the parent component explicitly turns off showSuccessMessage, respect that.
      setMobileSaveSuccessActive(false);
      if (mobileSaveSuccessTimerRef.current) {
        clearTimeout(mobileSaveSuccessTimerRef.current);
      }
    }
  }, [props.showSuccessMessage, props.isSaving, props.isMobile]);

  // Effect to clear success timer if saving starts (relevant for mobile context)
  useEffect(() => {
    if (props.isMobile && props.isSaving && mobileSaveSuccessTimerRef.current) {
      clearTimeout(mobileSaveSuccessTimerRef.current);
      setMobileSaveSuccessActive(false);
    }
  }, [props.isSaving, props.isMobile]);


  if (props.isMobile) {
    const saveButtonClasses = `p-2 rounded transition-colors flex items-center justify-center ${
      props.isSaving
        ? 'text-slate-400 cursor-not-allowed'
        : mobileSaveSuccessActive // Use local state for styling
        ? 'text-green-400'
        : 'text-slate-300 hover:text-white'
    }`;

    return (
      <>
        <div className={`fixed top-0 left-0 right-0 bg-slate-800 border-b border-slate-700 ${Z_INDEX_TAILWIND.TOOLBAR} flex items-center justify-between px-2`} style={{ paddingTop: 'max(env(safe-area-inset-top), 8px)', paddingBottom: '8px', minHeight: '56px' }}>
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

          {/* Add Hotspot Button - REMOVED: Incompatible with slide architecture */}
          <div className="flex items-center gap-1">
            <div className="text-sm text-slate-400 italic">
              Slide Editor
            </div>
          </div>

          {/* Right: Save, Share, Auth & Menu */}
          <div className="flex items-center gap-1">
            <button
              onClick={props.onSave}
              disabled={props.isSaving || mobileSaveSuccessActive} // Disable button briefly during success display
              className={saveButtonClasses}
            >
              {props.isSaving ? (
                <span className="animate-spin w-5 h-5 border-2 border-slate-300 border-t-transparent rounded-full" />
              ) : mobileSaveSuccessActive ? ( // Use local state for icon display
                <CheckIcon className="w-6 h-6 text-green-400" />
              ) : (
                <SaveIcon className="w-6 h-6" />
              )}
            </button>
            {props.project && (
              <button
                onClick={() => setIsShareModalOpen(true)}
                className="p-2 text-slate-300 hover:text-white transition-colors"
                title="Share Module"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </button>
            )}
            <AuthButton variant="compact" />
            <button
              onClick={() => setShowMobileMenu(true)} // Open collapsible menu/modal
              className="p-2 text-slate-300 hover:text-white transition-colors"
              title="Settings"
              aria-label="Settings"
            >
              <GearIcon className="w-6 h-6" />
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
          // Pass background props
          backgroundImage={props.backgroundImage}
          backgroundType={props.backgroundType}
          backgroundVideoType={props.backgroundVideoType}
          onBackgroundImageChange={props.onBackgroundImageChange}
          onBackgroundTypeChange={props.onBackgroundTypeChange}
          onBackgroundVideoTypeChange={props.onBackgroundVideoTypeChange}
        />
      </>
    );
  }

  // Desktop Toolbar (Original Structure)
  return (
    <>
      {/* Minimal Top Bar with Settings Button */}
      <div className={`fixed top-0 left-0 right-0 bg-slate-800 border-b border-slate-700 ${Z_INDEX_TAILWIND.NAVIGATION} h-14`} style={{ paddingTop: 'max(env(safe-area-inset-top), 0px)', minHeight: 'calc(56px + env(safe-area-inset-top))' }}>
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

            {/* Add Hotspot Button - REMOVED: Incompatible with slide architecture */}
            <div className="text-sm text-slate-400 italic">
              Slide Editor
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2"> {/* Reduced gap for zoom controls area */}
            {/* Zoom Controls - REMOVED: Incompatible with slide architecture */}
            <div className="text-sm text-slate-400 italic px-4">
              Zoom controls not applicable to slide editing
            </div>

            <div className="h-6 w-px bg-slate-600 mx-2" /> {/* Divider */

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

            {/* Share Button */}
            {props.project && (
              <>
                <button
                  onClick={() => setIsShareModalOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded font-medium transition-colors flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span>Share</span>
                </button>
              </>
            )}

            <div className="h-6 w-px bg-slate-600" />

            {/* Settings Button */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-1.5 rounded font-medium transition-colors flex items-center gap-2"
              title="Settings"
              aria-label="Settings"
            >
              <GearIcon className="w-5 h-5" />
              <span>Settings</span>
            </button>

            <div className="h-6 w-px bg-slate-600" />

            {/* Auth Button */}
            <AuthButton variant="toolbar" />
          </div>
        </div>
      </div>

      {/* Enhanced Modal Settings Panel */}
      <EnhancedModalEditorToolbar
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        {...props}
        // Pass background props
        backgroundImage={props.backgroundImage}
        backgroundType={props.backgroundType}
        backgroundVideoType={props.backgroundVideoType}
        onBackgroundImageChange={props.onBackgroundImageChange}
        onBackgroundTypeChange={props.onBackgroundTypeChange}
        onBackgroundVideoTypeChange={props.onBackgroundVideoTypeChange}
      />

      {/* Share Modal */}
      {props.project && (
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          project={props.project}
        />
      )}
    </>
  );
};

export { COLOR_SCHEMES };
export default EditorToolbar;