# CLAUDE.md - Interaction Components (`src/client/components/interactions`)

This directory contains components related to creating and managing user interactions within the slides.

## Purpose
These components provide the UI for authors to define what happens when a user interacts with a slide element. This includes setting up quizzes, audio playback, and text popups.

## Key Files
- **`InteractionEditor.tsx`**: A generic component for editing different types of interactions.
- **`InteractionsList.tsx`**: A component that lists all the interactions for a given slide element.
- **`QuizInteractionEditor.tsx`**: A specialized editor for creating and managing quiz interactions.
- **`AudioInteractionEditor.tsx`**: A specialized editor for audio-related interactions.
- **`TextInteractionEditor.tsx`**: A specialized editor for text-based interactions.

## Architectural Principles
- **Modularity**: Each interaction type has its own editor component.
- **Reusability**: The `InteractionEditor` component is designed to be a wrapper that can host different types of interaction editors.
- **Unified Design**: The UI of these components must be fully responsive and work across all devices without any JavaScript-based device detection for rendering.
