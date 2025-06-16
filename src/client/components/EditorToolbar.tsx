import React, { useState } from 'react';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
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
}

const EditorToolbar: React.FC<EditorToolbarProps> = (props) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

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
                  <span>✓</span>
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
              ⚙️ Settings
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