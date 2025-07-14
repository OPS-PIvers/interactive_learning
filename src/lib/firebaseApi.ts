import { 
  collection, 
  doc, 
  getDocs,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  // writeBatch, // No longer using batch directly in saveProject
  serverTimestamp,
  where,
  getDoc,
  runTransaction // Import runTransaction
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { auth, db, storage } from './firebaseConfig'
import { Project, HotspotData, TimelineEventData, InteractiveModuleState } from '../shared/types'
import { DataSanitizer } from './dataSanitizer'
import { generateThumbnail } from '../client/utils/imageUtils' // Import the new utility

// Thumbnail Parameters
const THUMBNAIL_WIDTH = 400;
const THUMBNAIL_HEIGHT = 250;
const THUMBNAIL_FORMAT = 'image/jpeg';
const THUMBNAIL_QUALITY = 0.7;
const THUMBNAIL_POSTFIX = '_thumbnails'; // Used for storage path organization
const THUMBNAIL_FILE_PREFIX = 'thumb_'; // Used for filename

// Simple cache to reduce Firebase reads
const projectCache = new Map<string, { data: any, timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export class FirebaseProjectAPI {
  private logUsage(operation: string, count: number = 1) {
    console.log(`Firebase ${operation}: ${count} operations`)
  }

  /**
   * List all projects with their hotspots and timeline events
   */
  async listProjects(): Promise<Project[]> {
    // Check cache first
    const cacheKey = 'all_projects'
    const cached = projectCache.get(cacheKey)
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('Using cached projects data (summary)')
      return cached.data
    }

    try {
      this.logUsage('READ_OPERATIONS', 1) // For projects collection
      const projectsRef = collection(db, 'projects')
      const snapshot = await getDocs(query(projectsRef, orderBy('updatedAt', 'desc')))
      
      const projects: Project[] = snapshot.docs.map((docSnap) => {
        const projectData = docSnap.data()
        return {
          id: docSnap.id,
          title: projectData.title || 'Untitled Project',
          description: projectData.description || '',
          thumbnailUrl: projectData.thumbnailUrl,
          // interactiveData will be loaded on demand.
          // Initialize with what's available at the project document level.
          interactiveData: {
            backgroundImage: projectData.backgroundImage, // This is stored at the project level
            imageFitMode: projectData.imageFitMode || 'cover', // Also at project level
            viewerModes: projectData.viewerModes || { explore: true, selfPaced: true, timed: true }, // Added viewerModes
            // hotspots and timelineEvents are intentionally left undefined here
          }
        } as Project // Asserting as Project, knowing interactiveData is partial
      })
      
      // Cache the results (summary data)
      projectCache.set(cacheKey, { data: projects, timestamp: Date.now() })
      
      return projects
    } catch (error) {
      console.error('Error listing projects (summary):', error)
      throw new Error(`Failed to load project summaries: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get detailed interactive data (hotspots, timeline events) for a single project.
   * Also fetches backgroundImage and imageFitMode again to ensure consistency, though they might be available from summary.
   */
  async getProjectDetails(projectId: string): Promise<Partial<InteractiveModuleState>> {
    try {
      this.logUsage('READ_OPERATIONS_DETAILS', 1); // For project document read
      const projectDocRef = doc(db, 'projects', projectId);
      const projectDocSnap = await getDoc(projectDocRef);

      if (!projectDocSnap.exists()) {
        throw new Error(`Project with ID ${projectId} not found.`);
      }
      const projectData = projectDocSnap.data();

      // Get hotspots and timeline events in parallel
      // These count as additional reads.
      const [hotspots, timelineEvents] = await Promise.all([
        this.getHotspots(projectId), // Counts as 1 read operation (collection query)
        this.getTimelineEvents(projectId) // Counts as 1 read operation (collection query)
      ]);
      this.logUsage('READ_OPERATIONS_DETAILS_SUBCOLLECTIONS', 2);


      return {
        backgroundImage: projectData.backgroundImage,
        imageFitMode: projectData.imageFitMode || 'cover',
        viewerModes: projectData.viewerModes || { explore: true, selfPaced: true, timed: true }, // Added viewerModes
        hotspots,
        timelineEvents,
      };
    } catch (error) {
      console.error(`Error getting project details for ${projectId}:`, error);
      throw new Error(`Failed to load project details: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }


  /**
   * Create a new project
   */
  async createProject(title: string, description: string): Promise<Project> {
    try {
      if (!auth.currentUser) {
        throw new Error('User must be authenticated to create projects');
      }

      const projectId = `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
      
      // Newly created project will have empty hotspots and timelineEvents by default.
      // The full interactiveData structure is provided here.
      const newProject: Project = {
        id: projectId,
        title: title,
        description: description,
        createdBy: auth.currentUser.uid, // Add user ID
        createdAt: new Date(),
        updatedAt: new Date(),
        interactiveData: { // This is complete for a new project
          backgroundImage: undefined,
          hotspots: [], // Empty for new project
          timelineEvents: [], // Empty for new project
          imageFitMode: 'cover',
          viewerModes: { explore: true, selfPaced: true, timed: true } // Added viewerModes with defaults
        }
      }
      
      // Save to Firestore
      const projectRef = doc(db, 'projects', projectId)
      await setDoc(projectRef, {
        title: newProject.title,
        description: newProject.description,
        createdBy: newProject.createdBy,
        thumbnailUrl: null,
        backgroundImage: null,
        imageFitMode: 'cover',
        viewerModes: { explore: true, selfPaced: true, timed: true }, // Added viewerModes with defaults
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      
      return newProject
    } catch (error) {
      console.error('Error creating project:', error)
      throw new Error(`Failed to create project: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Save/update a project with all its data
   */
  async saveProject(project: Project): Promise<Project> {
    try {
      if (!auth.currentUser) {
        throw new Error('User must be authenticated to save projects');
      }

      // For existing projects, verify ownership
      if (project.id !== 'temp') {
        const projectRef = doc(db, 'projects', project.id);
        const projectSnap = await getDoc(projectRef);

        if (projectSnap.exists()) {
          const projectData = projectSnap.data();
          if (projectData.createdBy !== auth.currentUser.uid) {
            throw new Error('You do not have permission to modify this project');
          }
        } else {
          // A project with an ID that is not 'temp' should already exist for a save operation.
          throw new Error('Project not found. Cannot update a non-existent project.');
        }
      }

      // If new project, set createdBy
      if (project.id === 'temp') {
        project.id = `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        project.createdBy = auth.currentUser.uid;
      }

      projectCache.clear();
      const projectRef = doc(db, 'projects', project.id);

      // --- Thumbnail logic (pre-transaction) ---
      const initialDocSnap = await getDoc(projectRef);
      const existingData = initialDocSnap.data();
      const existingBackgroundImage = existingData?.backgroundImage;
      const existingThumbnailUrl = existingData?.thumbnailUrl;

      let finalThumbnailUrl: string | null = existingThumbnailUrl || null;
      let newBackgroundImageForUpdate: string | null | undefined = project.interactiveData.backgroundImage;
      let oldThumbnailUrlToDeleteAfterCommit: string | null = null;

      if (newBackgroundImageForUpdate && newBackgroundImageForUpdate !== existingBackgroundImage) {
        if (existingThumbnailUrl) {
          oldThumbnailUrlToDeleteAfterCommit = existingThumbnailUrl;
        }
        try {
          console.log(`Generating thumbnail for project ${project.id} due to image change.`);
          const thumbnailBlob = await generateThumbnail(
            newBackgroundImageForUpdate, THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT, THUMBNAIL_FORMAT, THUMBNAIL_QUALITY
          );
          const mimeTypeToExtension: Record<string, string> = {
            'image/jpeg': 'jpg',
            'image/webp': 'webp',
            'image/png': 'png' // Added png for completeness, though not currently in THUMBNAIL_FORMAT type
          };
          const fileExtension = mimeTypeToExtension[THUMBNAIL_FORMAT] || THUMBNAIL_FORMAT.split('/')[1]?.replace('jpeg','jpg') || 'dat';
          const thumbnailFile = new File(
            [thumbnailBlob], `${THUMBNAIL_FILE_PREFIX}${project.id}.${fileExtension}`, { type: THUMBNAIL_FORMAT }
          );
          finalThumbnailUrl = await this.uploadImage(thumbnailFile, project.id + THUMBNAIL_POSTFIX);
          console.log(`New thumbnail generated and uploaded: ${finalThumbnailUrl}`);
        } catch (thumbError) {
          console.error(`Failed to generate/upload new thumbnail for ${project.id}:`, thumbError);
          finalThumbnailUrl = existingThumbnailUrl || null;
          newBackgroundImageForUpdate = existingBackgroundImage || null;
          oldThumbnailUrlToDeleteAfterCommit = null;
        }
      } else if (!newBackgroundImageForUpdate && existingBackgroundImage) {
        if (existingThumbnailUrl) {
          oldThumbnailUrlToDeleteAfterCommit = existingThumbnailUrl;
        }
        finalThumbnailUrl = null;
      }
      // --- End of Thumbnail logic ---

      await runTransaction(db, async (transaction) => {
        this.logUsage('TRANSACTION_SAVE_PROJECT', 1);

        // Although decisions on URLs are made outside, it's good practice to get the latest version
        // of the document if other fields were to be updated based on transactional read.
        // For this specific logic, we primarily use pre-calculated URLs.
        // const transactionalExistingDocSnap = await transaction.get(projectRef);
        // const currentProjectData = transactionalExistingDocSnap.data();

        transaction.set(projectRef, {
          title: project.title,
          description: project.description,
          thumbnailUrl: finalThumbnailUrl,
          backgroundImage: newBackgroundImageForUpdate || null,
          imageFitMode: project.interactiveData.imageFitMode || 'cover',
          viewerModes: project.interactiveData.viewerModes || { explore: true, selfPaced: true, timed: true }, // Added viewerModes
          updatedAt: serverTimestamp()
        }, { merge: true });

        const sanitizedHotspots = DataSanitizer.sanitizeHotspots(project.interactiveData.hotspots);
        const sanitizedEvents = DataSanitizer.sanitizeTimelineEvents(project.interactiveData.timelineEvents);

        const hotspotsColRef = collection(db, 'projects', project.id, 'hotspots');
        const eventsColRef = collection(db, 'projects', project.id, 'timeline_events');

        // For atomicity in subcollections, ideally, reads (like getDocs) should also be transactional
        // if the write logic depends on them. Firestore transactions have limits on operations.
        // A common pattern for full replacement is to delete all then add all.
        // This means querying for existing docs *outside* the transaction (as getDocs on a query isn't a transaction.get)
        // and then using their refs for deletion *inside* the transaction.
        // This has a small risk if items are added/removed between the getDocs and the transaction start.

        const [existingHotspotsSnap, existingEventsSnap] = await Promise.all([
            getDocs(query(hotspotsColRef)),
            getDocs(query(eventsColRef))
        ]);

        existingHotspotsSnap.docs.forEach(docSnap => transaction.delete(docSnap.ref));
        existingEventsSnap.docs.forEach(docSnap => transaction.delete(docSnap.ref));

        for (const hotspot of sanitizedHotspots) {
          const hotspotRef = doc(hotspotsColRef, hotspot.id!);
          transaction.set(hotspotRef, { ...hotspot, updatedAt: serverTimestamp() });
        }

        for (const event of sanitizedEvents) {
          const eventRef = doc(eventsColRef, event.id!);
          transaction.set(eventRef, { ...event, updatedAt: serverTimestamp() });
        }
      });

      console.log(`Transaction for project ${project.id} committed successfully.`);

      if (oldThumbnailUrlToDeleteAfterCommit) {
        console.log(`Attempting to delete old thumbnail (fire-and-forget): ${oldThumbnailUrlToDeleteAfterCommit}`);
        this._deleteImageFromStorage(oldThumbnailUrlToDeleteAfterCommit).catch(err => {
          console.error("Error during fire-and-forget deletion of old thumbnail:", err);
        });
      }
      
      return {
        ...project,
        thumbnailUrl: finalThumbnailUrl,
        interactiveData: {
          ...project.interactiveData,
          backgroundImage: newBackgroundImageForUpdate || undefined
        }
      };
    } catch (error) {
      console.error('Error in saveProject (transaction or post-transaction storage deletion):', error);
      throw new Error(`Failed to save project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a project and all its data
   */
  async deleteProject(projectId: string): Promise<{ success: boolean; projectId: string }> {
    const projectRef = doc(db, 'projects', projectId);
    let thumbnailUrlToDelete: string | null = null;

    try {
      // Fetch project data to get thumbnail URL *before* the transaction,
      // as the document will be gone after the transaction.
      const projectSnap = await getDoc(projectRef);
      if (projectSnap.exists()) {
        thumbnailUrlToDelete = projectSnap.data()?.thumbnailUrl || null;
      }

      await runTransaction(db, async (transaction) => {
        this.logUsage('TRANSACTION_DELETE_PROJECT', 1);

        // Optional: Re-read project document with transaction.get(projectRef) to ensure it still exists
        // if there's a concern it might be deleted by another process between the getDoc above and here.
        // For this operation, if it's already gone, our work for the main doc is done.
        const freshProjectSnap = await transaction.get(projectRef); // Good practice to confirm existence within transaction
        if (!freshProjectSnap.exists()) {
          console.warn(`Project ${projectId} not found during delete transaction (already deleted?).`);
          return; // Nothing to delete
        }

        const hotspotsColRef = collection(db, 'projects', projectId, 'hotspots');
        const eventsColRef = collection(db, 'projects', projectId, 'timeline_events');

        // To delete subcollections atomically, it's best to get their document references
        // and delete them. Querying for all docs and then deleting their refs is common.
        const hotspotsSnapshot = await getDocs(query(hotspotsColRef)); // Query outside, use refs inside
        hotspotsSnapshot.docs.forEach(docSnap => transaction.delete(docSnap.ref));

        const eventsSnapshot = await getDocs(query(eventsColRef)); // Query outside, use refs inside
        eventsSnapshot.docs.forEach(docSnap => transaction.delete(docSnap.ref));

        transaction.delete(projectRef); // Delete main project document
      });

      console.log(`Project ${projectId} Firestore data deleted successfully via transaction.`);

      if (thumbnailUrlToDelete) {
        console.log(`Attempting to delete thumbnail for deleted project (fire-and-forget): ${thumbnailUrlToDelete}`);
        this._deleteImageFromStorage(thumbnailUrlToDelete).catch(err => {
            console.error("Error during fire-and-forget deletion of project thumbnail:", err);
        });
      }
      
      return { success: true, projectId };
    } catch (error) {
      console.error('Error deleting project:', error);
      throw new Error(`Failed to delete project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Upload an image file and return the download URL
   */
  async uploadImage(file: File, projectId?: string): Promise<string> {
    try {
      const fileName = `images/${projectId || 'general'}/${Date.now()}_${file.name}`
      const imageRef = ref(storage, fileName)
      
      console.log(`Uploading image: ${fileName}`)
      const snapshot = await uploadBytes(imageRef, file)
      const downloadURL = await getDownloadURL(snapshot.ref)
      
      console.log('Image uploaded successfully:', downloadURL)
      return downloadURL
    } catch (error) {
      console.error('Error uploading image:', error)
      throw new Error(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get hotspots for a project
   */
  private async getHotspots(projectId: string): Promise<HotspotData[]> {
    try {
      const hotspotsRef = collection(db, 'projects', projectId, 'hotspots')
      const snapshot = await getDocs(hotspotsRef)
      
      return snapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          x: data.x || 0,
          y: data.y || 0,
          title: data.title || '',
          description: data.description || '',
          color: data.color,
          size: data.size || 'medium'
        } as HotspotData
      })
    } catch (error) {
      console.error(`Error getting hotspots for project ${projectId}:`, error)
      return []
    }
  }

  /**
   * Get timeline events for a project
   */
  private async getTimelineEvents(projectId: string): Promise<TimelineEventData[]> {
    try {
      const eventsRef = collection(db, 'projects', projectId, 'timeline_events')
      const snapshot = await getDocs(query(eventsRef, orderBy('step', 'asc')))
      
      return snapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          step: data.step || 1,
          name: data.name || '',
          type: data.type,
          targetId: data.targetId,
          message: data.message,
          duration: data.duration,
          zoomFactor: data.zoomFactor,
          highlightRadius: data.highlightRadius
        } as TimelineEventData
      })
    } catch (error) {
      console.error(`Error getting timeline events for project ${projectId}:`, error)
      return []
    }
  }

  /**
   * Clear all subcollections for a project (for clean updates)
   */
  private async clearProjectSubcollections(projectId: string): Promise<void> {
    // This function was causing data loss - it's now handled in saveProject with upsert logic
    console.log(`Skipping clear operation for project ${projectId} - using upsert instead`)
  }

  // Helper function to delete an image from Firebase Storage, callable from methods.
  // Made it private as it's an internal utility for this class.
  private async _deleteImageFromStorage(imageUrl: string): Promise<void> {
    if (!imageUrl) {
      console.warn('Attempted to delete image with no URL.');
      return;
    }

    try {
      // Firebase SDK's ref() can take a gs:// URL or an https:// URL
      // directly from Firebase Storage.
      const imageRef = ref(storage, imageUrl);
      await deleteObject(imageRef);
      console.log(`Successfully deleted image from storage: ${imageUrl}`);
    } catch (error: any) {
      // It's common for "object-not-found" errors if the file was already deleted
      // or the URL was incorrect. We can often ignore these.
      if (error.code === 'storage/object-not-found') {
        console.warn(`Old image not found during deletion attempt, skipping: ${imageUrl}`);
      } else {
        console.error(`Failed to delete image from storage (${imageUrl}):`, error);
        // Optionally, re-throw if this is critical, but typically for cleanup,
        // we might not want to fail the entire operation.
      }
    }
  }
}

// Export singleton instance
export const firebaseAPI = new FirebaseProjectAPI()