import React, { useState, useCallback, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from '../../lib/authContext';
import { AuthModal } from './AuthModal';
import { Project, InteractiveModuleState, InteractionType } from '../../shared/types';
import { demoModuleData } from '../../shared/demoModuleData';
import ProjectCard from './ProjectCard';
import Modal from './Modal';
import InteractiveModuleWrapper from './InteractiveModuleWrapper';
import HookErrorBoundary from './HookErrorBoundary';
import { appScriptProxy } from '../../lib/firebaseProxy';
import { PlusCircleIcon } from './icons/PlusCircleIcon';
import { SettingsIcon } from './icons/SettingsIcon';
import { useIsMobile } from '../hooks/useIsMobile';
import AuthButton from './AuthButton';
import SharedModuleViewer from './SharedModuleViewer';
import { setDynamicVhProperty } from '../utils/mobileUtils';


const LoadingScreen: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      <p className="mt-4 text-gray-600">Loading...</p>
    </div>
  </div>
);

// Main App Component for authenticated users
const MainApp: React.FC = () => {
  const { user, loading, logout } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isProjectDetailsLoading, setIsProjectDetailsLoading] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isEditingMode, setIsEditingMode] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    const cleanupVhUpdater = setDynamicVhProperty();
    return () => {
      cleanupVhUpdater();
    };
  }, []);

  // Load projects only when user is authenticated
  const loadProjects = useCallback(async () => {
    if (!user) {
      setProjects([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await appScriptProxy.init();
      const fetchedProjects = await appScriptProxy.listProjects();
      setProjects(fetchedProjects);
    } catch (err: any) {
      console.error("Failed to load projects:", err);
      setError(`Could not load projects: ${err.message || 'Please try again later.'}`);
      setProjects([]); 
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Load projects when user authentication state changes
  useEffect(() => {
    if (!loading) {
      loadProjects();
    }
  }, [user, loading, loadProjects]);

  const loadProjectDetailsAndOpen = useCallback(async (project: Project, editingMode: boolean) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    setIsProjectDetailsLoading(true);
    setError(null);
    try {
      // Enhanced condition to properly detect when details need loading
      const needsDetailLoad = !project.interactiveData.hotspots || 
                             !project.interactiveData.timelineEvents ||
                             project.interactiveData.hotspots.length === 0 || 
                             project.interactiveData.timelineEvents.length === 0 ||
                             (project as any).interactiveData._needsDetailLoad;

      if (needsDetailLoad) {
        console.log(`Fetching details for project: ${project.id} (${project.title})`);
        const details = await appScriptProxy.getProjectDetails(project.id) as InteractiveModuleState;
        
        // Validate that we actually got data
        if (!details.hotspots && !details.timelineEvents) {
          console.warn(`No details returned for project ${project.id}, using empty data`);
        }
        
        const updatedProject = {
          ...project,
          interactiveData: {
            ...project.interactiveData,
            hotspots: details.hotspots || [],
            timelineEvents: details.timelineEvents || [],
            backgroundImage: details.backgroundImage !== undefined ? details.backgroundImage : project.interactiveData.backgroundImage,
            imageFitMode: details.imageFitMode || project.interactiveData.imageFitMode,
          }
        };
        
        // Remove the loading flag
        delete (updatedProject as any).interactiveData._needsDetailLoad;
        
        setSelectedProject(updatedProject);
        setProjects(prevProjects => prevProjects.map(p => p.id === updatedProject.id ? updatedProject : p));
      } else {
        console.log(`Project ${project.id} already has details loaded`);
        setSelectedProject(project);
      }
      setIsEditingMode(editingMode);
      setIsModalOpen(true);
    } catch (err: any) {
      console.error(`Failed to load project details for ${project.id}:`, err);
      setError(`Could not load project details: ${err.message || 'Please try again.'}`);
      setSelectedProject(null);
    } finally {
      setIsProjectDetailsLoading(false);
    }
  }, [user]);

  const handleViewProject = useCallback((project: Project) => {
    loadProjectDetailsAndOpen(project, false);
  }, [loadProjectDetailsAndOpen]);

  const handleEditProject = useCallback((project: Project) => {
    loadProjectDetailsAndOpen(project, true);
  }, [loadProjectDetailsAndOpen]);
  
  const handleCreateNewProject = useCallback(async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    const createDemo = window.confirm("Create a new project from the demo module? \n\nChoose 'Cancel' to create a blank project.");

    if (createDemo) {
      setIsLoading(true);
      try {
        const newProject = await appScriptProxy.createProject("Demo Module", "A module demonstrating all features.");
        const projectWithDemoData = {
          ...newProject,
          interactiveData: demoModuleData,
        };
        
        try {
          await appScriptProxy.saveProject(projectWithDemoData);
          setProjects(prevProjects => [...prevProjects, projectWithDemoData]);
          setSelectedProject(projectWithDemoData);
          setIsEditingMode(true);
          setIsModalOpen(true);
        } catch (saveErr: any) {
          console.error("Failed to save demo project data:", saveErr);
          setError(`Failed to save demo project data: ${saveErr.message || 'Please try again.'}`);
        }
      } catch (err: any) {
        console.error("Failed to create demo project:", err);
        setError(`Failed to create demo project: ${err.message || 'Please try again.'}`);
      } finally {
        setIsLoading(false);
      }
    } else {
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
    }
  }, [user]);

  const handleCloseModal = useCallback((moduleCleanupCompleteCallback?: () => void) => {
    if (moduleCleanupCompleteCallback && typeof moduleCleanupCompleteCallback === 'function') {
      moduleCleanupCompleteCallback();
    }

    setIsModalOpen(false);
    setSelectedProject(null);
    setIsEditingMode(false);
    loadProjects();
  }, [loadProjects]);

  const handleImageUpload = useCallback(async (file: File) => {
    if (!user || !selectedProject) {
      setShowAuthModal(true);
      return;
    }

    setIsLoading(true);
    try {
      const imageUrl = await appScriptProxy.uploadImage(file, selectedProject.id);
      const updatedData = {
        ...selectedProject.interactiveData,
        backgroundImage: imageUrl,
      };
      await handleSaveProjectData(selectedProject.id, updatedData);
    } catch (err: any) {
      console.error("Failed to upload image:", err);
      setError(`Failed to upload image: ${err.message || ''}`);
    } finally {
      setIsLoading(false);
    }
  }, [user, selectedProject, handleSaveProjectData]);

  const handleSaveProjectData = useCallback(async (projectId: string, data: InteractiveModuleState, thumbnailUrl?: string) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    const projectToSave = projects.find(p => p.id === projectId);
    if (!projectToSave) {
      setError("Project not found for saving.");
      return;
    }

    const projectDataToSend: Project = {
      ...projectToSave,
      interactiveData: data,
      thumbnailUrl: thumbnailUrl || projectToSave.thumbnailUrl, // Use new thumbnail or keep existing
    };
    
    setIsLoading(true);
    try {
      const savedProjectWithPotentiallyNewThumbnail = await appScriptProxy.saveProject(projectDataToSend);

      setProjects(prevProjects =>
        prevProjects.map(p => (p.id === projectId ? savedProjectWithPotentiallyNewThumbnail : p))
      );

      if (selectedProject && selectedProject.id === projectId) {
        setSelectedProject(savedProjectWithPotentiallyNewThumbnail);
      }

      console.log('Project data save initiated via proxy and successfully updated locally:', projectId, savedProjectWithPotentiallyNewThumbnail);
    } catch (err: any) {
      console.error("Failed to save project:", err);
      setError(`Failed to save project data: ${err.message || ''}`);
    } finally {
      setIsLoading(false);
    }
  }, [user, projects, selectedProject]);

  const handleDeleteProject = useCallback(async (projectId: string) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

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
  }, [user, selectedProject, handleCloseModal]);
  
  const handleModuleReloadRequest = useCallback(async () => {
    if (selectedProject) {
      console.log(`Reload request received for project: ${selectedProject.title} (ID: ${selectedProject.id}). Attempting to re-fetch details.`);
      const projectToReload = {
        ...selectedProject,
        interactiveData: {
          ...selectedProject.interactiveData,
          hotspots: undefined,
          timelineEvents: undefined,
        }
      };
      await loadProjectDetailsAndOpen(projectToReload as Project, isEditingMode);
    } else {
      console.warn("Module reload requested, but no project is currently selected.");
    }
  }, [selectedProject, loadProjectDetailsAndOpen, isEditingMode]);

  // Show loading screen while authentication is being determined
  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white" style={{ paddingTop: 'max(env(safe-area-inset-top), 16px)', paddingLeft: '16px', paddingRight: '16px', paddingBottom: '16px' }}>
      <header className="mb-6 sm:mb-8 text-center" style={{ paddingTop: '16px' }}>
        <div className="max-w-6xl mx-auto">
          <div className="block sm:hidden">
            <div className="flex justify-between items-center mb-3 px-2" style={{ paddingTop: 'max(env(safe-area-inset-top), 8px)' }}>
              <button
                onClick={handleCreateNewProject}
                className="p-2 bg-purple-600 hover:bg-purple-700 rounded-full text-white shadow-lg transition-colors"
                title="Create New Project"
                aria-label="Create New Project"
              >
                <PlusCircleIcon className="w-6 h-6" />
              </button>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  className="p-2 rounded-full hover:bg-slate-700 transition-colors"
                  onClick={() => {
                    // TODO: Implement settings functionality
                    console.log('Settings clicked');
                  }}
                  aria-label="Settings"
                >
                  <SettingsIcon className="w-6 h-6 text-slate-300" />
                </button>
                <AuthButton variant="compact" size="small" />
              </div>
            </div>
            <h1 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 leading-tight px-4">
              Interactive Learning Hub
            </h1>
          </div>
          
          <div className="hidden sm:flex justify-between items-center mb-2" style={{ paddingTop: 'max(env(safe-area-inset-top), 0px)' }}>
            <div className="flex-1 flex items-center space-x-4">
              <span className="text-slate-300">
                Welcome, {user?.displayName || user?.email}
              </span>
              <div className="h-6 w-px bg-slate-600" />
              <button
                onClick={async () => {
                  try {
                    await logout();
                  } catch (error) {
                    console.error('Sign out error:', error);
                  }
                }}
                className="text-slate-300 hover:text-white transition-colors"
              >
                Sign Out
              </button>
            </div>
            <h1 className="flex-shrink-0 text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 whitespace-nowrap">
              Interactive Learning Hub
            </h1>
            <div className="flex-1 flex justify-end items-center space-x-4">
              <button
                onClick={handleCreateNewProject}
                className="p-2 bg-purple-600 hover:bg-purple-700 rounded-full text-white shadow-lg transition-colors"
                title="Create New Project"
                aria-label="Create New Project"
              >
                <PlusCircleIcon className="w-7 h-7" />
              </button>
              <button
                type="button"
                className="p-2 rounded-full hover:bg-slate-700 transition-colors"
                onClick={() => {
                  // TODO: Implement settings functionality
                  console.log('Settings clicked');
                }}
                aria-label="Settings"
              >
                <SettingsIcon className="w-7 h-7 text-slate-300" />
              </button>
              <AuthButton variant="toolbar" size="medium" />
            </div>
          </div>
        </div>
        <p className="text-slate-400 mt-2 text-base sm:text-lg px-4">Create and explore engaging interactive modules.</p>
      </header>

      <div className="max-w-6xl mx-auto">
        {isLoading && !isProjectDetailsLoading && (
          <div className="text-center py-10">
            <p className="text-slate-400 text-xl">Loading projects...</p>
          </div>
        )}
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
            <p className="text-slate-500 text-xl">No projects yet. Try creating one!</p>
          </div>
        )}
        {!isLoading && !error && projects.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map(project => (
              <ProjectCard
                key={project.id}
                project={project}
                onView={() => handleViewProject(project)}
                onEdit={() => handleEditProject(project)}
                onDelete={handleDeleteProject}
              />
            ))}
          </div>
        )}
      </div>

      {selectedProject && selectedProject.interactiveData && !isProjectDetailsLoading && (
        <HookErrorBoundary>
          <InteractiveModuleWrapper
            selectedProject={selectedProject}
            isEditingMode={isEditingMode}
            isMobile={isMobile}
            onClose={handleCloseModal}
            onSave={handleSaveProjectData}
            onImageUpload={handleImageUpload}
            onReloadRequest={handleModuleReloadRequest}
          />
        </HookErrorBoundary>
      )}
    </div>
  );
};

const AuthenticatedApp: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <AuthModal isOpen={true} />;
  }

  return (
    <div className="min-h-screen bg-gray-50" style={{ paddingTop: 'max(env(safe-area-inset-top), 0px)', paddingBottom: 'max(env(safe-area-inset-bottom), 0px)' }}>
      <main>
        <MainApp />
      </main>
    </div>
  );
};

// Main App Component with Routing and Authentication
const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<AuthenticatedApp />} />
          <Route path="/view/:moduleId" element={
            <div className="min-h-screen bg-gray-50">
              <main>
                <SharedModuleViewer />
              </main>
            </div>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;