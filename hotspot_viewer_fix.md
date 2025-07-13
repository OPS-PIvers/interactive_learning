# Hotspot Viewer Positioning Bug Fix Implementation Plan

## Issue Summary
When viewing a module, hotspots are pinned to a single horizontal plane at the bottom of the image, ignoring their saved vertical (y-axis) positions. The horizontal (x-axis) positioning works correctly, but the vertical positioning is incorrect.

## Root Cause Analysis
The bug occurs due to differences in how image bounds are calculated between editor and viewer modes:
- **Editor mode**: Uses an actual `<img>` element with proper bounds calculation
- **Viewer mode**: Uses a `<div>` with `background-image`, and the bounds calculation for the y-axis is incorrect

## Implementation Plan

### 1. Fix Image Bounds Calculation in Viewer Mode
**File**: `src/client/components/InteractiveModule.tsx`

Locate the `getImageBounds` function and fix the viewer mode calculation. The issue is likely in the section that handles `!isEditing`:

```typescript
// Current problematic code around line 1000-1100
} else if (!isEditing) {
  // Viewer mode: Calculate bounds based on background-image positioning
  
  // ... existing code ...
  
  // The issue is likely here - the calculation for content positioning
  // is not correctly accounting for the actual rendered image position
}
```

**Fix**: Update the bounds calculation to properly account for the background-image positioning:

```typescript
} else if (!isEditing) {
  // Viewer mode: Calculate bounds based on background-image positioning
  
  // Use cached bounds if available and transform is active to prevent feedback loops
  if (originalImageBoundsRef.current && lastAppliedTransformRef.current.scale > 1) {
    return originalImageBoundsRef.current;
  }

  // Get the actual scaled div element bounds
  if (!scaledImageDivRef.current) return null;
  
  const scaledDivRect = scaledImageDivRef.current.getBoundingClientRect();
  const containerRect = imageContainerRef.current.getBoundingClientRect();
  
  // Get the div's configured dimensions
  const divDimensions = getScaledImageDivDimensions();
  const containerAspect = divDimensions.width / divDimensions.height;
  const imageAspect = imageNaturalDimensions.width / imageNaturalDimensions.height;

  let contentWidth, contentHeight, contentLeft = 0, contentTop = 0;

  // Calculate content area based on fit mode
  if (imageFitMode === 'cover') {
    if (containerAspect > imageAspect) {
      contentWidth = divDimensions.width;
      contentHeight = contentWidth / imageAspect;
      contentTop = (divDimensions.height - contentHeight) / 2;
    } else {
      contentHeight = divDimensions.height;
      contentWidth = contentHeight * imageAspect;
      contentLeft = (divDimensions.width - contentWidth) / 2;
    }
  } else if (imageFitMode === 'contain') {
    if (containerAspect > imageAspect) {
      contentHeight = divDimensions.height;
      contentWidth = contentHeight * imageAspect;
      contentLeft = (divDimensions.width - contentWidth) / 2;
    } else {
      contentWidth = divDimensions.width;
      contentHeight = contentWidth / imageAspect;
      contentTop = (divDimensions.height - contentHeight) / 2;
    }
  } else { // fill
    contentWidth = divDimensions.width;
    contentHeight = divDimensions.height;
  }

  // Calculate the actual position of the scaled div within the container
  const divLeft = scaledDivRect.left - containerRect.left;
  const divTop = scaledDivRect.top - containerRect.top;

  const bounds = {
    width: contentWidth,
    height: contentHeight,
    left: divLeft + contentLeft,
    top: divTop + contentTop,
    absoluteLeft: scaledDivRect.left + contentLeft,
    absoluteTop: scaledDivRect.top + contentTop
  };

  // Cache the original bounds for viewer mode
  originalImageBoundsRef.current = bounds;
  return bounds;
}
```

### 2. Debug Positioning for Mobile Viewer
Add temporary debug logging to verify the calculations:

