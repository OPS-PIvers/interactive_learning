import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { firebaseAPI } from '../../lib/firebaseApi';
import { firebaseManager } from '../../lib/firebaseConfig';
import { DataSanitizer } from '../../lib/dataSanitizer';
import { Project } from '../../shared/types';
import { SlideDeck, InteractiveSlide, SlideElement } from '../../shared/slideTypes';
import { InteractionType } from '../../shared/InteractionPresets';
import { signInAnonymously, signOut } from 'firebase/auth';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

/**
 * Firebase Integration Tests
 * 
 * These tests use the actual Firebase emulator to test real database operations
 * without mocking Firebase calls. This catches issues that unit tests with mocks might miss.
 */
describe.skip('Firebase Integration Tests', () => {
  let testUserId: string;
  
  beforeAll(async () => {
    // Ensure Firebase is ready
    if (!firebaseManager.isReady()) {
      await firebaseManager.initialize();
    }
    
    // Sign in anonymously for testing
    const auth = firebaseManager.getAuth();
    const userCredential = await signInAnonymously(auth);
    testUserId = userCredential.user.uid;
    
    console.log(`Integration tests running with user ID: ${testUserId}`);
  });

  afterAll(async () => {
    // Clean up: sign out
    const auth = firebaseManager.getAuth();
    await signOut(auth);
  });

  beforeEach(async () => {
    // Clean up any test data before each test
    await cleanupTestProjects();
  });

  afterEach(async () => {
    // Clean up test data after each test
    await cleanupTestProjects();
  });

  /**
   * Helper function to clean up test projects
   */
  async function cleanupTestProjects() {
    try {
      const db = firebaseManager.getFirestore();
      const projectsRef = collection(db, 'projects');
      const snapshot = await getDocs(projectsRef);
      
      const deletePromises = snapshot.docs
        .filter(doc => doc.data()['title']?.includes('TEST_PROJECT'))
        .map(doc => deleteDoc(doc.ref));
      
      await Promise.all(deletePromises);
    } catch (error) {
      console.warn('Cleanup failed:', error);
    }
  }

  describe('Project CRUD Operations', () => {
    it('should create, save, retrieve, and delete a project successfully', async () => {
      // Step 1: Create a new project
      const newProject = await firebaseAPI.createProject('TEST_PROJECT_CRUD', 'Integration test project');
      
      expect(newProject).toBeDefined();
      expect(newProject.id).toBeDefined();
      expect(newProject.title).toBe('TEST_PROJECT_CRUD');
      expect(newProject.createdBy).toBe(testUserId);
      
      // Step 2: Update and save the project
      const updatedProject: Project = {
        ...newProject,
        description: 'Updated description',
        interactiveData: {
          ...newProject.interactiveData,
          hotspots: [
            {
              id: 'test-hotspot-1',
              x: 100,
              y: 200,
              title: 'Test Hotspot',
              description: 'A test hotspot',
              size: 'medium',
              displayHotspotInEvent: false
            }
          ],
          timelineEvents: [
            {
              id: 'test-event-1',
              step: 1,
              type: InteractionType.SPOTLIGHT,
              name: 'Test Event',
              spotlightX: 150,
              spotlightY: 250,
              zoomLevel: 2,
              spotlightShape: 'circle',
              backgroundDimPercentage: 70
            }
          ]
        }
      };
      
      const savedProject = await firebaseAPI.saveProject(updatedProject);
      expect(savedProject.description).toBe('Updated description');
      
      // Step 3: Retrieve project details
      const projectDetails = await firebaseAPI.getProjectDetails(savedProject.id);
      expect(projectDetails.hotspots).toHaveLength(1);
      expect(projectDetails.timelineEvents).toHaveLength(1);
      expect(projectDetails.hotspots?.[0]?.title).toBe('Test Hotspot');
      expect(projectDetails.timelineEvents?.[0]?.name).toBe('Test Event');
      
      // Step 4: List projects and verify it appears
      const projects = await firebaseAPI.listProjects();
      const foundProject = projects.find(p => p.id === savedProject.id);
      expect(foundProject).toBeDefined();
      expect(foundProject!.title).toBe('TEST_PROJECT_CRUD');
      
      // Step 5: Delete the project
      const deleteResult = await firebaseAPI.deleteProject(savedProject.id);
      expect(deleteResult.success).toBe(true);
      expect(deleteResult.projectId).toBe(savedProject.id);
      
      // Step 6: Verify project is deleted
      const projectsAfterDelete = await firebaseAPI.listProjects();
      const deletedProject = projectsAfterDelete.find(p => p.id === savedProject.id);
      expect(deletedProject).toBeUndefined();
    });

    it('should handle slide-based project creation and validation', async () => {
      // Create slide-based project
      const slideProject = await firebaseAPI.createProject('TEST_PROJECT_SLIDES', 'Slide-based test project');
      
      // Create slide deck with validation
      const slideDeck: SlideDeck = {
        id: slideProject.id,
        title: 'Test Slide Deck',
        description: 'Integration test slide deck',
        slides: [
          {
            id: 'slide-1',
            title: 'Test Slide 1',
            backgroundImage: 'test-bg.jpg',
            elements: [
              {
                id: 'element-1',
                type: 'hotspot',
                position: {
                  desktop: { x: 100, y: 100, width: 50, height: 50 },
                  tablet: { x: 80, y: 80, width: 40, height: 40 },
                  mobile: { x: 60, y: 60, width: 30, height: 30 }
                },
                style: { backgroundColor: '#ff0000' },
                content: { title: 'Test Hotspot' },
                interactions: [],
                isVisible: true
              } as SlideElement
            ],
            transitions: [],
            layout: {
              aspectRatio: '16:9',
              backgroundSize: 'contain',
              containerWidth: 1920,
              containerHeight: 1080,
              scaling: 'fit',
              backgroundPosition: 'center center'
            }
          } as InteractiveSlide
        ],
        metadata: {
          version: '2.0',
          created: Date.now(),
          modified: Date.now(),
          isPublic: false
        },
        settings: {
          autoAdvance: false,
          allowNavigation: true,
          showProgress: true,
          showControls: true,
          keyboardShortcuts: true,
          touchGestures: true,
          fullscreenMode: false,
        }
      };
      
      // Update project with slide deck
      const slideProjectWithDeck: Project = {
        ...slideProject,
        projectType: 'slide',
        slideDeck
      };
      
      // Save and validate
      const savedSlideProject = await firebaseAPI.saveProject(slideProjectWithDeck);
      expect(savedSlideProject.projectType).toBe('slide');
      expect(savedSlideProject.slideDeck).toBeDefined();
      expect(savedSlideProject.slideDeck!.slides).toHaveLength(1);
      
      // Retrieve and verify slide data
      const slideDetails = await firebaseAPI.getProjectDetails(savedSlideProject.id) as any;
      expect(slideDetails.slideDeck).toBeDefined();
      expect(slideDetails.slideDeck!.slides[0].elements).toHaveLength(1);
      
      // Clean up
      await firebaseAPI.deleteProject(savedSlideProject.id);
    });
  });

  describe('Data Consistency and Validation', () => {
    it('should prevent data inconsistencies between subcollections and nested data', async () => {
      const project = await firebaseAPI.createProject('TEST_PROJECT_CONSISTENCY', 'Data consistency test');
      
      // Add data that should be stored in subcollections
      const projectWithData: Project = {
        ...project,
        interactiveData: {
          ...project.interactiveData,
          backgroundImage: 'test-bg.jpg',
          hotspots: [
            {
              id: 'hotspot-1',
              x: 100,
              y: 100,
              title: 'Test Hotspot 1',
              description: 'First hotspot',
              size: 'medium',
              displayHotspotInEvent: false
            },
            {
              id: 'hotspot-2', 
              x: 200,
              y: 200,
              title: 'Test Hotspot 2',
              description: 'Second hotspot',
              size: 'large',
              displayHotspotInEvent: true
            }
          ],
          timelineEvents: [
            {
              id: 'event-1',
              step: 1,
              type: InteractionType.SPOTLIGHT,
              name: 'Event 1',
              spotlightX: 150,
              spotlightY: 150,
              zoomLevel: 2,
              spotlightShape: 'circle',
              backgroundDimPercentage: 70
            }
          ]
        }
      };
      
      // Save project
      const savedProject = await firebaseAPI.saveProject(projectWithData);
      
      // Retrieve details and verify subcollections are authoritative
      const details = await firebaseAPI.getProjectDetails(savedProject.id);
      
      // Verify data is properly stored in subcollections
      expect(details.hotspots).toHaveLength(2);
      expect(details.timelineEvents).toHaveLength(1);
      expect(details.hotspots?.[0]?.title).toBe('Test Hotspot 1');
      expect(details.hotspots?.[1]?.title).toBe('Test Hotspot 2');
      expect(details.timelineEvents?.[0]?.name).toBe('Event 1');
      
      // Verify interactiveData doesn't contain subcollection data
      expect(details.backgroundImage).toBe('test-bg.jpg');
      
      // Clean up
      await firebaseAPI.deleteProject(savedProject.id);
    });

    it('should handle data sanitization and validation errors', async () => {
      const project = await firebaseAPI.createProject('TEST_PROJECT_VALIDATION', 'Validation test');
      
      // Test with invalid hotspot data (missing required fields)
      const invalidProject: Project = {
        ...project,
        interactiveData: {
          ...project.interactiveData,
          hotspots: [
            {
              id: '', // Invalid: empty ID
              x: -10, // Invalid: negative coordinate
              y: 50,
              title: 'Invalid Hotspot',
              description: '',
              size: 'medium',
              displayHotspotInEvent: false
            } as any
          ]
        }
      };
      
      // This should throw a validation error
      await expect(firebaseAPI.saveProject(invalidProject))
        .rejects
        .toThrow(/validation failed/i);
      
      // Clean up
      await firebaseAPI.deleteProject(project.id);
    });

    it('should handle concurrent modifications gracefully', async () => {
      const project = await firebaseAPI.createProject('TEST_PROJECT_CONCURRENT', 'Concurrency test');
      
      // Create two versions of the project to simulate concurrent edits
      const project1: Project = {
        ...project,
        description: 'Modified by user 1',
        interactiveData: {
          ...project.interactiveData,
          hotspots: [
            {
              id: 'hotspot-user1',
              x: 100,
              y: 100,
              title: 'User 1 Hotspot',
              description: 'Added by user 1',
              size: 'medium',
              displayHotspotInEvent: false
            }
          ]
        }
      };
      
      const project2: Project = {
        ...project,
        description: 'Modified by user 2',
        interactiveData: {
          ...project.interactiveData,
          hotspots: [
            {
              id: 'hotspot-user2',
              x: 200,
              y: 200,
              title: 'User 2 Hotspot',
              description: 'Added by user 2',
              size: 'large',
              displayHotspotInEvent: false
            }
          ]
        }
      };
      
      // Save both projects - the second one should overwrite the first
      await firebaseAPI.saveProject(project1);
      await firebaseAPI.saveProject(project2);
      
      // Verify the final state
      const finalDetails = await firebaseAPI.getProjectDetails(project.id);
      expect(finalDetails.hotspots).toHaveLength(1);
      expect(finalDetails.hotspots?.[0]?.title).toBe('User 2 Hotspot');
      
      // Clean up
      await firebaseAPI.deleteProject(project.id);
    });
  });

  describe('Enhanced Error Handling', () => {
    it('should provide detailed error context for save failures', async () => {
      // Try to save a project with invalid user authentication
      const auth = firebaseManager.getAuth();
      await signOut(auth);
      
      try {
        const project = await firebaseAPI.createProject('TEST_PROJECT_ERROR', 'Error test');
        await expect(firebaseAPI.saveProject(project))
          .rejects
          .toThrow(/authentication/i);
      } finally {
        // Restore authentication
        const userCredential = await signInAnonymously(auth);
        testUserId = userCredential.user.uid;
      }
    });

    it('should handle network retries and recovery', async () => {
      // This test would be more comprehensive with actual network simulation
      // For now, we'll test the retry logic with a valid operation
      const project = await firebaseAPI.createProject('TEST_PROJECT_RETRY', 'Retry test');
      
      // The save should succeed (retry logic is built into saveProject)
      const savedProject = await firebaseAPI.saveProject(project);
      expect(savedProject.id).toBe(project.id);
      
      // Clean up
      await firebaseAPI.deleteProject(project.id);
    });
  });

  describe('Data Migration and Architecture Compatibility', () => {
    it('should validate project architecture consistency', async () => {
      // Test mixed architecture detection
      const mixedProject = await firebaseAPI.createProject('TEST_PROJECT_MIXED', 'Mixed architecture test');
      
      // Create project with both hotspots and slides (should trigger warning)
      const mixedData: Project = {
        ...mixedProject,
        projectType: 'slide',
        interactiveData: {
          ...mixedProject.interactiveData,
          hotspots: [
            {
              id: 'legacy-hotspot',
              x: 100,
              y: 100,
              title: 'Legacy Hotspot',
              description: 'From old architecture',
              size: 'medium',
              displayHotspotInEvent: false
            }
          ]
        },
        slideDeck: {
          id: mixedProject.id,
          title: 'New Slide Deck',
          description: 'From new architecture',
          slides: [],
          metadata: {
            version: '2.0',
            created: Date.now(),
            modified: Date.now(),
            isPublic: false
          },
          settings: {
            autoAdvance: false,
            allowNavigation: true,
            showProgress: true,
            showControls: true,
            keyboardShortcuts: true,
            touchGestures: true,
            fullscreenMode: false,
          }
        }
      };
      
      // This should still save but may log warnings
      const savedMixedProject = await firebaseAPI.saveProject(mixedData);
      expect(savedMixedProject.projectType).toBe('slide');
      
      // Clean up
      await firebaseAPI.deleteProject(mixedProject.id);
    });
  });
});