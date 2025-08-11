# CLAUDE.md - Core Functionality Tests (`src/tests/coreFunctionality`)

This directory contains tests for the core features of the application.

## Purpose
These tests are designed to ensure that the main user workflows, such as editing and viewing slides, are working correctly. They simulate user interactions and verify that the UI behaves as expected.

## Key Files
- **`SlideEditingWorkflow.test.tsx`**: Tests the end-to-end workflow of editing a slide, including adding and modifying elements.
- **`UnifiedSlideEditor.test.tsx`**: Contains detailed tests for the `UnifiedSlideEditor` component.

## Testing Strategy
- These tests often use a combination of `render` from `@testing-library/react` and user event simulations to mimic real user behavior.
- They verify that the components render correctly and that the application's state is updated as expected in response to user interactions.
- These tests are crucial for preventing regressions in the application's most important features.
