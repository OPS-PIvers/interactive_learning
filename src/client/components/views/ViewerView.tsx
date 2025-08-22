import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../lib/authContext';
import { appScriptProxy } from '../../../lib/firebaseProxy';
import { SlideDeck } from '../../../shared/slideTypes';
import { Project, InteractiveModuleState } from '../../../shared/types';
import { Z_INDEX_TAILWIND } from '../../utils/zIndexLevels';
import { ChevronLeftIcon } from '../icons/ChevronLeftIcon';
import ErrorScreen from '../shared/ErrorScreen';
import LoadingScreen from '../shared/LoadingScreen';
import SlideBasedInteractiveModule from './SlideBasedInteractiveModule';
import SlideViewer from '../slides/SlideViewer';
import ViewerFooterToolbar from '../toolbars/ViewerFooterToolbar';

const ViewerView: React.FC = () => {
  const { projectId } = useParams<{projectId: string;}>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Add navigation state for mobile UX
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [viewerMode, setViewerMode] = useState<'idle' | 'learning' | 'exploring'>('idle');

  const loadProject = useCallback(async () => {
    if (!projectId || !user) return;

    setLoading(true);
    setError(null);

    try {
      // First get basic project info
      const projects = await appScriptProxy.listProjects();
      const baseProject = projects.find((p) => p.id === projectId);

      if (!baseProject) {
        setError('Project not found');
        return;
      }

      // Then load full details
      const details = (await appScriptProxy.getProjectDetails(projectId)) as InteractiveModuleState;

      const backgroundImage = details.backgroundImage !== undefined ? details.backgroundImage : baseProject.interactiveData?.backgroundImage;
      const imageFitMode = details.imageFitMode || baseProject.interactiveData?.imageFitMode;
      const fullProject: Project = {
        ...baseProject,
        interactiveData: {
          ...(baseProject.interactiveData || {}),
          hotspots: details.hotspots || [],
          timelineEvents: details.timelineEvents || [],
          ...(backgroundImage && { backgroundImage }),
          ...(imageFitMode && { imageFitMode })
        }
      };

      setProject(fullProject);
    } catch (err: unknown) {
      console.error('Failed to load project:', err);
      setError(`Failed to load project: ${err && err instanceof Error ? err.message : String(err) || 'Please try again.'}`);
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

  // Add slide navigation handlers for mobile UX
  const handleSlideChange = useCallback((slideId: string, slideIndex: number) => {
    setCurrentSlideIndex(slideIndex);
  }, []);

  const handlePreviousSlide = useCallback(() => {
    if (project?.slideDeck?.slides && currentSlideIndex > 0) {
      const prevSlide = project.slideDeck.slides[currentSlideIndex - 1];
      if (prevSlide?.id) {
        handleSlideChange(prevSlide.id, currentSlideIndex - 1);
      }
    }
  }, [currentSlideIndex, project, handleSlideChange]);

  const handleNextSlide = useCallback(() => {
    if (project?.slideDeck?.slides && currentSlideIndex < (project?.slideDeck?.slides.length ?? 0) - 1) {
      const nextSlide = project.slideDeck.slides[currentSlideIndex + 1];
      if (nextSlide?.id) {
        handleSlideChange(nextSlide.id, currentSlideIndex + 1);
      }
    }
  }, [currentSlideIndex, project, handleSlideChange]);

  const handleSlideSelect = useCallback((slideId: string) => {
    if (project?.slideDeck?.slides) {
      const slideIndex = project.slideDeck.slides.findIndex(s => s.id === slideId);
      if (slideIndex >= 0) {
        handleSlideChange(slideId, slideIndex);
      }
    }
  }, [project, handleSlideChange]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (error || !project) {
    return (
      <ErrorScreen
        error={new Error(error || 'Project not found')}
        onReload={loadProject} />);


  }

  return (
    <div className={`fixed inset-0 ${Z_INDEX_TAILWIND.MODAL_CONTENT} bg-slate-900 slide-viewer mobile-viewport-fix mobile-safe-area`}>
      {/* Header with back button */}
      <div className={`absolute top-4 left-4 ${Z_INDEX_TAILWIND.FLOATING_CONTROLS}`}>
        <button
          onClick={handleClose}
          className="flex items-center space-x-2 px-4 py-2 bg-slate-800/90 hover:bg-slate-700/90 text-white rounded-lg shadow-lg backdrop-blur-sm transition-colors"
          aria-label="Back to projects">

          <ChevronLeftIcon className="w-5 h-5" />
          <span className="hidden sm:inline">Back to Projects</span>
        </button>
      </div>

      {/* Viewer content with mobile optimization */}
      <div className="viewer-content-container h-full flex flex-col">
        {/* Slide content area */}
        <div className="flex-1 min-h-0 relative">
          {project.slideDeck ? (
            <>
              <SlideViewer
                slideDeck={project.slideDeck}
                showTimeline={false} // Timeline handled by toolbar
                timelineAutoPlay={false}
                onSlideChange={handleSlideChange}
                onInteraction={(interaction) => {
                  console.log('Slide interaction:', interaction);
                }}
                className="viewer-slide-content"
              />
              
              <ViewerFooterToolbar
                projectName={project.title}
                onBack={handleClose}
                currentSlideIndex={currentSlideIndex}
                totalSlides={project.slideDeck?.slides?.length || 0}
                slides={project.slideDeck?.slides || []}
                onSlideSelect={handleSlideSelect}
                showProgress={true}
                moduleState={viewerMode}
                onStartLearning={() => setViewerMode('learning')}
                onStartExploring={() => setViewerMode('exploring')}
                hasContent={true}
                onPreviousSlide={handlePreviousSlide}
                onNextSlide={handleNextSlide}
                canGoPrevious={currentSlideIndex > 0}
                canGoNext={currentSlideIndex < (project.slideDeck?.slides?.length || 0) - 1}
                viewerModes={{
                  explore: true,
                  selfPaced: true,
                  timed: false
                }}
              />
            </>
          ) :

          project.interactiveData ? (
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
              isPublished={project.isPublished || false}
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
      </div>
    </div>);

};

export default ViewerView;