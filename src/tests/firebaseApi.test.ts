import { FirebaseProjectAPI } from '../lib/firebaseApi';
import { auth, db } from '../lib/firebaseConfig';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { Project } from '../shared/types';

vi.mock('../lib/firebaseConfig', () => ({
  auth: {
    currentUser: {
      uid: 'test-user'
    }
  },
  db: {}
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  getDocs: vi.fn(),
  getDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  serverTimestamp: vi.fn(),
  runTransaction: vi.fn(),
  Timestamp: {
    now: vi.fn()
  }
}));

describe('FirebaseProjectAPI', () => {
  let firebaseApi: FirebaseProjectAPI;

  beforeEach(() => {
    firebaseApi = new FirebaseProjectAPI();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('listProjects', () => {
    it('should fetch projects with hotspots and timelineEvents', async () => {
      const mockProjectData = {
        title: 'Test Project',
        description: 'Test Description',
        createdBy: 'test-user',
        createdAt: { toDate: () => new Date() },
        updatedAt: { toDate: () => new Date() },
        thumbnailUrl: 'test-url',
        backgroundImage: 'test-image',
        imageFitMode: 'cover',
        viewerModes: { explore: true, selfPaced: true, timed: true },
        hotspots: [{ id: '1', x: 0, y: 0, title: 'Hotspot 1' }],
        timelineEvents: [{ id: '1', step: 1, name: 'Event 1' }]
      };

      (getDocs as jest.Mock).mockResolvedValue({
        docs: [{ id: '1', data: () => mockProjectData }]
      });

      const projects = await firebaseApi.listProjects();

      expect(projects).toHaveLength(1);
      expect(projects[0].interactiveData.hotspots).toEqual(mockProjectData.hotspots);
      expect(projects[0].interactiveData.timelineEvents).toEqual(mockProjectData.timelineEvents);
    });
  });
});
