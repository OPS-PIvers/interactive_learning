
import React, { useState, useCallback, useEffect } from 'react';
import { Project, InteractiveModuleState, InteractionType } from '../../shared/types';
import ProjectCard from './ProjectCard';
import Modal from './Modal';
import InteractiveModule from './InteractiveModule';
import AdminToggle from './AdminToggle';
import { appScriptProxy } from '../../lib/firebaseProxy';
import { PlusCircleIcon } from './icons/PlusCircleIcon';
import { useIsMobile } from '../hooks/useIsMobile';

const App: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isEditingMode, setIsEditingMode] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const isMobile = useIsMobile();

  const loadProjects = useCallback(async () => {
    setIsLoading(true);
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

  const handleViewProject = useCallback((project: Project) => {
    setSelectedProject(project);
    setIsEditingMode(false);
    setIsModalOpen(true);
  }, []);

  const handleEditProject = useCallback((project: Project) => {
    setSelectedProject(project);
    setIsEditingMode(true);
    setIsModalOpen(true);
  }, []);
  
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

    const updatedProjectData: Project = {
      ...projectToSave,
      interactiveData: data,
      thumbnailUrl: data.backgroundImage || undefined, // Explicitly set thumbnailUrl
    };
    
    setIsLoading(true);
    try {
      // Pass the updatedProjectData which now includes the thumbnailUrl to the proxy
      await appScriptProxy.saveProject(updatedProjectData);

      // Optimistically update the local state with the new data, including the thumbnail.
      // This ensures the UI updates immediately.
      setProjects(prevProjects =>
        prevProjects.map(p => (p.id === projectId ? updatedProjectData : p))
      );

      // Update selectedProject if it's the one being saved
      if (selectedProject && selectedProject.id === projectId) {
        setSelectedProject(updatedProjectData);
      }

      // Optionally, you can still refresh the project list from the server
      // if you want to ensure full consistency or if the server might make further changes.
      // However, for the thumbnail issue, the optimistic update should suffice for immediate UI correctness.
      // For now, let's keep the refresh to ensure data integrity from the backend.
       const refreshedProjects = await appScriptProxy.listProjects();
       setProjects(refreshedProjects);
       // Ensure selected project is also updated from the refreshed list
       setSelectedProject(prevSelected => prevSelected ? refreshedProjects.find(p => p.id === prevSelected.id) || null : null);

      console.log('Project data save initiated via proxy:', projectId, updatedProjectData);
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
        {isLoading && (
          <div className="text-center py-10">
            <p className="text-slate-400 text-xl">Loading projects...</p>
          </div>
        )}
        {error && (
          <div className="text-center py-10 bg-red-800/50 p-4 rounded-lg">
            <p className="text-red-300 text-xl">{error}</p>
            <button 
              onClick={loadProjects} 
              className="mt-4 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg"
            >
              Retry
            </button>
          </div>
        )}
        {!isLoading && !error && projects.length === 0 && (
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

      {selectedProject && (
        <>
          {isEditingMode ? (
            isMobile ? (
              // Mobile editing mode - full screen without modal wrapper
              <div className="fixed inset-0 z-50 bg-slate-900">
                <InteractiveModule
                  key={`${selectedProject.id}-${isEditingMode}`} 
                  initialData={selectedProject.interactiveData}
                  isEditing={isEditingMode}
                  onSave={(data) => handleSaveProjectData(selectedProject.id, data)}
                  onClose={handleCloseModal}
                  projectName={selectedProject.title}
                  projectId={selectedProject.id}
                />
              </div>
            ) : (
              // Desktop editing mode - wrapped in modal
              <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={selectedProject.title}>
                <InteractiveModule
                  key={`${selectedProject.id}-${isEditingMode}`} 
                  initialData={selectedProject.interactiveData}
                  isEditing={isEditingMode}
                  onSave={(data) => handleSaveProjectData(selectedProject.id, data)}
                  onClose={handleCloseModal}
                  projectName={selectedProject.title}
                  projectId={selectedProject.id}
                />
              </Modal>
            )
          ) : (
            // Full-screen viewer mode (both mobile and desktop)
            <div className="fixed inset-0 z-50 bg-slate-900">
              <InteractiveModule
                key={`${selectedProject.id}-${isEditingMode}`} 
                initialData={selectedProject.interactiveData}
                isEditing={isEditingMode}
                onSave={(data) => handleSaveProjectData(selectedProject.id, data)}
                onClose={handleCloseModal}
                projectName={selectedProject.title}
                projectId={selectedProject.id}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default App;