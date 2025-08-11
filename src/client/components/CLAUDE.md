# CLAUDE.md - Components (`src/client/components`)

This directory is the core of the React application, containing all UI components.

## Purpose
Components in this directory are responsible for rendering the user interface. They are organized into subdirectories based on their functionality. All components must adhere to the unified responsive architecture.

## Directory Structure
- **`animations/`**: Components for handling animations and transitions.
- **`icons/`**: Reusable SVG icon components.
- **`interactions/`**: Components related to user interactions within slides.
- **`responsive/`**: Components specifically designed for the unified responsive modal system.
- **`shared/`**: Shared components like error boundaries and loading screens.
- **`slides/`**: Components for creating, editing, and viewing slides.
- **`touch/`**: Components for handling touch gestures.
- **`ui/`**: General-purpose, reusable UI components.
- **`views/`**: Page-level components that compose the main application views.

## Key Architectural Principles
- **Unified Responsive Design**: Every component must be designed to work across all screen sizes using CSS-first responsive design (Tailwind breakpoints). **JavaScript-based UI branching is strictly forbidden.**
- **Component Reusability**: Components should be designed to be as reusable as possible.
- **Accessibility**: All interactive components must be accessible, with proper ARIA attributes and keyboard navigation support.

## Development Workflow
- When creating a new component, place it in the appropriate subdirectory.
- If a new category of components is being created, a new subdirectory should be created for it, along with a corresponding `CLAUDE.md` file.
- Always check for existing components that can be reused or extended before creating a new one.
- For more specific guidelines, refer to the `CLAUDE.md` file within each subdirectory.
