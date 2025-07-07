import { Project, InteractiveModuleState } from '../shared/types'
import { firebaseAPI } from './firebaseApi'

// Firebase proxy that matches the existing GoogleAppScriptProxy interface
export const appScriptProxy = {
  init: async (): Promise<void> => {
    console.log("Firebase proxy initialized")
    return Promise.resolve()
  },

  listProjects: async (): Promise<Project[]> => {
    console.log("Firebase: Loading projects...")
    return await firebaseAPI.listProjects()
  },

  getProjectDetails: async (projectId: string): Promise<Partial<InteractiveModuleState>> => {
    console.log(`Firebase: Getting details for project ${projectId}...`)
    return await firebaseAPI.getProjectDetails(projectId)
  },

  createProject: async (title: string, description: string): Promise<Project> => {
    console.log(`Firebase: Creating project "${title}"`)
    return await firebaseAPI.createProject(title, description)
  },

  saveProject: async (project: Project): Promise<Project> => {
    console.log(`Firebase: Saving project "${project.title}" (${project.id})`)
    return await firebaseAPI.saveProject(project)
  },

  deleteProject: async (projectId: string): Promise<{ success: boolean; projectId: string }> => {
    console.log(`Firebase: Deleting project ${projectId}`)
    return await firebaseAPI.deleteProject(projectId)
  },

  // Bonus: Add image upload capability
  uploadImage: async (file: File, projectId?: string): Promise<string> => {
    console.log(`Firebase: Uploading image for project ${projectId}`)
    return await firebaseAPI.uploadImage(file, projectId)
  }
}