# Temporal Dead Zone Fixes for InteractiveModule.tsx

## 🚨 Critical Issue Overview

This document outlines temporal dead zone (TDZ) issues identified in the `src/client/components/InteractiveModule.tsx` file that can cause runtime errors and unpredictable behavior. These issues occur when variables or functions are accessed before they are properly initialized in the component lifecycle.

## 📋 Issues Identified

### 1. Function Dependencies in useEffect Before Declaration
**Location**: Lines around the keyboard event listener useEffect  
**Problem**: Functions like `handleArrowLeftKey`, `handleArrowRightKey`, etc. are referenced in a useEffect dependency array before they are fully defined.

```typescript
// PROBLEMATIC CODE:
useEffect(() => {
  // ... keyboard handler logic
}, [
  handleArrowLeftKey,  // May not be initialized yet
  handleArrowRightKey, // May not be initialized yet
  // ... other handlers
]);
```

### 2. useCallback Dependencies on Undefined Functions  
**Problem**: Several useCallback hooks reference functions that may not be declared yet, creating circular dependencies.

### 3. Custom Hook Timing Issue
**Location**: `useAutoSave(isEditing, hotspots, timelineEvents, handleSave);`  
**Problem**: `useAutoSave` is called with `handleSave` as a dependency, but the hook may execute before `handleSave` is fully initialized.

### 4. Memoized Function Dependencies
**Location**: `debouncedApplyTransform` useMemo  
**Problem**: References `applyTransform` which may not be defined when the memo is first created.

```typescript
// PROBLEMATIC CODE:
const debouncedApplyTransform = useMemo(
  () => {
    return (newTransform: ImageTransformState) => {
      applyTransform(newTransform); // applyTransform may not exist yet
    };
  },
  [applyTransform] // TDZ risk
);
```

### 5. Safety Check Functions
**Problem**: Functions like `getSafeImageBounds`, `getSafeViewportCenter`, etc. are used in early useEffect hooks but may not be defined.

### 6. Transform Function Circular Dependencies
**Problem**: Transform-related functions have circular dependencies that can cause initialization issues.

## 🔧 Complete Implementation Plan

### Phase 1: Reorganize Function Declarations

#### Step 1: Move Core Utility Functions to Top
```typescript
const InteractiveModule: React.FC<InteractiveModuleProps> = ({ 
  initialData, 
  isEditing, 
  onSave, 
  onClose, 
  projectName, 
  projectId 
}) => {

  // STATE AND REFS FIRST
  const [backgroundImage, setBackgroundImage] = useState<string | undefined>(initialData.backgroundImage);
  // ... all existing state declarations

  // CORE UTILITY FUNCTIONS (MOVE TO TOP)
  const safeCalculatePosition = useCallback(<T,>(
    fn: () => T,
    fallback: T
  ): T => {
    try {
      const result = fn();
      return result === null || result === undefined ? fallback : result;
    } catch (error) {
      console.error('Position calculation error:', error);
      return fallback;
    }
  }, []);
```

#### Step 2: Define Image Bounds Functions Early
```typescript
  const getSafeImageBounds = useCallback(() => {
    return safeCalculatePosition(() => {
      return originalImageBoundsRef.current;
    }, null);
  }, [safeCalculatePosition]);

  const getSafeViewportCenter = useCallback(() => {
    return safeCalculatePosition(() => {
      const container = scrollableContainerRef.current;
      if (!container) return null;
      return {
        x: container.clientWidth / 2,
        y: container.clientHeight / 2
      };
    }, null);
  }, [safeCalculatePosition]);
```

#### Step 3: Fix Transform Functions Early Declaration
```typescript
  // Declare applyTransform early to prevent TDZ in useMemo
  const applyTransform = useCallback((newTransform: ImageTransformState) => {
    // Prevent circular updates
    if (isApplyingTransformRef.current) {
      return;
    }

    // Clear any pending transform
    if (applyTransformTimeoutRef.current) {
      clearTimeout(applyTransformTimeoutRef.current);
      applyTransformTimeoutRef.current = null;
    }

    // Debounce the actual application
    applyTransformTimeoutRef.current = window.setTimeout(() => {
      isApplyingTransformRef.current = true;
      
      try {
        setImageTransform(newTransform);
        lastAppliedTransformRef.current = newTransform;
      } finally {
        isApplyingTransformRef.current = false;
        applyTransformTimeoutRef.current = null;
      }
    }, 16); // ~60fps
  }, []);

  // Now debouncedApplyTransform can safely reference applyTransform
  const debouncedApplyTransform = useMemo(
    () => {
      return (newTransform: ImageTransformState) => {
        if (debouncedApplyTransformTimeoutRef.current) {
          clearTimeout(debouncedApplyTransformTimeoutRef.current);
        }
        debouncedApplyTransformTimeoutRef.current = window.setTimeout(() => {
          applyTransform(newTransform);
        }, 16);
      };
    },
    [applyTransform] // Now safely referenced
  );
```

