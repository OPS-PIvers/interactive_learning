import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  collection,
  setDoc,
} from 'firebase/firestore';
import { SlideDeck } from '../shared/slideTypes';
import { firebaseManager } from './firebaseConfig';

const getProjectDocAndVerifyOwner = async (projectId: string, userId: string) => {
  const db = firebaseManager.getFirestore();
  if (!db) throw new Error('Firestore not initialized');

  const projectRef = doc(db, 'projects', projectId);
  const projectDoc = await getDoc(projectRef);

  if (!projectDoc.exists()) {
    throw new Error('Project not found.');
  }

  const projectData = projectDoc.data();
  if (projectData['createdBy'] !== userId) {
    throw new Error('User does not have permission to access this project.');
  }

  return projectDoc;
};

export async function saveSlideDeck(userId: string, slideDeck: SlideDeck): Promise<void> {
  if (!userId || !slideDeck || !slideDeck.id) {
    throw new Error('Invalid input for saving slide deck.');
  }

  await getProjectDocAndVerifyOwner(slideDeck.id, userId);

  const db = firebaseManager.getFirestore();
  if (!db) {
    throw new Error('Firestore not initialized');
  }
  const projectRef = doc(db, 'projects', slideDeck.id);
  await updateDoc(projectRef, {
    slideDeck: slideDeck,
    updatedAt: serverTimestamp(),
  });
}

export async function loadSlideDeck(userId: string, projectId: string): Promise<SlideDeck | null> {
  if (!userId || !projectId) {
    throw new Error('Invalid input for loading slide deck.');
  }

  const projectDoc = await getProjectDocAndVerifyOwner(projectId, userId);
  return projectDoc.data()['slideDeck'] || null;
}

export async function createProjectForUser(userId: string, title: string): Promise<string> {
  if (!userId) {
    throw new Error('User must be authenticated to create a project.');
  }

  const db = firebaseManager.getFirestore();
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  const projectsCollection = collection(db, 'projects');
  const newProjectRef = doc(projectsCollection);

  const newSlideDeck: Partial<SlideDeck> = {
    id: newProjectRef.id,
    title: title,
    slides: [],
    settings: { allowNavigation: true, showControls: true },
    metadata: { created: Date.now(), modified: Date.now(), version: '1.0', isPublic: false },
  };

  await setDoc(newProjectRef, {
    createdBy: userId,
    createdAt: serverTimestamp(),
    title: title,
    slideDeck: newSlideDeck,
  });

  return newProjectRef.id;
}