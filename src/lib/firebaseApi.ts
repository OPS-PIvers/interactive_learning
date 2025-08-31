import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  orderBy,
} from 'firebase/firestore';
import { firebaseManager } from './firebaseConfig';
import type { HotspotWalkthrough } from '../shared/hotspotTypes';

// Helper function to get initialized Firestore instance
const getDb = async () => {
  await firebaseManager.initialize();
  const db = firebaseManager.getFirestore();
  if (!db) {
    throw new Error('Firestore initialization failed');
  }
  return db;
};

// Hotspot Walkthrough CRUD operations
export async function createWalkthrough(walkthrough: Omit<HotspotWalkthrough, 'id' | 'createdAt' | 'updatedAt'>): Promise<HotspotWalkthrough> {
  const db = await getDb();
  const walkthroughWithTimestamps = {
    ...walkthrough,
    createdBy: walkthrough.creatorId, // Map creatorId to createdBy for security rules
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  const docRef = await addDoc(collection(db, 'projects'), walkthroughWithTimestamps);

  return {
    ...walkthrough,
    id: docRef.id,
    createdAt: Date.now(), // Approximate client-side timestamp
    updatedAt: Date.now(), // Approximate client-side timestamp
  };
}

export async function getWalkthrough(id: string): Promise<HotspotWalkthrough> {
  const db = await getDb();
  const docRef = doc(db, 'projects', id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    throw new Error('Walkthrough not found');
  }

  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    createdAt: data['createdAt']?.toMillis() || 0,
    updatedAt: data['updatedAt']?.toMillis() || 0,
  } as HotspotWalkthrough;
}

export async function updateWalkthrough(walkthrough: Partial<HotspotWalkthrough> & { id: string }): Promise<void> {
  const db = await getDb();
  const docRef = doc(db, 'projects', walkthrough.id);
  const updateData: any = {
    ...walkthrough,
    updatedAt: serverTimestamp()
  };
  // Map creatorId to createdBy if present
  if (walkthrough.creatorId) {
    updateData.createdBy = walkthrough.creatorId;
  }
  await updateDoc(docRef, updateData);
}

export async function deleteWalkthrough(id: string): Promise<void> {
  const db = await getDb();
  const docRef = doc(db, 'projects', id);
  await deleteDoc(docRef);
}

export async function getUserWalkthroughs(userId: string): Promise<HotspotWalkthrough[]> {
  console.log('getUserWalkthroughs: Querying projects for userId:', userId);
  const db = await getDb();
  const q = query(
    collection(db, 'projects'),
    where('createdBy', '==', userId),
    orderBy('updatedAt', 'desc')
  );

  console.log('getUserWalkthroughs: Executing Firestore query...');
  const snapshot = await getDocs(q);
  console.log('getUserWalkthroughs: Query completed, found', snapshot.docs.length, 'documents');
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      // Map createdBy back to creatorId for the interface
      creatorId: data['createdBy'] || data['creatorId'],
      createdAt: data['createdAt']?.toMillis() || 0,
      updatedAt: data['updatedAt']?.toMillis() || 0,
    } as HotspotWalkthrough;
  });
}