### Phase 2: Fix Navigation and Control Functions

#### Step 4: Early Step Calculation and Navigation
```typescript
  // Compute steps early to prevent TDZ
  const uniqueSortedSteps = useMemo(() => {
    if (!timelineEvents || timelineEvents.length === 0) return isEditing ? [1] : [];
    const steps = [...new Set(timelineEvents.map(e => e.step))].sort((a, b) => a - b);
    return steps.length > 0 ? steps : (isEditing ? [1] : []);
  }, [timelineEvents, isEditing]);

  const handlePrevStep = useCallback(() => {
    if (moduleState === 'learning' && uniqueSortedSteps.length > 0) {
      const currentIndex = uniqueSortedSteps.indexOf(currentStep);
      if (currentIndex > 0) {
        setCurrentStep(uniqueSortedSteps[currentIndex - 1]);
      }
    }
  }, [currentStep, uniqueSortedSteps, moduleState]);

  const handleNextStep = useCallback(() => {
    if (moduleState === 'learning' && uniqueSortedSteps.length > 0) {
      const currentIndex = uniqueSortedSteps.indexOf(currentStep);
      if (currentIndex < uniqueSortedSteps.length - 1) {
        setCurrentStep(uniqueSortedSteps[currentIndex + 1]);
      }
    }
  }, [currentStep, uniqueSortedSteps, moduleState]);
```

#### Step 5: Zoom Control Functions
```typescript
  const handleZoomIn = useCallback(() => {
    if (isEditing) {
      setEditingZoom(prev => Math.min(5, prev + 0.05));
    }
  }, [isEditing]);

  const handleZoomOut = useCallback(() => {
    if (isEditing) {
      setEditingZoom(prev => Math.max(0.25, prev - 0.05));
    }
  }, [isEditing]);

  const handleZoomReset = useCallback(() => {
    if (isEditing) {
      setEditingZoom(1);
      if (scrollableContainerRef.current) {
        scrollableContainerRef.current.scrollLeft = 0;
        scrollableContainerRef.current.scrollTop = 0;
      }
    }
  }, [isEditing]);
```

### Phase 3: Fix Keyboard Event Handlers

#### Step 6: Stable Keyboard Handler References
```typescript
  const handleArrowLeftKey = useCallback((): boolean => {
    if (moduleState === 'learning') {
      handlePrevStep();
      return true;
    }
    return false;
  }, [moduleState, handlePrevStep]);

  const handleArrowRightKey = useCallback((): boolean => {
    if (moduleState === 'learning') {
      handleNextStep();
      return true;
    }
    return false;
  }, [moduleState, handleNextStep]);

  const handleEscapeKey = useCallback((): boolean => {
    if (imageTransform.scale > 1 || imageTransform.translateX !== 0 || imageTransform.translateY !== 0) {
      setImageTransform({ scale: 1, translateX: 0, translateY: 0, targetHotspotId: undefined });
      return true;
    } else if (isHotspotModalOpen) {
      setIsHotspotModalOpen(false);
      setSelectedHotspotForModal(null);
      return true;
    }
    return false;
  }, [imageTransform, isHotspotModalOpen]);

  const handlePlusKey = useCallback((e: KeyboardEvent): boolean => {
    if (isEditing && (e.ctrlKey || e.metaKey)) {
      handleZoomIn();
      return true;
    }
    return false;
  }, [isEditing, handleZoomIn]);

  const handleMinusKey = useCallback((e: KeyboardEvent): boolean => {
    if (isEditing && (e.ctrlKey || e.metaKey)) {
      handleZoomOut();
      return true;
    }
    return false;
  }, [isEditing, handleZoomOut]);

  const handleZeroKey = useCallback((e: KeyboardEvent): boolean => {
    if (isEditing && (e.ctrlKey || e.metaKey)) {
      handleZoomReset();
      return true;
    }
    return false;
  }, [isEditing, handleZoomReset]);

  // Create stable keyboard handler reference
  const stableKeyboardHandlers = useMemo(() => ({
    handleArrowLeftKey,
    handleArrowRightKey,
    handleEscapeKey,
    handlePlusKey,
    handleMinusKey,
    handleZeroKey
  }), [
    handleArrowLeftKey,
    handleArrowRightKey,
    handleEscapeKey,
    handlePlusKey,
    handleMinusKey,
    handleZeroKey
  ]);
```

