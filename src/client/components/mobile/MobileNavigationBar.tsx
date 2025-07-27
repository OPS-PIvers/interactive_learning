// src/client/components/mobile/MobileNavigationBar.tsx
import React, { useState, useEffect } from 'react';
import { Project } from '../../../shared/types';
import AuthButton from '../AuthButton';
import { ChevronLeftIcon } from '../icons/ChevronLeftIcon';

interface MobileNavigationBarEditorProps {
  mode: 'editor';
  project: Project;
  onBack: () => void;
  onSave: () => void;
  isSaving: boolean;
  showSuccessMessage: boolean;
  onAddHotspot?: () => void;
  isPlacingHotspot?: boolean;
  
  // Zoom controls
  currentZoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  
  // Background settings
  backgroundType?: 'image' | 'video';
  onBackgroundTypeChange?: (type: 'image' | 'video') => void;
  onReplaceImage?: (file: File) => void;
  
  // Viewer modes
  viewerModes: {
    explore?: boolean;
    selfPaced?: boolean;
    timed?: boolean;
  };
  onViewerModeChange: (mode: 'explore' | 'selfPaced' | 'timed', enabled: boolean) => void;
}

interface MobileNavigationBarViewerProps {
  mode: 'viewer';
  projectName: string;
  onBack: () => void;
  moduleState: 'idle' | 'learning';
  onStartLearning: () => void;
  onStartExploring: () => void;
  hasContent: boolean;
  viewerModes?: {
    explore?: boolean;
    selfPaced?: boolean;
    timed?: boolean;
  };
}

type MobileNavigationBarProps = MobileNavigationBarEditorProps | MobileNavigationBarViewerProps;

/**
 * MobileNavigationBar - Unified top navigation bar for mobile editor and viewer
 * 
 * Supports both editor and viewer modes with appropriate controls for each:
 * 
 * Editor Mode:
 * - Back button, project title, add hotspot button, settings dropdown, save button
 * - Settings dropdown with zoom controls, background options, and viewer modes
 * - Integrated save status with loading state and success message display
 * 
 * Viewer Mode:
 * - Back button, project name with gradient styling, mode toggle buttons, auth button
 * - "Explore" and "Tour" mode buttons based on viewer configuration
 * - Consistent styling with ViewerToolbar mobile layout
 * 
 * Features:
 * - Mobile-optimized navigation with touch-friendly targets
 * - Proper ARIA labels and semantic HTML
 * - Click-outside handling to close settings menu (editor mode)
 * - Accessibility features maintained across both modes
 */
