1. **Critical Bug: Single Tap fires on Double Tap in `useMobileTouchGestures.ts`**
    - **Issue:** The current implementation of `handleTouchEnd` will always fire a single tap (`onTap`) after a 300ms delay, even if a double tap has already been detected and handled in `handleTouchStart`.
    - **Impact:** This will cause unintended behavior, where both a double-tap and a single-tap action are registered for the same user interaction.

2.  **Potential Bug: Race Condition in Touch Handling in `useMobileTouchGestures.ts`**
    - **Issue:** The `handleTouchEnd` function has a `setTimeout` to delay the `onTap` execution. If a user starts a new touch event before this timeout completes, it could lead to unpredictable behavior.
    - **Impact:** Taps might be missed or misattributed.

3.  **Bug: `autoAdvance` doesn't stop on completion in `useMobileLearningFlow.ts`**
    - **Issue:** The `useEffect` for `autoAdvance` does not clear the interval when `isComplete` becomes true.
    - **Impact:** The timer continues to run in the background, consuming resources, even after the learning module is finished.

4.  **Bug: `onEventComplete` not always called for non-modal events in `MobileEventRenderer.tsx`**
    - **Issue:** The `activeEvents` logic allows multiple non-modal events to be active at once. However, the `onEventComplete` callback is only called when a specific event's component calls its `onComplete` prop. If a non-modal event doesn't have a natural "completion" (e.g., a `PULSE_HOTSPOT` that just plays an animation), it might never be marked as complete.
    - **Impact:** The learning flow might get stuck, as the system waits for an event that will never complete.

5.  **Bug: Hardcoded Hotspot Size in `MobileHotspotViewer.tsx`**
    - **Issue:** The hotspot size is hardcoded to `44px`. This doesn't adapt to different screen sizes or accessibility settings.
    - **Impact:** Hotspots may be too large or too small on different devices, leading to a poor user experience.

6.  **Potential Bug: Memory Leak in `AudioPlayer.tsx` and `VideoPlayer.tsx`**
    - **Issue:** The `useEffect` hooks in both `AudioPlayer.tsx` and `VideoPlayer.tsx` do not remove the event listeners when the component unmounts.
    - **Impact:** This can lead to memory leaks, as the event listeners will continue to exist even after the component is no longer in use.

7.  **Bug: Inconsistent Prop Handling in `EditableEventCard.tsx`**
    - **Issue:** The component uses multiple, sometimes conflicting, props for the same data (e.g., `event.content` and `event.textContent`). This makes it difficult to know which prop to use and can lead to inconsistent data.
    - **Impact:** This can cause unexpected behavior and make the component difficult to maintain.

8.  **Bug: Missing `onClose` call in `AuthModal.tsx`**
    - **Issue:** The `handleSubmit` and `handleGoogleSignIn` functions in `AuthModal.tsx` do not call the `onClose` prop after a successful sign-in or sign-up.
    - **Impact:** The modal will not close automatically after the user authenticates, leading to a poor user experience.

9.  **Potential Bug: Unhandled Promise Rejection in `firebaseApi.ts`**
    - **Issue:** The `deleteProject` function in `firebaseApi.ts` has a `catch` block for the `_deleteImageFromStorage` call, but it only logs the error and doesn't reject the promise. 
    - **Impact:** If deleting the image fails, the caller of `deleteProject` will not be aware of the failure, which could lead to orphaned images in storage.

10. **Bug: `useMobileTouchGestures.ts` does not handle `isDragActive` correctly.**
    - **Issue:** The `isGestureActive` function in `useMobileTouchGestures.ts` does not include `isDragActive` in its check. This means that touch gestures on the container will not be disabled when a hotspot is being dragged.
    - **Impact:** This can lead to unexpected behavior, such as the container panning while a hotspot is being dragged.