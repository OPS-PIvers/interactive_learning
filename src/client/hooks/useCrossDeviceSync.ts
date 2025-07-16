import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebaseConfig';

interface SyncData {
  position: number;
  lastUpdated: number;
}

export const useCrossDeviceSync = (moduleId: string | null) => {
  const [syncData, setSyncData] = useState<SyncData | null>(null);

  useEffect(() => {
    if (!moduleId) return;

    const docRef = doc(db, 'crossDeviceSync', moduleId);

    const unsubscribe = onSnapshot(docRef, (doc) => {
      if (doc.exists()) {
        setSyncData(doc.data() as SyncData);
      }
    });

    return () => unsubscribe();
  }, [moduleId]);

  const updateSyncPosition = async (position: number) => {
    if (!moduleId) return;
    const docRef = doc(db, 'crossDeviceSync', moduleId);
    const data: SyncData = {
      position,
      lastUpdated: Date.now(),
    };
    await setDoc(docRef, data, { merge: true });
  };

  return { syncData, updateSyncPosition };
};
