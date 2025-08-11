# CLAUDE.md - Constants (`src/client/constants`)

This directory contains constant values used throughout the client-side application.

## Purpose
By centralizing constants, we can avoid magic numbers and strings in the code, making it more maintainable and easier to update.

## Key Files
- **`interactionConstants.ts`**: Contains constants related to user interactions, such as event names and default values.

## Usage
- When you need to use a value that is shared across multiple files, consider adding it as a constant in this directory.
- Constants should be organized into files based on their domain (e.g., interactions, animations, etc.).
- Use all-caps snake case for constant names (e.g., `DEFAULT_DURATION`).
