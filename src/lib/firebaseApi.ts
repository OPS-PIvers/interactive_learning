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
  where
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { db, storage } from './firebaseConfig'
import { Project, HotspotData, TimelineEventData, InteractiveModuleState } from '../shared/types'

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
      
      // Update main project document
      batch.set(projectRef, {
        title: project.title,
        description: project.description,
        thumbnailUrl: project.thumbnailUrl || null,
        backgroundImage: project.interactiveData.backgroundImage || null,
        imageFitMode: project.interactiveData.imageFitMode || 'cover',
        updatedAt: serverTimestamp()
      }, { merge: true })
      
      // Get existing subcollection documents to determine what to delete vs update
      const [existingHotspots, existingEvents] = await Promise.all([
        getDocs(collection(db, 'projects', project.id, 'hotspots')),
        getDocs(collection(db, 'projects', project.id, 'timeline_events'))
      ])
      
      // Track which documents we're keeping
      const newHotspotIds = new Set(project.interactiveData.hotspots.map(h => h.id))
      const newEventIds = new Set(project.interactiveData.timelineEvents.map(e => e.id))
      
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
      for (const hotspot of project.interactiveData.hotspots) {
        const hotspotRef = doc(db, 'projects', project.id, 'hotspots', hotspot.id)
        batch.set(hotspotRef, {
          ...hotspot,
          updatedAt: serverTimestamp()
        })
      }
      
      // Add/update timeline events
      for (const event of project.interactiveData.timelineEvents) {
        const eventRef = doc(db, 'projects', project.id, 'timeline_events', event.id)
        batch.set(eventRef, {
          ...event,
          updatedAt: serverTimestamp()
        })
      }
      
      await batch.commit()
      
      console.log(`Project ${project.id} saved successfully with ${project.interactiveData.hotspots.length} hotspots`)
      return project
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
}

// Export singleton instance
export const firebaseAPI = new FirebaseProjectAPI()