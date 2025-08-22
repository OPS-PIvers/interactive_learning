import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { useState, useEffect, useCallback } from 'react';
import { firebaseManager } from '../../lib/firebaseConfig';

// Constants
const CROSS_DEVICE_SYNC_COLLECTION = 'crossDeviceSync';

interface SyncData {
  position: number;
  lastUpdated: number;
}

// Type guard for validating sync data
const isSyncData = (data: unknown): data is SyncData => {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof (data as any).position === 'number' &&
    typeof (data as any).lastUpdated === 'number'
  );
};

export const useCrossDeviceSync = (moduleId: string | null) => {
  const [syncData, setSyncData] = useState<SyncData | null>(null);

  useEffect(() => {
    if (!moduleId) return;

    let unsubscribe: (() => void) | undefined;
    
    const setupSync = async () => {
      try {
        // Ensure Firebase is initialized first
        await firebaseManager.initialize();
        const db = firebaseManager.getFirestore();
        if (!db) {
          throw new Error('Firestore not initialized');
        }
        const docRef = doc(db, CROSS_DEVICE_SYNC_COLLECTION, moduleId);

        unsubscribe = onSnapshot(docRef, (doc) => {
          if (doc.exists()) {
            const data = doc.data();
            if (isSyncData(data)) {
              setSyncData(data);
            } else {
              console.warn('Invalid sync data received from Firestore:', data);
            }
          }
        });
      } catch (error) {
        console.error('Failed to setup cross-device sync:', error);
      }
    };

    setupSync();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [moduleId]);

  const updateSyncPosition = useCallback(async (position: number) => {
    if (!moduleId) return;
    try {
      // Ensure Firebase is initialized first
      await firebaseManager.initialize();
      const db = firebaseManager.getFirestore();
      if (!db) {
        throw new Error('Firestore not initialized');
      }
      const docRef = doc(db, CROSS_DEVICE_SYNC_COLLECTION, moduleId);
      const data: SyncData = {
        position,
        lastUpdated: Date.now(),
      };
      await setDoc(docRef, data, { merge: true });
    } catch (error) {
      console.error('Failed to update sync position:', error);
    }
  }, [moduleId]);

  return { syncData, updateSyncPosition };
};
