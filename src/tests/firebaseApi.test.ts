import { describe, it, expect, vi } from 'vitest';
import { firebaseAPI } from '../lib/firebaseApi';
import { SlideDeck, InteractiveSlide } from '../shared/slideTypes';

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

describe('FirebaseAPI - Slide Architecture', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('saveSlideDeck', () => {
    it('should save slide deck with proper structure', async () => {
      const slideDeck: SlideDeck = {
        id: 'test-slide-deck',
        title: 'Test Slide Deck',
        description: 'A test slide deck for Firebase testing',
        slides: [
          {
            id: 'slide-1',
            title: 'Test Slide',
            elements: [
              {
                id: 'element-1',
                type: 'hotspot',
                position: {
                  desktop: { x: 100, y: 100, width: 50, height: 50 },
                  tablet: { x: 80, y: 80, width: 40, height: 40 },
                  mobile: { x: 60, y: 60, width: 30, height: 30 }
                },
              }
            ],
          } as InteractiveSlide
        ],
        metadata: {
          version: '2.0',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      };

      const { runTransaction, getDoc } = await import('firebase/firestore');
      const transaction = {
        get: vi.fn().mockResolvedValue({ exists: () => true, data: () => ({ createdBy: 'test-user' }) }),
        update: vi.fn(),
      };
      (runTransaction as any).mockImplementation(async (firestore, updateFunction) => {
        await updateFunction(transaction);
      });


      await firebaseAPI.saveSlideDeck('test-user', slideDeck);

      expect(transaction.update).toHaveBeenCalled();
      const savedData = transaction.update.mock.calls[0][1];

      // Verify slide deck structure
      expect(savedData.slideDeck.title).toBe('Test Slide Deck');
      expect(savedData.slideDeck.description).toBe('A test slide deck for Firebase testing');
      expect(savedData.slideDeck.slides).toBeDefined();
    });

    it('should handle slide deck updates correctly', async () => {
      const existingSlideDeck: SlideDeck = {
        id: 'existing-deck',
        title: 'Existing Deck',
        description: 'An existing slide deck',
        slides: [
          {
            id: 'slide-1',
            title: 'Original Slide',
            backgroundImage: 'original.jpg',
            elements: [],
            transitions: [],
            layout: { aspectRatio: '16:9', backgroundFit: 'contain' }
          } as InteractiveSlide
        ],
        metadata: {
          version: '2.0',
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z'
        }
      };

      const { runTransaction } = await import('firebase/firestore');
      const transaction = {
        get: vi.fn().mockResolvedValue({
          exists: () => true,
          data: () => ({ ...existingSlideDeck, createdBy: 'test-user' })
        }),
        update: vi.fn(),
      };
      (runTransaction as any).mockImplementation(async (firestore, updateFunction) => {
        await updateFunction(transaction);
      });

      const updatedDeck = {
        ...existingSlideDeck,
        title: 'Updated Deck Title',
        slides: [
          {
            ...existingSlideDeck.slides[0],
            title: 'Updated Slide Title'
          }
        ]
      };

      await firebaseAPI.saveSlideDeck('test-user', updatedDeck);

      expect(transaction.update).toHaveBeenCalled();
      const savedData = transaction.update.mock.calls[0][1];
      expect(savedData.slideDeck.title).toBe('Updated Deck Title');
      expect(savedData.slideDeck.slides[0].title).toBe('Updated Slide Title');
    });

    it('should preserve metadata timestamps on updates', async () => {
      const slideDeck: SlideDeck = {
        id: 'test-deck',
        title: 'Test Deck',
        description: 'Test',
        slides: [],
        metadata: {
          version: '2.0',
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z'
        }
      };

      const { runTransaction } = await import('firebase/firestore');
      const transaction = {
        get: vi.fn().mockResolvedValue({ exists: () => true, data: () => ({ createdBy: 'test-user' }) }),
        update: vi.fn(),
      };
      (runTransaction as any).mockImplementation(async (firestore, updateFunction) => {
        await updateFunction(transaction);
      });

      await firebaseAPI.saveSlideDeck('test-user', slideDeck);

      const savedData = transaction.update.mock.calls[0][1];
      expect(savedData.slideDeck.metadata.createdAt).toBeDefined();
      expect(savedData.updatedAt).toBeDefined();
      expect(savedData.slideDeck.metadata.version).toBe('2.0');
    });
  });

  describe('loadSlideDeck', () => {
    it('should load slide deck from Firebase', async () => {
      const mockSlideDeck: SlideDeck = {
        id: 'test-deck',
        title: 'Test Deck',
        description: 'Test deck',
        slides: [
          {
            id: 'slide-1',
            title: 'Test Slide',
            backgroundImage: 'test.jpg',
            elements: [],
            transitions: [],
            layout: { aspectRatio: '16:9', backgroundFit: 'contain' }
          } as InteractiveSlide
        ],
        metadata: {
          version: '2.0',
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z'
        }
      };

      const { getDoc } = await import('firebase/firestore');
      (getDoc as any).mockResolvedValue({
        exists: () => true,
        data: () => ({ ...mockSlideDeck, createdBy: 'test-user' }),
        id: 'test-deck'
      });

      const result = await firebaseAPI.loadSlideDeck('test-user', 'test-deck');

      expect(result).toBeDefined();
      expect(result?.title).toBe('Test Deck');
      expect(result?.slides).toHaveLength(1);
      expect(result?.metadata.version).toBe('2.0');
    });

    it('should handle missing slide deck gracefully', async () => {
      const { getDoc } = await import('firebase/firestore');
      (getDoc as any).mockResolvedValue({
        exists: () => false
      });

      const result = await firebaseAPI.loadSlideDeck('test-user', 'nonexistent-deck');
      expect(result).toBeNull();
    });
  });

  describe('slide element operations', () => {
    it('should handle slide element updates within transactions', async () => {
      const slideDeck: SlideDeck = {
        id: 'test-deck',
        title: 'Test Deck',
        description: 'Test',
        slides: [
          {
            id: 'slide-1',
            title: 'Test Slide',
            backgroundImage: 'test.jpg',
            elements: [
              {
                id: 'element-1',
                type: 'text',
                position: {
                  desktop: { x: 0, y: 0, width: 100, height: 50 },
                  tablet: { x: 0, y: 0, width: 80, height: 40 },
                  mobile: { x: 0, y: 0, width: 60, height: 30 }
                },
                style: { fontSize: 16 },
                content: { text: 'Original text' },
                interactions: []
              }
            ],
            transitions: [],
            layout: { aspectRatio: '16:9', backgroundFit: 'contain' }
          } as InteractiveSlide
        ],
        metadata: {
          version: '2.0',
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z'
        }
      };

      const { runTransaction } = await import('firebase/firestore');
      const transaction = {
        get: vi.fn().mockResolvedValue({
          exists: () => true,
          data: () => ({...slideDeck, createdBy: 'test-user' })
        }),
        update: vi.fn(),
      };
      (runTransaction as any).mockImplementation(async (firestore, updateFunction) => {
        await updateFunction(transaction);
      });

      // Update element content
      const updatedDeck = {
        ...slideDeck,
        slides: [
          {
            ...slideDeck.slides[0],
            elements: [
              {
                ...slideDeck.slides[0].elements[0],
                content: { text: 'Updated text' }
              }
            ]
          }
        ]
      };

      await firebaseAPI.saveSlideDeck('test-user', updatedDeck);

      const savedData = transaction.update.mock.calls[0][1];
      expect(savedData.slideDeck.slides[0].elements[0].content.text).toBe('Updated text');
    });

    it('should handle responsive positioning in elements', async () => {
      const slideDeck: SlideDeck = {
        id: 'test-deck',
        title: 'Test Deck',
        description: 'Test',
        slides: [
          {
            id: 'slide-1',
            title: 'Test Slide',
            backgroundImage: 'test.jpg',
            elements: [
              {
                id: 'element-1',
                type: 'hotspot',
                position: {
                  desktop: { x: 100, y: 100, width: 200, height: 150 },
                  tablet: { x: 80, y: 80, width: 160, height: 120 },
                  mobile: { x: 60, y: 60, width: 120, height: 90 }
                },
                style: { backgroundColor: '#ff0000' },
                content: { title: 'Responsive Hotspot' },
                interactions: []
              }
            ],
            transitions: [],
            layout: { aspectRatio: '16:9', backgroundFit: 'contain' }
          } as InteractiveSlide
        ],
        metadata: {
          version: '2.0',
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z'
        }
      };

      const { runTransaction } = await import('firebase/firestore');
      const transaction = {
        get: vi.fn().mockResolvedValue({ exists: () => true, data: () => ({ createdBy: 'test-user' }) }),
        update: vi.fn(),
      };
      (runTransaction as any).mockImplementation(async (firestore, updateFunction) => {
        await updateFunction(transaction);
      });

      await firebaseAPI.saveSlideDeck('test-user', slideDeck);

      const savedData = transaction.update.mock.calls[0][1];
      const element = savedData.slideDeck.slides[0].elements[0];
      
      // Verify responsive positioning is preserved
      expect(element.position.desktop).toEqual({ x: 100, y: 100, width: 200, height: 150 });
      expect(element.position.tablet).toEqual({ x: 80, y: 80, width: 160, height: 120 });
      expect(element.position.mobile).toEqual({ x: 60, y: 60, width: 120, height: 90 });
    });
  });

  describe('data migration and compatibility', () => {
    it('should handle slide deck versioning', async () => {
      const slideDeck: SlideDeck = {
        id: 'test-deck',
        title: 'Version Test Deck',
        description: 'Testing version handling',
        slides: [],
        metadata: {
          version: '2.0',
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z'
        }
      };

      const { runTransaction } = await import('firebase/firestore');
      const transaction = {
        get: vi.fn().mockResolvedValue({ exists: () => true, data: () => ({ createdBy: 'test-user' }) }),
        update: vi.fn(),
      };
      (runTransaction as any).mockImplementation(async (firestore, updateFunction) => {
        await updateFunction(transaction);
      });

      await firebaseAPI.saveSlideDeck('test-user', slideDeck);

      const savedData = transaction.update.mock.calls[0][1];
      expect(savedData.slideDeck.metadata.version).toBe('2.0');
    });

    it('should handle empty slide decks', async () => {
      const emptySlideDeck: SlideDeck = {
        id: 'empty-deck',
        title: 'Empty Deck',
        description: 'A deck with no slides',
        slides: [],
        metadata: {
          version: '2.0',
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z'
        }
      };

      const { runTransaction } = await import('firebase/firestore');
      const transaction = {
        get: vi.fn().mockResolvedValue({ exists: () => true, data: () => ({ createdBy: 'test-user' }) }),
        update: vi.fn(),
      };
      (runTransaction as any).mockImplementation(async (firestore, updateFunction) => {
        await updateFunction(transaction);
      });

      await firebaseAPI.saveSlideDeck('test-user', emptySlideDeck);

      const savedData = transaction.update.mock.calls[0][1];
      expect(savedData.slideDeck.slides).toEqual([]);
      expect(savedData.slideDeck.title).toBe('Empty Deck');
    });
  });
});