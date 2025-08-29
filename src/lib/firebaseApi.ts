import {
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
  collection,
  setDoc,
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject, uploadBytesResumable } from 'firebase/storage';
import { SlideDeck } from '../shared/slideTypes';
import { firebaseManager } from './firebaseConfig';
import { DevAuthBypass } from './testAuthUtils';

export class FirebaseSlideDeckAPI {
  private getCurrentUser(): {uid: string;email: string;} {
    const devBypass = DevAuthBypass.getInstance();
    if (devBypass.isEnabled()) {
      const bypassUser = devBypass.getBypassUser();
      if (bypassUser) {
        console.log(`Using development bypass user: ${bypassUser.email}`);
        return { uid: bypassUser.uid, email: bypassUser.email || '' };
      }
    }

    if (!firebaseManager.isReady()) {
      throw new Error('Firebase not initialized. Please try again.');
    }

    const auth = firebaseManager.getAuth();
    if (!auth || !auth.currentUser || !auth.currentUser.uid) {
      throw new Error('User must be authenticated to access slide decks');
    }

    return { uid: auth.currentUser.uid, email: auth.currentUser.email || '' };
  }

  async saveSlideDeck(userId: string, slideDeck: SlideDeck): Promise<void> {
    if (!userId || !slideDeck || !slideDeck.id) {
      throw new Error("Invalid input for saving slide deck.");
    }

    const db = firebaseManager.getFirestore();
    if (!db) {
      throw new Error('Firestore not initialized');
    }
    const projectRef = doc(db, 'projects', slideDeck.id);

    await runTransaction(db, async (transaction) => {
      const projectDoc = await transaction.get(projectRef);
      if (!projectDoc.exists()) {
        throw new Error("Project not found.");
      }

      const projectData = projectDoc.data();
      if (projectData['createdBy'] !== userId) {
        throw new Error("User does not have permission to save this slide deck.");
      }

      transaction.update(projectRef, {
        slideDeck: slideDeck,
        updatedAt: serverTimestamp()
      });
    });
  }

  async loadSlideDeck(userId: string, projectId: string): Promise<SlideDeck | null> {
    if (!userId || !projectId) {
      throw new Error("Invalid input for loading slide deck.");
    }

    const db = firebaseManager.getFirestore();
    if (!db) {
      throw new Error('Firestore not initialized');
    }
    const projectRef = doc(db, 'projects', projectId);
    const projectDoc = await getDoc(projectRef);

    if (!projectDoc.exists()) {
      return null;
    }

    const projectData = projectDoc.data();
    if (projectData['createdBy'] !== userId) {
      throw new Error("User does not have permission to load this slide deck.");
    }

    return projectData['slideDeck'] || null;
  }

  async createProjectForUser(userId: string, title: string): Promise<string> {
    if (!userId) {
      throw new Error("User must be authenticated to create a project.");
    }

    const db = firebaseManager.getFirestore();
    if (!db) {
      throw new Error('Firestore not initialized');
    }

    const projectsCollection = collection(db, 'projects');
    const newProjectRef = doc(projectsCollection);

    const defaultSlide: import('../shared/slideTypes').InteractiveSlide = {
      id: 'slide-1',
      title: 'My First Slide',
      backgroundMedia: { type: 'color', color: '#ffffff' },
      elements: [],
    };

    const newSlideDeck: SlideDeck = {
      id: newProjectRef.id,
      title: title,
      slides: [defaultSlide],
      settings: {
        allowNavigation: true,
        showControls: true,
      },
      metadata: {
        created: Date.now(),
        modified: Date.now(),
        version: '1.0.0',
        isPublic: false,
      },
    };

    await setDoc(newProjectRef, {
      createdBy: userId,
      createdAt: serverTimestamp(),
      title: title,
      slideDeck: newSlideDeck
    });

    return newProjectRef.id;
  }
}

export const firebaseAPI = new FirebaseSlideDeckAPI();