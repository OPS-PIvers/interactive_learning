# Hotspot Memory Leak Fix Plan

## Problem Analysis

The hotspot disappearing issue is caused by several interconnected problems in the data persistence and loading system:

### 1. **Data Loading Issue (Primary Cause)**
- In `App.tsx`, the condition `!project.interactiveData.hotspots || !project.interactiveData.timelineEvents` fails to trigger `getProjectDetails()`
- `listProjects()` returns projects with empty arrays `[]` for hotspots and timelineEvents
- Empty arrays are truthy in JavaScript, so `![]` evaluates to `false`
- Result: Detailed data is never loaded when editing/viewing modules

### 2. **Transaction Race Condition**
- In `firebaseApi.ts` `saveProject()`, queries for existing documents happen OUTSIDE the transaction
- Document deletion and creation happen INSIDE the transaction
- This creates a gap where the state could change between query and transaction execution

### 3. **Dangerous Delete-Then-Recreate Pattern**
- Current save logic deletes ALL existing hotspots and events, then recreates them
- If recreation fails, data is permanently lost
- No rollback mechanism for partial failures

## Fix Implementation

### File 1: `src/client/components/App.tsx`

**Location**: Line ~35-45 in `loadProjectDetailsAndOpen` function

**Current Code**:
```typescript
if (!project.interactiveData.hotspots || !project.interactiveData.timelineEvents) {
```

**Replace With**:
```typescript
// Fix: Check for empty arrays properly - empty arrays are truthy but we want to load details if they're empty
const needsDetailLoad = !project.interactiveData.hotspots || 
                       !project.interactiveData.timelineEvents ||
                       project.interactiveData.hotspots.length === 0 || 
                       project.interactiveData.timelineEvents.length === 0;

if (needsDetailLoad) {
```

### File 2: `src/lib/firebaseApi.ts`

**Location**: Line ~180-320 in `saveProject()` method

**Current Transaction Logic (REPLACE ENTIRELY)**:
```typescript
await runTransaction(db, async (transaction) => {
  // ... existing code until line where subcollections are handled ...
  
  // REPLACE THE ENTIRE SUBCOLLECTION HANDLING SECTION WITH:
  
  const sanitizedHotspots = DataSanitizer.sanitizeHotspots(project.interactiveData.hotspots);
  const sanitizedEvents = DataSanitizer.sanitizeTimelineEvents(project.interactiveData.timelineEvents);

  const hotspotsColRef = collection(db, 'projects', project.id, 'hotspots');
  const eventsColRef = collection(db, 'projects', project.id, 'timeline_events');

  // NEW APPROACH: Use upsert logic instead of delete-then-recreate
  
  // 1. Get existing documents within the transaction for consistency
  const existingHotspotsQuery = query(hotspotsColRef);
  const existingEventsQuery = query(eventsColRef);
  
  // Note: We'll use a different approach since getDocs() can't be used in transactions
  // Instead, we'll track which documents we're updating and delete orphans afterward
  
  const currentHotspotIds = new Set(sanitizedHotspots.map(h => h.id));
  const currentEventIds = new Set(sanitizedEvents.map(e => e.id));
  
  // 2. Upsert current hotspots and events
  for (const hotspot of sanitizedHotspots) {
    const hotspotRef = doc(hotspotsColRef, hotspot.id!);
    transaction.set(hotspotRef, { ...hotspot, updatedAt: serverTimestamp() });
  }

  for (const event of sanitizedEvents) {
    const eventRef = doc(eventsColRef, event.id!);
    transaction.set(eventRef, { ...event, updatedAt: serverTimestamp() });
  }
  
  // 3. Mark for cleanup - we'll handle orphan deletion in a separate transaction
  // This prevents data loss if the main transaction fails
});

// 4. Clean up orphaned documents in a separate transaction (after main save succeeds)
// This is safer than doing it in the same transaction
try {
  await this.cleanupOrphanedSubcollectionDocs(project.id, 
    sanitizedHotspots.map(h => h.id!), 
    sanitizedEvents.map(e => e.id!)
  );
} catch (cleanupError) {
  console.warn('Cleanup of orphaned documents failed, but main save succeeded:', cleanupError);
  // Don't throw - main save was successful
}
```

### File 3: `src/lib/firebaseApi.ts` (New Method)

**Location**: Add new private method after existing methods

**Add New Method**:
```typescript
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
    
    console.log(`Cleaning up ${allOrphanedRefs.length} orphaned documents for project ${projectId}`);
    
    // Process in batches of 400 to stay under Firestore's 500 operation limit
    const batchSize = 400;
    for (let i = 0; i < allOrphanedRefs.length; i += batchSize) {
      const batch = allOrphanedRefs.slice(i, i + batchSize);
      
      await runTransaction(db, async (transaction) => {
        batch.forEach(ref => transaction.delete(ref));
      });
    }
    
    console.log(`Successfully cleaned up orphaned documents for project ${projectId}`);
    
  } catch (error) {
    console.error(`Error cleaning up orphaned documents for project ${projectId}:`, error);
    // Don't throw - this is cleanup, not critical for data integrity
  }
}
```

### File 4: `src/lib/firebaseApi.ts` (Error Handling Improvement)

**Location**: Line ~50-90 in `listProjects()` method

**Current Code**:
```typescript
hotspots: [], // Will be loaded on demand
timelineEvents: [] // Will be loaded on demand
```

**Replace With**:
```typescript
hotspots: [], // Will be loaded on demand - explicitly empty for loading detection
timelineEvents: [], // Will be loaded on demand - explicitly empty for loading detection
_needsDetailLoad: true // Flag to indicate this project needs detail loading
```

