import React, { useState, useCallback, useRef, useEffect } from 'react';
import { XMarkIcon } from './icons/XMarkIcon';
import { useIsMobile } from '../hooks/useIsMobile';
import { useProjectTheme } from '../hooks/useProjectTheme';
import { getAllThemes } from '../../shared/themePresets';
import { ThemePreset } from '../../shared/slideTypes';
import { firebaseAPI } from '../../lib/firebaseApi';

interface ProjectSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
  projectId: string;
}

const ProjectSettingsModal: React.FC<ProjectSettingsModalProps> = ({
  isOpen,
  onClose,
  projectName,
  projectId
}) => {
  const isMobile = useIsMobile();
  const { currentThemeId, setTheme, availableThemes } = useProjectTheme();
  const [isLoading, setIsLoading] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const allThemes = getAllThemes();

  // Handle theme selection
  const handleThemeSelect = useCallback(async (themeId: ThemePreset) => {
    setIsLoading(true);
    try {
      // Update theme in context
      setTheme(themeId);
      
      // Save theme preference to Firebase
      await firebaseAPI.updateProject(projectId, {
        theme: themeId,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error saving theme:', error);
    } finally {
      setIsLoading(false);
    }
  }, [setTheme, projectId]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen, onClose]);

  // Focus management
  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div 
        ref={modalRef}
        className={`bg-slate-800 rounded-lg shadow-xl ${isMobile ? 'w-full h-full' : 'w-full max-w-2xl max-h-[90vh]'} flex flex-col`}
        tabIndex={-1}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white">Project Settings</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
            aria-label="Close settings"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Project Info */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Project Information</h3>
              <p className="text-slate-300">
                <span className="font-medium">Name:</span> {projectName}
              </p>
              <p className="text-slate-300 text-sm mt-1">
                <span className="font-medium">ID:</span> {projectId}
              </p>
            </div>

            {/* Theme Selection */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Theme Selection</h3>
              <p className="text-slate-400 text-sm mb-4">
                Choose a color theme that fits your content and audience
              </p>
              
              <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
                {allThemes.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => handleThemeSelect(theme.id as ThemePreset)}
                    disabled={isLoading}
                    className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                      currentThemeId === theme.id
                        ? 'border-purple-500 bg-purple-500/10'
                        : 'border-slate-600 hover:border-slate-500 bg-slate-700/50'
                    } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-white">{theme.name}</h4>
                      {currentThemeId === theme.id && (
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      )}
                    </div>
                    <p className="text-slate-300 text-sm mb-3">{theme.description}</p>
                    
                    {/* Color Preview */}
                    <div className="flex space-x-2">
                      <div 
                        className="w-6 h-6 rounded border border-slate-500" 
                        style={{ backgroundColor: theme.theme.colors.primary }}
                        title="Primary Color"
                      />
                      <div 
                        className="w-6 h-6 rounded border border-slate-500" 
                        style={{ backgroundColor: theme.theme.colors.secondary }}
                        title="Secondary Color"
                      />
                      <div 
                        className="w-6 h-6 rounded border border-slate-500" 
                        style={{ backgroundColor: theme.theme.colors.accent }}
                        title="Accent Color"
                      />
                      <div 
                        className="w-6 h-6 rounded border border-slate-500" 
                        style={{ backgroundColor: theme.theme.colors.hotspotDefault }}
                        title="Hotspot Color"
                      />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-700">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectSettingsModal;