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