export const MobileNavigationBar: React.FC<MobileNavigationBarProps> = (props) => {
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);

  // Close settings menu when clicking outside (editor mode only)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showSettingsMenu && !(event.target as Element).closest('.settings-menu-container')) {
        setShowSettingsMenu(false);
      }
    };

    if (showSettingsMenu && props.mode === 'editor') {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showSettingsMenu, props.mode]);

  if (props.mode === 'viewer') {
    const {
      projectName,
      onBack,
      moduleState,
      onStartLearning,
      onStartExploring,
      hasContent,
      viewerModes = { explore: true, selfPaced: true, timed: true }
    } = props;

    return (
      <nav className="bg-slate-800 border-b border-slate-700 text-white shadow-2xl" aria-label="Mobile viewer navigation">
        {/* Single row: Back, Title, Mode Toggle, Profile */}
        <div className="px-3 py-3 flex items-center justify-between">
          {/* Left: Back button */}
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors rounded-lg p-2 hover:bg-slate-700"
            aria-label="Back to projects"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          
          {/* Left-Center: Stylized project name */}
          <div className="flex-1 flex justify-start ml-2">
            <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 truncate max-w-[180px]">
              {projectName}
            </h1>
          </div>

          {/* Center-Right: Mode toggle buttons */}
          <div className="flex items-center gap-2">
            {hasContent && (
              <>
                {viewerModes.explore && (
                  <button
                    onClick={onStartExploring}
                    className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                      moduleState === 'idle'
                        ? 'bg-sky-500 text-white hover:bg-sky-600 shadow-lg'
                        : 'bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white'
                    }`}
                    aria-label={moduleState === 'idle' ? 'Explore mode active' : 'Switch to explore mode'}
                  >
                    Explore
                  </button>
                )}
                {(viewerModes.selfPaced || viewerModes.timed) && (
                  <button
                    onClick={onStartLearning}
                    className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                      moduleState === 'learning'
                        ? 'bg-purple-500 text-white hover:bg-purple-600 shadow-lg'
                        : 'bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white'
                    }`}
                    aria-label={moduleState === 'learning' ? 'Tour mode active' : 'Switch to tour mode'}
                  >
                    Tour
                  </button>
                )}
              </>
            )}
          </div>

          {/* Right: Profile */}
          <div className="flex items-center ml-3">
            <AuthButton variant="compact" size="medium" />
          </div>
        </div>
      </nav>
    );
  }

  // Editor mode
  const {
    project,
    onBack,
    onSave,
    isSaving,
    showSuccessMessage,
    onAddHotspot,
    isPlacingHotspot = false,
    currentZoom,
    onZoomIn,
    onZoomOut,
    onZoomReset,
    backgroundType = 'image',
    onBackgroundTypeChange,
    onReplaceImage,
    viewerModes,
    onViewerModeChange
  } = props;

  return (
    <nav className="flex-shrink-0 bg-slate-800 border-b border-slate-700 p-4" aria-label="Mobile editor navigation">
      <div className="flex items-center justify-between">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-slate-300 hover:text-white transition-colors"
          aria-label="Go back to projects"
        >
          <span>← Back</span>
        </button>
        
        {/* Project Title */}
        <h1 className="text-lg font-semibold text-white truncate mx-4">
          {project.title}
        </h1>
        
        <div className="flex items-center space-x-3">
          {/* Add Hotspot Button */}
          {onAddHotspot && (
            <button
              onClick={onAddHotspot}
              disabled={isPlacingHotspot}
              className={`p-2 rounded-lg transition-colors ${
                isPlacingHotspot 
                  ? 'bg-red-600 text-white' 
                  : 'bg-purple-600 hover:bg-purple-500 text-white'
              }`}
              title={isPlacingHotspot ? "Tap on image to place hotspot" : "Add hotspot"}
              aria-label={isPlacingHotspot ? "Placing hotspot mode active" : "Add new hotspot"}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          )}
          
          {/* Settings Cog Menu */}
          <div className="relative settings-menu-container">
            <button
              onClick={() => setShowSettingsMenu(!showSettingsMenu)}
              className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition-colors"
              title="Settings"
              aria-label="Open settings menu"
              aria-expanded={showSettingsMenu}
              aria-haspopup="true"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            
            {/* Settings Dropdown Menu */}
            {showSettingsMenu && (
              <div 
                className="absolute right-0 top-full mt-2 w-64 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-50"
                role="menu"
                aria-labelledby="settings-button"
              >
                <div className="p-4 space-y-4">
                  {/* Zoom Controls Section */}
                  <div className="border-b border-slate-600 pb-3">
                    <h3 className="text-sm font-medium text-white mb-2">Zoom Controls</h3>
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={onZoomOut} 
                        className="p-1 bg-slate-700 hover:bg-slate-600 rounded text-white"
                        aria-label="Zoom out"
                        role="menuitem"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                      </button>
                      <span className="text-xs text-slate-300 min-w-0 flex-1 text-center" aria-live="polite">
                        {Math.round(currentZoom * 100)}%
                      </span>
                      <button 
                        onClick={onZoomIn} 
                        className="p-1 bg-slate-700 hover:bg-slate-600 rounded text-white"
                        aria-label="Zoom in"
                        role="menuitem"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                      <button 
                        onClick={onZoomReset} 
                        className="px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs text-white"
                        aria-label="Reset zoom to 100%"
                        role="menuitem"
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                  
                  {/* Background Section */}
                  <div className="border-b border-slate-600 pb-3">
                    <h3 className="text-sm font-medium text-white mb-2">Background</h3>
                    <div className="space-y-2" role="radiogroup" aria-labelledby="background-type">
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="backgroundType"
                          checked={backgroundType === 'image'}
                          onChange={() => onBackgroundTypeChange?.('image')}
                          className="text-purple-500"
                          aria-describedby="background-image-option"
                        />
                        <span className="text-xs text-slate-300" id="background-image-option">Image</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="backgroundType"
                          checked={backgroundType === 'video'}
                          onChange={() => onBackgroundTypeChange?.('video')}
                          className="text-purple-500"
                          aria-describedby="background-video-option"
                        />
                        <span className="text-xs text-slate-300" id="background-video-option">Video</span>
                      </label>
                      {onReplaceImage && (
                        <div className="mt-2">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            id="replace-image"
                            onChange={(e) => e.target.files?.[0] && onReplaceImage(e.target.files[0])}
                            aria-describedby="replace-image-help"
                          />
                          <label
                            htmlFor="replace-image"
                            className="block w-full px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded text-xs text-white text-center cursor-pointer"
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                document.getElementById('replace-image')?.click();
                              }
                            }}
                          >
                            Replace Image
                          </label>
                          <span id="replace-image-help" className="sr-only">
                            Upload a new background image
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Viewer Modes Section */}
                  <div>
                    <h3 className="text-sm font-medium text-white mb-2">Viewer Modes</h3>
                    <div className="space-y-2" role="group" aria-labelledby="viewer-modes">
                      {(['explore', 'selfPaced', 'timed'] as const).map((mode) => (
                        <label key={mode} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={viewerModes[mode] ?? false}
                            onChange={(e) => onViewerModeChange(mode, e.target.checked)}
                            className="text-purple-500"
                            aria-describedby={`viewer-mode-${mode}`}
                          />
                          <span className="text-xs text-slate-300 capitalize" id={`viewer-mode-${mode}`}>
                            {mode === 'selfPaced' ? 'Self Paced' : mode}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Save Button */}
          <button
            onClick={onSave}
            disabled={isSaving}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-green-700 text-white rounded-lg transition-colors"
            aria-label={isSaving ? "Saving project..." : "Save project"}
          >
            {isSaving ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-sm">Saving...</span>
              </>
            ) : (
              <span className="text-sm">Save</span>
            )}
          </button>
        </div>
      </div>
      
      {/* Success Message */}
      {showSuccessMessage && (
        <div 
          className="mt-3 p-2 bg-green-600 text-white text-sm text-center rounded"
          role="status"
          aria-live="polite"
        >
          Project saved successfully!
        </div>
      )}
    </nav>
  );
};

export default MobileNavigationBar;