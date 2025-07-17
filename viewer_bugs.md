# Critical Bugs in Mobile Viewer

This document outlines critical bugs and potential issues found in the mobile viewer components.

## `useMobileTouchGestures.ts`

### 1. Critical Bug: Single Tap fires on Double Tap
- **Issue:** The current implementation of `handleTouchEnd` will always fire a single tap (`onTap`) after a 300ms delay, even if a double tap has already been detected and handled in `handleTouchStart`.
- **Impact:** This will cause unintended behavior, where both a double-tap and a single-tap action are registered for the same user interaction.
- **Recommendation:** The `onDoubleTap` handler should also clear the `tapDelayTimerRef`.

### 2. Potential Bug: Race Condition in Touch Handling
- **Issue:** The `handleTouchEnd` function has a `setTimeout` to delay the `onTap` execution. If a user starts a new touch event before this timeout completes, it could lead to unpredictable behavior.
- **Impact:** Taps might be missed or misattributed.
- **Recommendation:** The `handleTouchStart` function should clear any existing `tapDelayTimerRef` at the beginning of the function.

## `useMobileLearningFlow.ts`

### 1. Bug: `autoAdvance` doesn't stop on completion
- **Issue:** The `useEffect` for `autoAdvance` does not clear the interval when `isComplete` becomes true.
- **Impact:** The timer continues to run in the background, consuming resources, even after the learning module is finished.
- **Recommendation:** Add `isComplete` to the dependency array of the `useEffect` and clear the interval if `isComplete` is true.

## `MobileEventRenderer.tsx`

### 1. Critical Bug: Multiple simultaneous modal events
- **Issue:** The logic to handle modal events is flawed. It finds the *first* modal event and sets it as active. If multiple modal events are active at the same time (e.g., a `SHOW_TEXT` and a `SHOW_IMAGE` event are on the same timeline step), only the first one will be displayed.
- **Impact:** The user will not see all the intended content for a given step, potentially missing critical information.
- **Recommendation:** The `activeEvents` logic needs to be redesigned to handle multiple concurrent modal events, perhaps by queueing them or displaying them in a different way.

### 2. Bug: `onEventComplete` not always called for non-modal events
- **Issue:** The `activeEvents` logic allows multiple non-modal events to be active at once. However, the `onEventComplete` callback is only called when a specific event's component calls its `onComplete` prop. If a non-modal event doesn't have a natural "completion" (e.g., a `PULSE_HOTSPOT` that just plays an animation), it might never be marked as complete.
- **Impact:** The learning flow might get stuck, as the system waits for an event that will never complete.
- **Recommendation:** There should be a mechanism to ensure all active events are completed. For events without a natural completion, `onEventComplete` should be called immediately or after a short delay.

## `MobileHotspotViewer.tsx`

### 1. Bug: Hardcoded Hotspot Size
- **Issue:** The hotspot size is hardcoded to `44px`. This doesn't adapt to different screen sizes or accessibility settings.
- **Impact:** Hotspots may be too large or too small on different devices, leading to a poor user experience.
- **Recommendation:** Use relative units (like `rem` or `vw`) or a dynamic calculation to determine the hotspot size.