### Phase 4: Fix Save Function and useAutoSave

#### Step 7: Move handleSave Before useAutoSave
```typescript
  const handleSave = useCallback(async () => {
    if (isSaving) {
      console.log('Save already in progress, skipping...');
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Wait for any pending state updates
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const currentData = {
        backgroundImage,
        hotspots,
        timelineEvents,
        imageFitMode
      };
      
      // Validate data
      if (!Array.isArray(currentData.hotspots)) {
        throw new Error('Invalid hotspots data');
      }
      
      if (!Array.isArray(currentData.timelineEvents)) {
        throw new Error('Invalid timeline events data');
      }
      
      await onSave(currentData);
      setShowSuccessMessage(true);
      
      // Clear any existing timeout
      if (successMessageTimeoutRef.current) {
        clearTimeout(successMessageTimeoutRef.current);
      }
      
      successMessageTimeoutRef.current = window.setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
      
    } catch (error) {
      console.error('Save failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert('Save failed: ' + errorMessage);
    } finally {
      setIsSaving(false);
    }
  }, [backgroundImage, hotspots, timelineEvents, imageFitMode, onSave, isSaving]);

  // NOW SAFE TO USE useAutoSave
  useAutoSave(isEditing, hotspots, timelineEvents, handleSave);
```

### Phase 5: Fix useEffect Dependencies

#### Step 8: Stable Keyboard Event Listener
```typescript
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't interfere with input fields
      if (e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement ||
          (e.target instanceof HTMLElement && e.target.isContentEditable)) {
        return;
      }

      let preventDefault = false;
      const handlers = stableKeyboardHandlers;

      if (e.key === 'ArrowLeft') {
        preventDefault = handlers.handleArrowLeftKey();
      } else if (e.key === 'ArrowRight') {
        preventDefault = handlers.handleArrowRightKey();
      } else if (e.key === 'Escape') {
        preventDefault = handlers.handleEscapeKey();
      } else if (e.key === '+' || e.key === '=') {
        preventDefault = handlers.handlePlusKey(e);
      } else if (e.key === '-') {
        preventDefault = handlers.handleMinusKey(e);
      } else if (e.key === '0') {
        preventDefault = handlers.handleZeroKey(e);
      }

      if (preventDefault) {
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [stableKeyboardHandlers]); // Stable dependency
```

