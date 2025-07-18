# Identified Bugs - Interactive Learning Hub

## **CRITICAL BUGS** 🚨 (Immediate Attention Required)

### **Rendering Logic in `MobileEventRenderer.tsx` Blocks Visual Events**
- **Priority:** Critical
- **Impact:** Prevents visual overlay events (Pan, Zoom, Spotlight) from rendering when a modal event is active.
- **Description:** The `activeEvents` logic in `MobileEventRenderer.tsx` prioritizes the modal queue, which blocks visual events from being displayed simultaneously. This is a major issue that needs to be addressed immediately.

## **HIGH PRIORITY BUGS** 🔴 (Impact: Mobile User Experience)

### **Flawed Transform Logic in `MobilePanZoomHandler.tsx`**
- **Priority:** High
- **Impact:** Causes unpredictable pan and zoom animations on mobile devices.
- **Description:** The `transformOrigin` is not being set correctly, and the translation calculations are off, which results in a flawed and unpredictable user experience.

### **Z-Index Management in `MobileEventRenderer.tsx` is Flawed**
- **Priority:** High
- **Impact:** Causes visual events to be hidden behind other elements.
- **Description:** The `z-index` of the event wrappers is not being updated correctly, which can cause visual events to be hidden behind other elements.

## **MEDIUM PRIORITY BUGS** 🟡 (Impact: Reliability & Maintenance)

### **Incorrect Spotlight Rendering in `MobileSpotlightOverlay.tsx`**
- **Priority:** Medium
- **Impact:** Affects the rendering of rectangular spotlights.
- **Description:** The `getSpotlightStyle` function in `MobileSpotlightOverlay.tsx` has a bug that causes rectangular spotlights to be rendered incorrectly. The component also has a minor issue where it does not properly handle different event types, which can cause unexpected visual behavior.

### **Spotlight is Not Interactive**
- **Priority:** Medium
- **Impact:** Prevents users from interacting with the spotlight.
- **Description:** The `mobile-spotlight-overlay` class in `mobile-events.css` has a `pointer-events: none` rule, which prevents the overlay from receiving click events. Additionally, the `handleOverlayClick` function in `MobileSpotlightOverlay.tsx` is not being called correctly.

## **LOW PRIORITY BUGS** 🟢 (Impact: Polish & Edge Cases)

### **Improper Cleanup in `MobilePanZoomHandler.tsx`**
- **Priority:** Low
- **Impact:** Could lead to memory leaks.
- **Description:** The `useEventCleanup` hook is not being used correctly in `MobilePanZoomHandler.tsx`, which could cause memory leaks over time.

---

## **Bug Priority Guidelines**

- **🚨 CRITICAL:** Major issues that require immediate attention.
- **🔴 HIGH:** Directly impacts mobile user experience, accessibility, or core functionality.
- **🟡 MEDIUM:** Affects reliability, maintainability, or performance.
- **🟢 LOW:** Polish issues or edge cases that don't significantly impact core workflows.