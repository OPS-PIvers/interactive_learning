import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Project } from '../../shared/types';
import SlideBasedInteractiveModule from './SlideBasedInteractiveModule';
import { appScriptProxy } from '../../lib/firebaseProxy';

interface SharedModuleViewerProps {}

const SharedModuleViewer: React.FC<SharedModuleViewerProps> = () => {
  const { moduleId } = useParams<{ moduleId: string }>();
  const [searchParams] = useSearchParams();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Parse URL parameters for customization
  const isEmbedMode = searchParams.get('embed') === 'true';
  const themeParam = searchParams.get('theme');
  const theme: 'light' | 'dark' = (themeParam === 'light' || themeParam === 'dark') ? themeParam : 'dark';
  const showBranding = searchParams.get('branding') !== 'false';
  const autoStart = searchParams.get('autostart') === 'true';

  const loadProject = useCallback(async () => {
    if (!moduleId) {
      setError('No module ID provided');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      // Firebase connection manager handles initialization automatically
      const targetProject = await appScriptProxy.getPublicProject(moduleId);
      
      if (!targetProject) {
        setError('Module not found. This link may be invalid, the module may have been removed, or it may not be public.');
        return;
      }

      setProject(targetProject);
    } catch (err: unknown) {
      console.error("Failed to load shared module:", err);
      
      // Provide more specific error messages based on error type
      let errorMessage = 'Please try again later.';
      
      if (err instanceof Error) {
        if (err.message?.includes('Missing or insufficient permissions')) {
          errorMessage = 'This module is not publicly available. It may be private, deleted, or the link may be incorrect.';
        } else if (err.message?.includes('not found')) {
          errorMessage = 'Module not found. The link may be invalid or the module may have been removed.';
        } else if (err.message?.includes('network')) {
          errorMessage = 'Network connection error. Please check your internet connection and try again.';
        } else if ((err as any).code === 'unavailable') {
          errorMessage = 'Service temporarily unavailable. Please try again in a few moments.';
        } else if (err.message) {
          errorMessage = err.message;
        }
      }
      
      setError(`Failed to load module: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [moduleId]);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  // Handle module close for embedded mode
  const handleClose = useCallback(() => {
    if (isEmbedMode) {
      // In embed mode, post message to parent
      window.parent.postMessage({ type: 'moduleClose', moduleId }, '*');
    } else {
      // In standalone mode, redirect to main site
      window.location.href = '/';
    }
  }, [isEmbedMode, moduleId]);

  // Don't save in viewer mode
  const handleSave = useCallback(() => {
    console.log('Save attempted in viewer mode - ignoring');
  }, []);

  // Define base styles based on theme
  const baseBgColor = theme === 'light' ? 'bg-gray-50' : 'bg-slate-900';
  const baseTextColor = theme === 'light' ? 'text-gray-800' : 'text-slate-200';
  const cardBgColor = theme === 'light' ? 'bg-white' : 'bg-slate-800';
  const cardBorderColor = theme === 'light' ? 'border-gray-300' : 'border-slate-700';
  const accentColor = 'purple-600'; // Consistent accent for buttons

  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${baseBgColor} ${baseTextColor} p-4`} style={{ paddingTop: 'max(env(safe-area-inset-top), 16px)', paddingBottom: 'max(env(safe-area-inset-bottom), 16px)' }}>
        <div className="flex flex-col items-center space-y-4">
          <svg className={`animate-spin h-10 w-10 text-${accentColor}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-lg font-medium">Loading Interactive Module...</p>
          <p className="text-sm text-gray-500 dark:text-slate-400">Please wait a moment.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${baseBgColor} ${baseTextColor} p-4`} style={{ paddingTop: 'max(env(safe-area-inset-top), 16px)', paddingBottom: 'max(env(safe-area-inset-bottom), 16px)' }}>
        <div className={`text-center max-w-lg mx-auto p-6 sm:p-8 rounded-xl shadow-2xl ${cardBgColor} border ${cardBorderColor}`}>
          <div className={`mb-5 text-red-500 dark:text-red-400`}>
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <h2 className={`text-2xl font-semibold mb-3 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>Module Unavailable</h2>
          <p className={`mb-6 ${theme === 'light' ? 'text-gray-600' : 'text-slate-300'}`}>{error}</p>
          {!isEmbedMode && (
            <button
              onClick={() => window.location.href = '/'}
              className={`bg-${accentColor} hover:bg-opacity-80 text-white font-semibold py-2.5 px-6 rounded-lg transition-all duration-150 ease-in-out shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-${accentColor} focus:ring-offset-2 ${theme === 'light' ? 'focus:ring-offset-white' : 'focus:ring-offset-slate-800'}`}
            >
              Return to Home
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!project) {
    // This case should ideally be covered by error state, but good for robustness
    return (
        <div className={`min-h-screen flex items-center justify-center ${baseBgColor} ${baseTextColor}`} style={{ paddingTop: 'max(env(safe-area-inset-top), 16px)', paddingBottom: 'max(env(safe-area-inset-bottom), 16px)' }}>
            <p>Module data is not available.</p>
        </div>
    );
  }

  return (
    <div className={`flex flex-col min-h-screen ${baseBgColor} ${baseTextColor} ${isEmbedMode ? 'h-screen overflow-hidden' : 'relative'}`} style={{ paddingTop: 'max(env(safe-area-inset-top), 0px)', paddingBottom: 'max(env(safe-area-inset-bottom), 0px)' }}>
      <a
        href="#main-content"
        className={`skip-to-main-content-link ${theme === 'light' ? 'bg-gray-200 text-gray-800 border-gray-400 hover:bg-gray-300' : 'bg-slate-700 text-slate-100 border-slate-600 hover:bg-slate-600'}`}
      >
        Skip to Main Content
      </a>

      {/* Main Module Content - takes up available space */}
      <main id="main-content" className="flex-grow flex flex-col focus:outline-none" tabIndex={-1}>
        {project.slideDeck && project.projectType && (
          <SlideBasedInteractiveModule
            key={`shared-${project.id}`}
            initialData={project.interactiveData}
            slideDeck={project.slideDeck}
            projectType={project.projectType}
            isEditing={false}
            onSave={handleSave} // No-op in viewer
            onClose={handleClose} // Handles embed/standalone logic
            projectName={project.title}
            projectId={project.id}
            isSharedView={true}
            theme={theme} // Pass theme to InteractiveModule
            autoStart={autoStart} // Pass autoStart to InteractiveModule
            onImageUpload={() => Promise.resolve()} // No-op for shared viewer
          />
        )}
      </main>

      {/* Professional Branding Footer - only in standalone mode and if enabled */}
      {!isEmbedMode && showBranding && (
        <footer className={`${
          theme === 'light' 
            ? 'bg-gray-100 border-gray-200 text-gray-700'
            : 'bg-slate-800 border-slate-700 text-slate-400'
        } border-t px-4 py-5 text-sm mt-auto flex-shrink-0`}>
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-y-3">
            <div className="flex items-center space-x-2">
              <span className="font-medium">Powered by</span>
              <a 
                href="/" 
                target="_blank"
                rel="noopener noreferrer"
                className={`text-${accentColor} hover:text-opacity-80 font-semibold transition-colors duration-150 ease-in-out underline hover:no-underline`}
              >
                Interactive Learning Hub
              </a>
            </div>
            <div className="text-xs opacity-80">
              &copy; {new Date().getFullYear()} Interactive Learning Hub. All rights reserved.
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};

export default SharedModuleViewer;