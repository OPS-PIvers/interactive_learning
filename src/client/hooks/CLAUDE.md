# CLAUDE.md - Hooks (`src/client/hooks`)

This directory contains all the custom React hooks used in the application.

## Purpose
Custom hooks allow for the extraction and reuse of component logic. They are a fundamental part of the application's architecture, especially for handling complex client-side behavior like device detection, touch gestures, and state management.

## Key Hooks
- **`useDeviceDetection.ts`**: Detects the device type (mobile, tablet, desktop). **CRITICAL: This hook should only be used for mathematical calculations (e.g., canvas dimensions, drag bounds) and NEVER for conditional UI rendering.**
- **`useLayoutConstraints.ts`**: Manages the layout constraints for modals to prevent them from overlapping with toolbars.
- **`useTouchGestures.ts`**: Handles complex touch gestures like pinch-to-zoom and panning.
- **`useUnifiedEditorState.ts`**: Manages the state of the unified slide editor.
- **`useScreenReaderAnnouncements.ts`**: Provides accessibility features for screen readers.

## Architectural Principles
- **Logic Encapsulation**: Each hook should have a single, well-defined purpose.
- **Reusability**: Hooks should be designed to be reusable across different components.
- **Adherence to `AGENTS.md`**: All hooks must follow the strict architectural rules defined in the root `AGENTS.md`, especially the rules regarding device detection and responsive design.
- **Performance**: Use `useCallback` and `useMemo` within hooks to optimize performance and prevent unnecessary re-renders in the components that use them.
- **Cleanup**: Ensure that any side effects (e.g., event listeners, subscriptions) are properly cleaned up in a `useEffect` return function.