### File 5: `src/client/components/App.tsx` (Enhanced Loading Logic)

**Location**: Line ~35-45 in `loadProjectDetailsAndOpen` function

**Enhanced Loading Logic**:
```typescript
const loadProjectDetailsAndOpen = useCallback(async (project: Project, editingMode: boolean) => {
  if (!user) {
    setShowAuthModal(true);
    return;
  }

  setIsProjectDetailsLoading(true);
  setError(null);
  try {
    // Enhanced condition to properly detect when details need loading
    const needsDetailLoad = !project.interactiveData.hotspots || 
                           !project.interactiveData.timelineEvents ||
                           project.interactiveData.hotspots.length === 0 || 
                           project.interactiveData.timelineEvents.length === 0 ||
                           (project as any)._needsDetailLoad;

    if (needsDetailLoad) {
      console.log(`Fetching details for project: ${project.id} (${project.title})`);
      const details = await appScriptProxy.getProjectDetails(project.id) as InteractiveModuleState;
      
      // Validate that we actually got data
      if (!details.hotspots && !details.timelineEvents) {
        console.warn(`No details returned for project ${project.id}, using empty data`);
      }
      
      const updatedProject = {
        ...project,
        interactiveData: {
          ...project.interactiveData,
          hotspots: details.hotspots || [],
          timelineEvents: details.timelineEvents || [],
          backgroundImage: details.backgroundImage !== undefined ? details.backgroundImage : project.interactiveData.backgroundImage,
          imageFitMode: details.imageFitMode || project.interactiveData.imageFitMode,
        }
      };
      
      // Remove the loading flag
      delete (updatedProject as any)._needsDetailLoad;
      
      setSelectedProject(updatedProject);
      setProjects(prevProjects => prevProjects.map(p => p.id === updatedProject.id ? updatedProject : p));
    } else {
      console.log(`Project ${project.id} already has details loaded`);
      setSelectedProject(project);
    }
    setIsEditingMode(editingMode);
    setIsModalOpen(true);
  } catch (err: any) {
    console.error(`Failed to load project details for ${project.id}:`, err);
    setError(`Could not load project details: ${err.message || 'Please try again.'}`);
    setSelectedProject(null);
  } finally {
    setIsProjectDetailsLoading(false);
  }
}, [user]);
```

### File 6: `src/client/components/InteractiveModule.tsx` (Validation Enhancement)

**Location**: Line ~200-250 in `handleSave` function

**Add Before Save Operation**:
```typescript
const handleSave = useCallback(async () => {
  if (isSaving) {
    console.log('Save already in progress, skipping...');
    return;
  }
  
  setIsSaving(true);
  console.log('=== SAVE DEBUG ===');
  
  const currentData = {
    backgroundImage,
    backgroundType,
    backgroundVideoType,
    hotspots,
    timelineEvents,
    imageFitMode
  };
  
  // Enhanced validation
  if (!Array.isArray(currentData.hotspots)) {
    console.error('Invalid hotspots data:', currentData.hotspots);
    alert('Invalid hotspot data detected. Please refresh and try again.');
    setIsSaving(false);
    return;
  }
  
  if (!Array.isArray(currentData.timelineEvents)) {
    console.error('Invalid timeline events data:', currentData.timelineEvents);
    alert('Invalid timeline data detected. Please refresh and try again.');
    setIsSaving(false);
    return;
  }
  
  // NEW: Validate hotspot data integrity
  const invalidHotspots = currentData.hotspots.filter(h => 
    !h.id || typeof h.x !== 'number' || typeof h.y !== 'number' || !h.title
  );
  
  if (invalidHotspots.length > 0) {
    console.error('Found invalid hotspots:', invalidHotspots);
    alert(`Found ${invalidHotspots.length} invalid hotspot(s). Please check your hotspot data and try again.`);
    setIsSaving(false);
    return;
  }
  
  console.log('Saving data:', {
    hotspotsCount: currentData.hotspots.length,
    timelineEventsCount: currentData.timelineEvents.length,
    hotspotIds: currentData.hotspots.map(h => h.id),
    hotspotPositions: currentData.hotspots.map(h => ({ id: h.id, x: h.x, y: h.y })),
    backgroundImagePresent: !!currentData.backgroundImage
  });
  
  // ... rest of existing save logic
```

## Testing Instructions

After implementing these fixes:

1. **Create a test project** with hotspots
2. **Save the project** and verify hotspots persist
3. **Close and reopen** the project in edit mode
4. **Verify hotspots are still there** and positioned correctly
5. **Add new hotspots** and save again
6. **Test the view mode** to ensure hotspots display properly

## Migration Strategy

1. **Deploy the App.tsx fix first** - this will immediately fix the loading issue for existing projects
2. **Deploy the firebaseApi.ts changes** - this will fix the save issue for new saves
3. **Monitor logs** for any cleanup warnings or errors
4. **Verify existing projects** still load correctly

## Expected Outcome

- ✅ Hotspots will persist after saving
- ✅ Hotspots will load correctly when reopening modules
- ✅ No data loss during save operations
- ✅ Better error handling and debugging information
- ✅ Backward compatibility with existing projects

## Rollback Plan

If issues occur:
1. **Revert App.tsx changes first** to restore previous loading behavior
2. **Revert firebaseApi.ts changes** if save issues persist
3. **Check Firestore logs** for any transaction failures
4. **Verify database integrity** using Firebase console

## Additional Monitoring

Add these console logs to monitor the fix:
- "Loading project details for [projectId]" - confirms detail loading is triggered
- "Save successful with [X] hotspots" - confirms save is working
- "Cleanup completed for [X] orphaned docs" - confirms cleanup is working