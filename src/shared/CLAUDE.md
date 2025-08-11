# CLAUDE.md - Shared Code (`src/shared`)

This directory contains code and types that are shared across different parts of the application, such as between the client and any potential backend services.

## Purpose
The purpose of this directory is to provide a single source of truth for the application's data structures and other shared logic. This helps to ensure consistency and avoid code duplication.

## Key Files
- **`types.ts`**: Contains the core TypeScript interfaces for the application.
- **`slideTypes.ts`**: Defines the interfaces for the slide-based architecture, including `SlideDeck`, `InteractiveSlide`, and `SlideElement`.
- **`interactiveTypes.ts`**: Defines the interfaces for the different types of interactions.
- **`migrationUtils.ts`**: Contains utility functions for migrating data from legacy formats to the new slide-based architecture.
- **`themePresets.ts`**: Defines the available theme presets for the application.

## Architectural Principles
- **Single Source of Truth**: This directory should be the single source of truth for all shared data structures and types.
- **No Side Effects**: The code in this directory should be pure and have no side effects. It should not depend on any specific environment (e.g., browser or Node.js).
- **Type Safety**: Use TypeScript to ensure that the data structures are well-defined and used correctly throughout the application.