```typescript
// In getHotspotPixelPosition function, add debug logging
const getHotspotPixelPosition = useCallback((hotspot: HotspotData, transform?: ImageTransformState) => {
  const imageBounds = getSafeImageBounds();
  if (!imageBounds) return null;

  // Add debug logging
  if (!isEditing && debugMode) {
    console.log('Hotspot positioning debug:', {
      hotspotId: hotspot.id,
      hotspotPercentages: { x: hotspot.x, y: hotspot.y },
      imageBounds,
      containerDimensions: !isEditing ? getScaledImageDivDimensions() : null
    });
  }

  // ... rest of the function
}, [getSafeImageBounds, getScaledImageDivDimensions, isEditing, debugMode]);
```

### 3. Ensure Proper Mobile Container Setup
**File**: `src/client/components/InteractiveModule.tsx`

Verify that the mobile viewer container is set up correctly:

```typescript
// Around the viewer mode rendering section
{backgroundImage ? (
  <>
    {/* Scaled Image Div (used for background image and hotspots) */}
    <div
      ref={scaledImageDivRef}
      className="relative" // Ensure positioning context
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: imageFitMode,
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        transformOrigin: 'center',
        transform: `translate(${imageTransform.translateX}px, ${imageTransform.translateY}px) scale(${imageTransform.scale})`,
        transition: isTransforming ? 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
        width: isMobile ? '100%' : '80vw',
        height: isMobile ? '100%' : '80vh',
        maxWidth: isMobile ? '100%' : '1200px',
        maxHeight: isMobile ? '100%' : '800px',
        zIndex: imageTransform.scale > 1 ? Z_INDEX.IMAGE_TRANSFORMED : Z_INDEX.IMAGE_BASE,
        position: 'relative' // Add explicit positioning
      }}
      aria-hidden="true"
    >
```

### 4. Fix Mobile-Specific Viewport Calculations
Update the `getScaledImageDivDimensions` function to handle mobile correctly:

```typescript
const getScaledImageDivDimensions = useCallback(() => {
  if (isMobile) {
    // For mobile, we need to get the actual container dimensions
    const container = viewerImageContainerRef.current || imageContainerRef.current;
    if (container) {
      const rect = container.getBoundingClientRect();
      return {
        width: rect.width,
        height: rect.height
      };
    }
    // Fallback to viewport dimensions
    return {
      width: window.innerWidth,
      height: window.innerHeight * 0.8 // Account for UI elements
    };
  } else {
    // Desktop calculations remain the same
    const divWidth = 80 * window.innerWidth / 100;
    const divHeight = 80 * window.innerHeight / 100;
    const maxWidth = 1200;
    const maxHeight = 800;
    
    return {
      width: Math.min(divWidth, maxWidth),
      height: Math.min(divHeight, maxHeight)
    };
  }
}, [isMobile]);
```

### 5. Testing Strategy
1. Enable debug mode: `localStorage.setItem('debug_positioning', 'true')`
2. Test with various aspect ratio images:
   - Square images (1:1)
   - Wide images (16:9)
   - Tall images (9:16)
3. Test different hotspot positions:
   - Top-left corner (x: 10, y: 10)
   - Center (x: 50, y: 50)
   - Bottom-right corner (x: 90, y: 90)
4. Test on different mobile devices/viewports
5. Verify that editor positioning still works correctly

### 6. Additional Considerations
- Ensure that the `viewerImageContainerRef` is properly assigned to the mobile viewer container
- Check that the CSS classes for mobile viewer don't have any conflicting positioning rules
- Verify that the background-size calculation matches the actual rendered size

## Expected Outcome
After implementing these fixes:
1. Hotspots should appear at their correct saved positions in both x and y axes
2. The positioning should work consistently across different image aspect ratios
3. Mobile and desktop viewers should both display hotspots correctly
4. The editor mode should continue to work as before
