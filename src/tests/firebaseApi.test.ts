import { describe, it, expect, vi } from 'vitest';
import { firebaseAPI } from '../lib/firebaseApi';
import { Project } from '../shared/types';

// Mock Firebase
vi.mock('../lib/firebaseConfig', () => ({
  firebaseManager: {
    getFirestore: vi.fn(() => ({})),
    getAuth: vi.fn(() => ({
      currentUser: { uid: 'test-user' },
    })),
    isReady: vi.fn(() => true),
    initialize: vi.fn(),
  },
}));

vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual('firebase/firestore');
  return {
    ...actual,
    doc: vi.fn((...args) => ({ path: args.join('/') })),
    setDoc: vi.fn(),
    getDoc: vi.fn(),
    runTransaction: vi.fn(async (firestore, updateFunction) => {
      // Mock the transaction
      const transaction = {
        get: vi.fn(),
        set: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      };
      // Simulate getting a non-existent doc by default
      transaction.get.mockResolvedValue({ exists: () => false });
      await updateFunction(transaction);
    }),
    collection: vi.fn(),
    serverTimestamp: vi.fn(() => 'SERVER_TIMESTAMP'),
  };
});

describe('FirebaseProjectAPI', () => {
  describe('saveProject', () => {
    it('should save interactiveData as a nested object', async () => {
      const project: Project = {
        id: 'test-project',
        title: 'Test Project',
        description: 'A test project',
        createdBy: 'test-user',
        interactiveData: {
          backgroundImage: 'test-image.jpg',
          imageFitMode: 'contain',
          hotspots: [{ id: 'h1', x: 10, y: 20, title: 'Hotspot 1', description: '' }],
          timelineEvents: [],
        },
      };

      const { runTransaction, getDoc } = await import('firebase/firestore');

      // Mock getDoc to return a snapshot
      (getDoc as any).mockResolvedValue({
        exists: () => true,
        data: () => ({
          backgroundImage: 'old-image.jpg',
          thumbnailUrl: 'old-thumbnail.jpg',
        }),
      });

      // Mock the transaction to capture the data being set
      const transaction = {
        get: vi.fn().mockResolvedValue({ exists: () => true, data: () => ({ createdBy: 'test-user' }) }),
        set: vi.fn(),
      };
      (runTransaction as any).mockImplementation(async (firestore, updateFunction) => {
        await updateFunction(transaction);
      });

      await firebaseAPI.saveProject(project);

      expect(transaction.set).toHaveBeenCalled();
      const savedData = transaction.set.mock.calls[0][1];

      // Verify that interactiveData is a nested object
      expect(savedData.interactiveData).toBeDefined();
      expect(savedData.interactiveData.backgroundImage).toBe('test-image.jpg');
      expect(savedData.interactiveData.imageFitMode).toBe('contain');
      expect(savedData.interactiveData.hotspots).toEqual([{ id: 'h1', x: 10, y: 20, title: 'Hotspot 1', description: '' }]);
    });
  });
});
