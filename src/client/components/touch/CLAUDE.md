# CLAUDE.md - Touch Components (`src/client/components/touch`)

This directory contains components related to touch gesture handling.

## Purpose
These components provide the necessary infrastructure for a smooth and intuitive touch experience, especially for interactions on the slide canvas.

## Key Files
- **`TouchContainer.tsx`**: A wrapper component that provides touch gesture handling for its children.
- **`ViewportManager.tsx`**: A component that manages the viewport for touch interactions, including pan and zoom.

## Architectural Principles
- **Touch-First Design**: The components in this directory are designed with a touch-first approach, but they also support mouse and keyboard interactions for a consistent cross-device experience.
- **Performance**: These components are optimized for performance to ensure smooth touch interactions, even on less powerful devices. This includes using passive event listeners and debouncing/throttling where appropriate.
- **Gesture Coordination**: The components in this directory often work with the `useTouchGestures` hook to coordinate complex gestures like pinch-to-zoom and panning.
