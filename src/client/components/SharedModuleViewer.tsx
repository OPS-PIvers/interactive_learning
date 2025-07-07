import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Project } from '../../shared/types';
import InteractiveModule from './InteractiveModule';
import { appScriptProxy } from '../../lib/firebaseProxy';
import { useIsMobile } from '../hooks/useIsMobile';

interface SharedModuleViewerProps {}

const SharedModuleViewer: React.FC<SharedModuleViewerProps> = () => {
  const { moduleId } = useParams<{ moduleId: string }>();
  const [searchParams] = useSearchParams();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const isMobile = useIsMobile();

  // Parse URL parameters for customization
  const isEmbedMode = searchParams.get('embed') === 'true';
  const theme = searchParams.get('theme') || 'dark';
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
      await appScriptProxy.init();
      const fetchedProjects = await appScriptProxy.listProjects();
      const targetProject = fetchedProjects.find(p => p.id === moduleId);
      
      if (!targetProject) {
        setError('Module not found. This link may be invalid or the module may have been removed.');
        return;
      }

      setProject(targetProject);
    } catch (err: any) {
      console.error("Failed to load shared module:", err);
      setError(`Failed to load module: ${err.message || 'Please try again later.'}`);
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

  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        theme === 'light' ? 'bg-gray-100 text-gray-900' : 'bg-slate-900 text-white'
      }`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-lg">Loading interactive module...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        theme === 'light' ? 'bg-gray-100 text-gray-900' : 'bg-slate-900 text-white'
      }`}>
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 18.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">Module Not Available</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          {!isEmbedMode && (
            <button
              onClick={() => window.location.href = '/'}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              Back to Home
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <div className={`min-h-screen ${
      theme === 'light' ? 'bg-gray-100' : 'bg-slate-900'
    } ${isEmbedMode ? '' : 'relative'}`}>
      <a href="#main-content" className="skip-to-main-content-link">
        Skip to Main Content
      </a>
      {/* Main Module Content */}
      <div id="main-content-wrapper" className={`${isEmbedMode ? 'h-screen' : 'min-h-screen'}`}>
        <InteractiveModule
          key={`shared-${project.id}`}
          initialData={project.interactiveData}
          isEditing={false}
          onSave={handleSave}
          onClose={handleClose}
          projectName={project.title}
          projectId={project.id}
          isSharedView={true}
          theme={theme}
          autoStart={autoStart}
        />
      </div>

      {/* Professional Branding Footer - only in standalone mode */}
      {!isEmbedMode && showBranding && (
        <div className={`${
          theme === 'light' 
            ? 'bg-white border-gray-200 text-gray-600' 
            : 'bg-slate-800 border-slate-700 text-slate-400'
        } border-t px-4 py-3 text-center text-sm`}>
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between">
            <div className="flex items-center space-x-2 mb-2 sm:mb-0">
              <span>Powered by</span>
              <a 
                href="/" 
                className="text-purple-500 hover:text-purple-400 font-semibold transition-colors"
              >
                Interactive Learning Hub
              </a>
            </div>
            <div className="text-xs opacity-75">
              © 2025 Interactive Learning Hub. All rights reserved.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SharedModuleViewer;