#### Step 9: Fix Main Learning Effect with Safety Checks
```typescript
  useEffect(() => {
    // Add comprehensive safety checks
    if (!timelineEvents || 
        !hotspots || 
        !getSafeImageBounds || 
        !getSafeViewportCenter || 
        !constrainTransform || 
        !applyTransform) {
      console.warn('Learning effect: Required dependencies not ready');
      return;
    }
    
    // Clear any existing pulse timeout
    if (pulseTimeoutRef.current) {
      clearTimeout(pulseTimeoutRef.current);
      pulseTimeoutRef.current = null;
    }

    // Get current transform with safety fallback
    let newImageTransform: ImageTransformState = lastAppliedTransformRef.current || { 
      scale: 1, 
      translateX: 0, 
      translateY: 0, 
      targetHotspotId: undefined 
    };

    if (moduleState === 'learning') {
      const newActiveDisplayIds = new Set<string>();
      let newMessage: string | null = null;
      let newPulsingHotspotId: string | null = null;
      let newHighlightedHotspotId: string | null = null;
      
      const eventsForCurrentStep = timelineEvents.filter(event => event.step === currentStep);
      
      eventsForCurrentStep.forEach(event => {
        if (event.targetId) newActiveDisplayIds.add(event.targetId);
        
        switch (event.type) {
          case InteractionType.SHOW_MESSAGE:
            if (event.message) newMessage = event.message;
            break;
            
          case InteractionType.PULSE_HOTSPOT:
            if (event.targetId) {
              newPulsingHotspotId = event.targetId;
              if (event.duration) {
                pulseTimeoutRef.current = window.setTimeout(() => {
                  setPulsingHotspotId(prevId => prevId === event.targetId ? null : prevId);
                }, event.duration);
              }
            }
            break;
            
          // Handle other interaction types...
        }
      });

      // Apply state updates
      setActiveHotspotDisplayIds(newActiveDisplayIds);
      setPulsingHotspotId(newPulsingHotspotId);
      setHighlightedHotspotId(newHighlightedHotspotId);
      setCurrentMessage(newMessage);
      
      // Apply transform if changed
      if (JSON.stringify(newImageTransform) !== JSON.stringify(lastAppliedTransformRef.current)) {
        applyTransform(newImageTransform);
      }
    }
    
  }, [
    moduleState,
    currentStep,
    timelineEvents,
    hotspots,
    getSafeImageBounds,
    getSafeViewportCenter,
    constrainTransform,
    applyTransform
  ]);
```

### Phase 6: Comprehensive Cleanup

#### Step 10: Master Cleanup Effect
```typescript
  useEffect(() => {
    return () => {
      // Cleanup all timeouts on unmount
      if (pulseTimeoutRef.current) {
        clearTimeout(pulseTimeoutRef.current);
      }
      if (successMessageTimeoutRef.current) {
        clearTimeout(successMessageTimeoutRef.current);
      }
      if (applyTransformTimeoutRef.current) {
        clearTimeout(applyTransformTimeoutRef.current);
      }
      if (debouncedApplyTransformTimeoutRef.current) {
        clearTimeout(debouncedApplyTransformTimeoutRef.current);
      }
    };
  }, []);
```

## 🚀 Implementation Steps

### Step 1: Backup Current File
```bash
cp src/client/components/InteractiveModule.tsx src/client/components/InteractiveModule.tsx.backup
```

### Step 2: Apply Changes Systematically
1. **First**: Move all utility functions to the top of the component
2. **Second**: Reorganize function declarations in dependency order
3. **Third**: Update all useEffect dependency arrays
4. **Fourth**: Add comprehensive safety checks
5. **Fifth**: Test all functionality

### Step 3: Testing Checklist
- [ ] Keyboard shortcuts work (arrows, escape, zoom controls)
- [ ] Save functionality operates correctly
- [ ] Timeline navigation functions properly
- [ ] Hotspot interactions work
- [ ] No console errors on component mount
- [ ] No temporal dead zone errors in browser dev tools

### Step 4: Validation
```bash
# Run tests to ensure no regressions
npm run test

# Check for TypeScript errors
npm run build

# Test in browser
npm run dev
```

## ⚠️ Critical Warnings

1. **Test Thoroughly**: These changes affect core component functionality
2. **Function Order Matters**: The order of function declarations is now critical
3. **Dependency Arrays**: All useEffect dependencies must be stable
4. **Refs for Timeouts**: Always use refs for timeout IDs to prevent memory leaks
5. **Safety Checks**: Never assume functions/objects exist without checking

## 🔍 Debugging Tips

If issues persist after implementation:

1. **Check Console**: Look for "before initialization" or temporal dead zone errors
2. **React Dev Tools**: Monitor when components re-render
3. **Add Logging**: Temporarily log function availability in useEffect
4. **Step Through**: Use debugger to verify function execution order

## 📈 Expected Outcomes

After implementing these fixes:
- ✅ No temporal dead zone runtime errors
- ✅ Stable component initialization
- ✅ Predictable function execution order
- ✅ Improved performance through proper dependency management
- ✅ Better error handling and debugging capabilities

## 📞 Support

If you encounter issues during implementation:
1. Check the browser console for specific error messages
2. Verify all functions are declared before use
3. Ensure useEffect dependency arrays contain only stable references
4. Test keyboard shortcuts and save functionality specifically

---

**Last Updated**: Created for temporal dead zone fix implementation  
**Priority**: CRITICAL - Implement immediately to prevent runtime errors