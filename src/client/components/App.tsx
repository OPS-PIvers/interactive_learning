
import React, { useState, useCallback, useEffect } from 'react';
import { Project, InteractiveModuleState, InteractionType } from './types';
import ProjectCard from './components/ProjectCard';
import Modal from './components/Modal';
import InteractiveModule from './components/InteractiveModule';
import AdminToggle from './components/AdminToggle';
import { appScriptProxy } from './lib/googleAppScriptProxy'; // Updated import
import { PlusCircleIcon } from './components/icons/PlusCircleIcon';

const App: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isEditingMode, setIsEditingMode] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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
      // Thumbnail will be derived from data.backgroundImage on the server/proxy if needed
    };
    
    setIsLoading(true);
    try {
      await appScriptProxy.saveProject(updatedProjectData);
      // Update local state for immediate reflection. 
      // The server response from saveProject could also return the updated project.
      setProjects(prevProjects =>
        prevProjects.map(p => (p.id === projectId ? {
            ...updatedProjectData, 
            thumbnailUrl: data.backgroundImage // for immediate UI update of thumbnail
        } : p))
      );
       // Re-fetch all projects to ensure consistency after save.
       // Alternatively, appScriptProxy.saveProject could return the updated project itself.
       const refreshedProjects = await appScriptProxy.listProjects();
       setProjects(refreshedProjects);
       setSelectedProject(refreshedProjects.find(p => p.id === projectId) || null);

      console.log('Project data save initiated via proxy:', projectId);
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
      <header className="mb-8 text-center">
        <div className="flex justify-between items-center max-w-6xl mx-auto mb-2">
            <span className="w-1/3"></span> {/* Spacer */}
            <h1 className="w-1/3 text-4xl sm:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
            Interactive Learning Hub
            </h1>
            <div className="w-1/3 flex justify-end items-center space-x-4">
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
        <p className="text-slate-400 mt-2 text-lg">Create and explore engaging interactive modules.</p>
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
        <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={selectedProject.title}>
          <InteractiveModule
            key={`${selectedProject.id}-${isEditingMode}`} 
            initialData={selectedProject.interactiveData}
            isEditing={isEditingMode}
            onSave={(data) => handleSaveProjectData(selectedProject.id, data)}
            projectName={selectedProject.title}
          />
        </Modal>
      )}
    </div>
  );
};

export default App;