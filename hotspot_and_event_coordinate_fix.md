  Key Findings:

  Issue 1: Viewport vs Image-Relative Coordinates

  The getActualImageVisibleBounds function currently returns viewport coordinates (includes containerRect.left + offsetX), which change
  when switching between mobile/desktop. We need container-relative coordinates instead.

  Issue 2: Event Coordinate Inheritance

  Your suggestion is highly feasible! Events are already linked to hotspots via targetId, and some overlay components already fall back to
  hotspot coordinates. This would eliminate coordinate duplication and sync issues.

  Issue 3: Firebase Scope Error

  Simple scope issue - variables defined inside transaction block but accessed outside it.
                                                                                                                           
●User approved Claude's plan:
  ⎿  Updated Comprehensive Fix Plan

     Phase 1: Fix Firebase Scope Error (Critical - Prevents Saves)

     - Move sanitizedHotspots and sanitizedEvents declarations outside transaction block in firebaseApi.ts
     - Ensure cleanup section can access these variables properly

     Phase 2: Create Image-Relative Coordinate System

     - Create new getActualImageVisibleBoundsRelative() function that returns container-relative coordinates (not viewport)
     - Update coordinate system to be based off <img> bounds specifically:
       - Desktop: Pixel coordinates relative to image content area (not viewport)  
       - Mobile: Percentage coordinates relative to image content area
     - Add enhanced boundary validation to ensure hotspots never land outside image boundaries
     - Replace viewport-dependent positioning with image-content-dependent positioning

     Phase 3: Implement Event Coordinate Inheritance

     - Make event coordinates (targetX, targetY, spotlightX, spotlightY) optional in TimelineEventData
     - Update all event overlay components to resolve coordinates dynamically from hotspots at execution time:
       - Events inherit exact coordinates from their linked hotspots via targetId
       - Fallback to stored coordinates for backward compatibility
     - Remove coordinate copying logic from editor components
     - This ensures events always target the exact same location as their associated hotspots

     Phase 4: Enhanced Coordinate Validation

     - Add strict image boundary clamping: coordinates get clamped to stay within image content area
     - Create unified coordinate transformation utilities
     - Ensure consistent behavior across mobile/desktop viewport changes

     Benefits of This Approach:

     1. Eliminates positioning inconsistencies - hotspots appear in same image location regardless of screen size
     2. Perfect event alignment - events inherit hotspot coordinates dynamically  
     3. Respects image boundaries - hotspots never appear in letterboxed areas
     4. Container-relative positioning - coordinates based off image content, not viewport
     5. Maintains mobile/desktop differences - mobile uses %, desktop uses pixels, both image-relative