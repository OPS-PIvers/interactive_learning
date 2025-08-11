# CLAUDE.md - Contexts (`src/client/contexts`)

This directory contains React Context providers for managing shared state across the application.

## Purpose
Contexts are used to provide state to a tree of components without having to pass props down manually at every level. This is particularly useful for global state like the current theme, user authentication, or pan/zoom state.

## Key Files
- **`PanZoomProvider.tsx`**: Provides the state and functions for managing the pan and zoom functionality of the slide canvas.

## Usage
- When you have state that needs to be accessed by many components at different levels of the component tree, consider creating a context for it.
- Each context should have a clear and specific purpose.
- Use the `useContext` hook to consume the context's value in a component.
- For performance, consider splitting contexts into smaller, more focused providers to avoid unnecessary re-renders.
