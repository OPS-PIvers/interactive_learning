# CLAUDE.md - Source Code (`src`)

This directory contains all the source code for the ExpliCoLearning application.

## Directory Structure
- **`client/`**: Contains the frontend React application, including all components, hooks, utils, and styles.
- **`lib/`**: Core library code, including Firebase API wrappers and authentication context. This code is potentially shared between client and server environments.
- **`shared/`**: Code and types that are shared across different parts of the application, such as between the client and any potential backend services. This includes core data structures and migration utilities.
- **`tests/`**: Contains all the test files for the application, organized by type (build integrity, core functionality, integration, etc.).

## Architectural Principles
- **Unified Responsive Architecture**: All code in this directory must adhere to the strict unified responsive architecture rules defined in the root `AGENTS.md`. **Device-specific JavaScript branching for UI is strictly forbidden.**
- **CSS-First Design**: All responsive behavior should be handled through CSS, primarily using Tailwind CSS breakpoints.
- **Centralized Z-Index**: All z-index values must be managed through the centralized system in `src/client/utils/zIndexLevels.ts`.

## Development Workflow
When working within the `src` directory, it is crucial to:
1.  Follow the naming conventions and code standards outlined in `AGENTS.md`.
2.  Ensure that any new components are built with the unified responsive design principles in mind.
3.  Add or update tests in the `src/tests` directory for any new or modified functionality.
4.  Run all relevant tests before committing changes.
