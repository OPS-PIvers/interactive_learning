# CLAUDE.md - View Components (`src/client/components/views`)

This directory contains page-level components that represent the main views of the application.

## Purpose
These components are responsible for composing the overall layout of the application's pages, such as the editor view or the viewer view. They typically combine multiple smaller components to create a complete user interface for a specific task.

## Key Files
- **`ViewerView.tsx`**: The main component for the viewer experience, which brings together the slide viewer, toolbars, and other UI elements.

## Architectural Principles
- **Composition**: View components are primarily responsible for composing other components and managing the overall page layout.
- **Routing**: These components are often associated with a specific route in the application's router.
- **Unified Responsive Design**: The layout of these views must be fully responsive, adapting to different screen sizes using CSS-first principles.
