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
  Timestamp } from
'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject, uploadBytesResumable } from 'firebase/storage';
import { debugLog } from '../client/utils/debugUtils';
import { generateThumbnail } from '../client/utils/imageUtils';
// Firebase API for project management
import { networkMonitor } from '../client/utils/networkMonitor';
import { SlideDeck } from '../shared/slideTypes';
import { Project, HotspotData, TimelineEventData, InteractiveModuleState } from '../shared/types';
import { DataSanitizer } from './dataSanitizer';
import { firebaseManager } from './firebaseConfig';
import { saveOperationMonitor } from './saveOperationMonitor';
import { DevAuthBypass } from './testAuthUtils';

// Thumbnail Parameters
const THUMBNAIL_WIDTH = 400;
const THUMBNAIL_HEIGHT = 250;
const THUMBNAIL_FORMAT = 'image/jpeg';
const THUMBNAIL_QUALITY = 0.7;
const THUMBNAIL_POSTFIX = '_thumbnails'; // Used for storage path organization
const THUMBNAIL_FILE_PREFIX = 'thumb_'; // Used for filename
const NEW_PROJECT_ID = 'temp';

// Simple cache to reduce Firebase reads
const projectCache = new Map<string, {data: any;timestamp: number;}>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export class FirebaseProjectAPI {
  private logUsage(operation: string, count: number = 1) {
    debugLog.log(`Firebase ${operation}: ${count} operations`);
  }

  /**
   * Get current user with development bypass support
   * @returns User object with uid and email, or throws if not authenticated
   */
  private getCurrentUser(): {uid: string;email: string;} {
    // Check for development bypass first
    const devBypass = DevAuthBypass.getInstance();
    if (devBypass.isEnabled()) {
      const bypassUser = devBypass.getBypassUser();
      if (bypassUser) {
        debugLog.log(`Using development bypass user: ${bypassUser.email}`);
        return { uid: bypassUser.uid, email: bypassUser.email || '' };
      }
    }

    // Ensure Firebase is initialized before accessing auth
    if (!firebaseManager.isReady()) {
      throw new Error('Firebase not initialized. Please try again.');
    }

    // Fallback to Firebase auth
    const auth = firebaseManager.getAuth();
    if (!auth.currentUser) {
      throw new Error('User must be authenticated to access projects');
    }

    if (!auth.currentUser.uid) {
      throw new Error('Invalid authentication state - missing user ID');
    }

    return { uid: auth.currentUser.uid, email: auth.currentUser.email || '' };
  }

  /**
   * Determine if an error is retryable (transient) or permanent
   */
  private isRetryableError(error: Error): boolean {
    const errorMessage = error.message.toLowerCase();

    // Retryable errors (network, timeout, capacity issues)
    const retryablePatterns = [
    'network',
    'timeout',
    'connection',
    'temporary',
    'unavailable',
    'aborted',
    'deadline-exceeded',
    'resource-exhausted',
    'failed-precondition', // Sometimes retryable for optimistic concurrency
    'quota',
    'rate-limit',
    'too many requests'];


    // Non-retryable errors (permissions, validation, not found)
    const nonRetryablePatterns = [
    'permission',
    'unauthorized',
    'forbidden',
    'not-found',
    'already-exists',
    'invalid-argument',
    'failed precondition', // Specific Firebase auth/validation errors
    'unauthenticated'];


    // Check non-retryable first (more specific)
    if (nonRetryablePatterns.some((pattern) => errorMessage.includes(pattern))) {
      return false;
    }

    // Check retryable patterns
    if (retryablePatterns.some((pattern) => errorMessage.includes(pattern))) {
      return true;
    }

    // Default to non-retryable for unknown errors to avoid infinite loops
    return false;
  }

  /**
   * Create an enhanced error with detailed context for save operations
   */
  private createEnhancedSaveError(originalError: Error, projectId: string, operationId: string, attempts: number): Error {
    const errorMessage = originalError.message.toLowerCase();
    let enhancedMessage = '';
    let errorCategory = 'unknown';

    // Categorize errors with specific user-friendly messages
    if (errorMessage.includes('permission') || errorMessage.includes('unauthorized')) {
      errorCategory = 'permission';
      enhancedMessage = `Permission denied: You don't have access to save this project. Please check your login status and try again.`;
    } else if (errorMessage.includes('network') || errorMessage.includes('connection')) {
      errorCategory = 'network';
      enhancedMessage = `Network error: Unable to connect to the server. Please check your internet connection and try again.`;
    } else if (errorMessage.includes('timeout')) {
      errorCategory = 'timeout';
      enhancedMessage = `Operation timeout: The save operation took too long. This may be due to a slow connection or large project size.`;
    } else if (errorMessage.includes('quota') || errorMessage.includes('limit')) {
      errorCategory = 'quota';
      enhancedMessage = `Service limit reached: Please try again in a few minutes or contact support if the issue persists.`;
    } else if (errorMessage.includes('not-found') || errorMessage.includes('project not found')) {
      errorCategory = 'not_found';
      enhancedMessage = `Project not found: The project may have been deleted or you may not have access to it.`;
    } else if (errorMessage.includes('transaction')) {
      errorCategory = 'transaction';
      enhancedMessage = `Data consistency error: Multiple users may be editing simultaneously. Please refresh and try again.`;
    } else if (errorMessage.includes('storage')) {
      errorCategory = 'storage';
      enhancedMessage = `File storage error: ${originalError.message}`;
    } else {
      errorCategory = 'general';
      enhancedMessage = `Save failed: ${originalError.message}`;
    }

    // Add operation context
    const contextMessage = `\\n\\nOperation details:\\n- Project ID: ${projectId}\\n- Operation ID: ${operationId}\\n- Attempts made: ${attempts}\\n- Error category: ${errorCategory}`;

    const error = new Error(enhancedMessage + contextMessage);
    error.name = `SaveProjectError_${errorCategory}`;

    // Add custom properties for programmatic access
    (error as any).operationId = operationId;
    (error as any).projectId = projectId;
    (error as any).errorCategory = errorCategory;
    (error as any).attempts = attempts;
    (error as any).originalError = originalError;

    return error;
  }

  private async ensureFirebaseReady(): Promise<void> {
    if (!firebaseManager.isReady()) {
      debugLog.log('Firebase not ready, initializing...');
      await firebaseManager.initialize();
    }
  }

  private async withErrorHandling<T>(operation: () => Promise<T>, operationName: string): Promise<T> {
    try {
      await this.ensureFirebaseReady();
      return await operation();
    } catch (error) {
      debugLog.error(`Firebase operation failed (${operationName}):`, error);

      // Enhanced error handling for all devices
      const errorMessage = error instanceof Error ? error.message.toLowerCase() : '';

      if (errorMessage.includes('network') || errorMessage.includes('offline')) {
        // Network-related error
        const networkState = networkMonitor.getCurrentState();
        debugLog.log('Network state during error:', networkState);

        if (!networkState?.online) {
          throw new Error('No internet connection. Please check your network and try again.');
        } else if (networkState.effectiveType === 'slow-2g' || networkState.effectiveType === '2g') {
          throw new Error('Slow network connection detected. Please try again or move to a better network area.');
        }
      }

      if (errorMessage.includes('webchannelconnection') || errorMessage.includes('rpc')) {
        throw new Error('Connection to server failed. This may be due to network issues. Please try again.');
      }

      if (errorMessage.includes('quota') || errorMessage.includes('limit')) {
        throw new Error('Service temporarily unavailable. Please try again in a few moments.');
      }

      throw error;
    }
  }

  /**
   * List all projects with their hotspots and timeline events
   */
  async listProjects(): Promise<Project[]> {
    return this.withErrorHandling(async () => {
      // Get current user with bypass support
      const currentUser = this.getCurrentUser();

      this.logUsage('READ_OPERATIONS', 1);
      const db = firebaseManager.getFirestore();
      const projectsRef = collection(db, 'projects');

      // Query projects created by the current user
      const userProjectsQuery = query(
        projectsRef,
        where('createdBy', '==', currentUser.uid),
        orderBy('updatedAt', 'desc')
      );

      const snapshot = await getDocs(userProjectsQuery);

      const projects: Project[] = snapshot.docs.map((docSnap) => {
        const projectData = docSnap.data();

        // Build project object with slide deck data if available
        const project: Project = {
          id: docSnap.id,
          title: projectData['title'] || 'Untitled Project',
          description: projectData['description'] || '',
          createdBy: projectData['createdBy'],
          createdAt: projectData['createdAt']?.toDate?.() || new Date(),
          updatedAt: projectData['updatedAt']?.toDate?.() || new Date(),
          thumbnailUrl: projectData['thumbnailUrl'],
          isPublished: projectData['isPublished'] || false,
          projectType: projectData['projectType'] || 'slide', // Default to slide for new architecture
          interactiveData: projectData['interactiveData'] ?
          { ...projectData['interactiveData'], _needsDetailLoad: true } :
          {
            backgroundImage: projectData['backgroundImage'],
            imageFitMode: projectData['imageFitMode'] || 'cover',
            viewerModes: projectData['viewerModes'] || { explore: true, selfPaced: true, timed: true },
            hotspots: [],
            timelineEvents: [],
            _needsDetailLoad: true
          }
        };

        // Include slide deck if it exists
        if (projectData['slideDeck']) {
          project.slideDeck = projectData['slideDeck'];
          debugLog.log(`[listProjects] Project ${project.id} has slide deck with ${projectData['slideDeck']?.slides?.length || 0} slides`);
        }

        return project;
      });


      debugLog.log(`Loaded ${projects.length} projects for user ${currentUser.uid}`);
      return projects;
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

      if (!projectData) {
        return null;
      }

      // Only return if the project is marked as published
      if (!projectData['isPublished']) {
        return null;
      }

      // Check project type and handle accordingly
      const projectType = projectData['projectType'] || 'hotspot'; // Default to hotspot for backward compatibility

      let slideDeck: any = null;

      // Helper function to build fallback interactiveData from legacy fields
      const buildFallbackInteractiveData = () => ({
        backgroundImage: projectData['backgroundImage'],
        imageFitMode: projectData['imageFitMode'] || 'cover',
        viewerModes: projectData['viewerModes'] || { explore: true, selfPaced: true, timed: true },
        hotspots: [],
        timelineEvents: []
      });

      // Build interactiveData, preferring nested structure with legacy fallback
      const interactiveData: any = projectData['interactiveData'] ?
      { ...projectData['interactiveData'] } :
      buildFallbackInteractiveData();

      if (projectType === 'slide') {
        // For slide-based projects, try to get slide deck data
        if (projectData['slideDeck']) {
          slideDeck = projectData['slideDeck'];
        }
      } else {
        // Always load hotspots and timeline events for public view if not slide-based.
        const [hotspots, timelineEvents] = await Promise.all([
        this.getHotspots(projectId),
        this.getTimelineEvents(projectId)]
        );
        this.logUsage('READ_OPERATIONS_PUBLIC_SUBCOLLECTIONS', 2);
        interactiveData.hotspots = hotspots || [];
        interactiveData.timelineEvents = timelineEvents || [];
      }

      return {
        id: projectDoc.id,
        title: projectData['title'] || 'Untitled Project',
        description: projectData['description'] || '',
        createdBy: projectData['createdBy'],
        createdAt: projectData['createdAt']?.toDate?.() || new Date(),
        updatedAt: projectData['updatedAt']?.toDate?.() || new Date(),
        thumbnailUrl: projectData['thumbnailUrl'],
        isPublished: projectData['isPublished'] || false,
        projectType: projectType,
        interactiveData,
        slideDeck
      } as Project;
    } catch (error) {
      // Only log as error for unexpected errors, not permission/not-found errors
      if (error instanceof Error && (
      error.message.includes('permission-denied') || error.message.includes('Missing or insufficient permissions'))) {
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

      if (!projectData) {
        throw new Error(`Project data is empty for ID ${projectId}.`);
      }

      // Get hotspots and timeline events in parallel
      // These count as additional reads.
      const [hotspots, timelineEvents] = await Promise.all([
      this.getHotspots(projectId), // Counts as 1 read operation (collection query)
      this.getTimelineEvents(projectId) // Counts as 1 read operation (collection query)
      ]);
      this.logUsage('READ_OPERATIONS_DETAILS_SUBCOLLECTIONS', 2);


      let result: Partial<InteractiveModuleState> & {slideDeck?: any;};

      // Prefer the 'interactiveData' field but fall back to legacy fields.
      if (projectData['interactiveData']) {
        result = {
          ...projectData['interactiveData'],
          // IMPORTANT: Subcollection data always overrides interactiveData arrays
          // to maintain single source of truth and prevent data inconsistencies
          hotspots,
          timelineEvents
        };
      } else {
        result = {
          backgroundImage: projectData['backgroundImage'],
          imageFitMode: projectData['imageFitMode'] || 'cover',
          viewerModes: projectData['viewerModes'] || { explore: true, selfPaced: true, timed: true },
          hotspots,
          timelineEvents
        };
      }

      // Add slide deck if it exists in the project data
      if (projectData['slideDeck']) {
        result.slideDeck = projectData['slideDeck'];
        debugLog.log(`[FirebaseAPI] Loaded slide deck for project ${projectId}:`, {
          slideCount: projectData['slideDeck']?.slides?.length || 0,
          totalElements: projectData['slideDeck']?.slides?.reduce((acc: number, slide: any) => acc + (slide.elements?.length || 0), 0) || 0
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
      // Get current user with bypass support
      const currentUser = this.getCurrentUser();
      const db = firebaseManager.getFirestore();

      const projectId = this.generateProjectId();

      // Newly created project will have empty hotspots and timelineEvents by default.
      // The full interactiveData structure is provided here.
      const newProjectData: Project = {
        id: projectId,
        title,
        description,
        createdBy: currentUser.uid, // Add user ID
        createdAt: Timestamp.now().toDate(), // Use Firestore Timestamp for type correctness
        updatedAt: Timestamp.now().toDate(), // Use Firestore Timestamp for type correctness
        interactiveData: { // This is complete for a new project
          hotspots: [], // Empty for new project
          timelineEvents: [], // Empty for new project
          imageFitMode: 'cover',
          viewerModes: { explore: true, selfPaced: true, timed: true } // Added viewerModes with defaults
        }
      };

      // Save to Firestore with flattened structure to match expected schema
      const projectRef = doc(db, 'projects', projectId);
      const { createdAt, updatedAt, interactiveData, ...projectMetadata } = newProjectData;
      await setDoc(projectRef, {
        ...projectMetadata,
        backgroundImage: null, // New projects start with no background image
        imageFitMode: interactiveData?.imageFitMode || 'cover',
        viewerModes: interactiveData?.viewerModes || { explore: true, selfPaced: true, timed: true },
        isPublished: false,
        thumbnailUrl: null, // New projects start with no thumbnail
        createdAt: serverTimestamp(), // Use server-generated timestamps for reliability
        updatedAt: serverTimestamp()
      });

      return newProjectData;
    } catch (error) {
      debugLog.error('Error creating project:', error);
      throw new Error(`Failed to create project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Save/update a project with simplified logic to avoid hanging and timeout issues
   */
  async saveProject(project: Project): Promise<Project> {
    try {







      await this.ensureFirebaseReady();
      const db = firebaseManager.getFirestore();

      // Get current user with bypass support
      const currentUser = this.getCurrentUser();

      // Check if it's a new project
      const isNewProject = project.id === NEW_PROJECT_ID;
      if (isNewProject) {
        project.id = this.generateProjectId();
        project.createdBy = currentUser.uid;

      }

      projectCache.clear();
      const projectRef = doc(db, 'projects', project.id);

      // Log slide deck structure before saving
      if (project.slideDeck) {











      }

      // Simplified save - just save the main project document without complex validation
      const updateData: any = {
        title: project.title,
        description: project.description,
        thumbnailUrl: project.thumbnailUrl || null,
        isPublished: project.isPublished || false,
        projectType: project.projectType || 'slide',
        updatedAt: serverTimestamp(),
        createdBy: project.createdBy || currentUser.uid,
        interactiveData: {
          backgroundImage: project.interactiveData?.backgroundImage || null,
          imageFitMode: project.interactiveData?.imageFitMode || 'cover',
          viewerModes: project.interactiveData?.viewerModes || { explore: true, selfPaced: true, timed: true },
          hotspots: [],
          timelineEvents: []
        }
      };

      // Add slide deck if it exists
      if (project.projectType === 'slide' && project.slideDeck) {
        updateData.slideDeck = project.slideDeck;
        const slideDeckString = JSON.stringify(project.slideDeck);




      }

      // Add createdAt for new projects
      if (isNewProject) {
        updateData.createdAt = serverTimestamp();
      }


      // Sanitize data to remove undefined values before saving
      const sanitizedData = this.sanitizeForFirestore(updateData);

      // Simple save without transaction complexity
      await setDoc(projectRef, sanitizedData, { merge: true });



      return {
        ...project,
        thumbnailUrl: updateData.thumbnailUrl,
        interactiveData: updateData.interactiveData
      };

    } catch (error) {
      console.error('❌ [FirebaseAPI] Save failed for project:', project.id, error);
      throw new Error(`Failed to save project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Recursively sanitize data to remove undefined values for Firestore
   */
  private sanitizeForFirestore(data: any): any {
    if (data === null || data === undefined) {
      return null;
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.sanitizeForFirestore(item)).filter((item) => item !== null && item !== undefined);
    }

    if (typeof data === 'object' && data.constructor === Object) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(data)) {
        const sanitizedValue = this.sanitizeForFirestore(value);
        // Only add to result if the value is not undefined
        if (sanitizedValue !== undefined) {
          sanitized[key] = sanitizedValue;
        }
      }
      return sanitized;
    }

    // Primitive values (string, number, boolean) - return as is unless undefined
    return data === undefined ? null : data;
  }

  /**
   * Delete a project and all its data
   */
  async deleteProject(projectId: string): Promise<{success: boolean;projectId: string;}> {
    try {
      // Get current user with bypass support
      const currentUser = this.getCurrentUser();
      const db = firebaseManager.getFirestore();

      const projectRef = doc(db, 'projects', projectId);
      let thumbnailUrlToDelete: string | null = null;

      // Fetch project data to get thumbnail URL and verify ownership
      const projectSnap = await getDoc(projectRef);
      if (projectSnap.exists()) {
        const projectData = projectSnap.data();
        if (!projectData) {
          throw new Error('Project data is empty');
        }
        if (projectData['createdBy'] !== currentUser.uid) {
          throw new Error('You do not have permission to delete this project');
        }
        thumbnailUrlToDelete = projectData['thumbnailUrl'] || null;
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
        hotspotsSnapshot.docs.forEach((docSnap) => transaction.delete(docSnap.ref));

        const eventsSnapshot = await getDocs(query(eventsColRef)); // Query outside, use refs inside
        eventsSnapshot.docs.forEach((docSnap) => transaction.delete(docSnap.ref));

        transaction.delete(projectRef); // Delete main project document
      });

      debugLog.log(`Project ${projectId} Firestore data deleted successfully via transaction.`);

      if (thumbnailUrlToDelete) {
        debugLog.log(`Attempting to delete thumbnail for deleted project (fire-and-forget): ${thumbnailUrlToDelete}`);
        this._deleteImageFromStorage(thumbnailUrlToDelete).catch((err) => {
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
      // Get current user with bypass support
      const currentUser = this.getCurrentUser();

      // Validate file before upload
      if (!file || file.size === 0) {
        throw new Error('Invalid file: File is empty or corrupted');
      }

      // Generate unique filename with timestamp and random suffix
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `images/${currentUser.uid}/${timestamp}_${randomSuffix}_${sanitizedName}`;

      const storage = firebaseManager.getStorage();
      const imageRef = ref(storage, fileName);

      debugLog.log(`Uploading image: ${fileName} (${file.size} bytes, type: ${file.type})`);

      // Create upload task with metadata for better tracking
      const metadata = {
        contentType: file.type,
        customMetadata: {
          projectId: projectId || 'general',
          uploadedAt: new Date().toISOString(),
          userId: currentUser.uid,
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
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const downloadURL = await getDownloadURL(snapshot.ref);
          debugLog.log('Image uploaded successfully:', downloadURL);
          return downloadURL;
        } catch (urlError) {
          debugLog.warn(`Attempt ${attempt} to get download URL failed:`, urlError);
          if (attempt === 3) {
            throw new Error(`Failed to get download URL after 3 attempts: ${urlError}`);
          }
          await new Promise((resolve) => {setTimeout(resolve, 1000 * attempt);});
        }
      }
      throw new Error('Failed to get download URL after all attempts.');
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
      // Get current user with bypass support
      const currentUser = this.getCurrentUser();

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
          ownerId: currentUser.uid, // Required by storage rules
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
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const downloadURL = await getDownloadURL(snapshot.ref);
          debugLog.log('Thumbnail uploaded successfully:', downloadURL);
          return downloadURL;
        } catch (urlError) {
          debugLog.warn(`Download URL attempt ${attempt} failed:`, urlError);
          if (attempt === 3) {
            throw new Error(`Failed to get thumbnail download URL after 3 attempts: ${urlError}`);
          }
          await new Promise((resolve) => {setTimeout(resolve, 1000 * attempt);});
        }
      }
      throw new Error('Failed to get thumbnail download URL after all attempts.');
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
  projectId?: string)
  : Promise<string> {
    return new Promise((resolve, reject) => {
      // Get current user with bypass support
      let currentUser;
      try {
        currentUser = this.getCurrentUser();
      } catch (error) {
        reject(error);
        return;
      }

      if (!file || file.size === 0) {
        reject(new Error('Invalid file: File is empty or corrupted'));
        return;
      }

      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `uploads/${currentUser.uid}/${timestamp}_${randomSuffix}_${sanitizedName}`;

      const storage = firebaseManager.getStorage();
      const fileRef = ref(storage, fileName);

      const metadata = {
        contentType: file.type,
        customMetadata: {
          projectId: projectId || 'general',
          uploadedAt: new Date().toISOString(),
          userId: currentUser.uid,
          originalName: file.name
        }
      };

      const uploadTask = uploadBytesResumable(fileRef, file, metadata);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = snapshot.bytesTransferred / snapshot.totalBytes * 100;
          onProgress(progress);
        },
        (error) => {
          debugLog.error('Error uploading file:', error);
          reject(new Error(`Failed to upload file: ${(error as Error).message}`));
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            debugLog.log('File uploaded successfully:', downloadURL);
            resolve(downloadURL);
          } catch (error) {
            debugLog.error('Error getting download URL:', error);
            reject(new Error(`Failed to get download URL: ${(error as Error).message}`));
          }
        }
      );
    });
  }

  /**
   * Get hotspots for a project
   */
  private async getHotspots(projectId: string): Promise<HotspotData[]> {
    return this.withErrorHandling(async () => {




      const db = firebaseManager.getFirestore();


      const hotspotsRef = collection(db, 'projects', projectId, 'hotspots');


      const snapshot = await getDocs(hotspotsRef);


      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return DataSanitizer.sanitizeHotspot({
          id: doc.id,
          ...data
        }) as HotspotData;
      });
    }, 'getHotspots');
  }

  /**
   * Get timeline events for a project
   */
  private async getTimelineEvents(projectId: string): Promise<TimelineEventData[]> {
    return this.withErrorHandling(async () => {




      const db = firebaseManager.getFirestore();


      const eventsRef = collection(db, 'projects', projectId, 'timeline_events');


      const snapshot = await getDocs(query(eventsRef, orderBy('step', 'asc')));


      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return DataSanitizer.sanitizeTimelineEvent({
          id: doc.id,
          ...data
        }) as TimelineEventData;
      });
    }, 'getTimelineEvents');
  }

  /**
   * Clean up orphaned subcollection documents that are no longer needed
   * This runs as a separate transaction after the main save to prevent data loss
   */
  private async cleanupOrphanedSubcollectionDocs(
  projectId: string,
  currentHotspotIds: string[],
  currentEventIds: string[])
  : Promise<void> {
    try {
      const db = firebaseManager.getFirestore();
      const hotspotsColRef = collection(db, 'projects', projectId, 'hotspots');
      const eventsColRef = collection(db, 'projects', projectId, 'timeline_events');

      // Get all existing documents
      const [existingHotspotsSnap, existingEventsSnap] = await Promise.all([
      getDocs(query(hotspotsColRef)),
      getDocs(query(eventsColRef))]
      );

      const currentHotspotIdSet = new Set(currentHotspotIds);
      const currentEventIdSet = new Set(currentEventIds);

      // Find orphaned documents
      const existingHotspotIds = existingHotspotsSnap.docs.map((doc) => doc.id);
      const existingEventIds = existingEventsSnap.docs.map((doc) => doc.id);

      const orphanedHotspotRefs = existingHotspotsSnap.docs.
      filter((doc) => !currentHotspotIdSet.has(doc.id)).
      map((doc) => doc.ref);

      const orphanedEventRefs = existingEventsSnap.docs.
      filter((doc) => !currentEventIdSet.has(doc.id)).
      map((doc) => doc.ref);

      debugLog.log(`[FirebaseAPI] Cleanup analysis for project ${projectId}:`, {
        existingHotspots: existingHotspotIds,
        currentHotspots: currentHotspotIds,
        orphanedHotspots: orphanedHotspotRefs.map((ref) => ref.id),
        existingEvents: existingEventIds,
        currentEvents: currentEventIds,
        orphanedEvents: orphanedEventRefs.map((ref) => ref.id)
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
          batch.forEach((ref) => transaction.delete(ref));
        });

        debugLog.log(`[FirebaseAPI] Deleted batch of ${batch.length} orphaned documents:`,
        batch.map((ref) => ref.id));
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
    debugLog.log(`Skipping clear operation for project ${projectId} - using upsert instead`);
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
      // Get current user with bypass support
      const currentUser = this.getCurrentUser();
      const db = firebaseManager.getFirestore();

      const projectRef = doc(db, 'projects', projectId);
      const projectSnap = await getDoc(projectRef);

      if (!projectSnap.exists()) {
        throw new Error('Project not found');
      }

      const projectData = projectSnap.data();
      if (!projectData) {
        throw new Error('Project data is empty');
      }
      if (projectData['createdBy'] !== currentUser.uid) {
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
          timelineEvents: []
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
      // Get current user with bypass support
      const currentUser = this.getCurrentUser();
      const db = firebaseManager.getFirestore();

      const projectRef = doc(db, 'projects', projectId);
      const projectSnap = await getDoc(projectRef);

      if (!projectSnap.exists()) {
        throw new Error('Project not found');
      }

      const projectData = projectSnap.data();
      if (!projectData) {
        throw new Error('Project data is empty');
      }
      if (projectData['createdBy'] !== currentUser.uid) {
        throw new Error('You do not have permission to update this project');
      }

      await setDoc(projectRef, { isPublished, updatedAt: serverTimestamp() }, { merge: true });
      debugLog.log(`Project ${projectId} published status updated to ${isPublished}`);
    } catch (error) {
      debugLog.error(`Error updating project published status for ${projectId}:`, error);
      throw new Error(`Failed to update project published status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async saveSlideDeck(userId: string, slideDeck: SlideDeck): Promise<void> {
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
      if (!projectData) {
        throw new Error("Project data is empty.");
      }
      if (projectData['createdBy'] !== userId) {
        throw new Error("User does not have permission to save this slide deck.");
      }

      transaction.update(projectRef, {
        slideDeck: slideDeck,
        updatedAt: serverTimestamp()
      });
    });
  }

  async loadSlideDeck(userId: string, projectId: string): Promise<SlideDeck | null> {
    if (!userId || !projectId) {
      throw new Error("Invalid input for loading slide deck.");
    }

    const projectRef = doc(firebaseManager.getFirestore(), 'projects', projectId);
    const projectDoc = await getDoc(projectRef);

    if (!projectDoc.exists()) {
      return null;
    }

    const projectData = projectDoc.data();
    if (!projectData) {
      return null;
    }
    if (projectData['createdBy'] !== userId) {
      throw new Error("User does not have permission to load this slide deck.");
    }

    return projectData['slideDeck'] || null;
  }
}

// Export singleton instance
export const firebaseAPI = new FirebaseProjectAPI();