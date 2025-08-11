# CLAUDE.md - Slide Components (`src/client/components/slides`)

This directory contains all components related to the creation, editing, and viewing of slides. This is a core part of the application's functionality.

## Purpose
These components provide the main user interface for the slide-based interactive modules. They handle everything from the overall slide deck structure to the individual elements on a slide.

## Directory Structure
- **`effects/`**: Contains components for configuring the different types of effects that can be applied to slide elements.

## Key Files
- **`UnifiedSlideEditor.tsx`**: The main component for editing a slide. It integrates the canvas, toolbar, and properties panels.
- **`SlideViewer.tsx`**: The component responsible for displaying a single slide in view mode.
- **`TimelineSlideViewer.tsx`**: A specialized viewer for displaying slides within a timeline context.
- **`ResponsiveCanvas.tsx`**: The canvas component where users can drag and drop slide elements. It is designed to be fully responsive.
- **`ObjectEditorPanel.tsx`**: The panel for editing the properties of a selected slide element.
- **`SlideElement.tsx`**: A component that renders a single element on a slide.

## Architectural Principles
- **Slide-Based Architecture**: All components in this directory are built around the slide-based architecture defined in `src/shared/slideTypes.ts`.
- **Unified Responsive Design**: The slide editor and viewer must be fully responsive, adapting to different screen sizes using CSS-first principles.
- **Separation of Concerns**: The editor and viewer components are kept separate to ensure a clean architecture.
- **dnd-kit**: The `dnd-kit` library is used for all drag-and-drop functionality to ensure accessibility.
