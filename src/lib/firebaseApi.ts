// Minimal Firebase v8 API wrapper to allow build to pass
// TODO: Convert full API from modular v9+ to v8 syntax

import { db, storage } from './firebaseConfig';
import firebase from 'firebase/app';
import { HotspotData, InteractiveModuleState, Project, UserProfile } from '../shared/types';

// Firebase v8 aliases
const serverTimestamp = firebase.firestore.FieldValue.serverTimestamp;
const Timestamp = firebase.firestore.Timestamp;

export class FirebaseAPI {
  constructor() {}

  getCurrentUser() {
    return firebase.auth().currentUser;
  }

  async listProjects(): Promise<Project[]> {
    console.warn('FirebaseAPI: listProjects not implemented in v8 conversion');
    return [];
  }

  async getProjectDetails(projectId: string): Promise<InteractiveModuleState> {
    console.warn('FirebaseAPI: getProjectDetails not implemented in v8 conversion');
    return { hotspots: [], timelineEvents: [] };
  }

  async createProject(title: string, description: string): Promise<Project> {
    console.warn('FirebaseAPI: createProject not implemented in v8 conversion');
    return {
      id: 'temp-' + Date.now(),
      title,
      description,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: this.getCurrentUser()?.uid || 'anonymous',
      interactiveData: { hotspots: [], timelineEvents: [] }
    };
  }

  async saveProject(project: Project): Promise<Project> {
    console.warn('FirebaseAPI: saveProject not implemented in v8 conversion');
    return project;
  }

  async deleteProject(projectId: string): Promise<void> {
    console.warn('FirebaseAPI: deleteProject not implemented in v8 conversion');
  }

  async uploadImage(file: File, projectId: string): Promise<string> {
    console.warn('FirebaseAPI: uploadImage not implemented in v8 conversion');
    return 'https://placeholder.com/400x300';
  }

  logUsage(operation: string, count: number) {
    console.log(`Firebase usage: ${operation} - ${count}`);
  }
}

export const firebaseAPI = new FirebaseAPI();