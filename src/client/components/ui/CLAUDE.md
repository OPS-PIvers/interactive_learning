# CLAUDE.md - UI Components (`src/client/components/ui`)

This directory contains general-purpose, reusable UI components that are not specific to any particular feature.

## Purpose
These components form the building blocks of the application's user interface. They are designed to be highly reusable and composable.

## Key Files
- **`GradientCreateButton.tsx`**: A standardized button for creating new items.
- **`HotspotFeedbackAnimation.tsx`**: A component for providing visual feedback when a hotspot is interacted with.
- **`LiquidColorSelector.tsx`**: A custom color selector component.
- **`TabContainer.tsx`**: A component for creating tabbed interfaces.
- **`TextTipInteraction.tsx`**: A component for displaying text tips.

## Usage
- When creating a new UI element that is likely to be used in multiple places, consider adding it to this directory.
- These components should be designed to be as generic as possible, with their behavior and appearance customized through props.
- All components must adhere to the unified responsive design principles and be fully accessible.
