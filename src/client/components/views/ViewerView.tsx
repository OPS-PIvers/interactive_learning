import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../lib/authContext';
import { Project, InteractiveModuleState } from '../../../shared/types';
import { appScriptProxy } from '../../../lib/firebaseProxy';
import SlideBasedInteractiveModule from '../SlideBasedInteractiveModule';
import SlideViewer from '../slides/SlideViewer';
import { SlideDeck } from '../../../shared/slideTypes';
import LoadingScreen from '../shared/LoadingScreen';
import ErrorScreen from '../shared/ErrorScreen';
import { ChevronLeftIcon } from '../icons/ChevronLeftIcon';

const ViewerView: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProject = useCallback(async () => {
    if (!projectId || !user) return;

    setLoading(true);
    setError(null);
    
    try {
      // First get basic project info
      const projects = await appScriptProxy.listProjects();
      const baseProject = projects.find(p => p.id === projectId);
      
      if (!baseProject) {
        setError('Project not found');
        return;
      }

      // Then load full details
      const details = await appScriptProxy.getProjectDetails(projectId) as InteractiveModuleState;
      
      const fullProject: Project = {
        ...baseProject,
        interactiveData: {
          ...baseProject.interactiveData,
          hotspots: details.hotspots || [],
          timelineEvents: details.timelineEvents || [],
          backgroundImage: details.backgroundImage !== undefined ? details.backgroundImage : baseProject.interactiveData.backgroundImage,
          imageFitMode: details.imageFitMode || baseProject.interactiveData.imageFitMode,
        }
      };

      setProject(fullProject);
    } catch (err: any) {
      console.error('Failed to load project:', err);
      setError(`Failed to load project: ${err.message || 'Please try again.'}`);
    } finally {
      setLoading(false);
    }
  }, [projectId, user]);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  const handleClose = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const handleReloadRequest = useCallback(() => {
    loadProject();
  }, [loadProject]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (error || !project) {
    return (
      <ErrorScreen
        error={new Error(error || 'Project not found')}
        onReload={loadProject}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900">
      {/* Header with back button */}
      <div className="absolute top-4 left-4 z-50">
        <button
          onClick={handleClose}
          className="flex items-center space-x-2 px-4 py-2 bg-slate-800/90 hover:bg-slate-700/90 text-white rounded-lg shadow-lg backdrop-blur-sm transition-colors"
          aria-label="Back to projects"
        >
          <ChevronLeftIcon className="w-5 h-5" />
          <span className="hidden sm:inline">Back to Projects</span>
        </button>
      </div>

      {/* Viewer content */}
      {project.slideDeck ? (
        <SlideViewer 
          slideDeck={project.slideDeck} 
          showTimeline={true}
          timelineAutoPlay={false}
          onSlideChange={(slideId, slideIndex) => {
            console.log(`Navigated to slide ${slideIndex + 1}: ${slideId}`);
          }}
          onInteraction={(interaction) => {
            console.log('Interaction triggered:', interaction);
          }}
        />
      ) : project.interactiveData ? (
        <SlideBasedInteractiveModule
          key={`viewer-${project.id}`}
          initialData={project.interactiveData}
          isEditing={false}
          onSave={() => {}} // No saving in viewer mode
          onImageUpload={async () => {}} // No image upload in viewer mode
          onClose={handleClose}
          projectName={project.title}
          projectId={project.id}
          onReloadRequest={handleReloadRequest}
          isPublished={project.isPublished}
          viewerModes={{
            explore: true,
            selfPaced: true,
            timed: false
          }}
          isSharedView={false} // This is authenticated user viewing their own project
        />
      ) : (
        <div className="flex items-center justify-center h-full">
          <p className="text-slate-400 text-xl">No content available for this project</p>
        </div>
      )}
    </div>
  );
};

export default ViewerView;