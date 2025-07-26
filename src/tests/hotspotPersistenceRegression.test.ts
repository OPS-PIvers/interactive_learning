import { describe, it, expect, vi, beforeEach } from 'vitest';
import { firebaseAPI } from '../lib/firebaseApi';
import { Project, HotspotData } from '../shared/types';

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
    getDocs: vi.fn(),
    collection: vi.fn((...args) => ({ path: args.join('/') })),
    query: vi.fn((colRef) => colRef),
    orderBy: vi.fn(),
    runTransaction: vi.fn(),
    serverTimestamp: vi.fn(() => 'SERVER_TIMESTAMP'),
  };
});

describe('Hotspot Persistence Regression Test', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should prevent hotspot disappearing issue by maintaining subcollection authority', async () => {
    const { runTransaction, setDoc, getDoc, getDocs } = await import('firebase/firestore');

    // Mock transaction for saveProject
    const mockTransaction = {
      get: vi.fn().mockResolvedValue({ 
        exists: () => true, 
        data: () => ({ createdBy: 'test-user' }) 
      }),
      set: vi.fn(),
    };
    (runTransaction as any).mockImplementation(async (firestore, updateFunction) => {
      await updateFunction(mockTransaction);
    });

    // Step 1: Create project with hotspots
    const project: Project = {
      id: 'test-project',
      title: 'Test Project', 
      description: 'Test',
      createdBy: 'test-user',
      createdAt: new Date(),
      updatedAt: new Date(),
      isPublished: false,
      projectType: 'hotspot',
      interactiveData: {
        backgroundImage: 'test.jpg',
        imageFitMode: 'contain',
        hotspots: [
          { id: 'h1', x: 25, y: 25, title: 'Test Hotspot', description: 'A test hotspot' } as HotspotData,
        ],
        timelineEvents: [],
      },
    };

    // Mock existing project
    (getDoc as any).mockResolvedValue({
      exists: () => true,
      data: () => ({ createdBy: 'test-user' }),
    });

    // Save project
    await firebaseAPI.saveProject(project);

    // Verify the main document has cleared hotspots (single source of truth)
    const mainDocumentCall = mockTransaction.set.mock.calls.find((call: any) => 
      call[0].path.includes('projects/test-project') && !call[0].path.includes('hotspots')
    );
    expect(mainDocumentCall).toBeDefined();
    expect(mainDocumentCall[1].interactiveData.hotspots).toEqual([]);
    expect(mainDocumentCall[1].interactiveData.timelineEvents).toEqual([]);

    // Step 2: Simulate theme update (what was causing the issue)
    (setDoc as any).mockClear();
    (getDoc as any).mockResolvedValue({
      exists: () => true,
      data: () => ({ createdBy: 'test-user' }),
    });

    // This should NOT affect hotspots since theme updates don't touch subcollections
    await firebaseAPI.updateProject('test-project', { theme: 'vibrant' });

    // Verify theme update only affects main document
    expect(setDoc).toHaveBeenCalledWith(
      expect.any(Object), // Mock path issue, focus on data
      expect.objectContaining({ 
        theme: 'vibrant',
        updatedAt: 'SERVER_TIMESTAMP'
      }),
      { merge: true }
    );

    // Step 3: Mock loading project details (subcollection wins)
    (getDocs as any).mockImplementation((colRef: any) => {
      if (colRef && colRef.path && colRef.path.includes('hotspots')) {
        return Promise.resolve({
          docs: [{
            id: 'h1',
            data: () => ({ id: 'h1', x: 25, y: 25, title: 'Test Hotspot', description: 'A test hotspot' }),
          }],
        });
      } else {
        return Promise.resolve({ docs: [] }); // timeline_events
      }
    });

    (getDoc as any).mockResolvedValue({
      exists: () => true,
      data: () => ({
        createdBy: 'test-user',
        theme: 'vibrant',
        interactiveData: {
          backgroundImage: 'test.jpg',
          imageFitMode: 'contain',
          hotspots: [], // This should be empty (cleared by our fix)
          timelineEvents: [],
        },
      }),
    });

    // Load project details and verify hotspots are preserved
    const details = await firebaseAPI.getProjectDetails('test-project');
    
    // Hotspots should come from subcollection, not from cleared interactiveData.hotspots
    expect(details.hotspots).toHaveLength(1);
    expect(details.hotspots[0]).toEqual({
      id: 'h1', 
      x: 25, 
      y: 25, 
      title: 'Test Hotspot', 
      description: 'A test hotspot',
      displayHotspotInEvent: false,
      size: 'medium'
    });
  });

  it('should clear hotspots/timelineEvents when interactiveData is updated via updateProject', async () => {
    const { setDoc, getDoc } = await import('firebase/firestore');

    (getDoc as any).mockResolvedValue({
      exists: () => true,
      data: () => ({ createdBy: 'test-user' }),
    });

    // Attempt to update with interactiveData containing hotspots (should be cleared)
    await firebaseAPI.updateProject('test-project', {
      interactiveData: {
        backgroundImage: 'new-image.jpg',
        hotspots: [{ id: 'bad-hotspot', x: 0, y: 0, title: 'Should not persist' }] as any,
        timelineEvents: [{ id: 'bad-event', step: 1 }] as any,
      }
    });

    // Verify the problematic arrays were cleared
    expect(setDoc).toHaveBeenCalledWith(
      expect.any(Object), // Mock path issue, focus on data
      expect.objectContaining({
        interactiveData: expect.objectContaining({
          backgroundImage: 'new-image.jpg',
          hotspots: [], // Should be cleared
          timelineEvents: [], // Should be cleared
        }),
        updatedAt: 'SERVER_TIMESTAMP'
      }),
      { merge: true }
    );
  });
});