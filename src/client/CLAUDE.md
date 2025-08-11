# CLAUDE.md - Client Application (`src/client`)

This directory contains the entire frontend React application for ExpliCoLearning.

## Purpose
The code in this directory is responsible for rendering the user interface and handling all client-side logic. It is built with React, TypeScript, and Vite, and it follows a strict unified responsive architecture.

## Directory Structure
- **`assets/`**: Static assets like images and fonts.
- **`components/`**: All React components, organized by feature or purpose. This is the core of the UI.
- **`constants/`**: Application-wide constants for the client.
- **`contexts/`**: React Context providers for managing global state.
- **`hooks/`**: Custom React hooks that encapsulate reusable logic.
- **`styles/`**: Global CSS styles and Tailwind CSS configuration.
- **`utils/`**: Utility functions for various client-side tasks.

## Key Architectural Principles
- **Unified Responsive Design**: All components in this directory **must** adapt to different screen sizes using CSS-first responsive design (Tailwind breakpoints). JavaScript-based device detection for UI rendering is strictly forbidden.
- **Component-Based Architecture**: The UI is built from a collection of reusable and composable React components.
- **Centralized State Management**: Shared state is managed through React Contexts and custom hooks.
- **Z-Index Management**: All z-index values must be sourced from `src/client/utils/zIndexLevels.ts`.

## Important Files
- **`index.tsx`**: The main entry point for the React application.
- **`App.tsx`**: The root component of the application.
- **`components/SlideBasedInteractiveModule.tsx`**: The main component for the slide-based interactive modules.
- **`hooks/useDeviceDetection.ts`**: A hook for detecting device type, to be used **only for mathematical calculations**, not for UI rendering.

When adding or modifying code in this directory, pay close attention to the architectural rules in the root `AGENTS.md` and the specific guidelines for each subdirectory.
