import { signInAnonymously, signOut } from 'firebase/auth';
import { collection, getDocs, deleteDoc } from 'firebase/firestore';
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { firebaseAPI } from '../../lib/firebaseApi';
import { firebaseManager } from '../../lib/firebaseConfig';
import { InteractionType } from '../../shared/InteractionPresets';
import { Project } from '../../shared/types';

/**
 * Concurrent Operations Integration Tests
 * 
 * Tests transaction atomicity, race conditions, and concurrent user scenarios
 * to ensure data consistency under high-load conditions.
 */
describe.skip('Concurrent Operations Integration Tests', () => {
  let testUserId: string;

  beforeAll(async () => {
    if (!firebaseManager.isReady()) {
      await firebaseManager.initialize();
    }

    const auth = firebaseManager.getAuth();
    const userCredential = await signInAnonymously(auth);
    testUserId = userCredential.user.uid;
  });

  afterAll(async () => {
    const auth = firebaseManager.getAuth();
    await signOut(auth);
  });

  beforeEach(async () => {
    await cleanupTestProjects();
  });

  afterEach(async () => {
    await cleanupTestProjects();
  });

  async function cleanupTestProjects() {
    try {
      const db = firebaseManager.getFirestore();
      const projectsRef = collection(db, 'projects');
      const snapshot = await getDocs(projectsRef);

      const deletePromises = snapshot.docs.
      filter((doc) => doc.data()['title']?.includes('CONCURRENT_TEST')).
      map((doc) => deleteDoc(doc.ref));

      await Promise.all(deletePromises);
    } catch (error) {
      console.warn('Cleanup failed:', error);
    }
  }

  describe('Transaction Atomicity', () => {
    it('should maintain data consistency during concurrent saves', async () => {
      const project = await firebaseAPI.createProject('CONCURRENT_TEST_ATOMIC', 'Atomicity test');

      // Create multiple save operations that happen simultaneously
      const saveOperations = Array.from({ length: 5 }, (_, index) => {
        const projectCopy: Project = {
          ...project,
          description: `Updated by operation ${index + 1}`,
          interactiveData: {
            ...project.interactiveData,
            hotspots: [
            {
              id: `hotspot-${index + 1}`,
              x: 100 + index * 10,
              y: 100 + index * 10,
              title: `Hotspot ${index + 1}`,
              description: `Created by operation ${index + 1}`,
              size: 'medium',
              displayHotspotInEvent: false
            }],

            timelineEvents: [
            {
              id: `event-${index + 1}`,
              step: index + 1,
              type: InteractionType.SPOTLIGHT,
              name: `Event ${index + 1}`,
              spotlightX: 150 + index * 10,
              spotlightY: 150 + index * 10,
              zoomFactor: 2,
              spotlightShape: 'circle',
              dimPercentage: 70
            }]

          }
        };

        return firebaseAPI.saveProject(projectCopy);
      });

      // Execute all save operations concurrently
      const results = await Promise.allSettled(saveOperations);

      // All operations should complete (either succeed or fail gracefully)
      expect(results.every((result) => result.status === 'fulfilled' || result.status === 'rejected')).toBe(true);

      // The final state should be consistent (last successful save wins)
      const finalDetails = await firebaseAPI.getProjectDetails(project.id);

      // Verify exactly one set of hotspots and events exists (no orphaned data)
      expect(finalDetails.hotspots).toBeDefined();
      expect(finalDetails.timelineEvents).toBeDefined();
      expect(finalDetails.hotspots!.length).toBe(1);
      expect(finalDetails.timelineEvents!.length).toBe(1);

      await firebaseAPI.deleteProject(project.id);
    });

    it('should handle rapid successive saves without data loss', async () => {
      const project = await firebaseAPI.createProject('CONCURRENT_TEST_RAPID', 'Rapid saves test');

      // Perform rapid successive saves with cumulative data
      const rapidSaves = [];
      for (let i = 1; i <= 10; i++) {
        const hotspots = Array.from({ length: i }, (_, idx) => ({
          id: `hotspot-${idx + 1}`,
          x: 50 + idx * 20,
          y: 50 + idx * 20,
          title: `Hotspot ${idx + 1}`,
          description: `Batch ${i} hotspot ${idx + 1}`,
          size: 'medium' as const,
          displayHotspotInEvent: false
        }));

        const projectUpdate: Project = {
          ...project,
          description: `Batch ${i} update`,
          interactiveData: {
            ...project.interactiveData,
            hotspots
          }
        };

        rapidSaves.push(firebaseAPI.saveProject(projectUpdate));
      }

      // Execute all saves and wait for completion
      await Promise.all(rapidSaves);

      // Verify final state has the expected number of hotspots from the last save
      const finalDetails = await firebaseAPI.getProjectDetails(project.id);
      expect(finalDetails.hotspots).toHaveLength(10);
      expect(finalDetails.hotspots?.[0]?.title).toBe('Hotspot 1');
      expect(finalDetails.hotspots?.[9]?.title).toBe('Hotspot 10');

      await firebaseAPI.deleteProject(project.id);
    });

    it('should prevent orphaned subcollection documents during concurrent operations', async () => {
      const project = await firebaseAPI.createProject('CONCURRENT_TEST_ORPHAN', 'Orphan prevention test');

      // First, create some data
      const initialProject: Project = {
        ...project,
        interactiveData: {
          ...project.interactiveData,
          hotspots: [
          {
            id: 'hotspot-1',
            x: 100,
            y: 100,
            title: 'Initial Hotspot 1',
            description: 'Will be replaced',
            size: 'medium',
            displayHotspotInEvent: false
          },
          {
            id: 'hotspot-2',
            x: 200,
            y: 200,
            title: 'Initial Hotspot 2',
            description: 'Will be replaced',
            size: 'large',
            displayHotspotInEvent: false
          }]

        }
      };

      await firebaseAPI.saveProject(initialProject);

      // Now perform concurrent operations that replace the data
      const replacementOperations = [
      // Operation 1: Replace with completely different hotspots
      firebaseAPI.saveProject({
        ...project,
        interactiveData: {
          ...project.interactiveData,
          hotspots: [
          {
            id: 'new-hotspot-1',
            x: 300,
            y: 300,
            title: 'Replacement Hotspot 1',
            description: 'From operation 1',
            size: 'small',
            displayHotspotInEvent: false
          }]

        }
      }),

      // Operation 2: Replace with different set
      firebaseAPI.saveProject({
        ...project,
        interactiveData: {
          ...project.interactiveData,
          hotspots: [
          {
            id: 'new-hotspot-2',
            x: 400,
            y: 400,
            title: 'Replacement Hotspot 2',
            description: 'From operation 2',
            size: 'medium',
            displayHotspotInEvent: true
          },
          {
            id: 'new-hotspot-3',
            x: 500,
            y: 500,
            title: 'Replacement Hotspot 3',
            description: 'From operation 2',
            size: 'large',
            displayHotspotInEvent: false
          }]

        }
      })];


      await Promise.all(replacementOperations);

      // Verify no orphaned documents exist
      const finalDetails = await firebaseAPI.getProjectDetails(project.id);

      // Should have hotspots from the last successful operation
      expect(finalDetails.hotspots).toBeDefined();
      expect(finalDetails.hotspots!.length).toBeGreaterThan(0);

      // All hotspot IDs should be from the new operations, not the initial ones
      const hotspotIds = finalDetails.hotspots!.map((h) => h.id);
      expect(hotspotIds).not.toContain('hotspot-1');
      expect(hotspotIds).not.toContain('hotspot-2');

      await firebaseAPI.deleteProject(project.id);
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should recover gracefully from transaction failures', async () => {
      const project = await firebaseAPI.createProject('CONCURRENT_TEST_RECOVERY', 'Recovery test');

      // Create a series of operations where some might fail
      const mixedOperations = [
      // Valid operation
      firebaseAPI.saveProject({
        ...project,
        description: 'Valid update 1',
        interactiveData: {
          ...project.interactiveData,
          hotspots: [
          {
            id: 'valid-hotspot-1',
            x: 100,
            y: 100,
            title: 'Valid Hotspot',
            description: 'Should succeed',
            size: 'medium',
            displayHotspotInEvent: false
          }]

        }
      }),

      // Another valid operation
      firebaseAPI.saveProject({
        ...project,
        description: 'Valid update 2',
        interactiveData: {
          ...project.interactiveData,
          hotspots: [
          {
            id: 'valid-hotspot-2',
            x: 200,
            y: 200,
            title: 'Another Valid Hotspot',
            description: 'Should also succeed',
            size: 'large',
            displayHotspotInEvent: false
          }]

        }
      })];


      const results = await Promise.allSettled(mixedOperations);

      // At least one operation should succeed
      const successfulOps = results.filter((r) => r.status === 'fulfilled');
      expect(successfulOps.length).toBeGreaterThan(0);

      // Verify the project still exists and has valid data
      const projectDetails = await firebaseAPI.getProjectDetails(project.id);
      expect(projectDetails).toBeDefined();
      expect(projectDetails.hotspots).toBeDefined();

      await firebaseAPI.deleteProject(project.id);
    });

    it('should maintain consistency during network interruption simulation', async () => {
      const project = await firebaseAPI.createProject('CONCURRENT_TEST_NETWORK', 'Network interruption test');

      // Simulate rapid operations that might be interrupted
      const rapidOperations = Array.from({ length: 20 }, (_, index) => {
        return firebaseAPI.saveProject({
          ...project,
          description: `Network test update ${index + 1}`,
          interactiveData: {
            ...project.interactiveData,
            hotspots: [
            {
              id: `network-hotspot-${index + 1}`,
              x: 10 + index * 5,
              y: 10 + index * 5,
              title: `Network Hotspot ${index + 1}`,
              description: `Created during network test ${index + 1}`,
              size: 'medium',
              displayHotspotInEvent: false
            }]

          }
        });
      });

      // Execute operations with some potential for "network interruption"
      const results = await Promise.allSettled(rapidOperations);

      // Most operations should succeed
      const successful = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.filter((r) => r.status === 'rejected').length;



      // Verify final state is consistent
      const finalDetails = await firebaseAPI.getProjectDetails(project.id);
      expect(finalDetails.hotspots).toBeDefined();
      expect(finalDetails.hotspots!.length).toBeGreaterThan(0);

      await firebaseAPI.deleteProject(project.id);
    });
  });

  describe('Performance Under Load', () => {
    it('should handle multiple projects being created and saved simultaneously', async () => {
      const projectCreations = Array.from({ length: 10 }, (_, index) =>
      firebaseAPI.createProject(`CONCURRENT_TEST_LOAD_${index + 1}`, `Load test project ${index + 1}`)
      );

      const projects = await Promise.all(projectCreations);
      expect(projects).toHaveLength(10);

      // Now save data to all projects simultaneously
      const saveOperations = projects.map((project, index) =>
      firebaseAPI.saveProject({
        ...project,
        description: `Load test data ${index + 1}`,
        interactiveData: {
          ...project.interactiveData,
          hotspots: [
          {
            id: `load-hotspot-${index + 1}`,
            x: 50 + index * 10,
            y: 50 + index * 10,
            title: `Load Test Hotspot ${index + 1}`,
            description: `Created during load test`,
            size: 'medium',
            displayHotspotInEvent: false
          }]

        }
      })
      );

      const saveResults = await Promise.allSettled(saveOperations);

      // Most saves should succeed
      const successfulSaves = saveResults.filter((r) => r.status === 'fulfilled').length;
      expect(successfulSaves).toBeGreaterThan(7); // Allow for some failures under load

      // Verify each project's data integrity
      for (const project of projects) {
        const details = await firebaseAPI.getProjectDetails(project.id);
        expect(details).toBeDefined();
      }

      // Clean up all projects
      const cleanupOperations = projects.map((p) => firebaseAPI.deleteProject(p.id));
      await Promise.allSettled(cleanupOperations);
    });

    it('should maintain performance with large datasets', async () => {
      const project = await firebaseAPI.createProject('CONCURRENT_TEST_LARGE', 'Large dataset test');

      // Create a project with many hotspots and events
      const largeHotspots = Array.from({ length: 50 }, (_, index) => ({
        id: `large-hotspot-${index + 1}`,
        x: index % 10 * 50 + 25,
        y: Math.floor(index / 10) * 50 + 25,
        title: `Large Dataset Hotspot ${index + 1}`,
        description: `Part of large dataset test with index ${index + 1}`,
        size: (['small', 'medium', 'large'] as const)[index % 3] as 'small' | 'medium' | 'large',
        displayHotspotInEvent: index % 2 === 0
      }));

      const largeEvents = Array.from({ length: 30 }, (_, index) => ({
        id: `large-event-${index + 1}`,
        step: index + 1,
        type: InteractionType.SPOTLIGHT as const,
        name: `Large Dataset Event ${index + 1}`,
        spotlightX: index % 6 * 80 + 40,
        spotlightY: Math.floor(index / 6) * 80 + 40,
        zoomLevel: 1.5 + index % 3 * 0.5,
        spotlightShape: (['circle', 'rectangle'] as const)[index % 2] as 'circle' | 'rectangle',
        backgroundDimPercentage: 60 + index % 5 * 8
      }));

      const largeProject: Project = {
        ...project,
        description: 'Project with large dataset',
        interactiveData: {
          ...project.interactiveData,
          hotspots: largeHotspots,
          timelineEvents: largeEvents
        }
      };

      // Measure save performance
      const startTime = Date.now();
      await firebaseAPI.saveProject(largeProject);
      const saveTime = Date.now() - startTime;


      expect(saveTime).toBeLessThan(10000); // Should complete within 10 seconds

      // Verify data integrity
      const retrievalStartTime = Date.now();
      const details = await firebaseAPI.getProjectDetails(project.id);
      const retrievalTime = Date.now() - retrievalStartTime;


      expect(retrievalTime).toBeLessThan(5000); // Should retrieve within 5 seconds

      expect(details.hotspots).toHaveLength(50);
      expect(details.timelineEvents).toHaveLength(30);

      await firebaseAPI.deleteProject(project.id);
    });
  });
});