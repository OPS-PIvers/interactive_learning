# CLAUDE.md - Slide Effect Components (`src/client/components/slides/effects`)

This directory contains components for configuring the various effects that can be applied to slide elements.

## Purpose
Each component in this directory provides a UI for editing the settings of a specific type of effect, such as pan/zoom, spotlight, or text effects.

## Key Files
- **`PanZoomEffectSettings.tsx`**: A component for editing the settings of the pan/zoom effect.
- **`SpotlightEffectSettings.tsx`**: A component for editing the settings of the spotlight effect.
- **`TextEffectSettings.tsx`**: A component for editing the settings of text-related effects.
- **`QuizEffectSettings.tsx`**: A component for editing the settings of quiz-related effects.
- **`MediaEffectSettings.tsx`**: A component for editing the settings of media-related effects.

## Usage
- These components are typically used within the `ObjectEditorPanel` to allow users to customize the effects on a selected slide element.
- When creating a new effect, a corresponding settings component should be created in this directory.
- All components must adhere to the unified responsive design principles.
