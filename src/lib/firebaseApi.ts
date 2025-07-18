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
  runTransaction, // Import runTransaction
  Timestamp
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL, deleteObject, uploadBytesResumable } from 'firebase/storage'
import { auth, db, storage } from './firebaseConfig'
import { Project, HotspotData, TimelineEventData, InteractiveModuleState } from '../shared/types'
import { debugLog } from '../client/utils/debugUtils'
import { DataSanitizer } from './dataSanitizer'
import { generateThumbnail } from '../client/utils/imageUtils' // Import the new utility

// Thumbnail Parameters
const THUMBNAIL_WIDTH = 400;
const THUMBNAIL_HEIGHT = 250;
const THUMBNAIL_FORMAT = 'image/jpeg';
const THUMBNAIL_QUALITY = 0.7;
const THUMBNAIL_POSTFIX = '_thumbnails'; // Used for storage path organization
const THUMBNAIL_FILE_PREFIX = 'thumb_'; // Used for filename
const NEW_PROJECT_ID = 'temp';

// Simple cache to reduce Firebase reads
const projectCache = new Map<string, { data: any, timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export class FirebaseProjectAPI {
  private logUsage(operation: string, count: number = 1) {
    debugLog.log(`Firebase ${operation}: ${count} operations`)
  }

  /**
   * List all projects with their hotspots and timeline events
   */
  async listProjects(): Promise<Project[]> {
    try {
      // Check authentication first
      if (!auth.currentUser) {
        throw new Error('User must be authenticated to access projects');
      }

      this.logUsage('READ_OPERATIONS', 1);
      const projectsRef = collection(db, 'projects');
      
      // Query only projects created by the current user
      const userProjectsQuery = query(
        projectsRef, 
        where('createdBy', '==', auth.currentUser.uid),
        orderBy('updatedAt', 'desc')
      );
      
      const snapshot = await getDocs(userProjectsQuery);
      
      const projects: Project[] = snapshot.docs.map((docSnap) => {
        const projectData = docSnap.data()
        return {
          id: docSnap.id,
          title: projectData.title || 'Untitled Project',
          description: projectData.description || '',
          createdBy: projectData.createdBy,
          createdAt: projectData.createdAt?.toDate?.() || new Date(),
          updatedAt: projectData.updatedAt?.toDate?.() || new Date(),
          thumbnailUrl: projectData.thumbnailUrl,
          isPublic: projectData.isPublic || false,
          interactiveData: {
            backgroundImage: projectData.backgroundImage,
            imageFitMode: projectData.imageFitMode || 'cover',
            viewerModes: projectData.viewerModes || { explore: true, selfPaced: true, timed: true },
            hotspots: [], // Will be loaded on demand - explicitly empty for loading detection
            timelineEvents: [], // Will be loaded on demand - explicitly empty for loading detection
            _needsDetailLoad: true // Flag to indicate this project needs detail loading
          }
        } as Project
      })

      debugLog.log(`Loaded ${projects.length} projects for user ${auth.currentUser.uid}`);
      return projects
    } catch (error) {
      debugLog.error('Error listing projects (summary):', error)
      throw new Error(`Failed to load project summaries: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get a single public project by ID (for shared/public viewing)
   * This method doesn't require authentication for public projects
   */
  async getPublicProject(projectId: string): Promise<Project | null> {
    try {
      this.logUsage('READ_OPERATIONS_PUBLIC', 1);
      const projectDocRef = doc(db, 'projects', projectId);
      const projectDoc = await getDoc(projectDocRef);
      
      if (!projectDoc.exists()) {
        return null;
      }
      
      const projectData = projectDoc.data();
      
      // Only return if the project is marked as public
      if (!projectData.isPublic) {
        return null;
      }
      
      // Get hotspots and timeline events directly (bypassing auth requirements)
      const [hotspots, timelineEvents] = await Promise.all([
        this.getHotspots(projectId),
        this.getTimelineEvents(projectId)
      ]);
      this.logUsage('READ_OPERATIONS_PUBLIC_SUBCOLLECTIONS', 2);
      
      return {
        id: projectDoc.id,
        title: projectData.title || 'Untitled Project',
        description: projectData.description || '',
        createdBy: projectData.createdBy,
        createdAt: projectData.createdAt?.toDate?.() || new Date(),
        updatedAt: projectData.updatedAt?.toDate?.() || new Date(),
        thumbnailUrl: projectData.thumbnailUrl,
        isPublic: projectData.isPublic || false,
        interactiveData: {
          backgroundImage: projectData.backgroundImage,
          imageFitMode: projectData.imageFitMode || 'cover',
          viewerModes: projectData.viewerModes || { explore: true, selfPaced: true, timed: true },
          hotspots: hotspots || [],
          timelineEvents: timelineEvents || []
        }
      } as Project;
    } catch (error) {
      debugLog.error('Error fetching public project:', error);
      throw new Error(`Failed to load public project: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      debugLog.error(`Error getting project details for ${projectId}:`, error);
      throw new Error(`Failed to load project details: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }


  /**
   * Create a new project
   */
  private generateProjectId(): string {
    return `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  }

  async createProject(title: string, description: string): Promise<Project> {
    try {
      if (!auth.currentUser) {
        throw new Error('User must be authenticated to create projects');
      }

      const projectId = this.generateProjectId();
      
      // Newly created project will have empty hotspots and timelineEvents by default.
      // The full interactiveData structure is provided here.
      const newProjectData: Project = {
        id: projectId,
        title,
        description,
        createdBy: auth.currentUser.uid, // Add user ID
        createdAt: Timestamp.now(), // Use Firestore Timestamp for type correctness
        updatedAt: Timestamp.now(), // Use Firestore Timestamp for type correctness
        interactiveData: { // This is complete for a new project
          backgroundImage: undefined,
          hotspots: [], // Empty for new project
          timelineEvents: [], // Empty for new project
          imageFitMode: 'cover',
        viewerModes: { explore: true, selfPaced: true, timed: true }, // Added viewerModes with defaults
        isPublic: false // Default to private
        }
      };
      
      // Save to Firestore with flattened structure to match expected schema
      const projectRef = doc(db, 'projects', projectId);
      const { createdAt, updatedAt, interactiveData, ...projectMetadata } = newProjectData;
      await setDoc(projectRef, {
        ...projectMetadata,
        backgroundImage: null, // New projects start with no background image
        imageFitMode: interactiveData.imageFitMode,
        viewerModes: interactiveData.viewerModes,
        isPublic: false,
        thumbnailUrl: null, // New projects start with no thumbnail
        createdAt: serverTimestamp(), // Use server-generated timestamps for reliability
        updatedAt: serverTimestamp(),
      });
      
      return newProjectData;
    } catch (error) {
      debugLog.error('Error creating project:', error)
      throw new Error(`Failed to create project: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Save/update a project with all its data
   */
  async saveProject(project: Project): Promise<Project> {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User must be authenticated to save projects');
      }

      // Check if it's a new project before mutating the ID
      const isNewProject = project.id === NEW_PROJECT_ID;
      
      // If new project, set createdBy and generate ID
      if (isNewProject) {
        project.id = this.generateProjectId();
        project.createdBy = user.uid;
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

      // Check if background image changed and use provided thumbnail URL
      if (newBackgroundImageForUpdate && newBackgroundImageForUpdate !== existingBackgroundImage) {
        if (existingThumbnailUrl) {
          oldThumbnailUrlToDeleteAfterCommit = existingThumbnailUrl;
        }
        
        // Use thumbnail URL if provided (generated during upload)
        if (project.thumbnailUrl) {
          finalThumbnailUrl = project.thumbnailUrl;
          debugLog.log(`Using pre-generated thumbnail: ${finalThumbnailUrl}`);
        } else {
          debugLog.log('No thumbnail provided, continuing without thumbnail');
          finalThumbnailUrl = null;
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

        const projectSnap = await transaction.get(projectRef);
        if (projectSnap.exists()) {
          const projectData = projectSnap.data();
          if (projectData.createdBy && projectData.createdBy !== user.uid) {
            throw new Error('You do not have permission to modify this project');
          }
          if (!projectData.createdBy) {
            project.createdBy = user.uid;
          }
        } else if (!isNewProject) {
          throw new Error('Project not found. Cannot update a non-existent project.');
        }

        interface ProjectUpdateData {
          title: string;
          description: string;
          thumbnailUrl: string;
          backgroundImage: string | null;
          imageFitMode: string;
          viewerModes: { explore: boolean; selfPaced: boolean; timed: boolean };
          isPublic: boolean;
          updatedAt: any; // Firestore serverTimestamp
          createdBy: string;
          createdAt?: any; // Optional, only for new projects
        }

        const updateData: ProjectUpdateData = {
          title: project.title,
          description: project.description,
          thumbnailUrl: finalThumbnailUrl,
          backgroundImage: newBackgroundImageForUpdate || null,
          imageFitMode: project.interactiveData.imageFitMode || 'cover',
          viewerModes: project.interactiveData.viewerModes || { explore: true, selfPaced: true, timed: true },
          isPublic: project.isPublic || false,
          updatedAt: serverTimestamp(),
          createdBy: project.createdBy
        };
        
        // Add createdAt only for new projects
        if (isNewProject) {
          updateData.createdAt = serverTimestamp();
        }
        
        transaction.set(projectRef, updateData, { merge: true });

        const sanitizedHotspots = DataSanitizer.sanitizeHotspots(project.interactiveData.hotspots);
        const sanitizedEvents = DataSanitizer.sanitizeTimelineEvents(project.interactiveData.timelineEvents);

        const hotspotsColRef = collection(db, 'projects', project.id, 'hotspots');
        const eventsColRef = collection(db, 'projects', project.id, 'timeline_events');

        // NEW APPROACH: Use upsert logic instead of delete-then-recreate
        // This prevents data loss if the transaction fails partway through
        
        const currentHotspotIds = new Set(sanitizedHotspots.map(h => h.id));
        const currentEventIds = new Set(sanitizedEvents.map(e => e.id));
        
        // Upsert current hotspots and events
        for (const hotspot of sanitizedHotspots) {
          const hotspotRef = doc(hotspotsColRef, hotspot.id!);
          transaction.set(hotspotRef, { ...hotspot, updatedAt: serverTimestamp() });
        }

        for (const event of sanitizedEvents) {
          const eventRef = doc(eventsColRef, event.id!);
          transaction.set(eventRef, { ...event, updatedAt: serverTimestamp() });
        }
      });

      debugLog.log(`Transaction for project ${project.id} committed successfully.`);

      // Clean up orphaned documents in a separate transaction (after main save succeeds)
      // This is safer than doing it in the same transaction
      try {
        await this.cleanupOrphanedSubcollectionDocs(project.id, 
          sanitizedHotspots.map(h => h.id!), 
          sanitizedEvents.map(e => e.id!)
        );
      } catch (cleanupError) {
        debugLog.warn('Cleanup of orphaned documents failed, but main save succeeded:', cleanupError);
        // Don't throw - main save was successful
      }

      if (oldThumbnailUrlToDeleteAfterCommit) {
        debugLog.log(`Attempting to delete old thumbnail (fire-and-forget): ${oldThumbnailUrlToDeleteAfterCommit}`);
        this._deleteImageFromStorage(oldThumbnailUrlToDeleteAfterCommit).catch(err => {
          debugLog.error("Error during fire-and-forget deletion of old thumbnail:", err);
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
      debugLog.error('Error in saveProject (transaction or post-transaction storage deletion):', error);
      throw new Error(`Failed to save project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a project and all its data
   */
  async deleteProject(projectId: string): Promise<{ success: boolean; projectId: string }> {
    try {
      if (!auth.currentUser) {
        throw new Error('User must be authenticated to delete projects');
      }

      const projectRef = doc(db, 'projects', projectId);
      let thumbnailUrlToDelete: string | null = null;

      // Fetch project data to get thumbnail URL and verify ownership
      const projectSnap = await getDoc(projectRef);
      if (projectSnap.exists()) {
        const projectData = projectSnap.data();
        if (projectData.createdBy !== auth.currentUser.uid) {
          throw new Error('You do not have permission to delete this project');
        }
        thumbnailUrlToDelete = projectData.thumbnailUrl || null;
      }

      await runTransaction(db, async (transaction) => {
        this.logUsage('TRANSACTION_DELETE_PROJECT', 1);

        // Optional: Re-read project document with transaction.get(projectRef) to ensure it still exists
        // if there's a concern it might be deleted by another process between the getDoc above and here.
        // For this operation, if it's already gone, our work for the main doc is done.
        const freshProjectSnap = await transaction.get(projectRef); // Good practice to confirm existence within transaction
        if (!freshProjectSnap.exists()) {
          debugLog.warn(`Project ${projectId} not found during delete transaction (already deleted?).`);
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

      debugLog.log(`Project ${projectId} Firestore data deleted successfully via transaction.`);

      if (thumbnailUrlToDelete) {
        debugLog.log(`Attempting to delete thumbnail for deleted project (fire-and-forget): ${thumbnailUrlToDelete}`);
        this._deleteImageFromStorage(thumbnailUrlToDelete).catch(err => {
            debugLog.error("Error during fire-and-forget deletion of project thumbnail:", err);
        });
      }
      
      return { success: true, projectId };
    } catch (error) {
      debugLog.error('Error deleting project:', error);
      throw new Error(`Failed to delete project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Upload an image file and return the download URL with optimized connection handling
   */
  async uploadImage(file: File, projectId?: string): Promise<string> {
    try {
      // Verify authentication before upload
      if (!auth.currentUser) {
        throw new Error('auth/user-not-authenticated: User must be authenticated to upload images');
      }

      // Validate file before upload
      if (!file || file.size === 0) {
        throw new Error('Invalid file: File is empty or corrupted');
      }

      // Generate unique filename with timestamp and random suffix
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `images/${auth.currentUser.uid}/${timestamp}_${randomSuffix}_${sanitizedName}`;
      
      const imageRef = ref(storage, fileName);
      
      debugLog.log(`Uploading image: ${fileName} (${file.size} bytes, type: ${file.type})`);
      
      // Create upload task with metadata for better tracking
      const metadata = {
        contentType: file.type,
        customMetadata: {
          projectId: projectId || 'general',
          uploadedAt: new Date().toISOString(),
          userId: auth.currentUser.uid,
          originalName: file.name
        }
      };
      
      // Upload with optimized timeout and retry handling
      const uploadPromise = uploadBytes(imageRef, file, metadata);
      
      // Add timeout wrapper with appropriate time based on file size
      const timeoutMs = Math.max(30000, file.size / 1024 / 1024 * 10000); // 10 seconds per MB, min 30s
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('storage/timeout: Upload timed out'));
        }, timeoutMs);
      });
      
      const snapshot = await Promise.race([uploadPromise, timeoutPromise]);
      
      // Get download URL with retry logic
      let downloadURL: string;
      let urlAttempts = 0;
      const maxUrlAttempts = 3;
      
      while (urlAttempts < maxUrlAttempts) {
        try {
          downloadURL = await getDownloadURL(snapshot.ref);
          break;
        } catch (urlError) {
          urlAttempts++;
          if (urlAttempts >= maxUrlAttempts) {
            throw new Error(`Failed to get download URL after ${maxUrlAttempts} attempts: ${urlError}`);
          }
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * urlAttempts));
        }
      }
      
      debugLog.log('Image uploaded successfully:', downloadURL);
      return downloadURL!;
    } catch (error) {
      debugLog.error('Error uploading image:', error);
      
      // Enhanced error categorization with Firebase Storage specific errors
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();
        
        if (errorMessage.includes('auth/') || errorMessage.includes('authentication')) {
          throw new Error(`Authentication error: ${error.message}`);
        }
        if (errorMessage.includes('storage/unauthorized') || errorMessage.includes('permission')) {
          throw new Error(`Permission denied: Check Firebase Storage rules`);
        }
        if (errorMessage.includes('storage/quota-exceeded')) {
          throw new Error(`Storage quota exceeded: Upgrade your Firebase plan`);
        }
        if (errorMessage.includes('storage/timeout') || errorMessage.includes('timeout')) {
          throw new Error(`Upload timeout: File may be too large or connection too slow`);
        }
        if (errorMessage.includes('storage/invalid-format')) {
          throw new Error(`Invalid file format: ${error.message}`);
        }
        if (errorMessage.includes('storage/object-not-found')) {
          throw new Error(`Storage reference not found: ${error.message}`);
        }
        if (errorMessage.includes('storage/bucket-not-found')) {
          throw new Error(`Storage bucket not found: Check Firebase configuration`);
        }
        if (errorMessage.includes('storage/')) {
          throw new Error(`Storage error: ${error.message}`);
        }
        if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('failed to fetch')) {
          throw new Error(`Network error: ${error.message}`);
        }
        if (errorMessage.includes('cors')) {
          throw new Error(`CORS error: Check Firebase Storage CORS configuration`);
        }
      }
      
      throw new Error(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Upload a file with progress reporting.
   * @param file The file to upload.
   * @param onProgress A callback to report progress.
   * @param projectId An optional project ID to associate the file with.
   * @returns A promise that resolves with the download URL of the uploaded file.
   */
  async uploadFile(
    file: File,
    onProgress: (progress: number) => void,
    projectId?: string
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!auth.currentUser) {
        return reject(new Error('auth/user-not-authenticated: User must be authenticated to upload files'));
      }

      if (!file || file.size === 0) {
        return reject(new Error('Invalid file: File is empty or corrupted'));
      }

      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `uploads/${auth.currentUser.uid}/${timestamp}_${randomSuffix}_${sanitizedName}`;

      const fileRef = ref(storage, fileName);

      const metadata = {
        contentType: file.type,
        customMetadata: {
          projectId: projectId || 'general',
          uploadedAt: new Date().toISOString(),
          userId: auth.currentUser.uid,
          originalName: file.name,
        },
      };

      const uploadTask = uploadBytesResumable(fileRef, file, metadata);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress(progress);
        },
        (error) => {
          debugLog.error('Error uploading file:', error);
          reject(new Error(`Failed to upload file: ${error.message}`));
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            debugLog.log('File uploaded successfully:', downloadURL);
            resolve(downloadURL);
          } catch (error) {
            debugLog.error('Error getting download URL:', error);
            reject(new Error(`Failed to get download URL: ${error.message}`));
          }
        }
      );
    });
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
        return DataSanitizer.sanitizeHotspot({
          id: doc.id,
          ...data
        }) as HotspotData
      })
    } catch (error) {
      debugLog.error(`Error getting hotspots for project ${projectId}:`, error)
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
        return DataSanitizer.sanitizeTimelineEvent({
          id: doc.id,
          ...data
        }) as TimelineEventData
      })
    } catch (error) {
      debugLog.error(`Error getting timeline events for project ${projectId}:`, error)
      return []
    }
  }

  /**
   * Clean up orphaned subcollection documents that are no longer needed
   * This runs as a separate transaction after the main save to prevent data loss
   */
  private async cleanupOrphanedSubcollectionDocs(
    projectId: string, 
    currentHotspotIds: string[], 
    currentEventIds: string[]
  ): Promise<void> {
    try {
      const hotspotsColRef = collection(db, 'projects', projectId, 'hotspots');
      const eventsColRef = collection(db, 'projects', projectId, 'timeline_events');
      
      // Get all existing documents
      const [existingHotspotsSnap, existingEventsSnap] = await Promise.all([
        getDocs(query(hotspotsColRef)),
        getDocs(query(eventsColRef))
      ]);
      
      const currentHotspotIdSet = new Set(currentHotspotIds);
      const currentEventIdSet = new Set(currentEventIds);
      
      // Find orphaned documents
      const orphanedHotspotRefs = existingHotspotsSnap.docs
        .filter(doc => !currentHotspotIdSet.has(doc.id))
        .map(doc => doc.ref);
        
      const orphanedEventRefs = existingEventsSnap.docs
        .filter(doc => !currentEventIdSet.has(doc.id))
        .map(doc => doc.ref);
      
      // Delete orphans in batches (Firestore has a 500 operation limit per transaction)
      const allOrphanedRefs = [...orphanedHotspotRefs, ...orphanedEventRefs];
      
      if (allOrphanedRefs.length === 0) {
        return; // No cleanup needed
      }
      
      debugLog.log(`Cleaning up ${allOrphanedRefs.length} orphaned documents for project ${projectId}`);
      
      // Process in batches of 400 to stay under Firestore's 500 operation limit
      const batchSize = 400;
      for (let i = 0; i < allOrphanedRefs.length; i += batchSize) {
        const batch = allOrphanedRefs.slice(i, i + batchSize);
        
        await runTransaction(db, async (transaction) => {
          batch.forEach(ref => transaction.delete(ref));
        });
      }
      
      debugLog.log(`Successfully cleaned up orphaned documents for project ${projectId}`);
      
    } catch (error) {
      debugLog.error(`Error cleaning up orphaned documents for project ${projectId}:`, error);
      // Don't throw - this is cleanup, not critical for data integrity
    }
  }

  /**
   * Clear all subcollections for a project (for clean updates)
   */
  private async clearProjectSubcollections(projectId: string): Promise<void> {
    // This function was causing data loss - it's now handled in saveProject with upsert logic
    debugLog.log(`Skipping clear operation for project ${projectId} - using upsert instead`)
  }

  // Helper function to delete an image from Firebase Storage, callable from methods.
  // Made it private as it's an internal utility for this class.
  private async _deleteImageFromStorage(imageUrl: string): Promise<void> {
    if (!imageUrl) {
      debugLog.warn('Attempted to delete image with no URL.');
      return;
    }

    try {
      // Firebase SDK's ref() can take a gs:// URL or an https:// URL
      // directly from Firebase Storage.
      const imageRef = ref(storage, imageUrl);
      await deleteObject(imageRef);
      debugLog.log(`Successfully deleted image from storage: ${imageUrl}`);
    } catch (error: any) {
      // It's common for "object-not-found" errors if the file was already deleted
      // or the URL was incorrect. We can often ignore these.
      if (error.code === 'storage/object-not-found') {
        debugLog.warn(`Old image not found during deletion attempt, skipping: ${imageUrl}`);
      } else {
        debugLog.error(`Failed to delete image from storage (${imageUrl}):`, error);
        // Optionally, re-throw if this is critical, but typically for cleanup,
        // we might not want to fail the entire operation.
      }
    }
  }

  async updateProjectPublicStatus(projectId: string, isPublic: boolean): Promise<void> {
    try {
      if (!auth.currentUser) {
        throw new Error('User must be authenticated to update project status');
      }
      
      const projectRef = doc(db, 'projects', projectId);
      const projectSnap = await getDoc(projectRef);

      if (!projectSnap.exists()) {
        throw new Error('Project not found');
      }

      const projectData = projectSnap.data();
      if (projectData.createdBy !== auth.currentUser.uid) {
        throw new Error('You do not have permission to update this project');
      }

      await setDoc(projectRef, { isPublic, updatedAt: serverTimestamp() }, { merge: true });
      debugLog.log(`Project ${projectId} public status updated to ${isPublic}`);
    } catch (error) {
      debugLog.error(`Error updating project public status for ${projectId}:`, error);
      throw new Error(`Failed to update project public status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Export singleton instance
export const firebaseAPI = new FirebaseProjectAPI()