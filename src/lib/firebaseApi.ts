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

const db = firebaseManager.getFirestore();

// Hotspot Walkthrough CRUD operations
export async function createWalkthrough(walkthrough: Omit<HotspotWalkthrough, 'id' | 'createdAt' | 'updatedAt'>): Promise<HotspotWalkthrough> {
  if (!db) throw new Error('Firestore not initialized');
  const walkthroughWithTimestamps = {
    ...walkthrough,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  const docRef = await addDoc(collection(db, 'walkthroughs'), walkthroughWithTimestamps);

  return {
    ...walkthrough,
    id: docRef.id,
    createdAt: Date.now(), // Approximate client-side timestamp
    updatedAt: Date.now(), // Approximate client-side timestamp
  };
}

export async function getWalkthrough(id: string): Promise<HotspotWalkthrough> {
  if (!db) throw new Error('Firestore not initialized');
  const docRef = doc(db, 'walkthroughs', id);
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
  if (!db) throw new Error('Firestore not initialized');
  const docRef = doc(db, 'walkthroughs', walkthrough.id);
  await updateDoc(docRef, {
    ...walkthrough,
    updatedAt: serverTimestamp()
  });
}

export async function deleteWalkthrough(id: string): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  const docRef = doc(db, 'walkthroughs', id);
  await deleteDoc(docRef);
}

export async function getUserWalkthroughs(userId: string): Promise<HotspotWalkthrough[]> {
  if (!db) throw new Error('Firestore not initialized');
  const q = query(
    collection(db, 'walkthroughs'),
    where('creatorId', '==', userId),
    orderBy('updatedAt', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data['createdAt']?.toMillis() || 0,
      updatedAt: data['updatedAt']?.toMillis() || 0,
    } as HotspotWalkthrough;
  });
}