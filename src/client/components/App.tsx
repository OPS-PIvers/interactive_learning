
import React, { useState, useCallback, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Project, InteractiveModuleState, InteractionType } from '../../shared/types';
import ProjectCard from './ProjectCard';
import Modal from './Modal';
import InteractiveModule from './InteractiveModule';
import AdminToggle from './AdminToggle';
import { appScriptProxy } from '../../lib/firebaseProxy';
import { PlusCircleIcon } from './icons/PlusCircleIcon';
import { useIsMobile } from '../hooks/useIsMobile';
import SharedModuleViewer from './SharedModuleViewer';
import { setDynamicVhProperty } from '../utils/mobileUtils';

// Main App Component for the landing page
const MainApp: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isProjectDetailsLoading, setIsProjectDetailsLoading] = useState<boolean>(false); // For loading individual project details
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isEditingMode, setIsEditingMode] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true); // For initial project list load
  const [error, setError] = useState<string | null>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    // Set up the dynamic --vh property updater
    const cleanupVhUpdater = setDynamicVhProperty();

    // Cleanup function to remove event listeners when the component unmounts
    return () => {
      cleanupVhUpdater();
    };
  }, []); // Empty dependency array ensures this runs only once on mount and cleans up on unmount

  const loadProjects = useCallback(async () => {
    setIsLoading(true); // For initial list loading
    setError(null);
    try {
      await appScriptProxy.init(); // Initialize proxy (might be a no-op client-side)
      const fetchedProjects = await appScriptProxy.listProjects();
      setProjects(fetchedProjects);
    } catch (err: any) {
      console.error("Failed to load projects:", err);
      setError(`Could not load projects: ${err.message || 'Please try again later.'}`);
      setProjects([]); 
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const loadProjectDetailsAndOpen = useCallback(async (project: Project, editingMode: boolean) => {
    setIsProjectDetailsLoading(true);
    setError(null);
    try {
      // Check if details (hotspots/timelineEvents) are already loaded
      // A simple check could be if hotspots array exists and has items, or a dedicated flag.
      // Assuming types are updated so hotspots/timelineEvents can be undefined.
      if (!project.interactiveData.hotspots || !project.interactiveData.timelineEvents) {
        console.log(`Fetching details for project: ${project.id}`);
        // Type assertion needed as getProjectDetails returns Partial<InteractiveModuleState>
        const details = await appScriptProxy.getProjectDetails(project.id) as InteractiveModuleState;
        const updatedProject = {
          ...project,
          interactiveData: {
            // Preserve existing top-level fields like backgroundImage and imageFitMode from summary load
            ...project.interactiveData,
            // Merge fetched details
            hotspots: details.hotspots || [],
            timelineEvents: details.timelineEvents || [],
            // Potentially update backgroundImage and imageFitMode if getProjectDetails also returns them
            // and they are considered more authoritative.
            backgroundImage: details.backgroundImage !== undefined ? details.backgroundImage : project.interactiveData.backgroundImage,
            imageFitMode: details.imageFitMode || project.interactiveData.imageFitMode,
          }
        };
        setSelectedProject(updatedProject);
        // Update the project in the main list as well
        setProjects(prevProjects => prevProjects.map(p => p.id === updatedProject.id ? updatedProject : p));
      } else {
        setSelectedProject(project); // Details already loaded
      }
      setIsEditingMode(editingMode);
      setIsModalOpen(true);
    } catch (err: any) {
      console.error(`Failed to load project details for ${project.id}:`, err);
      setError(`Could not load project details: ${err.message || 'Please try again.'}`);
      setSelectedProject(null); // Clear selection on error
    } finally {
      setIsProjectDetailsLoading(false);
    }
  }, []);

  const handleViewProject = useCallback((project: Project) => {
    loadProjectDetailsAndOpen(project, false);
  }, [loadProjectDetailsAndOpen]);

  const handleEditProject = useCallback((project: Project) => {
    loadProjectDetailsAndOpen(project, true);
  }, [loadProjectDetailsAndOpen]);
  
  const handleCreateNewProject = useCallback(async () => {
    const title = prompt("Enter new project title:");
    if (!title) return;
    const description = prompt("Enter project description (optional):") || "";

    setIsLoading(true);
    try {
      const newProject = await appScriptProxy.createProject(title, description);
      setProjects(prevProjects => [...prevProjects, newProject]);
      setSelectedProject(newProject);
      setIsEditingMode(true);
      setIsModalOpen(true);
    } catch (err: any) {
      console.error("Failed to create project:", err);
      setError(`Failed to create new project: ${err.message || ''}`);
    } finally {
      setIsLoading(false);
    }
  }, []);


  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedProject(null);
    if (isAdmin) loadProjects(); // Refresh project list after closing modal
  }, [isAdmin, loadProjects]);

  const handleSaveProjectData = useCallback(async (projectId: string, data: InteractiveModuleState) => {
    const projectToSave = projects.find(p => p.id === projectId);
    if (!projectToSave) {
      setError("Project not found for saving.");
      return;
    }

    // Construct the project data to be saved.
    // The actual thumbnailUrl will be determined by the backend (firebaseApi.ts)
    // based on interactiveData.backgroundImage.
    // We pass the existing projectToSave.thumbnailUrl which might be outdated or undefined.
    // The backend will handle the logic.
    const projectDataToSend: Project = {
      ...projectToSave, // Includes existing id, title, description, current thumbnailUrl
      interactiveData: data, // The latest interactive data including backgroundImage
    };
    
    setIsLoading(true);
    try {
      // appScriptProxy.saveProject will now internally handle thumbnail generation if needed
      // and return the project with the updated (or existing) thumbnail URL.
      const savedProjectWithPotentiallyNewThumbnail = await appScriptProxy.saveProject(projectDataToSend);

      // Optimistically update with what we sent, but the refresh below is key for the actual thumbnail.
      // A slightly better optimistic update would use `savedProjectWithPotentiallyNewThumbnail` if it's returned by `saveProject`.
      // Assuming `saveProject` in the proxy now returns the updated project from `firebaseApi.ts`.
      setProjects(prevProjects =>
        prevProjects.map(p => (p.id === projectId ? savedProjectWithPotentiallyNewThumbnail : p))
      );

      if (selectedProject && selectedProject.id === projectId) {
        setSelectedProject(savedProjectWithPotentiallyNewThumbnail);
      }

      // The optimistic updates above are now sufficient as `saveProject`
      // returns the complete project data with the correct thumbnail URL.
      // The full list refresh is no longer necessary here.
      // const refreshedProjects = await appScriptProxy.listProjects();
      // setProjects(refreshedProjects);
      // setSelectedProject(prevSelected => prevSelected ? refreshedProjects.find(p => p.id === prevSelected.id) || null : null);

      console.log('Project data save initiated via proxy and successfully updated locally:', projectId, savedProjectWithPotentiallyNewThumbnail);
    } catch (err: any) {
      console.error("Failed to save project:", err);
      setError(`Failed to save project data: ${err.message || ''}`);
    } finally {
      setIsLoading(false);
    }
  }, [projects]);

  const handleDeleteProject = useCallback(async (projectId: string) => {
    if (!window.confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
      return;
    }
    setIsLoading(true);
    try {
      await appScriptProxy.deleteProject(projectId);
      setProjects(prevProjects => prevProjects.filter(p => p.id !== projectId));
      if (selectedProject?.id === projectId) {
        handleCloseModal();
      }
      console.log('Project deletion initiated via proxy:', projectId);
    } catch (err: any) {
      console.error("Failed to delete project:", err);
      setError(`Failed to delete project: ${err.message || ''}`);
    } finally {
      setIsLoading(false);
    }
  }, [selectedProject, handleCloseModal]);
  

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white p-4 sm:p-8">
      <header className="mb-6 sm:mb-8 text-center">
        <div className="max-w-6xl mx-auto">
          {/* Mobile Layout: Stacked */}
          <div className="block sm:hidden">
            <div className="flex justify-end items-center mb-3 px-2">
              {isAdmin && (
                <button
                  onClick={handleCreateNewProject}
                  className="p-2 bg-purple-600 hover:bg-purple-700 rounded-full text-white shadow-lg transition-colors mr-3"
                  title="Create New Project"
                  aria-label="Create New Project"
                >
                  <PlusCircleIcon className="w-6 h-6" />
                </button>
              )}
              <AdminToggle isAdmin={isAdmin} onToggle={() => setIsAdmin(prev => !prev)} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 leading-tight px-4">
              Interactive Learning Hub
            </h1>
          </div>
          
          {/* Desktop Layout: Horizontal */}
          <div className="hidden sm:flex justify-between items-center mb-2">
            <div className="flex-1"></div> {/* Left spacer */}
            <h1 className="flex-shrink-0 text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 whitespace-nowrap">
              Interactive Learning Hub
            </h1>
            <div className="flex-1 flex justify-end items-center space-x-4">
              {isAdmin && (
                <button
                  onClick={handleCreateNewProject}
                  className="p-2 bg-purple-600 hover:bg-purple-700 rounded-full text-white shadow-lg transition-colors"
                  title="Create New Project"
                  aria-label="Create New Project"
                >
                  <PlusCircleIcon className="w-7 h-7" />
                </button>
              )}
              <AdminToggle isAdmin={isAdmin} onToggle={() => setIsAdmin(prev => !prev)} />
            </div>
          </div>
        </div>
        <p className="text-slate-400 mt-2 text-base sm:text-lg px-4">Create and explore engaging interactive modules.</p>
      </header>

      <div className="max-w-6xl mx-auto">
        {/* Main loading indicator for project list */}
        {isLoading && !isProjectDetailsLoading && (
          <div className="text-center py-10">
            <p className="text-slate-400 text-xl">Loading projects...</p>
          </div>
        )}
        {/* Loading indicator for individual project details */}
        {isProjectDetailsLoading && (
          <div className="fixed inset-0 bg-slate-900 bg-opacity-75 flex items-center justify-center z-[60]">
            <p className="text-slate-300 text-2xl">Loading project details...</p>
          </div>
        )}
        {error && (
          <div className="text-center py-10 bg-red-800/50 p-4 rounded-lg">
            <p className="text-red-300 text-xl">{error}</p>
            <button 
              onClick={selectedProject ? () => loadProjectDetailsAndOpen(selectedProject, isEditingMode) : loadProjects}
              className="mt-4 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg"
            >
              Retry
            </button>
          </div>
        )}
        {!isLoading && !error && projects.length === 0 && !isProjectDetailsLoading && (
          <div className="text-center py-10">
            <p className="text-slate-500 text-xl">No projects yet. {isAdmin ? "Try creating one!" : "Check back later."}</p>
          </div>
        )}
        {!isLoading && !error && projects.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map(project => (
              <ProjectCard
                key={project.id}
                project={project}
                isAdmin={isAdmin}
                onView={() => handleViewProject(project)}
                onEdit={() => handleEditProject(project)}
                onDelete={handleDeleteProject}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal / Fullscreen view for selected project */}
      {/* Render InteractiveModule only if selectedProject and its core interactiveData are present */}
      {/* And not currently in the process of loading details (isProjectDetailsLoading is false) */}
      {selectedProject && selectedProject.interactiveData && !isProjectDetailsLoading && (
      <>
        {isEditingMode ? (
          isMobile ? (
            // Mobile editing mode - full screen without modal wrapper
            <div className="fixed inset-0 z-50 bg-slate-900">
              {selectedProject.interactiveData.hotspots && selectedProject.interactiveData.timelineEvents ? (
                <InteractiveModule
                  key={`${selectedProject.id}-${isEditingMode}-details-loaded`}
                  initialData={selectedProject.interactiveData as Required<InteractiveModuleState>} // Assert details are loaded
                  isEditing={isEditingMode}
                  onSave={(data) => handleSaveProjectData(selectedProject.id, data)}
                  onClose={handleCloseModal}
                  projectName={selectedProject.title}
                  projectId={selectedProject.id}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-slate-400 text-xl">Loading editor...</p>
                </div>
              )}
            </div>
          ) : (
            // Desktop editing mode - wrapped in modal
            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={selectedProject.title}>
              {selectedProject.interactiveData.hotspots && selectedProject.interactiveData.timelineEvents ? (
                <InteractiveModule
                  key={`${selectedProject.id}-${isEditingMode}-details-loaded`}
                  initialData={selectedProject.interactiveData as Required<InteractiveModuleState>} // Assert details are loaded
                  isEditing={isEditingMode}
                  onSave={(data) => handleSaveProjectData(selectedProject.id, data)}
                  onClose={handleCloseModal}
                  projectName={selectedProject.title}
                  projectId={selectedProject.id}
                />
              ) : (
                <div className="flex items-center justify-center h-64"> {/* Adjust height as needed */}
                  <p className="text-slate-400 text-xl">Loading editor...</p>
                </div>
              )}
            </Modal>
          )
        ) : (
          // Full-screen viewer mode (both mobile and desktop)
          <div className="fixed inset-0 z-50 bg-slate-900">
            {selectedProject.interactiveData.hotspots && selectedProject.interactiveData.timelineEvents ? (
              <InteractiveModule
                key={`${selectedProject.id}-${isEditingMode}-details-loaded`}
                initialData={selectedProject.interactiveData as Required<InteractiveModuleState>} // Assert details are loaded
                isEditing={isEditingMode}
                onSave={(data) => handleSaveProjectData(selectedProject.id, data)}
                onClose={handleCloseModal}
                projectName={selectedProject.title}
                projectId={selectedProject.id}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                 <p className="text-slate-400 text-xl">Loading viewer...</p>
              </div>
            )}
          </div>
        )}
      </>
      )}
    </div>
  );
};

// Main App Component with Routing
const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainApp />} />
        <Route path="/view/:moduleId" element={<SharedModuleViewer />} />
      </Routes>
    </Router>
  );
};

export default App;