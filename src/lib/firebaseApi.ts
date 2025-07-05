import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc,
  query,
  orderBy,
  writeBatch,
  serverTimestamp,
  where,
  getDoc
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { db, storage } from './firebaseConfig'
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
      console.log('Using cached projects data')
      return cached.data
    }

    try {
      this.logUsage('READ_OPERATIONS', 1)
      const projectsRef = collection(db, 'projects')
      const snapshot = await getDocs(query(projectsRef, orderBy('updatedAt', 'desc')))
      
      const projects = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const projectData = docSnap.data()
          
          // Get hotspots and timeline events in parallel
          const [hotspots, timelineEvents] = await Promise.all([
            this.getHotspots(docSnap.id),
            this.getTimelineEvents(docSnap.id)
          ])
          
          return {
            id: docSnap.id,
            title: projectData.title || 'Untitled Project',
            description: projectData.description || '',
            thumbnailUrl: projectData.thumbnailUrl,
            interactiveData: {
              backgroundImage: projectData.backgroundImage,
              hotspots,
              timelineEvents,
              imageFitMode: projectData.imageFitMode || 'cover'
            }
          } as Project
        })
      )
      
      // Cache the results
      projectCache.set(cacheKey, { data: projects, timestamp: Date.now() })
      
      return projects
    } catch (error) {
      console.error('Error listing projects:', error)
      throw new Error(`Failed to load projects: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Create a new project
   */
  async createProject(title: string, description: string): Promise<Project> {
    try {
      const projectId = `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
      
      const newProject: Project = {
        id: projectId,
        title,
        description,
        thumbnailUrl: undefined,
        interactiveData: {
          backgroundImage: undefined,
          hotspots: [],
          timelineEvents: [],
          imageFitMode: 'cover'
        }
      }
      
      // Save to Firestore
      const projectRef = doc(db, 'projects', projectId)
      await setDoc(projectRef, {
        title,
        description,
        thumbnailUrl: null,
        backgroundImage: null,
        imageFitMode: 'cover',
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
    projectCache.clear()
    
    try {
      this.logUsage('WRITE_OPERATIONS', 1)
      const batch = writeBatch(db)
      const projectRef = doc(db, 'projects', project.id)

      // Fetch existing project data to compare backgroundImage and get old thumbnailUrl
      const existingDocSnap = await getDoc(projectRef);
      const existingData = existingDocSnap.data();
      const existingBackgroundImage = existingData?.backgroundImage;
      const existingThumbnailUrl = existingData?.thumbnailUrl;

      let finalThumbnailUrl = existingThumbnailUrl || null; // Start with the current thumbnail URL
      const newBackgroundImage = project.interactiveData.backgroundImage;

      let oldThumbnailShouldBeDeleted = false;

      if (newBackgroundImage && newBackgroundImage !== existingBackgroundImage) {
        // Case 1: Background image is present and has changed (or is new)
        console.log(`Background image changed for project ${project.id}. Regenerating thumbnail.`);
        if (existingThumbnailUrl) {
          oldThumbnailShouldBeDeleted = true; // Mark old one for deletion if new one succeeds
        }
        try {
          const thumbnailBlob = await generateThumbnail(
            newBackgroundImage, THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT, THUMBNAIL_FORMAT, THUMBNAIL_QUALITY
          );
          const fileExtension = THUMBNAIL_FORMAT === 'image/jpeg' ? 'jpg' : THUMBNAIL_FORMAT === 'image/webp' ? 'webp' : 'dat';
          const thumbnailFile = new File(
            [thumbnailBlob], `${THUMBNAIL_FILE_PREFIX}${project.id}.${fileExtension}`, { type: THUMBNAIL_FORMAT }
          );
          finalThumbnailUrl = await this.uploadImage(thumbnailFile, project.id + THUMBNAIL_POSTFIX);
          console.log(`New thumbnail uploaded: ${finalThumbnailUrl}`);
        } catch (thumbError) {
          console.error(`Failed to generate/upload new thumbnail for ${project.id}:`, thumbError);
          finalThumbnailUrl = existingThumbnailUrl || null; // Revert to old if new one fails
          oldThumbnailShouldBeDeleted = false; // Don't delete the old one if new one failed
        }
      } else if (!newBackgroundImage && existingBackgroundImage) {
        // Case 2: Background image has been removed
        console.log(`Background image removed for project ${project.id}. Clearing and marking old thumbnail for deletion.`);
        if (existingThumbnailUrl) {
          oldThumbnailShouldBeDeleted = true;
        }
        finalThumbnailUrl = null;
      }
      // Case 3: Background image unchanged (newBackgroundImage === existingBackgroundImage)
      // Case 4: No background image initially and still no background image
      // In both Case 3 and 4, finalThumbnailUrl remains as existingThumbnailUrl, and no deletion is needed.

      // Firestore batch update
      batch.set(projectRef, {
        title: project.title,
        description: project.description,
        thumbnailUrl: finalThumbnailUrl,
        backgroundImage: newBackgroundImage || null,
        imageFitMode: project.interactiveData.imageFitMode || 'cover',
        updatedAt: serverTimestamp()
      }, { merge: true });

      // Subcollection updates (hotspots, timeline_events)
      const sanitizedHotspots = DataSanitizer.sanitizeHotspots(project.interactiveData.hotspots);
      const sanitizedEvents = DataSanitizer.sanitizeTimelineEvents(project.interactiveData.timelineEvents);
      
      // Get existing subcollection documents to determine what to delete vs update
      const [existingHotspots, existingEvents] = await Promise.all([
        getDocs(collection(db, 'projects', project.id, 'hotspots')),
        getDocs(collection(db, 'projects', project.id, 'timeline_events'))
      ])
      
      // Track which documents we're keeping
      const newHotspotIds = new Set(sanitizedHotspots.map(h => h.id!))
      const newEventIds = new Set(sanitizedEvents.map(e => e.id!))
      
      // Delete hotspots that are no longer in the project
      existingHotspots.docs.forEach(doc => {
        if (!newHotspotIds.has(doc.id)) {
          batch.delete(doc.ref)
        }
      })
      
      // Delete events that are no longer in the project
      existingEvents.docs.forEach(doc => {
        if (!newEventIds.has(doc.id)) {
          batch.delete(doc.ref)
        }
      })
      
      // Add/update hotspots
      for (const hotspot of sanitizedHotspots) {
        const hotspotRef = doc(db, 'projects', project.id, 'hotspots', hotspot.id!)
        batch.set(hotspotRef, {
          ...hotspot,
          updatedAt: serverTimestamp()
        })
      }
      
      // Add/update timeline events
      for (const event of sanitizedEvents) {
        const eventRef = doc(db, 'projects', project.id, 'timeline_events', event.id!)
        batch.set(eventRef, {
          ...event,
          updatedAt: serverTimestamp()
        })
      }
      
      await batch.commit()

      // After batch commit is successful, attempt to delete the old thumbnail if marked
      if (oldThumbnailShouldBeDeleted && existingThumbnailUrl) {
        console.log(`Attempting to delete old thumbnail: ${existingThumbnailUrl}`);
        // Non-blocking call as per suggestion
        this._deleteImageFromStorage(existingThumbnailUrl).catch(err => {
            console.error("Error during fire-and-forget deletion of old thumbnail:", err);
        });
      }
      
      console.log(`Project ${project.id} saved successfully with ${sanitizedHotspots.length} hotspots and thumbnail URL: ${finalThumbnailUrl}`);
      // Return the project with the potentially updated thumbnail URL
      return { ...project, thumbnailUrl: finalThumbnailUrl };

    } catch (error) {
      console.error('Error saving project:', error)
      throw new Error(`Failed to save project: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Delete a project and all its data
   */
  async deleteProject(projectId: string): Promise<{ success: boolean; projectId: string }> {
    try {
      const batch = writeBatch(db)
      
      // Delete hotspots
      const hotspotsSnapshot = await getDocs(collection(db, 'projects', projectId, 'hotspots'))
      hotspotsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref)
      })
      
      // Delete timeline events
      const eventsSnapshot = await getDocs(collection(db, 'projects', projectId, 'timeline_events'))
      eventsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref)
      })
      
      // Delete main project
      batch.delete(doc(db, 'projects', projectId))
      
      await batch.commit()
      
      console.log(`Project ${projectId} deleted successfully`)
      return { success: true, projectId }
    } catch (error) {
      console.error('Error deleting project:', error)
      throw new Error(`Failed to delete project: ${error instanceof Error ? error.message : 'Unknown error'}`)
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