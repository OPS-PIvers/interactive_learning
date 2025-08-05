import React, { useState, useCallback, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from '../../lib/authContext';
import { AuthModal } from './AuthModal';
import { Project, InteractiveModuleState } from '../../shared/types';
import { InteractionType } from '../../shared/enums';
import { SlideDeck } from '../../shared/slideTypes';
import { demoModuleData } from '../../shared/demoModuleData';
import ProjectCard from './ProjectCard';
import Modal from './Modal';
import InteractiveModuleWrapper from './InteractiveModuleWrapper';
import HookErrorBoundary from './HookErrorBoundary';
import { appScriptProxy } from '../../lib/firebaseProxy';
import { PlusCircleIcon } from './icons/PlusCircleIcon';
import { GradientCreateButton } from './ui/GradientCreateButton';
import { SettingsIcon } from './icons/SettingsIcon';
import { useDeviceDetection } from '../hooks/useDeviceDetection';
import AuthButton from './AuthButton';
import SharedModuleViewer from './SharedModuleViewer';
import ViewerView from './views/ViewerView';
import SlideBasedTestPage from './SlideBasedTestPage';
import MigrationTestPage from './MigrationTestPage';
import { createDefaultSlideDeck } from '../utils/slideDeckUtils';
import { setDynamicViewportProperties } from '../utils/viewportUtils';


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
  const [showInitialAnimation, setShowInitialAnimation] = useState(true);
  useEffect(() => {
    const cleanupVhUpdater = setDynamicViewportProperties();
    
    // Add touch editing body class for touch-capable devices
    const hasTouchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (hasTouchSupport) {
      document.body.classList.add('touch-editing');
    }
    
    return () => {
      cleanupVhUpdater();
      if (hasTouchSupport) {
        document.body.classList.remove('touch-editing');
      }
    };
  }, []);

  // Handle initial animation timing
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowInitialAnimation(false);
    }, 2000); // Show animation for 2 seconds

    return () => clearTimeout(timer);
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
      // Firebase connection manager handles initialization automatically
      // Only call init once during app lifecycle, not on every project load
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

  // Initialize Firebase once when app starts
  // Temporarily disabled Firebase initialization
  // useEffect(() => {
  //   const initializeFirebase = async () => {
  //     try {
  //       await appScriptProxy.init();
  //     } catch (error) {
  //       console.error('Failed to initialize Firebase:', error);
  //     }
  //   };
  //   initializeFirebase();
  // }, []);

  // Load projects when user authentication state changes
  useEffect(() => {
    if (!loading) {
      loadProjects();
    }
  }, [user, loading, loadProjects]);

  const loadProjectDetailsAndOpenEditor = useCallback(async (project: Project) => {
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
      setIsEditingMode(true);
      setIsModalOpen(true);
    } catch (err: any) {
      console.error(`Failed to load project details for ${project.id}:`, err);
      setError(`Could not load project details: ${err.message || 'Please try again.'}`);
      setSelectedProject(null);
    } finally {
      setIsProjectDetailsLoading(false);
    }
  }, [user]);

  const handleEditProject = useCallback((project: Project) => {
    loadProjectDetailsAndOpenEditor(project);
  }, [loadProjectDetailsAndOpenEditor]);
  
  // Helper function to reduce code duplication
  const createAndSetupProject = useCallback(async (title: string, description: string, demoData?: any) => {
    setIsLoading(true);
    try {
      const newProject = await appScriptProxy.createProject(title, description);
      let finalProject = newProject;

      // Set project type to 'slide' for new projects (this is the slides-based app)
      const projectWithSlideType = {
        ...newProject,
        projectType: 'slide' as const,
        slideDeck: createDefaultSlideDeck(newProject.id, newProject.title),
      };

      // If demo data is provided, save it with the project
      if (demoData) {
        const projectWithDemoData = {
          ...projectWithSlideType,
          interactiveData: demoData,
        };
        
        try {
          await appScriptProxy.saveProject(projectWithDemoData);
          finalProject = projectWithDemoData;
        } catch (saveErr: any) {
          console.error("Failed to save demo project data:", saveErr);
          setError(`Failed to save demo project data: ${saveErr.message || 'Please try again.'}`);
          return;
        }
      } else {
        // For projects without demo data, still need to save the project type
        try {
          await appScriptProxy.saveProject(projectWithSlideType);
          finalProject = projectWithSlideType;
        } catch (saveErr: any) {
          console.error("Failed to save project type:", saveErr);
          setError(`Failed to save project: ${saveErr.message || 'Please try again.'}`);
          return;
        }
      }

      setProjects(prevProjects => [...prevProjects, finalProject]);
      setSelectedProject(finalProject);
      setIsEditingMode(true);
      setIsModalOpen(true);
    } catch (err: any) {
      console.error("Failed to create project:", err);
      setError(`Failed to create new project: ${err.message || ''}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleCreateNewProject = useCallback(async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    const createDemo = window.confirm("Create a new project from the demo module? \n\nChoose 'Cancel' to create a blank project.");

    if (createDemo) {
      await createAndSetupProject("Demo Module", "A module demonstrating all features.", demoModuleData);
    } else {
      const title = prompt("Enter new project title:");
      if (!title) return;
      const description = prompt("Enter project description (optional):") || "";
      await createAndSetupProject(title, description);
    }
  }, [user, createAndSetupProject]);

  const handleCloseModal = useCallback((moduleCleanupCompleteCallback?: () => void) => {
    if (moduleCleanupCompleteCallback && typeof moduleCleanupCompleteCallback === 'function') {
      moduleCleanupCompleteCallback();
    }

    setIsModalOpen(false);
    setSelectedProject(null);
    setIsEditingMode(false);
    loadProjects();
  }, [loadProjects]);

  const handleSaveProjectData = useCallback(async (projectId: string, data: InteractiveModuleState, thumbnailUrl?: string, slideDeck?: SlideDeck) => {
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
      slideDeck: slideDeck || projectToSave.slideDeck,
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
      
      // Update local project state first to ensure React state is current
      setProjects(prev => prev.map(p => 
        p.id === selectedProject.id 
          ? { ...p, interactiveData: updatedData }
          : p
      ));
      
      // Use a small delay to ensure React state has propagated before saving
      await new Promise(resolve => setTimeout(resolve, 50));
      
      await handleSaveProjectData(selectedProject.id, updatedData);
    } catch (err: any) {
      console.error("Failed to upload image:", err);
      setError(`Failed to upload image: ${err.message || ''}`);
    } finally {
      setIsLoading(false);
    }
  }, [user, selectedProject, handleSaveProjectData]);

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
    }
    finally {
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
      await loadProjectDetailsAndOpenEditor(projectToReload as Project);
    } else {
      console.warn("Module reload requested, but no project is currently selected.");
    }
  }, [selectedProject, loadProjectDetailsAndOpenEditor]);

  // Show loading screen while authentication is being determined
  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white transition-all duration-2000 ${showInitialAnimation ? 'scale-105 opacity-95' : 'scale-100 opacity-100'}`} style={{ paddingTop: 'max(env(safe-area-inset-top), 16px)', paddingLeft: '16px', paddingRight: '16px', paddingBottom: '16px' }}>
      <header className="mb-6 sm:mb-8 text-center" style={{ paddingTop: '16px' }}>
        <div className="max-w-6xl mx-auto">
          <div className="block sm:hidden">
            <div className={`flex justify-between items-center mb-3 px-2 transition-all duration-1000 delay-200 ${showInitialAnimation ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`} style={{ paddingTop: 'max(env(safe-area-inset-top), 8px)' }}>
              <GradientCreateButton
                onClick={handleCreateNewProject}
                size="medium"
                variant="compact"
              />
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
            <h1 className={`text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 leading-tight px-4 transition-all duration-1000 ${showInitialAnimation ? 'opacity-0 translate-y-4 scale-95' : 'opacity-100 translate-y-0 scale-100'}`}>
              ExpliCoLearning
            </h1>
          </div>
          
          <div className={`hidden sm:flex justify-between items-center mb-2 transition-all duration-1000 delay-200 ${showInitialAnimation ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`} style={{ paddingTop: 'max(env(safe-area-inset-top), 0px)' }}>
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
            <h1 className={`flex-shrink-0 text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 whitespace-nowrap transition-all duration-1000 ${showInitialAnimation ? 'opacity-0 translate-y-4 scale-95' : 'opacity-100 translate-y-0 scale-100'}`}>
              ExpliCoLearning
            </h1>
            <div className="flex-1 flex justify-end items-center space-x-4">
              <GradientCreateButton
                onClick={handleCreateNewProject}
                size="large"
                variant="toolbar"
              />
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
        <p className={`text-slate-400 mt-2 text-base sm:text-lg px-4 transition-all duration-1000 delay-300 ${showInitialAnimation ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>Create and explore engaging interactive modules.</p>
      </header>

      <div className={`max-w-6xl mx-auto transition-all duration-1000 delay-500 ${showInitialAnimation ? 'opacity-0 translate-y-8' : 'opacity-100 translate-y-0'}`}>
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
              onClick={selectedProject ? () => loadProjectDetailsAndOpenEditor(selectedProject) : loadProjects}
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
            onClose={handleCloseModal}
            onSave={handleSaveProjectData}
            onImageUpload={handleImageUpload}
            onReloadRequest={handleModuleReloadRequest}
            isPublished={selectedProject.isPublished}
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
    <div className="h-screen bg-gray-50 overflow-hidden" style={{ paddingTop: 'max(env(safe-area-inset-top), 0px)', paddingBottom: 'max(env(safe-area-inset-bottom), 0px)' }}>
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
          <Route path="/view/:projectId" element={<ViewerView />} />
          <Route path="/shared/:moduleId" element={
            <div className="min-h-screen bg-gray-50">
              <main>
                <SharedModuleViewer />
              </main>
            </div>
          } />
          <Route path="/slide-test" element={<SlideBasedTestPage />} />
          <Route path="/migration-test" element={<MigrationTestPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
