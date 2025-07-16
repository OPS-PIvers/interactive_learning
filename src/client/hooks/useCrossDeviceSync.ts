import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebaseConfig';

// Constants
const CROSS_DEVICE_SYNC_COLLECTION = 'crossDeviceSync';

interface SyncData {
  position: number;
  lastUpdated: number;
}

// Type guard for validating sync data
const isSyncData = (data: any): data is SyncData => {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof data.position === 'number' &&
    typeof data.lastUpdated === 'number'
  );
};

export const useCrossDeviceSync = (moduleId: string | null) => {
  const [syncData, setSyncData] = useState<SyncData | null>(null);

  useEffect(() => {
    if (!moduleId) return;

    const docRef = doc(db, CROSS_DEVICE_SYNC_COLLECTION, moduleId);

    const unsubscribe = onSnapshot(docRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        if (isSyncData(data)) {
          setSyncData(data);
        } else {
          console.warn('Invalid sync data received from Firestore:', data);
        }
      }
    });

    return () => unsubscribe();
  }, [moduleId]);

  const updateSyncPosition = useCallback(async (position: number) => {
    if (!moduleId) return;
    const docRef = doc(db, CROSS_DEVICE_SYNC_COLLECTION, moduleId);
    const data: SyncData = {
      position,
      lastUpdated: Date.now(),
    };
    await setDoc(docRef, data, { merge: true });
  }, [moduleId]);

  return { syncData, updateSyncPosition };
};
