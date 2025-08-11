# CLAUDE.md - Shared Components (`src/client/components/shared`)

This directory contains shared components that are used across different parts of the application.

## Purpose
These components provide common UI elements and functionality, such as error handling and loading states, to ensure a consistent user experience.

## Key Files
- **`ErrorScreen.tsx`**: A component to display a user-friendly error message when a critical error occurs.
- **`LoadingScreen.tsx`**: A component to display a loading indicator while data is being fetched or processed.
- **`LazyLoadingFallback.tsx`**: A fallback component to be displayed while a component is being lazy-loaded.
- **`BasePropertiesPanel.ts`**: A base class or utility for creating property panels for different types of slide elements.

## Usage
- When creating a new component that is likely to be used in multiple places, consider adding it to this directory.
- These components should be generic and not tied to any specific feature.
- Follow the unified responsive design principles to ensure that these components work well on all devices.
