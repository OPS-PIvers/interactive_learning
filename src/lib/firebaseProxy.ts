import { Project, InteractiveModuleState } from '../shared/types';
import { firebaseAPI } from './firebaseApi';
import { firebaseManager } from './firebaseConfig';

// Firebase proxy that matches the existing GoogleAppScriptProxy interface
export const appScriptProxy = {
  init: async (): Promise<void> => {
    // Ensure Firebase is properly initialized instead of just logging
    if (!firebaseManager.isReady()) {

      await firebaseManager.initialize();

    } else {

    }
    return Promise.resolve();
  },

  listProjects: async (): Promise<Project[]> => {

    return await firebaseAPI.listProjects();
  },

  getProjectDetails: async (projectId: string): Promise<Partial<InteractiveModuleState>> => {

    return await firebaseAPI.getProjectDetails(projectId);
  },

  getPublicProject: async (projectId: string): Promise<Project | null> => {

    return await firebaseAPI.getPublicProject(projectId);
  },

  createProject: async (title: string, description: string): Promise<Project> => {

    return await firebaseAPI.createProject(title, description);
  },

  saveProject: async (project: Project): Promise<Project> => {

    return await firebaseAPI.saveProject(project);
  },

  deleteProject: async (projectId: string): Promise<{success: boolean;projectId: string;}> => {

    return await firebaseAPI.deleteProject(projectId);
  },

  // Bonus: Add image upload capability
  uploadImage: async (file: File, projectId?: string): Promise<string> => {

    return await firebaseAPI.uploadImage(file, projectId);
  },

  // Add thumbnail upload capability
  uploadThumbnail: async (file: File, projectId: string): Promise<string> => {

    return await firebaseAPI.uploadThumbnail(file, projectId);
  },

  uploadFile: async (file: File, onProgress: (progress: number) => void, projectId?: string): Promise<string> => {

    return await firebaseAPI.uploadFile(file, onProgress, projectId);
  }
};