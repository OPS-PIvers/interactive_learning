# Identified Bugs - Interactive Learning Hub

## **HIGH PRIORITY BUGS** 🔴 (Impact: Mobile User Experience)

*All high priority mobile bugs have been resolved! 🎉*

## **MEDIUM PRIORITY BUGS** 🟡 (Impact: Reliability & Maintenance)

### 5. **Inconsistent Prop Handling in `EditableEventCard.tsx`**
   - **Issue:** The component uses multiple, sometimes conflicting, props for the same data (e.g., `event.content` and `event.textContent`, `event.question` and `event.quizQuestion`).
   - **Impact:** This can cause unexpected behavior and make the component difficult to maintain.
   - **File:** `src/client/components/EditableEventCard.tsx:224-227, 540-544, 381-382`

### 6. **Multiple Sources of Truth for `isMobile` in `InteractiveModule.tsx`**
   - **Issue:** The component both calls `useIsMobile()` hook and could potentially receive an `isMobile` prop, creating potential inconsistency.
   - **Impact:** The component may behave in unexpected ways, rendering a mix of mobile and desktop UI elements.
   - **File:** `src/client/components/InteractiveModule.tsx:251, 256`

### 7. **Race Condition in `handleSave` Function**
   - **Issue:** The `handleSave` function is not debounced, and it is called in multiple `useEffect` hooks that depend on `hotspots` and `timelineEvents`. Rapid changes can cause multiple saves.
   - **Impact:** This can lead to performance issues and potentially inconsistent data if saves don't complete in the correct order.
   - **File:** `src/client/components/InteractiveModule.tsx`

### 8. **Incomplete Timeout Cleanup on Unmount**
   - **Issue:** The component has multiple `setTimeout` calls but doesn't clear all of them in cleanup functions. Some use bare `setTimeout` without ref tracking.
   - **Impact:** This can lead to memory leaks and unexpected behavior if the component unmounts before timeouts complete.
   - **File:** `src/client/components/InteractiveModule.tsx:1375, 1388`

## **LOW PRIORITY BUGS** 🟢 (Impact: Polish & Edge Cases)

### 9. **Modal Z-Index Issues on Mobile**
   - **Issue:** Modal z-index in `MobileEventRenderer.tsx` is set to 1000, but other components may have conflicting z-index values.
   - **Impact:** Mobile modals may appear behind other UI elements in complex layouts.
   - **File:** `src/client/components/mobile/MobileEventRenderer.tsx:277`

### 10. **Missing Mobile Keyboard Handling**
   - **Issue:** No specific mobile keyboard event handling found in mobile components.
   - **Impact:** Mobile keyboard may cover important UI elements without proper viewport adjustments.
   - **Areas:** Mobile modal and input components

## **FIXED BUGS** ✅ (Resolved in Recent Updates)

### ~~Single Tap fires on Double Tap~~ - **FIXED**
- **Status:** ✅ Resolved - proper double-tap detection with timeout cleanup

### ~~Memory Leaks in Media Players~~ - **FIXED** 
- **Status:** ✅ Resolved - event listeners now properly removed in cleanup

### ~~Missing onClose in AuthModal~~ - **FIXED**
- **Status:** ✅ Resolved - onClose now called after successful authentication

### ~~autoAdvance doesn't stop on completion~~ - **FIXED**
- **Status:** ✅ Resolved - proper interval cleanup implemented

### ~~Race Condition in Touch Handling~~ - **FIXED**
- **Status:** ✅ Resolved - improved race condition handling in touch gesture system

### ~~Hardcoded Hotspot Size~~ - **FIXED**
- **Status:** ✅ Resolved - responsive hotspot sizing with accessibility compliance

### ~~Touch Gesture Conflicts~~ - **FIXED**
- **Status:** ✅ Resolved - proper coordination between gestures and hotspot interactions

### ~~Transform State Race Conditions~~ - **FIXED**
- **Status:** ✅ Resolved - improved state synchronization in touch gesture handling

---

## **Bug Priority Guidelines**

- **🔴 HIGH:** Directly impacts mobile user experience, accessibility, or core functionality
- **🟡 MEDIUM:** Affects reliability, maintainability, or performance
- **🟢 LOW:** Polish issues or edge cases that don't significantly impact core workflows