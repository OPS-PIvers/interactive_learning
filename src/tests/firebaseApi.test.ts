import { Firestore, Transaction } from 'firebase/firestore';
import { describe, it, expect, vi } from 'vitest';
import * as firebaseApi from '../lib/firebaseApi';
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
    updateDoc: vi.fn(),
    runTransaction: vi.fn(async (firestore: Firestore, updateFunction: (transaction: Transaction) => Promise<any>) => {
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
                content: { textContent: 'Hotspot' },
                style: { backgroundColor: 'transparent' },
                interactions: [],
                isVisible: true
              }
            ],
          }
        ],
        metadata: {
          version: '2.0',
          created: Date.now(),
          modified: Date.now(),
          isPublic: false
        },
        settings: {
          allowNavigation: true,
          showControls: true,
        }
      };

      const { getDoc, updateDoc } = await import('firebase/firestore');
      (getDoc as any).mockResolvedValue({
        exists: () => true,
        data: () => ({ createdBy: 'test-user' }),
      });

      await firebaseApi.saveSlideDeck('test-user', slideDeck);

      expect(updateDoc).toHaveBeenCalled();
      const savedData = (updateDoc as any).mock.calls[0]?.[1];

      // Verify slide deck structure
      expect(savedData?.slideDeck.title).toBe('Test Slide Deck');
      expect(savedData?.slideDeck.description).toBe('A test slide deck for Firebase testing');
      expect(savedData?.slideDeck.slides).toBeDefined();
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
            backgroundMedia: { type: 'image', url: 'original.jpg' },
            elements: [],
          }
        ],
        metadata: {
          version: '2.0',
          created: 1672531200000,
          modified: 1672531200000,
          isPublic: false
        },
        settings: {
          allowNavigation: true,
          showControls: true,
        }
      };

      const { getDoc, updateDoc } = await import('firebase/firestore');
      (getDoc as any).mockResolvedValue({
        exists: () => true,
        data: () => ({ ...existingSlideDeck, createdBy: 'test-user' }),
      });

      const updatedDeck: SlideDeck = {
        ...existingSlideDeck,
        title: 'Updated Deck Title',
        slides: [
          {
            ...(existingSlideDeck.slides[0] as InteractiveSlide),
            id: 'slide-1',
            title: 'Updated Slide Title',
            elements: [],
          }
        ]
      };

      await firebaseApi.saveSlideDeck('test-user', updatedDeck);

      expect(updateDoc).toHaveBeenCalled();
      const savedData = (updateDoc as any).mock.calls[0]?.[1];
      expect(savedData?.slideDeck.title).toBe('Updated Deck Title');
      expect(savedData?.slideDeck.slides[0].title).toBe('Updated Slide Title');
    });

    it('should preserve metadata timestamps on updates', async () => {
      const slideDeck: SlideDeck = {
        id: 'test-deck',
        title: 'Test Deck',
        description: 'Test',
        slides: [],
        metadata: {
          version: '2.0',
          created: 1672531200000,
          modified: 1672531200000,
          isPublic: false
        },
        settings: {
          allowNavigation: true,
          showControls: true,
        }
      };

      const { getDoc, updateDoc } = await import('firebase/firestore');
      (getDoc as any).mockResolvedValue({
        exists: () => true,
        data: () => ({ createdBy: 'test-user' }),
      });

      await firebaseApi.saveSlideDeck('test-user', slideDeck);

      const savedData = (updateDoc as any).mock.calls[0]?.[1];
      expect(savedData?.slideDeck.metadata.created).toBeDefined();
      expect(savedData?.updatedAt).toBeDefined();
      expect(savedData?.slideDeck.metadata.version).toBe('2.0');
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
            backgroundMedia: { type: 'image', url: 'test.jpg' },
            elements: [],
          }
        ],
        metadata: {
          version: '2.0',
          created: 1672531200000,
          modified: 1672531200000,
          isPublic: false
        },
        settings: {
          allowNavigation: true,
          showControls: true,
        }
      };

      const { getDoc } = await import('firebase/firestore');
      (getDoc as any).mockResolvedValue({
        exists: () => true,
        data: () => ({ slideDeck: mockSlideDeck, createdBy: 'test-user' }),
        id: 'test-deck'
      });

      const result = await firebaseApi.loadSlideDeck('test-user', 'test-deck');

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

      const result = await firebaseApi.loadSlideDeck('test-user', 'nonexistent-deck');
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
            backgroundMedia: { type: 'image', url: 'test.jpg' },
            elements: [
              {
                id: 'element-1',
                type: 'text',
                position: {
                  desktop: { x: 0, y: 0, width: 100, height: 50 },
                  tablet: { x: 0, y: 0, width: 80, height: 40 },
                  mobile: { x: 0, y: 0, width: 60, height: 30 }
                },
                style: { },
                content: { textContent: 'Original text' },
                interactions: [],
                isVisible: true
              }
            ],
          }
        ],
        metadata: {
          version: '2.0',
          created: 1672531200000,
          modified: 1672531200000,
          isPublic: false
        },
        settings: {
          allowNavigation: true,
          showControls: true,
        }
      };

      const { getDoc, updateDoc } = await import('firebase/firestore');
      (getDoc as any).mockResolvedValue({
        exists: () => true,
        data: () => ({...slideDeck, createdBy: 'test-user' }),
      });

      // Update element content
      const updatedDeck: SlideDeck = {
        ...slideDeck,
        slides: [
          {
            ...(slideDeck.slides[0] as InteractiveSlide),
            id: 'slide-1',
            elements: [
              {
                ...(slideDeck.slides[0] as InteractiveSlide).elements[0],
                id: 'element-1',
                type: 'text',
                position: (slideDeck.slides[0] as InteractiveSlide).elements[0]!.position,
                content: { textContent: 'Updated text' },
                interactions: [],
                style: {},
                isVisible: true,
              },
            ],
          },
        ],
      };

      await firebaseApi.saveSlideDeck('test-user', updatedDeck);

      const savedData = (updateDoc as any).mock.calls[0]?.[1];
      expect(savedData!.slideDeck.slides[0]!.elements[0]!.content!.textContent).toBe('Updated text');
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
            backgroundMedia: { type: 'image', url: 'test.jpg' },
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
                interactions: [],
                isVisible: true
              }
            ],
          }
        ],
        metadata: {
          version: '2.0',
          created: 1672531200000,
          modified: 1672531200000,
          isPublic: false
        },
        settings: {
          allowNavigation: true,
          showControls: true,
        }
      };

      const { getDoc, updateDoc } = await import('firebase/firestore');
      (getDoc as any).mockResolvedValue({
        exists: () => true,
        data: () => ({ createdBy: 'test-user' }),
      });

      await firebaseApi.saveSlideDeck('test-user', slideDeck);

      const savedData = (updateDoc as any).mock.calls[0]?.[1];
      const element = savedData?.slideDeck.slides[0].elements[0];
      
      // Verify responsive positioning is preserved
      expect(element?.position.desktop).toEqual({ x: 100, y: 100, width: 200, height: 150 });
      expect(element?.position.tablet).toEqual({ x: 80, y: 80, width: 160, height: 120 });
      expect(element?.position.mobile).toEqual({ x: 60, y: 60, width: 120, height: 90 });
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
          created: 1672531200000,
          modified: 1672531200000,
          isPublic: false
        },
        settings: {
          allowNavigation: true,
          showControls: true,
        }
      };

      const { runTransaction } = await import('firebase/firestore');
      const transaction = {
        get: vi.fn().mockResolvedValue({ exists: () => true, data: () => ({ createdBy: 'test-user' }) }),
        update: vi.fn(),
        set: vi.fn(),
        delete: vi.fn(),
      };
      (runTransaction as any).mockImplementation(async (firestore: Firestore, updateFunction: (transaction: Transaction) => Promise<any>) => {
        await updateFunction(transaction);
      });

      await firebaseApi.saveSlideDeck('test-user', slideDeck);

      const savedData = transaction.update.mock.calls[0]?.[1];
      expect(savedData?.slideDeck.metadata.version).toBe('2.0');
    });

    it('should handle empty slide decks', async () => {
      const emptySlideDeck: SlideDeck = {
        id: 'empty-deck',
        title: 'Empty Deck',
        description: 'A deck with no slides',
        slides: [],
        metadata: {
          version: '2.0',
          created: 1672531200000,
          modified: 1672531200000,
          isPublic: false
        },
        settings: {
          allowNavigation: true,
          showControls: true,
        }
      };

      const { runTransaction } = await import('firebase/firestore');
      const transaction = {
        get: vi.fn().mockResolvedValue({ exists: () => true, data: () => ({ createdBy: 'test-user' }) }),
        update: vi.fn(),
        set: vi.fn(),
        delete: vi.fn(),
      };
      (runTransaction as any).mockImplementation(async (firestore: Firestore, updateFunction: (transaction: Transaction) => Promise<any>) => {
        await updateFunction(transaction);
      });

      await firebaseApi.saveSlideDeck('test-user', emptySlideDeck);

      const savedData = transaction.update.mock.calls[0]?.[1];
      expect(savedData?.slideDeck.slides).toEqual([]);
      expect(savedData?.slideDeck.title).toBe('Empty Deck');
    });
  });
});