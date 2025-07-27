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
import { firebaseManager } from './firebaseConfig'
import { Project, HotspotData, TimelineEventData, InteractiveModuleState } from '../shared/types'
import { debugLog } from '../client/utils/debugUtils'
import { DataSanitizer } from './dataSanitizer'
import { generateThumbnail } from '../client/utils/imageUtils'
import { isMobileDevice } from '../client/utils/mobileUtils'
import { networkMonitor } from '../client/utils/networkMonitor'

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

  private async ensureFirebaseReady(): Promise<void> {
    if (!firebaseManager.isReady()) {
      debugLog.log('Firebase not ready, initializing...')
      await firebaseManager.initialize()
    }
  }

  private async withMobileErrorHandling<T>(operation: () => Promise<T>, operationName: string): Promise<T> {
    try {
      await this.ensureFirebaseReady()
      return await operation()
    } catch (error) {
      debugLog.error(`Mobile Firebase operation failed (${operationName}):`, error)
      
      if (isMobileDevice()) {
        // Enhanced mobile-specific error handling
        const errorMessage = error instanceof Error ? error.message.toLowerCase() : ''
        
        if (errorMessage.includes('network') || errorMessage.includes('offline')) {
          // Network-related error on mobile
          const networkState = networkMonitor.getState()
          debugLog.log('Network state during error:', networkState)
          
          if (!networkState.online) {
            throw new Error('No internet connection. Please check your network and try again.')
          } else if (networkState.effectiveType === 'slow-2g' || networkState.effectiveType === '2g') {
            throw new Error('Slow network connection detected. Please try again or move to a better network area.')
          }
        }
        
        if (errorMessage.includes('webchannelconnection') || errorMessage.includes('rpc')) {
          throw new Error('Connection to server failed. This may be due to network issues on mobile. Please try again.')
        }
        
        if (errorMessage.includes('quota') || errorMessage.includes('limit')) {
          throw new Error('Service temporarily unavailable. Please try again in a few moments.')
        }
      }
      
      throw error
    }
  }

  /**
   * List all projects with their hotspots and timeline events
   */
  async listProjects(): Promise<Project[]> {
    return this.withMobileErrorHandling(async () => {
      const auth = firebaseManager.getAuth();
      
      // Enhanced authentication validation for mobile browsers
      if (!auth.currentUser) {
        throw new Error('User must be authenticated to access projects');
      }
      
      if (!auth.currentUser.uid) {
        throw new Error('Invalid authentication state - missing user ID');
      }


      this.logUsage('READ_OPERATIONS', 1);
      const db = firebaseManager.getFirestore();
      const projectsRef = collection(db, 'projects');
      
      // Query projects created by the current user
      const userProjectsQuery = query(
        projectsRef, 
        where('createdBy', '==', auth.currentUser.uid),
        orderBy('updatedAt', 'desc')
      );
      
      const snapshot = await getDocs(userProjectsQuery);
      
      const projects: Project[] = snapshot.docs.map((docSnap) => {
        const projectData = docSnap.data()
        
        // Build project object with slide deck data if available
        const project: Project = {
          id: docSnap.id,
          title: projectData.title || 'Untitled Project',
          description: projectData.description || '',
          createdBy: projectData.createdBy,
          createdAt: projectData.createdAt?.toDate?.() || new Date(),
          updatedAt: projectData.updatedAt?.toDate?.() || new Date(),
          thumbnailUrl: projectData.thumbnailUrl,
          isPublished: projectData.isPublished || false,
          projectType: projectData.projectType || 'slide', // Default to slide for new architecture
          interactiveData: projectData.interactiveData ?
            { ...projectData.interactiveData, _needsDetailLoad: true } :
            {
              backgroundImage: projectData.backgroundImage,
              imageFitMode: projectData.imageFitMode || 'cover',
              viewerModes: projectData.viewerModes || { explore: true, selfPaced: true, timed: true },
              hotspots: [],
              timelineEvents: [],
              _needsDetailLoad: true
            }
        };

        // Include slide deck if it exists
        if (projectData.slideDeck) {
          project.slideDeck = projectData.slideDeck;
          debugLog.log(`[listProjects] Project ${project.id} has slide deck with ${projectData.slideDeck.slides?.length || 0} slides`);
        }

        return project;
      })


      debugLog.log(`Loaded ${projects.length} projects for user ${auth.currentUser.uid}`);
      return projects
    }, 'listProjects');
  }

  /**
   * Get a single public project by ID (for shared/public viewing)
   * This method doesn't require authentication for public projects
   */
  async getPublicProject(projectId: string): Promise<Project | null> {
    try {
      const db = firebaseManager.getFirestore();
      this.logUsage('READ_OPERATIONS_PUBLIC', 1);
      const projectDocRef = doc(db, 'projects', projectId);
      const projectDoc = await getDoc(projectDocRef);
      
      if (!projectDoc.exists()) {
        return null;
      }
      
      const projectData = projectDoc.data();
      
      // Only return if the project is marked as published
      if (!projectData.isPublished) {
        return null;
      }
      
      // Check project type and handle accordingly
      const projectType = projectData.projectType || 'hotspot'; // Default to hotspot for backward compatibility
      
      let slideDeck: any = null;
      
      // Helper function to build fallback interactiveData from legacy fields
      const buildFallbackInteractiveData = () => ({
        backgroundImage: projectData.backgroundImage,
        imageFitMode: projectData.imageFitMode || 'cover',
        viewerModes: projectData.viewerModes || { explore: true, selfPaced: true, timed: true },
        hotspots: [],
        timelineEvents: []
      });
      
      // Build interactiveData, preferring nested structure with legacy fallback
      let interactiveData: any = projectData.interactiveData 
        ? { ...projectData.interactiveData }
        : buildFallbackInteractiveData();
      
      if (projectType === 'slide') {
        // For slide-based projects, try to get slide deck data
        if (projectData.slideDeck) {
          slideDeck = projectData.slideDeck;
        }
      } else {
        // Always load hotspots and timeline events for public view if not slide-based.
        const [hotspots, timelineEvents] = await Promise.all([
          this.getHotspots(projectId),
          this.getTimelineEvents(projectId)
        ]);
        this.logUsage('READ_OPERATIONS_PUBLIC_SUBCOLLECTIONS', 2);
        interactiveData.hotspots = hotspots || [];
        interactiveData.timelineEvents = timelineEvents || [];
      }
      
      return {
        id: projectDoc.id,
        title: projectData.title || 'Untitled Project',
        description: projectData.description || '',
        createdBy: projectData.createdBy,
        createdAt: projectData.createdAt?.toDate?.() || new Date(),
        updatedAt: projectData.updatedAt?.toDate?.() || new Date(),
        thumbnailUrl: projectData.thumbnailUrl,
        isPublished: projectData.isPublished || false,
        projectType: projectType,
        interactiveData,
        slideDeck
      } as Project;
    } catch (error) {
      // Only log as error for unexpected errors, not permission/not-found errors
      if (error instanceof Error && 
          (error.message.includes('permission-denied') || error.message.includes('Missing or insufficient permissions'))) {
        debugLog.warn('Public project access denied:', projectId);
      } else {
        debugLog.error('Error fetching public project:', error);
      }
      throw new Error(`Failed to load public project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get detailed interactive data (hotspots, timeline events) for a single project.
   * Also fetches backgroundImage and imageFitMode again to ensure consistency, though they might be available from summary.
   */
  async getProjectDetails(projectId: string): Promise<Partial<InteractiveModuleState>> {
    try {
      const db = firebaseManager.getFirestore();
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


      let result: Partial<InteractiveModuleState> & { slideDeck?: any };

      // Prefer the 'interactiveData' field but fall back to legacy fields.
      if (projectData.interactiveData) {
        result = {
          ...projectData.interactiveData,
          // IMPORTANT: Subcollection data always overrides interactiveData arrays
          // to maintain single source of truth and prevent data inconsistencies
          hotspots,
          timelineEvents,
        };
      } else {
        result = {
          backgroundImage: projectData.backgroundImage,
          imageFitMode: projectData.imageFitMode || 'cover',
          viewerModes: projectData.viewerModes || { explore: true, selfPaced: true, timed: true },
          hotspots,
          timelineEvents,
        };
      }

      // Add slide deck if it exists in the project data
      if (projectData.slideDeck) {
        result.slideDeck = projectData.slideDeck;
        debugLog.log(`[FirebaseAPI] Loaded slide deck for project ${projectId}:`, {
          slideCount: projectData.slideDeck.slides?.length || 0,
          totalElements: projectData.slideDeck.slides?.reduce((acc: number, slide: any) => acc + (slide.elements?.length || 0), 0) || 0
        });
      } else {
        debugLog.log(`[FirebaseAPI] No slide deck found for project ${projectId}`);
      }

      return result;
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
      const auth = firebaseManager.getAuth();
      const db = firebaseManager.getFirestore();
      
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
        isPublished: false,
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
      const auth = firebaseManager.getAuth();
      const db = firebaseManager.getFirestore();
      
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

      // Always use the new thumbnail if it's provided
      if (project.thumbnailUrl && project.thumbnailUrl !== existingThumbnailUrl) {
        finalThumbnailUrl = project.thumbnailUrl;
        if (existingThumbnailUrl) {
          oldThumbnailUrlToDeleteAfterCommit = existingThumbnailUrl;
        }
        debugLog.log(`Using new or updated thumbnail: ${finalThumbnailUrl}`);
      } else if (!newBackgroundImageForUpdate && existingBackgroundImage) {
        if (existingThumbnailUrl) {
          oldThumbnailUrlToDeleteAfterCommit = existingThumbnailUrl;
        }
        finalThumbnailUrl = null;
      }
      // --- End of Thumbnail logic ---

      // Sanitize data before transaction to make it accessible in cleanup
      const sanitizedHotspots = DataSanitizer.sanitizeHotspots(project.interactiveData.hotspots);
      const sanitizedEvents = DataSanitizer.sanitizeTimelineEvents(project.interactiveData.timelineEvents);

      await runTransaction(firebaseManager.getFirestore(), async (transaction) => {
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

        // Define the structure for the project document in Firestore.
        // This now includes 'interactiveData' as a map (object).
        interface ProjectUpdateData {
          title: string;
          description: string;
          thumbnailUrl: string | null;
          isPublished: boolean;
          projectType: 'hotspot' | 'slide';
          slideDeck?: any;
          updatedAt: any; // Firestore serverTimestamp
          createdBy: string;
          createdAt?: any; // Optional, only for new projects
          interactiveData: InteractiveModuleState; // Nested object
        }

        // Prepare the data for Firestore update.
        // All interactive data is now nested under the 'interactiveData' field.
        // IMPORTANT: Clear hotspots and timelineEvents from interactiveData since 
        // subcollections are the authoritative source to prevent data inconsistencies.
        const updateData: ProjectUpdateData = {
          title: project.title,
          description: project.description,
          thumbnailUrl: finalThumbnailUrl,
          isPublished: project.isPublished || false,
          projectType: project.projectType || 'hotspot',
          updatedAt: serverTimestamp(),
          createdBy: project.createdBy,
          interactiveData: {
            ...project.interactiveData,
            backgroundImage: newBackgroundImageForUpdate || null,
            // Clear these arrays since subcollections are authoritative
            hotspots: [],
            timelineEvents: [],
          }
        };

        // Add slide deck data for slide-based projects.
        if (project.projectType === 'slide' && project.slideDeck) {
          updateData.slideDeck = project.slideDeck;
          debugLog.log(`[FirebaseAPI] Saving slide deck for project ${project.id}:`, {
            slideCount: project.slideDeck.slides.length,
            totalElements: project.slideDeck.slides.reduce((acc, slide) => acc + (slide.elements ? slide.elements.length : 0), 0)
          });
        }

        // Add createdAt only for new projects.
        if (isNewProject) {
          updateData.createdAt = serverTimestamp();
        }
        
        // Sanitize the entire updateData object to remove any undefined values
        const sanitizedUpdateData = DataSanitizer.sanitizeObject(updateData);
        
        // Debug validation to catch undefined values in development
        if (debugLog.isDebugEnabled()) {
          const checkForUndefined = (obj: any, path = 'updateData'): void => {
            for (const [key, value] of Object.entries(obj)) {
              const currentPath = `${path}.${key}`;
              if (value === undefined) {
                debugLog.warn(`Found undefined value at ${currentPath} - this will be filtered out by sanitization`);
              } else if (value && typeof value === 'object' && !Array.isArray(value)) {
                checkForUndefined(value, currentPath);
              }
            }
          };
          checkForUndefined(updateData);
        }
        
        // Atomically set the document with the new structure.
        transaction.set(projectRef, sanitizedUpdateData, { merge: true });

        const hotspotsColRef = collection(db, 'projects', project.id, 'hotspots');
        const eventsColRef = collection(db, 'projects', project.id, 'timeline_events');

        // NEW APPROACH: Use upsert logic instead of delete-then-recreate
        // This prevents data loss if the transaction fails partway through
        
        const currentHotspotIds = new Set(sanitizedHotspots.map(h => h.id));
        const currentEventIds = new Set(sanitizedEvents.map(e => e.id));
        
        debugLog.log(`[FirebaseAPI] Saving project ${project.id}:`, {
          hotspotsCount: sanitizedHotspots.length,
          eventsCount: sanitizedEvents.length,
          hotspotIds: Array.from(currentHotspotIds),
          eventIds: Array.from(currentEventIds)
        });
        
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
        debugLog.log(`[FirebaseAPI] Starting cleanup for project ${project.id}`);
        await this.cleanupOrphanedSubcollectionDocs(project.id, 
          sanitizedHotspots.map(h => h.id!), 
          sanitizedEvents.map(e => e.id!)
        );
        debugLog.log(`[FirebaseAPI] Cleanup completed for project ${project.id}`);
      } catch (cleanupError) {
        debugLog.error(`[FirebaseAPI] Failed to clean up orphaned documents for project ${project.id}, but main save succeeded:`, cleanupError);
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
          backgroundImage: newBackgroundImageForUpdate || null
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
      const auth = firebaseManager.getAuth();
      const db = firebaseManager.getFirestore();
      
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

      await runTransaction(firebaseManager.getFirestore(), async (transaction) => {
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
      const auth = firebaseManager.getAuth();
      
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
      
      const storage = firebaseManager.getStorage();
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
   * Upload a thumbnail for a specific project.
   * Uses the path structure required by storage rules: /projects/{projectId}/thumbnails/{thumbId}
   */
  async uploadThumbnail(file: File, projectId: string): Promise<string> {
    try {
      const auth = firebaseManager.getAuth();
      
      // Verify authentication before upload
      if (!auth.currentUser) {
        throw new Error('auth/user-not-authenticated: User must be authenticated to upload thumbnails');
      }
      
      // Validate inputs
      if (!file || file.size === 0) {
        throw new Error('Invalid file: File is empty or corrupted');
      }
      
      if (!projectId) {
        throw new Error('Project ID is required for thumbnail upload');
      }
      
      // Generate unique thumbnail ID
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const thumbId = `${THUMBNAIL_FILE_PREFIX}${timestamp}_${randomSuffix}.jpg`;
      
      // Use the path structure that matches storage rules
      const fileName = `projects/${projectId}/thumbnails/${thumbId}`;
      
      const storage = firebaseManager.getStorage();
      const thumbnailRef = ref(storage, fileName);
      
      debugLog.log(`Uploading thumbnail: ${fileName} (${file.size} bytes, type: ${file.type})`);
      
      // Set metadata with ownerId for security rules
      const metadata = {
        contentType: file.type,
        customMetadata: {
          projectId: projectId,
          uploadedAt: new Date().toISOString(),
          ownerId: auth.currentUser.uid, // Required by storage rules
          originalName: file.name,
          thumbnailType: 'project'
        }
      };
      
      // Upload with optimized timeout and retry handling
      const uploadPromise = uploadBytes(thumbnailRef, file, metadata);
      
      // Add timeout wrapper with appropriate time based on file size
      const timeoutMs = Math.max(30000, file.size / 1024 / 1024 * 10000); // 10 seconds per MB, min 30s
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('storage/timeout: Thumbnail upload timed out'));
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
          debugLog.warn(`Download URL attempt ${urlAttempts} failed:`, urlError);
          
          if (urlAttempts >= maxUrlAttempts) {
            throw new Error(`Failed to get thumbnail download URL after ${maxUrlAttempts} attempts`);
          }
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 1000 * urlAttempts));
        }
      }
      
      debugLog.log('Thumbnail uploaded successfully:', downloadURL);
      return downloadURL!;
    } catch (error) {
      debugLog.error('Error uploading thumbnail:', error);
      
      // Enhanced error categorization for thumbnails
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();
        
        if (errorMessage.includes('auth/') || errorMessage.includes('authentication')) {
          throw new Error(`Authentication error: ${error.message}`);
        }
        if (errorMessage.includes('storage/unauthorized') || errorMessage.includes('permission')) {
          throw new Error(`Permission denied: Check project ownership and storage rules`);
        }
        if (errorMessage.includes('storage/timeout') || errorMessage.includes('timeout')) {
          throw new Error(`Thumbnail upload timeout: File may be too large or connection too slow`);
        }
      }
      
      throw new Error(`Failed to upload thumbnail: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      const auth = firebaseManager.getAuth();
      
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

      const storage = firebaseManager.getStorage();
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
    return this.withMobileErrorHandling(async () => {
      console.log('Debug getHotspots: Starting, projectId:', projectId);
      console.log('Debug getHotspots: firebaseManager exists:', !!firebaseManager);
      console.log('Debug getHotspots: collection function exists:', !!collection);
      
      const db = firebaseManager.getFirestore();
      console.log('Debug getHotspots: Got db:', !!db);
      
      const hotspotsRef = collection(db, 'projects', projectId, 'hotspots')
      console.log('Debug getHotspots: Got hotspotsRef:', !!hotspotsRef);
      
      const snapshot = await getDocs(hotspotsRef)
      console.log('Debug getHotspots: Got snapshot:', !!snapshot);
      
      return snapshot.docs.map(doc => {
        const data = doc.data()
        return DataSanitizer.sanitizeHotspot({
          id: doc.id,
          ...data
        }) as HotspotData
      })
    }, 'getHotspots');
  }

  /**
   * Get timeline events for a project
   */
  private async getTimelineEvents(projectId: string): Promise<TimelineEventData[]> {
    return this.withMobileErrorHandling(async () => {
      console.log('Debug getTimelineEvents: Starting, projectId:', projectId);
      console.log('Debug getTimelineEvents: firebaseManager exists:', !!firebaseManager);
      console.log('Debug getTimelineEvents: collection function exists:', !!collection);
      
      const db = firebaseManager.getFirestore();
      console.log('Debug getTimelineEvents: Got db:', !!db);
      
      const eventsRef = collection(db, 'projects', projectId, 'timeline_events')
      console.log('Debug getTimelineEvents: Got eventsRef:', !!eventsRef);
      
      const snapshot = await getDocs(query(eventsRef, orderBy('step', 'asc')))
      console.log('Debug getTimelineEvents: Got snapshot:', !!snapshot);
      
      return snapshot.docs.map(doc => {
        const data = doc.data()
        return DataSanitizer.sanitizeTimelineEvent({
          id: doc.id,
          ...data
        }) as TimelineEventData
      })
    }, 'getTimelineEvents');
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
      const db = firebaseManager.getFirestore();
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
      const existingHotspotIds = existingHotspotsSnap.docs.map(doc => doc.id);
      const existingEventIds = existingEventsSnap.docs.map(doc => doc.id);
      
      const orphanedHotspotRefs = existingHotspotsSnap.docs
        .filter(doc => !currentHotspotIdSet.has(doc.id))
        .map(doc => doc.ref);
        
      const orphanedEventRefs = existingEventsSnap.docs
        .filter(doc => !currentEventIdSet.has(doc.id))
        .map(doc => doc.ref);
      
      debugLog.log(`[FirebaseAPI] Cleanup analysis for project ${projectId}:`, {
        existingHotspots: existingHotspotIds,
        currentHotspots: currentHotspotIds,
        orphanedHotspots: orphanedHotspotRefs.map(ref => ref.id),
        existingEvents: existingEventIds,
        currentEvents: currentEventIds,
        orphanedEvents: orphanedEventRefs.map(ref => ref.id)
      });
      
      // Delete orphans in batches (Firestore has a 500 operation limit per transaction)
      const allOrphanedRefs = [...orphanedHotspotRefs, ...orphanedEventRefs];
      
      if (allOrphanedRefs.length === 0) {
        debugLog.log(`[FirebaseAPI] No orphaned documents to clean up for project ${projectId}`);
        return; // No cleanup needed
      }
      
      debugLog.log(`[FirebaseAPI] Cleaning up ${allOrphanedRefs.length} orphaned documents for project ${projectId}`);
      
      // Process in batches of 400 to stay under Firestore's 500 operation limit
      const batchSize = 400;
      for (let i = 0; i < allOrphanedRefs.length; i += batchSize) {
        const batch = allOrphanedRefs.slice(i, i + batchSize);
        
        await runTransaction(firebaseManager.getFirestore(), async (transaction) => {
          batch.forEach(ref => transaction.delete(ref));
        });
        
        debugLog.log(`[FirebaseAPI] Deleted batch of ${batch.length} orphaned documents:`, 
          batch.map(ref => ref.id));
      }
      
      debugLog.log(`[FirebaseAPI] Cleanup completed successfully for project ${projectId}`);
      
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
      const storage = firebaseManager.getStorage();
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

  async updateProject(projectId: string, updates: Partial<Project>): Promise<void> {
    try {
      const auth = firebaseManager.getAuth();
      const db = firebaseManager.getFirestore();
      
      if (!auth.currentUser) {
        throw new Error('User must be authenticated to update project');
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

      // Prepare update data with timestamp
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp()
      };

      // IMPORTANT: If interactiveData is being updated, ensure hotspots and timelineEvents 
      // are cleared since subcollections are the authoritative source
      if (updateData.interactiveData) {
        updateData.interactiveData = {
          ...updateData.interactiveData,
          hotspots: [],
          timelineEvents: [],
        };
        debugLog.log(`[updateProject] Cleared hotspots/timelineEvents from interactiveData to maintain subcollection authority`);
      }

      await setDoc(projectRef, updateData, { merge: true });
      debugLog.log(`Project ${projectId} updated successfully`);
    } catch (error) {
      debugLog.error(`Error updating project ${projectId}:`, error);
      throw new Error(`Failed to update project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateProjectPublishedStatus(projectId: string, isPublished: boolean): Promise<void> {
    try {
      const auth = firebaseManager.getAuth();
      const db = firebaseManager.getFirestore();
      
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

      await setDoc(projectRef, { isPublished, updatedAt: serverTimestamp() }, { merge: true });
      debugLog.log(`Project ${projectId} published status updated to ${isPublished}`);
    } catch (error) {
      debugLog.error(`Error updating project published status for ${projectId}:`, error);
      throw new Error(`Failed to update project published status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async saveSlideDeck(userId: string, slideDeck: any): Promise<void> {
    if (!userId || !slideDeck || !slideDeck.id) {
      throw new Error("Invalid input for saving slide deck.");
    }

    const projectRef = doc(firebaseManager.getFirestore(), 'projects', slideDeck.id);

    await runTransaction(firebaseManager.getFirestore(), async (transaction) => {
      const projectDoc = await transaction.get(projectRef);
      if (!projectDoc.exists()) {
        throw new Error("Project not found.");
      }

      const projectData = projectDoc.data();
      if (projectData.createdBy !== userId) {
        throw new Error("User does not have permission to save this slide deck.");
      }

      transaction.update(projectRef, {
        slideDeck: slideDeck,
        updatedAt: serverTimestamp(),
      });
    });
  }

  async loadSlideDeck(userId: string, projectId: string): Promise<any> {
    if (!userId || !projectId) {
      throw new Error("Invalid input for loading slide deck.");
    }

    const projectRef = doc(firebaseManager.getFirestore(), 'projects', projectId);
    const projectDoc = await getDoc(projectRef);

    if (!projectDoc.exists()) {
      return null;
    }

    const projectData = projectDoc.data();
    if (projectData.createdBy !== userId) {
      throw new Error("User does not have permission to load this slide deck.");
    }

    return projectData.slideDeck || null;
  }
}

// Export singleton instance
export const firebaseAPI = new FirebaseProjectAPI()